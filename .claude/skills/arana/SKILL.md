---
name: arana
description: Lee un prompt como un extraño, enlaza lo vago con el contexto del proyecto (archivo:línea) y pregunta lo que falta, sin adivinar. Usar con /arana <prompt> o "pasale la araña".
---

<!-- Disparadores: "/arana <prompt>", "pasale la araña a este prompt", "conectá este pedido con el proyecto",
     o antes de una tarea larga con un pedido ambiguo. La descripción queda en menos de 200 caracteres para que
     la skill se pueda subir también a la app de Claude. -->


# La Araña

Lee un prompt como lo leería alguien que no te conoce, encuentra cada parte que depende de algo que no está escrito
en el prompt, y la conecta con lo que tu proyecto ya decidió. **No reescribe tu prompt:** le cuelga el contexto que le
faltaba, con la fuente de cada dato. Lo que no está en ningún archivo se convierte en una pregunta.

**Regla de oro: 0 adivinadas.** Cada enlace lleva `archivo:línea` y esa línea se leyó. Si no hay fuente, es una
pregunta. Nunca completes un hueco con conocimiento general, con lo "más probable" o con lo que suele hacer la gente.

## Modos

| Comando | Qué hace |
|---|---|
| `/arana <prompt>` | Analiza, entrega el informe y el prompt conectado, hace las preguntas. **No ejecuta el prompt.** |
| `/arana ejecutar <prompt>` | Lo mismo y, cuando el usuario responde las preguntas, ejecuta el prompt conectado. |
| `/arana aprender` | Guarda las respuestas de la última corrida en el archivo de contexto, para que la próxima vez se enlacen solas. |
| `/arana` sin texto | Pedí el prompt. Si el usuario dice "el último", usá su mensaje anterior. |

Si el prompt viene en un archivo (`/arana prompts/brief.md`), leelo entero: ese es el prompt.

---

## Paso 1 — Leé como un extraño (todavía sin abrir ningún archivo)

