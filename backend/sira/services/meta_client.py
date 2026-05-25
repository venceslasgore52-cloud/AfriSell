"""
Client Meta WhatsApp Cloud API — envoi de messages et parsing des webhooks.
Doc : https://developers.facebook.com/docs/whatsapp/cloud-api
"""
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

API_VERSION = getattr(settings, 'META_API_VERSION', 'v19.0')
BASE_URL    = f'https://graph.facebook.com/{API_VERSION}'


def send_whatsapp(to: str, body: str, phone_number_id: str = None) -> bool:
    """
    Envoie un message texte WhatsApp via Meta Cloud API.
    `to` : numéro E.164 (ex: +2250586524962) ou format whatsapp:+225...
    """
    token     = settings.META_ACCESS_TOKEN
    phone_id  = phone_number_id or settings.META_PHONE_NUMBER_ID
    recipient = to.replace('whatsapp:', '').lstrip('+')

    try:
        r = requests.post(
            f'{BASE_URL}/{phone_id}/messages',
            json = {
                'messaging_product': 'whatsapp',
                'to':                recipient,
                'type':              'text',
                'text':              {'body': body},
            },
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type':  'application/json',
            },
            timeout = 10,
        )
        if r.ok:
            msg_id = r.json().get('messages', [{}])[0].get('id', '')
            logger.info('Meta message envoyé → %s | ID: %s', recipient, msg_id)
            return True
        logger.error('Meta API error %s: %s', r.status_code, r.text)
        return False
    except Exception as exc:
        logger.error('Meta send error: %s', exc)
        return False


def parse_incoming(payload: dict) -> list[dict]:
    """
    Extrait les messages entrants du payload webhook Meta.
    Retourne une liste de dicts : {from, body, type, phone_number_id, latitude, longitude}
    """
    messages = []
    for entry in payload.get('entry', []):
        for change in entry.get('changes', []):
            value = change.get('value', {})
            phone_number_id = value.get('metadata', {}).get('phone_number_id', '')
            for msg in value.get('messages', []):
                from_  = msg.get('from', '')
                mtype  = msg.get('type', 'text')
                body   = ''
                lat, lng = None, None

                if mtype == 'text':
                    body = msg.get('text', {}).get('body', '')
                elif mtype == 'location':
                    lat  = msg.get('location', {}).get('latitude')
                    lng  = msg.get('location', {}).get('longitude')
                    body = f'Location: {lat},{lng}'
                elif mtype == 'audio':
                    body = msg.get('audio', {}).get('id', '')

                messages.append({
                    'from':            from_,
                    'body':            body,
                    'type':            mtype,
                    'phone_number_id': phone_number_id,
                    'latitude':        lat,
                    'longitude':       lng,
                })
    return messages
