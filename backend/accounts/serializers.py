from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import UserProfile, Shop, ShopUpdate, SocialConnection

User = get_user_model()


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserRegistrationSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        # role intentionnellement absent — tout nouveau compte est forcément 'tenant'
        fields = ['email', 'username', 'password', 'password2', 'phone']

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError({'password': 'Les mots de passe ne correspondent pas.'})
        return attrs

    def create(self, validated_data):
        # role forcé à 'tenant' — impossible de s'auto-promouvoir admin
        validated_data['role'] = 'tenant'
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token        = serializers.UUIDField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])


class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.UUIDField()


class PhoneSendOTPSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)

    def validate_phone(self, value):
        value = value.strip()
        if not value.startswith('+'):
            raise serializers.ValidationError("Le numéro doit être au format E.164 (ex: +2250700000000).")
        return value


class PhoneVerifyOTPSerializer(serializers.Serializer):
    phone    = serializers.CharField(max_length=20)
    otp      = serializers.CharField(min_length=6, max_length=6)
    username = serializers.CharField(max_length=150, required=False, allow_blank=True)


# ── User ──────────────────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    has_active_subscription = serializers.BooleanField(read_only=True)

    class Meta:
        model  = User
        # longitude/latitude retirés de la réponse publique — uniquement accessibles via /me/
        fields = [
            'id', 'email', 'username', 'role', 'phone',
            'social_provider', 'has_active_subscription', 'created_at',
        ]
        read_only_fields = ['id', 'email', 'role', 'social_provider', 'created_at']


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['username', 'phone', 'longitude', 'latitude']


# ── Profile ───────────────────────────────────────────────────────────────────

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UserProfile
        fields = ['avatar', 'bio', 'language', 'notifications', 'updated_at']
        read_only_fields = ['updated_at']


# ── Shop ─────────────────────────────────────────────────────────────────────

class ShopSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Shop
        fields = [
            'id', 'name', 'category', 'description', 'logo',
            'country', 'city', 'address', 'latitude', 'longitude',
            'whatsapp_number', 'whatsapp_connected',
            'opening_hours', 'is_active', 'is_verified', 'created_at',
        ]
        read_only_fields = ['id', 'whatsapp_connected', 'is_verified', 'created_at']


class ShopUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ShopUpdate
        fields = ['id', 'message', 'update_type', 'is_active', 'expires_at', 'created_at']
        read_only_fields = ['id', 'created_at']


# ── Social connections ────────────────────────────────────────────────────────

class SocialConnectionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SocialConnection
        fields = [
            'id', 'platform', 'account_id', 'account_name',
            'is_active', 'connected_at',
        ]
        read_only_fields = fields
