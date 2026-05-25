from django.urls import path
from .views import (
    DashboardView,
    RevenueChartView,
    TopProductsView,
    OrdersByStatusView,
    OrdersBySourceView,
    ProductViewsView,
    TrackProductViewView,
)

urlpatterns = [
    # dashboard — tous les vendeurs
    path('dashboard/',           DashboardView.as_view(),       name='analytics-dashboard'),
    # graphiques — plan Pro/Business uniquement
    path('revenue/',             RevenueChartView.as_view(),    name='analytics-revenue'),
    path('top-products/',        TopProductsView.as_view(),     name='analytics-top-products'),
    path('orders-by-status/',    OrdersByStatusView.as_view(),  name='analytics-orders-status'),
    path('orders-by-source/',    OrdersBySourceView.as_view(),  name='analytics-orders-source'),
    path('product-views/',       ProductViewsView.as_view(),    name='analytics-product-views'),
    # tracking public — pas d'auth
    path('track/product/<uuid:product_id>/', TrackProductViewView.as_view(), name='analytics-track-product'),
]
