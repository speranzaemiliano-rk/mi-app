# Caja Diaria — apps nativas (Google Play / App Store)

Wrapper nativo con **Capacitor** para poder subir la misma app web a Google Play y al App
Store, sin reescribirla. La web en sí sigue siendo estática, sin build, exactamente en la
raíz de la carpeta `caja/` tal como siempre — Capacitor solo la empaqueta adentro de un proyecto
Android/iOS nativo, a partir de una **copia** aislada.

> **Desde la v128 la Caja vive en `mi-app/caja/`** (antes era el repo `caja-diaria`). Todos los comandos de este documento (`npm run prepare:mobile`, `npx cap sync`, `npx cap open …`) se corren **desde `caja/`**, que es donde están `package.json`, `capacitor.config.json`, `android/` e `ios/`. Cuando abajo dice «la raíz del repo» se refiere a la raíz de `caja/`. Los builds nativos **no se volvieron a compilar** después de la mudanza: la estructura interna de `caja/` es idéntica a la del repo viejo, pero conviene un build de prueba antes de subir una versión a las tiendas.

## ⚠️ Los archivos del sitio NO se mueven de la raíz de `caja/`

Se intentó en un primer momento mover `index.html`/`app.html`/etc. a una carpeta `www/`
para que conviva más prolijo con `android/`/`ios/` — **esto rompió el sitio en vivo** (dos
veces, la segunda por un problema al mergear el revert): GitHub Pages en este repo resultó
estar sirviendo desde "Deploy from a branch" (Jekyll, sirviendo el árbol de `main` tal
cual, con `.nojekyll` en la raíz evitando que Jekyll transforme nada), no desde el
workflow de Actions como se había asumido — al sacar los archivos de la raíz, dejaron de
estar donde ese mecanismo los busca. **Los archivos del sitio tienen que seguir viviendo
en la raíz del repo, siempre.**

Para que Capacitor pueda empaquetar la app igual sin volver a tocar la raíz,
`scripts/prepare-mobile-www.sh` arma una **copia** aislada en `mobile-www/` (carpeta
generada, no se comitea — está en `.gitignore`) con los archivos que hacen falta
(`index.html`, `app.html`, `manifest.json`, `sw.js`, íconos, `biletes.avif`). Capacitor
usa esa copia como `webDir`, nunca la raíz directamente — apuntarlo a la raíz metería
`.git/`, `node_modules/`, `android/`, `ios/` adentro del APK/IPA.

## Qué se armó

- `scripts/prepare-mobile-www.sh` + `mobile-www/` (generada, gitignoreada) — ver arriba.
- `capacitor.config.json` — `appId: com.cajadiaria.app`, `appName: Caja Diaria`,
  `webDir: mobile-www`. **El `appId` no se puede cambiar después de la primera
  publicación en cada tienda** — confirmalo antes de publicar (si preferís otro, como algo
  con tu propio dominio, cambialo en este archivo antes de compilar nada).
- `android/` — proyecto nativo de Android generado con `npx cap add android`. **Se probó
  en este entorno y compila un APK debug real y funcional** (`com.cajadiaria.app`,
  label "Caja Diaria", verificado con `aapt dump badging`).
- `ios/` — proyecto nativo de iOS (Xcode) generado con `npx cap add ios`, usa Swift
  Package Manager (no hace falta CocoaPods). **No se pudo compilar en este entorno**
  (hace falta Xcode, que solo corre en Mac) — se verificó que el `Info.plist` y el
  `.pbxproj` son válidos, pero la primera compilación real va a ser la que hagas vos en
  Xcode.
- Íconos y splash screens para ambas plataformas, generados con `npx capacitor-assets
  generate` a partir de `assets/icon.png` (copia de `icon-512.png`, 512×512).
  **Recomendado**: antes de publicar de verdad, reemplazá `assets/icon.png` por una
  versión de mayor resolución (ideal 1024×1024) y volvé a correr el comando — la fuente
  actual da un resultado aceptable pero no perfecto al verse escalada en los tamaños más
  grandes (ícono de la App Store, por ejemplo). **Ojo**: ese comando también reescribe
  `manifest.json` si lo detecta (le agrega íconos PWA propios apuntando a rutas que no
  existen) — ya pasó una vez y hubo que restaurarlo a mano. Si volvés a correr
  `capacitor-assets generate`, revisá el diff de `manifest.json` antes de commitear.
- `.gitignore` — excluye `node_modules/`, `mobile-www/` (generada), `android/local.properties`
  (específico de cada máquina), y las carpetas de build (`android/build/`,
  `android/.gradle/`, `ios/App/build/`, etc.) — nunca se comitean, se regeneran solas al
  compilar/preparar.

## Cómo mantenerlo sincronizado con la web

Cada vez que cambia algo en `index.html`/`app.html`/`manifest.json`/`sw.js` (los PRs
normales de la app siguen funcionando exactamente igual, en la raíz, como siempre), para
que el cambio llegue a las apps nativas hay que correr:

```
npm run prepare:mobile && npx cap sync
```

