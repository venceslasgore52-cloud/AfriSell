"""
Vue d'auth sociale — le client envoie {provider, token} et reçoit son token DRF.

Flux que j'ai choisi :
  1. le mobile envoie {provider, token} en POST
  2. je vérifie le token auprès du provider (social_auth.py)
  3. je fais un upsert : si l'user existe (par social_id ou email) je le récupère,
     sinon je le crée avec un username auto-généré depuis l'email
  4. je retourne le token DRF + les données user + un flag "created" pour que
     le client sache s'il doit afficher l'onboarding
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import UserSerializer
from .social_auth import verify_social_token, SocialAuthError

User = get_user_model()


class SocialLoginSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(choices=['google', 'facebook', 'apple'])
    token    = serializers.CharField()


class SocialLoginView(APIView):
    # pas d'auth requise ici — c'est la route d'entrée pour les nouveaux users
    authentication_classes = []
    permission_classes     = []

    def post(self, request):
        serializer = SocialLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        provider = serializer.validated_data['provider']
        token    = serializer.validated_data['token']

        try:
            user_info = verify_social_token(provider, token)
        except SocialAuthError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        email     = user_info.get('email')
        social_id = user_info.get('social_id')
        name      = user_info.get('name', '')

        if not email:
            # Apple peut ne pas envoyer l'email si l'user a choisi "Masquer mon email"
            # dans ce cas je bloque — je ne peux pas créer de compte sans email
            return Response(
                {'detail': 'Email non fourni par le provider. Vérifie les permissions de l\'app.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user, created = _upsert_social_user(email, social_id, provider, name)

        auth_token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {'token': auth_token.key, 'user': UserSerializer(user).data, 'created': created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


def _upsert_social_user(email: str, social_id: str, provider: str, name: str):
    # je cherche d'abord par social_id+provider, puis par email
    # comme ça si quelqu'un avait un compte local avec le même email, je les fusionne
    user = User.objects.filter(social_id=social_id, social_provider=provider).first()

    if not user:
        user = User.objects.filter(email=email).first()

    if user:
        if not user.social_id:
            # compte local existant — j'attache le social_id pour les prochaines connexions
            user.social_id       = social_id
            user.social_provider = provider
            user.save(update_fields=['social_id', 'social_provider'])
        return user, False

    # nouveau user — je génère un username unique depuis la partie locale de l'email
    base_username = email.split('@')[0]
    username      = base_username
    counter       = 1
    while User.objects.filter(username=username).exists():
        username = f'{base_username}{counter}'
        counter += 1

    first_name, *rest = (name.split(' ', 1) if name else ['', ''])
    last_name = rest[0] if rest else ''

    user = User.objects.create_user(
        email           = email,
        username        = username,
        password        = None,
        first_name      = first_name,
        last_name       = last_name,
        social_id       = social_id,
        social_provider = provider,
    )
    return user, True
