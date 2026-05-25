"""
Stripe Gateway — abonnements récurrents + checkout one-shot.

Variables settings requises :
    STRIPE_SECRET_KEY     — sk_live_... ou sk_test_...
    STRIPE_WEBHOOK_SECRET — whsec_...
    STRIPE_SUCCESS_URL    — URL de redirection après paiement réussi
    STRIPE_CANCEL_URL     — URL si l'user annule
"""

import stripe
from django.conf import settings
from django.utils import timezone

stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')


class StripeGateway:

    # ── Checkout ──────────────────────────────────────────────────────────────

    def create_checkout(self, payment, request=None) -> dict:
        """
        Je crée une Checkout Session Stripe.
        Si le plan a un stripe_price_id configuré → abonnement récurrent.
        Sinon → paiement unique avec le montant calculé (price_africa/global).
        """
        plan        = payment.plan
        user        = payment.user
        customer_id = self._get_or_create_customer(user)

        # automatic_payment_methods=True → Stripe active Google Pay, Apple Pay, Link,
        # carte selon le navigateur/pays du client — aucune config supplémentaire requise
        common = dict(
            customer                = customer_id,
            automatic_payment_methods = {'enabled': True},
            success_url             = getattr(settings, 'STRIPE_SUCCESS_URL', '') + '?session_id={CHECKOUT_SESSION_ID}',
            cancel_url              = getattr(settings, 'STRIPE_CANCEL_URL', ''),
            metadata                = {'payment_id': str(payment.id), 'user_id': str(user.id)},
            client_reference_id     = str(payment.id),
        )

        if plan.stripe_price_id:
            # abonnement récurrent — Stripe gère le renouvellement automatiquement
            session = stripe.checkout.Session.create(
                **common,
                line_items = [{'price': plan.stripe_price_id, 'quantity': 1}],
                mode       = 'subscription',
            )
        else:
            # pas encore de stripe_price_id — paiement dynamique (dev / plans custom)
            session = stripe.checkout.Session.create(
                **common,
                line_items = [{
                    'price_data': {
                        'currency':     payment.currency.lower(),
                        'unit_amount':  int(float(payment.amount) * 100),
                        'product_data': {'name': f'AfriSell — Plan {plan.name}'},
                    },
                    'quantity': 1,
                }],
                mode = 'payment',
            )

        payment.provider_checkout_id = session.id
        payment.save(update_fields=['provider_checkout_id'])

        return {'checkout_url': session.url, 'session_id': session.id}

    def create_portal_session(self, user) -> str:
        """Portail self-service Stripe — le vendeur gère son abonnement lui-même."""
        customer_id = self._get_or_create_customer(user)
        session = stripe.billing_portal.Session.create(
            customer   = customer_id,
            return_url = getattr(settings, 'STRIPE_SUCCESS_URL', ''),
        )
        return session.url

    # ── Webhooks ──────────────────────────────────────────────────────────────

    def verify_webhook(self, payload: bytes, sig_header: str):
        return stripe.Webhook.construct_event(
            payload, sig_header,
            getattr(settings, 'STRIPE_WEBHOOK_SECRET', ''),
        )

    def handle_event(self, event: dict) -> str:
        handlers = {
            'checkout.session.completed':    self._on_checkout_completed,
            'invoice.payment_succeeded':     self._on_payment_succeeded,
            'invoice.payment_failed':        self._on_payment_failed,
            'customer.subscription.updated': self._on_subscription_updated,
            'customer.subscription.deleted': self._on_subscription_deleted,
        }
        handler = handlers.get(event['type'])
        if handler:
            handler(event['data']['object'])
            return f'handled:{event["type"]}'
        return f'ignored:{event["type"]}'

    # ── Event handlers ────────────────────────────────────────────────────────

    def _on_checkout_completed(self, session):
        from datetime import timedelta
        from .models import Payment, Subscription
        from .signals import subscription_activated

        payment = Payment.objects.filter(provider_checkout_id=session['id']).first()
        if not payment:
            return

        payment.status             = 'success'
        payment.provider_tx_id     = session.get('payment_intent') or session.get('subscription', '')
        payment.provider_response  = dict(session)
        payment.save(update_fields=['status', 'provider_tx_id', 'provider_response'])

        sub, _ = Subscription.objects.get_or_create(
            user=payment.user,
            defaults={'plan': payment.plan, 'provider': 'stripe'},
        )
        sub.plan                   = payment.plan
        sub.status                 = 'active'
        sub.provider               = 'stripe'
        sub.stripe_customer_id     = session.get('customer', '')
        sub.stripe_subscription_id = session.get('subscription', '')
        sub.start_date             = timezone.now()
        # Stripe gère le renouvellement — end_date = None signifie récurrent actif
        sub.end_date               = None
        sub.save()

        subscription_activated.send(sender=Subscription, subscription=sub)

    def _on_payment_succeeded(self, invoice):
        from .models import Subscription
        sub = Subscription.objects.filter(stripe_subscription_id=invoice['subscription']).first()
        if sub:
            sub.status   = 'active'
            sub.end_date = None
            sub.save(update_fields=['status', 'end_date'])

    def _on_payment_failed(self, invoice):
        from .models import Subscription
        sub = Subscription.objects.filter(stripe_subscription_id=invoice['subscription']).first()
        if sub:
            sub.status = 'past_due'
            sub.save(update_fields=['status'])

    def _on_subscription_updated(self, stripe_sub):
        from .models import Subscription
        sub = Subscription.objects.filter(stripe_subscription_id=stripe_sub['id']).first()
        if not sub:
            return
        STATUS_MAP = {
            'active':   'active',
            'past_due': 'past_due',
            'canceled': 'cancelled',
            'unpaid':   'past_due',
            'trialing': 'trial',
        }
        sub.status = STATUS_MAP.get(stripe_sub['status'], sub.status)
        sub.save(update_fields=['status'])

    def _on_subscription_deleted(self, stripe_sub):
        from .models import Subscription
        sub = Subscription.objects.filter(stripe_subscription_id=stripe_sub['id']).first()
        if sub:
            sub.status = 'cancelled'
            sub.save(update_fields=['status'])

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _get_or_create_customer(self, user) -> str:
        # je réutilise le customer existant pour ne pas en créer plusieurs par user
        sub = getattr(user, 'subscription', None)
        if sub and sub.stripe_customer_id:
            return sub.stripe_customer_id

        customer = stripe.Customer.create(
            email    = user.email,
            name     = user.get_full_name() or user.username,
            metadata = {'user_id': str(user.id)},
        )
        if sub:
            sub.stripe_customer_id = customer.id
            sub.save(update_fields=['stripe_customer_id'])
        return customer.id
