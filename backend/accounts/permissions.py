from rest_framework.permissions import BasePermission


class IsTenant(BasePermission):
    """Accessible aux vendeurs uniquement."""
    def has_permission(self, request, _view):
        return request.user.is_authenticated and request.user.is_tenant


class IsAfriSellAdmin(BasePermission):
    """Accessible aux admins AfriSell uniquement."""
    def has_permission(self, request, _view):
        return request.user.is_authenticated and request.user.is_admin


class IsShopOwner(BasePermission):
    """L'objet doit appartenir à l'utilisateur connecté (Shop ou ShopUpdate)."""
    def has_object_permission(self, request, _view, obj):
        shop = obj if hasattr(obj, 'user') else getattr(obj, 'shop', None)
        return shop is not None and shop.user == request.user
