"""
Dispatcher unifié — les vues n'appellent que ce fichier.
C'est aussi ici que je centralise toute la logique de devise.
"""

from .stripe_gateway    import StripeGateway
from .cinetpay_gateway  import CinetPayGateway
from .geniuspay_gateway import GeniusPayGateway


class GatewayError(Exception):
    pass


GATEWAYS = {
    'stripe':        StripeGateway,
    'carte_bancaire': StripeGateway,  # carte = Stripe card form
    'google_pay':    StripeGateway,   # Google Pay via Stripe
    'cinetpay':      CinetPayGateway,
    'geniuspay':     GeniusPayGateway,
}

# pays qui utilisent le XOF — CinetPay et GeniusPay opèrent dans cette zone
XOF_COUNTRIES = {'CI', 'SN', 'ML', 'BF', 'GN', 'TG', 'BJ', 'NE', 'CM', 'CG'}

# taux fixe : le XOF est arrimé à l'euro, 1 USD ≈ 600 XOF
USD_TO_XOF = 600


def get_gateway(provider: str):
    cls = GATEWAYS.get(provider)
    if not cls:
        raise GatewayError(f'Provider inconnu : {provider}')
    return cls()


def detect_gateway_for_user(user) -> str:
    """
    Je choisis le provider selon le pays de la boutique.
    Zone XOF → GeniusPay (en attente de validation CinetPay, même flow)
    Reste     → Stripe
    """
    shop = getattr(user, 'shop', None)
    if shop and shop.country in XOF_COUNTRIES:
        return 'geniuspay'
    return 'stripe'


def get_amount_and_currency(plan, country: str, provider: str) -> tuple:
    """
    Je retourne (montant, devise) selon le pays et le provider.

    Logique :
    - CinetPay / GeniusPay → toujours XOF, je convertis price_africa depuis USD
    - Stripe Afrique       → price_africa en USD
    - Stripe reste monde   → price_global en USD
    """
    if provider in ('cinetpay', 'geniuspay'):  # Mobile Money → XOF
        # je convertis en XOF — CinetPay n'accepte que des entiers
        amount = int(plan.price_africa * USD_TO_XOF)
        return amount, 'XOF'

    # Stripe — je garde USD
    if country in XOF_COUNTRIES or country in {'GH', 'NG', 'KE', 'TZ', 'ET', 'RW'}:
        return plan.price_africa, 'USD'

    return plan.price_global, 'USD'
