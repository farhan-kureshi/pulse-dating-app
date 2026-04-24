import json
import base64 # 👈 NAYA: Base64 image ko decode karne ke liye
from urllib.parse import parse_qs
from django.db.models import Q
from django.core.files.base import ContentFile # 👈 NAYA: Django me file save karne ke liye
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Message, Match, UserProfile

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.other_user_id = int(self.scope['url_route']['kwargs']['match_id'])
        query_string = self.scope['query_string'].decode()
        query_params = parse_qs(query_string)
        self.current_user_id = int(query_params.get('user_id', [0])[0])

        user_ids = sorted([self.current_user_id, self.other_user_id])
        self.room_group_name = f'chat_{user_ids[0]}_{user_ids[1]}'

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'user_status_event',
            'user_id': self.current_user_id,
            'status': 'online'
        })

        await self.mark_messages_read(self.other_user_id, self.current_user_id)
        await self.channel_layer.group_send(self.room_group_name, {'type': 'messages_read_event'})

    async def disconnect(self, close_code):
        await self.channel_layer.group_send(self.room_group_name, {
            'type': 'user_status_event',
            'user_id': self.current_user_id,
            'status': 'offline'
        })
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        event_type = text_data_json.get('type')

        if event_type in ['webrtc_offer', 'webrtc_answer', 'ice_candidate', 'webrtc_end_call']:
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'webrtc_signal',
                'sender_id': text_data_json['sender_id'],
                'event_type': event_type,
                'data': text_data_json.get('data'),
                'call_type': text_data_json.get('call_type', 'video') 
            })
            return

        if event_type == 'mark_read':
            await self.mark_messages_read(self.other_user_id, self.current_user_id)
            await self.channel_layer.group_send(self.room_group_name, {'type': 'messages_read_event'})
            return
            
        if event_type == 'typing':
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'typing_event',
                'sender_id': text_data_json['sender_id'],
                'is_typing': text_data_json['is_typing']
            })
            return

        if event_type == 'user_status':
            await self.channel_layer.group_send(self.room_group_name, {
                'type': 'user_status_event',
                'user_id': text_data_json['sender_id'],
                'status': text_data_json['status'],
                'is_echo': text_data_json.get('is_echo', False)
            })
            return
