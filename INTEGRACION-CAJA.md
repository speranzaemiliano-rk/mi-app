# 🔗 Integrar Caja Diaria dentro de Mess

Plan para que **Mess · Caja Diaria** deje de ser una app aparte y pase a ser un módulo del
sistema, con **un solo login** y **permisos por usuario**: cada uno entra a lo que se le
asigne (el superusuario a todo, un cliente que sólo contrató la caja únicamente a la caja).

> Estado al escribir esto: la **marca ya está unificada** en las dos apps. Falta lo de abajo.

---

## 1. Lo que se descubrió leyendo el código (y por qué es más fácil de lo que parece)

La primera impresión era que había que reescribir Caja. **No es así.** Su arquitectura
está muy bien separada:

- **`localStorage` es la única fuente de verdad.** Toda la app lee y escribe ahí, a través
  de funciones propias (`loadContexts`, `saveDay`, `saveUserDaysFor`, `loadLoans`, …).
  Son **35 `setItem` y 30 `getItem`** repartidos por toda la app.
- **La nube es una capa fina por encima**, de unas **90 líneas** (`app.html`, ~3078–3170):

  | Función | Qué hace |
  |---|---|
  | `cloudPayload()` | Arma el paquete a subir, reusando el formato de respaldo que ya existía |
  | `applyRemote(d)` | Escribe las 3 claves de `localStorage` y vuelve a dibujar |
  | `schedulePush()` | Sube con un retardo de 900 ms para no spamear |
  | `startSync()` | Autentica y se suscribe a los cambios |

- El disparo es ingenioso: **interceptan `localStorage.setItem`** y, si la clave es una de
  las tres de datos, agendan la subida. Por eso **la app nunca habla con la nube
  directamente**.

**Consecuencia práctica:** para mover Caja al Firebase y al login de Mess **no hay que
tocar ninguno de los 65 accesos a `localStorage`**. Se reemplaza sólo esa capa de 90 líneas.

**Los datos son sólo 3 claves:**

```
caja_contexts_v1              → las "cajas" (empresa / proyecto)
caja_user_days_v2::<id>::<moneda>  → los días con sus movimientos
caja_loans_v1                 → los préstamos entre empresas
```

---

## 2. El problema de seguridad que esto resuelve

Hoy la sincronización de Caja guarda todo en **un documento de Firestore identificado por
un "código de caja"**, con autenticación **anónima**. Es decir: **cualquiera que tenga el
código lee y escribe esa caja**. Y el `README` aclara que trae un código público embebido
para que funcione sin configurar nada.

Para uso personal alcanza. **Para venderle a un cliente, no.** La etapa A de abajo lo
elimina de raíz: el identificador deja de ser un código compartido y pasa a ser el usuario
autenticado.

---

## 3. Etapas

### Etapa A — El login de Mess en Caja
*Es la que habilita todo lo demás: sin usuarios de verdad no hay permisos posibles.*

1. Cargar el SDK de Firebase Auth de Mess en `app.html` (mismo proyecto que el sistema).
2. Reemplazar `signInAnonymously()` por la sesión de Mess (mail/clave y Google).
3. Si no hay sesión, mandar al login en vez de entrar como anónimo.
4. **Eliminar el "código de caja"** y todo su ajuste manual: ya no hace falta.

### Etapa B — De Firestore a Realtime Database
*Mecánico. Son cuatro llamadas.*

| Hoy (Firestore) | Pasa a ser (Realtime Database) |
|---|---|
| `_db.collection('cajas').doc(code).set(payload)` | `db.ref(ruta).set(payload)` |
| `ref.get()` | `ref.once('value')` |
| `ref.onSnapshot(cb)` | `ref.on('value', cb)` |
| `signInAnonymously()` | (ya resuelto en la etapa A) |

`cloudPayload()` y `applyRemote()` **no cambian**.

### Etapa C — Dónde viven los datos (decisión de diseño)

La ruta natural, para que encaje con el resto del sistema:

```
empresas/<empresaId>/proyectos/<proyectoId>/cajaDiaria
```

⚠️ **Acá está la única decisión de fondo.** Caja tiene **sus propios** contextos de
empresa/proyecto (`caja_contexts_v1`), separados de los de Mess. Dos caminos:

- **Unificar** — los contextos de Caja pasan a ser las empresas/proyectos de Mess. Es más
  trabajo y requiere migrar, pero es lo que hace que se sienta **un solo sistema**: se da
  de alta una empresa una sola vez.
- **Convivir** — Caja sigue con su lista propia. Menos trabajo, pero el usuario mantiene
  dos listas de empresas y a la larga se desincronizan.

**Recomendación: unificar.** Si no, no es integración, son dos apps compartiendo login.

### Etapa D — Migrar lo que ya está cargado

Caja **ya tiene exportación e importación en `.json`** (respaldo completo). Eso da el
camino más seguro:

1. Exportar el respaldo desde la Caja actual.
2. Un importador que lea ese `.json` y lo escriba en la ruta nueva.
3. Verificar contra la exportación a Excel **antes** de apagar la sincronización vieja.

*No hace falta escribir un migrador a ciegas: el formato de respaldo ya existe y está probado.*

### Etapa E — Permisos por módulo

Recién acá aparece lo que se buscaba: **cada usuario ve lo que se le asigne**.

El sistema ya tiene con qué: roles (`superadmin`/`admin`/`editor`/`lector`), accesos por
empresa (`usuariosAutorizados`) y visibilidad de menú configurable
(`cargarVisibilidadMenu`). Falta extenderlo a **qué módulos ve cada usuario** y que Caja
sea uno de ellos.

---

## 4. Lo que se superpone y hay que decidir

Mess ya tiene módulos de caja (**Caja General**, **Efectivo Pesos**, **Efectivo USD**).
Caja Diaria es claramente más completa en lo suyo: arqueo por partes, créditos a cobrar,
préstamos entre empresas, cambio de divisa, alarma de descuadre.

**Mantener las dos sería el peor de los mundos** — dos lugares donde cargar lo mismo.
Hay que elegir cuál queda antes de empezar la etapa C.

---

## 5. Orden sugerido

1. **A** (login) — desbloquea todo y **arregla el agujero de seguridad**
2. **B** (base de datos) — mecánico, va pegado a A
3. **C** (dónde viven los datos) — decidir primero unificar o convivir
4. **D** (migración) — con verificación contra Excel antes de apagar lo viejo
5. **E** (permisos) — el objetivo final

Las etapas A y B se pueden hacer juntas y son las de mayor rendimiento: dejan a Caja
adentro del mundo Mess. C, D y E se pueden encarar después, sin apuro.
