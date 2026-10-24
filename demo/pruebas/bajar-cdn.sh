#!/usr/bin/env bash
# Baja a demo/pruebas/cdn/ las librerías y fuentes que usa la app, para correr las pruebas sin depender de la red.
# Uso: bash demo/pruebas/bajar-cdn.sh
set -euo pipefail
D="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/cdn"; mkdir -p "$D"; cd "$D"
curl -fsS -O https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js
curl -fsS -O https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js
curl -fsS -O https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js
curl -fsS -O https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
curl -fsS -O https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
bajar_css() { curl -fsS -A "$UA" "https://fonts.googleapis.com/css2?family=$2&display=block" -o "$1.css"; }
bajar_css ms 'Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,200,0,0'; bajar_css sg 'Space+Grotesk:wght@400;500;600;700'; bajar_css raleway 'Raleway:wght@100;200;300;400;500'
python3 - <<'PY'
import re, subprocess, os, hashlib
for k in ('ms', 'sg', 'raleway'):
    css = open(k + '.css').read()
    for u in set(re.findall(r'url\((https://fonts\.gstatic\.com[^)]+)\)', css)):
        fn = 'font_' + hashlib.md5(u.encode()).hexdigest()[:10] + '.woff2'
        if not os.path.exists(fn): subprocess.run(['curl', '-fsS', '-o', fn, u], check=True)
        css = css.replace(u, 'http://localhost:8099/__fonts/' + fn)
    open(k + '.local.css', 'w').write(css)
PY
echo "Listo: $D"
