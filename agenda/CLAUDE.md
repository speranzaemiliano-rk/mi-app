# CLAUDE.md — Agenda de posesiones (`agenda/`)

Contexto técnico de este módulo. Para el resto del sistema ver el `CLAUDE.md` de la raíz.

## Qué es

Agenda virtual para que los inversores elijan día y horario de la **entrega de posesión** de su unidad. JavaScript vanilla sin build, mismo proyecto de Firebase que el sistema (`modo-prueba-bb8c2`). Dos pantallas:

- **`index.html`** — pública, sin login. Link **por unidad**: `agenda/?e=<edId>&t=<token>`. Muestra sólo los horarios libres; el inversor elige día y hora y carga titular (nombre, DNI, teléfono, mail), si viene con **apoderado** (nombre y DNI), cantidad de personas y nombre/DNI de cada acompañante. Si la unidad ya reservó, el mismo link le muestra su turno (no el de nadie más).
- **`admin.html`** — con login (mail/contraseña o Google) y rol `superadmin`/`admin`/`editor` (escriben) o `lector` (sólo mira). Pestañas: **Reservas** (lista, buscador, detalle, cancelar turno, CSV, imprimir, unidades sin reservar), **Horarios** (habilitar/bloquear por rango de fechas, días de semana y horas, o un día puntual), **Links por unidad** (crear, copiar, WhatsApp, anular) y **Ajustes** (nombre, dirección, contacto, mensaje, abrir/cerrar la agenda).

Turnos de **1 hora, uno a la vez**. Cada unidad reserva **un solo turno**. Cambiar o cancelar lo hace el administrador (cancelar libera el horario y la unidad puede volver a reservar con el mismo link).

## Modelo de datos — `agendaPosesiones/<edId>`

`<edId>` es el mismo id que `global/edificios/<edId>` (el admin elige el edificio de ese listado).

```
config            = { titulo, direccion, contacto, mensaje, abierto }      // lectura pública
disponibilidad/<YYYY-MM-DD>/<HH> = true     // horarios habilitados; lectura pública
ocupados/<YYYY-MM-DD>/<HH>       = true     // sin datos de nadie; lectura pública
tokens/<token>    = { u: '<unidad>' }       // link por unidad
reservas/<token>  = { nombre, dni, tel, mail, personas, apoderado, apoNombre, apoDni,
                      acompanantes:[{nombre,dni}], notas, fecha, hora, unidad, creada }
```

`<HH>` es la hora de inicio con dos dígitos (`'09'`, `'10'`). Fecha y hora son **texto local de Argentina**, sin zona horaria.

## Privacidad: la garantizan las reglas, no la pantalla

El público no tiene sesión, así que todo se resuelve en `database.rules.json` (rama `agendaPosesiones`):

- `reservas` y `tokens` **no se pueden listar** sin rol; sólo se lee el hijo exacto `reservas/<token>` / `tokens/<token>`. El token (12 caracteres al azar) funciona como contraseña del link: **quien lo tiene ve esa reserva y nada más**.
- El público puede **crear** `reservas/<token>` sólo si el token existe, la reserva no existía y el horario está habilitado y libre (validado contra `ocupados`/`disponibilidad`); y puede **crear** `ocupados/<f>/<h>` sólo si no existía. Se escriben juntos con un `update()` multi-path: si dos personas eligen el mismo horario a la vez, la segunda recibe `PERMISSION_DENIED` y la pantalla avisa que se ocupó.
- El público **no puede borrar ni modificar** nada: cancelar/mover es del admin.
- No se puede leer `global/edificios` (teléfonos, mails y claves de puertas de los propietarios) sin rol: por eso la pantalla pública no toca esa rama; el nombre de la unidad viaja en el token.

⚠️ **`database.rules.json` no se aplica solo**: hay que publicarlo a mano en Firebase → Realtime Database → Reglas. Hasta entonces la pantalla pública responde «Link no válido» (la lectura es denegada). Verificar en la consola, no en el repo.

Límite conocido: un tercero que conozca la ruta podría escribir `ocupados` (bloquear un horario libre) sin reserva asociada, porque las reglas no pueden atar las dos escrituras entre sí. No expone datos; el admin lo ve y lo desbloquea desde Horarios.

## Marca

Logo de RK en `logo-rk.svg` (sacado de rkarquitectura.com.ar). El logo del edificio es **opcional**: se muestra si existe `agenda/logo-casa1.png` (nombre en `config.js` → `logoEdificio`). Tipografía Montserrat; paleta neutra (negro/blanco/gris), con modo oscuro automático.

## Al tocar este módulo

- Nodo nuevo con datos personales → regla propia, nunca colgarlo de `global`.
- Todo texto libre que viene del público se pinta con `esc()` (en `admin.html` también los `onclick` usan `jsq()`).
- El CSV del admin antepone `'` a celdas que empiezan con `= + - @` (inyección de fórmulas).
- Pruebas: no hay suite; se probó con Playwright contra una base en memoria (reserva completa, validaciones, cancelar, habilitar por rango, crear links).
