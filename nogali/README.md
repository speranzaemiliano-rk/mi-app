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
