from rest_framework.permissions import BasePermission


class HasStudio(BasePermission):
    """Accès Studio IA — disponible pour tous les plans actifs."""
    message = 'Un abonnement actif est requis pour accéder au Studio.'

    def has_permission(self, request, _view):
        if not request.user.is_authenticated:
            return False
        sub = getattr(request.user, 'subscription', None)
        return bool(sub and sub.is_active and sub.plan.has_studio)


class HasBgRemoval(BasePermission):
    """Suppression de fond — plan Business uniquement."""
    message = 'La suppression de fond est disponible à partir du plan Business.'

    def has_permission(self, request, _view):
        if not request.user.is_authenticated:
            return False
        sub = getattr(request.user, 'subscription', None)
        return bool(sub and sub.is_active and sub.plan.has_bg_removal)


class HasSmartSchedule(BasePermission):
    """Analyse du meilleur moment de publication — plan Business uniquement."""
    message = 'La planification intelligente est disponible à partir du plan Business.'

    def has_permission(self, request, _view):
        if not request.user.is_authenticated:
            return False
        sub = getattr(request.user, 'subscription', None)
        return bool(sub and sub.is_active and sub.plan.has_smart_schedule)
