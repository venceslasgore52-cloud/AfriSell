from pathlib import Path

import dj_database_url
from decouple import config, Csv

# ─────────────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent

# ── Core ─────────────────────────────────────────────────────────────────────
SECRET_KEY = config('SECRET_KEY')
DEBUG       = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost', cast=Csv())

AUTH_USER_MODEL = 'accounts.User'

# ── Apps ─────────────────────────────────────────────────────────────────────
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # third-party
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'django_filters',
    'django_celery_beat',
    # afrisell
    'accounts',
    'billing',
    'catalogue',
    'orders',
    'notifications',
    'analytics',
    'sira',
    'studio',
]

# ── Middleware ────────────────────────────────────────────────────────────────
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'accounts.middleware.MaintenanceModeMiddleware',
]

ROOT_URLCONF = 'AfriSell.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'AfriSell.wsgi.application'

# ── Base de données ───────────────────────────────────────────────────────────
_db_url = config('DATABASE_URL', default=f'sqlite:///{BASE_DIR / "db.sqlite3"}')
_db_url = _db_url.replace('&channel_binding=require', '').replace('channel_binding=require&', '').replace('?channel_binding=require', '')

DATABASES = {
    'default': dj_database_url.config(
        default=_db_url,
        conn_max_age=600,
    )
}

# ── Internationalisation ──────────────────────────────────────────────────────
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE     = config('TIME_ZONE', default='Africa/Abidjan')
USE_I18N      = True
USE_TZ        = True

# ── Fichiers statiques & médias ───────────────────────────────────────────────
STATIC_URL   = '/static/'
STATIC_ROOT  = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Cloudinary — stockage cloud des médias (photos produits, logos boutiques, flyers)
# En dev : CLOUDINARY_URL vide → stockage local dans /media/
# En prod : CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
CLOUDINARY_URL = config('CLOUDINARY_URL', default='')

if CLOUDINARY_URL and not DEBUG:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    CLOUDINARY_STORAGE   = {'CLOUDINARY_URL': CLOUDINARY_URL}
    MEDIA_URL = f'https://res.cloudinary.com/{CLOUDINARY_URL.split("@")[-1]}/'
else:
    MEDIA_URL  = config('MEDIA_URL', default='/media/')
    MEDIA_ROOT = config('MEDIA_ROOT', default=str(BASE_DIR / 'media'))

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ── DRF ──────────────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '200/day',
        'user': '2000/day',
        'auth_login': '10/minute',
        'auth_register': '5/minute',
        'auth_otp': '5/minute',
        'auth_reset': '5/hour',
    },
}

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:5173', cast=Csv())
CORS_ALLOW_CREDENTIALS = True

# ── Email ─────────────────────────────────────────────────────────────────────
EMAIL_BACKEND      = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST         = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT         = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS      = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER    = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='AfriSell <noreply@afrisell.com>')

# ── Celery ────────────────────────────────────────────────────────────────────
CELERY_BROKER_URL         = config('CELERY_BROKER_URL', default='redis://127.0.0.1:6379/0')
CELERY_RESULT_BACKEND     = config('CELERY_RESULT_BACKEND', default='redis://127.0.0.1:6379/1')
REDIS_OTP_URL             = config('REDIS_OTP_URL', default='redis://127.0.0.1:6379/2')
CELERY_ACCEPT_CONTENT     = ['json']
CELERY_TASK_SERIALIZER    = 'json'
CELERY_RESULT_SERIALIZER  = 'json'
CELERY_TIMEZONE           = TIME_ZONE
CELERY_BEAT_SCHEDULER     = 'django_celery_beat.schedulers:DatabaseScheduler'

# En développement (DEBUG=True) : pas besoin de Redis ni de worker Celery.
# Les tâches s'exécutent directement dans le même processus Django.
if DEBUG:
    CELERY_TASK_ALWAYS_EAGER = True
    CELERY_TASK_EAGER_PROPAGATES = True

from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'expire-subscriptions': {
        'task': 'billing.tasks.expire_subscriptions',
        'schedule': crontab(minute=0),
    },
    'notify-expiring-soon': {
        'task': 'billing.tasks.notify_expiring_soon',
        'schedule': crontab(hour=9, minute=0),
    },
    'compute-daily-stats': {
        'task': 'analytics.tasks.compute_daily_stats',
        'schedule': crontab(hour=0, minute=30),
    },
    'cleanup-product-views': {
        'task': 'analytics.tasks.cleanup_old_product_views',
        'schedule': crontab(hour=3, minute=0, day_of_week=1),
    },
    'close-stale-sira-conversations': {
        'task': 'sira.tasks.close_stale_conversations',
        'schedule': crontab(hour=2, minute=0),
    },
    'schedule-pending-posts': {
        'task': 'studio.tasks.schedule_pending_posts',
        'schedule': crontab(minute='*/5'),
    },
}

# ── Auth sociale ──────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID     = config('GOOGLE_CLIENT_ID', default='')
GOOGLE_CLIENT_SECRET = config('GOOGLE_CLIENT_SECRET', default='')
GOOGLE_REDIRECT_URI  = config('GOOGLE_REDIRECT_URI', default='http://localhost:8000/api/auth/google/callback/')
GOOGLE_TOKEN_URL     = config('GOOGLE_TOKEN_URL', default='https://oauth2.googleapis.com/token')
FACEBOOK_APP_ID      = config('FACEBOOK_APP_ID', default='')
FACEBOOK_APP_SECRET  = config('FACEBOOK_APP_SECRET', default='')
APPLE_KEY_ID         = config('APPLE_KEY_ID', default='')
APPLE_TEAM_ID        = config('APPLE_TEAM_ID', default='')
APPLE_BUNDLE_ID      = config('APPLE_BUNDLE_ID', default='')

