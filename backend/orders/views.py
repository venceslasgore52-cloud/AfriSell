from django.utils import timezone
from rest_framework import generics, filters, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from accounts.permissions import IsTenant
from .models import Order, OrderItem, OrderStatusHistory
from .serializers import (
    OrderSerializer, OrderListSerializer,
    OrderStatusUpdateSerializer, OrderItemSerializer,
)


# ── Commandes du vendeur ──────────────────────────────────────────────────────

class MyOrderListView(generics.ListAPIView):
    """
    Liste des commandes reçues par le vendeur connecté.
    GET /orders/me/?status=pending&ordering=-created_at
    """
    permission_classes = [IsAuthenticated, IsTenant]
    serializer_class   = OrderListSerializer
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['status', 'source']
    search_fields      = ['reference', 'client_name', 'client_phone']
    ordering_fields    = ['created_at', 'total_amount', 'status']
    ordering           = ['-created_at']

    def get_queryset(self):
        return Order.objects.filter(seller=self.request.user).prefetch_related('items')


class MyOrderDetailView(generics.RetrieveAPIView):
    """
    Détail complet d'une commande avec items + historique.
    GET /orders/me/<pk>/
    """
    permission_classes = [IsAuthenticated, IsTenant]
    serializer_class   = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(seller=self.request.user).prefetch_related(
            'items', 'status_history', 'status_history__changed_by'
        )


class MyOrderStatusUpdateView(APIView):
    """
    Mise à jour du statut d'une commande avec validation des transitions.
    PATCH /orders/me/<pk>/status/
    Body : { "status": "confirmed", "note": "..." }
    """
    permission_classes = [IsAuthenticated, IsTenant]

    def patch(self, request, pk):
        order = Order.objects.filter(seller=request.user, pk=pk).first()
        if not order:
            return Response({'detail': 'Commande introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = OrderStatusUpdateSerializer(
            data=request.data,
            context={'current_status': order.status},
        )
        serializer.is_valid(raise_exception=True)

        old_status = order.status
        new_status = serializer.validated_data['status']
        note       = serializer.validated_data.get('note', '')

        # je trace le changement avant de modifier la commande
        OrderStatusHistory.objects.create(
            order      = order,
            old_status = old_status,
            new_status = new_status,
            changed_by = request.user,
            note       = note,
        )

        order.status = new_status
        # j'horodate les jalons importants
        now = timezone.now()
        if new_status == 'confirmed':
            order.confirmed_at = now
        elif new_status == 'delivered':
            order.delivered_at = now
        elif new_status == 'cancelled':
            order.cancelled_at = now

        order.save(update_fields=['status', 'confirmed_at', 'delivered_at', 'cancelled_at'])
        return Response(OrderSerializer(order).data)


class MyOrderSellerNoteView(APIView):
    """
    Ajout / modification de la note interne du vendeur.
    PATCH /orders/me/<pk>/note/
    Body : { "seller_note": "..." }
    """
    permission_classes = [IsAuthenticated, IsTenant]

    def patch(self, request, pk):
        order = Order.objects.filter(seller=request.user, pk=pk).first()
        if not order:
            return Response({'detail': 'Commande introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        order.seller_note = request.data.get('seller_note', '')
        order.save(update_fields=['seller_note'])
        return Response({'seller_note': order.seller_note})


# ── Création de commande (SIRA / lien public) ─────────────────────────────────

class CreateOrderView(generics.CreateAPIView):
    """
    Création d'une commande par un client — via SIRA ou lien public.
    Pas d'authentification requise.
    POST /orders/create/<shop_id>/
    """
    permission_classes = [AllowAny]
    serializer_class   = OrderSerializer

    def perform_create(self, serializer):
        from accounts.models import Shop
        shop = Shop.objects.filter(id=self.kwargs['shop_id'], is_active=True).first()
        if not shop:
            from rest_framework.exceptions import NotFound
            raise NotFound('Boutique introuvable.')

        source = self.request.data.get('source', 'order_link')
        serializer.save(seller=shop.user, source=source)


# ── Stats rapides pour le dashboard ──────────────────────────────────────────

class MyOrderStatsView(APIView):
    """
    Statistiques rapides — nombre de commandes par statut + total du jour/mois.
    GET /orders/me/stats/
    """
    permission_classes = [IsAuthenticated, IsTenant]

    def get(self, request):
        from django.db.models import Count, Sum
        from django.utils.timezone import now

        qs = Order.objects.filter(seller=request.user)

        # je compte par statut
        by_status = dict(
            qs.values('status').annotate(count=Count('id')).values_list('status', 'count')
        )

        today = now().date()
        month_start = today.replace(day=1)

        total_today = qs.filter(
            status='delivered', delivered_at__date=today
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        total_month = qs.filter(
            status='delivered', delivered_at__date__gte=month_start
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        return Response({
            'by_status':   by_status,
            'total_today': total_today,
            'total_month': total_month,
            'currency':    'XOF',
        })


# ── Admin views ───────────────────────────────────────────────────────────────

class AdminOrderListView(generics.ListAPIView):
    """Liste toutes les commandes de la plateforme."""
    serializer_class   = OrderListSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        from accounts.permissions import IsAfriSellAdmin
        return [IsAuthenticated(), IsAfriSellAdmin()]

    def get_queryset(self):
        return Order.objects.select_related('seller').order_by('-created_at')
