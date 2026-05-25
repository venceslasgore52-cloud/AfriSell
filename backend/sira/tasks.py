"""
Tâches Celery SIRA.
process_inbound_message est le point d'entrée principal déclenché par le webhook Twilio.
Je traite le message en arrière-plan pour ne pas bloquer la réponse HTTP à Twilio.
"""
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def process_inbound_message(self, *, shop_id: str, client_phone: str,
                             body: str, media_url: str = '',
                             media_type: str = '', raw_payload: dict):
    """
    Je traite un message WhatsApp entrant depuis le début jusqu'à la réponse.
    Ordre des opérations :
      1. Je charge la boutique et je vérifie que SIRA est actif
      2. Si audio → je transcris avec Whisper
      3. J'appelle le handler (état machine + Gemini)
      4. J'envoie la réponse via Twilio REST API
    """
    from accounts.models import Shop
    from .models import SiraConfig
    from .handler import handle_message
    from .services.twilio_client import send_whatsapp

    try:
        shop = Shop.objects.select_related('user', 'sira_config').get(id=shop_id)
    except Shop.DoesNotExist:
        logger.error('process_inbound_message: shop %s not found', shop_id)
        return

    # je vérifie que SIRA est activé et que le plan le permet
    config = getattr(shop, 'sira_config', None)
    if not config or not config.is_enabled:
        logger.info('SIRA désactivé pour %s', shop.name)
        return

    sub = getattr(shop.user, 'subscription', None)
    if not (sub and sub.is_active and sub.plan.has_sira_bot):
        logger.info('Plan sans SIRA pour %s', shop.name)
        return

    # je vérifie les horaires d'ouverture
    if not config.is_open():
        send_whatsapp(
            to          = client_phone,
            body        = config.out_of_hours_message,
            from_number = config.twilio_number or None,
        )
        return

    # ── transcription audio ───────────────────────────────────────────────────
    effective_body = body
    message_type   = 'text'

    if media_url and _is_audio(media_type):
        message_type = 'audio'
        transcription = _transcribe(media_url, config.language)
        if transcription:
            effective_body = transcription
        else:
            # je demande au client de retaper son message si la transcription a échoué
            language = config.language
            sorry = {
                'fr': "Désolé, je n'ai pas pu comprendre ton message vocal. Peux-tu l'écrire ?",
                'en': "Sorry, I couldn't process your voice message. Can you type it?",
            }
            send_whatsapp(
                to          = client_phone,
                body        = sorry.get(language, sorry['fr']),
                from_number = config.twilio_number or None,
            )
            return

    # ── handler principal ─────────────────────────────────────────────────────
    try:
        response_text = handle_message(
            shop         = shop,
            client_phone = client_phone,
            body         = effective_body,
            post_data    = raw_payload,
        )
    except Exception as exc:
        logger.exception('SIRA handler error pour %s: %s', client_phone, exc)
        raise self.retry(exc=exc)

    # ── envoi de la réponse ───────────────────────────────────────────────────
    provider = getattr(config, 'wa_provider', 'twilio') or 'twilio'

    if provider == 'meta':
        from .services.meta_client import send_whatsapp as meta_send
        ok = meta_send(to=client_phone, body=response_text,
                       phone_number_id=config.meta_phone_number_id or None)
        if not ok:
            raise self.retry(exc=RuntimeError('Meta send failed'))
    elif provider == 'bridge':
        ok = _send_via_bridge(str(shop.id), client_phone, response_text)
        if not ok:
            raise self.retry(exc=RuntimeError('WA-Bridge send failed'))
    else:
        sid = send_whatsapp(
            to          = client_phone,
            body        = response_text,
            from_number = config.twilio_number or None,
        )
        if not sid:
            logger.error('Twilio send failed pour %s', client_phone)
            raise self.retry(exc=RuntimeError('Twilio send failed'))

    logger.info('SIRA → %s | SID: %s', client_phone, sid)


@shared_task
def close_stale_conversations(hours: int = 24):
    """
    Je ferme les conversations en attente depuis plus de `hours` heures.
    Une conversation stale bloque le client qui voudrait recommencer.
    Lancé une fois par jour.
    """
    from datetime import timedelta
    from django.utils import timezone
    from .models import SiraConversation

    cutoff = timezone.now() - timedelta(hours=hours)
    updated = (
        SiraConversation.objects
        .filter(last_message_at__lt=cutoff)
        .exclude(state__in=('completed', 'cancelled'))
        .update(state='cancelled')
    )
    logger.info('close_stale_conversations: %d conversations fermées', updated)
    return updated


# ── Helpers ───────────────────────────────────────────────────────────────────

def _send_via_bridge(shop_id: str, to: str, body: str) -> bool:
    from .services.wa_bridge import send_whatsapp as bridge_send
    return bridge_send(shop_id, to, body)


def _is_audio(media_type: str) -> bool:
    return media_type.startswith('audio/')


def _transcribe(media_url: str, language: str) -> str:
    from .services.whisper import transcribe
    return transcribe(media_url, language=language)
