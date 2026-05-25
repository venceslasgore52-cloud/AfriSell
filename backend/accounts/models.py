import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver


class User(AbstractUser):
    ADMIN  = 'admin'
    TENANT = 'tenant'

    ROLE_CHOICES = [
        (ADMIN,  'Administrateur AfriSell'),
        (TENANT, 'Vendeur'),
    ]

    id     = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role   = models.CharField(max_length=20, choices=ROLE_CHOICES, default=TENANT)
    phone  = models.CharField(max_length=20, blank=True)
    email  = models.EmailField(unique=True)

    longitude = models.FloatField(blank=True, null=True)
    latitude  = models.FloatField(blank=True, null=True)

    social_provider = models.CharField(
        max_length=20, blank=True, null=True,
        choices=[
            ('google',   'Google'),
            ('facebook', 'Facebook'),
            ('apple',    'Apple'),
            ('local',    'Local'),
        ],
        default='local'
    )
    social_id  = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name        = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
        ordering            = ['-created_at']

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    @property
    def is_admin(self):
        return self.role == self.ADMIN

    @property
    def is_tenant(self):
        return self.role == self.TENANT

    @property
    def has_active_subscription(self):
        return getattr(self, 'subscription', None) and self.subscription.is_active

    def save(self, *args, **kwargs):
        if self.role == self.ADMIN:
            self.is_superuser = True
            self.is_staff     = True
        else:
            self.is_superuser = False
            self.is_staff     = False
        super().save(*args, **kwargs)


# ── Avatar path ───────────────────────────────────────────────────────────────

def user_avatar_path(instance, filename):
    return f'users/{instance.user.id}/avatar/{filename}'


# ── Profil utilisateur ────────────────────────────────────────────────────────

class UserProfile(models.Model):
    """
    Profil unique pour tous les utilisateurs.
    Champs pro remplis uniquement pour les vendeurs (role=TENANT).
    NB: total_sales et total_orders supprimés — calculés dynamiquement
        depuis l'app orders pour éviter les incohérences.
        access_level supprimé — géré via permissions Django.
    """

    LANGUAGE_CHOICES = [
        ('fr', 'Français'),
        ('en', 'English'),
        ('ar', 'العربية'),
        ('pt', 'Português'),
        ('es', 'Español'),
    ]

    user          = models.OneToOneField(
                        settings.AUTH_USER_MODEL,
                        on_delete=models.CASCADE,
                        related_name='profile'
                    )
    avatar        = models.ImageField(upload_to=user_avatar_path, blank=True, null=True)
    bio           = models.TextField(blank=True, max_length=500)
    language      = models.CharField(max_length=10, default='fr', choices=LANGUAGE_CHOICES)
    notifications = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profil de {self.user.email}"


# ── Boutique du vendeur (1 vendeur = 1 boutique) ──────────────────────────────

class Shop(models.Model):
    """
    Boutique unique du vendeur sur AfriSell.
    Remplace Market — un vendeur n'a qu'une seule boutique.
    whatsapp_number = numéro dédié attribué par AfriSell via Twilio/360dialog.
    """

    COUNTRY_CHOICES = [
        ('CI', "Côte d'Ivoire"),
        ('SN', 'Sénégal'),
        ('ML', 'Mali'),
        ('BF', 'Burkina Faso'),
        ('GN', 'Guinée'),
        ('FR', 'France'),
        ('BE', 'Belgique'),
        ('OTHER', 'Autre'),
    ]

    CATEGORY_CHOICES = [
        ('alimentation', 'Alimentation'),
        ('vetements',    'Vêtements & Mode'),
        ('electronique', 'Électronique'),
        ('beaute',       'Beauté & Cosmétiques'),
        ('maison',       'Maison & Décoration'),
        ('services',     'Services'),
        ('other',        'Autre'),
    ]

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user        = models.OneToOneField(
                      settings.AUTH_USER_MODEL,
                      on_delete=models.CASCADE,
                      related_name='shop',
                      limit_choices_to={'role': User.TENANT}
                  )
    name        = models.CharField(max_length=255)
    category    = models.CharField(max_length=50, choices=CATEGORY_CHOICES, blank=True)
    description = models.TextField(blank=True)
    logo        = models.ImageField(upload_to='shops/logos/', blank=True, null=True)

    # Localisation
    country   = models.CharField(max_length=10, choices=COUNTRY_CHOICES, default='CI')
    city      = models.CharField(max_length=100, blank=True)
    address   = models.TextField(blank=True)
    latitude  = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)

    # WhatsApp Business dédié AfriSell
    whatsapp_number    = models.CharField(max_length=20, blank=True, null=True)
    whatsapp_connected = models.BooleanField(default=False)

    opening_hours = models.JSONField(default=dict, blank=True)

    is_active   = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = "Boutique"
        verbose_name_plural = "Boutiques"
        ordering            = ['-created_at']

    def __str__(self):
        return f"{self.name} — {self.user.email}"


