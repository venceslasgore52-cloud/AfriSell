# AfriSell

**Plateforme SaaS e-commerce pour les commerçants africains**

AfriSell permet à tout vendeur de créer sa boutique en ligne, gérer son catalogue produits, recevoir des commandes via WhatsApp grâce au bot IA SIRA, créer des visuels marketing avec Studio IA, et encaisser ses paiements en Mobile Money ou carte bancaire.

---

## Architecture

```
afrisell/
├── AfriSell/          # Frontend — React 19 + Vite + Tailwind CSS + DaisyUI
├── backend/           # Backend  — Django 4.2 + DRF + Celery + Redis
└── wa-bridge/         # WA Bridge — Node.js (connexion WhatsApp QR scan)
```

---

## Fonctionnalités

### Pour le vendeur
| Module | Description |
|---|---|
| **Boutique** | Création de boutique avec logo, horaires, localisation |
| **Catalogue** | Gestion produits avec photos, prix, stock |
| **Commandes** | Suivi des commandes avec historique de statuts |
| **Bot SIRA** | Assistant WhatsApp IA — prend les commandes automatiquement |
| **Studio IA** | Génération de textes, flyers produits, suppression de fond |
| **Publications** | Planification de posts réseaux sociaux |
| **Facturation** | Abonnements Starter / Pro / Business |
| **Analytics** | Tableau de bord des ventes |

### Pour l'admin
| Module | Description |
|---|---|
| **Utilisateurs** | Gestion de tous les comptes |
| **Vendeurs** | Supervision des boutiques |
| **Passerelles** | Activation/désactivation des modes de paiement |
| **Commandes** | Vue globale de toutes les transactions |

---

## Stack technique

### Backend
- **Django 4.2** + Django REST Framework
- **PostgreSQL** (production) / SQLite (développement)
- **Redis** (Upstash) — cache OTP, broker Celery
- **Celery** + Celery Beat — tâches asynchrones (flyers, emails, webhooks)
- **Gunicorn** + WhiteNoise — serveur WSGI production
- **Cloudinary** — stockage médias (photos produits, logos)

### Frontend
- **React 19** + Vite + React Router v6
- **Tailwind CSS** + DaisyUI
- **Lazy loading** + code splitting automatique
- Build optimisé avec suppression des `console.*`

### IA & Bot
- **Groq** (llama-3.3-70b) — LLM principal (gratuit, ~1000 req/jour)
- **Gemini** — analyse d'intention + génération contenu
- **Whisper / OpenAI** — transcription messages vocaux
- **remove.bg** — suppression de fond (Studio IA)
- **Meta WhatsApp Cloud API** — bot WhatsApp officiel
- **Twilio** — sandbox WhatsApp (développement)

### Paiements
- **Google Pay** / **Stripe** — carte bancaire internationale
- **CinetPay** — Mobile Money Afrique de l'Ouest
- **GeniusPay** — XOF Afrique francophone

### Auth
- Email + mot de passe
- Google OAuth 2.0
- OTP téléphone (SMS)
- Vérification email par lien

---

## Déploiement production

| Service | Plateforme | URL |
|---|---|---|
| Frontend | Vercel | `https://afrisell.vercel.app` |
| Backend API | Railway / Koyeb | `https://api.afrisell.com` |
| Base de données | Neon (PostgreSQL) | — |
| Redis | Upstash | — |
| Médias | Cloudinary | — |

### Variables d'environnement requises

Voir `backend/.env` pour la liste complète.

Variables critiques à configurer en production :

```bash
SECRET_KEY            # Clé Django secrète
DEBUG=False
DATABASE_URL          # PostgreSQL Neon
REDIS_URL             # Upstash Redis
CLOUDINARY_URL        # Stockage médias
EMAIL_HOST_PASSWORD   # Gmail App Password
STRIPE_SECRET_KEY     # Paiements internationaux
META_ACCESS_TOKEN     # Bot WhatsApp officiel
CINETPAY_API_KEY      # Mobile Money
```

### Démarrage rapide (développement)

```bash
# Backend
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend (autre terminal)
cd AfriSell
npm install
npm run dev

# Celery worker (autre terminal)
cd backend
celery -A AfriSell worker --loglevel=info
```

---

## Sécurité

- Tokens DRF (pas de session cookies)
- Rate limiting par endpoint (login, register, OTP, reset password)
- Validation magic bytes sur les fichiers uploadés (JPEG/PNG/WEBP/GIF)
- Rôles strictement enforced côté serializer (impossible de s'auto-promouvoir admin)
- Headers sécurité : `X-Frame-Options`, `Content-Type-Nosniff`, `XSS-Protection`
- HSTS activé en production
- Webhooks Stripe/Twilio validés par signature

---

## Statut des intégrations

| Intégration | Statut |
|---|---|
| Email (Gmail SMTP) | ✅ Configuré |
| Google OAuth | ✅ Configuré |
| Groq LLM | ✅ Configuré |
| remove.bg | ✅ Configuré |
| Upstash Redis | ✅ Configuré |
| Stripe / Google Pay | ⏳ Clés à ajouter en production |
| CinetPay | ⏳ Validation compte en cours |
| GeniusPay | ⏳ Clés à ajouter |
| Meta WhatsApp | ⏳ Validation business en cours |

---

## Auteur

Projet développé par **Venceslas Gore** — Étudiant L1 Informatique  
Contact : venceslasgore52@gmail.com
