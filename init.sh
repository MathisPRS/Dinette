#!/bin/sh
# Prépare les dossiers de données avec les bonnes permissions.
# À lancer une seule fois après un clone ou un reset : ./init.sh
set -e

echo "Création des dossiers data/ ..."
mkdir -p data/postgres data/libretranslate data/uploads

echo "Permissions data/postgres → UID 70 (postgres alpine) ..."
# L'image postgres:16-alpine tourne avec UID 70
chmod 700 data/postgres
chown 70:70 data/postgres 2>/dev/null || {
  echo "  -> chown impossible sans root, on laisse Docker gérer au premier démarrage."
}

echo "Permissions data/uploads et data/libretranslate → lecture/écriture libre ..."
chmod 755 data/uploads data/libretranslate

echo "OK — tu peux lancer : docker compose up -d"
