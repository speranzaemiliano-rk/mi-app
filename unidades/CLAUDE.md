# CLAUDE.md — Unidades y valuación (`unidades/`)

Contexto técnico de este módulo. Para el resto del sistema ver el `CLAUDE.md` de la raíz.

## Qué es

`unidades/index.html` es una **tabla de las unidades de cada edificio** (propietario, inquilino, m²) con la valuación por m², seis conceptos prorrateados, fecha de posesión y hora de firma. Un solo archivo HTML, JavaScript vanilla sin build, español (Argentina). Se llega desde «¿A dónde entrás?» (`MODULOS.unidades` en el `index.html` de la raíz, y en la lista `todos` de `_modulosDeUsuario`).

Nació de la planilla `KASA Núñez I` (Congreso 1698 / KASA I): se importa ese Excel y de ahí se sigue editando en pantalla.

## Aspecto: igual que el sistema, pero pantalla aparte

El módulo **no vive dentro del `index.html` del Sistema**, pero se ve como él: menú lateral (`.sidebar`, `.nav-item`, marca «Mess»), mismas variables de color (`--gold`, `--card`, `--sidebar-bg`…) copiadas de la raíz, y **el mismo tema** (claro / medio / oscuro): el módulo lee `localStorage rk_tema` y `rk_tema_css`, que comparten origen con el Sistema, así que si se cambia el tema allá, acá sale igual. Si se cambia la paleta del sistema, hay que copiarla acá a mano (son dos copias).

Tres pantallas en el menú (`VISTAS`/`setVista`, la última queda en `localStorage unid_vista`): **Planilla** (tabla completa), **Valuación y conceptos** (valor por m², TC y los seis conceptos, con resumen del total del edificio) y **Posesión y firma** (fecha y hora de cada unidad). Importar Excel y Eliminar edificio están en el menú, bajo «Datos». En pantallas angostas el menú se esconde y se abre con ☰.

⚠️ La tabla de **Posesión y firma** se ordena **siempre con el orden de la planilla** (`o`), no por fecha: si se ordenara por fecha, la fila saltaría de lugar apenas se carga la fecha y no se podría cargar la hora de esa misma unidad.

## Es una app, no sólo una planilla

Los datos se pueden **cargar y mantener a mano**, sin pasar por el Excel: **＋ Nueva unidad** (formulario), ✏️/🗑 por fila, **Nuevo edificio** en el menú. Al editar una unidad la `<clave>` **no cambia** aunque se cambie el nombre (`n`): sólo una unidad nueva calcula la clave con `claveUnidad(n)`. **⬇ Bajar a Excel** (`bajarExcel`) usa **ExcelJS** (cdnjs) y no SheetJS: la versión gratuita de SheetJS no permite colores, bordes ni anchos con estilo, y SheetJS queda sólo para *leer* el Excel al importar. Genera tres hojas con formato: «Planilla» (título, grupos de columnas con color, filas alternadas, unidades de RK resaltadas, totales con fórmula `SUM`, filtros, encabezado fijo y lista para imprimir en horizontal), «Valuación» y «Posesión y firma». Para no llenar la hoja de datos sueltos: teléfonos y mails salen **sólo si está prendido 👁 Datos personales**, y no se incluyen la columna de TC alternativo (si está en 0) ni los conceptos que valen 0. Lo que se exporta en «Planilla» respeta los filtros y la búsqueda de pantalla.

## Columnas, selección de unidades y USD por m²

La tabla de la Planilla es `table-layout:fixed` con un `<colgroup>`; cada columna se define una sola vez en `defCols()` (título, alineación, quién la muestra) y se pinta con `celdaPlanilla`/`celdaTotal`. **⚙ Columnas** (`abrirColumnas`) tilda/destilda columnas y **se arrastra el borde del título** para el ancho (`.rz`, eventos `pointer*`); ambas cosas se recuerdan **por equipo** en `localStorage unid_cols` (`{oc: ocultas, w: anchos}`). La columna «Valor $ TC alt.» no aparece si no hay TC alternativo. **Todos / Seleccionar**: «Seleccionar» abre una lista con casillas para elegir qué unidades se ven (se recuerda por edificio en `localStorage unid_sel_<edId>`, `S.sel`; `null` = todas) y afecta a la Planilla y a lo que baja el Excel. Se sacaron «Solo RK» y «Terceros». **Total USD** = valor de la unidad + sus conceptos pasados a dólares al TC base (`calc().tusd`); **USD por m²** = ese total ÷ m² (`usdm2`): con conceptos en 0 da siempre el valor del m² cargado. El Excel baja sólo las columnas visibles.

## Proyecto de Firebase y permisos

Mismo proyecto que el sistema (`modo-prueba-bb8c2`), igual que `documentacion/`: mismas cuentas y roles, la sesión abierta vale. Hace falta rol en `roles/<uid>` para entrar; `superadmin`/`admin`/`editor` editan, `lector` sólo mira (los campos quedan `disabled`).

## Rol `posesiones`: cuentas que sólo entran a este módulo

`roles/<uid> = 'posesiones'` (en Config → Usuarios: «🏢 Solo Planilla posesiones»). Qué hace cada capa:

