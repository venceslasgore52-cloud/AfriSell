#!/usr/bin/env bash
# wa-bridge AfriSell — Installation des dépendances (Railway / local)
set -euo pipefail

GREEN='\033[0;32m'; CYAN='\033[0;36m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✔${NC} $*"; }
log()  { echo -e "${CYAN}▶${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC} $*"; }
err()  { echo -e "${RED}✘${NC} $*"; exit 1; }

# ── 1. Node.js ─────────────────────────────────────────────
log "Vérification Node.js..."
node --version 2>/dev/null || err "Node.js introuvable — installe Node.js 18+"
ok "Node $(node --version)"
npm --version >/dev/null || err "npm introuvable"
ok "npm $(npm --version)"

# ── 2. Dépendances Node ────────────────────────────────────
log "Installation des dépendances npm..."
npm install
ok "node_modules installés"

# ── 3. Chromium / Puppeteer (requis par whatsapp-web.js) ───
log "Vérification de Chromium pour Puppeteer..."

# Sur Railway (Linux) : installer les dépendances système nécessaires
if [[ "$(uname)" == "Linux" ]]; then
  log "Linux détecté — installation des libs Chromium..."
  apt-get update -qq && apt-get install -y -q \
    chromium-browser \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libxkbcommon0 \
    libasound2 \
    2>/dev/null || warn "apt-get non disponible — vérifie que Chromium est installé sur Railway"
  ok "Chromium prêt (Linux)"
else
  # Windows / Mac : Chrome doit être installé manuellement
  if [[ -f "C:/Program Files/Google/Chrome/Application/chrome.exe" ]]; then
    ok "Chrome trouvé (Windows)"
  else
    warn "Chrome non trouvé. Installe Google Chrome ou modifie executablePath dans server.js"
  fi
fi

# ── 4. Variables d'environnement ───────────────────────────
if [[ ! -f ".env" ]]; then
  warn ".env introuvable — crée-le avec ces variables :"
  echo "  PORT=3000"
  echo "  DJANGO_WEBHOOK_URL=https://ton-backend.railway.app/api/sira/wa-webhook/"
  echo "  BRIDGE_SECRET=ton-secret"
else
  ok ".env présent"
fi

# ── 5. Dossier sessions ────────────────────────────────────
mkdir -p sessions
ok "Dossier sessions/ prêt (stockage authentification WhatsApp)"

echo ""
echo -e "${GREEN}wa-bridge prêt.${NC}"
echo "  Démarrer : npm start"
echo "  Dev      : npm run dev"
echo ""
echo -e "${YELLOW}Note :${NC} Au premier lancement, scanne le QR code avec WhatsApp"
echo "  GET  /health                → état des sessions"
echo "  POST /session/start         → démarrer une session (body: { shop_id })"
echo "  GET  /session/:id/status    → statut d'une session"
echo "  POST /send                  → envoyer un message"
