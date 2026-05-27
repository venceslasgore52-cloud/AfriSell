"""
Dispatcher unifié — les vues n'appellent que ce fichier.
"""

from .stripe_gateway   import StripeGateway
from .cinetpay_gateway import CinetPayGateway
from .paystack_gateway import PaystackGateway


class GatewayError(Exception):
    pass


GATEWAYS = {
    'stripe':         StripeGateway,
    'carte_bancaire': StripeGateway,   # carte = Stripe card form
    'google_pay':     StripeGateway,   # Google Pay via Stripe
    'cinetpay':       CinetPayGateway,
    'paystack':       PaystackGateway,
}

# pays XOF — CinetPay opère dans cette zone
XOF_COUNTRIES = {'CI', 'SN', 'ML', 'BF', 'GN', 'TG', 'BJ', 'NE', 'CM', 'CG'}

# pays Paystack (NGN, GHS, KES, ZAR)
PAYSTACK_COUNTRIES = {'NG', 'GH', 'KE', 'ZA', 'RW', 'TZ', 'ET'}

USD_TO_XOF = 600


def get_gateway(provider: str):
    cls = GATEWAYS.get(provider)
    if not cls:
        raise GatewayError(f'Provider inconnu : {provider}')
    return cls()


def detect_gateway_for_user(user) -> str:
    shop    = getattr(user, 'shop', None)
    country = shop.country if shop else ''
    if country in XOF_COUNTRIES:
        return 'cinetpay'
    if country in PAYSTACK_COUNTRIES:
        return 'paystack'
    return 'stripe'


def get_amount_and_currency(plan, country: str, provider: str) -> tuple:
    if provider == 'cinetpay':
        return int(plan.price_africa * USD_TO_XOF), 'XOF'

    if provider == 'paystack':
        # Paystack supporte NGN, GHS, KES, ZAR, USD
        CURRENCY_MAP = {'NG': 'NGN', 'GH': 'GHS', 'KE': 'KES', 'ZA': 'ZAR'}
        currency = CURRENCY_MAP.get(country, 'USD')
        # pour simplifier on reste en USD — Paystack l'accepte
        return plan.price_africa, 'USD'

    # Stripe
    if country in XOF_COUNTRIES or country in PAYSTACK_COUNTRIES:
        return plan.price_africa, 'USD'

    return plan.price_global, 'USD'
