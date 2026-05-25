from django.contrib import admin
from .models import Order, OrderItem, OrderStatusHistory


class OrderItemInline(admin.TabularInline):
    model         = OrderItem
    extra         = 0
    readonly_fields = ['id', 'product', 'product_name', 'product_price', 'quantity', 'subtotal']
    can_delete    = False

    def subtotal(self, obj):
        return f'{obj.subtotal:,.0f} {obj.order.currency}'
    subtotal.short_description = 'Sous-total'


class OrderStatusHistoryInline(admin.TabularInline):
    model           = OrderStatusHistory
    extra           = 0
    readonly_fields = ['old_status', 'new_status', 'changed_by', 'note', 'changed_at']
    can_delete      = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display   = ['reference', 'seller', 'client_name', 'client_phone', 'status', 'source', 'total_amount', 'currency', 'created_at']
    list_filter    = ['status', 'source', 'currency']
    search_fields  = ['reference', 'client_name', 'client_phone', 'seller__email']
    raw_id_fields  = ['seller']
    readonly_fields = ['id', 'reference', 'total_amount', 'created_at', 'confirmed_at', 'delivered_at', 'cancelled_at']
    date_hierarchy  = 'created_at'
    inlines         = [OrderItemInline, OrderStatusHistoryInline]

    fieldsets = [
        ('Commande', {
            'fields': ('id', 'reference', 'seller', 'status', 'source'),
        }),
        ('Client', {
            'fields': ('client_name', 'client_phone', 'client_whatsapp',
                       'client_address', 'client_latitude', 'client_longitude'),
        }),
        ('Montants', {
            'fields': ('total_amount', 'currency'),
        }),
        ('Notes', {
            'fields': ('client_note', 'seller_note'),
        }),
        ('Dates', {
            'fields': ('created_at', 'confirmed_at', 'delivered_at', 'cancelled_at'),
            'classes': ('collapse',),
        }),
    ]

    actions = ['mark_confirmed', 'mark_cancelled']

    @admin.action(description='Marquer comme confirmées')
    def mark_confirmed(self, request, queryset):
        from django.utils import timezone
        queryset.filter(status='pending').update(status='confirmed', confirmed_at=timezone.now())

    @admin.action(description='Marquer comme annulées')
    def mark_cancelled(self, request, queryset):
        from django.utils import timezone
        queryset.exclude(status__in=['delivered', 'cancelled']).update(
            status='cancelled', cancelled_at=timezone.now()
        )


@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display  = ['order', 'old_status', 'new_status', 'changed_by', 'changed_at']
    list_filter   = ['new_status']
    search_fields = ['order__reference']
    readonly_fields = ['id', 'order', 'old_status', 'new_status', 'changed_by', 'note', 'changed_at']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
