from rest_framework import serializers
from accounts.validators import validate_image_file
from .models import StudioAsset, PublicationPost, SmartScheduleSuggestion


class StudioAssetSerializer(serializers.ModelSerializer):
    type_display   = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    product_name   = serializers.CharField(source='product.name', read_only=True, default=None)

    class Meta:
        model  = StudioAsset
        fields = [
            'id', 'type', 'type_display', 'status', 'status_display',
            'product', 'product_name',
            'source_image', 'generated_file', 'generated_url', 'generated_text',
            'prompt_used', 'ai_model_used', 'error_message',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'status', 'status_display', 'type_display', 'product_name',
            'generated_file', 'generated_url', 'generated_text',
            'ai_model_used', 'error_message', 'created_at', 'updated_at',
        ]

    def validate_source_image(self, value):
        validate_image_file(value)
        return value

    def validate(self, data):
        asset_type = data.get('type')
        if asset_type == 'image' and not data.get('source_image'):
            raise serializers.ValidationError(
                {'source_image': 'Une image source est requise pour la suppression de fond.'}
            )
        return data


class StudioAssetListSerializer(serializers.ModelSerializer):
    """Version légère — sans les fichiers lourds."""
    type_display   = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    product_name   = serializers.CharField(source='product.name', read_only=True, default=None)

    class Meta:
        model  = StudioAsset
        fields = [
            'id', 'type', 'type_display', 'status', 'status_display',
            'product_name', 'ai_model_used', 'created_at',
        ]
        read_only_fields = fields


class PublicationPostSerializer(serializers.ModelSerializer):
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    status_display   = serializers.CharField(source='get_status_display', read_only=True)
    asset_type       = serializers.CharField(source='asset.type', read_only=True, default=None)

    class Meta:
        model  = PublicationPost
        fields = [
            'id', 'platform', 'platform_display', 'status', 'status_display',
            'asset', 'asset_type', 'caption', 'hashtags',
            'content_image', 'scheduled_at', 'published_at',
            'platform_post_id', 'platform_url', 'error_message',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'status', 'status_display', 'platform_display', 'asset_type',
            'published_at', 'platform_post_id', 'platform_url', 'error_message',
            'created_at', 'updated_at',
        ]

    def validate_scheduled_at(self, value):
        if value:
            from django.utils import timezone
            if value <= timezone.now():
                raise serializers.ValidationError(
                    'La date de publication doit être dans le futur.'
                )
        return value


class PublicationPostListSerializer(serializers.ModelSerializer):
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    status_display   = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model  = PublicationPost
        fields = [
            'id', 'platform', 'platform_display', 'status', 'status_display',
            'caption', 'scheduled_at', 'published_at', 'created_at',
        ]
        read_only_fields = fields


class SmartScheduleSuggestionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SmartScheduleSuggestion
        fields = ['id', 'platform', 'suggested_slots', 'analysis', 'generated_at']
        read_only_fields = fields


class GenerateTextRequestSerializer(serializers.Serializer):
    """Payload pour générer un texte publicitaire à la volée (sans créer d'asset).
    product_id est optionnel : si absent, le champ prompt est utilisé directement.
    """
    product_id   = serializers.UUIDField(required=False, allow_null=True)
    content_type = serializers.ChoiceField(
        choices=['caption', 'promo', 'whatsapp', 'description'],
        default='caption',
        required=False,
    )
    platform     = serializers.ChoiceField(
        choices=['whatsapp', 'instagram', 'facebook', 'tiktok', 'general'],
        default='general',
        required=False,
    )
    language     = serializers.ChoiceField(
        choices=['fr', 'en', 'dioula', 'wolof'],
        default='fr',
        required=False,
    )
    prompt       = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    extra        = serializers.CharField(max_length=200, required=False, allow_blank=True)

    def validate(self, data):
        if not data.get('product_id') and not data.get('prompt'):
            raise serializers.ValidationError(
                'Renseignez soit un produit, soit un texte de description.'
            )
        return data


class QuotaSerializer(serializers.Serializer):
    """Usage mensuel du vendeur vs limites du plan."""
    used_this_month = serializers.IntegerField()
    limit           = serializers.IntegerField(allow_null=True)  # null = illimité
    remaining       = serializers.IntegerField(allow_null=True)
    is_unlimited    = serializers.BooleanField()
