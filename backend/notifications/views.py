from django.utils import timezone
from rest_framework import generics, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .models import Notification
from .serializers import NotificationSerializer, NotificationMarkReadSerializer


class MyNotificationListView(generics.ListAPIView):
    """
    Liste des notifications du user connecté — les plus récentes en premier.
    GET /notifications/me/?is_read=false&level=error
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = NotificationSerializer
    filter_backends    = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields   = ['is_read', 'level', 'notif_type']
    ordering_fields    = ['created_at']
    ordering           = ['-created_at']

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class MyNotificationDetailView(generics.RetrieveDestroyAPIView):
    """
    Détail ou suppression d'une notification.
    GET    /notifications/me/<pk>/
    DELETE /notifications/me/<pk>/
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = NotificationSerializer

    def get_queryset(self):
        # je filtre par recipient pour qu'un user ne puisse pas lire les notifs d'un autre
        return Notification.objects.filter(recipient=self.request.user)


class MarkOneReadView(APIView):
    """
    Marque une seule notification comme lue.
    PATCH /notifications/me/<pk>/read/
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        notif = Notification.objects.filter(recipient=request.user, pk=pk).first()
        if not notif:
            return Response({'detail': 'Notification introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        notif.mark_as_read()
        return Response(NotificationSerializer(notif).data)


class MarkAllReadView(APIView):
    """
    Marque toutes les notifs non lues comme lues — ou une sélection via ids[].
    PATCH /notifications/me/read/
    Body optionnel : { "ids": ["uuid1", "uuid2"] }
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = NotificationMarkReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ids = serializer.validated_data.get('ids')
        qs  = Notification.objects.filter(recipient=request.user, is_read=False)

        # si des ids sont fournis je filtre, sinon je prends tout
        if ids:
            qs = qs.filter(id__in=ids)

        now   = timezone.now()
        count = qs.update(is_read=True, read_at=now)

        return Response({'marked_read': count})


class UnreadCountView(APIView):
    """
    Nombre de notifications non lues — utile pour le badge dans la navbar.
    GET /notifications/me/unread-count/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'unread_count': count})


class DeleteAllReadView(APIView):
    """
    Supprime toutes les notifications déjà lues — nettoyage à la demande du vendeur.
    DELETE /notifications/me/clear/
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        count, _ = Notification.objects.filter(recipient=request.user, is_read=True).delete()
        return Response({'deleted': count})
