"""
Machine à états SIRA — cœur de la logique conversationnelle.
Je traite chaque message entrant, fais évoluer l'état de la conversation
et retourne le texte de réponse à envoyer au client.
"""
import logging
import uuid

from django.db import transaction
from django.utils import timezone

from catalogue.models import Product
from notifications.utils import notify
from orders.models import Order, OrderItem

from .models import SiraConversation, SiraMessage
from .services.llm import analyze_and_respond
from .services.location import extract_coords, is_location_message

logger = logging.getLogger(__name__)

# ── États qui permettent de recommencer une nouvelle commande ─────────────────
TERMINAL_STATES = {'completed', 'cancelled'}

# ── Intents qui font avancer la commande ─────────────────────────────────────
_CONFIRM_INTENTS  = {'confirm_order'}
_REJECT_INTENTS   = {'reject_order', 'cancel'}
_PRODUCT_INTENTS  = {'select_product'}
_QUANTITY_INTENTS = {'set_quantity'}


def handle_message(shop, client_phone: str, body: str, post_data: dict) -> str:
    """
    Point d'entrée principal.
    Je récupère (ou crée) la conversation, je traite le message et je retourne la réponse.
    """
    conversation = _get_or_create_conversation(shop, client_phone)

    # si la conversation est terminée, je la réinitialise pour une nouvelle commande
    if conversation.state in TERMINAL_STATES:
        conversation.reset()

    # ── Cas 1 : position GPS ──────────────────────────────────────────────────
    if is_location_message(post_data) or _contains_maps_link(body):
        return _handle_location(conversation, body, post_data)

    # ── Cas 2 : audio → pas encore transcrit ici (fait en Celery avant) ───────
    # le body contient déjà la transcription Whisper quand on arrive ici

    # ── Cas 3 : message texte → Gemini ───────────────────────────────────────
    products = _get_active_products(shop)
    result   = analyze_and_respond(conversation, body, products)

    intent      = result.get('intent', 'unknown')
    product_id  = result.get('product_id')
    quantity    = result.get('quantity')
    response    = result.get('response', '')

    # je log le message entrant
    _save_message(conversation, 'inbound', body, intent=intent)

    # ── Transitions d'état ────────────────────────────────────────────────────
    response = _apply_transition(conversation, intent, product_id, quantity, response, products)

    # je log la réponse SIRA
    _save_message(conversation, 'outbound', response)

    return response


# ── Transitions ───────────────────────────────────────────────────────────────

def _apply_transition(conversation, intent, product_id, quantity, response, products) -> str:
    state = conversation.state

    if intent in _REJECT_INTENTS:
        conversation.state = 'cancelled' if intent == 'cancel' else 'browsing'
        if conversation.state == 'browsing':
            conversation.selected_product = None
            conversation.quantity = 1
        conversation.save()
        return response

    if state == 'idle':
        # premier contact → je passe en navigation catalogue
        conversation.state = 'browsing'
        conversation.save()
        return response

    if state == 'browsing':
        if intent in _PRODUCT_INTENTS and product_id:
            product = _find_product(products, product_id)
            if product and product.in_stock:
                conversation.selected_product = product
                conversation.quantity = int(quantity or 1)
                conversation.state = 'selecting'
                conversation.save()
            # la réponse vient de Gemini (confirme produit + demande quantité)
        return response

    if state == 'selecting':
        if intent in _QUANTITY_INTENTS and quantity:
            conversation.quantity = max(1, int(quantity))
            conversation.state = 'confirming'
            conversation.save()
        elif intent in _CONFIRM_INTENTS:
            # le client confirme sans changer la quantité
            conversation.state = 'confirming'
            conversation.save()
        return response

    if state == 'confirming':
        if intent in _CONFIRM_INTENTS:
            conversation.state = 'awaiting_location'
            conversation.save()
        return response

    if state == 'awaiting_location':
        # on est là si le client envoie un texte au lieu de sa position
        # Gemini a déjà généré la relance "envoie ta position"
        return response

    # états browse / unknown → réponse Gemini sans transition
    conversation.save()
    return response


def _handle_location(conversation, body: str, post_data: dict) -> str:
    """Je traite la position reçue et je crée la commande si tout est prêt."""
    lat, lng = extract_coords(post_data, body)

    if lat is None or lng is None:
        return _location_not_found_message(conversation)

    if conversation.state not in ('awaiting_location', 'confirming'):
        # localisation reçue trop tôt → je la stocke et je continue normalement
        conversation.client_latitude  = lat
        conversation.client_longitude = lng
        conversation.save()
        config   = getattr(conversation.shop, 'sira_config', None)
        language = config.language if config else 'fr'
        return _unexpected_location_ack(language)

    conversation.client_latitude  = lat
    conversation.client_longitude = lng
    conversation.save()

    _save_message(conversation, 'inbound', body, message_type='location')

    # je crée la commande si un produit est sélectionné
    if conversation.selected_product:
        response = _create_order(conversation)
    else:
        # pas de produit → je reviens au catalogue
        conversation.state = 'browsing'
        conversation.save()
        response = _location_no_product_message(conversation)

    _save_message(conversation, 'outbound', response)
    return response


