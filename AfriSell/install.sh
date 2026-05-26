#!/usr/bin/env bash
# Frontend AfriSell — Installation des dépendances et build (Vercel / local)
set -euo pipefail

GREEN='\033[0;32m'; CYAN='\033[0;36m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✔${NC} $*"; }
log()  { echo -e "${CYAN}▶${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC} $*"; }
err()  { echo -e "${RED}✘${NC} $*"; exit 1; }

# ── 1. Node.js ─────────────────────────────────────────────
log "Vérification Node.js..."
node --version 2>/dev/null || err "Node.js introuvable"
ok "Node $(node --version)"

# ── 2. Dépendances npm ─────────────────────────────────────
log "Installation des dépendances npm..."
npm install
ok "node_modules installés"

# ── 3. Variables d'environnement ───────────────────────────
if [[ ! -f ".env" && ! -f ".env.local" ]]; then
  warn "Aucun .env trouvé — crée .env.local avec :"
  echo "  VITE_API_URL=https://ton-backend.railway.app"
else
  ok ".env présent"
fi

# ── 4. Build de production ─────────────────────────────────
if [[ "${1:-}" == "--build" ]]; then
  log "Build de production..."
  npm run build
  ok "Build terminé → dossier dist/"
  echo ""
  echo "  Déploie le dossier dist/ sur Vercel :"
  echo "  npx vercel --prod"
else
  ok "Dépendances prêtes."
  echo ""
  echo "  Dev local  : npm run dev    (http://localhost:5173)"
  echo "  Build prod : bash install.sh --build"
  echo "  Deploy     : npx vercel --prod"
fi
