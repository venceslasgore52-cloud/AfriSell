from django.contrib import admin
from .models import Plan, Subscription, Payment, Invoice, WebhookLog


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display  = ['name', 'slug', 'price_africa', 'price_global', 'currency', 'interval', 'is_popular', 'is_active']
    list_filter   = ['slug', 'interval', 'is_active', 'is_popular',
                     'has_sira_bot', 'has_studio', 'has_analytics']
    search_fields = ['name', 'slug']
    readonly_fields = ['id', 'created_at']

    fieldsets = [
        ('Général', {
            'fields': ('id', 'name', 'slug', 'interval', 'is_active', 'is_popular', 'created_at'),
        }),
        ('Prix', {
            'fields': ('price_africa', 'price_global', 'currency'),
            'description': 'Afrique = 5$/20$/30$ — Global = 10$/20$/30$',
        }),
        ('Limites IA & Catalogue', {
            'fields': ('max_flyers_ai', 'max_video_ai', 'max_text_ai', 'max_ai_requests',
                       'max_products', 'max_orders'),
        }),
        ('SIRA Bot', {
            'fields': ('has_sira_bot', 'sira_auto_reply', 'sira_order_capture', 'sira_location_fetch'),
        }),
        ('Studio IA', {
            'fields': ('has_studio', 'has_bg_removal', 'has_auto_publish', 'has_smart_schedule'),
        }),
        ('Analytics', {
            'fields': ('has_analytics', 'has_market_analysis'),
        }),
        ('Notifications', {
            'fields': ('has_whatsapp_notif',),
        }),
        ('IDs Providers', {
            'fields': ('stripe_price_id', 'stripe_product_id', 'cinetpay_plan_id', 'geniuspay_plan_id'),
            'classes': ('collapse',),
        }),
    ]


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display  = ['user', 'plan', 'status', 'provider', 'start_date', 'end_date', 'auto_renew']
    list_filter   = ['status', 'provider', 'plan', 'auto_renew']
    search_fields = ['user__email', 'stripe_customer_id', 'stripe_subscription_id']
    raw_id_fields = ['user', 'plan']
    readonly_fields = ['id', 'created_at', 'updated_at']

    actions = ['activate_subscriptions', 'cancel_subscriptions']

    @admin.action(description='Activer les abonnements sélectionnés (admin manuel)')
    def activate_subscriptions(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='active', start_date=timezone.now(), provider='manual')

    @admin.action(description='Annuler les abonnements sélectionnés')
    def cancel_subscriptions(self, request, queryset):
        queryset.update(status='cancelled', auto_renew=False)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display   = ['user', 'plan', 'amount', 'currency', 'status', 'provider', 'created_at']
    list_filter    = ['status', 'provider', 'currency', 'plan']
    search_fields  = ['user__email', 'provider_tx_id', 'provider_checkout_id']
    raw_id_fields  = ['user', 'plan', 'subscription']
    readonly_fields = ['id', 'created_at', 'updated_at', 'provider_response']
    date_hierarchy  = 'created_at'


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display  = ['number', 'payment', 'issued_at']
    search_fields = ['number', 'payment__user__email']
    raw_id_fields = ['payment']
    readonly_fields = ['id', 'issued_at']


@admin.register(WebhookLog)
class WebhookLogAdmin(admin.ModelAdmin):
    list_display  = ['provider', 'event_type', 'processed', 'error', 'received_at']
    list_filter   = ['provider', 'processed']
    search_fields = ['event_type', 'error']
    readonly_fields = ['id', 'provider', 'event_type', 'payload', 'headers', 'error', 'received_at']
    date_hierarchy  = 'received_at'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
