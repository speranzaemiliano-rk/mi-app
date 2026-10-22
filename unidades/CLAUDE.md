# CLAUDE.md — Unidades y valuación (`unidades/`)

Contexto técnico de este módulo. Para el resto del sistema ver el `CLAUDE.md` de la raíz.

## Qué es

`unidades/index.html` es una **tabla de las unidades de cada edificio** (propietario, inquilino, m²) con la valuación por m², siete conceptos prorrateados, fecha de posesión y hora de firma. Un solo archivo HTML, JavaScript vanilla sin build, español (Argentina). Se llega desde «¿A dónde entrás?» (`MODULOS.unidades` en el `index.html` de la raíz, y en la lista `todos` de `_modulosDeUsuario`).

Nació de la planilla `KASA Núñez I` (Congreso 1698 / KASA I): se importa ese Excel y de ahí se sigue editando en pantalla.

## Aspecto: igual que el sistema, pero pantalla aparte

El módulo **no vive dentro del `index.html` del Sistema**, pero se ve como él: menú lateral (`.sidebar`, `.nav-item`, marca «Mess»), mismas variables de color (`--gold`, `--card`, `--sidebar-bg`…) copiadas de la raíz, y **el mismo tema** (claro / medio / oscuro): el módulo lee `localStorage rk_tema` y `rk_tema_css`, que comparten origen con el Sistema, así que si se cambia el tema allá, acá sale igual. Si se cambia la paleta del sistema, hay que copiarla acá a mano (son dos copias).

Tres pantallas en el menú (`VISTAS`/`setVista`, la última queda en `localStorage unid_vista`): **Planilla** (tabla completa), **Valuación y conceptos** (valor por m², TC y los siete conceptos, con resumen del total del edificio) y **Posesión y firma** (fecha y hora de cada unidad). Importar Excel y Eliminar edificio están en el menú, bajo «Datos». En pantallas angostas el menú se esconde y se abre con ☰.

⚠️ La tabla de **Posesión y firma** se ordena **siempre con el orden de la planilla** (`o`), no por fecha: si se ordenara por fecha, la fila saltaría de lugar apenas se carga la fecha y no se podría cargar la hora de esa misma unidad.

## Es una app, no sólo una planilla

Los datos se pueden **cargar y mantener a mano**, sin pasar por el Excel: **＋ Nueva unidad** (formulario), ✏️/🗑 por fila, **Nuevo edificio** en el menú. Al editar una unidad la `<clave>` **no cambia** aunque se cambie el nombre (`n`): sólo una unidad nueva calcula la clave con `claveUnidad(n)`. **⬇ Bajar a Excel** (`bajarExcel`) usa **ExcelJS** (cdnjs) y no SheetJS: la versión gratuita de SheetJS no permite colores, bordes ni anchos con estilo, y SheetJS queda sólo para *leer* el Excel al importar. Genera tres hojas con formato: «Planilla» (título, grupos de columnas con color, filas alternadas, unidades de RK resaltadas, totales con fórmula `SUM`, filtros, encabezado fijo y lista para imprimir en horizontal), «Valuación» y «Posesión y firma». Para no llenar la hoja de datos sueltos: teléfonos y mails salen **sólo si está prendido 👁 Datos personales**, y no se incluyen la columna de TC alternativo (si está en 0) ni los conceptos que valen 0. Lo que se exporta en «Planilla» respeta los filtros y la búsqueda de pantalla.

## Conceptos «por unidad» (p. ej. el fondo de alhajamiento)

