"""
Script de test SIRA — simule un message WhatsApp client de bout en bout.
Lance avec : python test_sira.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AfriSell.settings')
django.setup()

from accounts.models import Shop
from sira.handler import handle_message

# ── 1. Trouver une boutique avec SIRA actif ───────────────────────────────────
shops = list(Shop.objects.select_related('user', 'sira_config').all())

if not shops:
    print("Aucune boutique en base. Crée d'abord un compte vendeur via /api/auth/register/")
    exit(1)

print("Boutiques disponibles :")
for i, s in enumerate(shops):
    cfg = getattr(s, 'sira_config', None)
    enabled = getattr(cfg, 'is_enabled', False)
    twilio  = getattr(cfg, 'twilio_number', '—')
    print(f"  [{i}] {s.name} | SIRA actif: {enabled} | Twilio: {twilio}")

shop = shops[0]
cfg  = getattr(shop, 'sira_config', None)

# ── 2. Activer SIRA temporairement si nécessaire ──────────────────────────────
if cfg and not cfg.is_enabled:
    cfg.is_enabled = True
    cfg.save()
    print(f"\nSIRA activé temporairement pour : {shop.name}")

# ── 3. Simuler des messages ────────────────────────────────────────────────────
CLIENT_PHONE = 'whatsapp:+2250000000001'  # numéro fictif pour le test

messages = [
    'Bonjour !',
    'Je veux commander du riz',
    '2 sacs',
    'oui je confirme',
]

print(f"\n=== Test SIRA — Boutique : {shop.name} ===\n")

for msg in messages:
    print(f"CLIENT : {msg}")
    response = handle_message(
        shop         = shop,
        client_phone = CLIENT_PHONE,
        body         = msg,
        post_data    = {},
    )
    print(f"SIRA   : {response}")
    print("-" * 60)
