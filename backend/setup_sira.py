import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AfriSell.settings')
django.setup()

from accounts.models import Shop
from sira.models import SiraConfig

shop = Shop.objects.get(name='Malepoh Gore')
cfg, _ = SiraConfig.objects.get_or_create(shop=shop)

# Numéro sandbox Twilio (le même pour tout le monde)
cfg.twilio_number = '+14155238886'
cfg.is_enabled    = True
cfg.language      = 'fr'
cfg.save()

print(f"SIRA configuré pour : {shop.name}")
print(f"Numéro Twilio       : {cfg.twilio_number}")
print(f"Activé              : {cfg.is_enabled}")
