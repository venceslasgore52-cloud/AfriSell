from django.db import migrations


def replace_geniuspay(apps, schema_editor):
    GatewayConfig = apps.get_model('billing', 'GatewayConfig')
    # Supprime geniuspay s'il existe (paystack est déjà présent en DB)
    GatewayConfig.objects.filter(provider='geniuspay').delete()
    # S'assure que paystack existe avec les bons settings
    from django.conf import settings
    has_keys = bool(getattr(settings, 'PAYSTACK_SECRET_KEY', ''))
    obj, created = GatewayConfig.objects.get_or_create(
        provider='paystack',
        defaults={'is_enabled': has_keys},
    )
    if not created and has_keys and not obj.is_enabled:
        obj.is_enabled = True
        obj.save(update_fields=['is_enabled'])


def reverse_replace(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0004_add_gateway_config'),
    ]

    operations = [
        migrations.RunPython(replace_geniuspay, reverse_replace),
    ]
