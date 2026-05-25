"""
Tâches Celery Studio.
Je gère la génération asynchrone de texte/flyer/suppression fond
et la publication programmée des posts (V1 : notification ; V2 : API Meta).
"""
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2, default_retry_delay=10)
def generate_asset_task(self, asset_id: str):
    """
    Je génère le contenu d'un StudioAsset en fonction de son type.
    Appelé dès la création de l'asset — met à jour status + résultat.
    """
    from .models import StudioAsset
    from .services import text_gen, image_gen, bg_removal

    try:
        asset = StudioAsset.objects.select_related('product', 'seller__shop').get(id=asset_id)
    except StudioAsset.DoesNotExist:
        logger.error('generate_asset_task: asset %s introuvable', asset_id)
        return

    asset.status = 'processing'
    asset.save(update_fields=['status'])

    try:
        if asset.type == 'text':
            _generate_text(asset)
        elif asset.type == 'flyer':
            _generate_flyer(asset)
        elif asset.type == 'image':
            _generate_bg_removal(asset)
        else:
            # video / montage → V2
            asset.status    = 'failed'
            asset.error_message = f'Type {asset.type} non supporté en V1.'
            asset.save(update_fields=['status', 'error_message'])
            return

        asset.status = 'done'
        from django.utils import timezone
        asset.save(update_fields=['status'])

    except Exception as exc:
        logger.exception('generate_asset_task error pour %s: %s', asset_id, exc)
        asset.status        = 'failed'
        asset.error_message = str(exc)[:500]
        asset.save(update_fields=['status', 'error_message'])
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def publish_post_task(self, post_id: str):
    """
    V1 — je marque le post comme publié et je notifie le vendeur.
    V2 — j'appelle l'API Facebook/Instagram Graph pour publier directement.
    """
    from django.utils import timezone
    from .models import PublicationPost
    from notifications.utils import notify

    try:
        post = PublicationPost.objects.select_related('seller', 'asset').get(id=post_id)
    except PublicationPost.DoesNotExist:
        logger.error('publish_post_task: post %s introuvable', post_id)
        return

    if post.status not in ('scheduled', 'draft'):
        logger.info('publish_post_task: post %s déjà traité (%s)', post_id, post.status)
        return

    # ── V2 : publication automatique ─────────────────────────────────────────
    sub = getattr(post.seller, 'subscription', None)
    if sub and sub.is_active and sub.plan.has_auto_publish:
        try:
            _auto_publish(post)
            return
        except Exception as exc:
            logger.warning('Auto-publish échoué pour %s: %s — fallback V1', post_id, exc)
            # je continue en V1 si l'auto-publish échoue

    # ── V1 : notification vendeur ─────────────────────────────────────────────
    post.status       = 'published'
    post.published_at = timezone.now()
    post.save(update_fields=['status', 'published_at'])

    notify(
        recipient  = post.seller,
        notif_type = 'system',
        title      = f'Publication {post.get_platform_display()} prête',
        message    = (
            f'Ton contenu pour {post.platform} est prêt à être publié manuellement. '
            f'Télécharge-le depuis le Studio.'
        ),
        level      = 'info',
        obj        = post,
    )
    logger.info('publish_post_task V1: post %s marqué publié', post_id)


@shared_task
def generate_smart_schedule_task(seller_id: str, platform: str):
    """
    J'analyse les données de commandes pour suggérer les meilleurs créneaux de publication.
    Plan Business uniquement — lancé manuellement depuis le dashboard.
    """
    from django.contrib.auth import get_user_model
    from .models import SmartScheduleSuggestion
    from .services.text_gen import generate_smart_schedule_analysis

    User = get_user_model()
    try:
        seller = User.objects.get(id=seller_id)
    except User.DoesNotExist:
        return

    slots, analysis = generate_smart_schedule_analysis(seller, platform)

    SmartScheduleSuggestion.objects.create(
        seller          = seller,
        platform        = platform,
        suggested_slots = slots,
        analysis        = analysis,
    )
    logger.info('smart_schedule généré pour %s sur %s', seller.email, platform)


@shared_task
def schedule_pending_posts():
    """
    Je vérifie les posts planifiés dont l'heure est passée et je les publie.
    Lancé toutes les 5 minutes via Celery Beat.
    """
    from django.utils import timezone
    from .models import PublicationPost

    due = PublicationPost.objects.filter(
        status='scheduled',
        scheduled_at__lte=timezone.now(),
    )
    count = 0
    for post in due:
        publish_post_task.delay(str(post.id))
        count += 1

    if count:
        logger.info('schedule_pending_posts: %d posts déclenchés', count)
    return count


# ── Helpers génération ────────────────────────────────────────────────────────

def _generate_text(asset):
    from .services.text_gen import generate_caption, generate_description

    if not asset.product:
        raise ValueError('Un produit est requis pour la génération de texte.')

    # je détermine la plateforme depuis le prompt_used si présent
    platform = asset.prompt_used or 'general'
    text = generate_caption(asset.product, platform=platform)
    if not text:
        raise RuntimeError("Gemini n'a pas retourné de texte.")

    asset.generated_text  = text
    asset.ai_model_used   = 'gemini-1.5-flash'
    asset.save(update_fields=['generated_text', 'ai_model_used'])


def _generate_flyer(asset):
    import io
    from django.core.files.base import ContentFile
    from .services.image_gen import create_flyer

    if not asset.product:
        raise ValueError('Un produit est requis pour la génération de flyer.')

    image_bytes = create_flyer(asset.product)
    filename    = f'flyer_{asset.product.id}.png'
    asset.generated_file.save(filename, ContentFile(image_bytes), save=False)
    asset.ai_model_used = 'pillow'
    asset.save(update_fields=['generated_file', 'ai_model_used'])


def _generate_bg_removal(asset):
    from django.core.files.base import ContentFile
    from .services.bg_removal import remove_background

    if not asset.source_image:
        raise ValueError('Une image source est requise pour la suppression de fond.')

    with asset.source_image.open('rb') as f:
        image_bytes = f.read()

    result_bytes = remove_background(image_bytes, asset.source_image.name)
    filename     = f'no_bg_{asset.id}.png'
    asset.generated_file.save(filename, ContentFile(result_bytes), save=False)
    asset.ai_model_used = 'remove.bg'
    asset.save(update_fields=['generated_file', 'ai_model_used'])


def _auto_publish(post):
    """
    V2 — Publication automatique via les APIs des plateformes.
    Meta API approval requis. Non implémenté en V1.
    """
    raise NotImplementedError(
        "Publication automatique V2 — en attente de l'approbation Meta API. "
        'V1 : le vendeur publie manuellement.'
    )
