from django.contrib import admin
from django.utils.html import format_html

from .models import StudioAsset, PublicationPost, SmartScheduleSuggestion


@admin.register(StudioAsset)
class StudioAssetAdmin(admin.ModelAdmin):
    list_display  = ('seller', 'type', 'status_badge', 'product', 'ai_model_used', 'created_at')
    list_filter   = ('type', 'status', 'ai_model_used')
    search_fields = ('seller__email', 'product__name')
    ordering      = ('-created_at',)
    readonly_fields = (
        'id', 'seller', 'type', 'status', 'product',
        'generated_file', 'generated_url', 'generated_text',
        'ai_model_used', 'error_message', 'created_at', 'updated_at',
    )

    def status_badge(self, obj):
        colors = {
            'pending':    '#F59E0B',
            'processing': '#3B82F6',
            'done':       '#10B981',
            'failed':     '#EF4444',
        }
        color = colors.get(obj.status, '#6B7280')
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:4px">{}</span>',
            color, obj.get_status_display(),
        )
    status_badge.short_description = 'Statut'

    def has_add_permission(self, request):
        return False


@admin.register(PublicationPost)
class PublicationPostAdmin(admin.ModelAdmin):
    list_display  = ('seller', 'platform', 'status', 'scheduled_at', 'published_at', 'created_at')
    list_filter   = ('platform', 'status')
    search_fields = ('seller__email', 'caption')
    ordering      = ('-created_at',)
    readonly_fields = (
        'id', 'seller', 'platform', 'status', 'asset',
        'published_at', 'platform_post_id', 'platform_url',
        'error_message', 'created_at', 'updated_at',
    )


@admin.register(SmartScheduleSuggestion)
class SmartScheduleSuggestionAdmin(admin.ModelAdmin):
    list_display  = ('seller', 'platform', 'generated_at')
    list_filter   = ('platform',)
    search_fields = ('seller__email',)
    ordering      = ('-generated_at',)
    readonly_fields = ('id', 'seller', 'platform', 'suggested_slots', 'analysis', 'generated_at')

    def has_add_permission(self, request):
        return False
