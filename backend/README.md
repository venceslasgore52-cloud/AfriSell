# AfriSell 🌍

> Plateforme SaaS mobile-first qui permet à tout petit commerçant africain de créer sa publicité, la diffuser, et recevoir des commandes automatiquement via WhatsApp — sans compétence technique.

---

## 🎯 Vision

AfriSell résout un problème réel et quotidien : les petits commerçants africains perdent du temps et de l'argent à gérer manuellement leur publicité et leurs commandes WhatsApp. AfriSell automatise ce cycle complet — de la création du contenu publicitaire jusqu'à la réception de la commande.

---

## 🤖 SIRA — Smart Intelligent Response Assistant

SIRA est le bot commercial intelligent d'AfriSell. Chaque vendeur Pro/Business obtient un **numéro WhatsApp Business dédié** via Twilio/360dialog. SIRA répond aux clients, présente le catalogue, collecte les commandes avec localisation et notifie le vendeur en temps réel.

---

## 🏛️ Décisions d'architecture

Ces décisions sont figées — elles ne doivent pas être remises en cause sans raison explicite.

| Décision | Choix retenu | Raison |
|---|---|---|
| **Livraison** | Hors scope — le vendeur gère lui-même | AfriSell ne peut pas garantir la logistique en Afrique de l'Ouest |
| **Paiement client final** | Hors scope — cash ou Mobile Money à la livraison | AfriSell n'est pas un agrégateur de paiement pour les clients finaux |
| **WhatsApp** | Numéro Business dédié par boutique via Twilio/360dialog | Isolation des conversations, numéro propre au vendeur |
| **IA génération** | Gemini 1.5 Flash — gratuit jusqu'à 1 500 req/jour | Tier gratuit suffisant pour ~50 boutiques actives ; payant ensuite via clé vendeur |
| **Publication réseaux** | V1 manuelle (vendeur publie lui-même) | V2 automatique après approbation Meta API (délai 3-6 mois) |
| **SIRA vocal** | V1 : comprend les vocaux (Whisper) — répond en texte | V2 : réponse vocale (TTS) — hors scope V1, complexité réseau mobile |
| **Détection prix** | Région détectée via `shop.country` du profil vendeur | Pas d'IP geolocation — le vendeur connaît son marché à l'inscription |
| **Devise Afrique** | XOF fixe (1 USD = 600 XOF, pegging EUR) pour CI/SN/ML/BF/GN/TG/BJ/NE/CM/CG | Stabilité monétaire zone franc CFA |

---

## 💼 Offres

Prix détecté automatiquement via `shop.country` — pas de géolocalisation IP.

| Plan | Prix Afrique | Prix Global | Fonctionnalités clés |
|---|---|---|---|
| **Starter** | 5 $/mois | 10 $/mois | Studio IA limité, catalogue, commandes via lien, analytics de base |
| **Pro** | 20 $/mois | 20 $/mois | Tout Starter sans limites + **SIRA bot** (commandes WhatsApp) + analytics avancés |
| **Business** | 30 $/mois | 30 $/mois | Tout Pro + suppression de fond, publication auto (V2), analyse de marché |

> Publication automatique sur les réseaux sociaux : **V1 manuelle** (vendeur publie lui-même). V2 automatique après approbation Meta API (délai estimé 3–6 mois).

---

## 🏗️ Architecture Backend

```
afrisell/
├── accounts/        → Auth vendeur (Token DRF)
├── billing/         → Abonnements + paiements Stripe / CinetPay / GeniusPay
├── catalogue/       → Produits du vendeur
├── orders/          → Gestion commandes reçues
├── notifications/   → Alertes vendeur temps réel
├── analytics/       → Stats, graphiques, suivi de trafic
├── sira/            → Bot WhatsApp SIRA (machine à états + Gemini)
└── studio/          → Génération contenu IA (Gemini + Pillow + remove.bg)
```

### Relations entre modules

```
accounts ──→ billing        (un vendeur a un abonnement)
accounts ──→ catalogue      (un vendeur a des produits)
catalogue ──→ orders        (les produits sont référencés dans les commandes)
orders ──→ notifications    (commande créée/mise à jour = alerte vendeur)
catalogue ──→ analytics     (vues fiches produits trackées)
orders ──→ analytics        (stats quotidiennes calculées depuis orders)
catalogue ──→ sira          (SIRA lit le catalogue pour répondre aux clients)
sira ──→ orders             (SIRA crée les commandes après localisation reçue)
sira ──→ notifications      (commande SIRA = notification vendeur)
```

