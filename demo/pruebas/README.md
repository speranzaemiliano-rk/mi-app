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
- `node demo/pruebas/alquiler-iva-incluido.mjs` — IVA del canon de un alquiler con la «parte con IVA» **incluida** (se desagrega dividiendo por 1,21; el total a facturar es el canon): cálculo con los números del dueño, formulario del contrato, cobro con desglose, plan de pagos, recibos anteriores (IVA aparte) que se siguen leyendo igual, pago parcial, IVA a mano, edición del recibo, contrato impreso, «el resto es la parte sin IVA», período con el desglose prendido, cuadro de conversión y los datos de ejemplo de la demo.
- `node demo/pruebas/remun-papeles.mjs` — Remuneraciones → «Liquidar y pagar»: facturas y comprobantes de la Parte A y de la Parte B (borrador si el recibo no existe, guardado en el acto si ya existe, se ven en las listas de recibos, se quitan, se borran con el recibo, aviso antes de descartar lo no guardado, tope de peso, se puede adjuntar cualquier tipo de archivo pero un SVG/HTML nunca se abre en línea, escritura rechazada por la base, N° de factura que no se pierde al repintar, subidas simultáneas).
- `node demo/pruebas/editar-proyecto.mjs` — «Editar proyecto»/«Editar empresa»: la ficha vive en `proyectos/<id>/ficha` y editar nunca toca los presupuestos (`datos`); compatibilidad con proyectos del formato anterior.
- `node demo/pruebas/liquidar-pago-consolidado.mjs` — «Liquidar y pagar» deja el pago marcado como consolidado (aunque el listener reemplace los objetos), no duplica el egreso y reconoce los pagos que el error ya dejó sin marca.
- `node demo/pruebas/usuarios-no-pisar.mjs` — el ingreso anota `ultimoAcceso` sin borrar `modulos`, `nombre` ni otros campos de `usuarios/<uid>`.
- `node demo/pruebas/presupuesto-reindexar.mjs` — borrar un presupuesto reacomoda `presupuestoIdx` de facturas, comprobantes X, emitidos y el Plan de Trabajo.
- `node demo/pruebas/totales-moneda-compras.mjs` — Libro de Compras (las notas de crédito restan, los USD se listan sin sumarse) y totales por moneda de Facturas, Pagos, Documentos, Egresos y cuenta corriente.
- `node demo/pruebas/totales-moneda-bancos.mjs` — Cuentas Bancarias y extracto por moneda (la moneda es la de la cuenta), saldo corrido por moneda y `_hKPIs`.
- `node demo/pruebas/tesoreria-saldos.mjs` — la Tesorería interempresa coincide con la Caja General y Cuentas Bancarias de cada proyecto (contrato en USD cobrado en pesos, confidenciales, lectura fallida, 🔄 doble).
- `node demo/pruebas/escapar-movimientos.mjs` — texto libre de movimientos, presupuestos, facturas, documentos y cuentas con HTML/comillas: se ve literal, no ejecuta script y los ids llegan enteros a cada `onclick`.
- `node demo/pruebas/pago-borra-archivos.mjs` — desaplicar/eliminar un pago (o su factura/presupuesto) borra el comprobante, la DDJJ y el acuse de `REF_DOCS`, salvo los que otro pago sigue usando.
- `node demo/pruebas/inicio-ventas-kpis.mjs` — «Disponibles» de Ventas (sólo UF libres) y «Cobrado este mes» del Inicio (sale de la Caja General, por moneda y por fuente).
- `node demo/pruebas/retoques-v573.mjs` — retoques de la revisión de la v573: moneda de los cobros de ventas (cuota y cochera en dólares), la NC hereda el IVA de su factura, «Pagar varias facturas» frena pesos+dólares, escapado de la ficha del proveedor y de las Solicitudes de borrado, Caja consolidada con alquileres cobrados en otra moneda y nota de la Tesorería.
- `node demo/pruebas/pago-conceptos.mjs` — Registrar pago repartido por conceptos, cada uno con su régimen de retención: bases por régimen (Reg.78 sobre los bienes y Reg.94 sobre la colocación), el resto automático, concepto sin retención, guardado (`conceptosRet`/`basesReg`/`sobre`), acumulado mensual por régimen, cuándo no se ofrece, ítems del comprobante, certificado, Orden de Pago y panel de Pagos.
- `node demo/pruebas/caja-cambio-divisa.mjs` — Caja diaria (`caja/app.html`, no la demo): el «Cambio de divisa» deja las dos patas (US$ y $) aunque no se toque «＋ Sumar», frena si quedó a medio cargar, y el aviso de la venta de dólares cargada como movimiento común.
- `node demo/pruebas/capturas.mjs [movil]` — saca capturas de las pantallas principales (`shot-*.png` en la carpeta desde donde se corre).

Variables: `PLAYWRIGHT_MODULE` (ruta al módulo de Playwright), `DEMO_CDN` (carpeta con las librerías), `ROOT` (raíz del repo).
