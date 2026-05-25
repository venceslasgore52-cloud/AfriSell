"""
Suppression de fond d'image — plan Business uniquement.
J'utilise l'API remove.bg (50 crédits/mois gratuits).
Fallback : rembg (local, si installé et REMOVE_BG_USE_LOCAL=True).
"""
import io
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def remove_background(image_bytes: bytes, filename: str = 'image.png') -> bytes:
    """
    Je supprime le fond de l'image et retourne les bytes PNG avec transparence.
    Lève ValueError si aucune méthode n'est configurée.
    """
    use_local = getattr(settings, 'REMOVE_BG_USE_LOCAL', False)

    if use_local:
        return _remove_bg_local(image_bytes)

    api_key = getattr(settings, 'REMOVE_BG_API_KEY', '')
    if not api_key:
        raise ValueError(
            'Suppression de fond non configurée. '
            'Définis REMOVE_BG_API_KEY ou active REMOVE_BG_USE_LOCAL dans settings.'
        )
    return _remove_bg_api(image_bytes, api_key, filename)


def _remove_bg_api(image_bytes: bytes, api_key: str, filename: str) -> bytes:
    """J'appelle l'API remove.bg — simple, rapide, sans GPU."""
    response = requests.post(
        'https://api.remove.bg/v1.0/removebg',
        files={'image_file': (filename, image_bytes)},
        data={'size': 'auto'},
        headers={'X-Api-Key': api_key},
        timeout=30,
    )
    if response.status_code == 200:
        return response.content
    raise RuntimeError(
        f'remove.bg API error {response.status_code}: {response.text[:200]}'
    )


def _remove_bg_local(image_bytes: bytes) -> bytes:
    """
    J'utilise rembg localement — pas de réseau mais nécessite onnxruntime (~170 MB).
    pip install rembg[cpu]
    """
    try:
        from rembg import remove
        output = remove(image_bytes)
        return output
    except ImportError:
        raise ImportError(
            "rembg n'est pas installé. "
            'Lance : pip install "rembg[cpu]" ou désactive REMOVE_BG_USE_LOCAL.'
        )
