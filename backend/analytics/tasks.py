from celery import shared_task
from django.db.models import Sum, Count, Q
from django.utils import timezone

from orders.models import Order
from .models import DailyStat, ProductView


@shared_task
def compute_daily_stats(date_str=None):
    """
    Je calcule les stats quotidiennes pour toutes les boutiques actives.
    Lancé chaque nuit à minuit via Celery Beat — je peux aussi le forcer manuellement.
    date_str : 'YYYY-MM-DD' (hier par défaut si omis)
    """
    from datetime import date, timedelta
    from accounts.models import Shop

    if date_str:
        from datetime import datetime
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    else:
        # je cible toujours hier — aujourd'hui n'est pas encore terminé
        target_date = timezone.now().date() - timedelta(days=1)

    shops = Shop.objects.filter(is_active=True)
    updated = 0

    for shop in shops:
        seller = shop.user

        orders_qs = Order.objects.filter(seller=seller, created_at__date=target_date)

        total_orders     = orders_qs.count()
        confirmed_orders = orders_qs.filter(status='confirmed').count()
        delivered_orders = orders_qs.filter(status='delivered').count()
        cancelled_orders = orders_qs.filter(status='cancelled').count()

        # je prends uniquement les commandes livrées CE jour-là (delivered_at)
        revenue = (
            Order.objects
            .filter(seller=seller, status='delivered', delivered_at__date=target_date)
            .aggregate(t=Sum('total_amount'))['t'] or 0
        )

        # je compte les clients uniques par numéro de téléphone
        unique_customers = (
            orders_qs
            .values('client_phone')
            .distinct()
            .count()
        )

        # vues produits enregistrées dans ProductView
        product_views = ProductView.objects.filter(
            shop=shop,
            viewed_at__date=target_date,
        ).count()

        # je crée ou je mets à jour — update_or_create évite les doublons
        DailyStat.objects.update_or_create(
            shop=shop,
            date=target_date,
            defaults={
                'total_orders':     total_orders,
                'confirmed_orders': confirmed_orders,
                'delivered_orders': delivered_orders,
                'cancelled_orders': cancelled_orders,
                'revenue':          revenue,
                'unique_customers': unique_customers,
                'product_views':    product_views,
            },
        )
        updated += 1

    return f'compute_daily_stats: {updated} boutiques traitées pour {target_date}'


@shared_task
def cleanup_old_product_views(days=90):
    """
    Je supprime les ProductView plus vieilles que `days` jours.
    Lancé une fois par semaine pour garder la table légère.
    """
    from datetime import timedelta
    cutoff = timezone.now() - timedelta(days=days)
    deleted, _ = ProductView.objects.filter(viewed_at__lt=cutoff).delete()
    return f'cleanup_old_product_views: {deleted} lignes supprimées (>{days} jours)'
