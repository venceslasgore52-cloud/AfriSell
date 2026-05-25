# AfriSell

Plateforme e-commerce pensée pour les vendeurs d'Afrique de l'Ouest.
Chaque vendeur a une boutique en ligne, un bot WhatsApp (SIRA) qui prend les commandes automatiquement, un studio IA pour créer ses visuels, et un tableau de bord pour tout suivre.

---

## Architecture

```
AfriSell/
├── AfriSell/          → Frontend React + Vite
│   └── src/
├── backend/           → API Django REST Framework
│   ├── accounts/      → Authentification, profils, boutiques
│   ├── billing/       → Abonnements, paiements, factures
│   ├── catalogue/     → Produits des vendeurs
│   ├── orders/        → Commandes (SIRA + lien public)
│   ├── sira/          → Bot WhatsApp intelligent
│   ├── studio/        → Studio IA (visuels, vidéos, textes)
│   ├── analytics/     → Statistiques et analyses de marché
│   ├── notifications/ → Notifications WhatsApp / email
│   └── AfriSell/      → Settings, urls, wsgi
```

---

## Stack technique

### Backend
| Outil | Rôle |
|---|---|
| Django 5.0 + DRF | API REST |
| PostgreSQL | Base de données production |
| Redis | Cache + broker Celery |
| Celery + django-celery-beat | Tâches asynchrones (renouvellements, expiration abonnements, PDF) |
| Django Channels | WebSocket (SIRA temps réel) |
| Stripe | Paiements internationaux |
| CinetPay / GeniusPay | Paiements Mobile Money Afrique de l'Ouest (XOF) |
| Reportlab | Génération de factures PDF |
| Pillow | Traitement d'images |
| Gunicorn + Whitenoise | Production |

### Frontend
| Outil | Rôle |
|---|---|
| React 19 | UI |
| Vite 8 | Build |
| ESLint | Linting |

---

## Installation

### Prérequis
- Python 3.11+
- Node.js 18+
- Redis (pour Celery)
- PostgreSQL (prod) ou SQLite (dev)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

pip install -r requirements.txt

# Copier et configurer les variables d'environnement
copy .env.example .env

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd AfriSell
npm install
npm run dev
```

### Celery (dans un terminal séparé)

```bash
cd backend
venv\Scripts\activate
celery -A AfriSell worker -l info
celery -A AfriSell beat -l info      # pour les tâches planifiées
```

---

## Variables d'environnement

Créer un fichier `backend/.env` :

```env
# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Base de données (prod)
DATABASE_URL=postgres://user:password@localhost:5432/afrisell

# Redis
REDIS_URL=redis://localhost:6379/0

# Paiements
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=http://localhost:5173/billing/success
STRIPE_CANCEL_URL=http://localhost:5173/billing/cancel

CINETPAY_API_KEY=your-cinetpay-key
CINETPAY_SITE_ID=your-site-id
CINETPAY_NOTIFY_URL=https://yourdomain.com/api/billing/webhooks/cinetpay/
CINETPAY_RETURN_URL=http://localhost:5173/billing/success

GENIUSPAY_API_KEY=your-geniuspay-key
GENIUSPAY_SITE_ID=your-site-id
GENIUSPAY_NOTIFY_URL=https://yourdomain.com/api/billing/webhooks/geniuspay/
GENIUSPAY_RETURN_URL=http://localhost:5173/billing/success

