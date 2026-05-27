"""
Paystack Gateway — Mobile Money + Carte pour l'Afrique.

Variables settings requises :
    PAYSTACK_SECRET_KEY  — sk_live_... ou sk_test_...
    PAYSTACK_PUBLIC_KEY  — pk_live_... ou pk_test_...
    PAYSTACK_CALLBACK_URL — URL de redirection après paiement
    PAYSTACK_WEBHOOK_SECRET — secret pour vérifier les webhooks
"""

import hmac
import hashlib
import requests
from django.conf import settings
from django.utils import timezone

PAYSTACK_BASE_URL = 'https://api.paystack.co'


class PaystackGateway:

    def __init__(self):
        self.secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', '')
        self.headers    = {
            'Authorization': f'Bearer {self.secret_key}',
            'Content-Type':  'application/json',
        }

    # ── Checkout ──────────────────────────────────────────────────────────────

    def create_checkout(self, payment, request=None) -> dict:
        reference  = str(payment.id).replace('-', '')[:20]
        # Paystack travaille en centimes (kobo NGN, pesewas GHS, cents USD)
        amount_sub = int(float(payment.amount) * 100)

        payload = {
            'email':        payment.user.email,
            'amount':       amount_sub,
            'currency':     payment.currency,
            'reference':    reference,
            'callback_url': getattr(settings, 'PAYSTACK_CALLBACK_URL', ''),
            'metadata': {
                'payment_id': str(payment.id),
                'plan':       payment.plan.name,
                'user_id':    str(payment.user.id),
            },
        }

        resp = requests.post(
            f'{PAYSTACK_BASE_URL}/transaction/initialize',
            json=payload, headers=self.headers, timeout=15,
        )
        data = resp.json()

        if not data.get('status'):
            raise Exception(f'Paystack erreur : {data.get("message", "inconnu")}')

        payment.provider_checkout_id = reference
        payment.save(update_fields=['provider_checkout_id'])

        return {
            'checkout_url': data['data']['authorization_url'],
            'reference':    reference,
        }

    # ── Vérification transaction ──────────────────────────────────────────────

    def verify_transaction(self, reference: str) -> dict:
        resp = requests.get(
            f'{PAYSTACK_BASE_URL}/transaction/verify/{reference}',
            headers=self.headers, timeout=15,
        )
        return resp.json()

    # ── Webhook ───────────────────────────────────────────────────────────────

    def verify_signature(self, payload: bytes, signature: str) -> bool:
        secret   = self.secret_key.encode('utf-8')
        computed = hmac.new(secret, payload, hashlib.sha512).hexdigest()
        return hmac.compare_digest(computed, signature)

    def handle_event(self, event: dict) -> bool:
        handlers = {
            'charge.success': self._on_charge_success,
        }
        handler = handlers.get(event.get('event'))
        if handler:
            return handler(event.get('data', {}))
        return False

    def _on_charge_success(self, data: dict) -> bool:
        from .models import Payment, Subscription
        from .signals import subscription_activated

        reference = data.get('reference', '')
        payment   = Payment.objects.filter(provider_checkout_id=reference).first()
        if not payment:
            return False

        # double vérification via l'API Paystack
        verify = self.verify_transaction(reference)
        if verify.get('data', {}).get('status') != 'success':
            return False

        payment.status         = 'success'
        payment.provider_tx_id = data.get('id', '')
        payment.provider_response = data
        payment.save(update_fields=['status', 'provider_tx_id', 'provider_response'])

        sub, _ = Subscription.objects.get_or_create(
            user=payment.user,
            defaults={'plan': payment.plan, 'provider': 'paystack'},
        )
        sub.plan       = payment.plan
        sub.status     = 'active'
        sub.provider   = 'paystack'
        sub.start_date = timezone.now()
        from django.utils.timezone import timedelta
        days = 365 if payment.plan.interval == 'yearly' else 30
        sub.end_date = timezone.now() + timedelta(days=days)
        sub.save()

        subscription_activated.send(sender=Subscription, subscription=sub)
        return True

    def create_renewal_checkout(self, subscription) -> dict:
        from .models import Payment
        from .gateway import get_amount_and_currency
        shop    = getattr(subscription.user, 'shop', None)
        country = shop.country if shop else 'NG'
        amount, currency = get_amount_and_currency(subscription.plan, country, 'paystack')

        payment = Payment.objects.create(
            user     = subscription.user,
            plan     = subscription.plan,
            amount   = amount,
            currency = currency,
            provider = 'paystack',
            status   = 'pending',
        )
        return self.create_checkout(payment)