Además de `pct` / `monto` / `montousd`, un concepto puede estar en modo **`unidad`** ($) o **`unidadusd`** (USD): el importe **no se reparte por m²**, está cargado unidad por unidad en `unidades/<k>/cv/<concepto>` (`esModoUnidad`, `sumaCV`; el total del edificio es la suma). Se carga con **📥 Cargar datos desde planilla** (menú → Datos) o **soltando el Excel en cualquier parte de la ventana** (`leerPlanilla` → `abrirCargaPlanilla`; sólo `puedeAdmin`). Es una carga **general**: detecta la columna «Unidad» y lista cada columna del archivo con ejemplos y un selector «Cargar en…» (propietario, teléfono, mail, inquilino, m², tipología, sup. cubierta / semicubierta, fecha de posesión, hora de firma, y **importe** y **cobrado** de cada concepto); `sugerirDestino` propone por el título de la columna, pero **los datos de identidad (propietario, teléfono, mail, inquilino, m²) sólo si el título es exacto**: en la planilla del fondo «Inversores» trae «Disponible» en las unidades de RK y pisaría los propietarios. Sólo toca las unidades que figuran en el archivo y los campos elegidos; **una celda vacía no pisa** lo cargado; las unidades que no existen se ignoran o se crean (casilla). Hay vista previa (cuántas unidades, cuántos datos por campo, las no encontradas). Fechas y horas se leen como número de serie de Excel o texto (`fechaDe`/`horaDe`), los importes con `numDe` (acepta «1.234,56»). Al cargar un importe el concepto pasa a modo `unidad`/`unidadusd` según la moneda elegida. El archivo del dueño (`Kasa1_Fondo_alhamiento.xlsx`) calcula el fondo como **USD 50 por m² sobre los m² totales + 5 % de amenities** (PB y cocheras no pagan); la app guarda el **importe ya resultante** (se lee el valor, no la fórmula), total USD 111.189,04. **Seguimiento de cobros** (sólo para conceptos en modo `unidad`/`unidadusd`): por unidad se guarda `cb/<concepto>` = lo **cobrado** (en la moneda del concepto) y `pr/<concepto> = 1` si la unidad es **propia** (del desarrollador, no paga pero cuenta en el faltante). `estadoCobro(k, r)` da **Cobrado / Parcial / Adeuda / Propio**; en la planilla salen las columnas «Estado · / Cobrado · / Saldo · <concepto>» (cobrado y saldo en $ como el resto) y en «Valuación y conceptos» un cuadro por concepto (`renderCobros`) con **Total / Cobrado / Faltante = Propios + Adeudan / Propios / Adeudan**, igual al bloque «Total Fondo» de la planilla del dueño. Se edita unidad por unidad (✏️: importe, cobrado, «unidad propia») y también se **carga desde el Excel**: si junto a la columna de importes hay celdas rotuladas «Cobrado», «Propios» o «Adeudan» con una **fórmula** que suma celdas de esa columna (`=+$I$14+$I$18+…`), `abrirCargaPlanilla` lee la fórmula (`bloquesEstado`, mapea fila → unidad) y ofrece cargar ese estado en el mismo paso; el cobrado queda como el importe completo. Con el archivo real: cobrado USD 28.983,09 (11 unidades), propios USD 32.205,41 (10), adeudan USD 50.000,54 (19), faltante USD 82.205,95. Un cobro **parcial** o posterior se carga a mano en el ✏️. En ese libro también vienen tipología y superficie cubierta / semicubierta, que la app **todavía no usa**.

## Columnas, selección de unidades y USD por m²

La tabla de la Planilla es `table-layout:fixed` con un `<colgroup>`; cada columna se define una sola vez en `defCols()` (título, alineación, quién la muestra) y se pinta con `celdaPlanilla`/`celdaTotal`. **⚙ Columnas** (`abrirColumnas`) tilda/destilda columnas y **se arrastra el borde del título** para el ancho (`.rz`, eventos `pointer*`); ambas cosas se recuerdan **por equipo** en `localStorage unid_cols` (`{oc: ocultas, w: anchos}`). La columna «Valor $ TC alt.» no aparece si no hay TC alternativo. **Todos / Seleccionar**: «Seleccionar» abre una lista con casillas para elegir qué unidades se ven (se recuerda por edificio en `localStorage unid_sel_<edId>`, `S.sel`; `null` = todas) y afecta a la Planilla y a lo que baja el Excel. Se sacaron «Solo RK» y «Terceros». **USD por m²** (`usdm2`) = (valor de la unidad + sus conceptos pasados a dólares al TC base, `calc().tusd`) ÷ m². La columna «Total USD (con conceptos)» se sacó a pedido del dueño: `tusd` sigue existiendo en `calc` porque de él sale `usdm2`, pero no se muestra: con conceptos en 0 da siempre el valor del m² cargado. El Excel baja sólo las columnas visibles.

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
global/edificios/<edId>/unidades/<clave> = { n, o, p, rk, i, t, m:[], im:[], s, fp, hf, cv:{<concepto>:importe} }
```

`n` unidad tal como figura en la planilla · `o` orden de la planilla · `p` propietario (las unidades de RK se normalizan a `'RK'`, `rk:true`) · `i` inquilino (texto crudo, con su teléfono y mail) · `t` teléfono del propietario · `m` mails del propietario (**vacío si es RK**: los de la planilla son los de la administración) · `im` mails del inquilino · `s` m² · `fp` fecha de posesión · `hf` hora de firma · `cv` importe de la unidad en cada concepto cargado «por unidad» (sólo lo usan los conceptos en modo `unidad`/`unidadusd`). La `<clave>` sale de `claveUnidad(n)` (Firebase no admite `. # $ / [ ]` ni espacios: `CC 1` → `CC_1`). `<edId>` = `slug(nombre del edificio)`.