# Auth sociale
GOOGLE_CLIENT_ID=your-google-client-id
APPLE_CLIENT_ID=your-apple-bundle-id

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=noreply@afrisell.com
EMAIL_HOST_PASSWORD=your-password
```

---

## API — Endpoints principaux

### Authentification (`/api/accounts/`)
```
POST   auth/register/               Inscription
POST   auth/login/                  Connexion → Token
POST   auth/logout/                 Déconnexion
POST   auth/social/                 Login Google / Facebook / Apple
POST   auth/verify-email/           Vérification email
POST   auth/password-reset/         Demande de reset
POST   auth/password-reset/confirm/ Confirmation reset
POST   auth/change-password/        Changement de mot de passe
GET    me/                          Profil utilisateur connecté
PATCH  me/                          Modifier profil
GET    me/profile/                  Profil étendu (avatar, langue...)
PATCH  me/profile/                  Modifier profil étendu
GET    me/shop/                     Ma boutique
POST   me/shop/                     Créer ma boutique
PATCH  me/shop/                     Modifier ma boutique
GET    me/shop/updates/             Annonces de la boutique
POST   me/shop/updates/             Créer une annonce
GET    me/social/                   Connexions réseaux sociaux
DELETE me/social/<id>/              Déconnecter un réseau
```

### Billing (`/api/billing/`)
```
GET    plans/                       Liste des plans (public)
POST   checkout/                    Initier un paiement
POST   stripe/portal/               Portail Stripe self-service
GET    subscription/                Mon abonnement
DELETE subscription/                Annuler mon abonnement
GET    payments/                    Historique paiements
GET    invoices/                    Mes factures PDF
POST   webhooks/stripe/             IPN Stripe
POST   webhooks/cinetpay/           IPN CinetPay
POST   webhooks/geniuspay/          IPN GeniusPay
```

### Catalogue (`/api/catalogue/`)
```
GET    shop/<shop_id>/              Vitrine publique d'une boutique
GET    shop/<shop_id>/<id>/         Détail produit public
GET    me/                          Mes produits
POST   me/                          Ajouter un produit
GET    me/<id>/                     Détail produit
PATCH  me/<id>/                     Modifier produit
DELETE me/<id>/                     Supprimer produit
PATCH  me/<id>/publish/             Gérer les plateformes de publication
PATCH  me/<id>/stock/               Mise à jour rapide du stock
```

### Commandes (`/api/orders/`)
```
GET    me/                          Mes commandes reçues
GET    me/stats/                    Stats du dashboard (par statut, CA jour/mois)
GET    me/<id>/                     Détail commande + items + historique
PATCH  me/<id>/status/              Changer le statut (transitions validées)
PATCH  me/<id>/note/                Note interne vendeur
POST   create/<shop_id>/            Créer une commande (SIRA / lien public)
```

---

## Plans tarifaires

| | Starter | Pro | Business |
|---|---|---|---|
| Prix Afrique | 5$/mois | 20$/mois | 30$/mois |
| Prix Global | 10$/mois | 20$/mois | 30$/mois |
| Produits | 10 | 50 | Illimité |
| SIRA Bot | — | Oui | Oui |
| Studio IA | Basique | Complet | Complet |
| Suppression fond | — | Oui | Oui |
| Publication auto | — | — | Oui |
| Analytics | — | Oui | Oui |
| Analyse de marché IA | — | Oui | Oui |

> Paiement auto-détecté selon le pays : **XOF** (CinetPay/GeniusPay) pour l'Afrique de l'Ouest, **USD** (Stripe) pour le reste.

---

## Détection automatique de devise

| Pays | Provider | Devise |
|---|---|---|
| CI, SN, ML, BF, GN, TG, BJ, NE, CM, CG | GeniusPay / CinetPay | XOF |
| GH, NG, KE, TZ, ET, RW | Stripe | USD (prix Afrique) |
| Reste du monde | Stripe | USD (prix Global) |

---

## Tâches Celery planifiées

| Tâche | Fréquence | Description |
|---|---|---|
| `billing.tasks.expire_subscriptions` | Chaque nuit à 1h | Passe les abonnements expirés en `expired` |
| `billing.tasks.notify_expiring_soon` | Chaque matin à 8h | Envoie un lien de renouvellement J-7 |

```python
# à ajouter dans celery.py
from celery.schedules import crontab

app.conf.beat_schedule = {
    'expire-subscriptions': {
        'task': 'billing.tasks.expire_subscriptions',
        'schedule': crontab(hour=1, minute=0),
    },
    'notify-renewals': {
        'task': 'billing.tasks.notify_expiring_soon',
        'schedule': crontab(hour=8, minute=0),
    },
}
```

---

## Statuts de commande

```
pending → confirmed → processing → delivering → delivered
    └──────────────────────────────────────────→ cancelled
```
Les retours en arrière sont interdits. Chaque transition est tracée dans `OrderStatusHistory`.

---

## Lancer les tests

```bash
cd backend
python manage.py test
```

---

## Contact
**Email** : contact@afrisell.com
**Site** : afrisell.com
