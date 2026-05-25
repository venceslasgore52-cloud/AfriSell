from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User, UserProfile, Shop, ShopUpdate, SocialConnection, EmailVerificationToken, PasswordResetToken


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ['email', 'username', 'role', 'phone', 'is_active', 'created_at']
    list_filter   = ['role', 'is_active', 'social_provider']
    search_fields = ['email', 'username', 'phone']
    ordering      = ['-created_at']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('AfriSell', {'fields': ('role', 'phone', 'longitude', 'latitude', 'social_provider', 'social_id')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('AfriSell', {'fields': ('email', 'role', 'phone')}),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display  = ['user', 'language', 'notifications', 'updated_at']
    search_fields = ['user__email']
    raw_id_fields = ['user']


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display  = ['name', 'user', 'category', 'country', 'is_active', 'is_verified', 'created_at']
    list_filter   = ['is_active', 'is_verified', 'category', 'country']
    search_fields = ['name', 'user__email']
    raw_id_fields = ['user']
    readonly_fields = ['id', 'created_at', 'updated_at']

    actions = ['verify_shops', 'deactivate_shops']

    @admin.action(description='Vérifier les boutiques sélectionnées')
    def verify_shops(self, request, queryset):
        queryset.update(is_verified=True)

    @admin.action(description='Désactiver les boutiques sélectionnées')
    def deactivate_shops(self, request, queryset):
        queryset.update(is_active=False)


@admin.register(ShopUpdate)
class ShopUpdateAdmin(admin.ModelAdmin):
    list_display  = ['shop', 'update_type', 'is_active', 'expires_at', 'created_at']
    list_filter   = ['update_type', 'is_active']
    search_fields = ['shop__name', 'message']
    raw_id_fields = ['shop']


@admin.register(SocialConnection)
class SocialConnectionAdmin(admin.ModelAdmin):
    list_display  = ['tenant', 'platform', 'account_name', 'is_active', 'connected_at']
    list_filter   = ['platform', 'is_active']
    search_fields = ['tenant__email', 'account_name', 'account_id']
    raw_id_fields = ['tenant']
    readonly_fields = ['id', 'connected_at', 'updated_at', 'access_token', 'refresh_token']


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display  = ['user', 'is_used', 'created_at', 'expires_at']
    list_filter   = ['is_used']
    search_fields = ['user__email']
    raw_id_fields = ['user']


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display  = ['user', 'is_used', 'created_at', 'expires_at']
    list_filter   = ['is_used']
    search_fields = ['user__email']
    raw_id_fields = ['user']
