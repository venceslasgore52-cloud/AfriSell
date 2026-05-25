"""
Interface Groq — alternative gratuite à Gemini.
Modèle : llama-3.3-70b-versatile (gratuit, ~1 000 req/jour).
API compatible OpenAI — même format JSON en sortie que gemini.py.
"""
import json
import logging

from django.conf import settings
from groq import Groq

logger = logging.getLogger(__name__)

_client: Groq | None = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


_SYSTEM_TEMPLATE = """\
Tu es SIRA, l'assistant commercial intelligent de la boutique « {shop_name} ».
Tu réponds en {language}.
Tu es chaleureux, professionnel et concis. Tu utilises les emojis avec modération.

== Catalogue disponible ==
{catalogue_text}

== État actuel de la conversation ==
État : {state}
Produit sélectionné : {selected_product}
Quantité : {quantity}

== Instructions ==
- Si le client salue ou arrive pour la première fois → accueille-le et montre le catalogue
- Si le client sélectionne un produit → confirme et demande la quantité
- Si la quantité est confirmée → montre le récapitulatif et demande confirmation
- Si le client confirme la commande → demande sa localisation (lien Google Maps ou partage de position)
- Si le client demande un prix → réponds précisément depuis le catalogue
- Réponds TOUJOURS en JSON valide, sans markdown, sans texte autour :
{{
  "intent": "<intent parmi la liste>",
  "product_id": "<UUID du produit choisi ou null>",
  "quantity": <entier ou null>,
  "response": "<texte à envoyer au client>"
}}

Intents possibles : {intents}
"""

INTENT_CHOICES = [
    'greeting', 'browse_catalogue', 'select_product', 'set_quantity',
    'confirm_order', 'reject_order', 'ask_price', 'ask_availability',
    'share_location', 'cancel', 'help', 'unknown',
]


def analyze_and_respond(conversation, message_text: str, products: list) -> dict:
    catalogue_text = _format_catalogue(products)
    selected = (
        f'{conversation.selected_product.name} ({conversation.selected_product.effective_price} XOF)'
        if conversation.selected_product else 'Aucun'
    )
    config   = getattr(conversation.shop, 'sira_config', None)
    language = config.language if config else 'fr'

    system_prompt = _SYSTEM_TEMPLATE.format(
        shop_name        = conversation.shop.name,
        language         = language,
        catalogue_text   = catalogue_text,
        state            = conversation.get_state_display(),
        selected_product = selected,
        quantity         = conversation.quantity,
        intents          = ', '.join(INTENT_CHOICES),
    )

    try:
        model_name = getattr(settings, 'GROQ_MODEL', 'llama-3.3-70b-versatile')
        completion = _get_client().chat.completions.create(
            model    = model_name,
            messages = [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user',   'content': f'Message client : {message_text}'},
            ],
            response_format = {'type': 'json_object'},
            temperature     = 0.3,
            max_tokens      = 512,
        )
        data = json.loads(completion.choices[0].message.content)
        data.setdefault('intent',     'unknown')
        data.setdefault('product_id', None)
        data.setdefault('quantity',   None)
        data.setdefault('response',   _fallback_response(language))
        return data

    except Exception as exc:
        logger.error('Groq error: %s', exc)
        return {
            'intent':     'unknown',
            'product_id': None,
            'quantity':   None,
            'response':   _fallback_response(language),
        }


def _format_catalogue(products: list) -> str:
    if not products:
        return 'Aucun produit disponible pour le moment.'
    lines = []
    for i, p in enumerate(products, start=1):
        price = f'{p.effective_price} XOF'
        stock = '✅' if p.in_stock else '❌ rupture'
        lines.append(f'{i}. *{p.name}* — {price} {stock}')
        if p.description:
            lines.append(f'   _{p.description[:80]}_')
    return '\n'.join(lines)


def _fallback_response(language: str) -> str:
    messages = {
        'fr':     "Désolé, je n'ai pas bien compris. Tapez *catalogue* pour voir nos produits ou *aide* pour de l'assistance.",
        'en':     "Sorry, I didn't understand. Type *catalogue* to browse our products or *help* for assistance.",
        'dioula': "Mɛ̀ n'ye ko minnu ɲɛfɔ. Sɛbɛn *catalogue* walima *dɛmɛ*.",
        'wolof':  "Bàyyil ma xamul. Bind *catalogue* ngir xool nit ñi.",
    }
    return messages.get(language, messages['fr'])
