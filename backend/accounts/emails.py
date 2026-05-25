"""
Utilitaires d'envoi d'email — vérification compte + réinitialisation mot de passe.
En DEBUG : backend console → les emails s'affichent dans le terminal.
En production : backend SMTP (Gmail ou SendGrid via EMAIL_HOST_USER).
"""
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

FRONTEND_URL = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')


def send_verification_email(user, token: str) -> None:
    verify_url = f"{FRONTEND_URL}/auth/verify-email?token={token}"
    context = {'user': user, 'verify_url': verify_url, 'site_name': 'AfriSell'}
    html_msg   = render_to_string('emails/verify_email.html', context)
    plain_msg  = strip_tags(html_msg)
    send_mail(
        subject       = 'Vérifiez votre adresse email — AfriSell',
        message       = plain_msg,
        from_email    = settings.DEFAULT_FROM_EMAIL,
        recipient_list= [user.email],
        html_message  = html_msg,
        fail_silently = True,
    )


def send_password_reset_email(user, token: str) -> None:
    reset_url = f"{FRONTEND_URL}/auth/reset-password?token={token}"
    context = {'user': user, 'reset_url': reset_url, 'site_name': 'AfriSell'}
    html_msg   = render_to_string('emails/reset_password.html', context)
    plain_msg  = strip_tags(html_msg)
    send_mail(
        subject       = 'Réinitialisation de votre mot de passe — AfriSell',
        message       = plain_msg,
        from_email    = settings.DEFAULT_FROM_EMAIL,
        recipient_list= [user.email],
        html_message  = html_msg,
        fail_silently = True,
    )