## Cálculo

`calc(r)`: valor USD = m² × `usd`; valor $ = USD × `tc`; «TC alt.» = USD × `tc2` (sólo si `tc2` ≠ 0). **Cada concepto es un total del edificio** (`totConcepto(k)`, siempre devuelve **pesos**: `pct` → % del valor total del edificio; `monto` → importe fijo en $; `montousd` → importe fijo en USD, que se pasa a $ al TC base `tc`) **que se reparte según los m² de cada unidad** (`total × m² / m² totales`). Con modo `pct` el reparto da lo mismo que aplicar el % al valor de cada unidad.

## Trampas

- **Edición de parámetros y `on('value')`.** Cada cambio de un parámetro se guarda con un retardo de 600 ms (`guardarParams`), y la propia escritura vuelve como evento `on('value')`. `cargarEdificio` **no** debe reemplazar la copia de trabajo `P` mientras haya algo sin guardar (`_pend`) o el cursor esté en un parámetro: antes, cambiar una fecha en la tabla pisaba lo recién tipeado con lo guardado y se guardaban los valores viejos.
- **Importar actualiza, no reemplaza.** Si el `slug` del nombre ya existe se actualiza **unidad por unidad con `update()` multi-path**, sin tocar `fp`/`hf` ni los parámetros, y no borra unidades que ya no estén en el archivo. Las listas vacías (`m`, `im`) se escriben como `null`.
- Los m² de la planilla original son fórmulas con vínculo externo; SheetJS lee el **valor guardado**. Si una celda no trae número se importa como 0 y se avisa.
- Todo lo que viene de la planilla o de la base entra a `innerHTML` por `esc()` (incluidos los atributos).
- **Aviso de versión nueva**: `chequearVersion()` compara `UNID_VER` (en `index.html`) con el `CACHE` de `sw.js` y muestra «🔄 Hay una versión nueva» con botón Actualizar. ⚠️ **Al cambiar el módulo hay que subir las dos** (`UNID_VER` y `CACHE`), si no el aviso no salta (o salta de más). Existe porque la ventana instalada quedaba días con una versión vieja y el dueño no veía botones nuevos.
- El módulo tiene su propio `sw.js` (`unidades-vN`, scope `/mi-app/unidades/`), independiente del `rk-vN` del Sistema.

## Probar sin Firebase

Se probó con un Firebase de mentira (objeto en memoria que implementa `ref().on/once/set/update/remove`) cargado en lugar de los scripts de gstatic, y Playwright con el Excel real. No hay tests automatizados en el repo.

## Monedas: cada concepto en la suya

