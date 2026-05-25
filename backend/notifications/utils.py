"""
Fonctions utilitaires pour créer des notifications depuis n'importe quelle app.
Les autres apps importent uniquement ce fichier — jamais le modèle directement.

Utilisation :
    from notifications.utils import notify

    notify(
        recipient  = user,
        notif_type = 'new_order',
        title      = 'Nouvelle commande reçue',
        message    = f'Commande {order.reference} de {order.client_name}',
        level      = 'info',
        obj        = order,   # optionnel — pour le lien object_id / object_type
    )
"""

from .models import Notification


def notify(recipient, notif_type: str, title: str, message: str = '',
           level: str = 'info', obj=None) -> Notification:
    """
    Je crée une notification en base.
    Si obj est fourni, j'en extrais l'id et le type automatiquement
    pour que le front puisse naviguer vers la ressource concernée.
    """
    object_id   = ''
    object_type = ''

    if obj is not None:
        # je prends le pk de l'objet quelle que soit sa forme (UUID, int, str)
        object_id   = str(getattr(obj, 'pk', '') or getattr(obj, 'id', ''))
        # je déduis le type depuis le nom du modèle en minuscules
        object_type = obj.__class__.__name__.lower()

    return Notification.objects.create(
        recipient   = recipient,
        notif_type  = notif_type,
        level       = level,
        title       = title,
        message     = message,
        object_id   = object_id,
        object_type = object_type,
    )


def notify_many(recipients, notif_type: str, title: str, message: str = '',
                level: str = 'info', obj=None) -> int:
    """
    Je crée la même notification pour une liste de destinataires.
    Retourne le nombre de notifs créées.
    Utilise bulk_create pour ne faire qu'une seule requête DB.
    """
    object_id   = str(getattr(obj, 'pk', '') or getattr(obj, 'id', '')) if obj else ''
    object_type = obj.__class__.__name__.lower() if obj else ''

    notifs = [
        Notification(
            recipient   = user,
            notif_type  = notif_type,
            level       = level,
            title       = title,
            message     = message,
            object_id   = object_id,
            object_type = object_type,
        )
        for user in recipients
    ]
    Notification.objects.bulk_create(notifs)
    return len(notifs)
