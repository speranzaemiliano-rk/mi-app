# CLAUDE.md — Documentación, escribanía y contable (`documentacion/`)

Contexto técnico de este módulo. Para el resto del sistema ver el `CLAUDE.md` de la raíz.

## Qué es

`documentacion/index.html` es un **repositorio de papeles por obra**: escrituras en PDF, planillas de Excel, boletos, posesiones, movimientos de fondos, documentación contable. Un solo archivo HTML, JavaScript vanilla sin build, español (Argentina), igual que el resto del repo. Se llega desde «¿A dónde entrás?» (`MODULOS.documentacion` en el `index.html` de la raíz).

## El proyecto de Firebase es el MISMO que el del sistema ⚠️

A diferencia de `obra/` y `final-obra/`, que tienen proyecto propio a propósito, éste usa `modo-prueba-bb8c2` (Sistema RK). El razonamiento que separó a `obra/` —no darle cuenta del sistema a un capataz, porque `empresas` se lee con cualquier rol y eso le abriría la contabilidad— **no aplica acá**: el público es el mismo que ya ve la contabilidad. Y compartir el proyecto trae tres cosas gratis:

- **Las mismas cuentas y los mismos roles** (`roles/<uid>`). Nadie necesita una segunda cuenta.
- **La sesión abierta vale.** Mismo proyecto + mismo origen = el `onAuthStateChanged` ya trae al usuario, así que desde el selector de módulos se entra sin volver a loguearse.
- **El árbol de obras ya existe.** Las empresas y proyectos salen de `empresas`, el mismo nodo que usa el sistema; no hay que duplicarlo ni mantenerlo sincronizado.

## Modelo de datos

Raíz `documentacion`, partida en **dos ramas a propósito**:

```
documentacion/<empresaId>/<proyectoId>/carpetas/<id>
    { nombre, padre, creado, por, porMail }
documentacion/<empresaId>/<proyectoId>/docs/<id>
    { nombre, carpeta, etiqueta, nota, mime, ext, tam, partes, ver,
      origen, creado, por, porMail, mod, modPor,
      msItemId, msWebUrl, msSubido, msPor }

documentacion/archivos/<docId>/v/<n>/partes/<k> = "<pedazo de base64>"
documentacion/versiones/<docId>/<n> = { ver, tam, partes, creado, porMail, origen }
```

⚠️ **El contenido del archivo NUNCA cuelga del índice.** Es la lección que ya dejó el nodo `documentos` del sistema (ver «Rendimiento del arranque» en el `CLAUDE.md` de la raíz): si los adjuntos cuelgan de lo que se escucha al abrir la pantalla, entrar baja todos los PDF del proyecto y la app queda inutilizable. Acá el índice pesa unos bytes por documento y se escucha con `on('value')`; el contenido se busca **sólo** cuando alguien abre o descarga uno (`_leerArchivo`), de a un documento por vez. **Si algún día se agrega un campo al índice, que no sea el archivo.**

**Por qué va en pedazos.** Realtime Database tiene un tope por escritura y base64 infla el archivo cerca de un tercio. Partirlo en pedazos de 512 KB (`PEDAZO`) saca ese tope del medio, deja subir una escritura escaneada entera y permite mostrar el avance real de la subida. Al leer se rearman ordenando las claves **por número**, no alfabéticamente: Firebase puede devolver el nodo como objeto o como array según el caso, y `'10' < '2'` en orden alfabético rompería el archivo.

**Orden de escritura al subir:** primero los pedazos, el índice **al final**. Si la subida se corta a la mitad, el documento no aparece listado como si estuviera completo. Al borrar es al revés —primero el índice, después el archivo—: un archivo huérfano ocupando lugar es mucho menos grave que un documento listado cuyo contenido ya no existe.

## Versiones

Un documento **nunca se pisa**: cada guardado escribe la versión n+1 y la anterior queda entera. `docs/<id>.ver` apunta a la vigente, y el historial vive en `documentacion/versiones/<docId>`, que se lee **sólo** cuando alguien abre el historial — no cuelga del índice.

⚠️ El contenido de una versión sale de `_rutaPartes(docId, ver)`. Los documentos subidos **antes** de que esto existiera no tienen `ver` y su contenido está en la ruta vieja (`archivos/<id>/partes`), por eso cada registro de versión guarda su **propio `ver`** (`null` para los viejos): sin eso, restaurar una versión antigua leería de una ruta que no existe. Los documentos nuevos nacen con `ver: 1` y nunca usan la ruta vieja.

`_guardarVersion(id, blob, origen)` es el único camino para cambiar el contenido de un documento, y lo usan tanto el ida y vuelta con Excel como «Restaurar». Restaurar **no borra nada**: copia el contenido de la versión elegida como una versión nueva, así el historial queda lineal y siempre se puede volver.

