import logging

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .gateway import get_gateway, detect_gateway_for_user, get_amount_and_currency, GatewayError

logger = logging.getLogger(__name__)
from .models import Plan, Subscription, Payment, Invoice, WebhookLog, GatewayConfig
from .serializers import (
    PlanSerializer, SubscriptionSerializer, PaymentSerializer,
    InvoiceSerializer, CheckoutRequestSerializer, SubscriptionCancelSerializer,
)


# ── Plans ─────────────────────────────────────────────────────────────────────

class PlanListView(generics.ListAPIView):
    # public — pas besoin d'être connecté pour voir les tarifs
    permission_classes = [AllowAny]
    serializer_class   = PlanSerializer

    def get_queryset(self):
        return Plan.objects.filter(is_active=True)

    def get_serializer_context(self):
        # je passe le request pour que PlanSerializer calcule price_for_user
        return {'request': self.request}


# ── Checkout ──────────────────────────────────────────────────────────────────

class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan_slug = None
        provider  = None
        payment   = None
        try:
            serializer = CheckoutRequestSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            plan_slug = serializer.validated_data['plan_slug']
            plan = Plan.objects.filter(slug=plan_slug, is_active=True).first()
            if not plan:
                return Response({'detail': 'Plan introuvable.'}, status=status.HTTP_404_NOT_FOUND)

            shop    = getattr(request.user, 'shop', None)
            country = shop.country if shop else 'OTHER'

            provider = serializer.validated_data.get('provider') or None
            if not provider:
                provider = detect_gateway_for_user(request.user)

            from .gateway import _enabled_providers
            if provider not in _enabled_providers():
                return Response(
                    {'detail': f'La passerelle « {provider} » n\'est pas activée.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            amount, currency = get_amount_and_currency(plan, country, provider)

            payment = Payment.objects.create(
                user     = request.user,
                plan     = plan,
                amount   = amount,
                currency = currency,
                provider = provider,
                status   = 'pending',
            )

            result = get_gateway(provider).create_checkout(payment, request)

        except Exception as exc:
            logger.exception('[checkout] plan=%s provider=%s user=%s',
                             plan_slug, provider, request.user.id)
            if payment is not None:
                try:
                    payment.status         = 'failed'
                    payment.failure_reason = str(exc)
                    payment.save(update_fields=['status', 'failure_reason'])
                except Exception:
                    pass
            detail = str(exc) or 'Erreur interne lors du paiement.'
            return Response({'detail': detail}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({
            'payment_id': str(payment.id),
            'provider':   provider,
            'amount':     str(amount),
            'currency':   currency,
            **result,
        })


# ── Stripe portal ─────────────────────────────────────────────────────────────

class StripePortalView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .stripe_gateway import StripeGateway
        try:
            url = StripeGateway().create_portal_session(request.user)
        except Exception as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        return Response({'portal_url': url})


# ── Subscription ──────────────────────────────────────────────────────────────

class MySubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sub = getattr(request.user, 'subscription', None)
        if not sub:
            return Response({'detail': 'Aucun abonnement.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(SubscriptionSerializer(sub).data)

    def delete(self, request):
        serializer = SubscriptionCancelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        sub = getattr(request.user, 'subscription', None)
        if not sub or not sub.is_active:
            return Response({'detail': 'Aucun abonnement actif à annuler.'}, status=status.HTTP_400_BAD_REQUEST)

        # j'annule le récurrent Stripe si besoin — CinetPay/GeniusPay : rien à faire côté provider
        if sub.provider == 'stripe' and sub.stripe_subscription_id:
            try:
                import stripe
                from django.conf import settings
                stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')
                stripe.Subscription.cancel(sub.stripe_subscription_id)
            except Exception:
                pass

        sub.status     = 'cancelled'
        sub.auto_renew = False
        sub.save(update_fields=['status', 'auto_renew'])

        from .signals import subscription_cancelled
        subscription_cancelled.send(sender=Subscription, subscription=sub)
        return Response({'detail': 'Abonnement annulé.'})


# ── Historique paiements ──────────────────────────────────────────────────────

class PaymentHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class   = PaymentSerializer

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)


# ── Factures ─────────────────────────────────────────────────────────────────

class InvoiceListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class   = InvoiceSerializer

    def get_queryset(self):
        return Invoice.objects.filter(payment__user=self.request.user)


class InvoiceDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class   = InvoiceSerializer

    def get_queryset(self):
        return Invoice.objects.filter(payment__user=self.request.user)


# ── Webhooks ──────────────────────────────────────────────────────────────────

@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    authentication_classes = []
    permission_classes     = []

    def post(self, request):
        sig = request.META.get('HTTP_STRIPE_SIGNATURE', '')
        log = WebhookLog.objects.create(provider='stripe', payload={}, headers={'stripe-signature': sig})
        try:
            from .stripe_gateway import StripeGateway
            gw             = StripeGateway()
            event          = gw.verify_webhook(request.body, sig)
            log.payload    = dict(event)
            log.event_type = event['type']
            result         = gw.handle_event(event)
            log.processed  = True
            log.save(update_fields=['payload', 'event_type', 'processed'])
            return Response({'status': result})
        except Exception as exc:
            log.error = str(exc)
            log.save(update_fields=['error'])
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class CinetPayWebhookView(APIView):
    authentication_classes = []
    permission_classes     = []

    def post(self, request):
        data = request.POST.dict() or request.data
        log  = WebhookLog.objects.create(provider='cinetpay', payload=data)
        try:
            from .cinetpay_gateway import CinetPayGateway
            gw = CinetPayGateway()
            if not gw.verify_signature(data):
                log.error = 'signature invalide'
                log.save(update_fields=['error'])
                return Response({'detail': 'Signature invalide.'}, status=status.HTTP_403_FORBIDDEN)
            log.processed = gw.handle_notify(data)
            log.save(update_fields=['processed'])
            return Response({'status': 'ok'})
        except Exception as exc:
            log.error = str(exc)
            log.save(update_fields=['error'])
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


# ── Passerelles activées (pour le checkout front) ─────────────────────────────

class EnabledGatewayListView(APIView):
    """
    GET /api/billing/gateways/
    Retourne la liste des providers actuellement activés par l'admin.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        enabled = list(
            GatewayConfig.objects.filter(is_enabled=True).values_list('provider', flat=True)
        )
        return Response(enabled)


# ── Admin — Gestion des passerelles ──────────────────────────────────────────

def _is_real_key(val: str, prefix: str) -> bool:
    """Vrai seulement si la clé est présente ET n'est pas un placeholder comme sk_live_..."""
    return bool(val) and val.startswith(prefix) and '...' not in val


_GATEWAY_DEFS = [
    {
        'provider':      'google_pay',
        'label':         'Google Pay',
        'description':   'Paiement en 1 clic via Google (fonctionne via Stripe)',
        'color':         '#4285F4',
        'required_vars': ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'],
        'key_check':     lambda s: _is_real_key(s.get('STRIPE_SECRET_KEY', ''), 'sk_'),
    },
    {
        'provider':      'stripe',
        'label':         'Stripe',
        'description':   'Carte bancaire internationale (Visa, Mastercard, AMEX, SEPA)',
        'color':         '#635BFF',
        'required_vars': ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
        'key_check':     lambda s: _is_real_key(s.get('STRIPE_SECRET_KEY', ''), 'sk_'),
    },
    {
        'provider':      'cinetpay',
        'label':         'CinetPay',
        'description':   "Mobile Money Afrique de l'Ouest (Orange Money, MTN, Wave)",
        'color':         '#E2291B',
        'required_vars': ['CINETPAY_API_KEY', 'CINETPAY_SITE_ID'],
        'key_check':     lambda s: bool(s.get('CINETPAY_API_KEY', '')) and '...' not in s.get('CINETPAY_API_KEY', ''),
    },
    {
        'provider':      'paystack',
        'label':         'Paystack',
        'description':   "Mobile Money Afrique (Nigeria, Ghana, Kenya, Côte d'Ivoire…)",
        'color':         '#00C3F7',
        'required_vars': ['PAYSTACK_SECRET_KEY', 'PAYSTACK_PUBLIC_KEY'],
        'key_check':     lambda s: _is_real_key(s.get('PAYSTACK_SECRET_KEY', ''), 'sk_'),
    },
]


class AdminGatewayListView(APIView):
    """
    GET /api/billing/admin/gateways/
    Liste toutes les passerelles + état (configuré / actif).
    """
    def get_permissions(self):
        from accounts.permissions import IsAfriSellAdmin
        return [IsAuthenticated(), IsAfriSellAdmin()]

    def get(self, request):
        from django.conf import settings as djsettings
        env = {k: getattr(djsettings, k, '') for k in [
            'STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET',
            'CINETPAY_API_KEY', 'CINETPAY_SITE_ID',
            'PAYSTACK_SECRET_KEY', 'PAYSTACK_PUBLIC_KEY',
        ]}
        rows = []
        for gw in _GATEWAY_DEFS:
            config, _ = GatewayConfig.objects.get_or_create(provider=gw['provider'])
            rows.append({
                'provider':      gw['provider'],
                'label':         gw['label'],
                'description':   gw['description'],
                'color':         gw['color'],
                'is_configured': gw['key_check'](env),
                'is_enabled':    config.is_enabled,
                'required_vars': gw['required_vars'],
            })
        return Response(rows)


class AdminGatewayToggleView(APIView):
    """
    PATCH /api/billing/admin/gateways/<provider>/
    Active ou désactive une passerelle.
    """
    def get_permissions(self):
        from accounts.permissions import IsAfriSellAdmin
        return [IsAuthenticated(), IsAfriSellAdmin()]

    def patch(self, request, provider):
        config = GatewayConfig.objects.filter(provider=provider).first()
        if not config:
            return Response({'detail': 'Provider inconnu.'}, status=status.HTTP_404_NOT_FOUND)
        is_enabled = request.data.get('is_enabled')
        if is_enabled is None:
            return Response({'detail': 'Champ is_enabled requis.'}, status=status.HTTP_400_BAD_REQUEST)
        config.is_enabled = bool(is_enabled)
        config.save(update_fields=['is_enabled'])
        return Response({'provider': provider, 'is_enabled': config.is_enabled})

@method_decorator(csrf_exempt, name='dispatch')
class PaystackWebhookView(APIView):
    authentication_classes = []
    permission_classes     = []

    def post(self, request):
        import json
        sig  = request.META.get('HTTP_X_PAYSTACK_SIGNATURE', '')
        body = request.body
        log  = WebhookLog.objects.create(provider='paystack', payload={}, headers={'x-paystack-signature': sig})
        try:
            from .paystack_gateway import PaystackGateway
            gw = PaystackGateway()
            if not gw.verify_signature(body, sig):
                log.error = 'signature invalide'
                log.save(update_fields=['error'])
                return Response({'detail': 'Signature invalide.'}, status=status.HTTP_403_FORBIDDEN)
            event         = json.loads(body)
            log.payload   = event
            log.event_type = event.get('event', '')
            log.processed  = gw.handle_event(event)
            log.save(update_fields=['payload', 'event_type', 'processed'])
            return Response({'status': 'ok'})
        except Exception as exc:
            log.error = str(exc)
            log.save(update_fields=['error'])
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
