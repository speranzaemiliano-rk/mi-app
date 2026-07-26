# 🎨 Kit de marca — Mess

Todo lo necesario para aplicar la identidad visual de **Mess · Software de Gestión** en
**otra app**. Este archivo está pensado para pasárselo tal cual a Claude en el otro
proyecto: tiene los colores exactos, los archivos y el código listo para copiar.

**El producto es Mess.** Cada empresa que lo usa (RK, y las que se sumen) mantiene su
propia identidad adentro del sistema: Mess es el software, no la empresa cliente.

---

## 1. Archivos

| Archivo | Para qué |
|---|---|
| `assets/mess-logo.svg` | Logo principal. Fondo transparente, escala a cualquier tamaño. Para el splash, el login y encabezados. |
| `assets/mess-icon.svg` | Ícono con fondo (espacio profundo), *maskable*. Para la PWA. |
| `assets/mess-icon-192.png` | Ícono PWA 192×192. |
| `assets/mess-icon-512.png` | Ícono PWA 512×512. |

**Diferencia importante:** el *logo* es transparente y se usa sobre cualquier fondo; el
*ícono* trae fondo propio y sirve para el ícono instalado del teléfono.

---

## 2. Paleta

| Color | Hex | Uso |
|---|---|---|
| Violeta | `#7C5CFF` | Principal. Botones, acentos, enlaces. |
| Cian | `#22D3EE` | Secundario. Detalles, estados activos, nodos. |
| Lila | `#C084FC` | Terciario. Degradados y toques suaves. |
| Violeta claro | `#9E86FF` | Esfera del logo (medio). |
| Violeta profundo | `#6D4BE0` | Esfera del logo (borde). |
| Casi blanco | `#EAE4FF` | Textos sobre fondo oscuro. |

**Fondos oscuros** (el logo está pensado para fondo oscuro):

| Color | Hex |
|---|---|
| Fondo base | `#0A0D14` |
| Panel / tarjeta | `#141926` |
| Borde de panel | `#252D42` |

**Degradado de marca** (el de las órbitas del logo):

```css
background: linear-gradient(90deg, #22D3EE, #7C5CFF 55%, #C084FC);
```

---

## 3. Cómo ponerlo en otra app

### Opción A — copiar el archivo (lo más simple)

1. Copiá `assets/mess-logo.svg` a la carpeta de la otra app.
2. Usalo como cualquier imagen:

```html
<img src="assets/mess-logo.svg" alt="Logo" style="width:180px">
```

### Opción B — pegar el SVG dentro del HTML

Sirve si no querés manejar archivos sueltos, o si querés animar las órbitas.
Abrí `assets/mess-logo.svg`, copiá **todo** el contenido y pegalo directo en el HTML.
Queda como un `<svg>` más y no necesita ningún archivo externo.

> Si pegás el SVG en una página donde ya hay otro SVG, revisá que los `id` de los
> degradados (`messSphere`, `messOrbit`, `messGlow`) no se repitan: si dos SVG usan el
> mismo `id`, el navegador mezcla los degradados y se ve mal.

### El logo ya se mueve solo

**No hace falta agregar nada.** La animación está *dentro* del SVG: las órbitas giran
lento, los nodos giran al revés más lento todavía, y la esfera late suave.

Está hecha con **SMIL** (`<animateTransform>`), no con CSS, y eso es a propósito: cuando
un SVG se usa como `<img src="...">`, el navegador **no ejecuta las animaciones CSS
internas**, pero **sí las SMIL**. Con CSS el logo se movía sólo si se pegaba el SVG
dentro del HTML; con SMIL se mueve en los dos casos, sin JavaScript.

Si en algún lugar lo querés **quieto** (por ejemplo, en un PDF o un mail), usá el PNG del
ícono en vez del SVG.

### Íconos de la PWA

Reemplazá los íconos de la otra app por estos y listo:

```
assets/mess-icon-192.png  →  icons/icon-192.png
assets/mess-icon-512.png  →  icons/icon-512.png
```

En el `manifest.json` conviene que estén como `"purpose": "any maskable"`, porque el
ícono ya trae margen de seguridad para que Android no recorte la galaxia.

---

## 4. Sistema de marca por configuración (opcional)

Si la otra app también va a tener marca configurable, se puede copiar el mismo mecanismo
que usa este sistema: un solo archivo `config.js` con un bloque `brand`, y el resto del
código lee de ahí.

```js
window.APP_CONFIG = {
  brand: {
    nombre: "Mess · Software de Gestión",  // título y presentación
    nombreCorto: "Mess",                   // nombre de la app instalada
    siglas: "Ms",                          // el anillo del login
    tagline: "Software de Gestión",
    razonSocial: "Mess",                   // el PRODUCTO, no la empresa cliente
    asistente: "Asistente Mess",
    logo: "assets/mess-logo.svg"
  }
};
```

Ver `MULTIEMPRESA.md` y `CLONAR.md` para el mecanismo completo.

> ⚠️ **Ojo con `razonSocial`.** Describe al producto, pero se usa como respaldo del nombre
> que sale impreso en los recibos cuando todavía no se eligió una empresa. Con una empresa
> seleccionada se imprime el nombre de ESA empresa, no este campo.

> ⚠️ **La marca guardada pisa a `config.js`.** Si alguien guardó la marca desde la app
> (Config → 🎨 Marca), ese valor queda en Firebase y en `localStorage` y **tiene prioridad
> sobre el archivo**. Si cambiás `config.js` y no ves el cambio, es por esto: se limpia con
> el botón **Restablecer** de esa misma pantalla.
