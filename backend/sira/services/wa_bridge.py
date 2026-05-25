"""
Client WA-Bridge — envoie les messages WhatsApp via le bridge Node.js local.
Remplacé par l'API Meta officielle en production.
"""
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

BRIDGE_URL    = getattr(settings, 'WA_BRIDGE_URL', 'http://127.0.0.1:3000')
BRIDGE_SECRET = getattr(settings, 'WA_BRIDGE_SECRET', '')


def send_whatsapp(shop_id: str, to: str, body: str) -> bool:
    try:
        r = requests.post(
            f'{BRIDGE_URL}/send',
            json    = {'shop_id': str(shop_id), 'to': to, 'body': body},
            headers = {'X-Bridge-Secret': BRIDGE_SECRET},
            timeout = 10,
        )
        if r.ok:
            return True
        logger.error('WA-Bridge send error: %s', r.text)
        return False
    except Exception as exc:
        logger.error('WA-Bridge unreachable: %s', exc)
        return False


def start_session(shop_id: str) -> dict:
    """Démarre une session et retourne {'status': ..., 'qr': 'data:image/png;base64,...'}"""
    try:
        r = requests.post(
            f'{BRIDGE_URL}/session/start',
            json    = {'shop_id': str(shop_id)},
            headers = {'X-Bridge-Secret': BRIDGE_SECRET},
            timeout = 20,
        )
        return r.json()
    except Exception as exc:
        logger.error('WA-Bridge start_session error: %s', exc)
        return {'error': str(exc)}


def session_status(shop_id: str) -> dict:
    try:
        r = requests.get(
            f'{BRIDGE_URL}/session/{shop_id}/status',
            headers = {'X-Bridge-Secret': BRIDGE_SECRET},
            timeout = 5,
        )
        return r.json()
    except Exception as exc:
        return {'status': 'unreachable', 'error': str(exc)}
