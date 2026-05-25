import uuid
from django.db import models
from django.conf import settings


class StudioAsset(models.Model):
    """
    Contenu généré par le Studio IA pour un vendeur.
    Flyers, images améliorées, textes publicitaires.
    Vidéo en V2.
    """

    TYPE_CHOICES = [
        ('flyer',       'Flyer publicitaire'),
        ('image',       'Image produit améliorée'),
        ('text',        'Texte publicitaire'),
        ('video',       'Vidéo produit'),        # V2
        ('montage',     'Montage vidéo'),         # V2
    ]

    STATUS_CHOICES = [
        ('pending',     'En attente'),
        ('processing',  'En génération'),
        ('done',        'Terminé'),
        ('failed',      'Échoué'),
    ]

    id      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller  = models.ForeignKey(
                  settings.AUTH_USER_MODEL,
                  on_delete=models.CASCADE,
                  related_name='studio_assets',
              )
    product = models.ForeignKey(
                  'catalogue.Product',
                  on_delete=models.SET_NULL,
                  null=True, blank=True,
                  related_name='studio_assets',
              )

    type   = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Fichier source fourni par le vendeur
    source_image = models.ImageField(upload_to='studio/sources/', blank=True, null=True)

    # Fichier généré par l'IA
    generated_file = models.FileField(upload_to='studio/generated/', blank=True, null=True)
    generated_url  = models.URLField(blank=True)  # URL externe si hébergé ailleurs

    # Texte publicitaire généré
    generated_text = models.TextField(blank=True)

    # Prompt utilisé pour la génération — utile pour régénérer
    prompt_used   = models.TextField(blank=True)

    # Modèle IA utilisé — Gemini, HuggingFace, etc.
    ai_model_used = models.CharField(max_length=100, blank=True)

    # Erreur si génération échouée
    error_message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Asset Studio'
        verbose_name_plural = 'Assets Studio'
        ordering            = ['-created_at']

    def __str__(self):
        return f'{self.type} — {self.seller.email} ({self.status})'


class PublicationPost(models.Model):
    """
    Post programmé pour publication sur les réseaux sociaux.
    Lié à un StudioAsset généré.
    Publication automatique V2 (approbation Meta requise).
    V1 — le vendeur publie manuellement depuis ce post.
    """

    STATUS_CHOICES = [
        ('draft',      'Brouillon'),
        ('scheduled',  'Programmé'),
        ('published',  'Publié'),
        ('failed',     'Échoué'),
        ('cancelled',  'Annulé'),
    ]

    PLATFORM_CHOICES = [
        ('facebook',  'Facebook'),
        ('instagram', 'Instagram'),
        ('tiktok',    'TikTok'),
        ('whatsapp',  'WhatsApp Status'),
    ]

    id     = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller = models.ForeignKey(
                 settings.AUTH_USER_MODEL,
                 on_delete=models.CASCADE,
                 related_name='publication_posts',
             )
    asset  = models.ForeignKey(
                 StudioAsset,
                 on_delete=models.SET_NULL,
                 null=True, blank=True,
                 related_name='posts',
             )

    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    status   = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    # Contenu du post
    caption      = models.TextField(blank=True)
    hashtags     = models.TextField(blank=True)

    # Programmation
    scheduled_at  = models.DateTimeField(null=True, blank=True)
    published_at  = models.DateTimeField(null=True, blank=True)

    # Résultat publication — ID post côté plateforme
    platform_post_id = models.CharField(max_length=255, blank=True)
    platform_url     = models.URLField(blank=True)

    error_message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Post publication'
        verbose_name_plural = 'Posts publication'
        ordering            = ['-created_at']

    def __str__(self):
        return f'{self.platform} — {self.seller.email} ({self.status})'


class SmartScheduleSuggestion(models.Model):
    """
    Suggestion de meilleur moment de publication générée par l'IA.
    Basée sur l'historique des commandes et l'activité des clients.
    Disponible uniquement plan Business.
    """

    id       = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller   = models.ForeignKey(
                   settings.AUTH_USER_MODEL,
                   on_delete=models.CASCADE,
                   related_name='schedule_suggestions',
               )
    platform = models.CharField(max_length=20)

    # Meilleurs créneaux suggérés — stockés en JSON
    # ex: [{"day": "lundi", "hour": 18}, {"day": "vendredi", "hour": 12}]
    suggested_slots = models.JSONField(default=list)

    # Analyse textuelle générée par Gemini
    analysis        = models.TextField(blank=True)

    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Suggestion horaire'
        verbose_name_plural = 'Suggestions horaires'
        ordering            = ['-generated_at']

    def __str__(self):
        return f'Suggestion {self.platform} — {self.seller.email}'