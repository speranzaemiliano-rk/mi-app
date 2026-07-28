# Mover el backend a Render (plan gratuito)

Guía para levantar `functions/server.js` en [Render](https://render.com) en lugar de Railway.

**Las credenciales las cargás vos en el panel de Render.** No van en el repositorio ni
las maneja nadie más. El archivo `render.yaml` sólo declara *qué* variables hacen falta,
nunca sus valores.

---

## Antes de empezar: qué vas a ganar y qué vas a perder

El plan gratuito de Render **duerme el servicio a los 15 minutos sin uso**. El primer
pedido después de dormir tarda unos 50 segundos en responder (Render tiene que
levantarlo de nuevo).

| Función | En el plan gratuito |
|---|---|
| Asistente Mess (chat) | ✅ Anda. La primera pregunta después de un rato tarda ~50 s |
| Leer facturas PDF con IA | ✅ Igual: la primera vez tarda |
| Emitir facturas ARCA | ✅ Igual |
| Belvo / Prometeo | ✅ Igual |
| **Aviso diario de vencimientos** | ❌ **No corre** mientras el servicio duerme |
| **Bot de mail** (revisa cada 2 min) | ❌ **No corre** mientras el servicio duerme |
| Robot propio de ARCA (Playwright) | ❌ No se despliega: la imagen con Chromium no entra en el plan gratuito |

Si los avisos de vencimientos y el bot de mail te importan, el plan gratuito no alcanza:
hace falta un servicio siempre despierto (el plan pago de Render, o el Hobby de Railway
a USD 5/mes). Ver "Mantenerlo despierto" al final.

---

## Pasos

### 1. Crear el servicio

1. Entrá a [dashboard.render.com](https://dashboard.render.com) y creá la cuenta
   (podés entrar con GitHub).
2. **New → Blueprint**.
3. Elegí el repositorio `mi-app`. Render encuentra solo el `render.yaml` de la raíz.
4. Te va a mostrar el servicio `mess-backend` y una lista de variables para completar.
   Cargá al menos estas:

   | Variable | De dónde sale |
   |---|---|
   | `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
   | `FIREBASE_SERVICE_ACCOUNT` | Firebase → ⚙ Configuración → Cuentas de servicio → Generar clave privada. Pegá el JSON completo |
   | `AFIP_CUIT`, `AFIP_CERT`, `AFIP_KEY`, `AFIP_ENV`, `AFIP_ACCESS_TOKEN` | Los mismos que tenías en Railway |
   | `APP_API_TOKEN` | Una contraseña larga inventada por vos. Después la cargás en la app (paso 3) |
   | `ALLOWED_ORIGINS` | `https://speranzaemiliano-rk.github.io` |

   Las de Belvo, Prometeo y WhatsApp podés dejarlas vacías si no las usás: el backend
   arranca igual y esos endpoints avisan que no están configurados.

5. **Apply**. La primera construcción tarda unos minutos.

### 2. Anotar la URL

Cuando termine, Render te da una dirección con esta forma:

```
https://mess-backend.onrender.com
```

Comprobá que responde abriéndola en el navegador con `/diag` al final. Tiene que
devolver un JSON, no un error. Si es la primera vez, esperá los ~50 segundos del
arranque.

### 3. Apuntar la app a la URL nueva

En la app: **Configuración → 🔗 URL del backend**, pegás la dirección y guardás.
Queda guardada en Firebase (`global/config/backendUrl`), así que **vale para todos
los dispositivos y para todos los usuarios**: no hay que repetirlo en cada teléfono
ni volver a publicar el sitio.

Si además pusiste `APP_API_TOKEN`, cargá el mismo valor en
**Configuración → 🔒 Token del backend**.

Con el botón **Probar conexión** verificás que responde.

---

## Mantenerlo despierto (opcional)

Si querés que los avisos de vencimientos y el bot de mail funcionen igual, se puede
pedirle a un servicio de cron gratuito (por ejemplo [cron-job.org](https://cron-job.org))
que llame a `https://<tu-servicio>.onrender.com/` cada 10 minutos. Eso lo mantiene
levantado.

Dos advertencias honestas:

- El plan gratuito de Render da **750 horas de servicio por mes**, que es justo un mes
  entero de un solo servicio. Mantenerlo despierto las 24 horas consume esa cuota casi
  completa: si tenés otro servicio gratuito en la misma cuenta, te vas a quedar corto.
- Es un rodeo a una limitación puesta a propósito. Funciona, pero Render puede cambiar
  las reglas cuando quiera.

Si el backend te resulta importante para trabajar, un plan pago es más tranquilo que
depender de esto.

---

## Volver atrás

Nada de esto es irreversible. La URL del backend se cambia desde
**Configuración → 🔗 URL del backend** en cualquier momento: si volvés a Railway o
migrás a otro lado, pegás la dirección nueva y listo, sin tocar código ni publicar
nada.
