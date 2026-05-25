from datetime import timedelta
from django.db.models import Sum, Count, Q, F
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order, OrderItem
from catalogue.models import Product
from .models import DailyStat, ProductView
from .permissions import HasAnalytics
from .serializers import (
    DashboardSerializer, DailyStatSerializer,
    TopProductSerializer, RevenueChartSerializer,
    ProductViewSerializer,
)


def _get_shop(user):
    """Je récupère la boutique du vendeur — raccourci utilisé dans toutes les vues."""
    return getattr(user, 'shop', None)


class DashboardView(APIView):
    """
    Vue d'ensemble temps réel pour le widget du dashboard.
    Pas besoin du plan analytics — disponible pour tous les vendeurs.
    GET /analytics/dashboard/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user  = request.user
        shop  = _get_shop(user)
        now   = timezone.now()
        today = now.date()
        month_start = today.replace(day=1)

        # je base tout sur les commandes du vendeur
        qs = Order.objects.filter(seller=user)

        orders_today  = qs.filter(created_at__date=today).count()
        orders_month  = qs.filter(created_at__date__gte=month_start).count()
        total_orders  = qs.count()
        pending_orders = qs.filter(status='pending').count()

        # revenus = uniquement les commandes livrées
        delivered = qs.filter(status='delivered')
        revenue_today = delivered.filter(
            delivered_at__date=today
        ).aggregate(t=Sum('total_amount'))['t'] or 0

        revenue_month = delivered.filter(
            delivered_at__date__gte=month_start
        ).aggregate(t=Sum('total_amount'))['t'] or 0

        total_revenue  = delivered.aggregate(t=Sum('total_amount'))['t'] or 0
        total_products = Product.objects.filter(tenant=user, statut='active').count()

        data = {
            'orders_today':   orders_today,
            'revenue_today':  revenue_today,
            'orders_month':   orders_month,
            'revenue_month':  revenue_month,
            'total_orders':   total_orders,
            'total_revenue':  total_revenue,
            'total_products': total_products,
            'pending_orders': pending_orders,
            'currency':       'XOF',
        }
        return Response(DashboardSerializer(data).data)


class RevenueChartView(APIView):
    """
    Revenus + commandes par jour sur une période donnée.
    Utilise DailyStat si disponible, sinon calcule depuis les commandes.
    GET /analytics/revenue/?period=30  (7 | 30 | 90 | 365)
    """
    permission_classes = [IsAuthenticated, HasAnalytics]

    def get(self, request):
        # je limite les périodes autorisées pour éviter les requêtes trop lourdes
        try:
            period = int(request.query_params.get('period', 30))
            if period not in (7, 30, 90, 365):
                period = 30
        except ValueError:
            period = 30

        shop      = _get_shop(request.user)
        today     = timezone.now().date()
        date_from = today - timedelta(days=period - 1)

        # je préfère DailyStat (pré-calculé) si disponible
        if shop:
            stats = DailyStat.objects.filter(
                shop=shop,
                date__gte=date_from,
            ).order_by('date')

            if stats.exists():
                data = [
                    {'date': s.date, 'revenue': s.revenue, 'orders': s.delivered_orders}
                    for s in stats
                ]
                return Response(RevenueChartSerializer(data, many=True).data)

        # fallback : je calcule depuis les commandes directement
        rows = (
            Order.objects
            .filter(seller=request.user, status='delivered', delivered_at__date__gte=date_from)
            .annotate(day=TruncDate('delivered_at'))
            .values('day')
            .annotate(revenue=Sum('total_amount'), orders=Count('id'))
            .order_by('day')
        )

        data = [{'date': r['day'], 'revenue': r['revenue'], 'orders': r['orders']} for r in rows]
        return Response(RevenueChartSerializer(data, many=True).data)


class TopProductsView(APIView):
    """
    Top 10 produits par chiffre d'affaires sur les 30 derniers jours.
    GET /analytics/top-products/?limit=10&period=30
    """
    permission_classes = [IsAuthenticated, HasAnalytics]

    def get(self, request):
        limit  = min(int(request.query_params.get('limit', 10)), 50)
        period = int(request.query_params.get('period', 30))
        since  = timezone.now().date() - timedelta(days=period)

        rows = (
            OrderItem.objects
            .filter(
                order__seller=request.user,
                order__status='delivered',
                order__delivered_at__date__gte=since,
            )
            .values('product_name')
            .annotate(
                product_id   = F('product__id'),
                total_sold   = Sum('quantity'),
                total_revenue = Sum(F('product_price') * F('quantity')),
            )
            .order_by('-total_revenue')[:limit]
        )

        data = [
            {
                'product_id':    r['product_id'],
                'product_name':  r['product_name'],
                'total_sold':    r['total_sold'],
                'total_revenue': r['total_revenue'],
            }
            for r in rows
        ]
        return Response(TopProductSerializer(data, many=True).data)


class OrdersByStatusView(APIView):
    """
    Répartition des commandes par statut sur une période.
    GET /analytics/orders-by-status/?period=30
    """
    permission_classes = [IsAuthenticated, HasAnalytics]

    def get(self, request):
        period = int(request.query_params.get('period', 30))
        since  = timezone.now().date() - timedelta(days=period)

        rows = (
            Order.objects
            .filter(seller=request.user, created_at__date__gte=since)
            .values('status')
            .annotate(count=Count('id'))
            .order_by('status')
        )
        return Response({r['status']: r['count'] for r in rows})


class OrdersBySourceView(APIView):
    """
    Répartition SIRA WhatsApp vs lien de commande.
    GET /analytics/orders-by-source/?period=30
    """
    permission_classes = [IsAuthenticated, HasAnalytics]

    def get(self, request):
        period = int(request.query_params.get('period', 30))
        since  = timezone.now().date() - timedelta(days=period)

        rows = (
            Order.objects
            .filter(seller=request.user, created_at__date__gte=since)
            .values('source')
            .annotate(count=Count('id'))
        )
        return Response({r['source']: r['count'] for r in rows})


class ProductViewsView(APIView):
    """
    Vues des fiches produits — trafic par source et par produit.
    GET /analytics/product-views/?period=30
    """
    permission_classes = [IsAuthenticated, HasAnalytics]

    def get(self, request):
        shop   = _get_shop(request.user)
        period = int(request.query_params.get('period', 30))
        since  = timezone.now() - timedelta(days=period)

        if not shop:
            return Response({'by_source': {}, 'by_product': []})

        qs = ProductView.objects.filter(shop=shop, viewed_at__gte=since)

        # vues par source
        by_source = dict(
            qs.values('source').annotate(count=Count('id')).values_list('source', 'count')
        )

        # top 10 produits les plus vus
        by_product = list(
            qs.values('product__name')
              .annotate(views=Count('id'))
              .order_by('-views')[:10]
              .values('product__name', 'views')
        )

        return Response({'by_source': by_source, 'by_product': by_product})


class TrackProductViewView(APIView):
    """
    Enregistre une vue de fiche produit — appelé par le front à chaque ouverture.
    POST /analytics/track/product/<product_id>/
    Body optionnel : { "source": "whatsapp" }
    Pas d'auth requise — le client potentiel n'est pas connecté.
    """
    permission_classes = []
    authentication_classes = []

    def post(self, request, product_id):
        from catalogue.models import Product as CatalogProduct
        product = CatalogProduct.objects.filter(pk=product_id, statut='active').first()
        if not product:
            return Response(status=204)

        shop   = getattr(product.tenant, 'shop', None)
        source = request.data.get('source', 'direct')
        valid_sources = [s[0] for s in ProductView.SOURCE_CHOICES]
        if source not in valid_sources:
            source = 'other'

        if shop:
            ProductView.objects.create(product=product, shop=shop, source=source)

        # je retourne 204 No Content — le front n'a pas besoin de réponse
        return Response(status=204)
