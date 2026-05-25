"""
Routeur LLM — sélectionne le fournisseur d'IA selon SIRA_LLM_PROVIDER dans settings.
Valeurs acceptées : 'gemini' (défaut), 'groq', 'openai'.
"""
from django.conf import settings


def analyze_and_respond(conversation, message_text: str, products: list) -> dict:
    provider = getattr(settings, 'SIRA_LLM_PROVIDER', 'gemini').lower()

    if provider == 'groq':
        from .groq_client import analyze_and_respond as _fn
    elif provider == 'openai':
        from .openai_client import analyze_and_respond as _fn
    else:
        from .gemini import analyze_and_respond as _fn

    return _fn(conversation, message_text, products)
