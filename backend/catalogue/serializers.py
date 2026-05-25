from rest_framework import serializers
from accounts.validators import validate_image_file
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    effective_price  = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    in_stock         = serializers.BooleanField(read_only=True)
    display_category = serializers.CharField(read_only=True)
    vendor_name      = serializers.SerializerMethodField(read_only=True)

    def get_vendor_name(self, obj):
        return getattr(obj.tenant, 'username', None) or getattr(obj.tenant, 'email', None)

    # je rends custom_category obligatoire uniquement si category == 'autre'
    custom_category = serializers.CharField(required=False, allow_blank=True, max_length=100)

    class Meta:
        model  = Product
        fields = [
            'id', 'name', 'description', 'image',
            'price', 'promo_price', 'effective_price',
            'quantity', 'in_stock', 'statut',
            'category', 'custom_category', 'display_category',
            'vendor_name',
            'published_whatsapp', 'published_facebook',
            'published_instagram', 'published_tiktok',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        category        = attrs.get('category', getattr(self.instance, 'category', ''))
        custom_category = attrs.get('custom_category', '')

        if category == 'autre' and not custom_category:
            raise serializers.ValidationError(
                {'custom_category': 'Précise la catégorie de ton produit.'}
            )
        # je nettoie custom_category si l'user a choisi une vraie catégorie
        if category != 'autre':
            attrs['custom_category'] = ''

        return attrs

    def validate_image(self, value):
        validate_image_file(value)
        return value

    def validate_promo_price(self, value):
        # je vérifie que promo_price est inférieur au price si les deux sont fournis
        price = self.initial_data.get('price') or getattr(self.instance, 'price', None)
        if value is not None and price is not None:
            if float(value) >= float(price):
                raise serializers.ValidationError(
                    'Le prix promo doit être inférieur au prix normal.'
                )
        return value


class ProductListSerializer(serializers.ModelSerializer):
    """Serializer allégé pour les listes — j'évite de surcharger les réponses."""
    effective_price  = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    in_stock         = serializers.BooleanField(read_only=True)
    display_category = serializers.CharField(read_only=True)

    class Meta:
        model  = Product
        fields = [
            'id', 'name', 'description', 'image', 'price', 'promo_price',
            'effective_price', 'quantity', 'in_stock', 'statut',
            'category', 'display_category', 'created_at',
        ]
