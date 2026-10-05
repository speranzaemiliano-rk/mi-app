# Sitio homenaje a Fidel Alberto Tammaro

Página independiente (no usa Firebase ni login). Se publica en
`https://speranzaemiliano-rk.github.io/mi-app/malvinas/`.

Todo el contenido está en **un solo lugar**: el bloque `var SOLDADO = { ... }`
al principio de `index.html`. El resto de la página se arma sola a partir de eso.

## Cómo agregar cosas

Cada elemento de una lista va entre llaves `{ }` y se separa del siguiente con
una **coma**. Los textos van entre comillas simples `' '`. Si un texto lleva un
apóstrofo adentro, escribilo como `\'`.

### Un testimonio
Dentro de `testimonios: [ ... ]`:
```js
{ texto: 'Lo que contó la persona.', autor: 'Nombre — relación con Fidel' },
```

### Una foto
1. Subí la foto a la carpeta `fotos/` (mejor en .jpg y que no pese más de 1 MB).
2. Dentro de `fotos: [ ... ]`:
```js
{ src: 'fotos/nombre-de-la-foto.jpg', texto: 'Qué se ve en la foto.' },
```

### Un diploma o reconocimiento
Igual que una foto, pero dentro de `reconocimientos: [ ... ]`:
```js
{ src: 'fotos/diploma.jpg', titulo: 'Nombre del reconocimiento', texto: 'Quién lo dio y cuándo.' },
```

### Una fecha en la línea de tiempo
Dentro de `hitos: [ ... ]`. La fecha va como `AAAA-MM-DD`; si no se sabe el
día, poné `xx` (ejemplo: `'2008-05-xx'`). Se ordenan solas.
```js
{ fecha: '1985-03-12', titulo: 'Qué pasó', texto: 'Un poco más de detalle.' },
```

### Un párrafo de su historia
Dentro de `historia: [ ... ]`, un texto por párrafo, en el orden en que se leen.

## Lo que todavía falta

Lo marcado `[COMPLETAR: ...]` no se ve en la página publicada. Para verlo
resaltado en amarillo mientras cargás datos, cambiá
`var MOSTRAR_PENDIENTES = false;` a `true`, y volvelo a `false` antes de publicar.

Hoy faltan: fecha y lugar de nacimiento, fecha de fallecimiento, su vida antes
y después de la guerra, de dónde son los proyectiles, un recuerdo de la
familia, y el nombre del segundo hombre del video.

## Antes de publicar

Abrí `index.html` en el navegador y revisá que la página se vea completa. Si
quedó en blanco, casi siempre es una coma o una comilla que falta en lo último
que agregaste.
