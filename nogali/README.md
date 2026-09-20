# Sitio web Nogali

Sitio nuevo para **Nogali / Streusel** (Perlas del Sur S.A.), en reemplazo del que está
hoy en `www.nogali.com`.

Un solo archivo `index.html` con el HTML, el CSS y el JS adentro — el mismo criterio que
el resto de los proyectos del repo. No hay build, no hay npm, no hay framework.
Para verlo alcanza con abrir `index.html` en el navegador.

## Qué tiene adentro

| Sección | Contenido |
|---|---|
| Inicio | Presentación de la marca y los tres atributos (crocantes, sabrosas, rendidoras) |
| Empresa | Historia 1968 → 1981 → 2011 y ficha de Perlas del Sur S.A. |
| Productos | 10 productos filtrables por línea (dulces, crackers, bizcochitos) |
| Streusel | La línea saludable, con su propia identidad visual (verde y dorado) |
| Contacto | Formulario, datos de la planta y mapa |

Todo el texto y todas las presentaciones (cajas, paquetes, gramajes) salen del sitio
actual. No se inventó ningún dato.

## Diferencias con el sitio viejo

El sitio actual es de alrededor de 2011: XHTML 1.0, jQuery 1.4.2, sin diseño
responsive, y los títulos son imágenes PNG en vez de texto (técnica jQIR).

| | Antes | Ahora |
|---|---|---|
| Celular | Se ve roto | Diseño adaptable desde 320 px |
| Títulos | Imágenes PNG | Texto real (Google lo lee, se puede copiar, funciona con lectores de pantalla) |
| Navegación | 4 páginas separadas | Una sola página con anclas |
| Productos | Carrusel con flechas en JS | Grilla con filtros por línea |
| Imágenes | 2,3 MB en PNG | 468 KB en WebP (83 % menos) |
| Librerías | 4 archivos de jQuery | Ninguna |
| SEO | Sólo meta tags | Meta tags + Open Graph + datos estructurados schema.org |

## Cómo se comporta (no sólo cómo se ve)

El sitio no usa ninguna librería de animación: hay un motor de resortes de unas
40 líneas adentro del propio `index.html`. Un resorte se define con dos números
—**amortiguación** (1 = llega y se queda, 0,8 = se pasa un poquito) y
**respuesta** (segundos hasta llegar)— y se integra cuadro a cuadro. La ventaja
sobre una transición de CSS es que se le puede cambiar el destino en cualquier
momento sin cortar la velocidad: por eso el menú se puede agarrar a mitad de la
animación y dar vuelta sin que pegue un salto.

- **La respuesta va en el apretar, no en el soltar.** Botones, filtros, enlaces
  del menú y la hamburguesa se hunden apenas los tocás. Si el feedback espera al
  click, la sensación de estar tocando la cosa se cae a pedazos.
- **El menú del celular es una hoja que se arrastra.** Sale de la esquina donde
  está el botón que la abrió (si algo desaparece por un lado, esperamos que
  vuelva a aparecer por ahí). Se puede tirar para arriba para cerrarla: sigue al
  dedo aunque te vayas de la hoja, y al soltar decide según **hacia dónde va** el
  gesto y no dónde lo soltaste, así un envión corto alcanza para cerrar del todo.
  Si tirás para abajo estando abierta del todo, resiste cada vez más en vez de
  frenar en seco. La velocidad del dedo pasa tal cual al resorte, así que no hay
  costura entre arrastrar y animar.
- **Un toque no rebota, un envión sí.** Al abrir con un toque el resorte va
  amortiguado a 1 (sin rebote): el gesto no traía impulso, así que rebotar
  estaría de más. Al soltar un arrastre va a 0,8, porque ahí sí venía con envión.
- **Nada de divisores duros.** Donde el contenido pasa por debajo de la barra se
  desvanece contra ella, en vez de cortarse con una línea de 1px.
- **Filtrar reacomoda, no salta.** Las tarjetas que sobreviven al filtro se
  deslizan a su posición nueva (View Transitions; donde no está soportado,
  cambia directo y listo).
