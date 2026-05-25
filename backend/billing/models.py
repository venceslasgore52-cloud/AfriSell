import uuid
from django.db import models
from django.conf import settings


# ── Gateway config (activé / désactivé par l'admin) ──────────────────────────

class GatewayConfig(models.Model):
    PROVIDER_CHOICES = [
        ('google_pay', 'Google Pay'),
        ('stripe',     'Stripe'),
        ('cinetpay',   'CinetPay'),
        ('geniuspay',  'GeniusPay'),
    ]
    provider   = models.CharField(max_length=20, unique=True, choices=PROVIDER_CHOICES)
    is_enabled = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Config passerelle'
        verbose_name_plural = 'Configs passerelles'

    def __str__(self):
        return f'{self.provider} — {"actif" if self.is_enabled else "inactif"}'


# ── Plans ─────────────────────────────────────────────────────────────────────

class Plan(models.Model):
    INTERVAL_CHOICES = [
        ('monthly', 'Mensuel'),
        ('yearly',  'Annuel'),
    ]

    SLUG_CHOICES = [
        ('starter',  'Starter'),
        ('pro',      'Pro'),
        ('business', 'Business'),
    ]

    id       = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name     = models.CharField(max_length=100)
    slug     = models.SlugField(unique=True, choices=SLUG_CHOICES)
    interval = models.CharField(max_length=10, choices=INTERVAL_CHOICES, default='monthly')

    # Prix selon la région
    price_africa = models.DecimalField(max_digits=10, decimal_places=2)  # 5$ / 20$ / 30$
    price_global = models.DecimalField(max_digits=10, decimal_places=2)  # 10$ / 20$ / 30$
    currency     = models.CharField(max_length=3, default='USD')

    # ── Limites Studio IA ────────────────────────────────────────────────────
    # null = illimité (Pro et Business)
    max_flyers_ai    = models.PositiveIntegerField(null=True, blank=True)  # Starter: limité
    max_video_ai     = models.PositiveIntegerField(null=True, blank=True)  # Starter: 0
    max_text_ai      = models.PositiveIntegerField(null=True, blank=True)  # Starter: limité
    max_ai_requests  = models.PositiveIntegerField(null=True, blank=True)  # requêtes IA totales

    # ── Limites Catalogue ────────────────────────────────────────────────────
    max_products = models.PositiveIntegerField(default=10)  # Starter: 10, Pro: 50, Business: null

    # ── Limites Commandes ────────────────────────────────────────────────────
    max_orders = models.PositiveIntegerField(null=True, blank=True)  # null = illimité

    # ── SIRA Bot ─────────────────────────────────────────────────────────────
    has_sira_bot         = models.BooleanField(default=False)  # Starter: False
    sira_auto_reply      = models.BooleanField(default=False)  # réponse auto clients
    sira_order_capture   = models.BooleanField(default=False)  # prise de commande auto
    sira_location_fetch  = models.BooleanField(default=False)  # demande localisation client

    # ── Studio IA ────────────────────────────────────────────────────────────
    has_studio           = models.BooleanField(default=True)   # tous les plans
    has_bg_removal       = models.BooleanField(default=False)  # suppression fond image
    has_auto_publish     = models.BooleanField(default=False)  # publication auto réseaux sociaux
    has_smart_schedule   = models.BooleanField(default=False)  # analyse meilleur moment publication

    # ── Analytics ────────────────────────────────────────────────────────────
    has_analytics        = models.BooleanField(default=False)  # tableau de bord stats ventes
    has_market_analysis  = models.BooleanField(default=False)  # analyse de marché IA

    # ── Notifications ────────────────────────────────────────────────────────
    has_whatsapp_notif   = models.BooleanField(default=True)   # notif commande WhatsApp

    # ── IDs provider paiement ────────────────────────────────────────────────
    stripe_price_id      = models.CharField(max_length=100, blank=True)
    stripe_product_id    = models.CharField(max_length=100, blank=True)
    geniuspay_plan_id    = models.CharField(max_length=100, blank=True)
    cinetpay_plan_id     = models.CharField(max_length=100, blank=True)

    is_active  = models.BooleanField(default=True)
    is_popular = models.BooleanField(default=False)  # badge "Plus populaire" sur le pricing
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Plan'
        verbose_name_plural = 'Plans'
        ordering            = ['price_global']

    def __str__(self):
        return f'{self.name} — {self.price_africa}$ Afrique / {self.price_global}$ Global'

    def get_price_for_country(self, country_code):
        """Retourne le prix selon le pays du vendeur."""
        AFRICA_CODES = ['CI', 'SN', 'ML', 'BF', 'GN', 'TG', 'BJ', 'NE', 'CM', 'GH', 'NG']
        if country_code in AFRICA_CODES:
            return self.price_africa
        return self.price_global


