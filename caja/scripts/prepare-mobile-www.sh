#!/usr/bin/env bash
# Arma mobile-www/ — una copia aislada de los archivos del sitio, usada
# SOLO como webDir de Capacitor (android/ + ios/). El sitio real sigue
# viviendo en la raíz del repo tal cual siempre (GitHub Pages lo sirve
# desde ahí) — este script existe porque Capacitor necesita una carpeta
# propia sin .git/, node_modules/, android/, ios/, etc. adentro; copiar
# la raíz entera como webDir metería todo eso dentro del APK/IPA.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf mobile-www
mkdir -p mobile-www
cp index.html app.html manifest.json sw.js icon-192.png icon-512.png biletes.avif mobile-www/
echo "mobile-www/ actualizada — ahora corré: npx cap sync"
