import secrets

import redis as redis_lib
from django.conf import settings
from django.contrib.auth import get_user_model, authenticate
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserProfile, Shop, ShopUpdate, SocialConnection
from .permissions import IsTenant, IsShopOwner
from .throttles import LoginRateThrottle, RegisterRateThrottle, OTPRateThrottle, PasswordResetRateThrottle
from .serializers import (
    UserRegistrationSerializer, LoginSerializer, UserSerializer,
    UserUpdateSerializer, UserProfileSerializer, ShopSerializer,
    ShopUpdateSerializer, SocialConnectionSerializer,
    ChangePasswordSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, EmailVerificationSerializer,
    PhoneSendOTPSerializer, PhoneVerifyOTPSerializer,
)


def _otp_redis() -> redis_lib.Redis:
    # Upstash passe ?ssl_cert_reqs=CERT_NONE dans l'URL mais redis-py
    # n'accepte pas cette valeur en string — on strip le query string
    # et on passe ssl_cert_reqs=None directement.
    url = settings.REDIS_OTP_URL
    base_url = url.split('?')[0]
    kwargs = {'decode_responses': True}
    if base_url.startswith('rediss://'):
        kwargs['ssl_cert_reqs'] = None
    return redis_lib.from_url(base_url, **kwargs)

User = get_user_model()


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterView(APIView):
    permission_classes  = [AllowAny]
    throttle_classes    = [RegisterRateThrottle]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)

        # envoi de l'email de vérification en arrière-plan
        try:
            from django.utils import timezone
            from datetime import timedelta
            from .models import EmailVerificationToken
            from .emails import send_verification_email
            verif_token = EmailVerificationToken.objects.create(
                user=user,
                expires_at=timezone.now() + timedelta(hours=24),
            )
            send_verification_email(user, str(verif_token.token))
        except Exception:
            pass  # on ne bloque pas l'inscription si l'email échoue

        return Response({'token': token.key, 'user': UserSerializer(user).data}, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes  = [AllowAny]
    throttle_classes    = [LoginRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(request, email=serializer.validated_data['email'],
                            password=serializer.validated_data['password'])
        if not user:
            return Response({'detail': 'Identifiants invalides.'}, status=status.HTTP_401_UNAUTHORIZED)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': UserSerializer(user).data})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        from .models import EmailVerificationToken
        token_obj = EmailVerificationToken.objects.filter(
            token=serializer.validated_data['token'],
            is_used=False,
            expires_at__gt=timezone.now(),
        ).select_related('user').first()
        if not token_obj:
            return Response({'detail': 'Token invalide ou expiré.'}, status=status.HTTP_400_BAD_REQUEST)
        token_obj.is_used = True
        token_obj.save()
        return Response({'detail': 'Email vérifié avec succès.'})


class PasswordResetRequestView(APIView):
    permission_classes  = [AllowAny]
    throttle_classes    = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        user = User.objects.filter(email=email).first()
        if user:
            try:
                from django.utils import timezone
                from datetime import timedelta
                from .models import PasswordResetToken
                from .emails import send_password_reset_email
                # invalide les anciens tokens
                user.reset_tokens.filter(is_used=False).update(is_used=True)
                reset_token = PasswordResetToken.objects.create(
                    user=user,
                    expires_at=timezone.now() + timedelta(minutes=15),
                )
                send_password_reset_email(user, str(reset_token.token))
            except Exception:
                pass  # réponse identique même si l'email échoue (anti-énumération)

        return Response({'detail': 'Si cet email existe, un lien de réinitialisation a été envoyé.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        from .models import PasswordResetToken
        reset_token = PasswordResetToken.objects.filter(
            token=serializer.validated_data['token'],
            is_used=False,
            expires_at__gt=timezone.now(),
        ).select_related('user').first()
        if not reset_token:
            return Response({'detail': 'Token invalide ou expiré.'}, status=status.HTTP_400_BAD_REQUEST)
        user = reset_token.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        reset_token.is_used = True
        reset_token.save()
        # invalide tous les tokens de session existants
        Token.objects.filter(user=user).delete()
        return Response({'detail': 'Mot de passe réinitialisé avec succès.'})


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not request.user.check_password(serializer.validated_data['old_password']):
            return Response({'detail': 'Ancien mot de passe incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Mot de passe modifié avec succès.'})


# ── Auth par numéro WhatsApp (OTP via Redis + Twilio) ─────────────────────────

OTP_TTL_SECONDS = 300  # 5 minutes


class PhoneSendOTPView(APIView):
    """
    Génère un code OTP à 6 chiffres, le stocke dans Redis (5 min),
    puis l'envoie au numéro via Twilio WhatsApp.
    """
    permission_classes = [AllowAny]
    throttle_classes   = [OTPRateThrottle]

    def post(self, request):
        serializer = PhoneSendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone']

        otp = str(secrets.randbelow(900000) + 100000)
        _otp_redis().setex(f'otp:{phone}', OTP_TTL_SECONDS, otp)

        from sira.services.twilio_client import send_whatsapp
        import logging
        logger = logging.getLogger(__name__)

        sent = send_whatsapp(
            phone,
            f'Votre code de vérification AfriSell : *{otp}*\n(valable 5 minutes — ne le partagez pas)',
        )
        logger.warning('OTP send_whatsapp → phone=%s sid=%s', phone, sent)

        if sent is None:
            # En DEBUG on expose la raison exacte pour faciliter le diagnostic
            from django.conf import settings as dj_settings
            detail = (
                'Envoi WhatsApp échoué — consultez les logs Django pour la raison exacte.'
                if not dj_settings.DEBUG
                else f'Twilio a retourné None. Vérifiez : (1) le numéro a rejoint le sandbox Twilio '
                     f'en envoyant "join <mot-clé>" au +14155238886, '
                     f'(2) TWILIO_ACCOUNT_SID/AUTH_TOKEN sont valides.'
            )
            return Response({'detail': detail}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({'detail': 'Code OTP envoyé sur WhatsApp.'})


class PhoneVerifyOTPView(APIView):
    """
    Vérifie le code OTP depuis Redis.
    - Si l'utilisateur existe (phone déjà connu) → connexion.
    - Sinon → création du compte, token retourné.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PhoneVerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data['phone']
        otp   = serializer.validated_data['otp']

        r = _otp_redis()
        stored = r.get(f'otp:{phone}')

        if not stored or stored != otp:
            return Response({'detail': 'Code OTP invalide ou expiré.'}, status=status.HTTP_400_BAD_REQUEST)

        r.delete(f'otp:{phone}')

        user    = User.objects.filter(phone=phone).first()
        created = False

        if not user:
            raw_phone   = phone.replace('+', '').replace(' ', '')
            base_username = serializer.validated_data.get('username') or f'user_{raw_phone}'
            username    = base_username
            counter     = 1
            while User.objects.filter(username=username).exists():
                username = f'{base_username}_{counter}'
                counter += 1

            user = User.objects.create_user(
                username=username,
                email=f'phone_{raw_phone}@afrisell.internal',
                phone=phone,
                password=User.objects.make_random_password(),
            )
            created = True

        token, _ = Token.objects.get_or_create(user=user)
        http_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response({'token': token.key, 'user': UserSerializer(user).data, 'created': created}, status=http_status)


# ── Me ────────────────────────────────────────────────────────────────────────

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class MyProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return Response(UserProfileSerializer(profile).data)

    def patch(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ── Shop ─────────────────────────────────────────────────────────────────────

class MyShopView(APIView):
    permission_classes = [IsAuthenticated, IsTenant]

    def get(self, request):
        shop = Shop.objects.filter(user=request.user).first()
        if not shop:
            return Response({'detail': 'Boutique introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ShopSerializer(shop).data)

    def post(self, request):
        if Shop.objects.filter(user=request.user).exists():
            return Response({'detail': 'Vous avez déjà une boutique.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = ShopSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def patch(self, request):
        shop = Shop.objects.filter(user=request.user).first()
        if not shop:
            return Response({'detail': 'Boutique introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ShopSerializer(shop, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# ── Shop updates ──────────────────────────────────────────────────────────────

class ShopUpdateListCreateView(generics.ListCreateAPIView):
    serializer_class   = ShopUpdateSerializer
    permission_classes = [IsAuthenticated, IsTenant]

    def get_queryset(self):
        return ShopUpdate.objects.filter(shop__user=self.request.user)

    def perform_create(self, serializer):
        shop = Shop.objects.get(user=self.request.user)
        serializer.save(shop=shop)


class ShopUpdateDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = ShopUpdateSerializer
    permission_classes = [IsAuthenticated, IsTenant, IsShopOwner]

    def get_queryset(self):
        return ShopUpdate.objects.filter(shop__user=self.request.user)


# ── Social connections ────────────────────────────────────────────────────────

class SocialConnectionListView(generics.ListAPIView):
    serializer_class   = SocialConnectionSerializer
    permission_classes = [IsAuthenticated, IsTenant]

    def get_queryset(self):
        return SocialConnection.objects.filter(tenant=self.request.user)


class SocialConnectionDeleteView(generics.DestroyAPIView):
    serializer_class   = SocialConnectionSerializer
    permission_classes = [IsAuthenticated, IsTenant]

    def get_queryset(self):
        return SocialConnection.objects.filter(tenant=self.request.user)


# ── Admin views ───────────────────────────────────────────────────────────────

class AdminVendorListView(generics.ListAPIView):
    """Liste tous les vendeurs (role=tenant)."""
    serializer_class   = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        from .permissions import IsAfriSellAdmin
        return [IsAuthenticated(), IsAfriSellAdmin()]

    def get_queryset(self):
        return User.objects.filter(role='tenant').order_by('-date_joined')


class AdminUserListView(generics.ListAPIView):
    """Liste tous les utilisateurs."""
    serializer_class   = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        from .permissions import IsAfriSellAdmin
        return [IsAuthenticated(), IsAfriSellAdmin()]

    def get_queryset(self):
        role = self.request.query_params.get('role', '')
        qs = User.objects.all().order_by('-date_joined')
        if role:
            qs = qs.filter(role=role)
        return qs
