from django.urls import path
from .social_connnect import SocialLoginView
from .views import (
    RegisterView, LoginView, LogoutView,
    VerifyEmailView, PasswordResetRequestView, PasswordResetConfirmView, ChangePasswordView,
    PhoneSendOTPView, PhoneVerifyOTPView,
    MeView, MyProfileView,
    MyShopView, ShopUpdateListCreateView, ShopUpdateDetailView,
    SocialConnectionListView, SocialConnectionDeleteView,
    AdminVendorListView, AdminUserListView,
)

urlpatterns = [
    # Auth
    path('auth/register/',               RegisterView.as_view(),              name='auth-register'),
    path('auth/login/',                  LoginView.as_view(),                 name='auth-login'),
    path('auth/logout/',                 LogoutView.as_view(),                name='auth-logout'),
    path('auth/verify-email/',           VerifyEmailView.as_view(),           name='auth-verify-email'),
    path('auth/password-reset/',         PasswordResetRequestView.as_view(),  name='auth-password-reset'),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view(),  name='auth-password-reset-confirm'),
    path('auth/change-password/',        ChangePasswordView.as_view(),        name='auth-change-password'),
    path('auth/social/',                 SocialLoginView.as_view(),           name='auth-social'),
    path('auth/phone/send-otp/',         PhoneSendOTPView.as_view(),          name='auth-phone-send-otp'),
    path('auth/phone/verify-otp/',       PhoneVerifyOTPView.as_view(),        name='auth-phone-verify-otp'),

    # Utilisateur connecté
    path('me/',         MeView.as_view(),        name='me'),
    path('me/profile/', MyProfileView.as_view(),  name='me-profile'),

    # Boutique
    path('me/shop/',                          MyShopView.as_view(),              name='me-shop'),
    path('me/shop/updates/',                  ShopUpdateListCreateView.as_view(), name='me-shop-updates'),
    path('me/shop/updates/<uuid:pk>/',        ShopUpdateDetailView.as_view(),     name='me-shop-update-detail'),

    # Connexions sociales
    path('me/social/',              SocialConnectionListView.as_view(),   name='me-social-list'),
    path('me/social/<uuid:pk>/',   SocialConnectionDeleteView.as_view(), name='me-social-delete'),

    # Admin
    path('admin/vendors/', AdminVendorListView.as_view(), name='admin-vendors'),
    path('admin/users/',   AdminUserListView.as_view(),   name='admin-users'),
]