# ── Frontend URL (utilisé dans les emails) ────────────────────────────────────
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')

# ── Stripe ────────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY      = config('STRIPE_SECRET_KEY', default='')
STRIPE_PUBLISHABLE_KEY = config('STRIPE_PUBLISHABLE_KEY', default='')
STRIPE_WEBHOOK_SECRET  = config('STRIPE_WEBHOOK_SECRET', default='')
STRIPE_SUCCESS_URL     = config('STRIPE_SUCCESS_URL', default='http://localhost:5173/billing/success')
STRIPE_CANCEL_URL      = config('STRIPE_CANCEL_URL', default='http://localhost:5173/billing/cancel')

# ── Paystack ──────────────────────────────────────────────────────────────────
PAYSTACK_SECRET_KEY    = config('PAYSTACK_SECRET_KEY',    default='')
PAYSTACK_PUBLIC_KEY    = config('PAYSTACK_PUBLIC_KEY',    default='')
PAYSTACK_WEBHOOK_SECRET = config('PAYSTACK_WEBHOOK_SECRET', default='')
PAYSTACK_CALLBACK_URL  = config('PAYSTACK_CALLBACK_URL',  default='http://localhost:5173/billing/success')

# ── CinetPay ──────────────────────────────────────────────────────────────────
CINETPAY_API_KEY    = config('CINETPAY_API_KEY', default='')
CINETPAY_SITE_ID    = config('CINETPAY_SITE_ID', default='')
CINETPAY_NOTIFY_URL = config('CINETPAY_NOTIFY_URL', default='')
CINETPAY_RETURN_URL = config('CINETPAY_RETURN_URL', default='')
CINETPAY_CANCEL_URL = config('CINETPAY_CANCEL_URL', default='')

# ── SIRA — Twilio + IA ────────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID      = config('TWILIO_ACCOUNT_SID', default='')
TWILIO_AUTH_TOKEN       = config('TWILIO_AUTH_TOKEN', default='')
TWILIO_WHATSAPP_NUMBER  = config('TWILIO_WHATSAPP_NUMBER', default='')
GEMINI_API_KEY          = config('GEMINI_API_KEY', default='')
OPENAI_API_KEY          = config('OPENAI_API_KEY', default='')
GROQ_API_KEY            = config('GROQ_API_KEY', default='')
WA_BRIDGE_URL           = config('WA_BRIDGE_URL', default='http://127.0.0.1:3000')
WA_BRIDGE_SECRET        = config('WA_BRIDGE_SECRET', default='afrisell-bridge-secret-2026')
META_APP_ID             = config('META_APP_ID', default='')
META_APP_SECRET         = config('META_APP_SECRET', default='')
META_ACCESS_TOKEN       = config('META_ACCESS_TOKEN', default='')
META_PHONE_NUMBER_ID    = config('META_PHONE_NUMBER_ID', default='')
META_WABA_ID            = config('META_WABA_ID', default='')
META_WEBHOOK_VERIFY_TOKEN = config('META_WEBHOOK_VERIFY_TOKEN', default='')
META_API_VERSION        = config('META_API_VERSION', default='v19.0')
GROQ_MODEL              = config('GROQ_MODEL', default='llama-3.3-70b-versatile')
# Fournisseur LLM actif pour SIRA : 'gemini' | 'groq' | 'openai'
SIRA_LLM_PROVIDER       = config('SIRA_LLM_PROVIDER', default='groq')

# ── Studio ────────────────────────────────────────────────────────────────────
REMOVE_BG_API_KEY   = config('REMOVE_BG_API_KEY', default='')
REMOVE_BG_USE_LOCAL = config('REMOVE_BG_USE_LOCAL', default=False, cast=bool)
STUDIO_FONT_PATH    = config('STUDIO_FONT_PATH', default='')

# ── Maintenance ───────────────────────────────────────────────────────────────
MAINTENANCE_MODE = config('MAINTENANCE_MODE', default=False, cast=bool)

# ── Sécurité (toujours actif) ─────────────────────────────────────────────────
SECURE_CONTENT_TYPE_NOSNIFF = True        # empêche le sniffing MIME
SECURE_BROWSER_XSS_FILTER   = True        # active le filtre XSS navigateur
X_FRAME_OPTIONS              = 'DENY'     # interdit l'intégration en iframe

# ── Sécurité production uniquement ───────────────────────────────────────────
if not DEBUG:
    SECURE_HSTS_SECONDS             = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS  = True
    SECURE_HSTS_PRELOAD             = True
    SECURE_SSL_REDIRECT             = True
    SESSION_COOKIE_SECURE           = True
    SESSION_COOKIE_HTTPONLY         = True
    CSRF_COOKIE_SECURE              = True
    CSRF_COOKIE_HTTPONLY            = True
    SECURE_PROXY_SSL_HEADER         = ('HTTP_X_FORWARDED_PROTO', 'https')
    # restreindre CORS en production
    CORS_ALLOW_CREDENTIALS          = False
