"""
Management command : cree ou met a jour les 3 plans Afrisell.

Usage :
    python manage.py seed_plans
    python manage.py seed_plans --force   # ecrase les prix meme s'ils existent
"""

from django.core.management.base import BaseCommand
from billing.models import Plan


PLANS = [
    # Starter
    {
        'slug':  'starter',
        'name':  'Starter',

        'price_africa': '5.00',
        'price_global': '10.00',
        'currency':     'USD',
        'interval':     'monthly',

        'max_flyers_ai':   10,
        'max_video_ai':     0,
        'max_text_ai':     20,
        'max_ai_requests': 30,

        'max_products': 30,
        'max_orders':   50,

        'has_sira_bot':        True,
        'sira_auto_reply':     True,
        'sira_order_capture':  False,
        'sira_location_fetch': False,

        'has_studio':         True,
        'has_bg_removal':     False,
        'has_auto_publish':   False,
        'has_smart_schedule': False,

        'has_analytics':       False,
        'has_market_analysis': False,

        'has_whatsapp_notif': True,

        'is_popular': False,
        'is_active':  True,
    },

    # Pro
    {
        'slug':  'pro',
        'name':  'Pro',

        'price_africa': '20.00',
        'price_global': '20.00',
        'currency':     'USD',
        'interval':     'monthly',

        'max_flyers_ai':   None,
        'max_video_ai':    10,
        'max_text_ai':     None,
        'max_ai_requests': None,

        'max_products': 100,
        'max_orders':   None,

        'has_sira_bot':        True,
        'sira_auto_reply':     True,
        'sira_order_capture':  True,
        'sira_location_fetch': True,

        'has_studio':         True,
        'has_bg_removal':     True,
        'has_auto_publish':   True,
        'has_smart_schedule': False,

        'has_analytics':       True,
        'has_market_analysis': False,

        'has_whatsapp_notif': True,

        'is_popular': True,
        'is_active':  True,
    },

    # Business
    {
        'slug':  'business',
        'name':  'Business',

        'price_africa': '50.00',
        'price_global': '50.00',
        'currency':     'USD',
        'interval':     'monthly',

        'max_flyers_ai':   None,
        'max_video_ai':    None,
        'max_text_ai':     None,
        'max_ai_requests': None,

        'max_products': None,
        'max_orders':   None,

        'has_sira_bot':        True,
        'sira_auto_reply':     True,
        'sira_order_capture':  True,
        'sira_location_fetch': True,

        'has_studio':         True,
        'has_bg_removal':     True,
        'has_auto_publish':   True,
        'has_smart_schedule': True,

        'has_analytics':       True,
        'has_market_analysis': True,

        'has_whatsapp_notif': True,

        'is_popular': False,
        'is_active':  True,
    },
]


class Command(BaseCommand):
    help = 'Cree ou met a jour les 3 plans Afrisell (Starter, Pro, Business).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Ecrase les prix et features meme si les plans existent deja.',
        )

    def handle(self, *args, **options):
        force = options['force']
        created_count = 0
        updated_count = 0

        for data in PLANS:
            slug = data['slug']

            try:
                plan = Plan.objects.get(slug=slug)
                if force:
                    for field, value in data.items():
                        if field != 'slug':
                            setattr(plan, field, value)
                    plan.save()
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'  ~ Plan "{plan.name}" mis a jour.')
                    )
                else:
                    self.stdout.write(
                        self.style.NOTICE(
                            f'  . Plan "{plan.name}" existe deja '
                            f'({plan.price_africa}$/{plan.price_global}$). '
                            f'Ignore. Utilisez --force pour ecraser.'
                        )
                    )

            except Plan.DoesNotExist:
                Plan.objects.create(**data)
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  + Plan "{data["name"]}" cree '
                        f'({data["price_africa"]}$ Afrique / {data["price_global"]}$ Global).'
                    )
                )

        self.stdout.write('')
        if created_count:
            self.stdout.write(self.style.SUCCESS(f'{created_count} plan(s) cree(s).'))
        if updated_count:
            self.stdout.write(self.style.WARNING(f'{updated_count} plan(s) mis a jour.'))
        if not created_count and not updated_count:
            self.stdout.write(self.style.NOTICE('Aucun changement. Utilisez --force pour forcer la mise a jour.'))

        self.stdout.write('')
        self.stdout.write('Plans actifs :')
        for plan in Plan.objects.filter(is_active=True).order_by('price_global'):
            products = str(plan.max_products) if plan.max_products is not None else 'illimite'
            popular = ' [Populaire]' if plan.is_popular else ''
            self.stdout.write(
                f'  - {plan.name:<10} '
                f'{plan.price_africa}$ Afrique / {plan.price_global}$ Global  '
                f'- {products} produits{popular}'
            )
