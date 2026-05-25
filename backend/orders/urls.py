from django.urls import path
from .views import (
    MyOrderListView, MyOrderDetailView,
    MyOrderStatusUpdateView, MyOrderSellerNoteView,
    MyOrderStatsView,
    CreateOrderView,
    AdminOrderListView,
)

urlpatterns = [
    # ── Dashboard vendeur ─────────────────────────────────────────────────────
    path('me/',                      MyOrderListView.as_view(),        name='my-orders'),
    path('me/stats/',                MyOrderStatsView.as_view(),       name='my-orders-stats'),
    path('me/<uuid:pk>/',            MyOrderDetailView.as_view(),      name='my-order-detail'),
    path('me/<uuid:pk>/status/',     MyOrderStatusUpdateView.as_view(), name='my-order-status'),
    path('me/<uuid:pk>/note/',       MyOrderSellerNoteView.as_view(),  name='my-order-note'),

    # ── Création (SIRA / lien public) ─────────────────────────────────────────
    path('create/<uuid:shop_id>/',   CreateOrderView.as_view(),        name='create-order'),

    # ── Admin ─────────────────────────────────────────────────────────────────
    path('admin/',                   AdminOrderListView.as_view(),     name='admin-orders'),
]