- **Reglas (`database.rules.json`) — el límite de verdad.** Todo nodo que se leía con «tiene rol» (`empresas`, `global`, `documentacion`, `solicitudesBorrado`, `dashboardPagos`, `cajaDiaria/<uid>`, `temp-pdf`) ahora exige «tiene rol **y no es `posesiones`**». Como en Firebase un permiso del padre no se puede quitar en el hijo pero un hijo sí puede **sumar**, `global/edificios` vuelve a abrirse con «tiene rol» (lectura) y `global/edificios/<edId>/unidades` permite escribir a `posesiones`. Resultado: una cuenta `posesiones` lee y edita las unidades y nada más (no ve empresas, proveedores, facturas ni config). ⚠️ **Las reglas no se aplican solas**: hay que publicarlas a mano en Firebase → Realtime Database → Reglas; hasta entonces esa cuenta, desde la consola del navegador, puede leer lo mismo que un lector.
- **Sistema (`index.html`)**: en el ingreso, si el rol es `posesiones` se hace `location.replace('unidades/')` antes de mostrar el selector. `documentacion/` la bloquea con un cartel. (La Caja no mira roles; con las reglas nuevas esa cuenta no puede leer ni escribir su `cajaDiaria`.)
- **Este módulo**: `puedeEditar` (cargar/editar unidades, fechas, horas) vale para `superadmin`/`admin`/`editor`/`posesiones`; `puedeAdmin` (importar, nuevo/eliminar edificio, parámetros de valuación, borrar unidades) sólo para `superadmin`/`admin`/`editor`. El botón de abajo del menú pasa a «Cerrar sesión» (no hay otro módulo adónde volver). Las reglas sólo distinguen a `posesiones` por la rama `unidades`: parámetros y nombre del edificio no los puede escribir.
- **Backend (`functions/server.js`)**: `/usuarios/rol` acepta `posesiones` (`/usuarios/crear` ya aceptaba cualquier rol). No se tocaron los endpoints del asistente (`/gemini`): los usa cualquier sesión válida, `posesiones` incluida.

## ⚠️ Los datos personales NO viven en el repo

El repo se publica en GitHub Pages (público). Los teléfonos y mails de los propietarios **no se pueden commitear**: el repo lleva sólo código y los datos entran por **📥 Importar Excel** a la base. Si se agrega un archivo de datos de ejemplo, que sea inventado.

## Modelo de datos

Raíz **`global/edificios/<edId>`** (se eligió `global` y no una raíz nueva a propósito: `database.rules.json` no se aplica solo y ya cubre `global` —lectura con rol, escritura `superadmin`/`admin`/`editor`—, así que el módulo anda sin publicar reglas nuevas).

```
global/edificios/<edId>/nombre
global/edificios/<edId>/params = { usd, tc, tc2, pct:{gan,iibb,adm,res,alh,rec}, modo:{…:'pct'|'monto'} }
global/edificios/<edId>/unidades/<clave> = { n, o, p, rk, i, t, m:[], im:[], s, fp, hf }
```

`n` unidad tal como figura en la planilla · `o` orden de la planilla · `p` propietario (las unidades de RK se normalizan a `'RK'`, `rk:true`) · `i` inquilino (texto crudo, con su teléfono y mail) · `t` teléfono del propietario · `m` mails del propietario (**vacío si es RK**: los de la planilla son los de la administración) · `im` mails del inquilino · `s` m² · `fp` fecha de posesión · `hf` hora de firma. La `<clave>` sale de `claveUnidad(n)` (Firebase no admite `. # $ / [ ]` ni espacios: `CC 1` → `CC_1`). `<edId>` = `slug(nombre del edificio)`.

## Cálculo

`calc(r)`: valor USD = m² × `usd`; valor $ = USD × `tc`; «TC alt.» = USD × `tc2` (sólo si `tc2` ≠ 0). **Cada concepto es un total del edificio** (`totConcepto(k)`: `pct` → % del valor total del edificio; `monto` → importe en $) **que se reparte según los m² de cada unidad** (`total × m² / m² totales`). Con modo `pct` el reparto da lo mismo que aplicar el % al valor de cada unidad.

## Trampas

- **Edición de parámetros y `on('value')`.** Cada cambio de un parámetro se guarda con un retardo de 600 ms (`guardarParams`), y la propia escritura vuelve como evento `on('value')`. `cargarEdificio` **no** debe reemplazar la copia de trabajo `P` mientras haya algo sin guardar (`_pend`) o el cursor esté en un parámetro: antes, cambiar una fecha en la tabla pisaba lo recién tipeado con lo guardado y se guardaban los valores viejos.
- **Importar actualiza, no reemplaza.** Si el `slug` del nombre ya existe se actualiza **unidad por unidad con `update()` multi-path**, sin tocar `fp`/`hf` ni los parámetros, y no borra unidades que ya no estén en el archivo. Las listas vacías (`m`, `im`) se escriben como `null`.
- Los m² de la planilla original son fórmulas con vínculo externo; SheetJS lee el **valor guardado**. Si una celda no trae número se importa como 0 y se avisa.
- Todo lo que viene de la planilla o de la base entra a `innerHTML` por `esc()` (incluidos los atributos).
- El módulo tiene su propio `sw.js` (`unidades-vN`, scope `/mi-app/unidades/`), independiente del `rk-vN` del Sistema.

## Probar sin Firebase

Se probó con un Firebase de mentira (objeto en memoria que implementa `ref().on/once/set/update/remove`) cargado en lugar de los scripts de gstatic, y Playwright con el Excel real. No hay tests automatizados en el repo.
