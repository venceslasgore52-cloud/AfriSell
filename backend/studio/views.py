import logging
from datetime import timedelta

from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsTenant
from catalogue.models import Product

from .models import StudioAsset, PublicationPost, SmartScheduleSuggestion
from .permissions import HasStudio, HasBgRemoval, HasSmartSchedule
from .serializers import (
    StudioAssetSerializer, StudioAssetListSerializer,
    PublicationPostSerializer, PublicationPostListSerializer,
    SmartScheduleSuggestionSerializer,
    GenerateTextRequestSerializer, QuotaSerializer,
)

logger = logging.getLogger(__name__)


def _check_quota(user) -> tuple[bool, dict]:
    """Je vérifie si le vendeur a encore des crédits IA ce mois-ci."""
    sub   = getattr(user, 'subscription', None)
    limit = sub.plan.max_ai_requests if sub else 0

    month_start  = timezone.now().date().replace(day=1)
    used         = StudioAsset.objects.filter(
        seller       = user,
        created_at__date__gte = month_start,
        status__in   = ('done', 'processing'),
    ).count()

    if limit is None:  # illimité
        return True, {'used_this_month': used, 'limit': None, 'remaining': None, 'is_unlimited': True}

    remaining = max(0, limit - used)
    ok        = remaining > 0
    return ok, {'used_this_month': used, 'limit': limit, 'remaining': remaining, 'is_unlimited': False}


class MyStudioAssetListCreateView(APIView):
    """
    GET  /studio/assets/        → liste mes assets
    POST /studio/assets/        → crée un asset + lance la génération en Celery
    """
    permission_classes = [IsAuthenticated, IsTenant, HasStudio]

    def get(self, request):
        qs = StudioAsset.objects.filter(seller=request.user)

        asset_type = request.query_params.get('type')
        status     = request.query_params.get('status')
        if asset_type:
            qs = qs.filter(type=asset_type)
        if status:
            qs = qs.filter(status=status)

        return Response(StudioAssetListSerializer(qs[:50], many=True).data)

    def post(self, request):
        # je vérifie le quota avant de créer
        ok, quota = _check_quota(request.user)
        if not ok:
            return Response(
                {'detail': 'Quota mensuel atteint.', 'quota': quota},
                status=429,
            )

        # je vérifie que la suppression de fond a le bon plan
        if request.data.get('type') == 'image':
            if not HasBgRemoval().has_permission(request, self):
                return Response(
                    {'detail': 'La suppression de fond est disponible à partir du plan Business.'},
                    status=403,
                )

        serializer = StudioAssetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        asset = serializer.save(seller=request.user, status='pending')

        from .tasks import generate_asset_task
        generate_asset_task.delay(str(asset.id))

        return Response(StudioAssetSerializer(asset).data, status=202)


class MyStudioAssetDetailView(APIView):
    """
    GET    /studio/assets/<uuid>/  → détail + polling status
    DELETE /studio/assets/<uuid>/  → supprimer
    """
    permission_classes = [IsAuthenticated, IsTenant, HasStudio]

    def _get_asset(self, request, pk):
        return StudioAsset.objects.filter(pk=pk, seller=request.user).first()

    def get(self, request, pk):
        asset = self._get_asset(request, pk)
        if not asset:
            return Response(status=404)
        return Response(StudioAssetSerializer(asset).data)

    def delete(self, request, pk):
        asset = self._get_asset(request, pk)
        if not asset:
            return Response(status=404)
        asset.delete()
        return Response(status=204)


class GenerateTextView(APIView):
    """
    Génère un texte publicitaire à la volée (sans créer d'asset).
    Rapide — retour synchrone depuis Gemini.
    POST /studio/generate-text/
    """
    permission_classes = [IsAuthenticated, IsTenant, HasStudio]

    def post(self, request):
        ok, quota = _check_quota(request.user)
        if not ok:
            return Response({'detail': 'Quota mensuel atteint.', 'quota': quota}, status=429)

        serializer = GenerateTextRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        platform     = data.get('platform', 'general')
        language     = data.get('language', 'fr')
        extra        = data.get('extra', '')
        content_type = data.get('content_type', 'caption')
        product      = None

        if data.get('product_id'):
            product = Product.objects.filter(
                pk=data['product_id'], tenant=request.user
            ).first()
            if not product:
                return Response({'detail': 'Produit introuvable.'}, status=404)

        if product:
            from .services.text_gen import generate_caption
            text = generate_caption(
                product,
                platform=platform,
                language=language,
                extra_instructions=extra,
            )
            model_used = 'gemini-1.5-flash'
        else:
            from .services.text_gen import generate_from_prompt
            text = generate_from_prompt(
                prompt=data.get('prompt', ''),
                content_type=content_type,
                platform=platform,
                language=language,
                extra=extra,
            )
            model_used = 'groq/llama-3.3-70b'

        if not text:
            return Response({'detail': 'La génération a échoué. Réessaie.'}, status=502)

        StudioAsset.objects.create(
            seller         = request.user,
            product        = product,
            type           = 'text',
            status         = 'done',
            generated_text = text,
            prompt_used    = platform,
            ai_model_used  = model_used,
        )

        return Response({'text': text, 'quota': quota})


