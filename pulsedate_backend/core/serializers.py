from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    # Sender ka naam dikhane ke liye extra field
    sender_name = serializers.CharField(source='sender.first_name', read_only=True)

    class Meta:
        model = Message
        # DONO LINES KO MERGE KAR DIYA HAI (image bhi aa gayi aur purane fields bhi safe hain)
        fields = ['id', 'match', 'sender', 'sender_name', 'content', 'image', 'timestamp', 'is_read', 'is_deleted', 'reaction']