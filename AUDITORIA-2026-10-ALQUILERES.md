# Auditoría del módulo Alquileres

Fecha: 2026-10-08 · Versión auditada: ≈ v539 · Alcance: `index.html` — el módulo Alquileres y todo lo que lee sus cobros (Caja General, Efectivo $/USD, extracto bancario, Resumen de Ingresos, Caja consolidada). **Sólo se leyó el código**: no se miraron los contratos reales cargados en Firebase.

**Metodología.** Seis ángulos en paralelo — plata e IVA · cobros y plan de pagos · persistencia y multiusuario · fechas · render y escapado · integración con Caja/Bancos. A cada hallazgo lo intentaron refutar tres verificadores independientes, cada uno con una lente distinta (refutar · alcanzable desde la app · consecuencia real); sobrevive si menos de dos lo refutan.

> **Cómo leer esto:** estado = 🔧 arreglable en código (lo hago yo, con test) · 📝 hay una decisión tuya de por medio · 🔑 requiere reglas de Firebase · ⚙️ requiere ops en Railway. Los números de línea son de la versión auditada y **ya se corrieron**; la función es la referencia confiable.

## Lo que no salió bien en la corrida

De 131 agentes, 114 terminaron. **17 cayeron por límite de sesión**: los tres verificadores de 5 hallazgos del ángulo «integración», el crítico de completitud y el redactor del informe. Consecuencias:

- Esos 5 hallazgos **no fueron refutados ni confirmados por agentes**. Los verifiqué yo leyendo el código: 3 se confirman (los marco «verificado por mí») y 2 coinciden con hallazgos que otro ángulo ya había confirmado.
- **El barrido de completitud no se hizo**: nadie revisó qué parte del módulo quedó fuera de los seis ángulos.
- De los 6 hallazgos que figuran como «refutados» en el resultado crudo, **sólo 1 fue realmente refutado** (los KPIs «Cobrado ARS/USD», que miden otra cosa de lo que el auditor creyó). Los otros 5 eran estos sin verificar.

## Resumen ejecutivo

**35 hallazgos confirmados por verificadores (31 distintos, 4 aparecieron en dos ángulos) + 3 verificados por mí = 34 distintos.**

- **El IVA y los redondeos aguantan.** La auditoría no encontró fallas en `_alqCalcIVA` ni descuadres de centavos entre la ficha y el cobro: lo que se arregló esta semana quedó en pie.
- **Lo más serio no es un cálculo, es un campo que no hace lo que dice**: el «Canon actual» que tipeás se ignora en cuanto el contrato tiene un ajuste por IPC. El plan de pagos y el cobro siguen usando el canon viejo y marcan el mes «Pagada» con plata sin cobrar.
- **Los cobros por banco nunca dicen en qué cuenta entraron**, así que el saldo de cada cuenta bancaria queda corto por todo lo que cobrás de alquileres por transferencia.
- **Se puede cobrar dos veces el mismo mes sin ningún aviso** — el mismo tipo de error que viviste con los sueldos.
- **Editar un cobro deja datos incoherentes** (el recibo reimpreso con neto + IVA que no suman, Caja con el importe viejo).
- **Riesgo multiusuario:** un cobro puede caer en el inquilino equivocado o perderse después de haber impreso el recibo. Sólo pasa si otra persona toca contratos mientras vos cobrás.
- **Seguridad:** el escapado de texto libre sigue incompleto (el pendiente M4 de julio, `AUDITORIA-2026-07.md:115`), con un caso explotable por un rol `editor`.

---

## 🔴 ALTO

### A1 · El «Canon actual» tipeado se ignora si el contrato tiene un ajuste IPC · 📝
`_canonVigenteEnPeriodo` — 3/3 verificadores · **verificado además por mí**. La función sólo mira el «Canon actual» cuando `ajustesCanon` está vacío; con un solo ajuste cargado, el canon de cada período sale únicamente del historial de ajustes. Y no hay forma de cargar un ajuste a mano: el único que los escribe es el botón 📊 del IPC.
**Pasa así:** contrato IPC a $1.000.000, aplicás el IPC y queda $1.200.000. En abril renegociás a mano: escribís 1.400.000 en «Canon actual». El listado y el contrato impreso dicen $1.400.000, pero el plan de pagos y el modal de cobro siguen en $1.200.000: el inquilino paga eso, el mes queda «✓ Pagada» y faltan $200.000. El desglose de IVA parte del mismo canon viejo, así que la factura sale por el neto equivocado.
**Arreglo — hay dos y elegís vos:** (a) al guardar, si el «Canon actual» no coincide con el último ajuste, crear solo un ajuste desde el mes en curso; o (b) un botón «Agregar ajuste a mano (monto + desde qué mes)» y dejar «Canon actual» de sólo lectura cuando ya hay historial. **Recomiendo (a)**: es lo que hoy esperás que pase al tipear.

