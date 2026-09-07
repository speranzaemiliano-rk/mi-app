# CLAUDE.md — final-obra/

Contexto para trabajar dentro de `final-obra/`. Se carga solo cuando Claude Code trabaja con archivos de esta carpeta; el contexto general del proyecto está en el `CLAUDE.md` de la raíz.

## Tablero de final de obra (`final-obra/`) — aparte de la app

`final-obra/index.html` es un **tablero independiente** para controlar qué falta en cada departamento antes de entregar: pendientes por unidad, por espacio común y por rubro, para tildarlos desde el celular recorriendo la obra. Nació de una planilla estática donde los datos vivían en el propio HTML y los tildes en `localStorage` con una clave por ítem (`item_<id>`); acá los datos son editables y sincronizables.

**No comparte código con `index.html` ni con `obra/`**: `_colPersist` y demás convenciones de la app grande no aplican. Sigue el estilo de `obra/` (comillas dobles, `var`/`function`, todo dentro de un IIFE, helpers `leer`/`escribir` que prueban `window.storage` antes de `localStorage`) y su misma paleta.

**Modelo de datos — tres colecciones planas indexadas por id**, no árboles anidados:

```
rubros[rid]    = { nombre, color, orden, m }
entidades[eid] = { tipo:'unidad'|'comun', nombre, piso, icono, orden, del, m }
items[iid]     = { ent, rubro, texto, ok, orden, del, m, resp, por, cuando }
personas[pid]  = { nombre, email, del, m }          ← responsables
fotos[fid]     = { item, ent, rubro, nota, mime, por, del, m }   ← sólo la ficha
```

`resp` apunta a `personas`; `por`/`cuando` los graba **el tilde**, no la edición: la pregunta que importa después es «¿quién controló esto?». Al destildar se limpian, para que no quede diciendo que alguien lo controló cuando ya no está hecho. Sin sesión abierta `por` queda vacío y `nombreDe("")` imprime «este equipo», así que igual queda constancia.

⚠️ **Las fotos van partidas en dos.** `fotos/<fid>` es la ficha (liviana, viaja con el resto por `child_added`) y `fotosData/<fid> = { d }` son los bytes en base64, que **no** están en `COLS` y se bajan de a uno con `once()` cuando alguien abre la foto (`traerFoto`). Juntos, abrir el tablero en la obra se bajaría todas las fotos del edificio con datos del celular. Los bytes tampoco entran en `datos` ni en el JSON de `localStorage`: van a su propia clave (`finalObra_v1_foto_<fid>`), así sobreviven sin señal sin reventar la cuota del navegador. `comprimirImagen()` reduce a 1280px de lado y JPEG 0.72 antes de guardar.

Que sean planas **no es cosmético**. En `obra/` la sincronización sube el documento entero con `set()` porque lo carga una sola persona; acá pueden estar dos o tres recorriendo unidades distintas a la vez, y subir todo junto haría que el último en guardar pise lo que el otro acaba de tildar. Cada cambio escribe **sólo su ruta** (`finalObra/<obraId>/items/<iid>`), y la bajada usa `child_added`/`child_changed`/`child_removed` sobre cada colección en vez de un `on('value')` de la raíz. `subirTodo()` (un `set()` de todo) queda sólo para dos casos: nube vacía y «volver a la carga inicial».

⚠️ **Borrar marca `del`, no borra.** Un borrado real haría que un equipo que estuvo sin señal vuelva a subir lo que ya se había sacado en otro (`fusionar()` sube lo que sólo está en el equipo). Además deja «Deshacer» y la papelera de Ajustes. El borrado de verdad existe sólo al vaciar la papelera.

⚠️ **`m` es la marca de modificación**, y la pone `subir()`, no quien llama. Es lo que resuelve la reconexión: en `fusionar()` gana el registro con `m` más alto, no el que llegó último. Si se agrega un campo nuevo, tiene que sobrevivir a `normRubro`/`normEnt`/`normItem` — lo que esas funciones no copian, se pierde al releer del equipo o de la nube.

**Eco de la nube.** `firma()` compara los registros con las claves ordenadas; sin eso, el mismo dato con las claves en otro orden parece un cambio y el tablero se repinta en ciclo. `pedirRender()` agrupa los repintados y, si el usuario está tipeando (`escribiendo()`), **reintenta** en vez de saltear: saltear perdía el cambio hasta el siguiente repintado.

