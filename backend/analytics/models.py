import uuid
from django.db import models
from django.conf import settings


class DailyStat(models.Model):
    """
    Snapshot quotidien agrégé par boutique.
    Je le calcule chaque nuit via Celery pour ne pas recalculer à chaque requête.
    Le front lit ces données pour les graphiques historiques (30j, 90j, 1an).
    """
    id   = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shop = models.ForeignKey(
        'accounts.Shop',
        on_delete=models.CASCADE,
        related_name='daily_stats',
    )
    date = models.DateField()

    # commandes
    total_orders     = models.PositiveIntegerField(default=0)
    confirmed_orders = models.PositiveIntegerField(default=0)
    delivered_orders = models.PositiveIntegerField(default=0)
    cancelled_orders = models.PositiveIntegerField(default=0)

    # revenus (commandes livrées uniquement — les autres ne sont pas encore encaissées)
    revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # clients uniques ce jour-là (basé sur client_phone)
    unique_customers = models.PositiveIntegerField(default=0)

    # vues produits ce jour-là
    product_views = models.PositiveIntegerField(default=0)

    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Stat quotidienne'
        verbose_name_plural = 'Stats quotidiennes'
        ordering            = ['-date']
        # une seule ligne par boutique par jour
        unique_together = [['shop', 'date']]

    def __str__(self):
        return f'{self.shop.name} — {self.date} ({self.revenue} XOF)'


class ProductView(models.Model):
    """
    Chaque vue d'une fiche produit par un client potentiel.
    Je m'en sers pour calculer le taux de conversion (vues → commandes).
    Source permet de savoir d'où vient le trafic.
    """
    SOURCE_CHOICES = [
        ('whatsapp',  'WhatsApp'),
        ('instagram', 'Instagram'),
        ('facebook',  'Facebook'),
        ('tiktok',    'TikTok'),
        ('direct',    'Lien direct'),
        ('other',     'Autre'),
    ]

    id      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        'catalogue.Product',
        on_delete=models.CASCADE,
        related_name='views',
    )
    # je garde le shop séparé pour requêter sans JOIN vers product
    shop    = models.ForeignKey(
        'accounts.Shop',
        on_delete=models.CASCADE,
        related_name='product_views',
    )
    source    = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='direct')
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Vue produit'
        verbose_name_plural = 'Vues produits'
        ordering            = ['-viewed_at']

    def __str__(self):
        return f'{self.product.name} — {self.source} ({self.viewed_at:%Y-%m-%d})'
