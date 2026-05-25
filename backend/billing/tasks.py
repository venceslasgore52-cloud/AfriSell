"""
Tâches Celery pour la gestion des abonnements.

Planification recommandée (à ajouter dans celery.py) :
    app.conf.beat_schedule = {
        'expire-subscriptions-daily': {
            'task': 'billing.tasks.expire_subscriptions',
            'schedule': crontab(hour=1, minute=0),  # chaque nuit à 1h
        },
        'notify-expiring-soon-daily': {
            'task': 'billing.tasks.notify_expiring_soon',
            'schedule': crontab(hour=8, minute=0),  # chaque matin à 8h
        },
    }
"""

from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def expire_subscriptions(self):
    """
    Je passe en 'expired' tous les abonnements actifs dont end_date est dépassée.
    Stripe n'est pas concerné — il gère l'expiration lui-même via webhooks.
    """
    from .models import Subscription
    from .signals import subscription_expired

    qs = Subscription.objects.filter(
        status='active',
        end_date__lt=timezone.now(),
        provider__in=['cinetpay', 'geniuspay', 'manual'],
    )

    count = 0
    for sub in qs:
        sub.status = 'expired'
        sub.save(update_fields=['status'])
        subscription_expired.send(sender=Subscription, subscription=sub)
        count += 1

    logger.info(f'[billing] {count} abonnement(s) expiré(s)')
    return f'{count} abonnements expirés'


@shared_task(bind=True, max_retries=3)
def notify_expiring_soon(self):
    """
    Je trouve les abonnements qui expirent dans 7 jours ou moins
    et j'envoie un lien de renouvellement au vendeur.
    CinetPay/GeniusPay ne débitent pas automatiquement — je le fais manuellement.
    """
    from .models import Subscription

    deadline = timezone.now() + timedelta(days=7)
    qs = Subscription.objects.filter(
        status='active',
        auto_renew=True,
        end_date__lte=deadline,
        end_date__gt=timezone.now(),
        provider__in=['cinetpay', 'geniuspay'],
    ).select_related('user', 'plan', 'user__shop')

    for sub in qs:
        send_renewal_link.delay(str(sub.id))

    logger.info(f'[billing] {qs.count()} renouvellement(s) planifié(s)')
    return f'{qs.count()} notifications de renouvellement envoyées'


@shared_task(bind=True, max_retries=3)
def send_renewal_link(self, subscription_id: str):
    """
    Je génère un lien de paiement de renouvellement et je l'envoie par email.
    Appelé automatiquement par notify_expiring_soon ou manuellement depuis l'admin.
    """
    from .models import Subscription
    from .gateway import get_gateway

    try:
        sub = Subscription.objects.select_related('user', 'plan', 'user__shop').get(id=subscription_id)
    except Subscription.DoesNotExist:
        logger.warning(f'[billing] Subscription {subscription_id} introuvable pour renouvellement')
        return

    try:
        gw     = get_gateway(sub.provider)
        result = gw.create_renewal_checkout(sub)
        checkout_url = result.get('checkout_url', '')
    except Exception as exc:
        logger.error(f'[billing] Erreur création checkout renouvellement : {exc}')
        raise self.retry(exc=exc, countdown=60 * 10)

    _send_renewal_email(sub.user, sub.plan, checkout_url, sub.end_date)
    logger.info(f'[billing] Lien de renouvellement envoyé à {sub.user.email}')
    return f'Lien envoyé à {sub.user.email}'


@shared_task
def generate_invoice_pdf_task(invoice_id: str):
    """
    Je génère le PDF en arrière-plan pour ne pas bloquer le webhook.
    Appelé depuis signals.py après subscription_activated.
    """
    from .models import Invoice
    from .pdf import generate_invoice_pdf
    from django.core.files.base import ContentFile

    try:
        invoice = Invoice.objects.select_related('payment', 'payment__user', 'payment__plan').get(id=invoice_id)
        pdf_bytes = generate_invoice_pdf(invoice)
        invoice.pdf.save(
            f'invoice_{invoice.number}.pdf',
            ContentFile(pdf_bytes),
            save=True,
        )
        logger.info(f'[billing] PDF généré : {invoice.number}')
    except Exception as exc:
        logger.error(f'[billing] Erreur génération PDF {invoice_id} : {exc}')


# ── Helpers internes ──────────────────────────────────────────────────────────

def _send_renewal_email(user, plan, checkout_url: str, end_date):
    from django.core.mail import send_mail
    days_left = (end_date - timezone.now()).days if end_date else 0

    send_mail(
        subject=f'Votre abonnement AfriSell expire dans {days_left} jour(s)',
        message=(
            f'Bonjour {user.get_full_name() or user.username},\n\n'
            f'Votre abonnement {plan.name} expire dans {days_left} jour(s).\n\n'
            f'Pour renouveler, clique sur ce lien de paiement :\n{checkout_url}\n\n'
            f'Si tu as des questions, réponds à cet email.\n\n'
            f'— L\'équipe AfriSell'
        ),
        from_email='noreply@afrisell.com',
        recipient_list=[user.email],
        fail_silently=True,
    )