**Configuración.** `final-obra/config.js` apunta a un proyecto de Firebase **propio del tablero**, como cada una de las otras apps (ver el mapa de proyectos del `CLAUDE.md` de la raíz). El motivo es quién entra: al final de obra lo recorren la dirección de obra y los contratistas, mientras que «Control Personal Obra» guarda la nómina con nombre y CUIL. Con base propia, un error de reglas acá no puede llegar a eso.

Los cuatro valores de `firebase` vienen **vacíos**: cada instalación pone el suyo. Sin ellos el tablero funciona igual, guardando por equipo, y el botón ☁ lo dice. Las reglas **hay que publicarlas a mano**; el texto está en los comentarios de `config.js` y, mejor, lo muestra la propia app.

`proyectoPropio` (bool) decide **cómo** se muestran esas reglas cuando falta el permiso: en `true` (el caso normal) manda el archivo **entero**, para reemplazar lo que haya — es lo más difícil de hacer mal. En `false`, si algún día la base se compartiera con otra app, manda **sólo** el nodo `finalObra` con coma al final, para insertar después de `"rules": {` sin llevarse puestas las reglas ajenas. Si se cambia de una base compartida a una propia, hay que tocar los dos: los valores de `firebase` y este flag.

El nombre de la obra se edita desde Ajustes y vive en `finalObra/<obraId>/obra`, así que `config.js` sólo aporta el valor inicial.

**Carga inicial.** `final-obra/datos-iniciales.js` (`window.FINAL_OBRA_SEED`) tiene las 39 unidades, los 13 espacios comunes y los 820 pendientes del relevamiento. Es la carga de arranque, **no la base**: se usa la primera vez en un equipo o con la nube vacía. Editarlo no cambia una obra en uso.

**Semáforo**: por cantidad de pendientes — 0 terminada, 1-4 menores, 5-10 medios, 11+ críticos. Son los cortes del tablero original; si se tocan, hay que tocar `sevDe()` y los textos de `SEV`.

**Permiso denegado con sesión abierta.** No abrir el formulario de ingreso: la cuenta ya entró bien, volver a entrar no cambia nada. `btnNube` tiene una rama propia para `estado === "mal" && nube.usuario` que muestra `bloqueReglas()` —las reglas con el mail de quien entró ya puesto— con botón de copiar y un «reintentar» que hace `soltarDatos()` + `conectarDatos()` sin recargar.

**Asistente.** Habla con Gemini **a través del backend** (`CFG.backendUrl` + `/gemini`), nunca directo: la key vive en el servidor. Manda el idToken de la sesión del tablero, que el backend verifica como se explica en el `CLAUDE.md` de la raíz (sección de endpoints del backend, en `functions/CLAUDE.md`). El contexto que arma `asisContexto()` incluye lugares, rubros, personas y **sólo los pendientes** (tope 600): mandar lo ya hecho es pagar contexto que no se usa.

⚠️ **El asistente NUNCA aplica nada solo.** Devuelve acciones, `asisTraducir()` descarta las que apunten a ids inexistentes, y se muestran con casilleros para confirmar. Dictando en la obra —con ruido y palabras técnicas— la transcripción falla seguido, y dar por hecha una unidad equivocada sería peor que no tener asistente.

**Micrófono — dos caminos, un solo botón.** Con `SpeechRecognition` (es-AR) transcribe en el navegador: instantáneo, gratis y sin gastar datos, y lo transcripto queda en el casillero para corregirlo antes de mandarlo. Donde no existe (Firefox, iOS fuera de Safari, y Brave donde suele fallar) **graba y le manda el audio a Gemini**; también cae ahí solo si el dictado tira error, en vez de dejar al usuario a pie.

⚠️ **Gemini no acepta lo que graba MediaRecorder.** Los formatos documentados son wav, mp3, aiff, aac, ogg y flac — y MediaRecorder entrega **webm** (Chrome/Android) o **mp4** (Safari), ninguno de los dos en esa lista. Por eso `prepararAudio()` reconvierte a **WAV mono de 16 kHz** con `OfflineAudioContext` todo lo que no venga en un formato de `MIMES_OK`. En la práctica convierte casi siempre. Como el WAV no comprime, la grabación tiene tope de 30 s (`MAX_SEG`): más que eso no sube desde la obra.

**Informe**: `@media print` con `body.imprimiendo > *{display:none}` salvo `#reporte`. Se enumeraba qué esconder y cualquier bloque nuevo se colaba en la hoja.
