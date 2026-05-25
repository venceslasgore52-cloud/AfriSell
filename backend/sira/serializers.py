from rest_framework import serializers
from .models import SiraConfig, SiraConversation, SiraMessage


class SiraConfigSerializer(serializers.ModelSerializer):
    """Config SIRA — le vendeur personnalise son bot depuis le dashboard."""

    # aliases pour le frontend
    is_active       = serializers.BooleanField(source='is_enabled', required=False)
    welcome_message = serializers.CharField(source='greeting_message', required=False)

    class Meta:
        model  = SiraConfig
        fields = [
            'is_enabled', 'is_active',
            'bot_name',
            'twilio_number', 'wa_provider',
            'greeting_message', 'welcome_message',
            'catalogue_intro',
            'order_confirmation_message',
            'out_of_hours_message',
            'language',
            'working_hours_start',
            'working_hours_end',
            'auto_confirm_orders',
            'updated_at',
        ]
        read_only_fields = ['twilio_number', 'wa_provider', 'updated_at']

    def validate_is_enabled(self, value):
        user = self.context['request'].user
        sub  = getattr(user, 'subscription', None)
        if value and not (sub and sub.is_active and sub.plan.has_sira_bot):
            raise serializers.ValidationError(
                'SIRA est disponible à partir du plan Pro.'
            )
        return value

    def validate_is_active(self, value):
        return self.validate_is_enabled(value)


class SiraMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SiraMessage
        fields = [
            'id', 'direction', 'message_type',
            'body', 'transcription', 'intent',
            'twilio_sid', 'sent_at',
        ]
        read_only_fields = fields


class SiraConversationSerializer(serializers.ModelSerializer):
    messages       = SiraMessageSerializer(many=True, read_only=True)
    client_display = serializers.SerializerMethodField()
    product_name   = serializers.CharField(
        source='selected_product.name', read_only=True, default=None
    )
    # alias pour le frontend qui utilise 'status'
    status = serializers.SerializerMethodField()

    class Meta:
        model  = SiraConversation
        fields = [
            'id', 'client_phone', 'client_name', 'client_display',
            'state', 'status', 'product_name', 'quantity',
            'client_latitude', 'client_longitude',
            'order', 'last_message_at', 'created_at',
            'messages',
        ]
        read_only_fields = fields

    def get_client_display(self, obj):
        return obj.client_name or _clean_phone(obj.client_phone)

    def get_status(self, obj):
        mapping = {
            'idle':              'pending',
            'browsing':          'active',
            'selecting':         'active',
            'confirming':        'active',
            'awaiting_location': 'active',
            'completed':         'closed',
            'cancelled':         'closed',
        }
        return mapping.get(obj.state, 'active')


class SiraConversationListSerializer(serializers.ModelSerializer):
    """Version légère pour la liste — sans les messages."""
    last_message   = serializers.SerializerMethodField()
    client_display = serializers.SerializerMethodField()
    status         = serializers.SerializerMethodField()

    class Meta:
        model  = SiraConversation
        fields = [
            'id', 'client_phone', 'client_display', 'state', 'status',
            'last_message_at', 'last_message', 'order',
        ]
        read_only_fields = fields

    def get_last_message(self, obj):
        msg = obj.messages.filter(direction='inbound').last()
        return msg.body[:80] if msg else ''

    def get_client_display(self, obj):
        return obj.client_name or _clean_phone(obj.client_phone)

    def get_status(self, obj):
        mapping = {
            'idle':              'pending',
            'browsing':          'active',
            'selecting':         'active',
            'confirming':        'active',
            'awaiting_location': 'active',
            'completed':         'closed',
            'cancelled':         'closed',
        }
        return mapping.get(obj.state, 'active')


def _clean_phone(number: str) -> str:
    return number.replace('whatsapp:', '')
