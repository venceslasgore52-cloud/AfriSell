import logging

from django.conf import settings
from django.http import HttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Shop
from accounts.permissions import IsTenant

from .models import SiraConfig, SiraConversation
from .serializers import (
    SiraConfigSerializer,
    SiraConversationListSerializer,
    SiraConversationSerializer,
)

logger = logging.getLogger(__name__)


class TwilioWebhookView(APIView):
    """
    Webhook Twilio — reçoit tous les messages WhatsApp entrants.
    POST /sira/webhook/
    Pas d'auth — Twilio signe les requêtes, je valide la signature en prod.
    Je réponds vide (TwiML <Response/>) et je délègue à Celery.
    """
    permission_classes     = []
    authentication_classes = []

    def post(self, request):
        # je valide la signature Twilio en production pour bloquer les faux webhooks
        if not settings.DEBUG:
            from .services.twilio_client import validate_signature
            if not validate_signature(request):
                logger.warning('Twilio signature invalide — requête rejetée')
                return HttpResponse(status=403)

        data        = request.POST
        from_number = data.get('From', '')      # ex: whatsapp:+2250123456789
        to_number   = data.get('To', '')        # ex: whatsapp:+15551234567
        body        = data.get('Body', '').strip()
        num_media   = int(data.get('NumMedia', 0))
        media_url   = data.get('MediaUrl0', '') if num_media > 0 else ''
        media_type  = data.get('MediaContentType0', '') if num_media > 0 else ''

        if not from_number:
            return HttpResponse('<?xml version="1.0"?><Response/>', content_type='text/xml')

        # je trouve la boutique via le numéro Twilio destinataire
        shop = self._get_shop(to_number)
        if not shop:
            logger.warning('Aucune boutique pour le numéro Twilio %s', to_number)
            return HttpResponse('<?xml version="1.0"?><Response/>', content_type='text/xml')

        # je délègue à Celery — Twilio n'attend pas ma réponse métier
        from .tasks import process_inbound_message
        process_inbound_message.delay(
            shop_id      = str(shop.id),
            client_phone = from_number,
            body         = body,
            media_url    = media_url,
            media_type   = media_type,
            raw_payload  = dict(data),
        )

        # je retourne un TwiML vide — la réponse réelle est envoyée par Celery via l'API Twilio
        return HttpResponse(
            '<?xml version="1.0" encoding="UTF-8"?><Response/>',
            content_type='text/xml',
        )

    @staticmethod
    def _get_shop(to_number: str):
        """Je retrouve la boutique propriétaire du numéro Twilio."""
        clean = to_number.replace('whatsapp:', '')
        return Shop.objects.filter(
            sira_config__twilio_number=clean
        ).select_related('user', 'sira_config').first()


