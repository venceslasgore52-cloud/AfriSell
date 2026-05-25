from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='plan',
            name='max_products',
            field=models.PositiveIntegerField(
                null=True,
                blank=True,
                help_text='Nombre max de produits. null = illimité (Business).',
            ),
        ),
    ]
