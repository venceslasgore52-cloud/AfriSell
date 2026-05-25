from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display  = ['name', 'tenant', 'category', 'display_category', 'price', 'promo_price', 'quantity', 'statut']
    list_filter   = ['statut', 'category', 'published_whatsapp', 'published_facebook', 'published_instagram', 'published_tiktok']
    search_fields = ['name', 'description', 'custom_category', 'tenant__email']
    raw_id_fields = ['tenant']
    readonly_fields = ['id', 'effective_price', 'in_stock', 'display_category', 'created_at', 'updated_at']
    date_hierarchy  = 'created_at'

    fieldsets = [
        ('Informations', {
            'fields': ('id', 'tenant', 'name', 'description', 'image'),
        }),
        ('Prix & Stock', {
            'fields': ('price', 'promo_price', 'effective_price', 'quantity', 'in_stock', 'statut'),
        }),
        ('Catégorie', {
            'fields': ('category', 'custom_category', 'display_category'),
        }),
        ('Publication', {
            'fields': ('published_whatsapp', 'published_facebook', 'published_instagram', 'published_tiktok'),
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    ]
