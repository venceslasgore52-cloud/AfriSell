from rest_framework.permissions import BasePermission


class HasAnalytics(BasePermission):
    """
    Accessible uniquement aux vendeurs avec un plan Pro ou Business.
    Je vérifie has_analytics sur le plan actif — pas juste le rôle.
    """
    message = 'Les analytics sont disponibles à partir du plan Pro.'

    def has_permission(self, request, _view):
        if not request.user.is_authenticated:
            return False
        sub = getattr(request.user, 'subscription', None)
        return bool(sub and sub.is_active and sub.plan.has_analytics)
