import uuid
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


CATEGORY_CHOICES = [
    ('alimentation', 'Alimentation'),
    ('electronique', 'Électronique'),
    ('vetements',    'Vêtements'),
    ('beaute',       'Beauté & Cosmétiques'),
    ('maison',       'Maison & Décoration'),
    ('sante',        'Santé & Bien-être'),
    ('sport',        'Sport & Loisirs'),
    ('informatique', 'Informatique'),
    ('telephonie',   'Téléphonie'),
    ('automobile',   'Automobile'),
    ('agriculture',  'Agriculture'),
    ('services',     'Services'),
    ('autre',        'Autre'),  # → déclenche le champ custom_category
]


class Product(models.Model):

    STATUS_CHOICES = [
        ('active',   'Actif'),
        ('inactive', 'Inactif'),
        ('rupture',  'Rupture de stock'),
        ('bientot',  'Disponible bientôt'),
    ]

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant      = models.ForeignKey(
                      settings.AUTH_USER_MODEL,
                      on_delete=models.CASCADE,
                      related_name='products',
                      limit_choices_to={'role': 'tenant'},
                  )
    name        = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image       = models.ImageField(upload_to='products/', null=True, blank=True)

    price       = models.DecimalField(max_digits=10, decimal_places=2)
    promo_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    quantity = models.PositiveIntegerField(default=0)
    statut   = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    category        = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    # rempli uniquement quand category == 'autre'
    custom_category = models.CharField(max_length=100, blank=True)

    published_whatsapp  = models.BooleanField(default=False)
    published_facebook  = models.BooleanField(default=False)
    published_instagram = models.BooleanField(default=False)
    published_tiktok    = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Produit'
        verbose_name_plural = 'Produits'
        ordering            = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def effective_price(self):
        return self.promo_price if self.promo_price is not None else self.price

    @property
    def in_stock(self):
        return self.quantity > 0

    @property
    def display_category(self):
        # je retourne custom_category si l'user a choisi "autre", sinon le label normal
        if self.category == 'autre' and self.custom_category:
            return self.custom_category
        return self.get_category_display()

    def clean(self):
        # si l'user choisit "autre", il doit remplir custom_category
        if self.category == 'autre' and not self.custom_category:
            raise ValidationError({'custom_category': 'Précise la catégorie de ton produit.'})
        # si une vraie catégorie est choisie, je vide custom_category pour pas garder des résidus
        if self.category != 'autre':
            self.custom_category = ''

    def save(self, *args, **kwargs):
        self.full_clean()
        if self.quantity == 0:
            self.statut = 'rupture'
        elif self.statut == 'rupture':
            self.statut = 'active'
        super().save(*args, **kwargs)
