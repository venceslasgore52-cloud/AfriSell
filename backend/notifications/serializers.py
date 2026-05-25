from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    # je retourne le label lisible en plus de la clé technique
    notif_type_display = serializers.CharField(source='get_notif_type_display', read_only=True)
    level_display      = serializers.CharField(source='get_level_display',      read_only=True)

    class Meta:
        model  = Notification
        fields = [
            'id',
            'notif_type', 'notif_type_display',
            'level',      'level_display',
            'title', 'message',
            'object_id', 'object_type',
            'is_read', 'read_at',
            'created_at',
        ]
        # le recipient est déterminé depuis request.user — jamais fourni par le client
        read_only_fields = [
            'id', 'notif_type_display', 'level_display',
            'read_at', 'created_at',
        ]


class NotificationMarkReadSerializer(serializers.Serializer):
    """
    Serializer minimaliste pour marquer une ou plusieurs notifs comme lues.
    PATCH /notifications/me/read/       → toutes les notifs non lues
    PATCH /notifications/me/<pk>/read/  → une seule notif
    """
    # ids optionnel — si absent, on marque toutes les notifs non lues du user
    ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
    )