# 👇 NAYA: Delete Message Logic (Crash-Proof)
        if event_type == 'delete_message':
            msg_id = text_data_json.get('message_id')
            if msg_id:
                await self.delete_message_db(msg_id)
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'message_deleted_event',
                    'message_id': msg_id
                })
            return

        # 👇 NAYA: React Message Logic (Crash-Proof)
        if event_type == 'react_message':
            msg_id = text_data_json.get('message_id')
            reaction = text_data_json.get('reaction')
            if msg_id and reaction:
                await self.react_message_db(msg_id, reaction)
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'message_reaction_event',
                    'message_id': msg_id,
                    'reaction': reaction
                })
            return
        
        # 👇 NAYA: Clear Chat Logic (Database se sab udane ke liye)
        if event_type == 'clear_chat':
            sender_id = text_data_json.get('sender_id')
            receiver_id = text_data_json.get('receiver_id')
            if sender_id and receiver_id:
                await self.clear_chat_db(sender_id, receiver_id)
            return
        # ==========================================
        # NORMAL MESSAGE & IMAGE HANDLING LOGIC
        # ==========================================
        message_content = text_data_json.get('message', '')
        sender_id = text_data_json['sender_id']
        image_data = text_data_json.get('image_data') # 👈 NAYA: Frontend se image data pakda
        file_name = text_data_json.get('file_name')   # 👈 NAYA: Frontend se file name pakda

        # Message aur Image dono DB mein save karne bhejo
        new_msg = await self.save_message(sender_id, self.other_user_id, message_content, image_data, file_name)

        if new_msg:
            # Agar image save hui hai, toh uska URL nikal lo taaki frontend ko bhej sakein
            image_url = new_msg.image.url if new_msg.image else None

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message_content,
                    'sender_id': sender_id,
                    'timestamp': new_msg.timestamp.isoformat(),
                    'is_read': False,
                    'image_url': image_url # 👈 NAYA: Image URL add kiya broadcast me
                }
            )

    # --- Senders ---
    
    async def webrtc_signal(self, event):
        await self.send(text_data=json.dumps({
            'type': event['event_type'],
            'sender_id': event['sender_id'],
            'data': event['data'],
            'call_type': event.get('call_type', 'video') 
        }))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'content': event['message'],
            'sender': event['sender_id'],
            'timestamp': event['timestamp'],
            'is_read': event['is_read'],
            'image_url': event.get('image_url') # 👈 NAYA: Frontend ko image URL bhej rahe hain
        }))

    async def messages_read_event(self, event):
        await self.send(text_data=json.dumps({'type': 'messages_read_event'}))

    async def typing_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'sender_id': event['sender_id'],
            'is_typing': event['is_typing']
        }))

    async def user_status_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user_status',
            'user_id': event['user_id'],
            'status': event['status'],
            'is_echo': event.get('is_echo', False)
        }))

    # --- DB Methods ---
    @database_sync_to_async
    def save_message(self, sender_id, other_user_id, content, image_data=None, file_name=None):
        try:
            match = Match.objects.get(
                (Q(user1_id=sender_id) & Q(user2_id=other_user_id)) |
                (Q(user1_id=other_user_id) & Q(user2_id=sender_id))
            )
            sender = UserProfile.objects.get(id=sender_id)
            
            # Pehle message object create karo
            msg = Message(match=match, sender=sender, content=content)

            # 👇 NAYA: Agar frontend se image aayi hai, toh usko decode karke save karo
            if image_data:
                # Base64 string hamesha "data:image/png;base64,iVBORw0KGgo..." aisi hoti hai
                # Hum usko split karke sirf asali code nikalenge
                if ';base64,' in image_data:
                    format, imgstr = image_data.split(';base64,') 
                else:
                    imgstr = image_data
                
                # Decode karke Django ki ContentFile banayi
                data = ContentFile(base64.b64decode(imgstr), name=file_name or 'chat_image.jpg')
                
                # Model me 'image' field me save kar diya (save=False kyuki niche .save() chal raha he)
                msg.image.save(data.name, data, save=False)

            msg.save()
            return msg
            
        except Match.DoesNotExist:
            return None

    @database_sync_to_async
    def mark_messages_read(self, sender_id, receiver_id):
        try:
            match = Match.objects.get(
                (Q(user1_id=sender_id) & Q(user2_id=receiver_id)) |
                (Q(user1_id=receiver_id) & Q(user2_id=sender_id))
            )
            Message.objects.filter(match=match, sender_id=sender_id, is_read=False).update(is_read=True)
        except Match.DoesNotExist:
            pass
        
        # 👇 YAHAN SE NAYA CODE PASTE KAREIN 👇

    async def message_deleted_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message_deleted',
            'message_id': event['message_id']
        }))

    async def message_reaction_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message_reaction',
            'message_id': event['message_id'],
            'reaction': event['reaction']
        }))

    @database_sync_to_async
    def delete_message_db(self, message_id):
        try:
            msg = Message.objects.get(id=message_id)
            msg.is_deleted = True
            msg.save()
        except Message.DoesNotExist:
            pass

    @database_sync_to_async
    def react_message_db(self, message_id, reaction):
        try:
            msg = Message.objects.get(id=message_id)
            msg.reaction = reaction
            msg.save()
        except Message.DoesNotExist:
            pass
    @database_sync_to_async
    def clear_chat_db(self, user1_id, user2_id):
        try:
            match = Match.objects.get(
                (Q(user1_id=user1_id) & Q(user2_id=user2_id)) |
                (Q(user1_id=user2_id) & Q(user2_id=user1_id))
            )
            messages = Message.objects.filter(match=match)
            for msg in messages:
                # Agar kisi ne hide nahi kiya tha, toh ab main hide kar raha hu
                if msg.hidden_by_user is None:
                    msg.hidden_by_user = int(user1_id)
                    msg.save()
                # Agar samne wale ne pehle hi hide kar diya tha, aur ab main bhi kar raha hu, 
                # Toh iska matlab dono ne clear kar diya, ab database se completely delete kar do!
                elif msg.hidden_by_user != int(user1_id):
                    msg.delete()
        except Match.DoesNotExist:
            pass