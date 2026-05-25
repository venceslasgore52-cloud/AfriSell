from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusHistory


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model  = OrderItem
        fields = ['id', 'product', 'product_name', 'product_price', 'quantity', 'subtotal']
        read_only_fields = ['id', 'product_name', 'product_price', 'subtotal']

    def validate(self, attrs):
        product = attrs.get('product')
        if product:
            # je snapshote le nom et le prix effectif au moment de la commande
            attrs['product_name']  = product.name
            attrs['product_price'] = product.effective_price
        return attrs


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.CharField(source='changed_by.email', read_only=True)

    class Meta:
        model  = OrderStatusHistory
        fields = ['id', 'old_status', 'new_status', 'changed_by_email', 'note', 'changed_at']
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    items          = OrderItemSerializer(many=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    total_amount   = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model  = Order
        fields = [
            'id', 'reference', 'status', 'source',
            'client_name', 'client_phone', 'client_whatsapp',
            'client_latitude', 'client_longitude', 'client_address',
            'total_amount', 'currency',
            'client_note', 'seller_note',
            'items', 'status_history',
            'created_at', 'confirmed_at', 'delivered_at', 'cancelled_at',
        ]
        read_only_fields = [
            'id', 'reference', 'total_amount',
            'created_at', 'confirmed_at', 'delivered_at', 'cancelled_at',
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order      = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        order.compute_total()
        return order

    def update(self, instance, validated_data):
        # je ne permets pas de modifier les items après création — seulement les infos client/notes
        validated_data.pop('items', None)
        return super().update(instance, validated_data)


class OrderListSerializer(serializers.ModelSerializer):
    """Serializer allégé pour les listes — sans items ni historique."""
    items_count = serializers.IntegerField(source='items.count', read_only=True)

    class Meta:
        model  = Order
        fields = [
            'id', 'reference', 'status', 'source',
            'client_name', 'client_phone',
            'total_amount', 'currency',
            'items_count', 'created_at',
        ]


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
    note   = serializers.CharField(required=False, allow_blank=True, max_length=500)

    def validate_status(self, value):
        # je définis les transitions autorisées — on ne peut pas revenir en arrière
        TRANSITIONS = {
            'pending':    ['confirmed', 'cancelled'],
            'confirmed':  ['processing', 'cancelled'],
            'processing': ['delivering', 'cancelled'],
            'delivering': ['delivered', 'cancelled'],
            'delivered':  [],
            'cancelled':  [],
        }
        current = self.context['current_status']
        if value not in TRANSITIONS.get(current, []):
            allowed = TRANSITIONS.get(current, [])
            raise serializers.ValidationError(
                f'Transition invalide : {current} → {value}. '
                f'Autorisé : {allowed or "aucun"}'
            )
        return value
