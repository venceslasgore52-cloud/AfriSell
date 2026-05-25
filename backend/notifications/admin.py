from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display   = ['title', 'recipient', 'notif_type', 'level', 'is_read', 'created_at']
    list_filter    = ['level', 'notif_type', 'is_read']
    search_fields  = ['title', 'message', 'recipient__email']
    raw_id_fields  = ['recipient']
    readonly_fields = ['id', 'read_at', 'created_at']
    date_hierarchy  = 'created_at'

    # je ne veux pas qu'on crée des notifs manuellement depuis l'admin
    # elles sont générées programmatiquement via utils.notify()
    def has_add_permission(self, request):
        return False

    actions = ['mark_as_read', 'mark_as_unread']

    @admin.action(description='Marquer comme lues')
    def mark_as_read(self, request, queryset):
        from django.utils import timezone
        queryset.update(is_read=True, read_at=timezone.now())

    @admin.action(description='Marquer comme non lues')
    def mark_as_unread(self, request, queryset):
        queryset.update(is_read=False, read_at=None)
