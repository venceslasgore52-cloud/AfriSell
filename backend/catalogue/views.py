from rest_framework import generics, filters, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from accounts.permissions import IsTenant
from .models import Product
from .serializers import ProductSerializer, ProductListSerializer


# ── Vues publiques (vitrine de la boutique) ───────────────────────────────────

class ShopProductListView(generics.ListAPIView):
    """
    Catalogue public d'une boutique — accessible sans authentification.
    GET /catalogue/<shop_id>/
    """
    permission_classes = [AllowAny]
    serializer_class   = ProductListSerializer
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['category', 'statut']
    search_fields      = ['name', 'description', 'custom_category']
    ordering_fields    = ['price', 'created_at', 'name']
    ordering           = ['-created_at']

    def get_queryset(self):
        return Product.objects.filter(
            tenant__shop__id=self.kwargs['shop_id'],
            statut='active',
        )


class ShopProductDetailView(generics.RetrieveAPIView):
    """
    Détail public d'un produit.
    GET /catalogue/<shop_id>/<pk>/
    """
    permission_classes = [AllowAny]
    serializer_class   = ProductSerializer

    def get_queryset(self):
        return Product.objects.filter(
            tenant__shop__id=self.kwargs['shop_id'],
            statut='active',
        )


# ── Vues vendeur (gestion de son catalogue) ───────────────────────────────────

class MyProductListCreateView(generics.ListCreateAPIView):
    """
    Liste + création des produits du vendeur connecté.
    GET  /catalogue/me/
    POST /catalogue/me/
    """
    permission_classes = [IsAuthenticated, IsTenant]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['category', 'statut']
    search_fields      = ['name', 'description', 'custom_category']
    ordering_fields    = ['price', 'created_at', 'name']
    ordering           = ['-created_at']

    def get_serializer_class(self):
        # je retourne le serializer allégé pour la liste, complet pour la création
        if self.request.method == 'GET':
            return ProductListSerializer
        return ProductSerializer

    def get_queryset(self):
        return Product.objects.filter(tenant=self.request.user)

    def perform_create(self, serializer):
        # je vérifie la limite de produits selon le plan du vendeur
        sub = getattr(self.request.user, 'subscription', None)
        if sub:
            max_products = sub.plan.max_products
            current      = Product.objects.filter(tenant=self.request.user).count()
            if max_products is not None and current >= max_products:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(
                    f'Limite de {max_products} produits atteinte. Passe au plan supérieur.'
                )
        serializer.save(tenant=self.request.user)


class MyProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Détail / modification / suppression d'un produit du vendeur.
    GET    /catalogue/me/<pk>/
    PATCH  /catalogue/me/<pk>/
    DELETE /catalogue/me/<pk>/
    """
    permission_classes = [IsAuthenticated, IsTenant]
    serializer_class   = ProductSerializer

    def get_queryset(self):
        # je filtre par tenant pour qu'un vendeur ne puisse pas toucher aux produits d'un autre
        return Product.objects.filter(tenant=self.request.user)


class MyProductPublishView(APIView):
    """
    Gestion des plateformes de publication d'un produit.
    PATCH /catalogue/me/<pk>/publish/
    Body : { "whatsapp": true, "facebook": false, "instagram": true, "tiktok": false }
    """
    permission_classes = [IsAuthenticated, IsTenant]

    def patch(self, request, pk):
        product = Product.objects.filter(tenant=request.user, pk=pk).first()
        if not product:
            return Response({'detail': 'Produit introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        fields_map = {
            'whatsapp':  'published_whatsapp',
            'facebook':  'published_facebook',
            'instagram': 'published_instagram',
            'tiktok':    'published_tiktok',
        }
        updated = []
        for key, field in fields_map.items():
            if key in request.data:
                setattr(product, field, bool(request.data[key]))
                updated.append(field)

        if updated:
            product.save(update_fields=updated)

        return Response(ProductSerializer(product).data)


class MyProductStockView(APIView):
    """
    Mise à jour rapide du stock sans passer par le serializer complet.
    PATCH /catalogue/me/<pk>/stock/
    Body : { "quantity": 25 }
    """
    permission_classes = [IsAuthenticated, IsTenant]

    def patch(self, request, pk):
        product = Product.objects.filter(tenant=request.user, pk=pk).first()
        if not product:
            return Response({'detail': 'Produit introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        quantity = request.data.get('quantity')
        if quantity is None or not str(quantity).isdigit():
            return Response({'detail': 'Quantité invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        product.quantity = int(quantity)
        product.save()  # save() gère automatiquement le statut rupture/active

        return Response({'quantity': product.quantity, 'statut': product.statut, 'in_stock': product.in_stock})


# ── Admin views ───────────────────────────────────────────────────────────────

class AdminProductListView(generics.ListAPIView):
    """Liste tous les produits de la plateforme."""
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        from accounts.permissions import IsAfriSellAdmin
        return [IsAuthenticated(), IsAfriSellAdmin()]

    def get_serializer_class(self):
        return ProductSerializer

    def get_queryset(self):
        return Product.objects.select_related('tenant').order_by('-created_at')
