"""
Validateurs réutilisables pour les fichiers uploadés.
On vérifie les magic bytes (premiers octets du fichier)
et non l'extension/Content-Type déclaré par le client — facilement falsifiable.
"""
from django.core.exceptions import ValidationError


ALLOWED_IMAGE_MIMES = {
    b'\xff\xd8\xff':       'jpeg',
    b'\x89PNG\r\n\x1a\n': 'png',
    b'GIF87a':             'gif',
    b'GIF89a':             'gif',
    b'RIFF':               'webp',  # RIFF....WEBP
}

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 Mo


def validate_image_file(file):
    if not file:
        return
    if file.size > MAX_IMAGE_SIZE:
        raise ValidationError('L\'image ne doit pas dépasser 10 Mo.')

    header = file.read(12)
    file.seek(0)

    # cas WEBP : RIFF????WEBP
    if header[:4] == b'RIFF' and header[8:12] == b'WEBP':
        return

    for magic, _ in ALLOWED_IMAGE_MIMES.items():
        if magic == b'RIFF':
            continue
        if header[:len(magic)] == magic:
            return

    raise ValidationError('Format d\'image invalide. Formats acceptés : JPEG, PNG, GIF, WEBP.')
