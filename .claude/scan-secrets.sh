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

# La apiKey de firebaseConfig es pública por diseño: se excluye del escaneo.
FIREBASE_PUBLIC_KEY='AIzaSyBfLKi3a6kZqkMKPQ8wRADQlUu3_NacXAA'

hits=$(git grep -nIE \
  -e '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----' \
  -e 'AIza[0-9A-Za-z_-]{35}' \
  -e '(BELVO_SECRET_(ID|PASSWORD)|PROMETEO_API_KEY|AFIP_(KEY|CERT|ACCESS_TOKEN))[^A-Za-z0-9_]*[:=][^A-Za-z0-9_]*["'"'"'][^"'"'"']' \
  -- . ':!*.lock' ':!.claude/scan-secrets.sh' ':!SECURITY.md' ':!README.md' ':!CLAUDE.md' ':!PENDIENTES.md' 2>/dev/null \
  | grep -v "$FIREBASE_PUBLIC_KEY")

if [ -n "$hits" ]; then
  printf '{"systemMessage": "🔒 Alerta de seguridad: posibles secretos en archivos versionados. Reproducir con: git grep -nIE \\"BEGIN (RSA )?PRIVATE KEY|AIza[0-9A-Za-z_-]{35}|(BELVO|PROMETEO|AFIP)_[A-Z_]+ *[:=]\\" -- . | grep -v node_modules | grep -v AIzaSyBfLKi3a6kZqkMKPQ8wRADQlUu3_NacXAA. Los secretos van en variables de entorno de Railway / config de Firebase, no en el repo.", "suppressOutput": true}'
else
  printf '{"suppressOutput": true}'
fi
exit 0
