# La Araña · reporte de seguridad del sistema

2026-10-08 · 9 palabras leídas · 9 enlazadas · 5 preguntas · 0 adivinadas
Puntaje: 35 → 100   (cobertura 10→35 · evidencia 25→25 · precisión 0→25 · control 0→15)

> El puntaje mide cuánto del pedido se apoya en algo escrito, no si está listo para ejecutar.
> Llegó a 100 porque el proyecto ya tenía definido qué es «el Sistema», qué forma tiene un informe
> de seguridad, quién aplica qué y por dónde se empieza. Igual quedan 5 preguntas abiertas.

## Cerebro leído

- `SECURITY.md` (310 líneas) — el informe de seguridad que ya existe: alcance, formato, 8 riesgos con estado. Última entrada fechada: **2026-07-24**.
- `AUDITORIA-2026-07.md` — auditoría del **2026-07-29**, la más reciente: define el alcance de «Sistema» y la metodología.
- `CLAUDE.md` — la regla de leer `SECURITY.md` antes de tocar auth, y la advertencia sobre las reglas de Firebase.
- `DOCS-INDICE.md` — qué documento se lee según el rol.
- `.claude/scan-secrets.sh` — el hook que escanea secretos al cerrar cada sesión.

## Enlaces: lo que tu proyecto ya había decidido

| R | Lo que escribiste | Lo que ya estaba decidido | Fuente |
|---|---|---|---|
| referencias | `mi ssitema` | «Sistema» tiene un alcance definido: `index.html` + `functions/server.js` + `database.rules.json`. La Caja es **otro repo** y se audita aparte | `AUDITORIA-2026-07.md:3` |
| resultado | `un reporte de seguridad` | Un informe de seguridad acá lleva alcance, riesgos y **cómo blindarlos**, ordenado CRÍTICO → ALTO → MEDIO → BAJO, y **sin valores de credenciales en vivo** | `SECURITY.md:3` |

## Aportes: lo que no escribiste y el proyecto ya define

| R | Qué aporta | Fuente |
|---|---|---|
| rol | El contexto está escrito para un asistente de IA; la doc para personas es `README.md` | `CLAUDE.md:3` |
| referencias | El documento de referencia para seguridad es `SECURITY.md` | `DOCS-INDICE.md:29` |
| responsables | Lo que toca reglas de Firebase (🔑) o config de Railway (⚙️) lo aplicás **vos**; el resto se marca «lo hago yo, con test» | `AUDITORIA-2026-07.md:3` |
| reglas | El informe **no incluye valores de credenciales en vivo** | `SECURITY.md:3` |
| reglas | Antes de tocar permisos, reglas o el middleware de auth, se lee `SECURITY.md` | `CLAUDE.md:59` |
| revision | Hay un chequeo automático: un hook escanea secretos en los archivos versionados al cerrar cada sesión, sin bloquear | `.claude/scan-secrets.sh:2` |
| arranque | ⚠️ `database.rules.json` **no se aplica solo**: que esté en el repo no significa que esté vigente. Hay que verificar contra la consola de Firebase | `CLAUDE.md:55` |

## Preguntas (no las adivino)

1. **¿Qué entra en «mi sistema»?** El cerebro define Sistema = `index.html` + `functions/server.js` + `database.rules.json` (`AUDITORIA-2026-07.md:3`). Pero el repo tiene además **cuatro módulos con su propio Firebase** — `obra/`, `final-obra/`, `documentacion/` — y la Caja, que es otro repo. ¿Entran o es sólo el Sistema?
   — *Bloquea: cambia el alcance y el tamaño del trabajo.*
2. **Los dos informes que ya existen tienen más de dos meses** (`SECURITY.md` cierra el 2026-07-24, `AUDITORIA-2026-07.md` es del 2026-07-29) y desde entonces entraron features nuevas: Documentación, Compra/venta de dólares, Remuneraciones reestructurado, importación de Gmail en tanda. ¿Querés **actualizar** esos documentos o un informe nuevo aparte?
   — *Bloquea el entregable: no es lo mismo revisar lo viejo que escribir de cero.*
3. **¿Puedo dar por cierto el estado de las reglas de Firebase?** `CLAUDE.md:55` avisa que el archivo del repo no es lo vigente y que hay que mirar la consola. Desde acá no la veo. ¿Me confirmás qué está publicado, o marco todo lo que dependa de reglas como «no verificable desde el repo»?
4. **¿Qué hago con los pendientes ya documentados** (backend fail-closed, `escHtml()` en Alquileres, `solicitudesBorrado`, enumeración de roles)? ¿Los reviso de nuevo para ver si siguen abiertos, o los doy por abiertos y me concentro en lo que entró después de julio?
5. **¿Incluyo lo que depende de Railway** (`APP_API_TOKEN`, `FIREBASE_SERVICE_ACCOUNT`, `ALLOWED_ORIGINS`)? Desde acá no puedo ver si están seteadas: iría como checklist para que confirmes vos, igual que en la auditoría anterior.

## Prompt conectado

analiza mi ssitema y tirame un reporte de seguridad

---
Contexto enlazado por la araña (no reemplaza al prompt, lo completa):
- [rol] El contexto del proyecto está escrito para un asistente de IA (fuente: `CLAUDE.md:3`)
- [resultado] Formato del informe: alcance, riesgos y cómo blindarlos, de CRÍTICO a BAJO, sin credenciales en vivo (fuente: `SECURITY.md:3`)
- [referencias] «Sistema» = `index.html` + `functions/server.js` + `database.rules.json`; la Caja es otro repo (fuente: `AUDITORIA-2026-07.md:3`)
- [referencias] El documento de seguridad del proyecto es `SECURITY.md` (fuente: `DOCS-INDICE.md:29`)
- [responsables] Reglas de Firebase y config de Railway las aplicás vos (fuente: `AUDITORIA-2026-07.md:3`)
- [reglas] Sin valores de credenciales en vivo en el informe (fuente: `SECURITY.md:3`)
- [reglas] Leer `SECURITY.md` antes de tocar permisos o auth (fuente: `CLAUDE.md:59`)
- [revision] Hook que escanea secretos al cerrar sesión, sin bloquear (fuente: `.claude/scan-secrets.sh:2`)
- [arranque] Las reglas del repo no son necesariamente las vigentes: verificar contra la consola (fuente: `CLAUDE.md:55`)

Preguntas abiertas: 1 (alcance: ¿sólo el Sistema o también los módulos y la Caja?) · 2 (actualizar los informes de julio o uno nuevo) · 3 (estado real de las reglas de Firebase) · 4 (qué hacer con los pendientes ya documentados) · 5 (si entra el checklist de Railway)