1. Partí el prompt en **fragmentos**: la unidad mínima con sentido, de 1 a 8 palabras ("armame", "las historias de
   mañana", "que suene como yo"). Todo el texto queda cubierto; los fragmentos se concatenan y dan el prompt original.
2. Asigná cada fragmento a **una** de las 7 R y a **un** tipo (tablas abajo).
3. Calculá el **puntaje inicial** con la rúbrica, usando solo el texto del prompt.

### Las 7 R (las secciones que la araña recorre, siempre en este orden)

| R | Pregunta que responde | Ejemplo de fragmento |
|---|---|---|
| **rol** | ¿Quién responde y para quién trabaja? | "sos mi estratega de contenido" |
| **resultado** | ¿Qué tiene que existir al final? | "la secuencia de historias de mañana" |
| **referencias** | ¿Sobre qué material se apoya? | "el caso de siempre", "el doc de la oferta" |
| **responsables** | ¿Quién hace, quién decide, para quién es? | "mi setter", "para el cliente" |
| **reglas** | ¿Qué no se puede hacer o qué tono va? | "nada de gurú", "sin precios" |
| **revision** | ¿Cómo se sabe que está bien? ¿Quién aprueba? | "pasámelo antes de subir" |
| **arranque** | ¿Cuál es el primer paso o la entrega mínima? | "empezá por el primer frame" |

### Los 7 tipos

| Tipo | Qué es | Qué hace la araña |
|---|---|---|
| `neutro` | Conectores y verbos sin carga ("armame", "y", "para") | Lo lee y sigue |
| `afirmacion` | Algo que el prompt da por cierto ("el caso que funciona", "el precio nuevo") | Busca la fuente |
| `responsable` | Una persona o rol ("mi setter", "yo") | Busca quién es y qué hace |
| `archivo` | Un archivo, doc, carpeta o link que nombra | Verifica que exista y dónde está |
| `aprobacion` | Un punto de control ("antes de subir, pasámelo") | Lo registra como compuerta |
| `spec` | Algo medible (cantidad, formato, fecha, largo) | Lo registra; si choca con el contexto, pregunta |
| `vago` | Depende de algo que no está en el prompt ("mañana", "como siempre", "que suene como yo") | Lo busca en el cerebro: si lo encuentra lo enlaza, si no lo pregunta |

En la duda entre `vago` y otro tipo, elegí `vago`: es el que obliga a buscar.

---

## Paso 2 — Mapeá el cerebro

El "segundo cerebro" son los archivos de texto del proyecto donde ya quedó escrito lo decidido. Buscalos en este orden
y anotá cuáles existen (esa lista va al informe y al visor):

1. Los archivos que el propio prompt nombra.
2. Los archivos de contexto del agente, en la raíz y en sus carpetas: `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`,
   `.cursor/rules/`, `.agent/rules/`, `.agents/rules/`, `.windsurf/rules/`, `.github/copilot-instructions.md`, `README.md`.
3. La memoria del agente, si tiene una a la que puede acceder.
4. La carpeta de notas o la bóveda de Obsidian, si el archivo de contexto dice dónde está (o si existe una carpeta
   `notas/`, `docs/`, `cerebro/`, `vault/` o similar).
5. El resto del proyecto, **por búsqueda** (palabras clave y sinónimos), nunca leyendo todo.

Archivos grandes (más de ~2.000 líneas): buscá y leé solo el tramo. Archivos de claves (`.env`, `*secret*`, `*.key`,
credenciales): no se abren ni se citan.

Si no hay ningún archivo de contexto, decilo en una línea, seguí igual (todo lo vago va a preguntas) y al final ofrecé
armar el cerebro mínimo (ver "Si no hay cerebro").

---

## Paso 3 — Resolvé

Para cada fragmento `vago`, cada `afirmacion`, cada `responsable` y cada `archivo`:

1. Buscá en el cerebro con 2 o 3 formulaciones (la literal, sinónimos, el concepto: "el caso de siempre" → "caso",
   "testimonio", "historia", "ejemplo").
2. Leé la línea candidata **y su contexto** (unas líneas antes y después). Si no la leíste, no la cites.
3. Si resuelve: anotá `fuente` = `ruta/al/archivo.md:línea` y `dice` = lo que dice, en 12 palabras o menos, con tus
   palabras (no copies datos internos largos).
4. Si hay **dos fuentes que se contradicen**, no elijas: es una pregunta que muestra las dos.
5. Si hay fechas, quedate con la decisión más reciente y decilo ("vigente desde 01/10").
6. Si no aparece: es una **pregunta**. Escribila para que se conteste en una línea ("¿Qué keyword usamos esta semana?").

Después revisá las 7 R: si alguna quedó vacía en el prompt, buscá si el cerebro ya la define (por ejemplo, el tono o
las reglas de la casa en `CLAUDE.md`). Si la define, es un **aporte** con su fuente. Si no, y hace falta para hacer
bien la tarea, es una pregunta. Si no hace falta, se deja vacía.

---

## Paso 4 — Puntaje (0 a 100)

| Bloque | Puntos | Cálculo |
|---|---|---|
| Cobertura | 35 | 5 por cada R cubierta (con al menos un fragmento no neutro, o con un aporte con fuente) |
| Evidencia | 25 | 25 × afirmaciones con fuente ÷ afirmaciones (si no hay afirmaciones: 25) |
| Precisión | 25 | 25 × vagos resueltos ÷ vagos (si no hay vagos: 25) |
| Control | 15 | 5 si hay responsable claro · 5 si hay aprobación o punto de revisión · 5 si hay al menos una spec medible del entregable |

- **Inicial:** solo con el texto del prompt. Una R cuenta si el prompt la tiene; vagos resueltos = 0; afirmaciones con
  fuente = las que el prompt ya cita.
- **Final:** después de enlazar. Cuentan los aportes y los enlaces con fuente.
- Redondeá a entero. Mostrá siempre los dos y el desglose por bloque en el informe.

El puntaje mide **cuánto del prompt se apoya en algo escrito**, no si el prompt es lindo. Un prompt corto y conectado
puede sacar 90; uno largo y desconectado, 30.

---

## Paso 5 — Entregá

Guardá todo en `arana/AAAA-MM-DD-<slug>/` en la raíz del proyecto (o donde el archivo de contexto diga que van las
salidas):

### `informe.md`

```markdown
# La Araña · <título corto del pedido>
<fecha> · <N> palabras leídas · <E> enlazadas · <P> preguntas · 0 adivinadas
Puntaje: <inicial> → <final>   (cobertura a→b · evidencia a→b · precisión a→b · control a→b)

## Cerebro leído
- <archivo> — <para qué sirvió>

## Enlaces: lo que tu proyecto ya había decidido
| R | Lo que escribiste | Lo que ya estaba decidido | Fuente |

## Aportes: lo que no escribiste y el proyecto ya define
| R | Qué aporta | Fuente |

## Preguntas (no las adivino)
1. <pregunta> — <por qué hace falta>

## Prompt conectado
<el prompt original, palabra por palabra, sin tocar>

---
Contexto enlazado por la araña (no reemplaza al prompt, lo completa):
- [rol] <dato> (fuente: archivo:línea)
- [referencias] ...
Preguntas abiertas: <lista, o "ninguna">
```

### `arana.json` y `arana.html` (el visor)

`arana.json` sigue este formato. Las 7 secciones van siempre, en orden, aunque estén vacías:

```json
{
  "titulo": "historias de mañana",
  "proyecto": "nombre de la carpeta del proyecto",
  "fecha": "AAAA-MM-DD",
  "puntaje": {"inicial": 34, "final": 81},
  "fuentes": ["CLAUDE.md", "notas/oferta.md"],
  "secciones": [
    {"r": "rol", "fragmentos": [
      {"t": "Sos mi estratega", "k": "responsable", "fuente": "CLAUDE.md:12", "dice": "estratega de contenido y ventas"},
      {"t": "el caso de siempre", "k": "vago", "fuente": "CLAUDE.md:58", "dice": "su propia historia, ángulo 16"},
      {"t": "la keyword de la semana", "k": "vago", "pregunta": "¿Qué keyword usamos esta semana?"},
      {"t": "armame", "k": "neutro"}
    ], "aportes": [
      {"fuente": "CLAUDE.md:300", "dice": "voseo rioplatense, sin lenguaje de gurú"}
    ]}
  ]
}
```

- `r`: `rol` · `resultado` · `referencias` · `responsables` · `reglas` · `revision` · `arranque`.
- `k`: `neutro` · `afirmacion` · `responsable` · `archivo` · `aprobacion` · `spec` · `vago`.
- `t` es texto literal del prompt. `dice` va en 12 palabras o menos y **sin datos sensibles** (montos internos,
  teléfonos, mails, claves): el visor se graba y se muestra.
- `fuentes`: los archivos del cerebro que se usaron, sin línea (hasta 8).

Para el visor: copiá `references/visor.html` (está al lado de este archivo) a `arana/AAAA-MM-DD-<slug>/arana.html` y
reemplazá el texto `/*__DATOS__*/null` por el contenido de `arana.json`. Se abre con doble clic en cualquier navegador
y reproduce la lectura animada (espacio pausa, R reinicia, F muestra el final).

### En el chat

Mostrá, en este orden y corto: la línea de totales con el puntaje inicial → final, la tabla de enlaces, las preguntas
numeradas y las rutas de `informe.md` y `arana.html`. No pegues el informe entero.

---

## Paso 6 — Preguntá y aprendé

- Hacé las preguntas de a 5 como máximo, primero las que bloquean el resultado.
- Con las respuestas, actualizá el prompt conectado (las respuestas pasan a "contexto enlazado" con fuente
  `respuesta del usuario, <fecha>`) y recalculá el puntaje final.
- Ofrecé guardar las respuestas en el archivo de contexto del proyecto (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md` o el que
  use el agente), en una sección `## Decisiones` con la fecha. **Solo con el OK del usuario.** Así cada pregunta se
  contesta una vez: la próxima corrida la encuentra enlazada.
- En modo `ejecutar`, recién con las preguntas que bloquean respondidas, ejecutá el prompt conectado.

## Si no hay cerebro

Si el proyecto no tiene ningún archivo de contexto, al final ofrecé crear uno mínimo con 4 bloques (diez líneas cada
uno, como máximo) y llenalo **solo con lo que el usuario conteste**:

1. **Quién soy y qué hago** — negocio, cliente, oferta.
2. **Cómo hablo** — tono, palabras que uso, palabras que no.
3. **Qué está pasando ahora** — foco del mes, proyectos abiertos, fechas.
4. **Reglas** — lo que nunca se hace, quién aprueba qué.

El nombre del archivo depende del agente: `CLAUDE.md` (Claude Code), `AGENTS.md` (Codex, Cursor, y el estándar
neutro), `GEMINI.md` (Gemini CLI y Antigravity).

## Reglas

- **Nunca reescribas el prompt original.** Se entrega palabra por palabra; el contexto va abajo.
- **0 adivinadas.** Sin fuente leída no hay enlace.
- No ejecutes el prompt en el modo por defecto. La araña lee; el que decide es el usuario.
- No abras archivos de claves ni copies datos sensibles al visor.
- Si una fuente parece vieja o contradice otra más nueva, decilo en la pregunta en vez de elegir en silencio.
- Si el prompt es una sola línea trivial ("traducí esto"), decí que no hace falta la araña y ofrecé ejecutarlo directo.
