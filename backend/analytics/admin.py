from django.contrib import admin
from .models import DailyStat, ProductView


@admin.register(DailyStat)
class DailyStatAdmin(admin.ModelAdmin):
    list_display  = ('shop', 'date', 'total_orders', 'delivered_orders', 'revenue', 'product_views', 'computed_at')
    list_filter   = ('date',)
    search_fields = ('shop__name',)
    ordering      = ('-date',)
    readonly_fields = ('computed_at',)

    # je désactive l'ajout manuel — ces lignes sont générées par Celery
    def has_add_permission(self, request):
        return False


@admin.register(ProductView)
class ProductViewAdmin(admin.ModelAdmin):
    list_display  = ('product', 'shop', 'source', 'viewed_at')
    list_filter   = ('source', 'viewed_at')
    search_fields = ('product__name', 'shop__name')
    ordering      = ('-viewed_at',)
    readonly_fields = ('id', 'viewed_at')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
