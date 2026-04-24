from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    # Sender ka naam dikhane ke liye extra field
    sender_name = serializers.CharField(source='sender.first_name', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'match', 'sender', 'sender_name', 'content', 'timestamp', 'is_read', 'image', 'is_deleted', 'reaction']