# 📦 Migrar los datos de Caja Diaria a otro sistema

Todo lo necesario para leer un respaldo `.json` de **Mess · Caja Diaria** e importarlo
en otro sistema. Pensado para pasárselo tal cual a Claude en el otro proyecto: describe
el formato exacto, qué significa cada campo y dónde están las trampas.

**Cómo se obtiene el archivo:** en la caja → botón **⤓ Respaldo** → tildar las
empresas/proyectos (o dejar "Todas") → **⤓ Exportar**. Baja un
`respaldo_completo_AAAA-MM-DD.json`.

---

## 1. Forma general del archivo

```json
{
  "exportedAt": "2026-07-26",
  "contexts": [ { "id": "default", "empresa": "Mi Empresa", "proyecto": "Principal" } ],
  "data": {
    "default": {
      "ARS": [ /* array de días */ ],
      "USD": [ /* array de días */ ]
    }
  },
  "loans": [ /* array de préstamos entre empresas */ ]
}
```

- **`contexts`** — la lista de empresas/proyectos. En Caja Diaria una "caja" es la
  combinación **contexto × moneda**: `Mi Empresa/Principal` tiene una caja en pesos y
  otra en dólares, independientes.
- **`data`** — los días cargados, indexados por `contexts[].id` y después por moneda
  (`ARS` o `USD`, siempre esas dos claves).
- **`loans`** — préstamos entre empresas. **Ojo:** no son datos aparte, ver sección 4.

---

## 2. El día (cada elemento de `data[ctxId][moneda]`)

```json
{
  "src": "user",
  "iso": "2026-07-22",
  "date": "22/07/2026",
  "wd": "Miércoles",
  "y": 2026, "m": 7, "d": 22,
  "si": 130000,
  "ing": 0,
  "egr": -5000,
  "sf": 130000,
  "nmov": 1,
  "movs": [ { "imp": -5000, "cpt": "Fiado a Franco", "ref": "" } ],
  "fis": 125000,
  "caja": [ 125000 ],
  "chq": "",
  "credSi": 0,
  "credAdj": 5000,
  "cred": 5000,
  "credMovs": [ { "imp": 5000, "note": "Franco" } ],
  "dif": 0,
  "empty": false
}
```

| Campo | Qué es |
|---|---|
| `iso` | **La clave del día.** Formato `AAAA-MM-DD`. Único por caja. |
| `date`, `wd`, `y`/`m`/`d` | Derivados de `iso` (fecha formateada, día de la semana, partes). Redundantes: se pueden recalcular. |
| `si` / `sf` | Saldo inicial / saldo final. **`sf` incluye los créditos a cobrar del día** (`si + ing + egr + credAdj`): al fiar, el efectivo baja pero el crédito lo compensa, así el saldo total no cae. Ver sección 3. |
| `ing` / `egr` | Suma de ingresos y de egresos del día. **`egr` es negativo o cero.** |
| `movs` | Los asientos del día. Ver abajo. |
| `nmov` | `movs.length`. Redundante. |
| `fis` | **Caja real**: lo que se contó físicamente. `null` si no se hizo arqueo ese día. |
| `caja` | Las partes sueltas del conteo, con signo. `fis` es su suma. |
| `chq` | Cheques/valores. Texto libre, **solo informativo**, no entra en ningún cálculo. |
| `cred` | **Créditos a cobrar**: saldo acumulado al cierre de ese día. |
| `credSi` | El `cred` del día anterior (saldo de arranque). |
| `credAdj` | El ajuste de crédito **de ese día** (`cred = credSi + credAdj`). |
| `credMovs` | Los ajustes itemizados que suman `credAdj`. `note` = de quién es el crédito. |
| `dif` | Diferencia de caja. Ver sección 3. |
| `src` | `"user"` = cargado por el usuario. `"base"` = histórico importado, solo lectura. |
| `empty` | `true` = día placeholder sin movimientos. **Filtrar estos** al importar. |
| `mod` | Marca de tiempo (ms) de la última modificación de ese día. **Puede faltar**: los días guardados antes de la v71 no la tienen. Ver sección 3 bis. |

### El movimiento (`movs[]`)

```json
{ "imp": -20000, "cpt": "Pago proveedor", "ref": "FC-A-0001" }
```

- **`imp` negativo = egreso, positivo = ingreso.** No hay campo "tipo": el signo es todo.
- `cpt` — concepto, texto libre. Es lo que la app agrupa en "Principales conceptos" y lo
  que usa el presupuesto por concepto.
- `ref` — referencia, texto libre, **con dos valores especiales**:
  - `"PRESTAMO#<id>"` → movimiento generado por un préstamo (ver sección 4).
  - `"Cambio"` → movimiento generado por una compra/venta de dólares (ver sección 5).

---

## 3. Las tres cifras que no son lo mismo

Un día tiene **tres** nociones de plata:

1. **`sf`** — el saldo final **total** al cierre: `si + ing + egr + credAdj`. Incluye los
   créditos a cobrar del día. `si` arrastra el `sf` del día anterior, así que en los
   hechos `sf` es *efectivo acumulado + créditos acumulados*.
2. **`fis`** — el **efectivo** contado a mano (solo la plata física, sin créditos). `null`
   si no se hizo arqueo.
3. **`cred`** — los créditos a cobrar acumulados al cierre (lo fiado y todavía no cobrado).

Para obtener el **efectivo puro** de un día: `efectivo = sf − cred`.

### La diferencia de caja

Lo que guarda el archivo y lo que muestra la pantalla usan **la misma fórmula** (antes no
era así; se unificó junto con que `sf` pasara a incluir los créditos):