### A2 · Los cobros de alquiler por banco no llegan al saldo de ninguna cuenta · 🔧 + 📝
**Verificado por mí** (los verificadores cayeron). El modal de cobro no pregunta en qué cuenta entró la plata — sólo Ventas lo hace. El saldo por cuenta descarta todo lo que no trae `cuentaId`, y la Caja consolidada exige `c.cuentaId === cid`. El extracto sí los muestra, pero con la cuenta en blanco («—»).
**Efecto:** el saldo de cada cuenta queda corto por todo lo cobrado por transferencia. Es el hueco que esta semana quedó pegado al bloque de «papeles del cobro por banco».
**Arreglo:** agregar «¿En qué cuenta entró?» a ese mismo bloque. 📝 Los cobros **ya cargados** no tienen cuenta: hay que decidir si los asignás a mano o si les ponés una por defecto. *(Severidad puesta por mí, sin verificadores.)*

### A3 · El cobro puede registrarse en el contrato equivocado · 🔧
`_guardarCobroAlquilerInterno` — 3/3. El modal guarda la **posición** del contrato en la lista, no su `id`. El listener de Firebase reconstruye la lista entera en cada cambio (`_colProcesarCarga`, verificado), así que si otra persona borra, mueve o agrega un contrato mientras tenés el modal abierto, la posición apunta a otro inquilino: el recibo, el monto y el período quedan en `cobrosHistorial` ajeno, con su número de comprobante ya consumido.
**Arreglo:** guardar el `id` en el modal y resolver por `id` al guardar, abortando con aviso si no aparece (como ya hace `guardarAlquiler`). Lo mismo vale para el plan de pagos, la edición de cobro y el historial, que también sostienen posiciones crudas.

### A4 · El cobro se pierde en silencio durante la subida · 🔧
`_guardarCobroAlquilerInterno` — 3/3 (aparece también como media en el ángulo de persistencia). Entre el clic y el guardado hay varios `await` (subir la factura, pedir el correlativo). Si en esa ventana llega un cambio de Firebase, el contrato que se tenía en mano queda huérfano: el cobro se agrega a un objeto que ya no está en la lista, **el recibo se imprime igual y el cobro no existe**. El número A-000NN queda quemado.
**Arreglo:** volver a resolver el contrato por `id` después del último `await`; si ya no está, liberar los correlativos y avisar en vez de imprimir.

### A5 · Un nombre de unidad con comillas inyecta código en Caja General · 🔧
`renderCajaGeneral` — 3/3. El nombre de la unidad se mete sin escapar dentro de `title="…"`. Una comilla doble cierra el atributo y lo que sigue se interpreta como HTML: con `Depto 2" onmouseover="…` corre código en tu sesión de Firebase. **Lo carga un rol `editor`**, no hace falta ser superadmin. Con un nombre normal con comillas (`Local "El Roble"`) la fila simplemente se rompe.
Los mismos sumideros están en el **Resumen de Ingresos, el extracto bancario y Efectivo USD**. Es el pendiente M4 de julio, y sigue abierto.
**Arreglo:** `escHtml` en los cuatro sitios — ya convierte `"` en `&quot;`, sirve en atributos.

---

## 🟠 MEDIO

### Cobrar: lo que no avisa
- **Cobrar dos veces el mismo mes** (`_guardarCobroAlquilerInterno`). El 💵 del listado abre el mes en curso con el canon completo aunque ya esté pagado, y el guardado nunca mira si ese período ya tiene cobros. 🔧
- **«Completar» precarga el canon entero**, no el saldo (`_renderPlanAlquiler`). El botón dice «Completar» y propone cobrar todo de nuevo. 🔧
- **El listado dice «✓ Cuota cobrada» con cualquier cobro**, aunque falte casi todo o falte la Parte B del desglose (`_alqEstadoPago`); el plan exige el 98% y marca «Parcial». Las dos pantallas se contradicen. 🔧
- **Bonificar un mes con cobros los esconde**: el plan muestra «—» y saca el ✏️ y el ↩️. 🔧
- **El ✏️ del plan sólo alcanza la Parte A** de un cobro desglosado (2/3 verificadores): cambiarle el período parte el mes en dos. 🔧
- **Cambiar el «Período que cubre» en el modal de cobro no recalcula** el canon ni el desglose de IVA (`abrirModalCobroAlquiler`). 🔧

### Editar un cobro deja datos incoherentes
- **Cobro en otra moneda:** editar el monto no recalcula `montoCobrado`, y todas las pantallas de plata usan ése. Caja queda con el importe viejo, sin aviso. *(Lo encontraron dos ángulos y un tercero sin verificar.)* 🔧
- **Cobro con IVA desglosado:** editar el total deja el neto gravado y el IVA viejos; el recibo reimpreso muestra tres números que no suman. *(Dos ángulos.)* 🔧
- **Cambiar el destino A↔B** de un recibo ya cobrado deja su número en la serie equivocada, y al borrarlo se libera en la serie de la otra letra: se puede reemitir un correlativo ya usado (`_liberarNroComprobante`). 🔧

