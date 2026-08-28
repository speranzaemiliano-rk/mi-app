#!/usr/bin/env bash
# Escaneo liviano de secretos en archivos versionados (hook Stop). No bloquea.
# Busca patrones de ALTO riesgo que nunca deberían estar en el repo:
#   - Claves privadas PEM
#   - Tokens tipo AIza... (Google/Gemini), excluyendo la apiKey pública de Firebase
#   - Secrets de Belvo/Prometeo/AFIP asignados en código
# Se ejecuta sobre archivos rastreados por git. Salida JSON para Claude Code.
set -o pipefail

root=$(git rev-parse --show-toplevel 2>/dev/null) || { printf '{"suppressOutput": true}'; exit 0; }
cd "$root" || { printf '{"suppressOutput": true}'; exit 0; }

# Las apiKey de firebaseConfig son PÚBLICAS por diseño: viajan al navegador en cada carga y no
# son credenciales. Lo que protege la base son las reglas y tener cerrada el alta de cuentas.
# Se listan UNA POR UNA a propósito: excluir "cualquier AIza dentro de un config.js" taparía
# también una key de Gemini pegada ahí por error, que sí es un secreto y empieza igual.
#   1) modo-prueba-bb8c2  → el sistema principal (config.js)
#   2) control-caja-965ad → el parte de obra (obra/config.js), proyecto aparte a propósito
FIREBASE_PUBLIC_KEYS='AIzaSyBfLKi3a6kZqkMKPQ8wRADQlUu3_NacXAA|AIzaSyA8GzV2O8GTwCatLmSdfII8vL1-QN2EiH0'

hits=$(git grep -nIE \
  -e '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----' \
  -e 'AIza[0-9A-Za-z_-]{35}' \
  -e '(BELVO_SECRET_(ID|PASSWORD)|PROMETEO_API_KEY|AFIP_(KEY|CERT|ACCESS_TOKEN))[^A-Za-z0-9_]*[:=][^A-Za-z0-9_]*["'"'"'][^"'"'"']' \
  -- . ':!*.lock' ':!.claude/scan-secrets.sh' ':!SECURITY.md' ':!README.md' ':!CLAUDE.md' ':!PENDIENTES.md' 2>/dev/null \
  | grep -vE "$FIREBASE_PUBLIC_KEYS")

if [ -n "$hits" ]; then
  printf '{"systemMessage": "🔒 Alerta de seguridad: posibles secretos en archivos versionados. Reproducir con: git grep -nIE \\"BEGIN (RSA )?PRIVATE KEY|AIza[0-9A-Za-z_-]{35}|(BELVO|PROMETEO|AFIP)_[A-Z_]+ *[:=]\\" -- . | grep -v node_modules | quitando las apiKey públicas de Firebase (ver la lista en .claude/scan-secrets.sh). Los secretos van en variables de entorno de Railway / config de Firebase, no en el repo.", "suppressOutput": true}'
else
  printf '{"suppressOutput": true}'
fi
exit 0
