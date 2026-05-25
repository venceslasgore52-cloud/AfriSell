import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AfriSell.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import Shop

User = get_user_model()

print("=== COMPTES UTILISATEURS ===")
for u in User.objects.all():
    phone = getattr(u, 'phone', '') or getattr(u, 'phone_number', '') or '—'
    print(f"  {u.email} | tel: {phone} | staff: {u.is_staff}")

print("\n=== BOUTIQUES ===")
for s in Shop.objects.select_related('user', 'sira_config').all():
    cfg = getattr(s, 'sira_config', None)
    print(f"  {s.name} | vendeur: {s.user.email} | twilio: {getattr(cfg, 'twilio_number', '—')}")
