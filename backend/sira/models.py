import uuid
from django.db import models
from django.conf import settings


class SiraConfig(models.Model):
    """
    Configuration SIRA par boutique.
    Le vendeur personnalise les messages, la langue et les horaires de son bot.
    Activé uniquement si le plan a has_sira_bot=True.
    """
    LANGUAGE_CHOICES = [
        ('fr',     'Français'),
        ('en',     'English'),
        ('dioula', 'Dioula'),
        ('wolof',  'Wolof'),
    ]

    shop       = models.OneToOneField(
        'accounts.Shop',
        on_delete=models.CASCADE,
        related_name='sira_config',
    )
    is_enabled = models.BooleanField(default=False)
    bot_name   = models.CharField(max_length=50, default='SIRA')

    # numéro Twilio assigné à cette boutique (format: +15551234567)
    twilio_number = models.CharField(max_length=20, blank=True)
    # Phone Number ID Meta (chaque boutique a le sien en production)
    meta_phone_number_id = models.CharField(max_length=30, blank=True)

    # messages personnalisables
    greeting_message = models.TextField(
        default="Bonjour 👋 Je suis SIRA, l'assistant de {shop_name} !\n"
                "Tapez *catalogue* pour voir nos produits ou choisissez directement 👇"
    )
    catalogue_intro = models.TextField(
        default="Voici nos produits disponibles 🛍️ :\n\n{product_list}\n\n"
                "Tapez le *numéro* ou le *nom* du produit que vous souhaitez commander."
    )
    order_confirmation_message = models.TextField(
        default="✅ Votre commande a bien été reçue !\n\n"
                "📦 *{product_name}* × {quantity}\n"
                "💰 Total : {total} XOF\n"
                "🔖 Réf : {reference}\n\n"
                "Le vendeur vous contactera très vite pour la livraison."
    )
    out_of_hours_message = models.TextField(
        default="Bonjour 👋 Nous sommes actuellement fermés. "
                "Nous répondrons dès l'ouverture. Merci de votre patience !"
    )

    language = models.CharField(max_length=10, choices=LANGUAGE_CHOICES, default='fr')

    # horaires — null = disponible 24h/24
    working_hours_start = models.TimeField(null=True, blank=True)
    working_hours_end   = models.TimeField(null=True, blank=True)

    # fournisseur WhatsApp actif : 'twilio' | 'bridge' | 'meta'
    WA_PROVIDER_CHOICES = [
        ('twilio', 'Twilio'),
        ('bridge', 'WA-Bridge (QR)'),
        ('meta',   'Meta Cloud API'),
    ]
    wa_provider = models.CharField(
        max_length=10, choices=WA_PROVIDER_CHOICES, default='twilio'
    )

    # si True, la commande est confirmée sans confirmation manuelle du vendeur
    auto_confirm_orders = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Config SIRA'
        verbose_name_plural = 'Configs SIRA'

    def __str__(self):
        status = '✅ actif' if self.is_enabled else '⏸ inactif'
        return f'SIRA — {self.shop.name} ({status})'

    def is_open(self):
        """Je vérifie si la boutique est dans ses horaires d'ouverture."""
        if not self.working_hours_start or not self.working_hours_end:
            return True  # pas d'horaires → toujours disponible
        from django.utils import timezone
        now = timezone.localtime().time()
        return self.working_hours_start <= now <= self.working_hours_end


class SiraConversation(models.Model):
    """
    Session de conversation entre un client et SIRA pour une boutique.
    Je maintiens l'état de la commande en cours au fil des messages.
    """
    STATE_CHOICES = [
        ('idle',              'En attente'),
        ('browsing',          'Navigation catalogue'),
        ('selecting',         'Sélection produit'),
        ('confirming',        'Confirmation commande'),
        ('awaiting_location', 'Attente localisation'),
        ('completed',         'Commande créée'),
        ('cancelled',         'Annulé'),
    ]

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shop         = models.ForeignKey(
        'accounts.Shop',
        on_delete=models.CASCADE,
        related_name='sira_conversations',
    )
    # numéro WhatsApp du client au format Twilio (whatsapp:+2250123456789)
    client_phone = models.CharField(max_length=30)
    client_name  = models.CharField(max_length=255, blank=True)

    state = models.CharField(max_length=20, choices=STATE_CHOICES, default='idle')

    # produit sélectionné en cours de commande
    selected_product = models.ForeignKey(
        'catalogue.Product',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='sira_conversations',
    )
    quantity   = models.PositiveIntegerField(default=1)
    client_note = models.TextField(blank=True)

    # localisation client reçue
    client_latitude  = models.FloatField(null=True, blank=True)
    client_longitude = models.FloatField(null=True, blank=True)

    # commande créée une fois la localisation reçue
    order = models.OneToOneField(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='sira_conversation',
    )

    last_message_at = models.DateTimeField(auto_now=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Conversation SIRA'
        verbose_name_plural = 'Conversations SIRA'
        ordering            = ['-last_message_at']
        # une seule conversation active par client par boutique
        # (les nouvelles sont créées une fois la précédente terminée)
        indexes = [
            models.Index(fields=['shop', 'client_phone', 'state']),
        ]

    def __str__(self):
        return f'{self.client_phone} → {self.shop.name} [{self.state}]'

    def reset(self):
        """Je réinitialise la conversation pour une nouvelle commande."""
        self.state           = 'browsing'
        self.selected_product = None
        self.quantity        = 1
        self.client_note     = ''
        self.client_latitude = None
        self.client_longitude = None
        self.order           = None
        self.save()


class SiraMessage(models.Model):
    """
    Message individuel dans une conversation SIRA.
    Je garde tout pour permettre au vendeur de relire l'historique.
    """
    DIRECTION_CHOICES = [
        ('inbound',  'Reçu du client'),
        ('outbound', 'Envoyé par SIRA'),
    ]
    TYPE_CHOICES = [
        ('text',     'Texte'),
        ('audio',    'Audio / Vocal'),
        ('location', 'Position GPS'),
        ('image',    'Image'),
        ('system',   'Système'),
    ]

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        SiraConversation,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    direction    = models.CharField(max_length=10, choices=DIRECTION_CHOICES)
    message_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='text')

    # contenu textuel (ou transcription Whisper si audio)
    body         = models.TextField(blank=True)
    # URL média Twilio (audio, image)
    media_url    = models.URLField(blank=True)
    # transcription du vocal par Whisper (remplie en async)
    transcription = models.TextField(blank=True)

    # intention détectée par Gemini (pour debug/audit)
    intent       = models.CharField(max_length=50, blank=True)

    # payload brut Twilio pour traçabilité
    raw_payload  = models.JSONField(default=dict)
    # SID Twilio du message envoyé
    twilio_sid   = models.CharField(max_length=50, blank=True)

    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Message SIRA'
        verbose_name_plural = 'Messages SIRA'
        ordering            = ['sent_at']

    def __str__(self):
        direction = '←' if self.direction == 'inbound' else '→'
        preview   = (self.body or self.message_type)[:40]
        return f'{direction} {preview}'
