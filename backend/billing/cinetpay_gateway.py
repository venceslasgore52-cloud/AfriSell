"""
CinetPay Gateway — Mobile Money & carte, Afrique de l'Ouest.
Doc : https://docs.cinetpay.com

Variables settings requises :
    CINETPAY_API_KEY    — clé API
    CINETPAY_SITE_ID    — identifiant du site
    CINETPAY_NOTIFY_URL — URL IPN appelée par CinetPay après paiement
    CINETPAY_RETURN_URL — URL de redirection client
"""

import requests
from django.conf import settings
from django.utils import timezone

CINETPAY_PAYMENT_URL = 'https://api-checkout.cinetpay.com/v2/payment'
CINETPAY_CHECK_URL   = 'https://api-checkout.cinetpay.com/v2/payment/check'


class CinetPayGateway:

    def __init__(self):
        self.api_key = getattr(settings, 'CINETPAY_API_KEY', '')
        self.site_id = getattr(settings, 'CINETPAY_SITE_ID', '')

    # ── Checkout ──────────────────────────────────────────────────────────────

    def create_checkout(self, payment, request=None) -> dict:
        # CinetPay ne gère pas les récurrences — je pose end_date à 30/365j
        # et une tâche Celery envoie un lien de renouvellement avant expiration
        transaction_id = str(payment.id).replace('-', '')[:20]

        payload = {
            'apikey':                self.api_key,
            'site_id':               self.site_id,
            'transaction_id':        transaction_id,
            'amount':                int(payment.amount),  # XOF = pas de décimales
            'currency':              payment.currency,
            'description':           f'Abonnement AfriSell — {payment.plan.name}',
            'notify_url':            getattr(settings, 'CINETPAY_NOTIFY_URL', ''),
            'return_url':            getattr(settings, 'CINETPAY_RETURN_URL', ''),
            'channels':              'ALL',
            'lang':                  'fr',
            'customer_id':           str(payment.user.id),
            'customer_name':         payment.user.get_full_name() or payment.user.username,
            'customer_email':        payment.user.email,
            'customer_phone_number': getattr(payment.user, 'phone', ''),
        }

        resp = requests.post(CINETPAY_PAYMENT_URL, json=payload, timeout=15)
        data = resp.json()

        if data.get('code') != '201':
            raise Exception(f'CinetPay erreur : {data.get("message")}')

        payment.provider_checkout_id = transaction_id
        payment.save(update_fields=['provider_checkout_id'])

        return {
            'checkout_url':   data['data']['payment_url'],
            'transaction_id': transaction_id,
        }

    # ── IPN ───────────────────────────────────────────────────────────────────

    def handle_notify(self, post_data: dict) -> bool:
        # je ne fais pas confiance au POST — je rappelle CinetPay pour confirmer le statut
        transaction_id = post_data.get('cpm_trans_id') or post_data.get('transaction_id')
        if not transaction_id:
            return False
        return self._apply_status(transaction_id, self._check_status(transaction_id))

    def _check_status(self, transaction_id: str) -> dict:
        resp = requests.post(CINETPAY_CHECK_URL, json={
            'apikey':         self.api_key,
            'site_id':        self.site_id,
            'transaction_id': transaction_id,
        }, timeout=15)
        return resp.json()

    def _apply_status(self, transaction_id: str, data: dict) -> bool:
        from .models import Payment, Subscription
        from .signals import subscription_activated
        from datetime import timedelta

        payment = Payment.objects.filter(provider_checkout_id=transaction_id).first()
        if not payment:
            return False

        cp_status = data.get('data', {}).get('status', '')
        payment.provider_response = data

        if cp_status == 'ACCEPTED':
            payment.status         = 'success'
            payment.provider_tx_id = data.get('data', {}).get('operator_id', '')
            payment.save(update_fields=['status', 'provider_tx_id', 'provider_response'])

            sub, _ = Subscription.objects.get_or_create(
                user=payment.user,
                defaults={'plan': payment.plan, 'provider': 'cinetpay'},
            )
            sub.plan       = payment.plan
            sub.status     = 'active'
            sub.provider   = 'cinetpay'
            sub.start_date = timezone.now()
            days = 365 if payment.plan.interval == 'yearly' else 30
            sub.end_date   = timezone.now() + timedelta(days=days)
            sub.save()

            subscription_activated.send(sender=Subscription, subscription=sub)
            return True

        elif cp_status in ('REFUSED', 'CANCELLED'):
            payment.status         = 'failed' if cp_status == 'REFUSED' else 'cancelled'
            payment.failure_reason = data.get('data', {}).get('payment_method', '')
            payment.save(update_fields=['status', 'failure_reason', 'provider_response'])

        return False

    def verify_signature(self, post_data: dict) -> bool:
        return post_data.get('cpm_site_id') == str(self.site_id)

    def create_renewal_checkout(self, subscription) -> dict:
        """Je crée un paiement de renouvellement sans request (appelé depuis Celery)."""
        from .models import Payment
        from .gateway import get_amount_and_currency
        shop    = getattr(subscription.user, 'shop', None)
        country = shop.country if shop else 'CI'
        amount, currency = get_amount_and_currency(subscription.plan, country, 'cinetpay')

        payment = Payment.objects.create(
            user     = subscription.user,
            plan     = subscription.plan,
            amount   = amount,
            currency = currency,
            provider = 'cinetpay',
            status   = 'pending',
        )
        return self.create_checkout(payment)