@transaction.atomic
def _create_order(conversation) -> str:
    """Je crée la commande Order + OrderItem et je notifie le vendeur."""
    product  = conversation.selected_product
    quantity = conversation.quantity
    seller   = conversation.shop.user

    order = Order.objects.create(
        seller           = seller,
        source           = 'sira_whatsapp',
        client_name      = conversation.client_name or 'Client WhatsApp',
        client_phone     = _clean_phone(conversation.client_phone),
        client_whatsapp  = conversation.client_phone,
        client_latitude  = conversation.client_latitude,
        client_longitude = conversation.client_longitude,
        client_note      = conversation.client_note,
        currency         = 'XOF',
    )

    OrderItem.objects.create(
        order         = order,
        product       = product,
        product_name  = product.name,
        product_price = product.effective_price,
        quantity      = quantity,
    )

    order.compute_total()

    # je lie la conversation à la commande
    conversation.order = order
    conversation.state = 'completed'
    conversation.save()

    # je notifie le vendeur
    notify(
        recipient  = seller,
        notif_type = 'order_received',
        title      = f'Nouvelle commande SIRA — {order.reference}',
        message    = f'{quantity}× {product.name} · {order.total_amount} XOF · {order.client_phone}',
        level      = 'success',
        obj        = order,
    )

    return _build_confirmation_message(conversation, order)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_or_create_conversation(shop, client_phone: str) -> SiraConversation:
    """Je retourne la conversation active ou j'en crée une nouvelle."""
    conv = (
        SiraConversation.objects
        .filter(shop=shop, client_phone=client_phone)
        .exclude(state__in=TERMINAL_STATES)
        .order_by('-last_message_at')
        .first()
    )
    if not conv:
        conv = SiraConversation.objects.create(
            shop=shop,
            client_phone=client_phone,
            state='idle',
        )
    return conv


def _get_active_products(shop):
    return list(
        Product.objects
        .filter(tenant=shop.user, statut='active')
        .order_by('name')[:30]  # je limite pour ne pas saturer le prompt Gemini
    )


def _find_product(products, product_id: str):
    try:
        uid = uuid.UUID(product_id)
    except (ValueError, AttributeError):
        return None
    return next((p for p in products if p.id == uid), None)


def _save_message(conversation, direction: str, body: str,
                  message_type: str = 'text', intent: str = '') -> SiraMessage:
    return SiraMessage.objects.create(
        conversation = conversation,
        direction    = direction,
        message_type = message_type,
        body         = body,
        intent       = intent,
    )


def _contains_maps_link(text: str) -> bool:
    return 'maps.google.com' in text or 'google.com/maps' in text


def _clean_phone(whatsapp_number: str) -> str:
    """Je retire le préfixe 'whatsapp:' pour stocker juste le numéro."""
    return whatsapp_number.replace('whatsapp:', '')


def _build_confirmation_message(conversation, order) -> str:
    config = getattr(conversation.shop, 'sira_config', None)
    if not config:
        template = SiraConfig_defaults()['order_confirmation_message']
    else:
        template = config.order_confirmation_message

    return template.format(
        product_name = order.items.first().product_name if order.items.exists() else '',
        quantity     = conversation.quantity,
        total        = f'{order.total_amount:,.0f}',
        reference    = order.reference,
    )


def SiraConfig_defaults() -> dict:
    from .models import SiraConfig
    return {f.name: f.default for f in SiraConfig._meta.get_fields() if hasattr(f, 'default')}


def _location_not_found_message(conversation) -> str:
    config   = getattr(conversation.shop, 'sira_config', None)
    language = config.language if config else 'fr'
    messages = {
        'fr': "Je n'ai pas pu lire ta position 📍\nEnvoie-moi un lien Google Maps ou utilise le bouton *Partager ma position* de WhatsApp.",
        'en': "I couldn't read your location 📍\nPlease share a Google Maps link or use WhatsApp's *Share Location* button.",
    }
    return messages.get(language, messages['fr'])


def _unexpected_location_ack(language: str) -> str:
    messages = {
        'fr': "📍 Position reçue ! Dis-moi ce que tu souhaites commander.",
        'en': "📍 Location received! Tell me what you'd like to order.",
    }
    return messages.get(language, messages['fr'])


def _location_no_product_message(conversation) -> str:
    config   = getattr(conversation.shop, 'sira_config', None)
    language = config.language if config else 'fr'
    config_intro = config.catalogue_intro if config else ''
    messages = {
        'fr': "Merci pour ta position ! Dis-moi quel produit tu souhaites commander 🛍️",
        'en': "Thanks for your location! Tell me which product you'd like 🛍️",
    }
    return messages.get(language, messages['fr'])