---

## 🔑 Authentification

Token DRF (`rest_framework.authtoken`). Toutes les routes protégées attendent :

```
Authorization: Token <token>
```

---

## 📡 Endpoints API

### Accounts — `/api/accounts/`

| Méthode | URL | Auth | Description |
|---|---|---|---|
| POST | `auth/register/` | — | Inscription vendeur |
| POST | `auth/login/` | — | Connexion → Token |
| POST | `auth/logout/` | ✓ | Révocation Token |
| POST | `auth/verify-email/` | — | Vérification email |
| POST | `auth/password-reset/` | — | Demande reset MDP |
| POST | `auth/password-reset/confirm/` | — | Confirm reset MDP |
| POST | `auth/change-password/` | ✓ | Changement MDP |
| POST | `auth/social/` | — | Login social (Google/Facebook/Apple) |
| GET/PATCH | `me/` | ✓ | Profil utilisateur |
| GET/PATCH | `me/profile/` | ✓ | Préférences profil |
| GET/POST/PATCH | `me/shop/` | ✓ Tenant | Boutique du vendeur |
| GET/POST | `me/shop/updates/` | ✓ Tenant | Mises à jour boutique |
| GET/PATCH/DELETE | `me/shop/updates/<uuid>/` | ✓ Tenant | Détail mise à jour |
| GET | `me/social/` | ✓ | Connexions sociales |
| DELETE | `me/social/<uuid>/` | ✓ | Supprimer connexion sociale |

### Billing — `/api/billing/`

| Méthode | URL | Auth | Description |
|---|---|---|---|
| GET | `plans/` | — | Liste des plans disponibles |
| GET | `plans/<slug>/` | — | Détail d'un plan |
| GET | `my-subscription/` | ✓ | Abonnement actif du vendeur |
| POST | `checkout/` | ✓ | Créer lien de paiement (Stripe / GeniusPay / CinetPay) |
| POST | `stripe/webhook/` | — | Webhook Stripe |
| POST | `geniuspay/ipn/` | — | IPN GeniusPay |
| POST | `cinetpay/ipn/` | — | IPN CinetPay |
| GET | `invoices/` | ✓ | Liste des factures |
| GET | `invoices/<uuid>/` | ✓ | Détail facture |
| GET | `invoices/<uuid>/pdf/` | ✓ | Télécharger PDF facture |

### Catalogue — `/api/catalogue/`

| Méthode | URL | Auth | Description |
|---|---|---|---|
| GET | `shop/<shop_id>/products/` | — | Catalogue public d'une boutique |
| GET | `shop/<shop_id>/products/<uuid>/` | — | Fiche produit publique |
| GET/POST | `me/products/` | ✓ Tenant | Mes produits |
| GET/PATCH/DELETE | `me/products/<uuid>/` | ✓ Tenant | Détail / modifier / supprimer |
| PATCH | `me/products/<uuid>/publish/` | ✓ Tenant | Activer/désactiver plateformes |
| PATCH | `me/products/<uuid>/stock/` | ✓ Tenant | Mettre à jour le stock |

### Orders — `/api/orders/`

| Méthode | URL | Auth | Description |
|---|---|---|---|
| POST | `create/<shop_id>/` | — | Créer une commande (client) |
| GET | `me/` | ✓ Tenant | Mes commandes reçues |
| GET | `me/<uuid>/` | ✓ Tenant | Détail commande |
| PATCH | `me/<uuid>/status/` | ✓ Tenant | Mettre à jour le statut |
| GET | `me/stats/` | ✓ Tenant | Stats rapides (par statut) |

### Notifications — `/api/notifications/`

| Méthode | URL | Auth | Description |
|---|---|---|---|
| GET | `me/` | ✓ | Liste de mes notifications (filtrables) |
| GET | `me/unread-count/` | ✓ | Nombre de non-lues (badge navbar) |
| POST | `me/read/` | ✓ | Marquer tout (ou sélection) comme lu |
| DELETE | `me/clear/` | ✓ | Supprimer toutes les notifications lues |
| GET/DELETE | `me/<uuid>/` | ✓ | Détail / supprimer une notification |
| POST | `me/<uuid>/read/` | ✓ | Marquer une notification comme lue |

### Studio — `/api/studio/`