El primer comando actualiza `mobile-www/` con la versión más reciente de los archivos de
la raíz; el segundo copia `mobile-www/` adentro de `android/app/src/main/assets/public` y
`ios/App/App/public`. **Esto no pasa solo** — si publicás una versión nueva en las
tiendas, acordate de correr los dos comandos antes de recompilar, si no vas a estar
subiendo una versión vieja de la app.

## Para publicar en Google Play

1. Instalá [Android Studio](https://developer.android.com/studio) (trae el SDK incluido)
   — o usá `sdkmanager` por línea de comandos como se hizo acá.
2. `npm run prepare:mobile && npx cap sync android`
3. Abrí `android/` en Android Studio, o generá el paquete por consola:
   `cd android && ./gradlew bundleRelease` (Google Play pide un `.aab`, no un `.apk`).
4. Generá una clave de firma (una sola vez, **guardala en un lugar seguro** — si la
   perdés no vas a poder subir más actualizaciones de esta app):
   `keytool -genkeypair -v -keystore caja-diaria.keystore -alias caja-diaria -keyalg RSA -keysize 2048 -validity 10000`
5. Configurá la firma en Android Studio (Build → Generate Signed Bundle / APK) o en
   `android/app/build.gradle`.
6. Creá una cuenta en [Google Play Console](https://play.google.com/console) (pago único
   de USD 25), armá la ficha de la app (podés arrancar con `screenshot-1.png` y
   `screenshot-2.png`, y la descripción de `manifest.json`), subí el `.aab` y
   mandala a revisión.

## Para publicar en el App Store

1. Necesitás una **Mac con Xcode** — no hay forma de evitarlo, Apple no permite compilar
   ni firmar apps de iOS desde Linux.
2. `npm run prepare:mobile && npx cap sync ios`
3. `npx cap open ios` (abre el proyecto en Xcode).
4. En Xcode: Signing & Capabilities → elegí tu equipo de Apple Developer (hace falta una
   cuenta paga de [Apple Developer Program](https://developer.apple.com/programs/), USD
   99/año).
5. Product → Archive, y subilo a App Store Connect (desde el Organizer de Xcode, o con
   la app Transporter).
6. Armá la ficha en [App Store Connect](https://appstoreconnect.apple.com), completá
   metadata/capturas, y mandala a revisión.

### ⚠️ Riesgo real de rechazo en Apple

La guideline 4.2 de Apple ("Minimum Functionality") rechaza apps que son básicamente un
sitio web envuelto, sin nada nativo de verdad. Para reducir ese riesgo se sumaron dos
capacidades nativas genuinas con Capacitor (implementadas, ver `app.html`):

- **Notificación diaria de arqueo** (`@capacitor/local-notifications`): recordatorio
  configurable (⋯ → Notificación diaria) que avisa si todavía no se cargó el cierre del
  día en la caja activa. Ver bullet correspondiente en `CLAUDE.md`.
- **Huella digital / Face ID para el detalle de créditos** (`@capgo/capacitor-native-biometric`,
  no `@aparajita/capacitor-biometric-auth` ni `@capacitor/biometric-auth` — se probaron
  esas alternativas primero pero requerían un wrapper JS con import/bundler que no encaja
  con el "sin build" del proyecto; `@capgo/capacitor-native-biometric` registra un plugin
  nativo simple, accesible directo como `Capacitor.Plugins.NativeBiometric` sin import).
  Alternativa a tipear la clave de créditos, no un reemplazo — sigue pidiendo verificación
  cada vez (nunca un desbloqueo persistente, ver `CLAUDE.md`) y si falla/no está disponible
  cae al `prompt()` de la clave de siempre.

Ambas quedan completamente inertes en la versión web/PWA (`window.Capacitor` no existe ahí,
así que el código ni siquiera intenta llamarlas) — mismo `app.html`, sin build, para las dos
plataformas. Verificado en este entorno: `npx cap sync android` + `./gradlew assembleDebug`
compilan OK con los dos plugins nuevos (permisos `POST_NOTIFICATIONS`/`RECEIVE_BOOT_COMPLETED`/
`WAKE_LOCK`/`USE_BIOMETRIC`/`USE_FINGERPRINT` confirmados con `aapt dump badging`); `npx cap
sync ios` genera el `Package.swift` correcto pero, como el resto de iOS, no se pudo compilar
acá (falta Xcode/Mac) — se agregó a mano `NSFaceIDUsageDescription` en `Info.plist` (obligatorio
en iOS para Face ID, Apple rechaza/crashea sin esa clave; no lo genera `cap sync` solo).

Google Play es bastante más permisivo con este tipo de apps (TWA/wrappers), así que ese
lado tiene mucho menos riesgo de rechazo — estas dos funciones ayudan más de cara a Apple.

## Qué NO se hizo (y por qué)

- **No se compiló ni firmó ningún build de release** — necesita las claves/certificados
  del propio desarrollador, que no existen en este entorno.
- **No se creó ninguna cuenta de desarrollador** (Google Play Console, Apple Developer
  Program) — son cuentas pagas, personales, no se pueden crear en tu nombre.
- **No se compiló el proyecto de iOS** — necesita Xcode en una Mac real.
- **No se subió nada a ninguna tienda** — la sumisión final es manual, a través de Play
  Console / App Store Connect, con tus propias credenciales.
