import json
import base64
import uuid
import logging
from django.core.files.base import ContentFile
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone

# BHAEE KE LIYE NOTE: Apne apps aur models ka exact path yahan theek se daal lena
# Example: from chat.models import Message, Match
from .models import Message, Match 

# Logger setup for debugging
logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    
    # =========================================================================
    # 1. CONNECTION LOGIC (Connect & Disconnect)
    # =========================================================================
    async def connect(self):
        try:
            # URL Routing se Match ID nikalna
            self.match_id = self.scope['url_route']['kwargs']['match_id']
            # Query parameters se User ID nikalna (?user_id=1)
            query_string = self.scope['query_string'].decode()
            self.current_user_id = dict(qc.split("=") for qc in query_string.split("&")).get("user_id", None)
            
            self.room_group_name = f'chat_{self.match_id}'

            # Group me join karna
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()
            logger.info(f"User {self.current_user_id} connected to Room {self.room_group_name}")

            # Jaise hi user connect ho, dusre ko batao ki ye ONLINE aa gaya hai
            await self.channel_layer.group_send(
                self.room_group_name, {
                    'type': 'user_status_event',
                    'user_id': self.current_user_id,
                    'status': 'online',
                    'is_echo': False
                }
            )
        except Exception as e:
            logger.error(f"Connection Error: {e}")
            await self.close()

    async def disconnect(self, close_code):
        # User ja raha hai, group ko batao ki OFFLINE ho gaya
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_send(
                self.room_group_name, {
                    'type': 'user_status_event',
                    'user_id': self.current_user_id,
                    'status': 'offline',
                    'is_echo': False
                }
            )
            # Group se bahar nikalo
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            logger.info(f"User {self.current_user_id} disconnected from {self.room_group_name}")

    # =========================================================================
    # 2. DATABASE OPERATIONS (Must be async using @database_sync_to_async)
    # =========================================================================
    
    @database_sync_to_async
    def save_chat_message(self, sender_id, message_text, image_data, file_name):
        """
        Main logic for saving Text AND Base64 Images to MySQL
        """
        try:
            # Pehle message text aur IDs save karo
            message = Message.objects.create(
                match_id=self.match_id,
                sender_id=sender_id,
                content=message_text,
                timestamp=timezone.now()
            )

            # Agar React frontend ne Base64 image data bheja hai
            if image_data:
                # 'data:image/png;base64,iVBORw0KGgo...' format ko split karna
                if ';base64,' in image_data:
                    format_part, img_str = image_data.split(';base64,') 
                    ext = format_part.split('/')[-1] 
                else:
                    img_str = image_data
                    ext = 'png' # Default extension
                
                # Image name ko unique banane ke liye UUID lagaya taaki overwrite na ho
                unique_file_name = f"chat_{message.id}_{uuid.uuid4().hex[:8]}.{ext}"
                
                # Base64 string ko wapas proper Image File mein convert karna
                decoded_image = ContentFile(base64.b64decode(img_str), name=unique_file_name)
                
                # Image ko model field mein save karna
                message.image.save(unique_file_name, decoded_image, save=True)
                logger.info(f"Image successfully saved for message {message.id}")

            return message
        except Exception as e:
            logger.error(f"Error saving message to DB: {e}")
            return None

    @database_sync_to_async
    def mark_messages_as_read_in_db(self, sender_id):
        """Jo messages user ne nahi padhe hain, unhe 'Read' (Blue tick) mark karo"""
        Message.objects.filter(
            match_id=self.match_id, 
            is_read=False
        ).exclude(sender_id=sender_id).update(is_read=True)

    @database_sync_to_async
    def delete_message_in_db(self, message_id):
        """Soft delete logic for messages"""
        Message.objects.filter(id=message_id).update(is_deleted=True)

    @database_sync_to_async
    def react_to_message_in_db(self, message_id, reaction):
        """Saves emojis (❤️, 😂, etc.) to a specific message"""
        Message.objects.filter(id=message_id).update(reaction=reaction)

    @database_sync_to_async
    def clear_chat_in_db(self, user_id):
        """Deletes all messages for a specific match"""
        Message.objects.filter(match_id=self.match_id).delete()

    # =========================================================================
    # 3. RECEIVING DATA FROM REACT FRONTEND
    # =========================================================================
    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            event_type = text_data_json.get('type')

            # --- WEBRTC SIGNALING (Video & Audio Calls) ---
            if event_type in ['webrtc_offer', 'webrtc_answer', 'ice_candidate', 'webrtc_end_call']:
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'webrtc_signal_event',
                    'sender_id': text_data_json.get('sender_id'),
                    'event_type': event_type,
                    'data': text_data_json.get('data'),
                    'call_type': text_data_json.get('call_type', 'video') 
                })
                return

            # --- MARK READ (Blue Ticks) ---
            if event_type == 'mark_read':
                await self.mark_messages_as_read_in_db(self.current_user_id)
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'messages_read_event'
                })
                return
                
            # --- TYPING INDICATOR ---
            if event_type == 'typing':
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'typing_event',
                    'sender_id': text_data_json.get('sender_id'),
                    'is_typing': text_data_json.get('is_typing', False)
                })
                return

            # --- ONLINE / OFFLINE ECHO ---
            if event_type == 'user_status':
                await self.channel_layer.group_send(self.room_group_name, {
                    'type': 'user_status_event',
                    'user_id': text_data_json.get('sender_id'),
                    'status': text_data_json.get('status'),
                    'is_echo': text_data_json.get('is_echo', False)
                })
                return

            # --- DELETE MESSAGE ---
            if event_type == 'delete_message':
                msg_id = text_data_json.get('message_id')
                if msg_id:
                    await self.delete_message_in_db(msg_id)
                    await self.channel_layer.group_send(self.room_group_name, {
                        'type': 'delete_message_event',
                        'message_id': msg_id
                    })
                return

            # --- REACTION TO MESSAGE ---
            if event_type == 'react_message':
                msg_id = text_data_json.get('message_id')
                reaction = text_data_json.get('reaction')
                if msg_id and reaction:
                    await self.react_to_message_in_db(msg_id, reaction)
                    await self.channel_layer.group_send(self.room_group_name, {
                        'type': 'reaction_message_event',
                        'message_id': msg_id,
                        'reaction': reaction
                    })
                return
            
            # --- CLEAR CHAT ---
            if event_type == 'clear_chat':
                sender_id = text_data_json.get('sender_id')
                await self.clear_chat_in_db(sender_id)
                # Front end ko reload karne ka signal bhej sakte ho agar chahiye toh
                return

            # --- CORE FEATURE: SENDING NORMAL CHAT MESSAGE (Text / Image) ---
            # Agar 'type' mention nahi hai, matlab user ne message ya photo bheji hai
            if not event_type: 
                message_text = text_data_json.get('message', '')
                image_data = text_data_json.get('image_data', None)
                sender_id = text_data_json.get('sender_id')
                file_name = text_data_json.get('file_name', 'chat_img.png')

                # Don't save empty messages
                if not message_text.strip() and not image_data:
                    return

                # Save everything safely to the Database
                saved_message = await self.save_chat_message(sender_id, message_text, image_data, file_name)

                if saved_message:
                    # Database URL path fetch karo (Media roots setup hone chahiye)
                    image_url = saved_message.image.url if saved_message.image else None

                    # Group me sabko (Sender aur Receiver dono ko) broadcast kar do
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'broadcast_new_message',
                            'id': saved_message.id,
                            'message': saved_message.content,
                            'sender': saved_message.sender_id,
                            'image': image_url,
                            'timestamp': str(saved_message.timestamp),
                            'is_deleted': saved_message.is_deleted,
                            'reaction': saved_message.reaction,
                        }
                    )

        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
        except Exception as e:
            logger.error(f"Error in receive: {e}")

