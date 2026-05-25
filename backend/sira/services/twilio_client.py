"""
Client Twilio — envoi de messages WhatsApp et validation de signature.
"""
import logging

from django.conf import settings
from twilio.rest import Client

logger = logging.getLogger(__name__)

# je garde une instance unique du client (thread-safe)
_client: Client | None = None


def _get_client() -> Client:
    global _client
    if _client is None:
        _client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    return _client


def send_whatsapp(to: str, body: str, from_number: str | None = None) -> str | None:
    """
    J'envoie un message WhatsApp via Twilio REST API.
    Retourne le SID Twilio ou None en cas d'erreur.
    to / from_number : numéros E.164 (sans préfixe 'whatsapp:') ou avec.
    """
    def _wa(number: str) -> str:
        return number if number.startswith('whatsapp:') else f'whatsapp:{number}'

    from_wa = _wa(from_number or settings.TWILIO_WHATSAPP_NUMBER)
    to_wa   = _wa(to)

    try:
        msg = _get_client().messages.create(from_=from_wa, to=to_wa, body=body)
        logger.info('Twilio message sent — SID: %s → %s', msg.sid, to_wa)
        return msg.sid
    except Exception as exc:
        logger.error('Twilio send error to %s: %s', to_wa, exc)
        return None


def validate_signature(request) -> bool:
    """
    Je vérifie la signature Twilio pour m'assurer que la requête vient bien de Twilio.
    À utiliser en production — je bypasse en DEBUG.
    """
    from twilio.request_validator import RequestValidator
    validator = RequestValidator(settings.TWILIO_AUTH_TOKEN)
    url       = request.build_absolute_uri()
    signature = request.META.get('HTTP_X_TWILIO_SIGNATURE', '')
    return validator.validate(url, request.POST.dict(), signature)
