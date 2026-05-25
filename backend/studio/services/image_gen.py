"""
Génération de flyers produit via Pillow.
Je crée un visuel 1080×1080 (carré Instagram) prêt à publier.
Pas de GPU requis — Pillow pur.
"""
import io
import logging
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

logger = logging.getLogger(__name__)

# ── Palette AfriSell ──────────────────────────────────────────────────────────
COLOR_ORANGE = (255, 107, 53)    # #FF6B35
COLOR_DARK   = (26, 26, 46)      # #1A1A2E
COLOR_WHITE  = (255, 255, 255)
COLOR_YELLOW = (255, 214, 10)    # accent prix
COLOR_GRAY   = (107, 114, 128)

SIZE = 1080  # px — carré Instagram/Facebook


def create_flyer(product, output_format: str = 'PNG') -> bytes:
    """
    Je génère un flyer 1080×1080 pour un produit.
    Retourne les bytes de l'image.
    """
    img  = Image.new('RGB', (SIZE, SIZE), COLOR_DARK)
    draw = ImageDraw.Draw(img)

    # ── Dégradé de fond ───────────────────────────────────────────────────────
    _draw_gradient(img, COLOR_DARK, (40, 40, 70))

    # ── Bandeau supérieur ─────────────────────────────────────────────────────
    draw.rectangle([(0, 0), (SIZE, 90)], fill=COLOR_ORANGE)
    shop_name = ''
    if hasattr(product.tenant, 'shop'):
        shop_name = product.tenant.shop.name.upper()
    _draw_text_centered(draw, shop_name, y=28, font_size=32, color=COLOR_WHITE, bold=True)

    # ── Image produit ─────────────────────────────────────────────────────────
    product_img_box = (80, 120, SIZE - 80, 640)
    if product.image:
        try:
            prod_img = Image.open(product.image.path).convert('RGBA')
            prod_img = _fit_image(prod_img, product_img_box)
            # je pose l'image sur un fond blanc arrondi
            bg_box = Image.new('RGB', (SIZE - 160, 520), COLOR_WHITE)
            img.paste(bg_box, (80, 120))
            img.paste(prod_img, (80, 120), prod_img if prod_img.mode == 'RGBA' else None)
        except Exception as exc:
            logger.warning('Impossible de charger image produit: %s', exc)
            _draw_placeholder(draw, product_img_box)
    else:
        _draw_placeholder(draw, product_img_box)

    # ── Nom du produit ────────────────────────────────────────────────────────
    name_lines = textwrap.wrap(product.name.upper(), width=24)
    y = 670
    for line in name_lines[:2]:
        _draw_text_centered(draw, line, y=y, font_size=48, color=COLOR_WHITE, bold=True)
        y += 58

    # ── Prix ──────────────────────────────────────────────────────────────────
    price_text = f'{product.effective_price:,.0f} XOF'
    if product.promo_price:
        # je barre l'ancien prix
        old_price = f'{product.price:,.0f} XOF'
        _draw_text_centered(draw, old_price, y=y + 5, font_size=28, color=COLOR_GRAY)
        _strikethrough(draw, old_price, y=y + 5, font_size=28)
        y += 40
    _draw_text_centered(draw, price_text, y=y, font_size=56, color=COLOR_YELLOW, bold=True)
    y += 70

    # ── Bandeau inférieur ─────────────────────────────────────────────────────
    draw.rectangle([(0, SIZE - 90), (SIZE, SIZE)], fill=COLOR_ORANGE)
    _draw_text_centered(draw, '📲 Commander sur WhatsApp', y=SIZE - 65,
                        font_size=28, color=COLOR_WHITE)

    # ── Watermark AfriSell ────────────────────────────────────────────────────
    _draw_text_centered(draw, 'Propulsé par AfriSell', y=SIZE - 30,
                        font_size=16, color=(255, 255, 255, 120))

    buf = io.BytesIO()
    img.save(buf, format=output_format, quality=92)
    buf.seek(0)
    return buf.read()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _draw_gradient(img, top_color, bottom_color):
    """Je dessine un dégradé vertical simple."""
    draw  = ImageDraw.Draw(img)
    for y in range(SIZE):
        ratio = y / SIZE
        r = int(top_color[0] + (bottom_color[0] - top_color[0]) * ratio)
        g = int(top_color[1] + (bottom_color[1] - top_color[1]) * ratio)
        b = int(top_color[2] + (bottom_color[2] - top_color[2]) * ratio)
        draw.line([(0, y), (SIZE, y)], fill=(r, g, b))


def _draw_text_centered(draw, text, y, font_size, color, bold=False):
    font = _get_font(font_size, bold)
    bbox = draw.textbbox((0, 0), text, font=font)
    w    = bbox[2] - bbox[0]
    x    = (SIZE - w) // 2
    draw.text((x, y), text, fill=color, font=font)


def _strikethrough(draw, text, y, font_size):
    font = _get_font(font_size)
    bbox = draw.textbbox((0, 0), text, font=font)
    w    = bbox[2] - bbox[0]
    x    = (SIZE - w) // 2
    mid  = y + font_size // 2
    draw.line([(x, mid), (x + w, mid)], fill=COLOR_GRAY, width=2)


def _draw_placeholder(draw, box):
    draw.rectangle(list(box), fill=(45, 45, 70), outline=COLOR_ORANGE, width=3)
    cx = (box[0] + box[2]) // 2
    cy = (box[1] + box[3]) // 2
    draw.text((cx - 60, cy - 20), '🖼️  Image produit', fill=COLOR_GRAY)


def _fit_image(img, box):
    """Je redimensionne l'image pour qu'elle rentre dans la boîte sans déformer."""
    bw = box[2] - box[0]
    bh = box[3] - box[1]
    img.thumbnail((bw, bh), Image.LANCZOS)
    return img


def _get_font(size: int, bold: bool = False):
    """Je charge une police système ou je reviens à la police par défaut de Pillow."""
    import django.conf as conf
    font_path = getattr(conf.settings, 'STUDIO_FONT_PATH', None)
    if font_path and Path(font_path).exists():
        try:
            return ImageFont.truetype(font_path, size)
        except Exception:
            pass
    # je cherche une police commune sur Windows / Linux
    candidates = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
        'C:/Windows/Fonts/arialbd.ttf',
        'C:/Windows/Fonts/arial.ttf',
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()