class StudioQuotaView(APIView):
    """Quota mensuel du vendeur. GET /studio/quota/"""
    permission_classes = [IsAuthenticated, IsTenant]

    def get(self, request):
        _, quota = _check_quota(request.user)
        return Response(QuotaSerializer(quota).data)


class MyPublicationPostListCreateView(APIView):
    """
    GET  /studio/posts/  → liste mes posts
    POST /studio/posts/  → créer un post (brouillon ou planifié)
    """
    permission_classes = [IsAuthenticated, IsTenant, HasStudio]

    def get(self, request):
        qs       = PublicationPost.objects.filter(seller=request.user)
        platform = request.query_params.get('platform')
        status   = request.query_params.get('status')
        if platform:
            qs = qs.filter(platform=platform)
        if status:
            qs = qs.filter(status=status)
        return Response(PublicationPostListSerializer(qs[:50], many=True).data)

    def post(self, request):
        serializer = PublicationPostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save(seller=request.user)

        # si une date est programmée → je schedule la tâche Celery
        if post.scheduled_at:
            post.status = 'scheduled'
            post.save(update_fields=['status'])
            from .tasks import publish_post_task
            publish_post_task.apply_async(
                args=[str(post.id)],
                eta=post.scheduled_at,
            )

        return Response(PublicationPostSerializer(post).data, status=201)


class MyPublicationPostDetailView(APIView):
    """
    GET/PATCH/DELETE /studio/posts/<uuid>/
    """
    permission_classes = [IsAuthenticated, IsTenant, HasStudio]

    def _get_post(self, request, pk):
        return PublicationPost.objects.filter(pk=pk, seller=request.user).first()

    def get(self, request, pk):
        post = self._get_post(request, pk)
        return Response(PublicationPostSerializer(post).data) if post else Response(status=404)

    def patch(self, request, pk):
        post = self._get_post(request, pk)
        if not post:
            return Response(status=404)
        if post.status == 'published':
            return Response({'detail': 'Impossible de modifier un post déjà publié.'}, status=400)

        serializer = PublicationPostSerializer(post, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()

        # je reprogramme Celery si la date change
        if 'scheduled_at' in request.data and post.scheduled_at:
            post.status = 'scheduled'
            post.save(update_fields=['status'])
            from .tasks import publish_post_task
            publish_post_task.apply_async(args=[str(post.id)], eta=post.scheduled_at)

        return Response(PublicationPostSerializer(post).data)

    def delete(self, request, pk):
        post = self._get_post(request, pk)
        if not post:
            return Response(status=404)
        if post.status == 'published':
            return Response({'detail': 'Impossible de supprimer un post publié.'}, status=400)
        post.delete()
        return Response(status=204)


class SmartScheduleView(APIView):
    """
    Génère ou retourne les suggestions de créneaux de publication.
    GET  /studio/smart-schedule/?platform=instagram → dernière suggestion
    POST /studio/smart-schedule/                   → génère une nouvelle (async)
    Plan Business uniquement.
    """
    permission_classes = [IsAuthenticated, IsTenant, HasSmartSchedule]

    def get(self, request):
        platform   = request.query_params.get('platform', 'instagram')
        suggestion = (
            SmartScheduleSuggestion.objects
            .filter(seller=request.user, platform=platform)
            .order_by('-generated_at')
            .first()
        )
        if not suggestion:
            return Response({'detail': "Aucune suggestion générée. Lance une analyse d'abord."}, status=404)
        return Response(SmartScheduleSuggestionSerializer(suggestion).data)

    def post(self, request):
        platform = request.data.get('platform', 'instagram')
        from .tasks import generate_smart_schedule_task
        generate_smart_schedule_task.delay(str(request.user.id), platform)
        return Response({'detail': f'Analyse en cours pour {platform}. Reviens dans quelques secondes.'}, status=202)
