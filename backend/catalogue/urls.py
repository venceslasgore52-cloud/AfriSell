from django.urls import path
from .views import (
    ShopProductListView, ShopProductDetailView,
    MyProductListCreateView, MyProductDetailView,
    MyProductPublishView, MyProductStockView,
    AdminProductListView,
)

urlpatterns = [
    # ── Vitrine publique ──────────────────────────────────────────────────────
    path('shop/<uuid:shop_id>/',           ShopProductListView.as_view(),   name='shop-products'),
    path('shop/<uuid:shop_id>/<uuid:pk>/', ShopProductDetailView.as_view(), name='shop-product-detail'),

    # ── Gestion vendeur ───────────────────────────────────────────────────────
    path('me/',                            MyProductListCreateView.as_view(), name='my-products'),
    path('me/<uuid:pk>/',                  MyProductDetailView.as_view(),     name='my-product-detail'),
    path('me/<uuid:pk>/publish/',          MyProductPublishView.as_view(),    name='my-product-publish'),
    path('me/<uuid:pk>/stock/',            MyProductStockView.as_view(),      name='my-product-stock'),

    # ── Admin ─────────────────────────────────────────────────────────────────
    path('admin/',                         AdminProductListView.as_view(),    name='admin-products'),
]
