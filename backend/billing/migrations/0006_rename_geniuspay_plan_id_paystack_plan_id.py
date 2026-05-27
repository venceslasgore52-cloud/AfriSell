from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0005_replace_geniuspay_with_paystack'),
    ]

    operations = [
        migrations.RenameField(
            model_name='plan',
            old_name='geniuspay_plan_id',
            new_name='paystack_plan_id',
        ),
    ]
