from django.contrib import admin
from django.utils.html import format_html

from .models import SiraConfig, SiraConversation, SiraMessage


@admin.register(SiraConfig)
class SiraConfigAdmin(admin.ModelAdmin):
    list_display  = ('shop', 'is_enabled', 'twilio_number', 'language', 'updated_at')
    list_filter   = ('is_enabled', 'language')
    search_fields = ('shop__name', 'twilio_number')
    readonly_fields = ('created_at', 'updated_at')


class SiraMessageInline(admin.TabularInline):
    model         = SiraMessage
    extra         = 0
    fields        = ('direction', 'message_type', 'body', 'intent', 'sent_at')
    readonly_fields = fields
    ordering      = ('sent_at',)
    can_delete    = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(SiraConversation)
class SiraConversationAdmin(admin.ModelAdmin):
    list_display  = ('client_phone', 'shop', 'state_badge', 'selected_product', 'quantity', 'order', 'last_message_at')
    list_filter   = ('state', 'shop')
    search_fields = ('client_phone', 'client_name', 'shop__name')
    ordering      = ('-last_message_at',)
    readonly_fields = (
        'id', 'shop', 'client_phone', 'client_name', 'state',
        'selected_product', 'quantity', 'client_latitude', 'client_longitude',
        'order', 'last_message_at', 'created_at',
    )
    inlines = [SiraMessageInline]

    def state_badge(self, obj):
        colors = {
            'idle':              '#6B7280',
            'browsing':          '#3B82F6',
            'selecting':         '#8B5CF6',
            'confirming':        '#F59E0B',
            'awaiting_location': '#EF4444',
            'completed':         '#10B981',
            'cancelled':         '#6B7280',
        }
        color = colors.get(obj.state, '#6B7280')
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:4px">{}</span>',
            color, obj.get_state_display(),
        )
    state_badge.short_description = 'État'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(SiraMessage)
class SiraMessageAdmin(admin.ModelAdmin):
    list_display  = ('conversation', 'direction', 'message_type', 'body_preview', 'intent', 'sent_at')
    list_filter   = ('direction', 'message_type', 'intent')
    search_fields = ('body', 'transcription', 'conversation__client_phone')
    ordering      = ('-sent_at',)
    readonly_fields = ('id', 'conversation', 'direction', 'message_type', 'body',
                       'media_url', 'transcription', 'intent', 'twilio_sid', 'sent_at')

    def body_preview(self, obj):
        return (obj.body or obj.transcription or obj.message_type)[:60]
    body_preview.short_description = 'Contenu'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
