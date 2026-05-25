"""
Extraction de coordonnées GPS depuis les messages Twilio/WhatsApp.
WhatsApp peut envoyer la position de deux façons :
  1. Partage natif → Twilio expose Latitude et Longitude dans le POST
  2. Lien Google Maps collé dans le texte → je parse le lien
"""
import re


def extract_coords(post_data: dict, body: str = '') -> tuple[float | None, float | None]:
    """
    Je retourne (latitude, longitude) ou (None, None) si rien trouvé.
    Je teste d'abord le partage natif Twilio, puis le lien dans le texte.
    """
    lat = post_data.get('Latitude')
    lng = post_data.get('Longitude')
    if lat and lng:
        try:
            return float(lat), float(lng)
        except (TypeError, ValueError):
            pass

    return _parse_maps_link(body or post_data.get('Body', ''))


def is_location_message(post_data: dict) -> bool:
    """Je détecte si le message Twilio est un partage de position natif."""
    return bool(post_data.get('Latitude') and post_data.get('Longitude'))


def _parse_maps_link(text: str) -> tuple[float | None, float | None]:
    """
    Je parse les différents formats de liens Google Maps :
    - https://maps.google.com/?q=5.36,-4.00
    - https://www.google.com/maps?q=5.36,-4.00
    - https://www.google.com/maps/@5.36,-4.00,15z
    - https://maps.app.goo.gl/... (URL courte — je ne peux pas résoudre sans HTTP)
    """
    patterns = [
        # ?q=lat,lng
        r'[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)',
        # @lat,lng,zoom
        r'@(-?\d+\.?\d*),(-?\d+\.?\d*),\d+',
        # ll=lat,lng
        r'[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            try:
                return float(match.group(1)), float(match.group(2))
            except ValueError:
                continue
    return None, None