## Editar en Excel de verdad (Microsoft 365)

El sistema **sigue siendo el dueño del archivo**; OneDrive es un taller prestado. Se sube la planilla, la edita **Excel para la web** —con fórmulas, formato, gráficos y tablas dinámicas intactos, porque la edita Excel y no nosotros— y al volver se trae y se guarda como versión nueva. El botón «Excel» aparece sólo en `xlsx/xlsm/xls/csv` y sólo con permiso de edición.

**El permiso de Graph sale del MISMO login con Microsoft que ya usa el sistema** (`OAuthProvider('microsoft.com')`), pidiendo además el scope `Files.ReadWrite`. Así no hace falta un segundo registro de app ni un segundo login, y el tenant se lee del mismo lugar (`localStorage rk_ms_tenant`, que el sistema cachea de `global/config/msTenant`).

Dos cosas a respetar en `_graphToken()`:

- Si la cuenta **ya** tiene Microsoft vinculado hay que **reautenticar**; vincular de nuevo da `auth/provider-already-linked`. Si no lo tiene, se **vincula** —igual que hace el sistema— para no duplicar el uid y perder el rol. El estado del vínculo puede no ser el que creíamos (se vinculó desde otro dispositivo), así que ante ese error se prueba una vez por el otro camino.
- **Firebase no devuelve refresh token del proveedor.** El token de Graph dura lo que dura: se guarda en memoria con su vencimiento, se vuelve a pedir al vencer, y si Graph igual contesta 401 se descarta y se reintenta **una** vez. No intentar guardarlo en `localStorage`: es un token de acceso a los archivos de la persona.

`_msSubir` manda de una los archivos de menos de 4 MB y por **sesión de carga** los más grandes, que es lo que pide Graph. `msItemId` queda guardado en el documento, así se pueden traer los cambios aunque se haya cerrado la ventana o se siga desde otro equipo.

**Lo que hay que hacer una vez en Entra** (el mismo registro de app que ya usa el botón «Continuar con Microsoft»): Permisos de API → Microsoft Graph → delegados → `Files.ReadWrite` y `offline_access`, y después **conceder consentimiento de administrador**. Y una licencia de Microsoft 365 de **empresa**: con una cuenta personal gratuita, Excel para la web no edita.

## Varias personas a la vez

El índice se escucha con `on('value')`: lo que sube uno aparece solo en la pantalla del otro, sin recargar. Cada documento y cada carpeta es un nodo con su propio id y se escribe **por ruta puntual** (`update()` de los campos editables, nunca `set()` de la colección entera), mismo criterio que `_colPersist` en el sistema: dos personas trabajando al mismo tiempo no se pisan.

## Permisos

Los mismos del sistema. Hace falta tener rol en `roles/<uid>` para entrar —estar autenticado no alcanza— y ser `superadmin`/`admin`/`editor` para subir, renombrar o borrar; un `lector` ve y descarga. Las reglas del servidor exigen lo mismo (rama `documentacion` en `database.rules.json`): esconder los botones solo no sería un control de seguridad.

⚠️ **Esa rama hay que publicarla a mano** en Firebase → Realtime Database → Reglas. El archivo del repo no se aplica solo. Sin ella Firebase niega todo **en silencio** y el módulo abre vacío sin dar ningún error — el mismo problema que ya pasó con `cajaDiaria`.

## Detalles que conviene respetar

- **Los PDF no se recomprimen.** Las imágenes de más de 1 MB sí se achican (`_achicarImagen`, canvas a 2200 px y JPEG 0.84), porque una foto de celular pesa de más para lo que es. Un PDF no se toca: una escritura recomprimida pierde legibilidad y eso en un documento legal no se puede hacer. Si pasa el tope (`maxMB` en `config.js`, hoy 20) se rechaza con el peso y el tope en el mensaje, en vez de subir algo degradado.
- **Buscar sale de la carpeta.** Dentro de una carpeta se ve lo de esa carpeta; apenas se escribe algo en el buscador se busca en **todo el proyecto**. Si no, habría que acordarse en qué carpeta quedó el papel, que es justo lo que uno no recuerda.
- **El contador de cada carpeta suma lo de sus hijas** (`cuentaEn`, recursivo). Sin eso una carpeta madre aparecería vacía cuando todo está adentro de sus subcarpetas.
- **No se borra una carpeta con cosas adentro.** Se avisa cuántos documentos y subcarpetas tiene y se pide vaciarla primero: un borrado en cascada acá se lleva escrituras.
- La última obra elegida se recuerda en `localStorage docu_obra`, por equipo.
- `sw.js` tiene su propia constante `CACHE` (`documentacion-vN`) y su alcance es sólo esta carpeta. Firebase y Google van siempre por red, nunca por caché.