class MySiraConfigView(APIView):
    """
    Le vendeur lit et modifie la config SIRA de sa boutique.
    GET/PATCH /sira/me/config/
    """
    permission_classes = [IsAuthenticated, IsTenant]

    def get(self, request):
        shop   = getattr(request.user, 'shop', None)
        if not shop:
            return Response({'detail': 'Boutique introuvable.'}, status=404)
        config, _ = SiraConfig.objects.get_or_create(shop=shop)
        return Response(SiraConfigSerializer(config, context={'request': request}).data)

    def patch(self, request):
        shop = getattr(request.user, 'shop', None)
        if not shop:
            return Response({'detail': 'Boutique introuvable.'}, status=404)
        config, _ = SiraConfig.objects.get_or_create(shop=shop)
        serializer = SiraConfigSerializer(
            config, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class MySiraConversationListView(APIView):
    """
    Liste des conversations SIRA du vendeur — triées par dernier message.
    GET /sira/me/conversations/?state=browsing&page=1
    """
    permission_classes = [IsAuthenticated, IsTenant]

    def get(self, request):
        shop = getattr(request.user, 'shop', None)
        if not shop:
            return Response([])

        qs = SiraConversation.objects.filter(shop=shop).order_by('-last_message_at')

        state = request.query_params.get('state')
        if state:
            qs = qs.filter(state=state)

        return Response(SiraConversationListSerializer(qs[:50], many=True).data)


class MySiraConversationDetailView(APIView):
    """
    Détail d'une conversation — le vendeur voit tout l'historique.
    GET /sira/me/conversations/<uuid>/
    """
    permission_classes = [IsAuthenticated, IsTenant]

    def get(self, request, pk):
        shop = getattr(request.user, 'shop', None)
        if not shop:
            return Response(status=404)

        conv = SiraConversation.objects.filter(pk=pk, shop=shop).prefetch_related('messages').first()
        if not conv:
            return Response(status=404)

        return Response(SiraConversationSerializer(conv).data)


class MetaWebhookView(APIView):
    """
    Webhook Meta WhatsApp Cloud API.
    GET  /sira/meta-webhook/ — vérification du webhook par Meta
    POST /sira/meta-webhook/ — messages entrants
    """
    permission_classes     = []
    authentication_classes = []

    def get(self, request):
        """Meta envoie un GET pour vérifier le webhook."""
        mode       = request.query_params.get('hub.mode')
        token      = request.query_params.get('hub.verify_token')
        challenge  = request.query_params.get('hub.challenge')

        if mode == 'subscribe' and token == settings.META_WEBHOOK_VERIFY_TOKEN:
            logger.info('Meta webhook vérifié avec succès')
            return HttpResponse(challenge, content_type='text/plain')

        logger.warning('Meta webhook — token invalide: %s', token)
        return HttpResponse(status=403)

    def post(self, request):
        """Meta envoie un POST pour chaque message entrant."""
        from .services.meta_client import parse_incoming
        from accounts.models import Shop

        payload  = request.data
        messages = parse_incoming(payload)

        for msg in messages:
            phone_number_id = msg['phone_number_id']
            client_phone    = f'whatsapp:+{msg["from"]}'
            body            = msg['body']
            post_data       = {}

            if msg['latitude'] and msg['longitude']:
                post_data = {
                    'Latitude':  str(msg['latitude']),
                    'Longitude': str(msg['longitude']),
                }

            # retrouver la boutique par phone_number_id
            shop = Shop.objects.filter(
                sira_config__meta_phone_number_id=phone_number_id
            ).select_related('user', 'sira_config').first()

            if not shop:
                # fallback : prendre la boutique avec le META_PHONE_NUMBER_ID par défaut
                default_id = getattr(settings, 'META_PHONE_NUMBER_ID', '')
                if phone_number_id == default_id:
                    shop = Shop.objects.select_related('user', 'sira_config').first()

            if not shop:
                logger.warning('Aucune boutique pour phone_number_id %s', phone_number_id)
                continue

            from .tasks import process_inbound_message
            process_inbound_message.delay(
                shop_id      = str(shop.id),
                client_phone = client_phone,
                body         = body,
                media_url    = '',
                media_type   = msg['type'] if msg['type'] != 'text' else '',
                raw_payload  = post_data,
            )

        return HttpResponse(status=200)


class WaBridgeWebhookView(APIView):
    """
    Webhook reçu depuis le WA-Bridge Node.js.
    POST /sira/wa-webhook/
    Accepte : message entrant ou session_ready.
    """
    permission_classes     = []
    authentication_classes = []

    def post(self, request):
        secret = request.headers.get('X-Bridge-Secret', '')
        if secret != settings.WA_BRIDGE_SECRET:
            return Response({'error': 'unauthorized'}, status=403)

        data  = request.data
        event = data.get('event')

        if event == 'session_ready':
            self._on_session_ready(data)
            return Response({'ok': True})

        if event == 'message':
            self._on_message(data)
            return Response({'ok': True})

        return Response({'ok': True})

    def _on_session_ready(self, data):
        shop_id = data.get('shop_id')
        phone   = data.get('phone', '')
        try:
            from accounts.models import Shop
            shop = Shop.objects.select_related('sira_config').get(id=shop_id)
            cfg  = shop.sira_config
            cfg.twilio_number = f'+{phone}' if not phone.startswith('+') else phone
            cfg.wa_provider   = 'bridge'
            cfg.save(update_fields=['twilio_number', 'wa_provider'])
            logger.info('Session WA prête pour %s — numéro: %s', shop.name, phone)
        except Exception as exc:
            logger.error('session_ready error: %s', exc)

    def _on_message(self, data):
        shop_id    = data.get('shop_id')
        from_      = data.get('from', '')
        wa_id      = data.get('wa_id', from_)   # ID original pour l'envoi retour
        body       = data.get('body', '')
        msg_type   = data.get('type', 'text')
        latitude   = data.get('latitude')
        longitude  = data.get('longitude')

        # normalise le numéro → whatsapp:+2250586524962
        phone = from_.replace('@c.us', '').replace('@s.whatsapp.net', '').replace('@lid', '')
        if not phone.startswith('+'):
            phone = f'+{phone}'
        client_phone = f'whatsapp:{phone}'

        post_data = {}
        if latitude and longitude:
            post_data = {'Latitude': str(latitude), 'Longitude': str(longitude)}

        try:
            from accounts.models import Shop
            from .handler import handle_message
            from .tasks import _send_via_bridge

            shop          = Shop.objects.select_related('user', 'sira_config').get(id=shop_id)
            response_text = handle_message(
                shop         = shop,
                client_phone = client_phone,
                body         = body,
                post_data    = post_data,
            )
            # utiliser wa_id pour l'envoi (gère @lid, @c.us, etc.)
            _send_via_bridge(str(shop_id), wa_id, response_text)
        except Exception as exc:
            logger.exception('WA-Bridge message error: %s', exc)


class SiraQRView(APIView):
    """
    Le vendeur démarre sa session WhatsApp et obtient le QR code à scanner.
    POST /sira/me/qr/
    """
    permission_classes = [IsAuthenticated, IsTenant]

    def post(self, request):
        shop = getattr(request.user, 'shop', None)
        if not shop:
            return Response({'detail': 'Boutique introuvable.'}, status=404)

        from .services.wa_bridge import start_session
        result = start_session(str(shop.id))
        return Response(result)

    def get(self, request):
        shop = getattr(request.user, 'shop', None)
        if not shop:
            return Response({'detail': 'Boutique introuvable.'}, status=404)

        from .services.wa_bridge import session_status
        return Response(session_status(str(shop.id)))


class SiraStatsView(APIView):
    """
    Stats rapides SIRA pour le dashboard — messages reçus et commandes via bot.
    GET /sira/me/stats/
    """
    permission_classes = [IsAuthenticated, IsTenant]

    def get(self, request):
        from datetime import timedelta
        from django.db.models import Count
        from django.utils import timezone

        shop = getattr(request.user, 'shop', None)
        if not shop:
            return Response({})

        since = timezone.now() - timedelta(days=30)
        qs    = SiraConversation.objects.filter(shop=shop, created_at__gte=since)

        by_state = dict(
            qs.values('state').annotate(count=Count('id')).values_list('state', 'count')
        )

        total     = qs.count()
        completed = by_state.get('completed', 0)
        active    = qs.exclude(state__in=('completed', 'cancelled')).count()

        return Response({
            # champs attendus par le frontend
            'total_clients':       total,
            'orders_via_bot':      completed,
            'avg_response_time':   '< 1s',
            'botRate':             round(completed / total * 100, 1) if total else 0,
            # champs complets
            'period_days':         30,
            'total_conversations': total,
            'completed':           completed,
            'cancelled':           by_state.get('cancelled', 0),
            'active':              active,
        })