# =========================================================================
    # 4. BROADCAST HANDLERS (Sends data back to React UI via WebSockets)
    # =========================================================================
    
    async def broadcast_new_message(self, event):
        """Sends the freshly saved text/image message to React"""
        await self.send(text_data=json.dumps({
            'type': 'chat_message', # React code is expecting this type
            'id': event['id'],
            'content': event['message'], # 👈 ASLI FIX YAHAN HAI: 'message' ko 'content' bana diya
            'sender': event['sender'],
            'image': event['image'],
            'timestamp': event['timestamp'],
            'is_deleted': event.get('is_deleted', False),
            'reaction': event.get('reaction', None),
        }))

    async def webrtc_signal_event(self, event):
        """Passes WebRTC streams for Video/Audio calling"""
        await self.send(text_data=json.dumps({
            'type': event['event_type'],
            'sender_id': event['sender_id'],
            'data': event['data'],
            'call_type': event['call_type']
        }))

    async def messages_read_event(self, event):
        """Triggers the blue double ticks on frontend"""
        await self.send(text_data=json.dumps({
            'type': 'messages_read_event'
        }))

    async def typing_event(self, event):
        """Shows 'Typing...' animation"""
        await self.send(text_data=json.dumps({
            'type': 'typing', 
            'sender_id': event['sender_id'], 
            'is_typing': event['is_typing']
        }))

    async def user_status_event(self, event):
        """Updates Online/Offline tags"""
        await self.send(text_data=json.dumps({
            'type': 'user_status', 
            'user_id': event['user_id'], 
            'status': event['status'], 
            'is_echo': event['is_echo']
        }))

    async def delete_message_event(self, event):
        """Updates the UI to show 'This message was deleted'"""
        await self.send(text_data=json.dumps({
            'type': 'message_deleted', 
            'message_id': event['message_id']
        }))

    async def reaction_message_event(self, event):
        """Attaches an emoji to a chat bubble"""
        await self.send(text_data=json.dumps({
            'type': 'message_reaction', 
            'message_id': event['message_id'], 
            'reaction': event['reaction']
        }))