"""
Vérification des tokens OAuth côté serveur.
Pour chaque provider j'appelle son API pour valider le token
et je retourne toujours le même format : {email, social_id, name}.
"""

import requests
from django.conf import settings


class SocialAuthError(Exception):
    pass


# ── Google ────────────────────────────────────────────────────────────────────

GOOGLE_USERINFO_URL  = 'https://www.googleapis.com/oauth2/v3/userinfo'
GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo'


def verify_google_token(token: str) -> dict:
    """
    Accepte soit un access_token (flux web SPA) soit un id_token (flux mobile).
    On essaie d'abord l'endpoint userinfo avec Bearer — c'est le cas web standard.
    Si ça échoue, on retombe sur tokeninfo pour la compatibilité mobile.
    """
    import logging
    logger = logging.getLogger(__name__)

    # Tentative 1 : access_token → userinfo (flux web)
    resp = requests.get(
        GOOGLE_USERINFO_URL,
        headers={'Authorization': f'Bearer {token}'},
        timeout=10,
    )
    logger.debug('Google userinfo status: %s — %s', resp.status_code, resp.text[:200])
    if resp.status_code == 200:
        data = resp.json()
        return {
            'email':     data.get('email'),
            'social_id': data.get('sub'),
            'name':      data.get('name', ''),
        }

    # Tentative 2 : id_token → tokeninfo (flux mobile / One-Tap)
    resp2 = requests.get(GOOGLE_TOKEN_INFO_URL, params={'id_token': token}, timeout=10)
    logger.debug('Google tokeninfo status: %s — %s', resp2.status_code, resp2.text[:200])
    if resp2.status_code != 200:
        raise SocialAuthError(
            f'Token Google invalide. userinfo={resp.status_code}, tokeninfo={resp2.status_code}'
        )

    data = resp2.json()
    client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
    if client_id and data.get('aud') != client_id:
        raise SocialAuthError('Token Google : audience incorrecte.')

    return {
        'email':     data.get('email'),
        'social_id': data.get('sub'),
        'name':      data.get('name', ''),
    }


# ── Facebook ──────────────────────────────────────────────────────────────────

FACEBOOK_GRAPH_URL = 'https://graph.facebook.com/me'


def verify_facebook_token(access_token: str) -> dict:
    # je requête le Graph API directement — faut que l'app Facebook ait la permission email
    resp = requests.get(
        FACEBOOK_GRAPH_URL,
        params={'fields': 'id,name,email', 'access_token': access_token},
        timeout=10,
    )
    if resp.status_code != 200:
        raise SocialAuthError('Token Facebook invalide.')

    data = resp.json()
    if 'error' in data:
        raise SocialAuthError(data['error'].get('message', 'Erreur Facebook.'))

    return {
        'email':     data.get('email'),
        'social_id': data.get('id'),
        'name':      data.get('name', ''),
    }


# ── Apple ─────────────────────────────────────────────────────────────────────

def verify_apple_token(identity_token: str) -> dict:
    # Apple envoie un JWT signé avec leurs clés RSA publiques
    # je les récupère depuis leur endpoint et je valide la signature moi-même
    # NB: APPLE_CLIENT_ID doit être défini dans settings (bundle ID de l'app)
    try:
        import jwt
        import base64
        from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicNumbers
        from cryptography.hazmat.backends import default_backend

        apple_keys_resp = requests.get('https://appleid.apple.com/auth/keys', timeout=10)
        apple_keys = apple_keys_resp.json()['keys']

        header  = jwt.get_unverified_header(identity_token)
        kid     = header.get('kid')
        key_data = next((k for k in apple_keys if k['kid'] == kid), None)
        if not key_data:
            raise SocialAuthError('Clé publique Apple introuvable pour ce kid.')

        def _b64_to_int(s):
            s += '=' * (4 - len(s) % 4)
            return int.from_bytes(base64.urlsafe_b64decode(s), 'big')

        public_key = RSAPublicNumbers(
            e=_b64_to_int(key_data['e']),
            n=_b64_to_int(key_data['n']),
        ).public_key(default_backend())

        payload = jwt.decode(
            identity_token,
            public_key,
            algorithms=['RS256'],
            audience=getattr(settings, 'APPLE_CLIENT_ID', ''),
        )
        return {
            'email':     payload.get('email'),
            'social_id': payload.get('sub'),
            'name':      '',
        }
    except SocialAuthError:
        raise
    except Exception as exc:
        raise SocialAuthError(f'Token Apple invalide : {exc}') from exc


# ── Dispatcher ────────────────────────────────────────────────────────────────

VERIFIERS = {
    'google':   verify_google_token,
    'facebook': verify_facebook_token,
    'apple':    verify_apple_token,
}


def verify_social_token(provider: str, token: str) -> dict:
    # point d'entrée unique — les vues n'ont pas à savoir quel provider est utilisé
    verifier = VERIFIERS.get(provider)
    if not verifier:
        raise SocialAuthError(f'Provider inconnu : {provider}')
    return verifier(token)