⚠️ **Lo cargado en dólares NO se convierte a pesos** (pedido del dueño). `monedaConc(k)` es `USD` para los modos `montousd` / `unidadusd` y `$` para el resto: el concepto, su cobrado y su saldo se muestran y suman en esa moneda, y «Total conceptos» se divide en **Total conceptos ($)** y **Total conceptos (USD)** (cada una sólo si hay conceptos en esa moneda; `totp` / `totu` en `calc`). Lo mismo en el resumen, la hoja «Valuación» del Excel (dos filas de total) y el formato de celda del Excel. La **única** conversión que queda es la de **USD por m²** (`calc().tot` es el equivalente en pesos de todo, sólo para eso). Los porcentajes (`pct`) y los `$` siguen en pesos. Los datos de unidad **tipología / sup. cubierta / sup. semicubierta** (`tp`, `sc`, `ss`) tienen columna en la planilla sólo si alguna unidad los tiene cargados.

## Ver una columna en dólares o en pesos (clic)

Las columnas de importes (Valor USD, Valor $, USD por m², cada concepto, su cobrado y saldo, y los Total conceptos) se pueden **cambiar de moneda con un clic en el título de la columna, en el ⇄ o en cualquier celda de la columna** (`cambiarMon`). ⚠️ En esas columnas el clic en el título **ya no ordena**: el orden se pide con la flechita **↕** que está al lado (`.sort-sw`). Los dos íconos van **antes** del título a propósito: con la columna angosta el título se corta con «…» y lo que iba al final desaparecía y no se podía tocar. Cada columna tiene una moneda **nativa** (`monNativa`: USD para Valor USD / USD por m² / Total (USD); $ para Valor $ / TC alt. / Total ($); la del concepto para los conceptos) y se muestra en la otra al **TC base** (`convMon`; «Valor $ TC alt.» usa el TC alternativo). Es **sólo visual** (no cambia lo guardado ni los cálculos) y se recuerda por equipo en `localStorage unid_mon` (`{clave_de_columna: 'USD'|'$'}`, sólo las columnas que se cambiaron). El título pasa a «… (en $)» y **el Excel que se baja sigue lo que se ve** (valor, título y formato de celda). Las celdas de importes son `td.mon` con `data-mk`; no cambian si hay texto seleccionado.

## Ver Valuación en USD / $ y traer el dólar por fecha

- **Barra «Ver los importes en:»** (`#vmBar`, arriba de «Valuación y conceptos»): *Como se cargaron* / *Dólares* / *Pesos* (`VMON`, `localStorage unid_vmon`). Convierte sólo lo que se **muestra** en esa pantalla (`Nv(v, nativa)`, al TC base); no toca datos ni el Excel de la hoja «Valuación».
- **Cotización por fecha** (`cotHTML`/`cotTraer`, bajo el TC en los parámetros; sólo `puedeAdmin`): elige fecha y tipo (oficial, blue, MEP, CCL, mayorista) y trae la **venta** de `api.argentinadatos.com/v1/cotizaciones/dolares/<casa>/<yyyy>/<mm>/<dd>` a TC base o TC alternativo. Si ese día no hay dato (fin de semana, feriado) retrocede hasta 5 días y lo avisa. Al guardar `P.tc`/`P.tc2` todo se recalcula solo (valor $, conceptos en %, USD por m²).

## Excel con fórmulas y confirmación del valor del m²

- **El Excel baja formulado.** Los parámetros viven en la hoja «Valuación» (celdas amarillas: valor m² `B4`, TC base `B5`, TC alt. `B6`, y la columna «Valor cargado» de cada concepto); `B7:B9` (m² totales = suma de la hoja «Posesión y firma», valor total USD y $) y «Total del edificio» son fórmulas. En «Planilla» las celdas de valor USD/$/alt., % de la unidad, conceptos por % o monto, totales de conceptos, USD por m² y saldos son fórmulas que apuntan ahí (`formulaCelda` en `bajarExcel`), así que cambiar un % o el TC recalcula todo. Cada celda lleva también el `result` calculado, para que se vea en un visor. Si una columna de la que depende una fórmula no se bajó (oculta) o se ve en la otra moneda, esa celda queda con valor fijo en vez de fórmula. Los importes cargados por unidad (fondo de alhajamiento) son datos, no fórmulas. Verificado recalculando con LibreOffice: 0 diferencias con lo que muestra la app.
- **Valor del m²:** se aplica y guarda en el evento `change` (no mientras se tipea) y pregunta «¿Seguro que querés cambiar…?».
