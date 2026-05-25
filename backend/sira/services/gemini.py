"""
Interface Gemini — analyse d'intention + génération de réponse.
J'utilise gemini-1.5-flash : rapide, gratuit jusqu'à 1 500 req/jour.
"""
import json
import logging

import google.generativeai as genai
from django.conf import settings

logger = logging.getLogger(__name__)

# je configure la clé une seule fois au chargement du module
genai.configure(api_key=settings.GEMINI_API_KEY)

INTENT_CHOICES = [
    'greeting',          # bonjour, salut, hello
    'browse_catalogue',  # voir produits, catalogue, qu'est-ce que vous avez
    'select_product',    # je veux X, commander X, numéro 2
    'set_quantity',      # 3 pièces, deux, j'en veux 5
    'confirm_order',     # oui, d'accord, confirmer, ok, c'est bon
    'reject_order',      # non, annuler, changer, autre chose
    'ask_price',         # c'est combien, quel prix, tarif
    'ask_availability',  # vous avez encore, en stock
    'share_location',    # lien maps ou message de type position
    'cancel',            # annuler, stop, quitter
    'help',              # aide, comment ça marche
    'unknown',           # tout le reste
]

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
- Réponds TOUJOURS en JSON valide, sans markdown, sans explication autour :
{{
  "intent": "<intent parmi la liste>",
  "product_id": "<UUID du produit choisi ou null>",
  "quantity": <entier ou null>,
  "response": "<texte à envoyer au client>"
}}

Intents possibles : {intents}
"""


def analyze_and_respond(conversation, message_text: str, products: list) -> dict:
    """
    J'analyse le message du client et je génère une réponse adaptée à l'état de la conversation.
    Retourne un dict avec : intent, product_id, quantity, response.
    """
    catalogue_text = _format_catalogue(products)
    selected = (
        f'{conversation.selected_product.name} ({conversation.selected_product.effective_price} XOF)'
        if conversation.selected_product else 'Aucun'
    )
    config = getattr(conversation.shop, 'sira_config', None)
    language = config.language if config else 'fr'

    prompt = _SYSTEM_TEMPLATE.format(
        shop_name       = conversation.shop.name,
        language        = language,
        catalogue_text  = catalogue_text,
        state           = conversation.get_state_display(),
        selected_product = selected,
        quantity        = conversation.quantity,
        intents         = ', '.join(INTENT_CHOICES),
    )

    try:
        model  = genai.GenerativeModel('gemini-1.5-flash')
        result = model.generate_content(
            f"{prompt}\n\nMessage client : {message_text}",
            generation_config=genai.GenerationConfig(
                response_mime_type='application/json',
                temperature=0.3,
                max_output_tokens=512,
            ),
        )
        data = json.loads(result.text)
        # je m'assure que les champs obligatoires sont là
        data.setdefault('intent', 'unknown')
        data.setdefault('product_id', None)
        data.setdefault('quantity', None)
        data.setdefault('response', _fallback_response(language))
        return data

    except Exception as exc:
        logger.error('Gemini error: %s', exc)
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