| Méthode | URL | Auth | Plan requis | Description |
|---|---|---|---|---|
| GET | `quota/` | ✓ Tenant | Tous | Quota IA mensuel (utilisé / limite) |
| POST | `generate-text/` | ✓ Tenant | Tous | Générer un texte publicitaire (Gemini, synchrone) |
| GET/POST | `assets/` | ✓ Tenant | Tous | Mes assets IA (flyer, texte, suppression fond) |
| GET/DELETE | `assets/<uuid>/` | ✓ Tenant | Tous | Détail asset + polling statut |
| GET/POST | `posts/` | ✓ Tenant | Tous | Mes posts de publication |
| GET/PATCH/DELETE | `posts/<uuid>/` | ✓ Tenant | Tous | Détail / modifier / supprimer un post |
| GET/POST | `smart-schedule/` | ✓ Tenant | Business | Suggestions de créneaux de publication |

**Types d'assets (`type`) :**
| Type | Description | Moteur | Plan |
|---|---|---|---|
| `text` | Légende / post publicitaire | Gemini 1.5 Flash | Tous |
| `flyer` | Flyer 1080×1080 prêt à publier | Pillow (template) | Tous |
| `image` | Suppression de fond produit | remove.bg API | Business |
| `video` | Vidéo produit | *(V2 — hors scope)* | — |

> **Publication automatique** : V1 manuelle (le vendeur télécharge et publie lui-même). V2 automatique via Meta API après approbation (délai estimé 3–6 mois).

### SIRA — `/api/sira/`

| Méthode | URL | Auth | Description |
|---|---|---|---|
| POST | `webhook/` | — (sig. Twilio) | Réception messages WhatsApp (Twilio) |
| GET/PATCH | `me/config/` | ✓ Tenant | Configurer son bot SIRA |
| GET | `me/conversations/` | ✓ Tenant | Historique des conversations clients |
| GET | `me/conversations/<uuid>/` | ✓ Tenant | Détail conversation + messages |
| GET | `me/stats/` | ✓ Tenant | Stats SIRA (30j) |

**Flux de conversation SIRA :**
```
Client → WhatsApp → Twilio webhook → Celery
  → [audio ? Whisper] → Gemini (intent) → handler state machine
  → [localisation ? create Order + notify vendor]
  → Twilio REST API → Client
```

**États de conversation :** `idle` → `browsing` → `selecting` → `confirming` → `awaiting_location` → `completed`

**V1 / V2 :**
- V1 ✅ — comprend les messages vocaux (Whisper → transcription texte) + répond en texte
- V2 ⏳ — réponse vocale synthétisée (TTS) après validation du volume

### Analytics — `/api/analytics/`

