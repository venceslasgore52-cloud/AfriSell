from rest_framework import serializers
from .models import Plan, Subscription, Payment, Invoice


class PlanSerializer(serializers.ModelSerializer):
    # je retourne les deux prix — le front choisit lequel afficher selon le pays
    price_for_user = serializers.SerializerMethodField()

    class Meta:
        model  = Plan
        fields = [
            'id', 'name', 'slug', 'interval',
            'price_africa', 'price_global', 'currency', 'price_for_user',

            # Limites IA & catalogue
            'max_flyers_ai', 'max_video_ai', 'max_text_ai', 'max_ai_requests',
            'max_products', 'max_orders',

            # SIRA Bot
            'has_sira_bot', 'sira_auto_reply', 'sira_order_capture', 'sira_location_fetch',

            # Studio IA
            'has_studio', 'has_bg_removal', 'has_auto_publish', 'has_smart_schedule',

            # Analytics
            'has_analytics', 'has_market_analysis',

            # Notifs
            'has_whatsapp_notif',

            'is_popular', 'is_active',
        ]

    def get_price_for_user(self, obj):
        # j'essaie de récupérer le pays depuis le contexte de la request
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            shop = getattr(request.user, 'shop', None)
            if shop:
                return str(obj.get_price_for_country(shop.country))
        return str(obj.price_global)


class SubscriptionSerializer(serializers.ModelSerializer):
    plan      = PlanSerializer(read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    # j'expose les méthodes du modèle directement — plus pratique pour le front
    can_use_sira    = serializers.SerializerMethodField()
    can_use_studio  = serializers.SerializerMethodField()
    can_publish_auto = serializers.SerializerMethodField()

    class Meta:
        model  = Subscription
        fields = [
            'id', 'plan', 'status', 'is_active', 'provider',
            'trial_end', 'start_date', 'end_date', 'auto_renew',
            'can_use_sira', 'can_use_studio', 'can_publish_auto',
            'created_at',
        ]
        read_only_fields = fields

    def get_can_use_sira(self, obj):
        return obj.can_use_sira()

    def get_can_use_studio(self, obj):
        return obj.can_use_studio()

    def get_can_publish_auto(self, obj):
        return obj.can_publish_auto()


class PaymentSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)

    class Meta:
        model  = Payment
        fields = [
            'id', 'plan_name', 'amount', 'currency', 'status',
            'provider', 'provider_tx_id', 'failure_reason', 'created_at',
        ]
        read_only_fields = fields


class InvoiceSerializer(serializers.ModelSerializer):
    payment = PaymentSerializer(read_only=True)

    class Meta:
        model  = Invoice
        fields = ['id', 'number', 'pdf', 'issued_at', 'payment']
        read_only_fields = fields


class CheckoutRequestSerializer(serializers.Serializer):
    plan_slug = serializers.ChoiceField(choices=['starter', 'pro', 'business'])
    provider  = serializers.ChoiceField(
        choices=['stripe', 'carte_bancaire', 'google_pay', 'cinetpay', 'paystack'],
        required=False,
    )


class SubscriptionCancelSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, max_length=500)
