from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from rest_framework.authtoken.models import Token


class TokenAuthMiddleware(MiddlewareMixin):
    # je gère le header Authorization: Token <key> pour les routes hors DRF
    # (WebSocket, admin custom...) — les vues DRF ont leur propre auth, pas besoin ici

    def process_request(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Token '):
            return None

        key = auth_header.split(' ', 1)[1].strip()
        try:
            token = Token.objects.select_related('user').get(key=key)
            request.user = token.user
        except Token.DoesNotExist:
            pass

        return None


class TenantShopMiddleware(MiddlewareMixin):
    # j'injecte la boutique dans request.shop pour éviter de la requêter
    # à chaque vue — seulement pour les vendeurs connectés

    def process_request(self, request):
        request.shop = None
        if request.user.is_authenticated and getattr(request.user, 'is_tenant', False):
            request.shop = getattr(request.user, 'shop', None)
        return None


class MaintenanceModeMiddleware(MiddlewareMixin):
    # si MAINTENANCE_MODE=True dans settings, tout le monde est bloqué sauf les admins

    def process_request(self, request):
        from django.conf import settings
        if not getattr(settings, 'MAINTENANCE_MODE', False):
            return None
        if request.user.is_authenticated and request.user.is_staff:
            return None
        return JsonResponse(
            {'detail': 'AfriSell est en maintenance. Réessayez dans quelques minutes.'},
            status=503,
        )