```js
d.dif = d.fis != null ? Math.round((d.sf - (d.fis + d.cred))*100)/100 : null;
```

Como `sf = efectivo + cred` y se compara contra `fis + cred`, el `cred` se cancela de los
dos lados y el `dif` termina siendo **efectivo esperado − efectivo contado**: mide solo el
descuadre de la plata física, sin penalizar por tener créditos pendientes. En pantalla,
"Según sistema" (`sf`), "Caja real" (`fis + cred`) y la "Diferencia" cierran entre sí.

Si `fis` es `null` (no se hizo arqueo), `dif` es `null` — no es cero, es "no se sabe".

> **Al migrar:** `sf` ya viene con los créditos sumados. Si el sistema destino separa
> efectivo de créditos, usá `efectivo = sf − cred`. El `dif` guardado ya es el descuadre
> del efectivo (`sf − (fis + cred)`); podés reusarlo o recalcularlo con esa misma fórmula.

### 3 bis. `mod`: cuál versión de un día gana

Desde la v71 cada día lleva `mod` (milisegundos de la última modificación), que se pone
solo al guardar y sólo si el día realmente cambió. Sirve para resolver el mismo día
cargado desde dos lugares. El criterio que usa la app, tanto al sincronizar con la nube
como al importar un respaldo, es:

1. Si ambas versiones tienen `mod` → gana la más nueva.
2. Si alguna no lo tiene (día anterior a la v71) → gana la que tiene **más movimientos**.
3. Un día presente en un solo lado se conserva siempre.

Nunca se borra un día ni se reemplaza un lado entero por el otro. Un sistema destino que
vaya a recibir varias exportaciones del mismo período conviene que haga lo mismo.

### Los saldos están encadenados

`si` de un día = `sf` del día anterior. Lo mismo con `credSi`/`cred`. La app lo recalcula
en cascada (`cascadeChain`) en cada render, así que los valores del archivo son
consistentes al momento de exportar. **Si el destino va a permitir editar días, tiene que
recalcular la cadena igual**, o los saldos quedan desalineados apenas se toque algo.

---

## 4. Préstamos entre empresas — no los cuentes dos veces

Un préstamo aparece en el archivo **dos veces, a propósito**:

```json
{
  "id": "ln_0_a3f9x2",
  "iso": "2026-07-20",
  "from": { "id": "default", "empresa": "Mi Empresa", "proyecto": "Principal" },
  "to":   { "id": "ctxB", "empresa": "Empresa B", "proyecto": "Sucursal Centro" },
  "cur": "ARS",
  "amount": 50000,
  "note": "adelanto"
}
```

1. En `loans[]`, como el registro del préstamo.
2. Como **dos movimientos ya generados** dentro de `data`: un egreso en la caja de
   `from` y un ingreso en la caja de `to`, ambos con `ref: "PRESTAMO#ln_0_a3f9x2"`.

**Los movimientos ya están en los días.** Si al importar sumás además el `loans[]` como
si fuera plata aparte, contás todo dos veces. `loans[]` sirve para saber *quién le debe a
quién*, no para mover saldo.

Convención de signo, que es contraintuitiva: quien **presta** (`from`) tiene el egreso, y
por eso **le deben**. Quien **recibe** (`to`) tiene el ingreso, y por eso **debe**.

> En un respaldo parcial (tildando solo algunas empresas), un préstamo entra si **al
> menos una punta** está incluida. Por eso `from`/`to` guardan el nombre completo
> embebido: el préstamo sigue siendo legible aunque la contraparte no esté en el archivo.

---

## 5. Cambio de divisa

Misma lógica que el préstamo, pero entre las dos monedas de una misma empresa: genera un
movimiento en la caja `ARS` y otro en la `USD`, con `ref: "Cambio"` y concepto
`"Venta de divisa"` o `"Compra de divisa"`.

**No hay un registro aparte** (no existe un `exchanges[]`): los dos movimientos son todo
lo que queda. La cotización usada tampoco se guarda — se puede deducir dividiendo los dos
importes, si hace falta.

---

## 6. Checklist para importar

1. Filtrar los días con `empty: true`.
2. Decidir qué hacer con `src: "base"` (histórico importado viejo, solo lectura, sin
   `credMovs`) — probablemente traerlo como datos históricos no editables.
3. Importar los días con sus `movs`. **No inventar un campo "tipo"**: el signo de `imp`
   ya lo dice.
4. Importar `loans[]` **solo como relación de deuda**, nunca como movimientos nuevos.
4 bis. Si vas a recibir más de una exportación del mismo período, resolver los días
   repetidos con el criterio de la sección 3 bis (`mod` más nuevo; sin `mod`, el que
   tiene más movimientos). Reemplazar sin más pierde datos en silencio.
5. Recalcular `dif` con la fórmula del sistema destino, en vez de confiar en el `dif` del
   archivo.
6. Si el destino permite editar, implementar el encadenado de saldos (`si`/`sf` y
   `credSi`/`cred`).
7. Ojo con los redondeos: la app redondea a 2 decimales con `Math.round(x*100)/100` en
   cada paso de la cadena.

---

## 7. Lo que el archivo NO trae

- **La configuración**: clave de créditos, PIN de la caja, config de backup por email,
  credenciales de sincronización. Todo eso vive en `localStorage` y es por dispositivo.
- **El histórico embebido**: hay un `BASE_SEED` hardcodeado en `app.html` (días viejos
  importados una vez, solo para `default`+`ARS`). **No entra en el respaldo** porque es
  estático. Si hace falta migrarlo, hay que sacarlo del código.
- **Los presupuestos por concepto** (`caja_budgets_v1::<ctxId>::<CUR>` en `localStorage`)
  — son configuración local, no datos de caja.