| Méthode | URL | Auth | Plan requis | Description |
|---|---|---|---|---|
| GET | `dashboard/` | ✓ | Tous | Stats temps réel (aujourd'hui / ce mois) |
| GET | `revenue/?period=30` | ✓ | Pro / Business | Revenus + commandes par jour |
| GET | `top-products/?limit=10&period=30` | ✓ | Pro / Business | Top produits par CA |
| GET | `orders-by-status/?period=30` | ✓ | Pro / Business | Répartition commandes par statut |
| GET | `orders-by-source/?period=30` | ✓ | Pro / Business | SIRA vs lien direct |
| GET | `product-views/?period=30` | ✓ | Pro / Business | Trafic par source + top produits vus |
| POST | `track/product/<uuid>/` | — | — | Enregistrer une vue produit (client) |

> **Périodes acceptées pour `revenue/`** : `7`, `30`, `90`, `365` jours.

---

## 🖥️ Architecture Frontend

```
afrisell-frontend/
├── src/
│   ├── pages/
│   │   ├── auth/            → Login, Register, ForgotPassword
│   │   ├── dashboard/       → Vue globale stats et commandes
│   │   ├── catalogue/       → Gestion produits
│   │   ├── orders/          → Commandes en temps réel
│   │   ├── studio/          → Génération contenu IA
│   │   ├── sira/            → Configuration du bot
│   │   ├── billing/         → Gestion abonnement
│   │   └── notifications/   → Alertes
│   ├── components/
│   │   ├── layout/          → Sidebar, Navbar, Footer
│   │   ├── ui/              → Button, Modal, Card, Badge
│   │   └── shared/          → ProductCard, OrderCard
│   ├── services/            → Axios + intercepteurs JWT
│   ├── store/               → Redux Toolkit slices
│   ├── hooks/               → useAuth, useOrders
│   └── utils/               → Constants, helpers
```

---

## ⚙️ Tâches Celery Beat

| Tâche | Fréquence | Description |
|---|---|---|
| `billing.tasks.expire_subscriptions` | Toutes les heures | Passe en `expired` les abonnements CinetPay/GeniusPay dépassés |
| `billing.tasks.notify_expiring_soon` | Tous les jours à 9h | Envoie un lien de renouvellement J-7 avant expiration |
| `analytics.tasks.compute_daily_stats` | Tous les jours à 00h30 | Calcule les `DailyStat` de la veille pour toutes les boutiques actives |
| `analytics.tasks.cleanup_old_product_views` | Tous les lundis à 3h | Supprime les `ProductView` de plus de 90 jours |
| `sira.tasks.close_stale_conversations` | Tous les jours à 2h | Ferme les conversations SIRA sans activité depuis 24h |
| `studio.tasks.schedule_pending_posts` | Toutes les 5 minutes | Déclenche les posts dont l'heure programmée est passée |

Exemple de configuration dans `settings.py` :

```python
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
```

---

## 🛠️ Stack Technique

### Backend
- **Django 4.2+** + Django REST Framework
- **PostgreSQL** — base de données principale
- **Token Auth (DRF)** — authentification
- **Celery + Redis** — tâches asynchrones (expiration abonnements, stats quotidiennes, PDF, traitement messages SIRA)
- **Stripe** — abonnements récurrents (hors Afrique, en USD)
- **CinetPay / GeniusPay** — paiements mobile money (zone XOF — GeniusPay utilisé en attendant la validation CinetPay)
- **Reportlab** — génération PDF des factures d'abonnement

### Frontend
- **React 18**
- **Redux Toolkit** — state management
- **Axios** — appels API + intercepteur JWT
- **React Router v6** — navigation
- **Tailwind CSS** — design
- **React Query** — cache et synchronisation

### Bot SIRA
- **Twilio / 360dialog** — WhatsApp Business API (numéro dédié par boutique)
- **Gemini 1.5 Flash** — analyse d'intention + génération de réponse (gratuit : 1 500 req/jour ≈ 50 boutiques actives ; au-delà : clé API vendeur)
- **OpenAI Whisper** — transcription des messages vocaux (V1)
- **TTS** — réponse vocale synthétisée (V2 — hors scope actuellement)

### Studio IA
- **Gemini 1.5 Flash** — génération de textes publicitaires par plateforme et langue
- **Pillow** — génération de flyers 1080×1080 (template AfriSell, aucun GPU requis)
- **remove.bg API** — suppression de fond (50 crédits/mois gratuits ; plan Business)
- **rembg[cpu]** — alternative locale à remove.bg (optionnel, ~170 MB, REMOVE_BG_USE_LOCAL=True)

### Hébergement
- **Railway / Render** — déploiement backend
- **Vercel** — déploiement frontend

---

## 🔄 Flux de commande

```
1. Client voit la pub du commerçant
2. Envoie un message sur le numéro WhatsApp Business AfriSell
3. SIRA répond automatiquement et présente le catalogue
4. Client choisit le produit et confirme
5. SIRA demande la localisation via lien Google Maps
6. Client partage sa position
7. Vendeur reçoit notification — commande + localisation
8. Vendeur contacte son livreur
9. Paiement cash ou Mobile Money à la livraison
```

> AfriSell ne touche jamais à l'argent. Le paiement se fait directement entre client et vendeur.

---

## 📦 Ordre de développement

| Ordre | Module | Statut |
|---|---|---|
| 1 | accounts | ✅ Terminé |
| 2 | billing | ✅ Terminé |
| 3 | catalogue | ✅ Terminé |
| 4 | orders | ✅ Terminé |
| 5 | notifications | ✅ Terminé |
| 6 | analytics | ✅ Terminé |
| 7 | sira | ✅ Terminé |
| 8 | studio | ✅ Terminé |

---

## 🌍 Marchés cibles

- **Phase 1** — Abidjan, Côte d'Ivoire
- **Phase 2** — Afrique de l'Ouest (Sénégal, Mali, Burkina, Guinée)
- **Phase 3** — Diaspora africaine en Europe
- **Phase 4** — Amérique Latine, Asie du Sud-Est

---

## 👨‍💻 Auteur

Construit depuis Abidjan 🇨🇮 avec une vision globale.