from rest_framework import serializers
from .models import DailyStat, ProductView


class DailyStatSerializer(serializers.ModelSerializer):
    # taux de conversion calculé à la volée — vues → commandes livrées
    conversion_rate = serializers.SerializerMethodField()

    class Meta:
        model  = DailyStat
        fields = [
            'date',
            'total_orders', 'confirmed_orders', 'delivered_orders', 'cancelled_orders',
            'revenue', 'unique_customers', 'product_views',
            'conversion_rate',
        ]

    def get_conversion_rate(self, obj):
        # si pas de vues on évite la division par zéro
        if not obj.product_views:
            return 0.0
        return round((obj.delivered_orders / obj.product_views) * 100, 2)


class ProductViewSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model  = ProductView
        fields = ['id', 'product', 'product_name', 'source', 'viewed_at']
        read_only_fields = fields


# ── Serializers de réponse (pas liés à un modèle) ────────────────────────────

class DashboardSerializer(serializers.Serializer):
    """Vue d'ensemble pour le dashboard — données temps réel (pas de DailyStat)."""
    # aujourd'hui
    orders_today   = serializers.IntegerField()
    revenue_today  = serializers.DecimalField(max_digits=12, decimal_places=2)
    # ce mois
    orders_month   = serializers.IntegerField()
    revenue_month  = serializers.DecimalField(max_digits=12, decimal_places=2)
    # totaux
    total_orders   = serializers.IntegerField()
    total_revenue  = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_products = serializers.IntegerField()
    # en attente d'action
    pending_orders = serializers.IntegerField()
    currency       = serializers.CharField()


class TopProductSerializer(serializers.Serializer):
    """Produit le plus vendu — calculé depuis OrderItem."""
    product_id   = serializers.UUIDField()
    product_name = serializers.CharField()
    total_sold   = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)


class RevenueChartSerializer(serializers.Serializer):
    """Un point sur le graphique de revenus."""
    date    = serializers.DateField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    orders  = serializers.IntegerField()