### Pantallas que no usan los helpers de moneda
Sólo importa cuando un cobro entra en **otra moneda que el contrato**. `CLAUDE.md` lo prohíbe expresamente (`a.moneda` + `c.monto` directo). 🔧
- **Resumen de Ingresos** mezcla la moneda del cobro con el importe del contrato (3/3).
- **Extracto bancario**: muestra `c.monto`, no lo que entró al banco *(verificado por mí)*.
- **Caja General** (`renderCajaGeneral`): arma el movimiento con `a.moneda` + `c.monto`, mientras Efectivo $/USD sí usa los helpers; las dos pantallas pueden discrepar *(verificado por mí)*.

### Fechas
- **Después de las 21:00 el modal de cobro propone la fecha de mañana** y, a fin de mes, el período del mes siguiente (usa UTC; el resto del módulo usa hora local). 🔧
- **El plan de pagos genera un mes de más** en todo contrato que no arranca el día 1 (2/3 verificadores). 🔧
- **Reabrir un contrato cuyo fin cae en mes corto** devuelve la duración con un mes menos y recorta el contrato (`_alqFinManual`). 🔧
- **El IPC acepta una vigencia anterior al período base** y calcula una variación negativa que ofrece aplicar (`calcularIPCAlquiler`). Otro cartel del mismo módulo sí lo valida. 🔧

### Mover alquileres a otra empresa
- **Los adjuntos quedan atrás**: el registro viaja pero el PDF vive en `documentos` del proyecto de origen. 📝 (¿se copian o se avisa?)

### Escapado
- **El período del cobro va sin escapar** en el historial y en el contrato imprimible (`document.write`, mismo origen que la sesión). El campo no es cerrado: se guarda tal cual lo que venga. 🔧

### Persistencia
- **Dos cobros simultáneos pierden uno**: `cobrosHistorial` es un array *dentro* del registro y se escribe el registro completo; el último que guarda gana. 📝 La solución real es sacar el historial a subnodos por id — **cambia el modelo de datos** y necesita migración.

## 🟢 BAJO

| Hallazgo | Dónde | 
|---|---|
| Guardar un contrato después de subir un adjunto revierte los cobros registrados mientras subía (2/3) | `guardarAlquiler` |
| Mover un alquiler con id heredado `leg_<i>` pisa el contrato que tenga ese id en el destino (2/3) | `confirmarMoverAlquileres` |
| Un contrato figura «Vencido» durante todo su último día | `renderAlquileres`, resumen |
| La cuota del primer mes se marca vencida si el contrato arranca después del día de pago | `_alqEstadoPago` |
| «Próxima actualización» se corre de día en contratos que arrancan 29, 30 o 31 | `renderAlquileres` |
| El título del historial pinta la unidad sin escapar | `abrirHistorialCobrosAlquiler` |
| El segundo clic en «Unidad» e «Inquilino» no invierte el orden (faltan las opciones descendentes) | `alqOrdenarPor` |
| El KPI «Próxima actualización» se calcula sólo sobre los contratos filtrados, al revés que los otros tres | `renderAlquileres` |
| El resumen impreso deja vacío el total de la columna Canon | `imprimirResumenAlq` |

---

## Lo que no pude verificar

- **Los datos reales.** No miré tus contratos: no sé cuántos tienen ajustes IPC (A1), cuántos cobros por banco existen sin cuenta (A2) ni si hay meses cobrados dos veces.
- **El barrido de completitud** (ver arriba): puede haber huecos fuera de los seis ángulos.
- **Que la concurrencia (A3, A4) ocurra en la práctica.** El código la permite y lo confirmaron tres verificadores, pero depende de cuántas personas cobren a la vez.

## Plan sugerido, por lo que más cuesta si no se arregla

1. **A1 — Canon actual.** Plata mal cobrada todos los días en cualquier contrato con IPC. Necesita tu elección (a)/(b).
2. **A2 — Cuenta bancaria en el cobro.** Es chico y deja los saldos de las cuentas bien de acá en adelante. Necesita tu decisión sobre los cobros viejos.
3. **Blindar el cobro:** aviso de doble cobro, «Completar» con el saldo, estado «parcial» en el listado.
4. **Editar un cobro sin dejar números incoherentes** (moneda, IVA, serie del recibo).
5. **Resolver por `id` en lugar de por posición** (A3, A4) — cierra el riesgo multiusuario.
6. **Escapado** (A5 y los tres sumideros hermanos) — cierra además el M4 de julio.
7. **Fechas** (UTC, mes de más, duración).
8. **Pantallas con moneda** y validación del IPC.
9. **Mover alquileres** con sus adjuntos.
10. Lo cosmético.

Aparte, **📝 decisión de modelo de datos**: sacar `cobrosHistorial` a subnodos (cierra los dos cobros simultáneos). Es lo más grande y lo único con migración; conviene dejarlo para cuando los puntos 1-6 estén hechos.
