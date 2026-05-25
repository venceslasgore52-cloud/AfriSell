from django.urls import path
from .views import (
    MyStudioAssetListCreateView,
    MyStudioAssetDetailView,
    GenerateTextView,
    StudioQuotaView,
    MyPublicationPostListCreateView,
    MyPublicationPostDetailView,
    SmartScheduleView,
)

urlpatterns = [
    # quota mensuel
    path('quota/',                       StudioQuotaView.as_view(),                   name='studio-quota'),
    # génération texte rapide (synchrone)
    path('generate-text/',               GenerateTextView.as_view(),                  name='studio-generate-text'),
    # assets IA (flyer, image, texte)
    path('assets/',                      MyStudioAssetListCreateView.as_view(),       name='studio-assets'),
    path('assets/<uuid:pk>/',            MyStudioAssetDetailView.as_view(),           name='studio-asset-detail'),
    # posts de publication
    path('posts/',                       MyPublicationPostListCreateView.as_view(),   name='studio-posts'),
    path('posts/<uuid:pk>/',             MyPublicationPostDetailView.as_view(),       name='studio-post-detail'),
    # planification intelligente (Business)
    path('smart-schedule/',              SmartScheduleView.as_view(),                 name='studio-smart-schedule'),
]
