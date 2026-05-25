"""
Transcription audio via OpenAI Whisper API (V1).
Je télécharge le fichier audio depuis Twilio et je le transcris.
V2 : réponse vocale synthétisée (TTS) — hors scope pour l'instant.
"""
import logging
import os
import tempfile

import requests
from django.conf import settings
from openai import OpenAI

logger = logging.getLogger(__name__)

_openai_client: OpenAI | None = None


def _get_openai() -> OpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _openai_client


def transcribe(media_url: str, language: str = 'fr') -> str:
    """
    Je télécharge l'audio depuis Twilio et je le transcris avec Whisper.
    Twilio protège les URLs média — j'utilise les credentials du compte.
    Retourne le texte transcrit ou '' en cas d'erreur.
    """
    try:
        # je télécharge l'audio avec les credentials Twilio
        response = requests.get(
            media_url,
            auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
            timeout=30,
        )
        response.raise_for_status()

        # je détecte l'extension depuis le Content-Type
        content_type = response.headers.get('Content-Type', 'audio/ogg')
        ext = _ext_from_content_type(content_type)

        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(response.content)
            tmp_path = tmp.name

        try:
            with open(tmp_path, 'rb') as audio_file:
                transcript = _get_openai().audio.transcriptions.create(
                    model='whisper-1',
                    file=audio_file,
                    language=language if language in ('fr', 'en') else 'fr',
                )
            logger.info('Whisper transcription: %s chars', len(transcript.text))
            return transcript.text
        finally:
            os.unlink(tmp_path)

    except Exception as exc:
        logger.error('Whisper transcription error: %s', exc)
        return ''


def _ext_from_content_type(content_type: str) -> str:
    mapping = {
        'audio/ogg':  '.ogg',
        'audio/mpeg': '.mp3',
        'audio/mp4':  '.mp4',
        'audio/amr':  '.amr',
        'audio/wav':  '.wav',
    }
    for mime, ext in mapping.items():
        if mime in content_type:
            return ext
    return '.ogg'  # WhatsApp envoie du OGG par défaut
