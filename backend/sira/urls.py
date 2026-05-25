from django.urls import path
from .views import (
    TwilioWebhookView,
    MetaWebhookView,
    WaBridgeWebhookView,
    SiraQRView,
    MySiraConfigView,
    MySiraConversationListView,
    MySiraConversationDetailView,
    SiraStatsView,
)

urlpatterns = [
    # webhooks entrants
    path('webhook/',                          TwilioWebhookView.as_view(),              name='sira-webhook'),
    path('meta-webhook/',                     MetaWebhookView.as_view(),                name='sira-meta-webhook'),
    path('wa-webhook/',                       WaBridgeWebhookView.as_view(),            name='sira-wa-webhook'),
    # QR code — le vendeur connecte son numéro WhatsApp
    path('me/qr/',                            SiraQRView.as_view(),                     name='sira-qr'),
    # config du bot
    path('me/config/',                        MySiraConfigView.as_view(),               name='sira-config'),
    # conversations
    path('me/conversations/',                 MySiraConversationListView.as_view(),     name='sira-conversations'),
    path('me/conversations/<uuid:pk>/',       MySiraConversationDetailView.as_view(),   name='sira-conversation-detail'),
    # stats dashboard
    path('me/stats/',                         SiraStatsView.as_view(),                  name='sira-stats'),
]
