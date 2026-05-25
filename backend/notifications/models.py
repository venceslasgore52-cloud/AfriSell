import uuid
from django.db import models
from django.conf import settings


# ── Types de notifications ────────────────────────────────────────────────────
# je regroupe par domaine pour garder la lisibilité
# règle : clés toujours en anglais, snake_case

NOTIF_TYPES = [
    # Produits
    ('low_stock',       'Stock faible'),
    ('out_of_stock',    'Rupture de stock'),
    ('product_created', 'Nouveau produit'),
    ('product_updated', 'Produit mis à jour'),
    ('product_deleted', 'Produit supprimé'),
    ('product_review',  'Nouvelle évaluation'),

    # Commandes (reçues via SIRA WhatsApp ou lien public)
    ('new_order',       'Nouvelle commande'),
    ('order_confirmed', 'Commande confirmée'),
    ('order_shipped',   'Commande expédiée'),
    ('order_delivered', 'Commande livrée'),
    ('order_cancelled', 'Commande annulée'),
    # NB : order_returned retiré — le modèle Order n'a pas ce statut

    # Paiements & abonnements
    ('payment_success',        'Paiement réussi'),
    ('payment_failed',         'Paiement échoué'),
    ('payment_pending',        'Paiement en attente'),
    ('subscription_expiring',  'Abonnement bientôt expiré'),
    ('subscription_expired',   'Abonnement expiré'),
    ('subscription_renewed',   'Abonnement renouvelé'),

    # Studio IA & publication
    ('pub_success',  'Publication réussie'),
    ('pub_failed',   'Publication échouée'),
    ('ai_done',      'Génération IA terminée'),
    ('ai_failed',    'Génération IA échouée'),
    ('ai_progress',  'Génération IA en cours'),

    # Système
    ('system', 'Notification système'),
]

# ── Niveaux de sévérité ───────────────────────────────────────────────────────
# séparé de notif_type — un new_order peut être info ou warning selon le contexte

NOTIF_LEVELS = [
    ('info',    'Info'),
    ('success', 'Succès'),
    ('warning', 'Avertissement'),
    ('error',   'Erreur'),
]


class Notification(models.Model):
    id        = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    notif_type = models.CharField(max_length=30, choices=NOTIF_TYPES)
    level      = models.CharField(max_length=10, choices=NOTIF_LEVELS, default='info')
    title      = models.CharField(max_length=200)
    message    = models.TextField(blank=True)

    # lien optionnel vers la ressource concernée
    # ex : object_type='order', object_id='<uuid>' → le front peut naviguer directement
    object_id   = models.CharField(max_length=100, blank=True)
    object_type = models.CharField(max_length=50, blank=True)

    is_read = models.BooleanField(default=False)
    # je trace quand l'user a lu la notif — utile pour analytics et "lu il y a X min"
    read_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering            = ['-created_at']  # les plus récentes en premier

    def __str__(self):
        return f'[{self.level}] {self.title} → {self.recipient.email}'

    def mark_as_read(self):
        """Je marque la notif comme lue et j'horodate — appelé depuis la vue PATCH."""
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
