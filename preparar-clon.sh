#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
#  Genera una COPIA LIMPIA del sistema para entregar a otro cliente.
#
#  Uso:   ./preparar-clon.sh /ruta/donde/crear/la/copia
#
#  Qué hace:
#    · Copia el código (sin el historial de git ni los datos de esta instalación).
#    · Reemplaza config.js por la plantilla, así no viaja ninguna credencial
#      ni la base de datos de nadie.
#    · Saca los archivos propios de la instalación actual (logos de la empresa).
#    · Deja los íconos del producto.
#
#  Lo que NO hace (y no puede): crear el Firebase del cliente. Eso es manual,
#  está explicado en CLONAR.md.
#
#  IMPORTANTE: este script NO toca la instalación actual. Solo escribe en la
#  carpeta destino que le pases.
# ════════════════════════════════════════════════════════════════════════
set -euo pipefail

DESTINO="${1:-}"
ORIGEN="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -z "$DESTINO" ]; then
  echo "Falta indicar dónde crear la copia."
  echo "Uso: ./preparar-clon.sh /ruta/de/la/copia"
  exit 1
fi

if [ -e "$DESTINO" ]; then
  echo "❌ '$DESTINO' ya existe. Elegí una carpeta nueva para no pisar nada."
  exit 1
fi

echo "→ Copiando el código a: $DESTINO"
mkdir -p "$DESTINO"
# Se excluye .git (historial de esta instalación) y config.js (credenciales propias).
tar -C "$ORIGEN" --exclude='./.git' --exclude='./config.js' \
                 --exclude='./node_modules' --exclude='./functions/node_modules' \
                 -cf - . | tar -C "$DESTINO" -xf -

echo "→ Poniendo la plantilla de configuración"
cp "$ORIGEN/config.example.js" "$DESTINO/config.js"

echo "→ Sacando los archivos propios de la instalación actual"
# El logo de la empresa: cada cliente pone el suyo. Se detecta desde el config.js
# actual en vez de tener el nombre escrito acá, para que siga sirviendo si cambia.
LOGO_EMP="$(grep -oP 'logoEmpresa:\s*"\K[^"]*' "$ORIGEN/config.js" 2>/dev/null || true)"
if [ -n "$LOGO_EMP" ] && [ -e "$DESTINO/$LOGO_EMP" ]; then
  rm -f "$DESTINO/$LOGO_EMP"
  echo "   quitado: $LOGO_EMP"
fi

# Documentos internos que no le sirven a un cliente nuevo.
rm -f "$DESTINO/PENDIENTES.md" "$DESTINO/CONSOLIDACION.md" "$DESTINO/preparar-clon.sh"

echo
echo "✅ Copia limpia lista en: $DESTINO"
echo
echo "Lo que falta, y es manual (ver CLONAR.md):"
echo "  1. Crear el proyecto de Firebase del cliente y pegar firebaseConfig en config.js"
echo "  2. Poner adminEmail (será Super Administrador la primera vez que entre)"
echo "  3. Si el cliente tiene logo propio: copiarlo y apuntarlo en brand.logoEmpresa"
echo "  4. Publicar las reglas de database.rules.json en ese Firebase"
echo
echo "Verificá antes de entregar: abrí la copia y confirmá que no aparezca"
echo "ninguna marca ajena en la presentación, el ingreso ni el menú."
