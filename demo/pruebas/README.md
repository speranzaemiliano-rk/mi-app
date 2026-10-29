# Pruebas de la versión de prueba (demo)

Son scripts de Playwright (no hay CI: se corren a mano). Levantan la app real desde disco (`index.html` + `demo/*.js`) con las librerías de CDN servidas
de `demo/pruebas/cdn/` (se bajan con `bash demo/pruebas/bajar-cdn.sh`) y registran todo pedido de red.

- `node demo/pruebas/aislamiento.mjs` — **el que hay que correr después de tocar `demo/demo-core.js`**: Firebase simulado, red cerrada (backend, ARCA, Firebase real,
  Gmail, EmailJS, Spotify, POST aunque sea a una API pública), almacenamiento real intacto, nada persiste, el service worker no se registra y, sin `?demo`, no se carga nada de la demo.
- `node demo/pruebas/recorrido.mjs [movil]` — recorre las 30 pantallas de las dos empresas buscando `NaN`, `undefined`, `Invalid Date`, `[object Object]` y errores de JS.
- `node demo/pruebas/revision.mjs` — regresión de lo que encontró la revisión independiente (saldo del Inicio, música/Spotify, mails y IA con aviso, ARCA, apóstrofes, panel de detalle…).
- `node demo/pruebas/entrega-doc.mjs` — recibo de entrega de documentación (sin dinero): alta desde «Emitir recibo», numeración que no se reutiliza, edición, copia firmada, borrado, buscador y permisos de lector.
- `node demo/pruebas/efectivo-imprimir.mjs` — 🖨️ Imprimir en Efectivo en pesos / en dólares: el papel tiene que coincidir fila por fila con la tabla (filtros, orden, saldos acumulados, saldo anterior con «Desde»).
- `node demo/pruebas/alquiler-deposito.mjs` — el depósito de garantía en el plan de pagos de un alquiler: fila propia, cobro parcial/completo, depósito en dólares de un contrato en pesos (Caja lo cuenta en la moneda en que entró), sin desglose de IVA, recibo, editar y desaplicar.
- `node demo/pruebas/caja-cambio-divisa.mjs` — Caja diaria (`caja/app.html`, no la demo): el «Cambio de divisa» deja las dos patas (US$ y $) aunque no se toque «＋ Sumar», frena si quedó a medio cargar, y el aviso de la venta de dólares cargada como movimiento común.
- `node demo/pruebas/capturas.mjs [movil]` — saca capturas de las pantallas principales (`shot-*.png` en la carpeta desde donde se corre).

Variables: `PLAYWRIGHT_MODULE` (ruta al módulo de Playwright), `DEMO_CDN` (carpeta con las librerías), `ROOT` (raíz del repo).
