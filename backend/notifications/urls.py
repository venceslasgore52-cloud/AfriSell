from django.urls import path
from .views import (
    MyNotificationListView,
    MyNotificationDetailView,
    MarkOneReadView,
    MarkAllReadView,
    UnreadCountView,
    DeleteAllReadView,
)

urlpatterns = [
    # liste + filtres
    path('me/',                      MyNotificationListView.as_view(),  name='my-notifications'),
    # badge navbar
    path('me/unread-count/',         UnreadCountView.as_view(),         name='notif-unread-count'),
    # marquer tout lu (ou sélection via ids[])
    path('me/read/',                 MarkAllReadView.as_view(),         name='notif-mark-all-read'),
    # nettoyage des notifs lues
    path('me/clear/',                DeleteAllReadView.as_view(),       name='notif-clear-read'),
    # détail / suppression d'une notif
    path('me/<uuid:pk>/',            MyNotificationDetailView.as_view(), name='notif-detail'),
    # marquer une seule notif comme lue
    path('me/<uuid:pk>/read/',       MarkOneReadView.as_view(),         name='notif-mark-one-read'),
]
