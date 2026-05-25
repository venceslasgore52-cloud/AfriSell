import uuid
from django.db import models
from django.conf import settings


class Order(models.Model):
    """
    Commande reçue via SIRA (bot WhatsApp) ou lien de commande.
    AfriSell ne gère pas le paiement — cash ou Mobile Money à la livraison.
    AfriSell ne gère pas la livraison — le vendeur contacte son livreur.
    """

    STATUS_CHOICES = [
        ('pending',    'En attente'),
        ('confirmed',  'Confirmée'),
        ('processing', 'En préparation'),
        ('delivering', 'En livraison'),
        ('delivered',  'Livrée'),
        ('cancelled',  'Annulée'),
    ]

    SOURCE_CHOICES = [
        ('sira_whatsapp', 'SIRA WhatsApp'),
        ('order_link',    'Lien de commande'),
    ]

    id     = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller = models.ForeignKey(
                settings.AUTH_USER_MODEL,
                on_delete=models.CASCADE,
                related_name='orders',
            )

    # Référence lisible — ex: ORD-202506-00001
    reference = models.CharField(max_length=50, unique=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='sira_whatsapp')

    # ── Infos client ─────────────────────────────────────────────────────────
    client_name       = models.CharField(max_length=255)
    client_phone      = models.CharField(max_length=20)
    client_whatsapp   = models.CharField(max_length=20, blank=True)

    # Localisation partagée par le client via lien Google Maps
    client_latitude   = models.FloatField(null=True, blank=True)
    client_longitude  = models.FloatField(null=True, blank=True)
    client_address    = models.TextField(blank=True)

    # ── Montants ─────────────────────────────────────────────────────────────
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency     = models.CharField(max_length=3, default='XOF')

    # ── Notes ────────────────────────────────────────────────────────────────
    client_note = models.TextField(blank=True)
    seller_note = models.TextField(blank=True)

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)
    confirmed_at  = models.DateTimeField(null=True, blank=True)
    delivered_at  = models.DateTimeField(null=True, blank=True)
    cancelled_at  = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name        = 'Commande'
        verbose_name_plural = 'Commandes'
        ordering            = ['-created_at']

    def __str__(self):
        return f'{self.reference} — {self.client_name} ({self.status})'

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = self._generate_reference()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_reference():
        from django.utils import timezone
        from django.db import transaction
        with transaction.atomic():
            prefix = timezone.now().strftime('ORD-%Y%m-')
            last   = (
                Order.objects
                .select_for_update()
                .filter(reference__startswith=prefix)
                .order_by('-reference')
                .first()
            )
            seq = int(last.reference.split('-')[-1]) + 1 if last else 1
            return f'{prefix}{seq:05d}'

    def compute_total(self):
        """Recalcule le total depuis les lignes de commande."""
        total = sum(item.subtotal for item in self.items.all())
        self.total_amount = total
        self.save(update_fields=['total_amount'])
        return total


class OrderItem(models.Model):
    """
    Ligne de commande — un produit du catalogue du vendeur.
    """

    id       = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order    = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')

    # On garde une référence au produit mais on snapshote le nom/prix
    # au moment de la commande — si le vendeur modifie son produit plus tard
    # la commande historique reste cohérente
    product      = models.ForeignKey(
                       'catalogue.Product',
                       on_delete=models.SET_NULL,
                       null=True, blank=True,
                       related_name='order_items',
                   )
    product_name  = models.CharField(max_length=255)   # snapshot
    product_price = models.DecimalField(max_digits=10, decimal_places=2)  # snapshot
    quantity      = models.PositiveIntegerField(default=1)

    class Meta:
        verbose_name        = 'Ligne de commande'
        verbose_name_plural = 'Lignes de commande'

    def __str__(self):
        return f'{self.quantity}x {self.product_name} — {self.order.reference}'

    @property
    def subtotal(self):
        return self.product_price * self.quantity


class OrderStatusHistory(models.Model):
    """
    Historique des changements de statut d'une commande.
    Permet de tracer chaque transition pour le vendeur.
    """

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order      = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
                     settings.AUTH_USER_MODEL,
                     on_delete=models.SET_NULL,
                     null=True, blank=True,
                  )
    note       = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Historique statut'
        verbose_name_plural = 'Historiques statuts'
        ordering            = ['-changed_at']

    def __str__(self):
        return f'{self.order.reference} : {self.old_status} → {self.new_status}'