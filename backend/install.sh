#!/usr/bin/env bash
# Backend AfriSell — Installation des dépendances et mise en place (Railway / local)
set -euo pipefail

GREEN='\033[0;32m'; CYAN='\033[0;36m'; RED='\033[0;31m'; NC='\033[0m'
ok()  { echo -e "${GREEN}✔${NC} $*"; }
log() { echo -e "${CYAN}▶${NC} $*"; }
err() { echo -e "${RED}✘${NC} $*"; exit 1; }

# ── 1. Python ──────────────────────────────────────────────
log "Vérification Python..."
python --version 2>/dev/null || python3 --version 2>/dev/null || err "Python introuvable"
ok "Python OK"

# ── 2. Environnement virtuel ───────────────────────────────
if [[ ! -d "venv" ]]; then
  log "Création du virtualenv..."
  python -m venv venv
  ok "virtualenv créé"
else
  ok "virtualenv existant"
fi

# Activer le venv (Linux/Mac/Railway = bin/, Windows = Scripts/)
if [[ -f "venv/Scripts/activate" ]]; then
  source venv/Scripts/activate
else
  source venv/bin/activate
fi
ok "virtualenv activé"

# ── 3. Dépendances Python ──────────────────────────────────
log "Installation des dépendances Python..."
pip install --upgrade pip -q
pip install -r requirements.txt
ok "Dépendances installées"

# ── 4. Variables d'environnement ───────────────────────────
if [[ ! -f ".env" ]]; then
  err ".env introuvable — crée-le depuis .env.example avant de continuer"
fi
ok ".env présent"

# ── 5. Migrations Django ───────────────────────────────────
log "Application des migrations..."
python manage.py migrate --run-syncdb
ok "Migrations appliquées"

# ── 6. Fichiers statiques ──────────────────────────────────
log "Collecte des fichiers statiques..."
python manage.py collectstatic --noinput
ok "Statiques collectés"

echo ""
echo -e "${GREEN}Backend prêt.${NC}"
echo "  Lancer en dev  : python manage.py runserver"
echo "  Lancer en prod : gunicorn AfriSell.wsgi:application --bind 0.0.0.0:\$PORT"
