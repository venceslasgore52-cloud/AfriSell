from django.db import migrations


def replace_geniuspay(apps, schema_editor):
    GatewayConfig = apps.get_model('billing', 'GatewayConfig')
    # Renomme geniuspay → paystack s'il existe
    GatewayConfig.objects.filter(provider='geniuspay').update(provider='paystack')
    # Crée la ligne paystack si elle n'existe pas encore
    GatewayConfig.objects.get_or_create(provider='paystack', defaults={'is_enabled': False})
    # Active paystack par défaut si les clés sont présentes dans les settings
    from django.conf import settings
    has_keys = bool(getattr(settings, 'PAYSTACK_SECRET_KEY', ''))
    if has_keys:
        GatewayConfig.objects.filter(provider='paystack').update(is_enabled=True)


def reverse_replace(apps, schema_editor):
    GatewayConfig = apps.get_model('billing', 'GatewayConfig')
    GatewayConfig.objects.filter(provider='paystack').update(provider='geniuspay')


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0004_add_gateway_config'),
    ]

    operations = [
        migrations.RunPython(replace_geniuspay, reverse_replace),
    ]
