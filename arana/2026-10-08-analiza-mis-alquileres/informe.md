# La Araña · analiza mis alquileres

2026-10-08 · 3 palabras leídas · 9 enlazadas · 5 preguntas · 0 adivinadas
Puntaje: 35 → 83   (cobertura 10→35 · evidencia 25→25 · precisión 0→13 · control 0→10)

## Cerebro leído

- `CLAUDE.md` (128 líneas) — qué es un alquiler en este sistema, las reglas de la casa y el método de trabajo.
- `AUDITORIA-2026-07.md` (auditoría del 29/07/2026) — el formato que ya tiene un análisis acá, y un pendiente abierto sobre Alquileres.
- `SECURITY.md` — el estado de ese pendiente.
- `README.md` — dónde encaja Alquileres como módulo.
- `DOCS-INDICE.md` — dónde van los documentos del proyecto (raíz del repo).

No existe ningún archivo en el repositorio con los contratos cargados: los datos viven en Firebase
(`empresas/<empresaId>/proyectos/<proyectoId>`, `CLAUDE.md:27`). Eso condiciona dos de las lecturas posibles del pedido.

## Enlaces: lo que tu proyecto ya había decidido

| R | Lo que escribiste | Lo que ya estaba decidido | Fuente |
|---|---|---|---|
| referencias | `mis alquileres` | Un alquiler acá es un contrato con canon, IVA guardado como **proporción** (no como dos importes), cobros que pueden entrar en otra moneda, y plan de pagos por período | `CLAUDE.md:35` |

## Aportes: lo que no escribiste y el proyecto ya define

| R | Qué aporta | Fuente |
|---|---|---|
| rol | El contexto del proyecto está escrito para un asistente de IA; la doc para personas es `README.md` | `CLAUDE.md:3` |
| resultado | Un análisis acá se entrega como informe con alcance, metodología, resumen ejecutivo y hallazgos con **severidad y estado** (✅ / 🔧 / 🔑 / ⚙️ / 📝) | `AUDITORIA-2026-07.md:3` |
| referencias | Alquileres es un módulo dentro de **Ingresos**, junto a Ventas, Servicios e Ingresos generales | `README.md:218` |
| responsables | Lo que toca reglas de Firebase u ops lo decidís y lo aplicás vos; el resto se marca «lo hago yo, con test» | `AUDITORIA-2026-07.md:3` |
| reglas | Español en UI, comentarios y commits | `CLAUDE.md:120` |
| reglas | Nunca commitear secretos: van a variables de entorno | `CLAUDE.md:119` |
| revision | No hay tests automatizados ni linter: la verificación es manual | `CLAUDE.md:121` |
| arranque | Para tocar el frontend: ubicar con grep, no leer `index.html` entero (48.799 líneas) | `CLAUDE.md:116` |
| arranque | **Ya hay un primer paso priorizado sobre Alquileres**: aplicar `escHtml()` a los campos de texto libre, «Alquileres primero», con test — y sigue pendiente | `AUDITORIA-2026-07.md:115` + `SECURITY.md:216` |

## Preguntas (no las adivino)

1. **¿Qué tipo de análisis querés?** (a) auditoría del **código** del módulo — cálculos, IVA, cobros, bugs; (b) revisión de los **contratos cargados** — quién está al día, qué vence, qué falta cobrar; (c) los **números** — cobrado vs. pendiente por unidad y por período.
   — *Bloquea todo: cada opción es un trabajo distinto y no comparten casi nada.*
2. **Si es (b) o (c): ¿de dónde saco los datos?** No hay ningún archivo con contratos en el repo; viven en Firebase y desde acá no los leo. ¿Me exportás un Excel/CSV desde la app, o preferís que te arme una pantalla de análisis adentro del sistema?
   — *Bloquea (b) y (c).*
3. **¿Sobre qué empresa y proyecto?** El sistema es multiempresa y los alquileres cuelgan de `empresas/<id>/proyectos/<id>` (`CLAUDE.md:27`). Un análisis de «todos» y uno de «Fekomp SA · Casa 1» dan resultados distintos.
4. **¿Entra en el alcance el arreglo ya priorizado de `escHtml()` en Alquileres?** Está decidido como «Alquileres primero» (`AUDITORIA-2026-07.md:115`) y según `SECURITY.md:216` sigue sin hacerse. Puede ser parte del análisis o quedar aparte.
5. **¿Cómo lo querés entregado?** ¿Como un `AUDITORIA-AAAA-MM.md` en la raíz, igual que el anterior, o alcanza con la respuesta en el chat?

## Prompt conectado

analiza mis alquileres

---
Contexto enlazado por la araña (no reemplaza al prompt, lo completa):
- [rol] El contexto del proyecto está escrito para un asistente de IA (fuente: `CLAUDE.md:3`)
- [resultado] Formato de un análisis acá: informe con alcance, metodología, resumen ejecutivo y hallazgos con severidad y estado (fuente: `AUDITORIA-2026-07.md:3`)
- [referencias] «Alquileres» = contratos con canon, IVA como proporción, cobros en otra moneda y plan de pagos (fuente: `CLAUDE.md:35`)
- [referencias] Es un módulo de Ingresos (fuente: `README.md:218`)
- [referencias] Los datos viven en `empresas/<empresaId>/proyectos/<proyectoId>`, no en el repo (fuente: `CLAUDE.md:27`)
- [responsables] Reglas de Firebase y ops los aplicás vos; el resto va con test (fuente: `AUDITORIA-2026-07.md:3`)
- [reglas] Español en UI, comentarios y commits (fuente: `CLAUDE.md:120`)
- [reglas] No commitear secretos (fuente: `CLAUDE.md:119`)
- [revision] No hay tests automatizados ni linter: verificación manual (fuente: `CLAUDE.md:121`)
- [arranque] Ubicar con grep, no leer `index.html` entero (fuente: `CLAUDE.md:116`)
- [arranque] Primer paso ya priorizado sobre Alquileres: `escHtml()`, pendiente (fuente: `AUDITORIA-2026-07.md:115`, `SECURITY.md:216`)

Preguntas abiertas: 1 (tipo de análisis) · 2 (de dónde salen los datos) · 3 (empresa/proyecto) · 4 (alcance del fix de escHtml) · 5 (formato de entrega)