# ── Connexions réseaux sociaux ────────────────────────────────────────────────

class SocialConnection(models.Model):
    """
    Tokens OAuth après autorisation du vendeur.
    Utilisé pour publier sur Facebook/Instagram/TikTok via Studio.
    """

    PLATFORM_CHOICES = [
        ('facebook',  'Facebook'),
        ('instagram', 'Instagram'),
        ('whatsapp',  'WhatsApp Business'),
        ('tiktok',    'TikTok'),
    ]

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant        = models.ForeignKey(
                        settings.AUTH_USER_MODEL,
                        on_delete=models.CASCADE,
                        related_name='social_connections',
                    )
    platform      = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    access_token  = models.TextField()
    refresh_token = models.TextField(blank=True)
    expires_at    = models.DateTimeField(null=True, blank=True)
    account_id    = models.CharField(max_length=100, blank=True)
    account_name  = models.CharField(max_length=255, blank=True)
    extra_data    = models.JSONField(default=dict, blank=True)
    is_active     = models.BooleanField(default=True)
    connected_at  = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together     = [['tenant', 'platform']]
        verbose_name        = "Connexion sociale"
        verbose_name_plural = "Connexions sociales"
        ordering            = ['platform']

    def __str__(self):
        return f"{self.platform} — {self.tenant.email}"


# ── Mises à jour boutique ─────────────────────────────────────────────────────

class ShopUpdate(models.Model):
    UPDATE_TYPES = [
        ('info',   'Information'),
        ('promo',  'Promotion'),
        ('urgent', 'Urgent'),
        ('closed', 'Fermeture temporaire'),
    ]

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shop        = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='updates')
    message     = models.TextField()
    update_type = models.CharField(max_length=20, default='info', choices=UPDATE_TYPES)
    is_active   = models.BooleanField(default=True)
    expires_at  = models.DateTimeField(blank=True, null=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Mise à jour boutique"
        verbose_name_plural = "Mises à jour boutiques"
        ordering            = ['-created_at']

    def __str__(self):
        return f"{self.update_type} — {self.shop.name}"


# ── Tokens auth ───────────────────────────────────────────────────────────────

class EmailVerificationToken(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(
                     settings.AUTH_USER_MODEL,
                     on_delete=models.CASCADE,
                     related_name='verification_tokens'
                 )
    token      = models.UUIDField(default=uuid.uuid4, unique=True)
    is_used    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        verbose_name = "Token de vérification email"

    def __str__(self):
        return f"Verification — {self.user.email}"


class PasswordResetToken(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(
                     settings.AUTH_USER_MODEL,
                     on_delete=models.CASCADE,
                     related_name='reset_tokens'
                 )
    token      = models.UUIDField(default=uuid.uuid4, unique=True)
    is_used    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        verbose_name = "Token de réinitialisation"

    def __str__(self):
        return f"Reset — {self.user.email}"


# ── Signals ───────────────────────────────────────────────────────────────────

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    """Crée automatiquement le profil à chaque nouvel utilisateur."""
    if created:
        UserProfile.objects.create(user=instance)