- **Tipografía por tamaño.** El espaciado entre letras y entre líneas no es un
  valor único: los títulos grandes van más cerrados y el texto chico más
  abierto. El cuerpo está en `rem` y los botones en `em`, así que si alguien
  agranda la letra del navegador, el sitio crece con ella en vez de romperse.
- **Accesibilidad.** Respeta las tres preferencias del sistema: movimiento
  reducido (se funde en vez de desplazarse, sin perder la respuesta),
  transparencia reducida (el vidrio se vuelve sólido) y más contraste (fondos
  opacos y bordes definidos).
- **Si algo no carga, no queda un agujero.** El mapa se pide sólo si el
  navegador puede llegar a OpenStreetMap; si hay un bloqueador de rastreadores o
  no hay red, en lugar de un rectángulo gris queda una tarjeta con la dirección.

## Formulario de contacto

El sitio es estático (no tiene servidor propio), así que el envío se resuelve de dos
maneras. La constante `ENDPOINT`, arriba del `<script>` al final de `index.html`,
decide cuál:

- **`ENDPOINT = ''`** (como está ahora) — abre el programa de correo del visitante con
  el mensaje ya armado hacia `info@nogali.com`. Funciona siempre, pero depende de que
  el visitante tenga configurado un cliente de mail, y en el celular a veces no está.
- **`ENDPOINT = 'https://...'`** — manda el mensaje por detrás a un servicio de
  formularios y el visitante no sale del sitio. **Es la opción recomendada.** Servicios
  que andan bien y tienen plan gratis: [Formspree](https://formspree.io),
  [FormSubmit](https://formsubmit.co), [Basin](https://usebasin.com). Te dan una URL y
  se pega ahí, no hay que tocar nada más.

El formulario ya trae una trampa anti-spam invisible (campo `web`): si un bot la
completa, el mensaje se descarta sin avisar.

## Cosas para decidir

1. **Show Zoo OH!** — el producto existe (hay foto en `img/dulces/zoooh.webp`) pero en
   el sitio actual está comentado en el HTML, o sea que no se muestra. No lo puse. Si
   sigue en venta, se agrega en dos minutos.
2. **Streusel «Dulces 3 Cereales y 6 Semillas»** — mismo caso, y además nunca tuvo foto
   cargada. Tampoco lo puse. Si va, hace falta la foto del paquete.
3. **Chocosamba** — en el sitio viejo las tres variedades (limón, naranja y banana)
   dicen todas *"con glacé blanco sabor Limón"*. Parece un copiar-pegar que quedó mal,
   así que acá dice sólo "glasé blanco". Confirmá cuál es el sabor real de cada una.
4. **Marineras Sin Sal** — es el único producto que en el sitio viejo no tiene texto
   descriptivo propio. Escribí uno con los datos que sí están (sin agregado de sal,
   bajo sodio, tripack). Conviene que lo revise alguien de la empresa.
5. **El mapa** — OpenStreetMap no tiene cargada la altura 5602 de Av. Mitre, así que el
   mapa muestra la zona de Ezpeleta sin chinche, y el botón «Cómo llegar» abre Google
   Maps con la dirección completa (ahí sí resuelve bien). Si querés la chinche exacta,
   pasame las coordenadas.
6. **Fotos** — las de producto se reutilizaron del sitio viejo. Son buenas pero chicas
   (454 px de ancho): en pantallas grandes se notan un poco blandas. Si hay fotos
   originales en mejor resolución, conviene reemplazarlas.

## Publicar

Hoy, dentro de este repo, queda en `https://speranzaemiliano-rk.github.io/mi-app/nogali/`.
Eso sirve para mostrarlo y aprobarlo.

Para que reemplace al sitio real de `www.nogali.com` conviene sacarlo a su propio repo
y apuntar el dominio ahí — así el sitio de la empresa no depende del repo del sistema
de gestión. Son los mismos archivos, se copian tal cual.

## Archivos

```
nogali/
├─ index.html          todo el sitio (HTML + CSS + JS)
├─ README.md           este archivo
└─ img/
   ├─ nogali.webp      logos
   ├─ streusel.webp
   ├─ dulces/          6 fotos (una sin usar: zoooh)
   ├─ crackers/        4 fotos
   ├─ bizcochitos/     1 foto
   └─ streusel/        2 fotos
```