# ── Valeurs par défaut des 3 plans (pour la migration initiale) ───────────────
"""
STARTER — 5$ Afrique / 10$ Global
    max_flyers_ai    = 10/mois
    max_video_ai     = 0
    max_text_ai      = 20/mois
    max_products     = 10
    max_orders       = 50/mois
    has_sira_bot     = False
    has_studio       = True
    has_bg_removal   = False
    has_auto_publish = False
    has_analytics    = False

PRO — 20$ Afrique / 20$ Global
    max_flyers_ai    = null (illimité)
    max_video_ai     = 10/mois
    max_text_ai      = null
    max_products     = 50
    max_orders       = null
    has_sira_bot          = True
    sira_auto_reply       = True
    sira_order_capture    = True
    sira_location_fetch   = True
    has_bg_removal        = True
    has_analytics         = True
    has_market_analysis   = True

BUSINESS — 30$ Afrique / 30$ Global
    Tout Pro +
    max_products     = null
    max_video_ai     = null
    has_auto_publish      = True
    has_smart_schedule    = True
    (SIRA gère tout automatiquement)
"""


# ── Subscriptions ─────────────────────────────────────────────────────────────

class Subscription(models.Model):
    STATUS_CHOICES = [
        ('trial',     'Essai'),
        ('active',    'Actif'),
        ('past_due',  'Paiement en retard'),
        ('cancelled', 'Annulé'),
        ('expired',   'Expiré'),
    ]

    PROVIDER_CHOICES = [
        ('stripe',    'Stripe'),
        ('cinetpay',  'CinetPay'),
        ('geniuspay', 'GeniusPay'),
        ('manual',    'Manuel (admin)'),
    ]

    id   = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subscription',
    )
    plan   = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='subscriptions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trial')

    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, blank=True)

    stripe_customer_id     = models.CharField(max_length=100, blank=True)
    stripe_subscription_id = models.CharField(max_length=100, blank=True)
    provider_customer_id   = models.CharField(max_length=100, blank=True)

    trial_end  = models.DateTimeField(null=True, blank=True)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date   = models.DateTimeField(null=True, blank=True)
    auto_renew = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Abonnement'
        verbose_name_plural = 'Abonnements'
        ordering            = ['-created_at']

    def __str__(self):
        return f'{self.user.email} — {self.plan.name} ({self.status})'

    @property
    def is_active(self):
        return self.status in ('active', 'trial')

    def can_use_sira(self):
        return self.is_active and self.plan.has_sira_bot

    def can_publish_auto(self):
        return self.is_active and self.plan.has_auto_publish

    def can_use_studio(self):
        return self.is_active and self.plan.has_studio


# ── Payments ──────────────────────────────────────────────────────────────────

class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending',   'En attente'),
        ('success',   'Réussi'),
        ('failed',    'Échoué'),
        ('refunded',  'Remboursé'),
        ('cancelled', 'Annulé'),
    ]

    PROVIDER_CHOICES = [
        ('stripe',    'Stripe'),
        ('cinetpay',  'CinetPay'),
        ('geniuspay', 'GeniusPay'),
        ('manual',    'Manuel'),
    ]

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user         = models.ForeignKey(
                       settings.AUTH_USER_MODEL,
                       on_delete=models.CASCADE,
                       related_name='payments',
                   )
    subscription = models.ForeignKey(
                       Subscription,
                       on_delete=models.SET_NULL,
                       null=True, blank=True,
                       related_name='payments',
                   )
    plan     = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='payments')
    amount   = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='XOF')
    status   = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)

    provider_tx_id       = models.CharField(max_length=255, blank=True)
    provider_checkout_id = models.CharField(max_length=255, blank=True)
    provider_response    = models.JSONField(default=dict, blank=True)

    failure_reason = models.TextField(blank=True)
    refunded_at    = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Paiement'
        verbose_name_plural = 'Paiements'
        ordering            = ['-created_at']

    def __str__(self):
        return f'{self.user.email} — {self.amount} {self.currency} ({self.status})'


# ── Invoices ──────────────────────────────────────────────────────────────────

class Invoice(models.Model):
    id      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='invoice')
    number  = models.CharField(max_length=50, unique=True)
    pdf     = models.FileField(upload_to='invoices/', null=True, blank=True)
    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Facture'
        verbose_name_plural = 'Factures'
        ordering            = ['-issued_at']

    def __str__(self):
        return f'Facture {self.number} — {self.payment.user.email}'

    @classmethod
    def generate_number(cls):
        from django.utils import timezone
        prefix = timezone.now().strftime('INV-%Y%m-')
        last   = cls.objects.filter(number__startswith=prefix).order_by('-number').first()
        seq    = int(last.number.split('-')[-1]) + 1 if last else 1
        return f'{prefix}{seq:05d}'


# ── Webhook logs ──────────────────────────────────────────────────────────────

class WebhookLog(models.Model):
    PROVIDER_CHOICES = [
        ('stripe',    'Stripe'),
        ('cinetpay',  'CinetPay'),
        ('geniuspay', 'GeniusPay'),
    ]

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider    = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    event_type  = models.CharField(max_length=100, blank=True)
    payload     = models.JSONField(default=dict)
    headers     = models.JSONField(default=dict, blank=True)
    processed   = models.BooleanField(default=False)
    error       = models.TextField(blank=True)
    received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Log webhook'
        verbose_name_plural = 'Logs webhooks'
        ordering            = ['-received_at']

    def __str__(self):
        return f'{self.provider} — {self.event_type} ({self.received_at:%Y-%m-%d %H:%M})'