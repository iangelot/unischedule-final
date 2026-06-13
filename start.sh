#!/usr/bin/env bash
# UniSchedule Africa — Launcher (Linux / macOS)
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "============================================================"
echo " UniSchedule Africa — Systeme de Gestion des Emplois du Temps"
echo "============================================================"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERREUR] Node.js n'est pas installe.${NC}"
    echo ""
    echo "Installez Node.js (v18+) depuis https://nodejs.org"
    echo "Ou via votre gestionnaire de paquets:"
    echo "  Ubuntu/Debian : sudo apt install nodejs npm"
    echo "  macOS         : brew install node"
    exit 1
fi

echo -e "${GREEN}[1/3] Node.js detecte: $(node --version)${NC}"

# Navigate to frontend
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/frontend"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[2/3] Installation des dependances (premiere utilisation)...${NC}"
    npm install --legacy-peer-deps --silent
else
    echo -e "${GREEN}[2/3] Dependances deja installees${NC}"
fi

echo -e "${GREEN}[3/3] Demarrage de l'application...${NC}"
echo ""
echo "============================================================"
echo " L'application s'ouvre dans votre navigateur dans 3s..."
echo " Adresse: http://localhost:5173"
echo ""
echo " Fonctionne entierement sur votre ordinateur."
echo " Aucun serveur, Docker ou internet requis."
echo ""
echo " Premiere utilisation: creez votre mot de passe admin."
echo " Pour arreter: Ctrl+C dans ce terminal"
echo "============================================================"
echo ""

# Open browser after 3s in background
(sleep 3 && {
    if command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:5173"      # Linux
    elif command -v open &> /dev/null; then
        open "http://localhost:5173"          # macOS
    fi
}) &

# Start Vite
npm run dev
