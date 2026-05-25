"""
Génération de texte publicitaire via Gemini.
Je génère des légendes, descriptions et posts adaptés à chaque plateforme et langue.
"""
import logging

import google.generativeai as genai
from django.conf import settings

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)

PLATFORM_TIPS = {
    'whatsapp':  'Court, direct, avec émojis. Max 3 lignes + lien de commande.',
    'instagram': 'Accrocheur, storytelling, 3–5 hashtags pertinents à la fin.',
    'facebook':  "Convivial, informatif, appel à l'action clair. Peut être plus long.",
    'tiktok':    'Très court, punchy, avec trending hashtags. Max 150 caractères.',
    'general':   'Polyvalent, professionnel, peut être adapté à toutes les plateformes.',
}

_PROMPT_TEMPLATE = """\
Tu es un expert en marketing digital pour les commerçants africains.
Génère un texte publicitaire pour le produit suivant.

Produit : {product_name}
Prix : {price} XOF
Description : {description}
Boutique : {shop_name}
Plateforme cible : {platform}
Langue : {language}
Consignes plateforme : {platform_tips}
Instructions supplémentaires : {extra}

Retourne UNIQUEMENT le texte publicitaire, sans explication ni balise markdown.
"""


def generate_caption(product, platform: str = 'general', language: str = 'fr',
                     extra_instructions: str = '') -> str:
    """Je génère une légende publicitaire pour un produit sur une plateforme donnée."""
    prompt = _PROMPT_TEMPLATE.format(
        product_name  = product.name,
        price         = f'{product.effective_price:,.0f}',
        description   = product.description[:300] if product.description else 'Produit de qualité',
        shop_name     = product.tenant.shop.name if hasattr(product.tenant, 'shop') else '',
        platform      = platform,
        language      = language,
        platform_tips = PLATFORM_TIPS.get(platform, PLATFORM_TIPS['general']),
        extra         = extra_instructions or 'Aucune',
    )
    return _call_gemini(prompt)


def generate_description(product, language: str = 'fr') -> str:
    """Je génère une description produit longue pour le catalogue."""
    prompt = (
        f"Écris une description produit professionnelle et attrayante en {language} pour :\n"
        f"Produit : {product.name}\n"
        f"Catégorie : {product.display_category}\n"
        f"Prix : {product.effective_price:,.0f} XOF\n"
        f"Description existante : {product.description or 'Aucune'}\n\n"
        "La description doit faire 2–4 phrases, mettre en valeur les bénéfices, "
        "et inciter à l'achat. Retourne uniquement la description."
    )
    return _call_gemini(prompt)


def generate_smart_schedule_analysis(seller, platform: str) -> tuple[list, str]:
    """
    J'analyse les données de commandes pour suggérer les meilleurs créneaux de publication.
    Retourne (slots: list[dict], analysis: str).
    Plan Business uniquement.
    """
    from django.utils import timezone
    from datetime import timedelta
    from orders.models import Order
    from django.db.models import Count, functions

    since = timezone.now() - timedelta(days=90)
    orders = (
        Order.objects
        .filter(seller=seller, created_at__gte=since)
        .annotate(hour=functions.ExtractHour('created_at'),
                  weekday=functions.ExtractWeekDay('created_at'))
        .values('hour', 'weekday')
        .annotate(count=Count('id'))
        .order_by('-count')[:10]
    )

    DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    slots = [
        {'day': DAYS[r['weekday'] - 1], 'hour': r['hour'], 'orders': r['count']}
        for r in orders
    ]

    data_text = '\n'.join(
        f"- {s['day']} à {s['hour']}h : {s['orders']} commandes" for s in slots[:5]
    )

    prompt = (
        f"Analyse ces données de commandes reçues sur 90 jours pour un commerçant africain "
        f"qui veut publier sur {platform} :\n\n{data_text}\n\n"
        "Déduis les 3 meilleurs créneaux de publication (jour + heure) et explique pourquoi "
        "en 3–4 phrases. Sois direct et pratique. Réponds en français."
    )
    analysis = _call_gemini(prompt)
    return slots[:5], analysis


CONTENT_TYPE_TIPS = {
    'caption':     'Légende courte et percutante pour illustrer un produit sur les réseaux sociaux.',
    'promo':       'Message promotionnel pour une offre spéciale, réduction ou solde.',
    'whatsapp':    'Message WhatsApp court, direct, avec émojis. Max 3 lignes.',
    'description': 'Description produit professionnelle, 2–4 phrases, mettre en valeur les bénéfices.',
}


def generate_from_prompt(prompt: str, content_type: str = 'caption',
                         platform: str = 'general', language: str = 'fr',
                         extra: str = '') -> str:
    """Génère un texte publicitaire à partir d'un prompt libre (sans produit en base)."""
    type_tip     = CONTENT_TYPE_TIPS.get(content_type, CONTENT_TYPE_TIPS['caption'])
    platform_tip = PLATFORM_TIPS.get(platform, PLATFORM_TIPS['general'])

    full_prompt = (
        f"Tu es un expert en marketing digital pour les commerçants africains.\n"
        f"Type de contenu : {type_tip}\n"
        f"Plateforme : {platform} — {platform_tip}\n"
        f"Langue : {language}\n"
        f"Contexte fourni par le vendeur :\n{prompt}\n"
        + (f"Instructions supplémentaires : {extra}\n" if extra else "")
        + "\nRetourne UNIQUEMENT le texte publicitaire, sans explication ni balise markdown."
    )
    return _call_groq(full_prompt)


def _call_groq(prompt: str) -> str:
    try:
        from groq import Groq
        from django.conf import settings as django_settings
        client = Groq(api_key=django_settings.GROQ_API_KEY)
        resp = client.chat.completions.create(
            model=getattr(django_settings, 'GROQ_MODEL', 'llama-3.3-70b-versatile'),
            messages=[{'role': 'user', 'content': prompt}],
            temperature=0.7,
            max_tokens=512,
        )
        return resp.choices[0].message.content.strip()
    except Exception as exc:
        logger.error('Groq text_gen error: %s', exc)
        return ''


def _call_gemini(prompt: str) -> str:
    try:
        model  = genai.GenerativeModel('gemini-1.5-flash')
        result = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                max_output_tokens=512,
            ),
        )
        return result.text.strip()
    except Exception as exc:
        logger.error('Gemini text_gen error: %s', exc)
        return ''
