from django.urls import path
from .views import (
    PlanListView,
    CheckoutView, StripePortalView,
    MySubscriptionView,
    PaymentHistoryView,
    InvoiceListView, InvoiceDetailView,
    StripeWebhookView, CinetPayWebhookView, PaystackWebhookView,
    EnabledGatewayListView,
    AdminGatewayListView, AdminGatewayToggleView,
)

urlpatterns = [
    # Plans (public)
    path('plans/',              PlanListView.as_view(),       name='billing-plans'),

    # Passerelles activées (pour le front checkout)
    path('gateways/',           EnabledGatewayListView.as_view(), name='billing-gateways'),

    # Checkout & portail
    path('checkout/',           CheckoutView.as_view(),       name='billing-checkout'),
    path('stripe/portal/',      StripePortalView.as_view(),   name='billing-stripe-portal'),

    # Mon abonnement
    path('subscription/',       MySubscriptionView.as_view(), name='billing-subscription'),

    # Historique & factures
    path('payments/',           PaymentHistoryView.as_view(), name='billing-payments'),
    path('invoices/',           InvoiceListView.as_view(),    name='billing-invoices'),
    path('invoices/<uuid:pk>/', InvoiceDetailView.as_view(),  name='billing-invoice-detail'),

    # Webhooks — pas de prefix /api/ pour que les providers y accèdent directement
    path('webhooks/stripe/',    StripeWebhookView.as_view(),    name='webhook-stripe'),
    path('webhooks/cinetpay/',  CinetPayWebhookView.as_view(),  name='webhook-cinetpay'),
    path('webhooks/paystack/', PaystackWebhookView.as_view(), name='webhook-paystack'),

    # Admin — gestion des passerelles
    path('admin/gateways/',             AdminGatewayListView.as_view(),   name='admin-gateways'),
    path('admin/gateways/<str:provider>/', AdminGatewayToggleView.as_view(), name='admin-gateway-toggle'),
]
