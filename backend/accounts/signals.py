from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta

from .models import UserProfile, EmailVerificationToken, PasswordResetToken

User = get_user_model()


@receiver(post_save, sender=User)
def handle_new_user(sender, instance, created, **kwargs):
    # je crée le profil et j'envoie le token de vérif dès qu'un user s'inscrit
    # le signal dans models.py fait déjà get_or_create, mais je centralise tout ici
    if not created:
        return

    UserProfile.objects.get_or_create(user=instance)

    token = EmailVerificationToken.objects.create(
        user=instance,
        expires_at=timezone.now() + timedelta(hours=24),
    )
    _send_verification_email(instance, token.token)


def _send_verification_email(user, token):
    send_mail(
        subject='Vérifiez votre adresse email — AfriSell',
        message=(
            f'Bonjour {user.username},\n\n'
            f'Clique sur ce lien pour vérifier ton email :\n'
            f'https://afrisell.com/verify-email?token={token}\n\n'
            f'Le lien expire dans 24h.'
        ),
        from_email='noreply@afrisell.com',
        recipient_list=[user.email],
        fail_silently=True,
    )


def send_password_reset_email(user):
    # j'invalide les anciens tokens avant d'en créer un nouveau pour éviter les doublons actifs
    user.reset_tokens.filter(is_used=False).update(is_used=True)

    token = PasswordResetToken.objects.create(
        user=user,
        expires_at=timezone.now() + timedelta(hours=2),
    )
    send_mail(
        subject='Réinitialisation de mot de passe — AfriSell',
        message=(
            f'Bonjour {user.username},\n\n'
            f'Utilise ce lien pour réinitialiser ton mot de passe :\n'
            f'https://afrisell.com/reset-password?token={token.token}\n\n'
            f'Valable 2h. Si ce n\'est pas toi, ignore ce message.'
        ),
        from_email='noreply@afrisell.com',
        recipient_list=[user.email],
        fail_silently=True,
    )
