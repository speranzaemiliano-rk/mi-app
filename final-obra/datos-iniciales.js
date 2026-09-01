// ════════════════════════════════════════════════════════════════════════
//  DATOS INICIALES — Tablero de final de obra
//
//  Es la CARGA DE ARRANQUE, no la base de datos. Se usa una sola vez: la
//  primera vez que se abre la app en un equipo (o cuando la nube está
//  vacía). A partir de ahí manda lo que está guardado —en el equipo y en
//  Firebase—, así que editar este archivo NO cambia una obra que ya está
//  en uso. Para eso está el botón «Volver a la carga inicial» en Ajustes,
//  que borra todo y vuelve a partir de acá.
//
//  Sale del tablero que armamos en julio de 2026: 39 unidades y 13
//  espacios comunes. Tres colecciones planas indexadas por id, igual que
//  el resto del sistema, para que dos personas puedan tildar ítems
//  distintos al mismo tiempo sin pisarse:
//
//    rubros    → el gremio o rubro, con su color
//    entidades → cada unidad ('u101') o espacio común ('c_sum')
//    items     → cada pendiente: a qué entidad y rubro pertenece
// ════════════════════════════════════════════════════════════════════════
window.FINAL_OBRA_SEED = {
 "rubros": {
  "albanileria": {
   "nombre": "Albañilería",
   "color": "#5c6370",
   "orden": 0
  },
  "pintura": {
   "nombre": "Pintura",
   "color": "#6c63a8",
   "orden": 1
  },
  "durlock": {
   "nombre": "Durlock",
   "color": "#2563eb",
   "orden": 2
  },
  "hormigon": {
   "nombre": "Hormigón",
   "color": "#92650a",
   "orden": 3
  },
  "sanitarios": {
   "nombre": "Sanitarios",
   "color": "#0772a1",
   "orden": 4
  },
  "muebles": {
   "nombre": "Muebles",
   "color": "#157a3a",
   "orden": 5
  },
  "mesadas": {
   "nombre": "Mesadas",
   "color": "#7e22ce",
   "orden": 6
  },
  "puertas": {
   "nombre": "Puertas",
   "color": "#b91c1c",
   "orden": 7
  },
  "zocalos": {
   "nombre": "Zócalos",
   "color": "#a16207",
   "orden": 8
  },
  "limpieza": {
   "nombre": "Limpieza",
   "color": "#4b5563",
   "orden": 9
  },
  "electricidad": {
   "nombre": "Electricidad",
   "color": "#c2410c",
   "orden": 10
  },
  "carpinterias": {
   "nombre": "Carpinterías",
   "color": "#0f766e",
   "orden": 11
  },
  "herreria": {
   "nombre": "Herrería",
   "color": "#78350f",
   "orden": 12
  },
  "proyecto": {
   "nombre": "Proyecto",
   "color": "#0e7490",
   "orden": 13
  },
  "tarquini": {
   "nombre": "Tarquini",
   "color": "#6c63a8",
   "orden": 14
  },
  "plomeria": {
   "nombre": "Plomería",
   "color": "#0891b2",
   "orden": 15
  },
  "marmoleria": {
   "nombre": "Marmolería",
   "color": "#7c3aed",
   "orden": 16
  },
  "detalles": {
   "nombre": "Detalles",
   "color": "#475569",
   "orden": 17
  },
  "vidrieria": {
   "nombre": "Vidriería",
   "color": "#0891b2",
   "orden": 18
  },
  "ayuda_de_gremio": {
   "nombre": "Ayuda de gremio",
   "color": "#be123c",
   "orden": 19
  }
 },
 "entidades": {
  "u101": {
   "tipo": "unidad",
   "nombre": "Unidad 101",
   "piso": "1",
   "orden": 0
  },
  "u102": {
   "tipo": "unidad",
   "nombre": "Unidad 102",
   "piso": "1",
   "orden": 1
  },
  "u103": {
   "tipo": "unidad",
   "nombre": "Unidad 103",
   "piso": "1",
   "orden": 2
  },
  "u104": {
   "tipo": "unidad",
   "nombre": "Unidad 104",
   "piso": "1",
   "orden": 3
  },
  "u105": {
   "tipo": "unidad",
   "nombre": "Unidad 105",
   "piso": "1",
   "orden": 4
  },
  "u201": {
   "tipo": "unidad",
   "nombre": "Unidad 201",
   "piso": "2",
   "orden": 5
  },
  "u203": {
   "tipo": "unidad",
   "nombre": "Unidad 203",
   "piso": "2",
   "orden": 6
  },
  "u204": {
   "tipo": "unidad",
   "nombre": "Unidad 204",
   "piso": "2",
   "orden": 7
  },
  "u205": {
   "tipo": "unidad",
   "nombre": "Unidad 205",
   "piso": "2",
   "orden": 8
  },
  "u301": {
   "tipo": "unidad",
   "nombre": "Unidad 301",
   "piso": "3",
   "orden": 9
  },
  "u302": {
   "tipo": "unidad",
   "nombre": "Unidad 302",
   "piso": "3",
   "orden": 10
  },
  "u303": {
   "tipo": "unidad",
   "nombre": "Unidad 303",
   "piso": "3",
   "orden": 11
  },
  "u304": {
   "tipo": "unidad",
   "nombre": "Unidad 304",
   "piso": "3",
   "orden": 12
  },
  "u305": {
   "tipo": "unidad",
   "nombre": "Unidad 305",
   "piso": "3",
   "orden": 13
  },
  "u401": {
   "tipo": "unidad",
   "nombre": "Unidad 401",
   "piso": "4",
   "orden": 14
  },
  "u403": {
   "tipo": "unidad",
   "nombre": "Unidad 403",
   "piso": "4",
   "orden": 15
  },
  "u405": {
   "tipo": "unidad",
   "nombre": "Unidad 405",
   "piso": "4",
   "orden": 16
  },
  "u501": {
   "tipo": "unidad",
   "nombre": "Unidad 501",
   "piso": "5",
   "orden": 17
  },
  "u503": {
   "tipo": "unidad",
   "nombre": "Unidad 503",
   "piso": "5",
   "orden": 18
  },
  "u504": {
   "tipo": "unidad",
   "nombre": "Unidad 504",
   "piso": "5",
   "orden": 19
  },
  "u505": {
   "tipo": "unidad",
   "nombre": "Unidad 505",
   "piso": "5",
   "orden": 20
  },
  "u601": {
   "tipo": "unidad",
   "nombre": "Unidad 601",
   "piso": "6",
   "orden": 21
  },
  "u603": {
   "tipo": "unidad",
   "nombre": "Unidad 603",
   "piso": "6",
   "orden": 22
  },
  "u604": {
   "tipo": "unidad",
   "nombre": "Unidad 604",
   "piso": "6",
   "orden": 23
  },
  "u605": {
   "tipo": "unidad",
   "nombre": "Unidad 605",
   "piso": "6",
   "orden": 24
  },
  "u701": {
   "tipo": "unidad",
   "nombre": "Unidad 701",
   "piso": "7",
   "orden": 25
  },
  "u703": {
   "tipo": "unidad",
   "nombre": "Unidad 703",
   "piso": "7",
   "orden": 26
  },
  "u704": {
   "tipo": "unidad",
   "nombre": "Unidad 704",
   "piso": "7",
   "orden": 27
  },
  "u705": {
   "tipo": "unidad",
   "nombre": "Unidad 705",
   "piso": "7",
   "orden": 28
  },
  "u801": {
   "tipo": "unidad",
   "nombre": "Unidad 801",
   "piso": "8",
   "orden": 29
  },
  "u803": {
   "tipo": "unidad",
   "nombre": "Unidad 803",
   "piso": "8",
   "orden": 30
  },
  "u804": {
   "tipo": "unidad",
   "nombre": "Unidad 804",
   "piso": "8",
   "orden": 31
  },
  "u805": {
   "tipo": "unidad",
   "nombre": "Unidad 805",
   "piso": "8",
   "orden": 32
  },
  "u901": {
   "tipo": "unidad",
   "nombre": "Unidad 901",
   "piso": "9",
   "orden": 33
  },
  "u903": {
   "tipo": "unidad",
   "nombre": "Unidad 903",
   "piso": "9",
   "orden": 34
  },
  "u904": {
   "tipo": "unidad",
   "nombre": "Unidad 904",
   "piso": "9",
   "orden": 35
  },
  "u905": {
   "tipo": "unidad",
   "nombre": "Unidad 905",
   "piso": "9",
   "orden": 36
  },
  "u1001": {
   "tipo": "unidad",
   "nombre": "Unidad 1001",
   "piso": "10",
   "orden": 37
  },
  "u1004": {
   "tipo": "unidad",
   "nombre": "Unidad 1004",
   "piso": "10",
   "orden": 38
  },
  "c_sum": {
   "tipo": "comun",
   "nombre": "SUM",
   "icono": "🎉",
   "orden": 0
  },
  "c_kids": {
   "tipo": "comun",
   "nombre": "Co-Work",
   "icono": "💻",
   "orden": 1
  },
  "c_terraza": {
   "tipo": "comun",
   "nombre": "Terraza",
   "icono": "🌿",
   "orden": 2
  },
  "c_pb": {
   "tipo": "comun",
   "nombre": "Planta Baja",
   "icono": "🏗️",
   "orden": 3
  },
  "c_palieres": {
   "tipo": "comun",
   "nombre": "Palieres",
   "icono": "🏢",
   "orden": 4
  },
  "c_local": {
   "tipo": "comun",
   "nombre": "Local",
   "icono": "🏪",
   "orden": 5
  },
  "c_cocheras": {
   "tipo": "comun",
   "nombre": "Cocheras",
   "icono": "🚗",
   "orden": 6
  },
  "c_caja_escalera": {
   "tipo": "comun",
   "nombre": "🪜 Caja Escalera",
   "icono": "",
   "orden": 7
  },
  "c_fachada": {
   "tipo": "comun",
   "nombre": "Fachada",
   "icono": "🏛️",
   "orden": 8
  },
  "c_subsuelo": {
   "tipo": "comun",
   "nombre": "Subsuelo",
   "icono": "⬇️",
   "orden": 9
  },
  "c_sala_maq_frente": {
   "tipo": "comun",
   "nombre": "⚙️ Sala Máquinas Ascensor Frente",
   "icono": "",
   "orden": 10
  },
  "c_sala_maq_contrafrente": {
   "tipo": "comun",
   "nombre": "⚙️ Sala Máquinas Ascensor Contrafrente",
   "icono": "",
   "orden": 11
  },
  "c_piso13": {
   "tipo": "comun",
   "nombre": "Piso 13",
   "icono": "🏠",
   "orden": 12
  }
 },
 "items": {
  "i_u101_albanileria_0": {
   "ent": "u101",
   "rubro": "albanileria",
   "texto": "Revocar cajón sobre ventana, corrugados expuestos",
   "ok": false,
   "orden": 0
  },
  "i_u101_pintura_1": {
   "ent": "u101",
   "rubro": "pintura",
   "texto": "Falta 2da mano",
   "ok": false,
   "orden": 1
  },
  "i_u101_durlock_2": {
   "ent": "u101",
   "rubro": "durlock",
   "texto": "Bajar cajón sobre ventana",
   "ok": false,
   "orden": 2
  },
  "i_u101_durlock_3": {
   "ent": "u101",
   "rubro": "durlock",
   "texto": "Falta hueco para aire acondicionado",
   "ok": false,
   "orden": 3
  },
  "i_u101_hormigon_4": {
   "ent": "u101",
   "rubro": "hormigon",
   "texto": "Arreglar hormigón viga sobre ventana",
   "ok": false,
   "orden": 4
  },
  "i_u101_sanitarios_5": {
   "ent": "u101",
   "rubro": "sanitarios",
   "texto": "Falta grifería cocina, embellecedores",
   "ok": false,
   "orden": 5
  },
  "i_u101_sanitarios_6": {
   "ent": "u101",
   "rubro": "sanitarios",
   "texto": "Bidet suelto",
   "ok": false,
   "orden": 6
  },
  "i_u101_sanitarios_7": {
   "ent": "u101",
   "rubro": "sanitarios",
   "texto": "Bacha baño suelta — sin sellador",
   "ok": false,
   "orden": 7
  },
  "i_u101_sanitarios_8": {
   "ent": "u101",
   "rubro": "sanitarios",
   "texto": "Falta rejilla piso baño",
   "ok": false,
   "orden": 8
  },
  "i_u101_puertas_9": {
   "ent": "u101",
   "rubro": "puertas",
   "texto": "No cierra puerta del baño, cepillarla",
   "ok": false,
   "orden": 9
  },
  "i_u101_puertas_10": {
   "ent": "u101",
   "rubro": "puertas",
   "texto": "Falta balancín",
   "ok": false,
   "orden": 10
  },
  "i_u101_puertas_11": {
   "ent": "u101",
   "rubro": "puertas",
   "texto": "Falta agujero marco",
   "ok": false,
   "orden": 11
  },
  "i_u101_zocalos_12": {
   "ent": "u101",
   "rubro": "zocalos",
   "texto": "Incompletos",
   "ok": false,
   "orden": 12
  },
  "i_u101_electricidad_13": {
   "ent": "u101",
   "rubro": "electricidad",
   "texto": "Faltan luces en balcones",
   "ok": false,
   "orden": 13
  },
  "i_u101_muebles_14": {
   "ent": "u101",
   "rubro": "muebles",
   "texto": "Falta perfil gola tipo C de la cajonera",
   "ok": false,
   "orden": 14
  },
  "i_u102_albanileria_0": {
   "ent": "u102",
   "rubro": "albanileria",
   "texto": "Falta banquina lavarropas",
   "ok": false,
   "orden": 0
  },
  "i_u102_pintura_1": {
   "ent": "u102",
   "rubro": "pintura",
   "texto": "Incompleto",
   "ok": false,
   "orden": 1
  },
  "i_u102_durlock_2": {
   "ent": "u102",
   "rubro": "durlock",
   "texto": "Desprolijo, emprolijar",
   "ok": false,
   "orden": 2
  },
  "i_u102_hormigon_3": {
   "ent": "u102",
   "rubro": "hormigon",
   "texto": "Arreglar, cortar clavos y hierros sueltos, tapar pase losa",
   "ok": false,
   "orden": 3
  },
  "i_u102_hormigon_4": {
   "ent": "u102",
   "rubro": "hormigon",
   "texto": "Rellenar hormigón al lado marco puerta baño",
   "ok": false,
   "orden": 4
  },
  "i_u102_hormigon_5": {
   "ent": "u102",
   "rubro": "hormigon",
   "texto": "Arreglar hormigón exterior",
   "ok": false,
   "orden": 5
  },
  "i_u102_sanitarios_6": {
   "ent": "u102",
   "rubro": "sanitarios",
   "texto": "Falta grifería cocina — emblem, descarga",
   "ok": false,
   "orden": 6
  },
  "i_u102_sanitarios_7": {
   "ent": "u102",
   "rubro": "sanitarios",
   "texto": "Falta grifería baño + bidet + ducha",
   "ok": false,
   "orden": 7
  },
  "i_u102_sanitarios_8": {
   "ent": "u102",
   "rubro": "sanitarios",
   "texto": "Falta inodoro, bidet y embellecedores",
   "ok": false,
   "orden": 8
  },
  "i_u102_muebles_9": {
   "ent": "u102",
   "rubro": "muebles",
   "texto": "Falta cortar mueble para que entre grifería",
   "ok": false,
   "orden": 9
  },
  "i_u102_muebles_10": {
   "ent": "u102",
   "rubro": "muebles",
   "texto": "Falta calado toma microondas y bajo alacena para toma mesada",
   "ok": false,
   "orden": 10
  },
  "i_u102_muebles_11": {
   "ent": "u102",
   "rubro": "muebles",
   "texto": "Falta perfil gola en cajón",
   "ok": false,
   "orden": 11
  },
  "i_u102_muebles_12": {
   "ent": "u102",
   "rubro": "muebles",
   "texto": "Guía de placard suelta",
   "ok": false,
   "orden": 12
  },
  "i_u102_muebles_13": {
   "ent": "u102",
   "rubro": "muebles",
   "texto": "Falta perfil gola tipo C de la cajonera",
   "ok": false,
   "orden": 13
  },
  "i_u102_muebles_14": {
   "ent": "u102",
   "rubro": "muebles",
   "texto": "Cortar faja en bajo pileta (no colocar el mármol hasta entonces)",
   "ok": false,
   "orden": 14
  },
  "i_u102_mesadas_15": {
   "ent": "u102",
   "rubro": "mesadas",
   "texto": "Falta mesada, bacha",
   "ok": false,
   "orden": 15
  },
  "i_u102_puertas_16": {
   "ent": "u102",
   "rubro": "puertas",
   "texto": "Falta agujero en marco",
   "ok": false,
   "orden": 16
  },
  "i_u102_zocalos_17": {
   "ent": "u102",
   "rubro": "zocalos",
   "texto": "Faltan",
   "ok": false,
   "orden": 17
  },
  "i_u102_electricidad_18": {
   "ent": "u102",
   "rubro": "electricidad",
   "texto": "Falta luz balcón",
   "ok": false,
   "orden": 18
  },
  "i_u103_albanileria_0": {
   "ent": "u103",
   "rubro": "albanileria",
   "texto": "Falta zócalo en material para tapar caño agua",
   "ok": false,
   "orden": 0
  },
  "i_u103_albanileria_1": {
   "ent": "u103",
   "rubro": "albanileria",
   "texto": "Revocar conexión eléctrica tele",
   "ok": false,
   "orden": 1
  },
  "i_u103_albanileria_2": {
   "ent": "u103",
   "rubro": "albanileria",
   "texto": "Arreglar encuentro entre cerámica y cielorraso",
   "ok": false,
   "orden": 2
  },
  "i_u103_pintura_3": {
   "ent": "u103",
   "rubro": "pintura",
   "texto": "Incompleto",
   "ok": false,
   "orden": 3
  },
  "i_u103_durlock_4": {
   "ent": "u103",
   "rubro": "durlock",
   "texto": "Bajar cajón sobre carpintería (x2)",
   "ok": false,
   "orden": 4
  },
  "i_u103_durlock_5": {
   "ent": "u103",
   "rubro": "durlock",
   "texto": "Hacer Durlock sobre tabiques de hormigón",
   "ok": false,
   "orden": 5
  },
  "i_u103_hormigon_6": {
   "ent": "u103",
   "rubro": "hormigon",
   "texto": "Arreglar hormigón interior y exterior",
   "ok": false,
   "orden": 6
  },
  "i_u103_sanitarios_7": {
   "ent": "u103",
   "rubro": "sanitarios",
   "texto": "Falta grifería cocina emblem",
   "ok": false,
   "orden": 7
  },
  "i_u103_sanitarios_8": {
   "ent": "u103",
   "rubro": "sanitarios",
   "texto": "Falta grifería toilette, inodoro, descarga, bacha, embellecedores",
   "ok": false,
   "orden": 8
  },
  "i_u103_sanitarios_9": {
   "ent": "u103",
   "rubro": "sanitarios",
   "texto": "Baño: falta bacha, grifería, descarga, embellecedores",
   "ok": false,
   "orden": 9
  },
  "i_u103_muebles_10": {
   "ent": "u103",
   "rubro": "muebles",
   "texto": "Falta vestidor",
   "ok": false,
   "orden": 10
  },
  "i_u103_muebles_11": {
   "ent": "u103",
   "rubro": "muebles",
   "texto": "Falta perfil gola en cajón",
   "ok": false,
   "orden": 11
  },
  "i_u103_muebles_12": {
   "ent": "u103",
   "rubro": "muebles",
   "texto": "Falta ajuste doble fondo para cocina, isla suelta faltan patas",
   "ok": false,
   "orden": 12
  },
  "i_u103_muebles_13": {
   "ent": "u103",
   "rubro": "muebles",
   "texto": "Falta perfil gola tipo C de la cajonera",
   "ok": false,
   "orden": 13
  },
  "i_u103_muebles_14": {
   "ent": "u103",
   "rubro": "muebles",
   "texto": "Colocar frontín de horno",
   "ok": false,
   "orden": 14
  },
  "i_u103_muebles_15": {
   "ent": "u103",
   "rubro": "muebles",
   "texto": "Faltan esquineros en zócalo",
   "ok": false,
   "orden": 15
  },
  "i_u103_muebles_16": {
   "ent": "u103",
   "rubro": "muebles",
   "texto": "Cenefa bajo alacenas",
   "ok": false,
   "orden": 16
  },
  "i_u103_mesadas_17": {
   "ent": "u103",
   "rubro": "mesadas",
   "texto": "Falta colocar (ya replanteada)",
   "ok": false,
   "orden": 17
  },
  "i_u103_mesadas_18": {
   "ent": "u103",
   "rubro": "mesadas",
   "texto": "Falta colocar mesada toilette (ya en obra)",
   "ok": false,
   "orden": 18
  },
  "i_u103_mesadas_19": {
   "ent": "u103",
   "rubro": "mesadas",
   "texto": "Falta colocar ménsula para mesada",
   "ok": false,
   "orden": 19
  },
  "i_u103_puertas_20": {
   "ent": "u103",
   "rubro": "puertas",
   "texto": "Falta puerta toilette y baño (mano derecha) + agujero en marco",
   "ok": false,
   "orden": 20
  },
  "i_u103_puertas_21": {
   "ent": "u103",
   "rubro": "puertas",
   "texto": "Faltan balancines (x2)",
   "ok": false,
   "orden": 21
  },
  "i_u103_zocalos_22": {
   "ent": "u103",
   "rubro": "zocalos",
   "texto": "Pendientes",
   "ok": false,
   "orden": 22
  },
  "i_u103_electricidad_23": {
   "ent": "u103",
   "rubro": "electricidad",
   "texto": "Faltan luces balcón",
   "ok": false,
   "orden": 23
  },
  "i_u104_albanileria_0": {
   "ent": "u104",
   "rubro": "albanileria",
   "texto": "Falta tapar tablero",
   "ok": false,
   "orden": 0
  },
  "i_u104_pintura_1": {
   "ent": "u104",
   "rubro": "pintura",
   "texto": "Incompleto",
   "ok": false,
   "orden": 1
  },
  "i_u104_pintura_2": {
   "ent": "u104",
   "rubro": "pintura",
   "texto": "Cajón de habitación en blanco",
   "ok": false,
   "orden": 2
  },
  "i_u104_durlock_3": {
   "ent": "u104",
   "rubro": "durlock",
   "texto": "Tabique Durlock en habitación",
   "ok": false,
   "orden": 3
  },
  "i_u104_hormigon_4": {
   "ent": "u104",
   "rubro": "hormigon",
   "texto": "Arreglar hormigón",
   "ok": false,
   "orden": 4
  },
  "i_u104_sanitarios_5": {
   "ent": "u104",
   "rubro": "sanitarios",
   "texto": "Toilette: falta tarquini, colocar mesada, bacha, descarga, inodoro y embellecedores",
   "ok": false,
   "orden": 5
  },
  "i_u104_sanitarios_6": {
   "ent": "u104",
   "rubro": "sanitarios",
   "texto": "Baño: sellar bacha, grifería bidet y embellecedores",
   "ok": false,
   "orden": 6
  },
  "i_u104_muebles_7": {
   "ent": "u104",
   "rubro": "muebles",
   "texto": "Falta ajuste tomas horno y perfil gola",
   "ok": false,
   "orden": 7
  },
  "i_u104_muebles_8": {
   "ent": "u104",
   "rubro": "muebles",
   "texto": "Falta embellecedor para ángulo mueble lateral heladera",
   "ok": false,
   "orden": 8
  },
  "i_u104_muebles_9": {
   "ent": "u104",
   "rubro": "muebles",
   "texto": "Falta perfil gola tipo C de la cajonera",
   "ok": false,
   "orden": 9
  },
  "i_u104_muebles_10": {
   "ent": "u104",
   "rubro": "muebles",
   "texto": "Colocar tiras de cenefa bajo alacenas",
   "ok": false,
   "orden": 10
  },
  "i_u104_muebles_11": {
   "ent": "u104",
   "rubro": "muebles",
   "texto": "Terminar colocación de esquineros en zócalo (revisar banquina)",
   "ok": false,
   "orden": 11
  },
  "i_u104_mesadas_12": {
   "ent": "u104",
   "rubro": "mesadas",
   "texto": "Colocar mesada de toilette",
   "ok": false,
   "orden": 12
  },
  "i_u104_puertas_13": {
   "ent": "u104",
   "rubro": "puertas",
   "texto": "Puerta toilette: mano derecha, agujero en marco y balancín",
   "ok": false,
   "orden": 13
  },
  "i_u104_puertas_14": {
   "ent": "u104",
   "rubro": "puertas",
   "texto": "Puerta baño: falta agujero marco, balancín, cepillar",
   "ok": false,
   "orden": 14
  },
  "i_u104_zocalos_15": {
   "ent": "u104",
   "rubro": "zocalos",
   "texto": "Incompleto",
   "ok": false,
   "orden": 15
  },
  "i_u104_electricidad_16": {
   "ent": "u104",
   "rubro": "electricidad",
   "texto": "Luces balcón",
   "ok": false,
   "orden": 16
  },
  "i_u105_sanitarios_0": {
   "ent": "u105",
   "rubro": "sanitarios",
   "texto": "Conectar bacha cocina",
   "ok": false,
   "orden": 0
  },
  "i_u105_sanitarios_1": {
   "ent": "u105",
   "rubro": "sanitarios",
   "texto": "Colocar y conectar bacha toilette",
   "ok": false,
   "orden": 1
  },
  "i_u105_sanitarios_2": {
   "ent": "u105",
   "rubro": "sanitarios",
   "texto": "Colocar y conectar inodoro en toilette",
   "ok": false,
   "orden": 2
  },
  "i_u105_sanitarios_3": {
   "ent": "u105",
   "rubro": "sanitarios",
   "texto": "Colocar y conectar bacha baño en suite",
   "ok": false,
   "orden": 3
  },
  "i_u105_sanitarios_4": {
   "ent": "u105",
   "rubro": "sanitarios",
   "texto": "Colocar y conectar inodoro y bidet en baño en suite",
   "ok": false,
   "orden": 4
  },
  "i_u105_sanitarios_5": {
   "ent": "u105",
   "rubro": "sanitarios",
   "texto": "Colocar y conectar bañera en baño en suite",
   "ok": false,
   "orden": 5
  },
  "i_u105_sanitarios_6": {
   "ent": "u105",
   "rubro": "sanitarios",
   "texto": "Colocar tapas inodoros y embellecedores en todas las llaves de paso",
   "ok": false,
   "orden": 6
  },
  "i_u105_albanileria_7": {
   "ent": "u105",
   "rubro": "albanileria",
   "texto": "Terminar de revocar paredes de cocina",
   "ok": false,
   "orden": 7
  },
  "i_u105_albanileria_8": {
   "ent": "u105",
   "rubro": "albanileria",
   "texto": "Terminar de revocar paredes de toilette (para tarquini)",
   "ok": false,
   "orden": 8
  },
  "i_u105_albanileria_9": {
   "ent": "u105",
   "rubro": "albanileria",
   "texto": "Terminar de revocar paredes de baño en suite (para revestimiento)",
   "ok": false,
   "orden": 9
  },
  "i_u105_albanileria_10": {
   "ent": "u105",
   "rubro": "albanileria",
   "texto": "Terminar de colocar solado en área cocina/distribuidor y vestidor",
   "ok": false,
   "orden": 10
  },
  "i_u105_albanileria_11": {
   "ent": "u105",
   "rubro": "albanileria",
   "texto": "Colocación completa en piso y paredes de revestimiento baño en suite",
   "ok": false,
   "orden": 11
  },
  "i_u105_pintura_12": {
   "ent": "u105",
   "rubro": "pintura",
   "texto": "Hacer tarquini en toilette",
   "ok": false,
   "orden": 12
  },
  "i_u105_pintura_13": {
   "ent": "u105",
   "rubro": "pintura",
   "texto": "Pintar con 3 manos todo el departamento (paredes y cielorrasos)",
   "ok": false,
   "orden": 13
  },
  "i_u105_pintura_14": {
   "ent": "u105",
   "rubro": "pintura",
   "texto": "Pintar marcos y puertas",
   "ok": false,
   "orden": 14
  },
  "i_u105_durlock_15": {
   "ent": "u105",
   "rubro": "durlock",
   "texto": "Cerrar pleno en toilette (estructura, emplacado y masillado)",
   "ok": false,
   "orden": 15
  },
  "i_u105_durlock_16": {
   "ent": "u105",
   "rubro": "durlock",
   "texto": "Modificar emplacado de vestidor por conexión pluvial y emplacar mocheta",
   "ok": false,
   "orden": 16
  },
  "i_u105_durlock_17": {
   "ent": "u105",
   "rubro": "durlock",
   "texto": "Terminar de emplacar toilette",
   "ok": false,
   "orden": 17
  },
  "i_u105_durlock_18": {
   "ent": "u105",
   "rubro": "durlock",
   "texto": "Masillar durlock ya hecho",
   "ok": false,
   "orden": 18
  },
  "i_u105_durlock_19": {
   "ent": "u105",
   "rubro": "durlock",
   "texto": "Media pared sobre tabiques hormigón (a definir)",
   "ok": false,
   "orden": 19
  },
  "i_u105_hormigon_20": {
   "ent": "u105",
   "rubro": "hormigon",
   "texto": "Lijar y maquillar columnas interiores en caso de ser necesario",
   "ok": false,
   "orden": 20
  },
  "i_u105_hormigon_21": {
   "ent": "u105",
   "rubro": "hormigon",
   "texto": "Lijar parapeto exterior y aplicar hidrolaca",
   "ok": false,
   "orden": 21
  },
  "i_u105_hormigon_22": {
   "ent": "u105",
   "rubro": "hormigon",
   "texto": "Lijar bajo losa balcón exterior",
   "ok": false,
   "orden": 22
  },
  "i_u105_carpinterias_23": {
   "ent": "u105",
   "rubro": "carpinterias",
   "texto": "Verificar sellado y detalles",
   "ok": false,
   "orden": 23
  },
  "i_u105_electricidad_24": {
   "ent": "u105",
   "rubro": "electricidad",
   "texto": "Verificar conexiones y terminar detalles",
   "ok": false,
   "orden": 24
  },
  "i_u105_muebles_25": {
   "ent": "u105",
   "rubro": "muebles",
   "texto": "Colocar mueble cocina (está en obra)",
   "ok": false,
   "orden": 25
  },
  "i_u105_marmoleria_26": {
   "ent": "u105",
   "rubro": "marmoleria",
   "texto": "Replantear y colocar mesada cocina",
   "ok": false,
   "orden": 26
  },
  "i_u105_marmoleria_27": {
   "ent": "u105",
   "rubro": "marmoleria",
   "texto": "Replantear y colocar mesada toilette",
   "ok": false,
   "orden": 27
  },
  "i_u105_marmoleria_28": {
   "ent": "u105",
   "rubro": "marmoleria",
   "texto": "Replantear y colocar mesada baño en suite",
   "ok": false,
   "orden": 28
  },
  "i_u105_puertas_29": {
   "ent": "u105",
   "rubro": "puertas",
   "texto": "Colocar puertas, balancines, cerraduras, y hacer agujeros para pasadores en marcos",
   "ok": false,
   "orden": 29
  },
  "i_u105_zocalos_30": {
   "ent": "u105",
   "rubro": "zocalos",
   "texto": "Pendiente colocación de todos los zócalos",
   "ok": false,
   "orden": 30
  },
  "i_u105_detalles_31": {
   "ent": "u105",
   "rubro": "detalles",
   "texto": "Colocar rejilla ventilación en toilette",
   "ok": false,
   "orden": 31
  },
  "i_u105_detalles_32": {
   "ent": "u105",
   "rubro": "detalles",
   "texto": "Colocar rejilla ventilación en baño en suite",
   "ok": false,
   "orden": 32
  },
  "i_u105_detalles_33": {
   "ent": "u105",
   "rubro": "detalles",
   "texto": "Colocar ménsula para que apoye mesada en cocina",
   "ok": false,
   "orden": 33
  },
  "i_u201_pintura_0": {
   "ent": "u201",
   "rubro": "pintura",
   "texto": "Incompleto",
   "ok": false,
   "orden": 0
  },
  "i_u201_hormigon_1": {
   "ent": "u201",
   "rubro": "hormigon",
   "texto": "Lijar hormigón exterior",
   "ok": false,
   "orden": 1
  },
  "i_u201_sanitarios_2": {
   "ent": "u201",
   "rubro": "sanitarios",
   "texto": "Embellecedores en baño",
   "ok": false,
   "orden": 2
  },
  "i_u201_muebles_3": {
   "ent": "u201",
   "rubro": "muebles",
   "texto": "Falta nivelar puertas placard",
   "ok": false,
   "orden": 3
  },
  "i_u203_albanileria_0": {
   "ent": "u203",
   "rubro": "albanileria",
   "texto": "Banquina para tapar caño atrás heladera",
   "ok": false,
   "orden": 0
  },
  "i_u203_pintura_1": {
   "ent": "u203",
   "rubro": "pintura",
   "texto": "Limpiar manchas pintura en baño",
   "ok": false,
   "orden": 1
  },
  "i_u203_hormigon_2": {
   "ent": "u203",
   "rubro": "hormigon",
   "texto": "Hormigón visto tabique acceso simil hormigón",
   "ok": false,
   "orden": 2
  },
  "i_u203_hormigon_3": {
   "ent": "u203",
   "rubro": "hormigon",
   "texto": "Hormigón afuera",
   "ok": false,
   "orden": 3
  },
  "i_u203_sanitarios_4": {
   "ent": "u203",
   "rubro": "sanitarios",
   "texto": "Embellecedores en toilette",
   "ok": false,
   "orden": 4
  },
  "i_u203_sanitarios_5": {
   "ent": "u203",
   "rubro": "sanitarios",
   "texto": "Embellecedores en baño",
   "ok": false,
   "orden": 5
  },
  "i_u203_muebles_6": {
   "ent": "u203",
   "rubro": "muebles",
   "texto": "Falta doble fondo toma anafe",
   "ok": false,
   "orden": 6
  },
  "i_u203_muebles_7": {
   "ent": "u203",
   "rubro": "muebles",
   "texto": "Alinear puertas",
   "ok": false,
   "orden": 7
  },
  "i_u203_muebles_8": {
   "ent": "u203",
   "rubro": "muebles",
   "texto": "Frente pata mueble cocina quedó corto",
   "ok": false,
   "orden": 8
  },
  "i_u203_muebles_9": {
   "ent": "u203",
   "rubro": "muebles",
   "texto": "Limpiar '203' escrito en placa lateral mueble",
   "ok": false,
   "orden": 9
  },
  "i_u203_muebles_10": {
   "ent": "u203",
   "rubro": "muebles",
   "texto": "Colocar pequeño ajuste bajo módulo tipo pared",
   "ok": false,
   "orden": 10
  },
  "i_u203_mesadas_11": {
   "ent": "u203",
   "rubro": "mesadas",
   "texto": "Falta zócalo cocina",
   "ok": false,
   "orden": 11
  },
  "i_u203_puertas_12": {
   "ent": "u203",
   "rubro": "puertas",
   "texto": "No anda cerradura baño toilette",
   "ok": false,
   "orden": 12
  },
  "i_u204_durlock_0": {
   "ent": "u204",
   "rubro": "durlock",
   "texto": "Se ve tornillo en cielorraso baño",
   "ok": false,
   "orden": 0
  },
  "i_u204_sanitarios_1": {
   "ent": "u204",
   "rubro": "sanitarios",
   "texto": "Falta grifería cocina emblem",
   "ok": false,
   "orden": 1
  },
  "i_u204_sanitarios_2": {
   "ent": "u204",
   "rubro": "sanitarios",
   "texto": "Embellecedores en toilette",
   "ok": false,
   "orden": 2
  },
  "i_u204_sanitarios_3": {
   "ent": "u204",
   "rubro": "sanitarios",
   "texto": "Embellecedores en baño",
   "ok": false,
   "orden": 3
  },
  "i_u204_muebles_4": {
   "ent": "u204",
   "rubro": "muebles",
   "texto": "Alinear puertas mueble cocina",
   "ok": false,
   "orden": 4
  },
  "i_u204_muebles_5": {
   "ent": "u204",
   "rubro": "muebles",
   "texto": "Ajuste doble fondo para toma anafe",
   "ok": false,
   "orden": 5
  },
  "i_u204_muebles_6": {
   "ent": "u204",
   "rubro": "muebles",
   "texto": "Falta 'L' embellecedor lateral vestidor",
   "ok": false,
   "orden": 6
  },
  "i_u204_puertas_7": {
   "ent": "u204",
   "rubro": "puertas",
   "texto": "No anda cerradura toilette",
   "ok": false,
   "orden": 7
  },
  "i_u205_pintura_0": {
   "ent": "u205",
   "rubro": "pintura",
   "texto": "Incompleto",
   "ok": false,
   "orden": 0
  },
  "i_u205_sanitarios_1": {
   "ent": "u205",
   "rubro": "sanitarios",
   "texto": "Estar pendiente tema pérdida agua (rebalsa rejilla baño)",
   "ok": false,
   "orden": 1
  },
  "i_u205_sanitarios_2": {
   "ent": "u205",
   "rubro": "sanitarios",
   "texto": "Embellecedores en toilette",
   "ok": false,
   "orden": 2
  },
  "i_u205_sanitarios_3": {
   "ent": "u205",
   "rubro": "sanitarios",
   "texto": "Embellecedores en baño",
   "ok": false,
   "orden": 3
  },
  "i_u205_muebles_4": {
   "ent": "u205",
   "rubro": "muebles",
   "texto": "Falta zócalo mueble cocina",
   "ok": false,
   "orden": 4
  },
  "i_u205_muebles_5": {
   "ent": "u205",
   "rubro": "muebles",
   "texto": "Falta pegar zócalo mueble cocina",
   "ok": false,
   "orden": 5
  },
  "i_u205_muebles_6": {
   "ent": "u205",
   "rubro": "muebles",
   "texto": "Falta ménsula para apoyar mesada",
   "ok": false,
   "orden": 6
  },
  "i_u205_muebles_7": {
   "ent": "u205",
   "rubro": "muebles",
   "texto": "Alinear puertas alacena",
   "ok": false,
   "orden": 7
  },
  "i_u205_muebles_8": {
   "ent": "u205",
   "rubro": "muebles",
   "texto": "Sacaron todos los módulos bajo mesada — queda a la espera para presupuesto por su recolocación",
   "ok": false,
   "orden": 8
  },
  "i_u205_puertas_9": {
   "ent": "u205",
   "rubro": "puertas",
   "texto": "No anda cerradura toilette",
   "ok": false,
   "orden": 9
  },
  "i_u301_hormigon_0": {
   "ent": "u301",
   "rubro": "hormigon",
   "texto": "Lijar canto de hormigón al lado heladera",
   "ok": false,
   "orden": 0
  },
  "i_u301_hormigon_1": {
   "ent": "u301",
   "rubro": "hormigon",
   "texto": "Lijar parapeto exterior y aplicar hidrolaca",
   "ok": false,
   "orden": 1
  },
  "i_u301_muebles_2": {
   "ent": "u301",
   "rubro": "muebles",
   "texto": "Regular puerta de placard",
   "ok": false,
   "orden": 2
  },
  "i_u301_detalles_3": {
   "ent": "u301",
   "rubro": "detalles",
   "texto": "Falta tapa aire acondicionado",
   "ok": false,
   "orden": 3
  },
  "i_u301_albanileria_4": {
   "ent": "u301",
   "rubro": "albanileria",
   "texto": "Falta emprolijar banquina carpintería en balcón",
   "ok": false,
   "orden": 4
  },
  "i_u301_albanileria_5": {
   "ent": "u301",
   "rubro": "albanileria",
   "texto": "Colocar zócalo ajuste plato de ducha",
   "ok": false,
   "orden": 5
  },
  "i_u301_puertas_6": {
   "ent": "u301",
   "rubro": "puertas",
   "texto": "Puerta habitación, agrandar agujero pestillo para que cierre",
   "ok": false,
   "orden": 6
  },
  "i_u301_electricidad_7": {
   "ent": "u301",
   "rubro": "electricidad",
   "texto": "Colocar tapas y frentes de tomas",
   "ok": false,
   "orden": 7
  },
  "i_u301_electricidad_8": {
   "ent": "u301",
   "rubro": "electricidad",
   "texto": "Colocar anafe",
   "ok": false,
   "orden": 8
  },
  "i_u302_muebles_0": {
   "ent": "u302",
   "rubro": "muebles",
   "texto": "Falta ajuste superior cocina",
   "ok": false,
   "orden": 0
  },
  "i_u302_muebles_1": {
   "ent": "u302",
   "rubro": "muebles",
   "texto": "Alinear puerta placard",
   "ok": false,
   "orden": 1
  },
  "i_u302_electricidad_2": {
   "ent": "u302",
   "rubro": "electricidad",
   "texto": "Colocar tapas y frentes de tomas",
   "ok": false,
   "orden": 2
  },
  "i_u302_electricidad_3": {
   "ent": "u302",
   "rubro": "electricidad",
   "texto": "Colocar anafe",
   "ok": false,
   "orden": 3
  },
  "i_u303_pintura_0": {
   "ent": "u303",
   "rubro": "pintura",
   "texto": "Pintar buña simil hormigón sobre ventana living",
   "ok": false,
   "orden": 0
  },
  "i_u303_pintura_1": {
   "ent": "u303",
   "rubro": "pintura",
   "texto": "Emprolijar cajón simil hormigón al lado ventana",
   "ok": false,
   "orden": 1
  },
  "i_u303_zocalos_2": {
   "ent": "u303",
   "rubro": "zocalos",
   "texto": "Cambiar zócalo toilette que está verde",
   "ok": false,
   "orden": 2
  },
  "i_u303_hormigon_3": {
   "ent": "u303",
   "rubro": "hormigon",
   "texto": "Emprolijar viga habitación, lijar bien — encuentro con pintura muy desprolijo",
   "ok": false,
   "orden": 3
  },
  "i_u303_hormigon_4": {
   "ent": "u303",
   "rubro": "hormigon",
   "texto": "Hormigón exterior, hueco en alero piso superior, tapar",
   "ok": false,
   "orden": 4
  },
  "i_u303_puertas_5": {
   "ent": "u303",
   "rubro": "puertas",
   "texto": "Puerta baño suite trabada, sacar y cepillar",
   "ok": false,
   "orden": 5
  },
  "i_u303_puertas_6": {
   "ent": "u303",
   "rubro": "puertas",
   "texto": "Falta embellecedor bocallave habitación",
   "ok": false,
   "orden": 6
  },
  "i_u303_electricidad_7": {
   "ent": "u303",
   "rubro": "electricidad",
   "texto": "Colocar tapas y frentes de tomas",
   "ok": false,
   "orden": 7
  },
  "i_u303_electricidad_8": {
   "ent": "u303",
   "rubro": "electricidad",
   "texto": "Colocar horno",
   "ok": false,
   "orden": 8
  },
  "i_u303_electricidad_9": {
   "ent": "u303",
   "rubro": "electricidad",
   "texto": "Colocar anafe",
   "ok": false,
   "orden": 9
  },
  "i_u304_muebles_0": {
   "ent": "u304",
   "rubro": "muebles",
   "texto": "Detalle en encuentro lateral heladera",
   "ok": false,
   "orden": 0
  },
  "i_u304_muebles_1": {
   "ent": "u304",
   "rubro": "muebles",
   "texto": "Nivelar puerta de alacena y bajo pileta",
   "ok": false,
   "orden": 1
  },
  "i_u304_muebles_2": {
   "ent": "u304",
   "rubro": "muebles",
   "texto": "Desplazar cajón superior sobre alacenas a la derecha, cerrar abertura con silicona contra la pared",
   "ok": false,
   "orden": 2
  },
  "i_u304_marmoleria_3": {
   "ent": "u304",
   "rubro": "marmoleria",
   "texto": "Falta zócalo lateral isla",
   "ok": false,
   "orden": 3
  },
  "i_u304_marmoleria_4": {
   "ent": "u304",
   "rubro": "marmoleria",
   "texto": "Falta colocar mesada lavadero",
   "ok": false,
   "orden": 4
  },
  "i_u304_sanitarios_5": {
   "ent": "u304",
   "rubro": "sanitarios",
   "texto": "Falta grifería lavadero, descarga y conexión",
   "ok": false,
   "orden": 5
  },
  "i_u304_puertas_6": {
   "ent": "u304",
   "rubro": "puertas",
   "texto": "Puerta lavadero, falta balancín y cerradura, arreglar traba puerta chiquita, cepillar",
   "ok": false,
   "orden": 6
  },
  "i_u304_puertas_7": {
   "ent": "u304",
   "rubro": "puertas",
   "texto": "Puerta baño no suite cepillar",
   "ok": false,
   "orden": 7
  },
  "i_u304_puertas_8": {
   "ent": "u304",
   "rubro": "puertas",
   "texto": "Puerta hab. secundaria falta balancín",
   "ok": false,
   "orden": 8
  },
  "i_u304_pintura_9": {
   "ent": "u304",
   "rubro": "pintura",
   "texto": "Cajón habitación secundaria emprolijar encuentro buña y hormigón",
   "ok": false,
   "orden": 9
  },
  "i_u304_albanileria_10": {
   "ent": "u304",
   "rubro": "albanileria",
   "texto": "Falta empastinar piezas pared baño en suite",
   "ok": false,
   "orden": 10
  },
  "i_u304_zocalos_11": {
   "ent": "u304",
   "rubro": "zocalos",
   "texto": "Falta zócalo detrás vestidor",
   "ok": false,
   "orden": 11
  },
  "i_u304_electricidad_12": {
   "ent": "u304",
   "rubro": "electricidad",
   "texto": "Colocar tapas y frentes de tomas",
   "ok": false,
   "orden": 12
  },
  "i_u304_electricidad_13": {
   "ent": "u304",
   "rubro": "electricidad",
   "texto": "Colocar horno",
   "ok": false,
   "orden": 13
  },
  "i_u304_electricidad_14": {
   "ent": "u304",
   "rubro": "electricidad",
   "texto": "Colocar anafe",
   "ok": false,
   "orden": 14
  },
  "i_u305_albanileria_0": {
   "ent": "u305",
   "rubro": "albanileria",
   "texto": "Cargar lateral columna al marco y hacer acetato",
   "ok": false,
   "orden": 0
  },
  "i_u305_hormigon_1": {
   "ent": "u305",
   "rubro": "hormigon",
   "texto": "Acetato en columna living",
   "ok": false,
   "orden": 1
  },
  "i_u305_hormigon_2": {
   "ent": "u305",
   "rubro": "hormigon",
   "texto": "Balcón lijar",
   "ok": false,
   "orden": 2
  },
  "i_u305_sanitarios_3": {
   "ent": "u305",
   "rubro": "sanitarios",
   "texto": "Baño en suite: faltan griferías+embellecedores+bacha suelta+soporte de ducha suelto",
   "ok": false,
   "orden": 3
  },
  "i_u305_sanitarios_4": {
   "ent": "u305",
   "rubro": "sanitarios",
   "texto": "Toilette: faltan embellecedores",
   "ok": false,
   "orden": 4
  },
  "i_u305_muebles_5": {
   "ent": "u305",
   "rubro": "muebles",
   "texto": "Alinear puertas",
   "ok": false,
   "orden": 5
  },
  "i_u305_puertas_6": {
   "ent": "u305",
   "rubro": "puertas",
   "texto": "Faltan balancines",
   "ok": false,
   "orden": 6
  },
  "i_u305_zocalos_7": {
   "ent": "u305",
   "rubro": "zocalos",
   "texto": "Limpiar en toilette",
   "ok": false,
   "orden": 7
  },
  "i_u305_pintura_8": {
   "ent": "u305",
   "rubro": "pintura",
   "texto": "Repasar tarquini toilette",
   "ok": false,
   "orden": 8
  },
  "i_u401_hormigon_0": {
   "ent": "u401",
   "rubro": "hormigon",
   "texto": "Lijar bajo losa balcón Congreso exterior",
   "ok": false,
   "orden": 0
  },
  "i_u401_hormigon_1": {
   "ent": "u401",
   "rubro": "hormigon",
   "texto": "Lijar bajo losa balcón Arribeños exterior",
   "ok": false,
   "orden": 1
  },
  "i_u401_hormigon_2": {
   "ent": "u401",
   "rubro": "hormigon",
   "texto": "Lijar parapetos y aplicar hidrolaca en ambos balcones",
   "ok": false,
   "orden": 2
  },
  "i_u401_hormigon_3": {
   "ent": "u401",
   "rubro": "hormigon",
   "texto": "Falta lijar y emprolijar columnas interior",
   "ok": false,
   "orden": 3
  },
  "i_u401_hormigon_4": {
   "ent": "u401",
   "rubro": "hormigon",
   "texto": "Lijar vigas sobre ventanas",
   "ok": false,
   "orden": 4
  },
  "i_u401_hormigon_5": {
   "ent": "u401",
   "rubro": "hormigon",
   "texto": "Falta tapar pase losa living",
   "ok": false,
   "orden": 5
  },
  "i_u401_hormigon_6": {
   "ent": "u401",
   "rubro": "hormigon",
   "texto": "Lijar losas",
   "ok": false,
   "orden": 6
  },
  "i_u401_hormigon_7": {
   "ent": "u401",
   "rubro": "hormigon",
   "texto": "Lijar viga sobre carpintería hab. principal manchada con pintura",
   "ok": false,
   "orden": 7
  },
  "i_u401_pintura_8": {
   "ent": "u401",
   "rubro": "pintura",
   "texto": "Faltan retoques y última mano en todas las paredes",
   "ok": false,
   "orden": 8
  },
  "i_u401_pintura_9": {
   "ent": "u401",
   "rubro": "pintura",
   "texto": "Arreglar pared pérdida conexión lavarropas",
   "ok": false,
   "orden": 9
  },
  "i_u401_pintura_10": {
   "ent": "u401",
   "rubro": "pintura",
   "texto": "Falta pintar buñas",
   "ok": false,
   "orden": 10
  },
  "i_u401_sanitarios_11": {
   "ent": "u401",
   "rubro": "sanitarios",
   "texto": "Verificar pérdida en conexión a lavarropas",
   "ok": false,
   "orden": 11
  },
  "i_u401_zocalos_12": {
   "ent": "u401",
   "rubro": "zocalos",
   "texto": "Cambiar zócalos atrás heladera y lavarropas, están húmedos",
   "ok": false,
   "orden": 12
  },
  "i_u401_muebles_13": {
   "ent": "u401",
   "rubro": "muebles",
   "texto": "Hacer pase lateral para descarga lavarropas",
   "ok": false,
   "orden": 13
  },
  "i_u401_carpinterias_14": {
   "ent": "u401",
   "rubro": "carpinterias",
   "texto": "Falta sellar carpinterías",
   "ok": false,
   "orden": 14
  },
  "i_u401_puertas_15": {
   "ent": "u401",
   "rubro": "puertas",
   "texto": "Puerta habitación secundaria no cierra, cepillar",
   "ok": false,
   "orden": 15
  },
  "i_u403_durlock_0": {
   "ent": "u403",
   "rubro": "durlock",
   "texto": "Terminar de enduir cajón sobre carpintería living",
   "ok": false,
   "orden": 0
  },
  "i_u403_hormigon_1": {
   "ent": "u403",
   "rubro": "hormigon",
   "texto": "Arreglar buña encuentro pared columnas, living",
   "ok": false,
   "orden": 1
  },
  "i_u403_hormigon_2": {
   "ent": "u403",
   "rubro": "hormigon",
   "texto": "Lijar losa living",
   "ok": false,
   "orden": 2
  },
  "i_u403_hormigon_3": {
   "ent": "u403",
   "rubro": "hormigon",
   "texto": "Lijar viga sobre carpintería habitación",
   "ok": false,
   "orden": 3
  },
  "i_u403_hormigon_4": {
   "ent": "u403",
   "rubro": "hormigon",
   "texto": "Lijar bajo losa balcón exterior",
   "ok": false,
   "orden": 4
  },
  "i_u403_hormigon_5": {
   "ent": "u403",
   "rubro": "hormigon",
   "texto": "Lijar parapeto exterior y aplicar hidrolaca",
   "ok": false,
   "orden": 5
  },
  "i_u403_pintura_6": {
   "ent": "u403",
   "rubro": "pintura",
   "texto": "Pendiente pintura final",
   "ok": false,
   "orden": 6
  },
  "i_u403_pintura_7": {
   "ent": "u403",
   "rubro": "pintura",
   "texto": "Emprolijar encuentro entre paredes y columnas",
   "ok": false,
   "orden": 7
  },
  "i_u403_pintura_8": {
   "ent": "u403",
   "rubro": "pintura",
   "texto": "Hacer simil hormigón en mocheta habitación",
   "ok": false,
   "orden": 8
  },
  "i_u403_pintura_9": {
   "ent": "u403",
   "rubro": "pintura",
   "texto": "Sellar y pintar buñas",
   "ok": false,
   "orden": 9
  },
  "i_u403_pintura_10": {
   "ent": "u403",
   "rubro": "pintura",
   "texto": "Hacer tarquini negro en exterior en banquina para aire acondicionado",
   "ok": false,
   "orden": 10
  },
  "i_u403_albanileria_11": {
   "ent": "u403",
   "rubro": "albanileria",
   "texto": "Arreglar encuentro entre puerta acceso y viga columna",
   "ok": false,
   "orden": 11
  },
  "i_u403_sanitarios_12": {
   "ent": "u403",
   "rubro": "sanitarios",
   "texto": "Revisar conexión lavarropas por pérdida",
   "ok": false,
   "orden": 12
  },
  "i_u403_sanitarios_13": {
   "ent": "u403",
   "rubro": "sanitarios",
   "texto": "Falta mariposa llave de paso toilette",
   "ok": false,
   "orden": 13
  },
  "i_u403_sanitarios_14": {
   "ent": "u403",
   "rubro": "sanitarios",
   "texto": "Falta embellecedores llave de paso",
   "ok": false,
   "orden": 14
  },
  "i_u403_zocalos_15": {
   "ent": "u403",
   "rubro": "zocalos",
   "texto": "Cambiar zócalo atrás lavarropas, húmedo por pérdida",
   "ok": false,
   "orden": 15
  },
  "i_u403_puertas_16": {
   "ent": "u403",
   "rubro": "puertas",
   "texto": "Falta balancín puerta baño",
   "ok": false,
   "orden": 16
  },
  "i_u403_puertas_17": {
   "ent": "u403",
   "rubro": "puertas",
   "texto": "Falta balancín puerta habitación",
   "ok": false,
   "orden": 17
  },
  "i_u403_puertas_18": {
   "ent": "u403",
   "rubro": "puertas",
   "texto": "Falta balancín y cerradura puerta toilette",
   "ok": false,
   "orden": 18
  },
  "i_u405_albanileria_0": {
   "ent": "u405",
   "rubro": "albanileria",
   "texto": "Pendiente revisión — dpto. en manos de Charly",
   "ok": false,
   "orden": 0
  },
  "i_u405_carpinterias_1": {
   "ent": "u405",
   "rubro": "carpinterias",
   "texto": "Pendiente revisión — dpto. en manos de Charly",
   "ok": false,
   "orden": 1
  },
  "i_u405_durlock_2": {
   "ent": "u405",
   "rubro": "durlock",
   "texto": "Pendiente revisión — dpto. en manos de Charly",
   "ok": false,
   "orden": 2
  },
  "i_u405_electricidad_3": {
   "ent": "u405",
   "rubro": "electricidad",
   "texto": "Pendiente revisión — dpto. en manos de Charly",
   "ok": false,
   "orden": 3
  },
  "i_u405_herreria_4": {
   "ent": "u405",
   "rubro": "herreria",
   "texto": "Pendiente revisión — dpto. en manos de Charly",
   "ok": false,
   "orden": 4
  },
  "i_u405_hormigon_5": {
   "ent": "u405",
   "rubro": "hormigon",
   "texto": "Pendiente revisión — dpto. en manos de Charly",
   "ok": false,
   "orden": 5
  },
  "i_u405_mesadas_6": {
   "ent": "u405",
   "rubro": "mesadas",
   "texto": "Pendiente revisión — dpto. en manos de Charly",
   "ok": false,
   "orden": 6
  },
  "i_u405_muebles_7": {
   "ent": "u405",
   "rubro": "muebles",
   "texto": "Pendiente revisión — dpto. en manos de Charly",
   "ok": false,
   "orden": 7
  },
  "i_u405_pintura_8": {
   "ent": "u405",
   "rubro": "pintura",
   "texto": "Pendiente revisión — dpto. en manos de Charly",
   "ok": false,
   "orden": 8
  },
  "i_u405_puertas_9": {
   "ent": "u405",
   "rubro": "puertas",
   "texto": "Pendiente revisión — dpto. en manos de Charly",
   "ok": false,
   "orden": 9
  },
  "i_u405_sanitarios_10": {
   "ent": "u405",
   "rubro": "sanitarios",
   "texto": "Pendiente revisión — dpto. en manos de Charly",
   "ok": false,
   "orden": 10
  },
  "i_u405_zocalos_11": {
   "ent": "u405",
   "rubro": "zocalos",
   "texto": "Pendiente revisión — dpto. en manos de Charly",
   "ok": false,
   "orden": 11
  },
  "i_u501_durlock_0": {
   "ent": "u501",
   "rubro": "durlock",
   "texto": "Cerrar hueco en cielorraso baño no suite",
   "ok": false,
   "orden": 0
  },
  "i_u501_pintura_1": {
   "ent": "u501",
   "rubro": "pintura",
   "texto": "Re pintar cielorraso baño no suite por arreglo",
   "ok": false,
   "orden": 1
  },
  "i_u501_pintura_2": {
   "ent": "u501",
   "rubro": "pintura",
   "texto": "Buña en carpintería esquina — pintar solo tramo Congreso (tramo Arribeños va blanco)",
   "ok": false,
   "orden": 2
  },
  "i_u501_pintura_3": {
   "ent": "u501",
   "rubro": "pintura",
   "texto": "Emprolijar buñas, se ve sellador",
   "ok": false,
   "orden": 3
  },
  "i_u501_muebles_4": {
   "ent": "u501",
   "rubro": "muebles",
   "texto": "Abrir pase lateral para descarga lavarropas",
   "ok": false,
   "orden": 4
  },
  "i_u501_marmoleria_5": {
   "ent": "u501",
   "rubro": "marmoleria",
   "texto": "Nos deben mesada baño no suite (se mandó a cortar para mampara)",
   "ok": false,
   "orden": 5
  },
  "i_u501_carpinterias_6": {
   "ent": "u501",
   "rubro": "carpinterias",
   "texto": "Falta terminar de sellar carpintería esquina",
   "ok": false,
   "orden": 6
  },
  "i_u501_sanitarios_7": {
   "ent": "u501",
   "rubro": "sanitarios",
   "texto": "Falta terminar de colocar bacha baño no suite + grifería + descarga",
   "ok": false,
   "orden": 7
  },
  "i_u501_puertas_8": {
   "ent": "u501",
   "rubro": "puertas",
   "texto": "Está rota traba media puerta baño no suite",
   "ok": false,
   "orden": 8
  },
  "i_u501_puertas_9": {
   "ent": "u501",
   "rubro": "puertas",
   "texto": "Puerta baño suite, tornillo salido — atornillar bien y lijar por marcas",
   "ok": false,
   "orden": 9
  },
  "i_u501_puertas_10": {
   "ent": "u501",
   "rubro": "puertas",
   "texto": "Puerta baño no suite, sacar y lijar por marcas",
   "ok": false,
   "orden": 10
  },
  "i_u501_puertas_11": {
   "ent": "u501",
   "rubro": "puertas",
   "texto": "Puerta hab. principal abollada, ver qué se hace",
   "ok": false,
   "orden": 11
  },
  "i_u501_hormigon_12": {
   "ent": "u501",
   "rubro": "hormigon",
   "texto": "Lijar parapeto exterior y aplicar hidrolaca",
   "ok": false,
   "orden": 12
  },
  "i_u501_hormigon_13": {
   "ent": "u501",
   "rubro": "hormigon",
   "texto": "Lijar aleros exteriores",
   "ok": false,
   "orden": 13
  },
  "i_u501_electricidad_14": {
   "ent": "u501",
   "rubro": "electricidad",
   "texto": "Colocar tapas y frentes de tomas",
   "ok": false,
   "orden": 14
  },
  "i_u501_electricidad_15": {
   "ent": "u501",
   "rubro": "electricidad",
   "texto": "Colocar horno",
   "ok": false,
   "orden": 15
  },
  "i_u501_electricidad_16": {
   "ent": "u501",
   "rubro": "electricidad",
   "texto": "Colocar anafe",
   "ok": false,
   "orden": 16
  },
  "i_u503_pintura_0": {
   "ent": "u503",
   "rubro": "pintura",
   "texto": "Pintar simil hormigón buña cajón sobre carpintería living",
   "ok": false,
   "orden": 0
  },
  "i_u503_pintura_1": {
   "ent": "u503",
   "rubro": "pintura",
   "texto": "Emprolijar encuentro entre puerta acceso y simil hormigón, tapar hueco en la parte inferior",
   "ok": false,
   "orden": 1
  },
  "i_u503_albanileria_2": {
   "ent": "u503",
   "rubro": "albanileria",
   "texto": "Tapar caño atrás heladera",
   "ok": false,
   "orden": 2
  },
  "i_u503_albanileria_3": {
   "ent": "u503",
   "rubro": "albanileria",
   "texto": "Cambiar pieza solado en habitación al lado carpintería, rota",
   "ok": false,
   "orden": 3
  },
  "i_u503_puertas_4": {
   "ent": "u503",
   "rubro": "puertas",
   "texto": "Puerta toilette, cepillar — se traba en parte inferior",
   "ok": false,
   "orden": 4
  },
  "i_u503_puertas_5": {
   "ent": "u503",
   "rubro": "puertas",
   "texto": "Puerta habitación, falta balancín y cerradura",
   "ok": false,
   "orden": 5
  },
  "i_u503_hormigon_6": {
   "ent": "u503",
   "rubro": "hormigon",
   "texto": "Lijar bajo losa balcón exterior",
   "ok": false,
   "orden": 6
  },
  "i_u503_hormigon_7": {
   "ent": "u503",
   "rubro": "hormigon",
   "texto": "Lijar parapeto exterior y aplicar hidrolaca",
   "ok": false,
   "orden": 7
  },
  "i_u503_muebles_8": {
   "ent": "u503",
   "rubro": "muebles",
   "texto": "Estante corto en vestidor",
   "ok": false,
   "orden": 8
  },
  "i_u503_electricidad_9": {
   "ent": "u503",
   "rubro": "electricidad",
   "texto": "Colocar tapas y frentes de tomas",
   "ok": false,
   "orden": 9
  },
  "i_u503_electricidad_10": {
   "ent": "u503",
   "rubro": "electricidad",
   "texto": "Colocar horno",
   "ok": false,
   "orden": 10
  },
  "i_u503_electricidad_11": {
   "ent": "u503",
   "rubro": "electricidad",
   "texto": "Colocar anafe",
   "ok": false,
   "orden": 11
  },
  "i_u504_hormigon_0": {
   "ent": "u504",
   "rubro": "hormigon",
   "texto": "Lijar viga sobre carpintería living — todavía con hojas",
   "ok": false,
   "orden": 0
  },
  "i_u504_hormigon_1": {
   "ent": "u504",
   "rubro": "hormigon",
   "texto": "Lijar viga sobre carpintería habitación",
   "ok": false,
   "orden": 1
  },
  "i_u504_hormigon_2": {
   "ent": "u504",
   "rubro": "hormigon",
   "texto": "Lijar parapeto exterior y aplicar hidrolaca",
   "ok": false,
   "orden": 2
  },
  "i_u504_hormigon_3": {
   "ent": "u504",
   "rubro": "hormigon",
   "texto": "Lijar bajo losa balcón exterior",
   "ok": false,
   "orden": 3
  },
  "i_u504_albanileria_4": {
   "ent": "u504",
   "rubro": "albanileria",
   "texto": "Tapar caño atrás lavarropas",
   "ok": false,
   "orden": 4
  },
  "i_u504_albanileria_5": {
   "ent": "u504",
   "rubro": "albanileria",
   "texto": "Abrir descarga y conexión lavarropas",
   "ok": false,
   "orden": 5
  },
  "i_u504_albanileria_6": {
   "ent": "u504",
   "rubro": "albanileria",
   "texto": "Emprolijar banquina bacha, está en falsa escuadra",
   "ok": false,
   "orden": 6
  },
  "i_u504_marmoleria_7": {
   "ent": "u504",
   "rubro": "marmoleria",
   "texto": "Falta zócalo en isla",
   "ok": false,
   "orden": 7
  },
  "i_u504_muebles_8": {
   "ent": "u504",
   "rubro": "muebles",
   "texto": "Falta ajuste lateral en alacena para tapar led",
   "ok": false,
   "orden": 8
  },
  "i_u504_puertas_9": {
   "ent": "u504",
   "rubro": "puertas",
   "texto": "Falta balancín y cerradura puerta toilette",
   "ok": false,
   "orden": 9
  },
  "i_u504_pintura_10": {
   "ent": "u504",
   "rubro": "pintura",
   "texto": "Buña chorreada en acceso",
   "ok": false,
   "orden": 10
  },
  "i_u504_detalles_11": {
   "ent": "u504",
   "rubro": "detalles",
   "texto": "SACAR BAÑERA 105 Y PIEZAS PISO SIMIL MADERA",
   "ok": false,
   "orden": 11
  },
  "i_u504_electricidad_12": {
   "ent": "u504",
   "rubro": "electricidad",
   "texto": "Colocar tapas y frentes de tomas",
   "ok": false,
   "orden": 12
  },
  "i_u504_electricidad_13": {
   "ent": "u504",
   "rubro": "electricidad",
   "texto": "Colocar horno",
   "ok": false,
   "orden": 13
  },
  "i_u504_electricidad_14": {
   "ent": "u504",
   "rubro": "electricidad",
   "texto": "Colocar anafe",
   "ok": false,
   "orden": 14
  },
  "i_u505_pintura_0": {
   "ent": "u505",
   "rubro": "pintura",
   "texto": "Falta pintura completa",
   "ok": false,
   "orden": 0
  },
  "i_u505_pintura_1": {
   "ent": "u505",
   "rubro": "pintura",
   "texto": "Pintar banquina aire acondicionado exterior",
   "ok": false,
   "orden": 1
  },
  "i_u505_pintura_2": {
   "ent": "u505",
   "rubro": "pintura",
   "texto": "Falta pintar caños conexión aire acondicionado",
   "ok": false,
   "orden": 2
  },
  "i_u505_zocalos_3": {
   "ent": "u505",
   "rubro": "zocalos",
   "texto": "Falta colocar todos los zócalos",
   "ok": false,
   "orden": 3
  },
  "i_u505_zocalos_4": {
   "ent": "u505",
   "rubro": "zocalos",
   "texto": "Ya se pueden colocar zócalos en toilette",
   "ok": false,
   "orden": 4
  },
  "i_u505_durlock_5": {
   "ent": "u505",
   "rubro": "durlock",
   "texto": "Arreglar cielorraso toilette, está marcado",
   "ok": false,
   "orden": 5
  },
  "i_u505_puertas_6": {
   "ent": "u505",
   "rubro": "puertas",
   "texto": "Cepillar puerta toilette — roza con el piso",
   "ok": false,
   "orden": 6
  },
  "i_u505_puertas_7": {
   "ent": "u505",
   "rubro": "puertas",
   "texto": "Puerta baño suite cepillarla, no cierra",
   "ok": false,
   "orden": 7
  },
  "i_u505_puertas_8": {
   "ent": "u505",
   "rubro": "puertas",
   "texto": "Puerta habitación no cierra, agujero para pestillo chico",
   "ok": false,
   "orden": 8
  },
  "i_u505_plomeria_9": {
   "ent": "u505",
   "rubro": "plomeria",
   "texto": "Controlar pérdida tapón conexión lavarropas",
   "ok": false,
   "orden": 9
  },
  "i_u505_albanileria_10": {
   "ent": "u505",
   "rubro": "albanileria",
   "texto": "Arreglar atrás lavarropas y heladera, desprolijo",
   "ok": false,
   "orden": 10
  },
  "i_u505_albanileria_11": {
   "ent": "u505",
   "rubro": "albanileria",
   "texto": "Falta banquina aire acondicionado habitación, ver qué se hace",
   "ok": false,
   "orden": 11
  },
  "i_u505_hormigon_12": {
   "ent": "u505",
   "rubro": "hormigon",
   "texto": "Manchas de óxido en alero exterior, lijar y emprolijar",
   "ok": false,
   "orden": 12
  },
  "i_u505_hormigon_13": {
   "ent": "u505",
   "rubro": "hormigon",
   "texto": "Falta sacar madera goterón exterior",
   "ok": false,
   "orden": 13
  },
  "i_u505_electricidad_14": {
   "ent": "u505",
   "rubro": "electricidad",
   "texto": "Colocar tapas y frentes de tomas",
   "ok": false,
   "orden": 14
  },
  "i_u505_electricidad_15": {
   "ent": "u505",
   "rubro": "electricidad",
   "texto": "Colocar horno",
   "ok": false,
   "orden": 15
  },
  "i_u505_electricidad_16": {
   "ent": "u505",
   "rubro": "electricidad",
   "texto": "Colocar anafe",
   "ok": false,
   "orden": 16
  },
  "i_u601_pintura_0": {
   "ent": "u601",
   "rubro": "pintura",
   "texto": "Enduir cajón sobre cocina, canto desprolijo",
   "ok": false,
   "orden": 0
  },
  "i_u601_pintura_1": {
   "ent": "u601",
   "rubro": "pintura",
   "texto": "Pintar bien las buñas",
   "ok": false,
   "orden": 1
  },
  "i_u601_pintura_2": {
   "ent": "u601",
   "rubro": "pintura",
   "texto": "Enduir descarga y conexión de lavarropas para que quede más prolijo",
   "ok": false,
   "orden": 2
  },
  "i_u601_pintura_3": {
   "ent": "u601",
   "rubro": "pintura",
   "texto": "Re pintar atrás lavarropas",
   "ok": false,
   "orden": 3
  },
  "i_u601_pintura_4": {
   "ent": "u601",
   "rubro": "pintura",
   "texto": "Falta pintar buña inferior de cajón cocina",
   "ok": false,
   "orden": 4
  },
  "i_u601_pintura_5": {
   "ent": "u601",
   "rubro": "pintura",
   "texto": "Falta pintura en puerta baño no suite",
   "ok": false,
   "orden": 5
  },
  "i_u601_carpinterias_6": {
   "ent": "u601",
   "rubro": "carpinterias",
   "texto": "Completar silicona carpintería esquina",
   "ok": false,
   "orden": 6
  },
  "i_u601_hormigon_7": {
   "ent": "u601",
   "rubro": "hormigon",
   "texto": "Lijar bajo losa balcón exterior",
   "ok": false,
   "orden": 7
  },
  "i_u601_hormigon_8": {
   "ent": "u601",
   "rubro": "hormigon",
   "texto": "Lijar rebarbas parapeto exterior y aplicar hidrolaca",
   "ok": false,
   "orden": 8
  },
  "i_u601_hormigon_9": {
   "ent": "u601",
   "rubro": "hormigon",
   "texto": "Columna habitación secundaria, encuentro buña desprolijo — picar y emprolijar",
   "ok": false,
   "orden": 9
  },
  "i_u601_hormigon_10": {
   "ent": "u601",
   "rubro": "hormigon",
   "texto": "Balcón secundario, lijar rebarbas hormigón exterior y aplicar hidrolaca",
   "ok": false,
   "orden": 10
  },
  "i_u601_albanileria_11": {
   "ent": "u601",
   "rubro": "albanileria",
   "texto": "Columna habitación secundaria, encuentro buña desprolijo — picar y emprolijar",
   "ok": false,
   "orden": 11
  },
  "i_u601_albanileria_12": {
   "ent": "u601",
   "rubro": "albanileria",
   "texto": "Baño no suite, completar con pastina lateral plato de ducha",
   "ok": false,
   "orden": 12
  },
  "i_u601_electricidad_13": {
   "ent": "u601",
   "rubro": "electricidad",
   "texto": "Colocar tapas y frentes de tomas",
   "ok": false,
   "orden": 13
  },
  "i_u601_electricidad_14": {
   "ent": "u601",
   "rubro": "electricidad",
   "texto": "Colocar horno",
   "ok": false,
   "orden": 14
  },
  "i_u601_electricidad_15": {
   "ent": "u601",
   "rubro": "electricidad",
   "texto": "Colocar anafe",
   "ok": false,
   "orden": 15
  },
  "i_u603_hormigon_0": {
   "ent": "u603",
   "rubro": "hormigon",
   "texto": "Lijar viga sobre puerta acceso",
   "ok": false,
   "orden": 0
  },
  "i_u603_hormigon_1": {
   "ent": "u603",
   "rubro": "hormigon",
   "texto": "Lijar marcas pluviales en hormigón exterior y emprolijar bordes",
   "ok": false,
   "orden": 1
  },
  "i_u603_hormigon_2": {
   "ent": "u603",
   "rubro": "hormigon",
   "texto": "Lijar parapeto exterior y aplicar hidrolaca",
   "ok": false,
   "orden": 2
  },
  "i_u603_albanileria_3": {
   "ent": "u603",
   "rubro": "albanileria",
   "texto": "Falta tapar caño atrás heladera",
   "ok": false,
   "orden": 3
  },
  "i_u603_albanileria_4": {
   "ent": "u603",
   "rubro": "albanileria",
   "texto": "Falta empastinar pieza atrás lavarropas",
   "ok": false,
   "orden": 4
  },
  "i_u603_albanileria_5": {
   "ent": "u603",
   "rubro": "albanileria",
   "texto": "Empastinar bien llave de paso baño en suite",
   "ok": false,
   "orden": 5
  },
  "i_u603_plomeria_6": {
   "ent": "u603",
   "rubro": "plomeria",
   "texto": "Pierde conexión lavarropas",
   "ok": false,
   "orden": 6
  },
  "i_u603_marmoleria_7": {
   "ent": "u603",
   "rubro": "marmoleria",
   "texto": "Falta zócalo lateral isla",
   "ok": false,
   "orden": 7
  },
  "i_u603_zocalos_8": {
   "ent": "u603",
   "rubro": "zocalos",
   "texto": "Sacar zócalo en columna habitación, no va",
   "ok": false,
   "orden": 8
  },
  "i_u603_pintura_9": {
   "ent": "u603",
   "rubro": "pintura",
   "texto": "Faltan pintar puertas",
   "ok": false,
   "orden": 9
  },
  "i_u603_pintura_10": {
   "ent": "u603",
   "rubro": "pintura",
   "texto": "Repasar manchas tarquini toilette",
   "ok": false,
   "orden": 10
  },
  "i_u603_pintura_11": {
   "ent": "u603",
   "rubro": "pintura",
   "texto": "Buña cajón sobre ventana living mal",
   "ok": false,
   "orden": 11
  },
  "i_u604_albanileria_0": {
   "ent": "u604",
   "rubro": "albanileria",
   "texto": "Emprolijar descarga y conexión lavarropas",
   "ok": false,
   "orden": 0
  },
  "i_u604_albanileria_1": {
   "ent": "u604",
   "rubro": "albanileria",
   "texto": "Emprolijar llave de paso baño suite, manchado con cemento",
   "ok": false,
   "orden": 1
  },
  "i_u604_albanileria_2": {
   "ent": "u604",
   "rubro": "albanileria",
   "texto": "Rellenar encuentro entre puerta y cielorraso baño en suite, hay un hueco",
   "ok": false,
   "orden": 2
  },
  "i_u604_albanileria_3": {
   "ent": "u604",
   "rubro": "albanileria",
   "texto": "Pieza en balcón rota",
   "ok": false,
   "orden": 3
  },
  "i_u604_carpinterias_4": {
   "ent": "u604",
   "rubro": "carpinterias",
   "texto": "No está sellada la carpintería de la habitación",
   "ok": false,
   "orden": 4
  },
  "i_u604_puertas_5": {
   "ent": "u604",
   "rubro": "puertas",
   "texto": "Cepillar puerta toilette en la parte superior, está caída hacia la izquierda",
   "ok": false,
   "orden": 5
  },
  "i_u604_detalles_6": {
   "ent": "u604",
   "rubro": "detalles",
   "texto": "Colocar rejilla ventilación toilette (solo colocación, está en el baño)",
   "ok": false,
   "orden": 6
  },
  "i_u604_detalles_7": {
   "ent": "u604",
   "rubro": "detalles",
   "texto": "Falta colocar rejilla baño suite (solo colocación, está en el baño)",
   "ok": false,
   "orden": 7
  },
  "i_u604_pintura_8": {
   "ent": "u604",
   "rubro": "pintura",
   "texto": "Pintar cielorraso toilette, muy desprolijo",
   "ok": false,
   "orden": 8
  },
  "i_u604_pintura_9": {
   "ent": "u604",
   "rubro": "pintura",
   "texto": "Segunda habitación mal pintada",
   "ok": false,
   "orden": 9
  },
  "i_u604_pintura_10": {
   "ent": "u604",
   "rubro": "pintura",
   "texto": "Falsa columna habitación, desprolijo encuentro entre columna y solado",
   "ok": false,
   "orden": 10
  },
  "i_u604_pintura_11": {
   "ent": "u604",
   "rubro": "pintura",
   "texto": "Re pintar cielorraso baño en suite por arreglo",
   "ok": false,
   "orden": 11
  },
  "i_u604_durlock_12": {
   "ent": "u604",
   "rubro": "durlock",
   "texto": "Cielorraso baño suite marcado por pérdida, arreglar",
   "ok": false,
   "orden": 12
  },
  "i_u604_hormigon_13": {
   "ent": "u604",
   "rubro": "hormigon",
   "texto": "Lijar bajo losa balcón exterior",
   "ok": false,
   "orden": 13
  },
  "i_u604_hormigon_14": {
   "ent": "u604",
   "rubro": "hormigon",
   "texto": "Lijar rebarbas mini parapeto exterior y aplicar hidrolaca",
   "ok": false,
   "orden": 14
  },
  "i_u604_electricidad_15": {
   "ent": "u604",
   "rubro": "electricidad",
   "texto": "Colocar tapas y frentes de tomas",
   "ok": false,
   "orden": 15
  },
  "i_u604_electricidad_16": {
   "ent": "u604",
   "rubro": "electricidad",
   "texto": "Colocar horno",
   "ok": false,
   "orden": 16
  },
  "i_u604_electricidad_17": {
   "ent": "u604",
   "rubro": "electricidad",
   "texto": "Colocar anafe",
   "ok": false,
   "orden": 17
  },
  "i_u605_albanileria_0": {
   "ent": "u605",
   "rubro": "albanileria",
   "texto": "Completar con pastina pieza atrás heladera",
   "ok": false,
   "orden": 0
  },
  "i_u605_albanileria_1": {
   "ent": "u605",
   "rubro": "albanileria",
   "texto": "Cambiar pieza en habitación porque está rota",
   "ok": false,
   "orden": 1
  },
  "i_u605_pintura_2": {
   "ent": "u605",
   "rubro": "pintura",
   "texto": "Retocar tarquini toilette, está manchado",
   "ok": false,
   "orden": 2
  },
  "i_u605_pintura_3": {
   "ent": "u605",
   "rubro": "pintura",
   "texto": "Completar con silicona sobre puerta baño suite, hay un hueco",
   "ok": false,
   "orden": 3
  },
  "i_u605_pintura_4": {
   "ent": "u605",
   "rubro": "pintura",
   "texto": "Pintura exterior, emprolijar encuentro entre solado y tarquini",
   "ok": false,
   "orden": 4
  },
  "i_u605_hormigon_5": {
   "ent": "u605",
   "rubro": "hormigon",
   "texto": "Hormigón exterior manchado y con pérdidas, lijar y emprolijar",
   "ok": false,
   "orden": 5
  },
  "i_u605_hormigon_6": {
   "ent": "u605",
   "rubro": "hormigon",
   "texto": "Lijar rebarbas mini parapeto exterior y aplicar hidrolaca",
   "ok": false,
   "orden": 6
  },
  "i_u605_muebles_7": {
   "ent": "u605",
   "rubro": "muebles",
   "texto": "Cambiar fondo de fibro en alacena abierta portamicro",
   "ok": false,
   "orden": 7
  },
  "i_u605_muebles_8": {
   "ent": "u605",
   "rubro": "muebles",
   "texto": "Sección de cornisa 740x300",
   "ok": false,
   "orden": 8
  },
  "i_u605_electricidad_9": {
   "ent": "u605",
   "rubro": "electricidad",
   "texto": "Colocar tapas y frentes de tomas",
   "ok": false,
   "orden": 9
  },
  "i_u605_electricidad_10": {
   "ent": "u605",
   "rubro": "electricidad",
   "texto": "Colocar horno",
   "ok": false,
   "orden": 10
  },
  "i_u605_electricidad_11": {
   "ent": "u605",
   "rubro": "electricidad",
   "texto": "Colocar anafe",
   "ok": false,
   "orden": 11
  },
  "i_u701_carpinterias_0": {
   "ent": "u701",
   "rubro": "carpinterias",
   "texto": "Falta terminar de sellar carpintería esquina",
   "ok": false,
   "orden": 0
  },
  "i_u701_pintura_1": {
   "ent": "u701",
   "rubro": "pintura",
   "texto": "Limpiar lateral heladera, quedó manchado",
   "ok": false,
   "orden": 1
  },
  "i_u701_pintura_2": {
   "ent": "u701",
   "rubro": "pintura",
   "texto": "Segunda habitación buña choreada y marcada con silicona",
   "ok": false,
   "orden": 2
  },
  "i_u701_pintura_3": {
   "ent": "u701",
   "rubro": "pintura",
   "texto": "Ver encuentro entre carpintería y pared",
   "ok": false,
   "orden": 3
  },
  "i_u701_pintura_4": {
   "ent": "u701",
   "rubro": "pintura",
   "texto": "Pintar caño descarga aire acondicionado balcón secundario",
   "ok": false,
   "orden": 4
  },
  "i_u701_sanitarios_5": {
   "ent": "u701",
   "rubro": "sanitarios",
   "texto": "Falta mariposa llave de paso baño no suite (x1)",
   "ok": false,
   "orden": 5
  },
  "i_u701_albanileria_6": {
   "ent": "u701",
   "rubro": "albanileria",
   "texto": "Falta empastinar al lado plato de ducha",
   "ok": false,
   "orden": 6
  },
  "i_u701_albanileria_7": {
   "ent": "u701",
   "rubro": "albanileria",
   "texto": "Hueco debajo de marcos de puertas, completar con pastina",
   "ok": false,
   "orden": 7
  },
  "i_u701_albanileria_8": {
   "ent": "u701",
   "rubro": "albanileria",
   "texto": "Arreglar toma agua y descarga lavarropas",
   "ok": false,
   "orden": 8
  },
  "i_u701_hormigon_9": {
   "ent": "u701",
   "rubro": "hormigon",
   "texto": "Lijar bajo losa balcón con manchas de óxido",
   "ok": false,
   "orden": 9
  },
  "i_u701_hormigon_10": {
   "ent": "u701",
   "rubro": "hormigon",
   "texto": "Lijar rebarbas parapeto y aplicar hidrolaca",
   "ok": false,
   "orden": 10
  },
  "i_u701_hormigon_11": {
   "ent": "u701",
   "rubro": "hormigon",
   "texto": "Lijar alero segundo balcón",
   "ok": false,
   "orden": 11
  },
  "i_u701_hormigon_12": {
   "ent": "u701",
   "rubro": "hormigon",
   "texto": "Lijar mini parapeto segundo balcón",
   "ok": false,
   "orden": 12
  },
  "i_u701_muebles_13": {
   "ent": "u701",
   "rubro": "muebles",
   "texto": "Ajuste cielorraso sobre heladera mal cepillado (chico)",
   "ok": false,
   "orden": 13
  },
  "i_u701_electricidad_14": {
   "ent": "u701",
   "rubro": "electricidad",
   "texto": "Colocar tapas y frentes de tomas",
   "ok": false,
   "orden": 14
  },
  "i_u701_electricidad_15": {
   "ent": "u701",
   "rubro": "electricidad",
   "texto": "Colocar horno",
   "ok": false,
   "orden": 15
  },
  "i_u701_electricidad_16": {
   "ent": "u701",
   "rubro": "electricidad",
   "texto": "Colocar anafe",
   "ok": false,
   "orden": 16
  },
  "i_u703_pintura_0": {
   "ent": "u703",
   "rubro": "pintura",
   "texto": "Lijar buña sobre puerta acceso — se manchó con pintura de puerta",
   "ok": false,
   "orden": 0
  },
  "i_u703_albanileria_1": {
   "ent": "u703",
   "rubro": "albanileria",
   "texto": "Solado roto atrás puerta acceso, completar con pastina",
   "ok": false,
   "orden": 1
  },
  "i_u703_albanileria_2": {
   "ent": "u703",
   "rubro": "albanileria",
   "texto": "Completar con pastina huecos que quedaron en solado abajo de marcos de puertas",
   "ok": false,
   "orden": 2
  },
  "i_u703_marmoleria_3": {
   "ent": "u703",
   "rubro": "marmoleria",
   "texto": "Falta zócalo sobre isla mesada",
   "ok": false,
   "orden": 3
  },
  "i_u703_hormigon_4": {
   "ent": "u703",
   "rubro": "hormigon",
   "texto": "Lijar alero balcón exterior",
   "ok": false,
   "orden": 4
  },
  "i_u703_hormigon_5": {
   "ent": "u703",
   "rubro": "hormigon",
   "texto": "Arreglar losa balcón que se marcó por pérdida pluvial",
   "ok": false,
   "orden": 5
  },
  "i_u703_hormigon_6": {
   "ent": "u703",
   "rubro": "hormigon",
   "texto": "Lijar rebarbas parapeto exterior y aplicar hidrolaca",
   "ok": false,
   "orden": 6
  },
  "i_u703_detalles_7": {
   "ent": "u703",
   "rubro": "detalles",
   "texto": "Colocar rejilla ventilación en toilette",
   "ok": false,
   "orden": 7
  },
  "i_u703_puertas_8": {
   "ent": "u703",
   "rubro": "puertas",
   "texto": "Agrandar pestillo puerta habitación para que cierre bien",
   "ok": false,
   "orden": 8
  },
  "i_u703_electricidad_9": {
   "ent": "u703",
   "rubro": "electricidad",
   "texto": "Colocar tapas y frentes de tomas",
   "ok": false,
   "orden": 9
  },
  "i_u703_electricidad_10": {
   "ent": "u703",
   "rubro": "electricidad",
   "texto": "Colocar horno",
   "ok": false,
   "orden": 10
  },
  "i_u703_electricidad_11": {
   "ent": "u703",
   "rubro": "electricidad",
   "texto": "Colocar anafe",
   "ok": false,
   "orden": 11
  },
  "i_u704_albanileria_0": {
   "ent": "u704",
   "rubro": "albanileria",
   "texto": "Banquina atrás lavarropas desprolija",
   "ok": false,
   "orden": 0
  },
  "i_u704_plomeria_1": {
   "ent": "u704",
   "rubro": "plomeria",
   "texto": "Verificar si pierde conexión a lavarropas",
   "ok": false,
   "orden": 1
  },
  "i_u704_pintura_2": {
   "ent": "u704",
   "rubro": "pintura",
   "texto": "Arreglar conexión a lavarropas por pérdida",
   "ok": false,
   "orden": 2
  },
  "i_u704_pintura_3": {
   "ent": "u704",
   "rubro": "pintura",
   "texto": "Arreglar buña sobre cajón acceso, quedó manchado con silicona",
   "ok": false,
   "orden": 3
  },
  "i_u704_sanitarios_4": {
   "ent": "u704",
   "rubro": "sanitarios",
   "texto": "Faltan embellecedores llave de paso cocina",
   "ok": false,
   "orden": 4
  },
  "i_u704_hormigon_5": {
   "ent": "u704",
   "rubro": "hormigon",
   "texto": "Lijar bien viga sobre ventana living",
   "ok": false,
   "orden": 5
  },
  "i_u704_hormigon_6": {
   "ent": "u704",
   "rubro": "hormigon",
   "texto": "Lijar rebarbas parapeto balcón",
   "ok": false,
   "orden": 6
  },
  "i_u704_hormigon_7": {
   "ent": "u704",
   "rubro": "hormigon",
   "texto": "Aplicar hidrolaca en parapetos exteriores",
   "ok": false,
   "orden": 7
  },
  "i_u704_hormigon_8": {
   "ent": "u704",
   "rubro": "hormigon",
   "texto": "Lijar marcas en alero balcón sobre carpintería, emprolijar frente alero",
   "ok": false,
   "orden": 8
  },
  "i_u704_puertas_9": {
   "ent": "u704",
   "rubro": "puertas",
   "texto": "No cierra puerta del toilette",
   "ok": false,
   "orden": 9
  },
  "i_u704_muebles_10": {
   "ent": "u704",
   "rubro": "muebles",
   "texto": "Lateral de alacena",
   "ok": false,
   "orden": 10
  },
  "i_u704_muebles_11": {
   "ent": "u704",
   "rubro": "muebles",
   "texto": "Tira de cierre lateral en cornisa (para que no se vea el lateral del led)",
   "ok": false,
   "orden": 11
  },
  "i_u704_electricidad_12": {
   "ent": "u704",
   "rubro": "electricidad",
   "texto": "Colocar tapas y frentes de tomas",
   "ok": false,
   "orden": 12
  },
  "i_u704_electricidad_13": {
   "ent": "u704",
   "rubro": "electricidad",
   "texto": "Colocar horno",
   "ok": false,
   "orden": 13
  },
  "i_u704_electricidad_14": {
   "ent": "u704",
   "rubro": "electricidad",
   "texto": "Colocar anafe",
   "ok": false,
   "orden": 14
  },
  "i_u705_plomeria_0": {
   "ent": "u705",
   "rubro": "plomeria",
   "texto": "Pérdida en cocina proveniente del 805, verificar qué es",
   "ok": false,
   "orden": 0
  },
  "i_u705_puertas_1": {
   "ent": "u705",
   "rubro": "puertas",
   "texto": "Borde inferior derecho levantado — toilette",
   "ok": false,
   "orden": 1
  },
  "i_u705_pintura_2": {
   "ent": "u705",
   "rubro": "pintura",
   "texto": "Retocar tarquini toilette",
   "ok": false,
   "orden": 2
  },
  "i_u705_pintura_3": {
   "ent": "u705",
   "rubro": "pintura",
   "texto": "Falta 3ra (última) mano de pintura",
   "ok": false,
   "orden": 3
  },
  "i_u705_hormigon_4": {
   "ent": "u705",
   "rubro": "hormigon",
   "texto": "Reparar hormigón visto columna dormitorio",
   "ok": false,
   "orden": 4
  },
  "i_u705_hormigon_5": {
   "ent": "u705",
   "rubro": "hormigon",
   "texto": "Hormigón visto alero exterior desprolijo",
   "ok": false,
   "orden": 5
  },
  "i_u705_hormigon_6": {
   "ent": "u705",
   "rubro": "hormigon",
   "texto": "Lijar pérdidas losa balcón",
   "ok": false,
   "orden": 6
  },
  "i_u705_hormigon_7": {
   "ent": "u705",
   "rubro": "hormigon",
   "texto": "Emprolijar parapeto",
   "ok": false,
   "orden": 7
  },
  "i_u705_zocalos_8": {
   "ent": "u705",
   "rubro": "zocalos",
   "texto": "Revisar detalles, algunos sueltos",
   "ok": false,
   "orden": 8
  },
  "i_u705_albanileria_9": {
   "ent": "u705",
   "rubro": "albanileria",
   "texto": "Verificar pérdidas en losa balcón",
   "ok": false,
   "orden": 9
  },
  "i_u705_albanileria_10": {
   "ent": "u705",
   "rubro": "albanileria",
   "texto": "Terminar de revocar pared medianera piso 8 para que no siga entrando agua",
   "ok": false,
   "orden": 10
  },
  "i_u705_tarquini_11": {
   "ent": "u705",
   "rubro": "tarquini",
   "texto": "Limpiar tarquini exterior y emprolijar encuentro entre piso y pared",
   "ok": false,
   "orden": 11
  },
  "i_u705_electricidad_12": {
   "ent": "u705",
   "rubro": "electricidad",
   "texto": "Colocar tapas y frentes de tomas",
   "ok": false,
   "orden": 12
  },
  "i_u705_electricidad_13": {
   "ent": "u705",
   "rubro": "electricidad",
   "texto": "Colocar horno",
   "ok": false,
   "orden": 13
  },
  "i_u705_electricidad_14": {
   "ent": "u705",
   "rubro": "electricidad",
   "texto": "Colocar anafe",
   "ok": false,
   "orden": 14
  },
  "i_u705_muebles_15": {
   "ent": "u705",
   "rubro": "muebles",
   "texto": "Falta calado toma microondas",
   "ok": false,
   "orden": 15
  },
  "i_u801_detalles_0": {
   "ent": "u801",
   "rubro": "detalles",
   "texto": "Hay tachos de pintura/tarquini, sacarlos",
   "ok": false,
   "orden": 0
  },
  "i_u801_carpinterias_1": {
   "ent": "u801",
   "rubro": "carpinterias",
   "texto": "Falta sellar carpintería esquina",
   "ok": false,
   "orden": 1
  },
  "i_u801_sanitarios_2": {
   "ent": "u801",
   "rubro": "sanitarios",
   "texto": "Falta colocar embellecedores llave de paso cocina",
   "ok": false,
   "orden": 2
  },
  "i_u801_muebles_3": {
   "ent": "u801",
   "rubro": "muebles",
   "texto": "Alinear puertas alacena",
   "ok": false,
   "orden": 3
  },
  "i_u801_muebles_4": {
   "ent": "u801",
   "rubro": "muebles",
   "texto": "Falta ajuste superior sobre heladera",
   "ok": false,
   "orden": 4
  },
  "i_u801_muebles_5": {
   "ent": "u801",
   "rubro": "muebles",
   "texto": "Lateral frente isla suelto",
   "ok": false,
   "orden": 5
  },
  "i_u801_pintura_6": {
   "ent": "u801",
   "rubro": "pintura",
   "texto": "Hab. secundaria, columna simil hormigón con blanco",
   "ok": false,
   "orden": 6
  },
  "i_u801_pintura_7": {
   "ent": "u801",
   "rubro": "pintura",
   "texto": "Pintar bien buñas, se ve el sellador",
   "ok": false,
   "orden": 7
  },
  "i_u801_albanileria_8": {
   "ent": "u801",
   "rubro": "albanileria",
   "texto": "Arreglar buña encuentro entre columna atrás puerta y mampostería en habitación secundaria",
   "ok": false,
   "orden": 8
  },
  "i_u801_albanileria_9": {
   "ent": "u801",
   "rubro": "albanileria",
   "texto": "Arreglar caño que se ve en encuentro pared y losa, respaldo cama, hab. principal",
   "ok": false,
   "orden": 9
  },
  "i_u801_hormigon_10": {
   "ent": "u801",
   "rubro": "hormigon",
   "texto": "Lijar bien viga sobre carpintería hab. principal",
   "ok": false,
   "orden": 10
  },
  "i_u801_hormigon_11": {
   "ent": "u801",
   "rubro": "hormigon",
   "texto": "Lijar bajo losa balcón exterior",
   "ok": false,
   "orden": 11
  },
  "i_u801_hormigon_12": {
   "ent": "u801",
   "rubro": "hormigon",
   "texto": "Lijar parapeto exterior y aplicar hidrolaca",
   "ok": false,
   "orden": 12
  },
  "i_u801_electricidad_13": {
   "ent": "u801",
   "rubro": "electricidad",
   "texto": "Colocar tapas y frentes de tomas",
   "ok": false,
   "orden": 13
  },
  "i_u801_electricidad_14": {
   "ent": "u801",
   "rubro": "electricidad",
   "texto": "Colocar horno",
   "ok": false,
   "orden": 14
  },
  "i_u801_electricidad_15": {
   "ent": "u801",
   "rubro": "electricidad",
   "texto": "Colocar anafe",
   "ok": false,
   "orden": 15
  },
  "i_u803_muebles_0": {
   "ent": "u803",
   "rubro": "muebles",
   "texto": "Falta pata lateral cocina, se sacó porque estaba corta",
   "ok": false,
   "orden": 0
  },
  "i_u803_detalles_1": {
   "ent": "u803",
   "rubro": "detalles",
   "texto": "Colocar ménsula en pata lateral cocina para colocar mesada",
   "ok": false,
   "orden": 1
  },
  "i_u803_marmoleria_2": {
   "ent": "u803",
   "rubro": "marmoleria",
   "texto": "Colocar mesada bacha cocina y zócalos",
   "ok": false,
   "orden": 2
  },
  "i_u803_sanitarios_3": {
   "ent": "u803",
   "rubro": "sanitarios",
   "texto": "Conectar bacha cocina, descarga y conexiones",
   "ok": false,
   "orden": 3
  },
  "i_u803_sanitarios_4": {
   "ent": "u803",
   "rubro": "sanitarios",
   "texto": "Colocar embellecedores llaves de paso cocina",
   "ok": false,
   "orden": 4
  },
  "i_u803_albanileria_5": {
   "ent": "u803",
   "rubro": "albanileria",
   "texto": "Tapar caño atrás de heladera",
   "ok": false,
   "orden": 5
  },
  "i_u803_puertas_6": {
   "ent": "u803",
   "rubro": "puertas",
   "texto": "Puerta toilette picada en borde inferior",
   "ok": false,
   "orden": 6
  },
  "i_u803_puertas_7": {
   "ent": "u803",
   "rubro": "puertas",
   "texto": "Traba puerta chica baño habitación no anda",
   "ok": false,
   "orden": 7
  },
  "i_u803_puertas_8": {
   "ent": "u803",
   "rubro": "puertas",
   "texto": "Puerta habitación mal pintada en parte de abajo",
   "ok": false,
   "orden": 8
  },
  "i_u803_puertas_9": {
   "ent": "u803",
   "rubro": "puertas",
   "texto": "Puerta habitación no cierra, no entra el pestillo (la cerradura anda)",
   "ok": false,
   "orden": 9
  },
  "i_u803_pintura_10": {
   "ent": "u803",
   "rubro": "pintura",
   "texto": "Simil hormigón cajón living desprolijo",
   "ok": false,
   "orden": 10
  },
  "i_u803_pintura_11": {
   "ent": "u803",
   "rubro": "pintura",
   "texto": "Buña encuentro entre columna y pared hab. está desprolija",
   "ok": false,
   "orden": 11
  },
  "i_u803_pintura_12": {
   "ent": "u803",
   "rubro": "pintura",
   "texto": "Simil hormigón en viga sobre carpintería hab. desprolijo, lijar",
   "ok": false,
   "orden": 12
  },
  "i_u803_electricidad_13": {
   "ent": "u803",
   "rubro": "electricidad",
   "texto": "Colocar tapas y frentes de tomas",
   "ok": false,
   "orden": 13
  },
  "i_u803_electricidad_14": {
   "ent": "u803",
   "rubro": "electricidad",
   "texto": "Colocar horno",
   "ok": false,
   "orden": 14
  },
  "i_u803_electricidad_15": {
   "ent": "u803",
   "rubro": "electricidad",
   "texto": "Colocar anafe",
   "ok": false,
   "orden": 15
  },
  "i_u804_sanitarios_0": {
   "ent": "u804",
   "rubro": "sanitarios",
   "texto": "Verificar pérdida conexión lavarropas",
   "ok": false,
   "orden": 0
  },
  "i_u804_albanileria_1": {
   "ent": "u804",
   "rubro": "albanileria",
   "texto": "Arreglar pared lateral lavarropas por pérdida",
   "ok": false,
   "orden": 1
  },
  "i_u804_albanileria_2": {
   "ent": "u804",
   "rubro": "albanileria",
   "texto": "Arreglar y tapar caño atrás lavarropas",
   "ok": false,
   "orden": 2
  },
  "i_u804_pintura_3": {
   "ent": "u804",
   "rubro": "pintura",
   "texto": "Re pintar pared lateral lavarropas por pérdida",
   "ok": false,
   "orden": 3
  },
  "i_u804_pintura_4": {
   "ent": "u804",
   "rubro": "pintura",
   "texto": "Buñas de encuentro entre paredes y columnas desprolijos",
   "ok": false,
   "orden": 4
  },
  "i_u804_pintura_5": {
   "ent": "u804",
   "rubro": "pintura",
   "texto": "Buñas cielorraso toilette mal pintado",
   "ok": false,
   "orden": 5
  },
  "i_u804_pintura_6": {
   "ent": "u804",
   "rubro": "pintura",
   "texto": "Puerta habitación marcada",
   "ok": false,
   "orden": 6
  },
  "i_u804_carpinterias_7": {
   "ent": "u804",
   "rubro": "carpinterias",
   "texto": "Falta colocar vidrio en baranda (está en el departamento)",
   "ok": false,
   "orden": 7
  },
  "i_u804_detalles_8": {
   "ent": "u804",
   "rubro": "detalles",
   "texto": "Poner sellador entre mesada y pared, quedó desprolijo encuentro con tarquini",
   "ok": false,
   "orden": 8
  },
  "i_u804_detalles_9": {
   "ent": "u804",
   "rubro": "detalles",
   "texto": "Colocar rejilla ventilación en baño suite (está en el departamento)",
   "ok": false,
   "orden": 9
  },
  "i_u804_hormigon_10": {
   "ent": "u804",
   "rubro": "hormigon",
   "texto": "Emprolijar parapeto exterior y aplicar hidrolaca",
   "ok": false,
   "orden": 10
  },
  "i_u804_hormigon_11": {
   "ent": "u804",
   "rubro": "hormigon",
   "texto": "Lijar bajo losa balcón exterior",
   "ok": false,
   "orden": 11
  },
  "i_u804_muebles_12": {
   "ent": "u804",
   "rubro": "muebles",
   "texto": "Nivelar cajón superior sobre alacenas, colocar tornillo desde lateral con tapa tornillo",
   "ok": false,
   "orden": 12
  },
  "i_u804_muebles_13": {
   "ent": "u804",
   "rubro": "muebles",
   "texto": "Nivelar puerta de alacena",
   "ok": false,
   "orden": 13
  },
  "i_u804_muebles_14": {
   "ent": "u804",
   "rubro": "muebles",
   "texto": "Tira de cierre lateral en cornisa (para que no se vea el lateral del led)",
   "ok": false,
   "orden": 14
  },
  "i_u804_electricidad_15": {
   "ent": "u804",
   "rubro": "electricidad",
   "texto": "Colocar horno",
   "ok": false,
   "orden": 15
  },
  "i_u804_electricidad_16": {
   "ent": "u804",
   "rubro": "electricidad",
   "texto": "Colocar anafe",
   "ok": false,
   "orden": 16
  },
  "i_u805_zocalos_0": {
   "ent": "u805",
   "rubro": "zocalos",
   "texto": "Colocar zócalo atrás lavarropas y heladera",
   "ok": false,
   "orden": 0
  },
  "i_u805_zocalos_1": {
   "ent": "u805",
   "rubro": "zocalos",
   "texto": "Falta pedazo zócalo en pared living entre columna y pared",
   "ok": false,
   "orden": 1
  },
  "i_u805_pintura_2": {
   "ent": "u805",
   "rubro": "pintura",
   "texto": "Encuentro entre buñas y columnas desprolijo",
   "ok": false,
   "orden": 2
  },
  "i_u805_pintura_3": {
   "ent": "u805",
   "rubro": "pintura",
   "texto": "Marcaron pared habitación con manija puerta",
   "ok": false,
   "orden": 3
  },
  "i_u805_albanileria_4": {
   "ent": "u805",
   "rubro": "albanileria",
   "texto": "Completar hueco entre cielorraso y cerámicas baño en suite",
   "ok": false,
   "orden": 4
  },
  "i_u805_albanileria_5": {
   "ent": "u805",
   "rubro": "albanileria",
   "texto": "Encuadrar y cerrar pared medianera, todavía están los ladrillos a la vista",
   "ok": false,
   "orden": 5
  },
  "i_u805_albanileria_6": {
   "ent": "u805",
   "rubro": "albanileria",
   "texto": "Arreglar encuentro entre solado y columna, desprolijo",
   "ok": false,
   "orden": 6
  },
  "i_u805_puertas_7": {
   "ent": "u805",
   "rubro": "puertas",
   "texto": "Traba puertita baño en suite trabada",
   "ok": false,
   "orden": 7
  },
  "i_u805_hormigon_8": {
   "ent": "u805",
   "rubro": "hormigon",
   "texto": "Lijar alero exterior",
   "ok": false,
   "orden": 8
  },
  "i_u805_hormigon_9": {
   "ent": "u805",
   "rubro": "hormigon",
   "texto": "Lijar parapeto exterior y aplicar hidrolaca",
   "ok": false,
   "orden": 9
  },
  "i_u805_carpinterias_10": {
   "ent": "u805",
   "rubro": "carpinterias",
   "texto": "Falta colocar un vidrio de la baranda",
   "ok": false,
   "orden": 10
  },
  "i_u805_sanitarios_11": {
   "ent": "u805",
   "rubro": "sanitarios",
   "texto": "Rejilla balcón, cambiarla y poner una más linda",
   "ok": false,
   "orden": 11
  },
  "i_u805_electricidad_12": {
   "ent": "u805",
   "rubro": "electricidad",
   "texto": "Colocar horno",
   "ok": false,
   "orden": 12
  },
  "i_u805_electricidad_13": {
   "ent": "u805",
   "rubro": "electricidad",
   "texto": "Colocar anafe",
   "ok": false,
   "orden": 13
  },
  "i_u901_pintura_0": {
   "ent": "u901",
   "rubro": "pintura",
   "texto": "Buña cajón sobre cocina no está pintada",
   "ok": false,
   "orden": 0
  },
  "i_u901_pintura_1": {
   "ent": "u901",
   "rubro": "pintura",
   "texto": "Encuentro entre buñas y losa y columnas desprolijo",
   "ok": false,
   "orden": 1
  },
  "i_u901_hormigon_2": {
   "ent": "u901",
   "rubro": "hormigon",
   "texto": "Lijar alero exterior",
   "ok": false,
   "orden": 2
  },
  "i_u901_hormigon_3": {
   "ent": "u901",
   "rubro": "hormigon",
   "texto": "Lijar parapeto exterior y aplicar hidrolaca",
   "ok": false,
   "orden": 3
  },
  "i_u901_carpinterias_4": {
   "ent": "u901",
   "rubro": "carpinterias",
   "texto": "Falta sellar carpintería esquina",
   "ok": false,
   "orden": 4
  },
  "i_u901_puertas_5": {
   "ent": "u901",
   "rubro": "puertas",
   "texto": "No están bien colocados los embellecedores de las bocallaves",
   "ok": false,
   "orden": 5
  },
  "i_u901_puertas_6": {
   "ent": "u901",
   "rubro": "puertas",
   "texto": "No están bien colocados los embellecedores de las manijas",
   "ok": false,
   "orden": 6
  },
  "i_u901_sanitarios_7": {
   "ent": "u901",
   "rubro": "sanitarios",
   "texto": "Falta colocar embellecedores llave de paso en baños",
   "ok": false,
   "orden": 7
  },
  "i_u901_muebles_8": {
   "ent": "u901",
   "rubro": "muebles",
   "texto": "Ver mueble si se corta",
   "ok": false,
   "orden": 8
  },
  "i_u901_zocalos_9": {
   "ent": "u901",
   "rubro": "zocalos",
   "texto": "Detrás heladera y lavarropas",
   "ok": false,
   "orden": 9
  },
  "i_u903_carpinterias_0": {
   "ent": "u903",
   "rubro": "carpinterias",
   "texto": "Falta sellar un paño del living",
   "ok": false,
   "orden": 0
  },
  "i_u903_albanileria_1": {
   "ent": "u903",
   "rubro": "albanileria",
   "texto": "Tapar caños atrás heladera",
   "ok": false,
   "orden": 1
  },
  "i_u903_albanileria_2": {
   "ent": "u903",
   "rubro": "albanileria",
   "texto": "Empastinar encuentro entre piso y columna habitación",
   "ok": false,
   "orden": 2
  },
  "i_u903_sanitarios_3": {
   "ent": "u903",
   "rubro": "sanitarios",
   "texto": "Falta mariposa llave de paso cocina",
   "ok": false,
   "orden": 3
  },
  "i_u903_sanitarios_4": {
   "ent": "u903",
   "rubro": "sanitarios",
   "texto": "Falta embellecedores llave de paso cocina",
   "ok": false,
   "orden": 4
  },
  "i_u903_sanitarios_5": {
   "ent": "u903",
   "rubro": "sanitarios",
   "texto": "Falta colocar mariposa llave de paso toilette",
   "ok": false,
   "orden": 5
  },
  "i_u903_pintura_6": {
   "ent": "u903",
   "rubro": "pintura",
   "texto": "Emprolijar encuentro entre columna simil hormigón y solado living",
   "ok": false,
   "orden": 6
  },
  "i_u903_pintura_7": {
   "ent": "u903",
   "rubro": "pintura",
   "texto": "Puerta toilette pintada desprolija",
   "ok": false,
   "orden": 7
  },
  "i_u903_pintura_8": {
   "ent": "u903",
   "rubro": "pintura",
   "texto": "Emprolijar buñas entre paredes y columnas, muy desprolijas",
   "ok": false,
   "orden": 8
  },
  "i_u903_pintura_9": {
   "ent": "u903",
   "rubro": "pintura",
   "texto": "Buña cielorraso hab. pintada de dos colores distintos",
   "ok": false,
   "orden": 9
  },
  "i_u903_pintura_10": {
   "ent": "u903",
   "rubro": "pintura",
   "texto": "Buña encuentro entre cajón y viga sobre carpintería living no está pintada",
   "ok": false,
   "orden": 10
  },
  "i_u903_hormigon_11": {
   "ent": "u903",
   "rubro": "hormigon",
   "texto": "Lijar parapeto exterior y aplicar hidrolaca",
   "ok": false,
   "orden": 11
  },
  "i_u903_hormigon_12": {
   "ent": "u903",
   "rubro": "hormigon",
   "texto": "Lijar bajo losa balcón exterior",
   "ok": false,
   "orden": 12
  },
  "i_u903_puertas_13": {
   "ent": "u903",
   "rubro": "puertas",
   "texto": "Puerta habitación no cierra, cepillar y volver a pintar",
   "ok": false,
   "orden": 13
  },
  "i_u903_puertas_14": {
   "ent": "u903",
   "rubro": "puertas",
   "texto": "No están bien colocados los embellecedores de las bocallaves",
   "ok": false,
   "orden": 14
  },
  "i_u904_albanileria_0": {
   "ent": "u904",
   "rubro": "albanileria",
   "texto": "Tapar caño atrás lavarropas",
   "ok": false,
   "orden": 0
  },
  "i_u904_albanileria_1": {
   "ent": "u904",
   "rubro": "albanileria",
   "texto": "Descubrir conexión a lavarropas",
   "ok": false,
   "orden": 1
  },
  "i_u904_pintura_2": {
   "ent": "u904",
   "rubro": "pintura",
   "texto": "Pintar pared lateral lavarropas por pérdida",
   "ok": false,
   "orden": 2
  },
  "i_u904_pintura_3": {
   "ent": "u904",
   "rubro": "pintura",
   "texto": "Emprolijar encuentros entre paredes y columnas, muy desprolijo",
   "ok": false,
   "orden": 3
  },
  "i_u904_pintura_4": {
   "ent": "u904",
   "rubro": "pintura",
   "texto": "Puerta toilette chorreada",
   "ok": false,
   "orden": 4
  },
  "i_u904_pintura_5": {
   "ent": "u904",
   "rubro": "pintura",
   "texto": "Buña cielorraso habitación de dos colores distintos, repasar y emprolijar",
   "ok": false,
   "orden": 5
  },
  "i_u904_sanitarios_6": {
   "ent": "u904",
   "rubro": "sanitarios",
   "texto": "Verificar pérdida conexión a lavarropas",
   "ok": false,
   "orden": 6
  },
  "i_u904_sanitarios_7": {
   "ent": "u904",
   "rubro": "sanitarios",
   "texto": "Falta mariposa llave de paso cocina",
   "ok": false,
   "orden": 7
  },
  "i_u904_sanitarios_8": {
   "ent": "u904",
   "rubro": "sanitarios",
   "texto": "Falta embellecedores llave de paso cocina",
   "ok": false,
   "orden": 8
  },
  "i_u904_sanitarios_9": {
   "ent": "u904",
   "rubro": "sanitarios",
   "texto": "Colocar embellecedores llave de paso toilette",
   "ok": false,
   "orden": 9
  },
  "i_u904_sanitarios_10": {
   "ent": "u904",
   "rubro": "sanitarios",
   "texto": "Colocar embellecedores llave de paso baño en suite",
   "ok": false,
   "orden": 10
  },
  "i_u904_hormigon_11": {
   "ent": "u904",
   "rubro": "hormigon",
   "texto": "Lijar bajo losa balcón exterior por pérdida",
   "ok": false,
   "orden": 11
  },
  "i_u904_hormigon_12": {
   "ent": "u904",
   "rubro": "hormigon",
   "texto": "Lijar parapeto exterior y aplicar hidrolaca",
   "ok": false,
   "orden": 12
  },
  "i_u904_puertas_13": {
   "ent": "u904",
   "rubro": "puertas",
   "texto": "Puerta toilette, como se dio vuelta quedó hueco abajo puertita chica — ver cómo se resuelve",
   "ok": false,
   "orden": 13
  },
  "i_u904_puertas_14": {
   "ent": "u904",
   "rubro": "puertas",
   "texto": "Puerta baño en suite, no traba puerta chica, no coincide el agujero",
   "ok": false,
   "orden": 14
  },
  "i_u905_albanileria_0": {
   "ent": "u905",
   "rubro": "albanileria",
   "texto": "Completar con sellador encuentro entre cerámicas y cielorraso",
   "ok": false,
   "orden": 0
  },
  "i_u905_albanileria_1": {
   "ent": "u905",
   "rubro": "albanileria",
   "texto": "Emprolijar encuentro entre solado y carpintería de adentro, banquinita",
   "ok": false,
   "orden": 1
  },
  "i_u905_albanileria_2": {
   "ent": "u905",
   "rubro": "albanileria",
   "texto": "Terminar balcón del otro lado de la baranda, no tiene ni colocación — definir qué se hace ahí",
   "ok": false,
   "orden": 2
  },
  "i_u905_puertas_3": {
   "ent": "u905",
   "rubro": "puertas",
   "texto": "No cierra puerta baño, cepillarla",
   "ok": false,
   "orden": 3
  },
  "i_u905_muebles_4": {
   "ent": "u905",
   "rubro": "muebles",
   "texto": "Nivelar puertas de alacenas",
   "ok": false,
   "orden": 4
  },
  "i_u1001_albanileria_0": {
   "ent": "u1001",
   "rubro": "albanileria",
   "texto": "Pieza solado rota en habitación + falta empastinar zócalo living",
   "ok": false,
   "orden": 0
  },
  "i_u1001_albanileria_1": {
   "ent": "u1001",
   "rubro": "albanileria",
   "texto": "Banquina balcón AA",
   "ok": false,
   "orden": 1
  },
  "i_u1001_pintura_2": {
   "ent": "u1001",
   "rubro": "pintura",
   "texto": "Emprolijar zócalos",
   "ok": false,
   "orden": 2
  },
  "i_u1001_sanitarios_3": {
   "ent": "u1001",
   "rubro": "sanitarios",
   "texto": "Cocina: grifería + descarga + flexibles + embellecedores + tapa inodoro + rejilla piso + rosetas (x2)",
   "ok": false,
   "orden": 3
  },
  "i_u1001_mesadas_4": {
   "ent": "u1001",
   "rubro": "mesadas",
   "texto": "Pendiente colocación",
   "ok": false,
   "orden": 4
  },
  "i_u1001_puertas_5": {
   "ent": "u1001",
   "rubro": "puertas",
   "texto": "Falta balancín, arreglar cerradura superior + cepillar + agujero marco (x2)",
   "ok": false,
   "orden": 5
  },
  "i_u1001_puertas_6": {
   "ent": "u1001",
   "rubro": "puertas",
   "texto": "En habitaciones balancín (x2) + cepillar",
   "ok": false,
   "orden": 6
  },
  "i_u1004_marmoleria_0": {
   "ent": "u1004",
   "rubro": "marmoleria",
   "texto": "Falta colocar mesada cocina",
   "ok": false,
   "orden": 0
  },
  "i_u1004_marmoleria_1": {
   "ent": "u1004",
   "rubro": "marmoleria",
   "texto": "Falta colocar mesada lavadero",
   "ok": false,
   "orden": 1
  },
  "i_u1004_sanitarios_2": {
   "ent": "u1004",
   "rubro": "sanitarios",
   "texto": "Falta conectar bacha cocina",
   "ok": false,
   "orden": 2
  },
  "i_u1004_sanitarios_3": {
   "ent": "u1004",
   "rubro": "sanitarios",
   "texto": "Falta conectar bacha lavadero",
   "ok": false,
   "orden": 3
  },
  "i_u1004_sanitarios_4": {
   "ent": "u1004",
   "rubro": "sanitarios",
   "texto": "Falta conectar grifería cocina",
   "ok": false,
   "orden": 4
  },
  "i_u1004_sanitarios_5": {
   "ent": "u1004",
   "rubro": "sanitarios",
   "texto": "Falta conectar grifería lavadero",
   "ok": false,
   "orden": 5
  },
  "i_u1004_sanitarios_6": {
   "ent": "u1004",
   "rubro": "sanitarios",
   "texto": "Colocar embellecedores llave de paso",
   "ok": false,
   "orden": 6
  },
  "i_u1004_sanitarios_7": {
   "ent": "u1004",
   "rubro": "sanitarios",
   "texto": "No está conectado rompespuma lavarropas",
   "ok": false,
   "orden": 7
  },
  "i_u1004_muebles_8": {
   "ent": "u1004",
   "rubro": "muebles",
   "texto": "Falta colocar mesa en isla",
   "ok": false,
   "orden": 8
  },
  "i_u1004_muebles_9": {
   "ent": "u1004",
   "rubro": "muebles",
   "texto": "Hacer calado en lateral para conexión lavavajillas",
   "ok": false,
   "orden": 9
  },
  "i_u1004_muebles_10": {
   "ent": "u1004",
   "rubro": "muebles",
   "texto": "Faltan ambas tiras de cenefa (parte inferior de alacenas, espacio para led)",
   "ok": false,
   "orden": 10
  },
  "i_u1004_muebles_11": {
   "ent": "u1004",
   "rubro": "muebles",
   "texto": "En cajoneras faltan ambos perfiles Gola Tipo C",
   "ok": false,
   "orden": 11
  },
  "i_u1004_muebles_12": {
   "ent": "u1004",
   "rubro": "muebles",
   "texto": "Puerta de alacena sobre heladera",
   "ok": false,
   "orden": 12
  },
  "i_u1004_muebles_13": {
   "ent": "u1004",
   "rubro": "muebles",
   "texto": "Fondo de fibro blanco en bajo pileta debido a instalaciones sobresaliendo",
   "ok": false,
   "orden": 13
  },
  "i_u1004_muebles_14": {
   "ent": "u1004",
   "rubro": "muebles",
   "texto": "Pase para lavavajillas en lateral de módulo bajo pileta",
   "ok": false,
   "orden": 14
  },
  "i_u1004_albanileria_15": {
   "ent": "u1004",
   "rubro": "albanileria",
   "texto": "Terminar de empastinar piezas que se cambiaron en habitación secundaria",
   "ok": false,
   "orden": 15
  },
  "i_u1004_albanileria_16": {
   "ent": "u1004",
   "rubro": "albanileria",
   "texto": "Emprolijar descarga lavarropas",
   "ok": false,
   "orden": 16
  },
  "i_u1004_albanileria_17": {
   "ent": "u1004",
   "rubro": "albanileria",
   "texto": "Cargar columna living",
   "ok": false,
   "orden": 17
  },
  "i_u1004_albanileria_18": {
   "ent": "u1004",
   "rubro": "albanileria",
   "texto": "Emprolijar zócalo encuentro entre carpintería y solado living",
   "ok": false,
   "orden": 18
  },
  "i_u1004_albanileria_19": {
   "ent": "u1004",
   "rubro": "albanileria",
   "texto": "Emprolijar parrilla",
   "ok": false,
   "orden": 19
  },
  "i_u1004_albanileria_20": {
   "ent": "u1004",
   "rubro": "albanileria",
   "texto": "Colocar refractarios parrilla",
   "ok": false,
   "orden": 20
  },
  "i_u1004_albanileria_21": {
   "ent": "u1004",
   "rubro": "albanileria",
   "texto": "Lijar y emprolijar parapeto terraza y aplicar hidrolaca",
   "ok": false,
   "orden": 21
  },
  "i_u1004_puertas_22": {
   "ent": "u1004",
   "rubro": "puertas",
   "texto": "No están bien colocados los embellecedores de las bocallaves",
   "ok": false,
   "orden": 22
  },
  "i_u1004_puertas_23": {
   "ent": "u1004",
   "rubro": "puertas",
   "texto": "No están bien colocados los embellecedores de las manijas",
   "ok": false,
   "orden": 23
  },
  "i_u1004_puertas_24": {
   "ent": "u1004",
   "rubro": "puertas",
   "texto": "No anda traba puerta chica habitación en suite",
   "ok": false,
   "orden": 24
  },
  "i_u1004_detalles_25": {
   "ent": "u1004",
   "rubro": "detalles",
   "texto": "Placa para cierre aire acondicionado hab. principal chica",
   "ok": false,
   "orden": 25
  },
  "i_u1004_vidrieria_26": {
   "ent": "u1004",
   "rubro": "vidrieria",
   "texto": "Faltan colocar espejos",
   "ok": false,
   "orden": 26
  },
  "i_u1004_mesadas_27": {
   "ent": "u1004",
   "rubro": "mesadas",
   "texto": "Pendientes colocación",
   "ok": false,
   "orden": 27
  },
  "i_u1004_carpinterias_28": {
   "ent": "u1004",
   "rubro": "carpinterias",
   "texto": "Definir si se cambia carpintería terraza",
   "ok": false,
   "orden": 28
  },
  "i_c_sum_durlock_0": {
   "ent": "c_sum",
   "rubro": "durlock",
   "texto": "Modificar cajón cielorraso sobre TV",
   "ok": false,
   "orden": 0
  },
  "i_c_sum_durlock_1": {
   "ent": "c_sum",
   "rubro": "durlock",
   "texto": "Abrir hueco cajón aire acondicionado para retorno del mismo",
   "ok": false,
   "orden": 1
  },
  "i_c_sum_durlock_2": {
   "ent": "c_sum",
   "rubro": "durlock",
   "texto": "Modificar solera sobre puerta plegadiza",
   "ok": false,
   "orden": 2
  },
  "i_c_sum_durlock_3": {
   "ent": "c_sum",
   "rubro": "durlock",
   "texto": "Colocar tapa inspección acceso a bornera aires acondicionados (40x40)",
   "ok": false,
   "orden": 3
  },
  "i_c_sum_durlock_4": {
   "ent": "c_sum",
   "rubro": "durlock",
   "texto": "Colocar tapa en chapa doblada acceso a aire acondicionado bajo silueta (162x73)",
   "ok": false,
   "orden": 4
  },
  "i_c_sum_albanileria_5": {
   "ent": "c_sum",
   "rubro": "albanileria",
   "texto": "Hacer banquina cocina",
   "ok": false,
   "orden": 5
  },
  "i_c_sum_albanileria_6": {
   "ent": "c_sum",
   "rubro": "albanileria",
   "texto": "Nivelar banquina aire acondicionado",
   "ok": false,
   "orden": 6
  },
  "i_c_sum_albanileria_7": {
   "ent": "c_sum",
   "rubro": "albanileria",
   "texto": "Nivelar banquina parrilla para que quede 10cm final como el de la cocina",
   "ok": false,
   "orden": 7
  },
  "i_c_sum_albanileria_8": {
   "ent": "c_sum",
   "rubro": "albanileria",
   "texto": "Cargar viga alero, emprolijar",
   "ok": false,
   "orden": 8
  },
  "i_c_sum_albanileria_9": {
   "ent": "c_sum",
   "rubro": "albanileria",
   "texto": "Terminar de empastinar",
   "ok": false,
   "orden": 9
  },
  "i_c_sum_albanileria_10": {
   "ent": "c_sum",
   "rubro": "albanileria",
   "texto": "Terminar detalles en revoques",
   "ok": false,
   "orden": 10
  },
  "i_c_sum_albanileria_11": {
   "ent": "c_sum",
   "rubro": "albanileria",
   "texto": "Colocar rejillas en balcón",
   "ok": false,
   "orden": 11
  },
  "i_c_sum_pintura_12": {
   "ent": "c_sum",
   "rubro": "pintura",
   "texto": "Hacer tarquini negro en exterior",
   "ok": false,
   "orden": 12
  },
  "i_c_sum_pintura_13": {
   "ent": "c_sum",
   "rubro": "pintura",
   "texto": "Hacer tarquini en palier contrafrente",
   "ok": false,
   "orden": 13
  },
  "i_c_sum_pintura_14": {
   "ent": "c_sum",
   "rubro": "pintura",
   "texto": "Hacer tarquini en baños (x2)",
   "ok": false,
   "orden": 14
  },
  "i_c_sum_pintura_15": {
   "ent": "c_sum",
   "rubro": "pintura",
   "texto": "Pintar paredes de negro para prolijidad ajustes revestimientos en madera",
   "ok": false,
   "orden": 15
  },
  "i_c_sum_sanitarios_16": {
   "ent": "c_sum",
   "rubro": "sanitarios",
   "texto": "Colocar inodoros (x2)",
   "ok": false,
   "orden": 16
  },
  "i_c_sum_sanitarios_17": {
   "ent": "c_sum",
   "rubro": "sanitarios",
   "texto": "Colocar bachas baños y conectar (x2)",
   "ok": false,
   "orden": 17
  },
  "i_c_sum_sanitarios_18": {
   "ent": "c_sum",
   "rubro": "sanitarios",
   "texto": "Conectar bacha cocina",
   "ok": false,
   "orden": 18
  },
  "i_c_sum_sanitarios_19": {
   "ent": "c_sum",
   "rubro": "sanitarios",
   "texto": "Plantear termoeléctrico para agua caliente",
   "ok": false,
   "orden": 19
  },
  "i_c_sum_hormigon_20": {
   "ent": "c_sum",
   "rubro": "hormigon",
   "texto": "Lijar viga exterior parapeto, a definir si se aplica maquillaje",
   "ok": false,
   "orden": 20
  },
  "i_c_sum_hormigon_21": {
   "ent": "c_sum",
   "rubro": "hormigon",
   "texto": "Lijar y reparar columnas hormigón visto y definir si maquillar",
   "ok": false,
   "orden": 21
  },
  "i_c_sum_hormigon_22": {
   "ent": "c_sum",
   "rubro": "hormigon",
   "texto": "Lijar y reparar vigas hormigón visto y definir si maquillar",
   "ok": false,
   "orden": 22
  },
  "i_c_sum_hormigon_23": {
   "ent": "c_sum",
   "rubro": "hormigon",
   "texto": "Lijar y reparar losa hormigón visto y definir si maquillar",
   "ok": false,
   "orden": 23
  },
  "i_c_sum_hormigon_24": {
   "ent": "c_sum",
   "rubro": "hormigon",
   "texto": "Lijar y reparar vigas sobre carpinterías hormigón visto y definir si maquillar",
   "ok": false,
   "orden": 24
  },
  "i_c_sum_detalles_25": {
   "ent": "c_sum",
   "rubro": "detalles",
   "texto": "Colocar rejilla ventilación baño contrafrente",
   "ok": false,
   "orden": 25
  },
  "i_c_kids_albanileria_0": {
   "ent": "c_kids",
   "rubro": "albanileria",
   "texto": "Arreglar pases en losa desprolijos",
   "ok": false,
   "orden": 0
  },
  "i_c_kids_albanileria_1": {
   "ent": "c_kids",
   "rubro": "albanileria",
   "texto": "Cerrar pases/huecos en paredes",
   "ok": false,
   "orden": 1
  },
  "i_c_kids_albanileria_2": {
   "ent": "c_kids",
   "rubro": "albanileria",
   "texto": "Terminar de empastinar",
   "ok": false,
   "orden": 2
  },
  "i_c_kids_hormigon_3": {
   "ent": "c_kids",
   "rubro": "hormigon",
   "texto": "Emprolijar hormigón visto, aplicar lechada en tacurú",
   "ok": false,
   "orden": 3
  },
  "i_c_kids_pintura_4": {
   "ent": "c_kids",
   "rubro": "pintura",
   "texto": "Dar primer mano de pintura",
   "ok": false,
   "orden": 4
  },
  "i_c_kids_zocalos_5": {
   "ent": "c_kids",
   "rubro": "zocalos",
   "texto": "Colocar zócalos",
   "ok": false,
   "orden": 5
  },
  "i_c_terraza_durlock_0": {
   "ent": "c_terraza",
   "rubro": "durlock",
   "texto": "Hacer refuerzo en cielorraso para carpintería cierre palier",
   "ok": false,
   "orden": 0
  },
  "i_c_terraza_durlock_1": {
   "ent": "c_terraza",
   "rubro": "durlock",
   "texto": "Terminar de emplacar cielorraso alero y masillar",
   "ok": false,
   "orden": 1
  },
  "i_c_terraza_durlock_2": {
   "ent": "c_terraza",
   "rubro": "durlock",
   "texto": "Modificar estructura cielorraso toilette, emplacar y masillar",
   "ok": false,
   "orden": 2
  },
  "i_c_terraza_durlock_3": {
   "ent": "c_terraza",
   "rubro": "durlock",
   "texto": "Hacer mocheta pluviales en toilette, emplacar y masillar",
   "ok": false,
   "orden": 3
  },
  "i_c_terraza_durlock_4": {
   "ent": "c_terraza",
   "rubro": "durlock",
   "texto": "Hacer medio tabique para tapar descarga bacha toilette, emplacar y masillar",
   "ok": false,
   "orden": 4
  },
  "i_c_terraza_durlock_5": {
   "ent": "c_terraza",
   "rubro": "durlock",
   "texto": "Terminar de emplacar frente pleno donde está el tablero",
   "ok": false,
   "orden": 5
  },
  "i_c_terraza_albanileria_6": {
   "ent": "c_terraza",
   "rubro": "albanileria",
   "texto": "Picar mocheta que se hizo para salida conexión aire acondicionado co-work (para que quede más prolija)",
   "ok": false,
   "orden": 6
  },
  "i_c_terraza_albanileria_7": {
   "ent": "c_terraza",
   "rubro": "albanileria",
   "texto": "Terminar mampostería pleno contrafrente y llevar hasta el nivel superior del tanque",
   "ok": false,
   "orden": 7
  },
  "i_c_terraza_albanileria_8": {
   "ent": "c_terraza",
   "rubro": "albanileria",
   "texto": "Terminar de encuadrar y emprolijar canteros sobre medianeras",
   "ok": false,
   "orden": 8
  },
  "i_c_terraza_albanileria_9": {
   "ent": "c_terraza",
   "rubro": "albanileria",
   "texto": "Modificar ventilación termotanques una vez esté aprobado el gas",
   "ok": false,
   "orden": 9
  },
  "i_c_terraza_albanileria_10": {
   "ent": "c_terraza",
   "rubro": "albanileria",
   "texto": "Completar carpeta alivianada en cantero sobre termotanques",
   "ok": false,
   "orden": 10
  },
  "i_c_terraza_albanileria_11": {
   "ent": "c_terraza",
   "rubro": "albanileria",
   "texto": "Emprolijar revoque tanque de agua, ver pérdidas en las puertas",
   "ok": false,
   "orden": 11
  },
  "i_c_terraza_albanileria_12": {
   "ent": "c_terraza",
   "rubro": "albanileria",
   "texto": "Preparar pared toilette para aplicar tarquini",
   "ok": false,
   "orden": 12
  },
  "i_c_terraza_albanileria_13": {
   "ent": "c_terraza",
   "rubro": "albanileria",
   "texto": "Encuadrar parapeto anexo para que se pueda colocar barandas",
   "ok": false,
   "orden": 13
  },
  "i_c_terraza_albanileria_14": {
   "ent": "c_terraza",
   "rubro": "albanileria",
   "texto": "Colocar baranda sobre parapetos anexo",
   "ok": false,
   "orden": 14
  },
  "i_c_terraza_albanileria_15": {
   "ent": "c_terraza",
   "rubro": "albanileria",
   "texto": "Colocar rejillas de 60x25 en solado terraza (x3)",
   "ok": false,
   "orden": 15
  },
  "i_c_terraza_albanileria_16": {
   "ent": "c_terraza",
   "rubro": "albanileria",
   "texto": "Colocar rejillas de 25x25 en solado terraza (x1)",
   "ok": false,
   "orden": 16
  },
  "i_c_terraza_carpinterias_17": {
   "ent": "c_terraza",
   "rubro": "carpinterias",
   "texto": "Colocar carpintería salida palier",
   "ok": false,
   "orden": 17
  },
  "i_c_terraza_pintura_18": {
   "ent": "c_terraza",
   "rubro": "pintura",
   "texto": "Hacer tarquini sobre paredes medianeras y volumen de tanque",
   "ok": false,
   "orden": 18
  },
  "i_c_terraza_pintura_19": {
   "ent": "c_terraza",
   "rubro": "pintura",
   "texto": "Hacer tarquini en toilette",
   "ok": false,
   "orden": 19
  },
  "i_c_terraza_pintura_20": {
   "ent": "c_terraza",
   "rubro": "pintura",
   "texto": "Pintar cielorraso toilette",
   "ok": false,
   "orden": 20
  },
  "i_c_terraza_pintura_21": {
   "ent": "c_terraza",
   "rubro": "pintura",
   "texto": "Hacer simil hormigón en cielorraso alero",
   "ok": false,
   "orden": 21
  },
  "i_c_terraza_pintura_22": {
   "ent": "c_terraza",
   "rubro": "pintura",
   "texto": "Pintar puerta toilette del lado interior",
   "ok": false,
   "orden": 22
  },
  "i_c_terraza_hormigon_23": {
   "ent": "c_terraza",
   "rubro": "hormigon",
   "texto": "Terminar de reparar hormigón alero, a definir si se aplica maquillaje",
   "ok": false,
   "orden": 23
  },
  "i_c_terraza_hormigon_24": {
   "ent": "c_terraza",
   "rubro": "hormigon",
   "texto": "Reparar y encuadrar hormigón viga perimetral, a verificar si se aplica maquillaje",
   "ok": false,
   "orden": 24
  },
  "i_c_terraza_plomeria_25": {
   "ent": "c_terraza",
   "rubro": "plomeria",
   "texto": "Conectar inodoro",
   "ok": false,
   "orden": 25
  },
  "i_c_terraza_plomeria_26": {
   "ent": "c_terraza",
   "rubro": "plomeria",
   "texto": "Conectar bacha toilette",
   "ok": false,
   "orden": 26
  },
  "i_c_terraza_plomeria_27": {
   "ent": "c_terraza",
   "rubro": "plomeria",
   "texto": "Colocar embellecedores",
   "ok": false,
   "orden": 27
  },
  "i_c_terraza_plomeria_28": {
   "ent": "c_terraza",
   "rubro": "plomeria",
   "texto": "Verificar que estén conectadas bombas presurizadoras",
   "ok": false,
   "orden": 28
  },
  "i_c_terraza_plomeria_29": {
   "ent": "c_terraza",
   "rubro": "plomeria",
   "texto": "Conectar ducha exterior terraza",
   "ok": false,
   "orden": 29
  },
  "i_c_terraza_marmoleria_30": {
   "ent": "c_terraza",
   "rubro": "marmoleria",
   "texto": "Colocar mesada en toilette",
   "ok": false,
   "orden": 30
  },
  "i_c_terraza_detalles_31": {
   "ent": "c_terraza",
   "rubro": "detalles",
   "texto": "Colocar espejo en toilette",
   "ok": false,
   "orden": 31
  },
  "i_c_terraza_herreria_32": {
   "ent": "c_terraza",
   "rubro": "herreria",
   "texto": "Hacer funda ventilación termotanques",
   "ok": false,
   "orden": 32
  },
  "i_c_pb_albanileria_0": {
   "ent": "c_pb",
   "rubro": "albanileria",
   "texto": "Terminar mampostería contrafrente",
   "ok": false,
   "orden": 0
  },
  "i_c_pb_albanileria_1": {
   "ent": "c_pb",
   "rubro": "albanileria",
   "texto": "Amurar puerta bicicletero",
   "ok": false,
   "orden": 1
  },
  "i_c_pb_albanileria_2": {
   "ent": "c_pb",
   "rubro": "albanileria",
   "texto": "Terminar de revocar paredes donde va coverglass",
   "ok": false,
   "orden": 2
  },
  "i_c_pb_albanileria_3": {
   "ent": "c_pb",
   "rubro": "albanileria",
   "texto": "Hacer mampostería de división entre cocheras y pasillo",
   "ok": false,
   "orden": 3
  },
  "i_c_pb_albanileria_4": {
   "ent": "c_pb",
   "rubro": "albanileria",
   "texto": "Colocar solado faltante",
   "ok": false,
   "orden": 4
  },
  "i_c_pb_albanileria_5": {
   "ent": "c_pb",
   "rubro": "albanileria",
   "texto": "Terminar de emprolijar escalera a primer piso",
   "ok": false,
   "orden": 5
  },
  "i_c_pb_albanileria_6": {
   "ent": "c_pb",
   "rubro": "albanileria",
   "texto": "Verificar que codo descarga cloacal no sea problema para colocar solado",
   "ok": false,
   "orden": 6
  },
  "i_c_pb_albanileria_7": {
   "ent": "c_pb",
   "rubro": "albanileria",
   "texto": "Mover caja toma primaria Edenor a pared medianera (a definir)",
   "ok": false,
   "orden": 7
  },
  "i_c_pb_sanitarios_8": {
   "ent": "c_pb",
   "rubro": "sanitarios",
   "texto": "Conectar hidrante y terminar de amurar",
   "ok": false,
   "orden": 8
  },
  "i_c_pb_sanitarios_9": {
   "ent": "c_pb",
   "rubro": "sanitarios",
   "texto": "Rotar boca inspección descarga cloacal mirando a cocheras",
   "ok": false,
   "orden": 9
  },
  "i_c_pb_durlock_10": {
   "ent": "c_pb",
   "rubro": "durlock",
   "texto": "Terminar de emplacar parte posterior",
   "ok": false,
   "orden": 10
  },
  "i_c_pb_durlock_11": {
   "ent": "c_pb",
   "rubro": "durlock",
   "texto": "Masillar todo el cielorraso, hacer bocas",
   "ok": false,
   "orden": 11
  },
  "i_c_pb_durlock_12": {
   "ent": "c_pb",
   "rubro": "durlock",
   "texto": "Hacer cielorraso en acceso con detalle especial",
   "ok": false,
   "orden": 12
  },
  "i_c_pb_durlock_13": {
   "ent": "c_pb",
   "rubro": "durlock",
   "texto": "Terminar detalles nicho de gas, amurar rejillas, etc.",
   "ok": false,
   "orden": 13
  },
  "i_c_pb_durlock_14": {
   "ent": "c_pb",
   "rubro": "durlock",
   "texto": "Emprolijar medianera acceso con terreno vecino",
   "ok": false,
   "orden": 14
  },
  "i_c_pb_durlock_15": {
   "ent": "c_pb",
   "rubro": "durlock",
   "texto": "Hacer cielorraso armado en bicicletero (a definir)",
   "ok": false,
   "orden": 15
  },
  "i_c_pb_pintura_16": {
   "ent": "c_pb",
   "rubro": "pintura",
   "texto": "Hacer tarquini negro",
   "ok": false,
   "orden": 16
  },
  "i_c_pb_pintura_17": {
   "ent": "c_pb",
   "rubro": "pintura",
   "texto": "Hacer tarquini negro en tabique medianero acceso con terreno vecino",
   "ok": false,
   "orden": 17
  },
  "i_c_pb_plomeria_18": {
   "ent": "c_pb",
   "rubro": "plomeria",
   "texto": "Terminar retorno agua caliente pleno contrafrente",
   "ok": false,
   "orden": 18
  },
  "i_c_pb_plomeria_19": {
   "ent": "c_pb",
   "rubro": "plomeria",
   "texto": "Terminar conexión pluvial que viene del 105",
   "ok": false,
   "orden": 19
  },
  "i_c_palieres_pintura_0": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Terminar de hacer tarquini en 18 palieres",
   "ok": false,
   "orden": 0
  },
  "i_c_palieres_pintura_1": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier frente piso 11",
   "ok": false,
   "orden": 1
  },
  "i_c_palieres_pintura_2": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier contrafrente piso 11",
   "ok": false,
   "orden": 2
  },
  "i_c_palieres_pintura_3": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Arreglar encuentro esquinas muros palier frente piso 11",
   "ok": false,
   "orden": 3
  },
  "i_c_palieres_pintura_4": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Arreglar encuentro esquinas muros palier contrafrente piso 11",
   "ok": false,
   "orden": 4
  },
  "i_c_palieres_pintura_5": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier frente piso 10",
   "ok": false,
   "orden": 5
  },
  "i_c_palieres_pintura_6": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier contrafrente piso 10",
   "ok": false,
   "orden": 6
  },
  "i_c_palieres_pintura_7": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Arreglar encuentros esquina paredes palier frente piso 10",
   "ok": false,
   "orden": 7
  },
  "i_c_palieres_pintura_8": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Arreglar encuentros esquina paredes palier contrafrente piso 10",
   "ok": false,
   "orden": 8
  },
  "i_c_palieres_pintura_9": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier frente piso 9",
   "ok": false,
   "orden": 9
  },
  "i_c_palieres_pintura_10": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier contrafrente piso 9",
   "ok": false,
   "orden": 10
  },
  "i_c_palieres_pintura_11": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Arreglar encuentros esquina paredes palier frente piso 9",
   "ok": false,
   "orden": 11
  },
  "i_c_palieres_pintura_12": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Arreglar encuentros esquina paredes palier contrafrente piso 9",
   "ok": false,
   "orden": 12
  },
  "i_c_palieres_pintura_13": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier frente piso 8",
   "ok": false,
   "orden": 13
  },
  "i_c_palieres_pintura_14": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier contrafrente piso 8",
   "ok": false,
   "orden": 14
  },
  "i_c_palieres_pintura_15": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Arreglar encuentros esquina paredes palier frente piso 8",
   "ok": false,
   "orden": 15
  },
  "i_c_palieres_pintura_16": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Arreglar encuentros esquina paredes palier contrafrente piso 8",
   "ok": false,
   "orden": 16
  },
  "i_c_palieres_pintura_17": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier frente piso 7",
   "ok": false,
   "orden": 17
  },
  "i_c_palieres_pintura_18": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier contrafrente piso 7",
   "ok": false,
   "orden": 18
  },
  "i_c_palieres_pintura_19": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Arreglar encuentros esquina paredes palier frente piso 7",
   "ok": false,
   "orden": 19
  },
  "i_c_palieres_pintura_20": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Arreglar encuentros esquina paredes palier contrafrente piso 7",
   "ok": false,
   "orden": 20
  },
  "i_c_palieres_pintura_21": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier frente piso 6",
   "ok": false,
   "orden": 21
  },
  "i_c_palieres_pintura_22": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier contrafrente piso 6",
   "ok": false,
   "orden": 22
  },
  "i_c_palieres_pintura_23": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Arreglar encuentros esquina paredes palier frente piso 6",
   "ok": false,
   "orden": 23
  },
  "i_c_palieres_pintura_24": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Arreglar encuentros esquina paredes palier contrafrente piso 6",
   "ok": false,
   "orden": 24
  },
  "i_c_palieres_pintura_25": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier frente piso 5",
   "ok": false,
   "orden": 25
  },
  "i_c_palieres_pintura_26": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier contrafrente piso 5",
   "ok": false,
   "orden": 26
  },
  "i_c_palieres_pintura_27": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Arreglar encuentros esquina paredes palier frente piso 5",
   "ok": false,
   "orden": 27
  },
  "i_c_palieres_pintura_28": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Arreglar encuentros esquina paredes palier contrafrente piso 5",
   "ok": false,
   "orden": 28
  },
  "i_c_palieres_pintura_29": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier frente piso 4",
   "ok": false,
   "orden": 29
  },
  "i_c_palieres_pintura_30": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier contrafrente piso 4",
   "ok": false,
   "orden": 30
  },
  "i_c_palieres_pintura_31": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier frente piso 3",
   "ok": false,
   "orden": 31
  },
  "i_c_palieres_pintura_32": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier contrafrente piso 3",
   "ok": false,
   "orden": 32
  },
  "i_c_palieres_pintura_33": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Arreglar encuentros esquina paredes palier contrafrente piso 3",
   "ok": false,
   "orden": 33
  },
  "i_c_palieres_pintura_34": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier frente piso 2",
   "ok": false,
   "orden": 34
  },
  "i_c_palieres_pintura_35": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier contrafrente piso 2",
   "ok": false,
   "orden": 35
  },
  "i_c_palieres_pintura_36": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Arreglar encuentros esquina paredes palier frente piso 2",
   "ok": false,
   "orden": 36
  },
  "i_c_palieres_pintura_37": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Arreglar encuentros esquina paredes palier contrafrente piso 2",
   "ok": false,
   "orden": 37
  },
  "i_c_palieres_pintura_38": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier frente piso 1",
   "ok": false,
   "orden": 38
  },
  "i_c_palieres_pintura_39": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Frente pleno palier contrafrente piso 1",
   "ok": false,
   "orden": 39
  },
  "i_c_palieres_pintura_40": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Arreglar encuentros esquina paredes palier frente piso 1",
   "ok": false,
   "orden": 40
  },
  "i_c_palieres_pintura_41": {
   "ent": "c_palieres",
   "rubro": "pintura",
   "texto": "Arreglar encuentros esquina paredes palier contrafrente piso 1",
   "ok": false,
   "orden": 41
  },
  "i_c_palieres_durlock_42": {
   "ent": "c_palieres",
   "rubro": "durlock",
   "texto": "Terminar de masillar palier primer piso contrafrente",
   "ok": false,
   "orden": 42
  },
  "i_c_palieres_durlock_43": {
   "ent": "c_palieres",
   "rubro": "durlock",
   "texto": "Cambiar placas piso 11, están húmedas",
   "ok": false,
   "orden": 43
  },
  "i_c_palieres_durlock_44": {
   "ent": "c_palieres",
   "rubro": "durlock",
   "texto": "Cambiar placas cielorraso palier contrafrente piso 10, está húmedo",
   "ok": false,
   "orden": 44
  },
  "i_c_palieres_durlock_45": {
   "ent": "c_palieres",
   "rubro": "durlock",
   "texto": "Hacer medio tabique para tapar mocheta palier frente piso 10",
   "ok": false,
   "orden": 45
  },
  "i_c_palieres_durlock_46": {
   "ent": "c_palieres",
   "rubro": "durlock",
   "texto": "Terminar de masillar cielorraso palier contrafrente piso 1",
   "ok": false,
   "orden": 46
  },
  "i_c_palieres_albanileria_47": {
   "ent": "c_palieres",
   "rubro": "albanileria",
   "texto": "Colocar solado en palier primer piso contrafrente",
   "ok": false,
   "orden": 47
  },
  "i_c_palieres_albanileria_48": {
   "ent": "c_palieres",
   "rubro": "albanileria",
   "texto": "Tapar huecos y marcas en paredes",
   "ok": false,
   "orden": 48
  },
  "i_c_palieres_albanileria_49": {
   "ent": "c_palieres",
   "rubro": "albanileria",
   "texto": "Colocar solado de palier",
   "ok": false,
   "orden": 49
  },
  "i_c_palieres_tarquini_50": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier frente piso 11",
   "ok": false,
   "orden": 50
  },
  "i_c_palieres_tarquini_51": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier contrafrente piso 11",
   "ok": false,
   "orden": 51
  },
  "i_c_palieres_tarquini_52": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier frente piso 10",
   "ok": false,
   "orden": 52
  },
  "i_c_palieres_tarquini_53": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier contrafrente piso 10",
   "ok": false,
   "orden": 53
  },
  "i_c_palieres_tarquini_54": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier frente piso 9",
   "ok": false,
   "orden": 54
  },
  "i_c_palieres_tarquini_55": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier contrafrente piso 9",
   "ok": false,
   "orden": 55
  },
  "i_c_palieres_tarquini_56": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier frente piso 8",
   "ok": false,
   "orden": 56
  },
  "i_c_palieres_tarquini_57": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier contrafrente piso 8",
   "ok": false,
   "orden": 57
  },
  "i_c_palieres_tarquini_58": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier frente piso 7",
   "ok": false,
   "orden": 58
  },
  "i_c_palieres_tarquini_59": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier contrafrente piso 7",
   "ok": false,
   "orden": 59
  },
  "i_c_palieres_tarquini_60": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier frente piso 6",
   "ok": false,
   "orden": 60
  },
  "i_c_palieres_tarquini_61": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier contrafrente piso 6",
   "ok": false,
   "orden": 61
  },
  "i_c_palieres_tarquini_62": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier frente piso 5",
   "ok": false,
   "orden": 62
  },
  "i_c_palieres_tarquini_63": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier contrafrente piso 5",
   "ok": false,
   "orden": 63
  },
  "i_c_palieres_tarquini_64": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier frente piso 4 (solo color negro)",
   "ok": false,
   "orden": 64
  },
  "i_c_palieres_tarquini_65": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier contrafrente piso 4 (solo color negro)",
   "ok": false,
   "orden": 65
  },
  "i_c_palieres_tarquini_66": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier frente piso 3 (solo color negro)",
   "ok": false,
   "orden": 66
  },
  "i_c_palieres_tarquini_67": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier contrafrente piso 3",
   "ok": false,
   "orden": 67
  },
  "i_c_palieres_tarquini_68": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier frente piso 2",
   "ok": false,
   "orden": 68
  },
  "i_c_palieres_tarquini_69": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier contrafrente piso 2",
   "ok": false,
   "orden": 69
  },
  "i_c_palieres_tarquini_70": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier frente piso 1",
   "ok": false,
   "orden": 70
  },
  "i_c_palieres_tarquini_71": {
   "ent": "c_palieres",
   "rubro": "tarquini",
   "texto": "Palier contrafrente piso 1",
   "ok": false,
   "orden": 71
  },
  "i_c_local_albanileria_0": {
   "ent": "c_local",
   "rubro": "albanileria",
   "texto": "Hacer banquina 2cm en vano carpintería sobre Congreso",
   "ok": false,
   "orden": 0
  },
  "i_c_local_albanileria_1": {
   "ent": "c_local",
   "rubro": "albanileria",
   "texto": "Enderezar viga superior en ese tramo — viga que está pandeada",
   "ok": false,
   "orden": 1
  },
  "i_c_local_albanileria_2": {
   "ent": "c_local",
   "rubro": "albanileria",
   "texto": "Picar descanso escalera",
   "ok": false,
   "orden": 2
  },
  "i_c_local_albanileria_3": {
   "ent": "c_local",
   "rubro": "albanileria",
   "texto": "Hacer carpeta nuevo descanso escalera",
   "ok": false,
   "orden": 3
  },
  "i_c_local_albanileria_4": {
   "ent": "c_local",
   "rubro": "albanileria",
   "texto": "Amurar narices en nuevos escalones escalera",
   "ok": false,
   "orden": 4
  },
  "i_c_local_herreria_5": {
   "ent": "c_local",
   "rubro": "herreria",
   "texto": "Completar refuerzo herrería en descanso escalera",
   "ok": false,
   "orden": 5
  },
  "i_c_local_carpinterias_6": {
   "ent": "c_local",
   "rubro": "carpinterias",
   "texto": "Colocar vidrios carpintería ochava",
   "ok": false,
   "orden": 6
  },
  "i_c_local_carpinterias_7": {
   "ent": "c_local",
   "rubro": "carpinterias",
   "texto": "Elegir manijón para carpintería ochava",
   "ok": false,
   "orden": 7
  },
  "i_c_local_pintura_8": {
   "ent": "c_local",
   "rubro": "pintura",
   "texto": "Terminar de pintar carpintería ochava",
   "ok": false,
   "orden": 8
  },
  "i_c_local_pintura_9": {
   "ent": "c_local",
   "rubro": "pintura",
   "texto": "Hacer simil hormigón en triángulo ochava cielorraso",
   "ok": false,
   "orden": 9
  },
  "i_c_local_hormigon_10": {
   "ent": "c_local",
   "rubro": "hormigon",
   "texto": "Hormigón exterior, emprolijar estado de columnas",
   "ok": false,
   "orden": 10
  },
  "i_c_cocheras_albanileria_0": {
   "ent": "c_cocheras",
   "rubro": "albanileria",
   "texto": "Hacer contrapiso en cocheras sin duplicadores",
   "ok": false,
   "orden": 0
  },
  "i_c_cocheras_albanileria_1": {
   "ent": "c_cocheras",
   "rubro": "albanileria",
   "texto": "Revocar nueva pared de cierre a hall acceso",
   "ok": false,
   "orden": 1
  },
  "i_c_cocheras_herreria_2": {
   "ent": "c_cocheras",
   "rubro": "herreria",
   "texto": "Amurar perfil de sujeción duplicadores",
   "ok": false,
   "orden": 2
  },
  "i_c_cocheras_herreria_3": {
   "ent": "c_cocheras",
   "rubro": "herreria",
   "texto": "Amurar ajuste entre vereda y duplicador para acceder autos",
   "ok": false,
   "orden": 3
  },
  "i_c_cocheras_herreria_4": {
   "ent": "c_cocheras",
   "rubro": "herreria",
   "texto": "Automatizar portones",
   "ok": false,
   "orden": 4
  },
  "i_c_cocheras_herreria_5": {
   "ent": "c_cocheras",
   "rubro": "herreria",
   "texto": "Terminar de colocar frentes fijos de varillas portón",
   "ok": false,
   "orden": 5
  },
  "i_c_cocheras_herreria_6": {
   "ent": "c_cocheras",
   "rubro": "herreria",
   "texto": "Hacer división entre cocheras y duplicadores",
   "ok": false,
   "orden": 6
  },
  "i_c_cocheras_durlock_7": {
   "ent": "c_cocheras",
   "rubro": "durlock",
   "texto": "Terminar de emprolijar y masillar mocheta para tapar GAS",
   "ok": false,
   "orden": 7
  },
  "i_c_cocheras_pintura_8": {
   "ent": "c_cocheras",
   "rubro": "pintura",
   "texto": "Pintar paredes fondo",
   "ok": false,
   "orden": 8
  },
  "i_c_caja_escalera_albanileria_0": {
   "ent": "c_caja_escalera",
   "rubro": "albanileria",
   "texto": "Revocar claraboya piso 13 y cerrar bien laterales",
   "ok": false,
   "orden": 0
  },
  "i_c_caja_escalera_albanileria_1": {
   "ent": "c_caja_escalera",
   "rubro": "albanileria",
   "texto": "Tapar agujeros en paredes piso 13",
   "ok": false,
   "orden": 1
  },
  "i_c_caja_escalera_herreria_2": {
   "ent": "c_caja_escalera",
   "rubro": "herreria",
   "texto": "Cortar parantes que están muy largos en barandas (piso 13 y 12)",
   "ok": false,
   "orden": 2
  },
  "i_c_caja_escalera_durlock_3": {
   "ent": "c_caja_escalera",
   "rubro": "durlock",
   "texto": "Terminar de masillar cielorraso piso 12",
   "ok": false,
   "orden": 3
  },
  "i_c_caja_escalera_durlock_4": {
   "ent": "c_caja_escalera",
   "rubro": "durlock",
   "texto": "Terminar de masillar pleno piso 12",
   "ok": false,
   "orden": 4
  },
  "i_c_caja_escalera_durlock_5": {
   "ent": "c_caja_escalera",
   "rubro": "durlock",
   "texto": "Tapar boca iluminación en cielorraso que está mal",
   "ok": false,
   "orden": 5
  },
  "i_c_caja_escalera_pintura_6": {
   "ent": "c_caja_escalera",
   "rubro": "pintura",
   "texto": "Pintar todas las narices de la caja de escalera (piso 1 al 13 y subsuelo)",
   "ok": false,
   "orden": 6
  },
  "i_c_caja_escalera_pintura_7": {
   "ent": "c_caja_escalera",
   "rubro": "pintura",
   "texto": "Pintar con laca todo el piso de la caja de escalera",
   "ok": false,
   "orden": 7
  },
  "i_c_caja_escalera_pintura_8": {
   "ent": "c_caja_escalera",
   "rubro": "pintura",
   "texto": "Terminar de pintar paredes piso 12",
   "ok": false,
   "orden": 8
  },
  "i_c_caja_escalera_pintura_9": {
   "ent": "c_caja_escalera",
   "rubro": "pintura",
   "texto": "Terminar de pintar paredes piso 13",
   "ok": false,
   "orden": 9
  },
  "i_c_caja_escalera_pintura_10": {
   "ent": "c_caja_escalera",
   "rubro": "pintura",
   "texto": "Pintar puertas caja de escalera piso 13 (x4)",
   "ok": false,
   "orden": 10
  },
  "i_c_caja_escalera_pintura_11": {
   "ent": "c_caja_escalera",
   "rubro": "pintura",
   "texto": "Pintar puertas caja de escalera piso 12 (x2)",
   "ok": false,
   "orden": 11
  },
  "i_c_caja_escalera_pintura_12": {
   "ent": "c_caja_escalera",
   "rubro": "pintura",
   "texto": "Pintar puertas antecámara piso 11 (x2)",
   "ok": false,
   "orden": 12
  },
  "i_c_caja_escalera_pintura_13": {
   "ent": "c_caja_escalera",
   "rubro": "pintura",
   "texto": "Pintar puertas antecámara piso 10 (x2)",
   "ok": false,
   "orden": 13
  },
  "i_c_caja_escalera_pintura_14": {
   "ent": "c_caja_escalera",
   "rubro": "pintura",
   "texto": "Pintar puertas antecámara piso 9 (x2)",
   "ok": false,
   "orden": 14
  },
  "i_c_caja_escalera_pintura_15": {
   "ent": "c_caja_escalera",
   "rubro": "pintura",
   "texto": "Pintar puertas antecámara piso 8 (x2)",
   "ok": false,
   "orden": 15
  },
  "i_c_caja_escalera_pintura_16": {
   "ent": "c_caja_escalera",
   "rubro": "pintura",
   "texto": "Pintar puertas antecámara piso 7 (x2)",
   "ok": false,
   "orden": 16
  },
  "i_c_caja_escalera_pintura_17": {
   "ent": "c_caja_escalera",
   "rubro": "pintura",
   "texto": "Pintar puertas antecámara piso 6 (x2)",
   "ok": false,
   "orden": 17
  },
  "i_c_caja_escalera_pintura_18": {
   "ent": "c_caja_escalera",
   "rubro": "pintura",
   "texto": "Pintar puertas antecámara piso 5 (x2)",
   "ok": false,
   "orden": 18
  },
  "i_c_caja_escalera_pintura_19": {
   "ent": "c_caja_escalera",
   "rubro": "pintura",
   "texto": "Pintar puertas antecámara piso 4 (x2)",
   "ok": false,
   "orden": 19
  },
  "i_c_caja_escalera_pintura_20": {
   "ent": "c_caja_escalera",
   "rubro": "pintura",
   "texto": "Pintar puertas antecámara piso 3 (x2)",
   "ok": false,
   "orden": 20
  },
  "i_c_caja_escalera_pintura_21": {
   "ent": "c_caja_escalera",
   "rubro": "pintura",
   "texto": "Pintar puertas antecámara piso 2 (x2)",
   "ok": false,
   "orden": 21
  },
  "i_c_caja_escalera_pintura_22": {
   "ent": "c_caja_escalera",
   "rubro": "pintura",
   "texto": "Pintar puertas antecámara piso 1 (x2)",
   "ok": false,
   "orden": 22
  },
  "i_c_caja_escalera_pintura_23": {
   "ent": "c_caja_escalera",
   "rubro": "pintura",
   "texto": "Pintar cielorraso piso 12",
   "ok": false,
   "orden": 23
  },
  "i_c_caja_escalera_pintura_24": {
   "ent": "c_caja_escalera",
   "rubro": "pintura",
   "texto": "Pintar barandas (del 1 al 7)",
   "ok": false,
   "orden": 24
  },
  "i_c_caja_escalera_pintura_25": {
   "ent": "c_caja_escalera",
   "rubro": "pintura",
   "texto": "Terminar de pintar cielorraso piso 11 (en el lateral)",
   "ok": false,
   "orden": 25
  },
  "i_c_caja_escalera_hormigon_26": {
   "ent": "c_caja_escalera",
   "rubro": "hormigon",
   "texto": "Reparar bajo losa escalera que va a piso 12",
   "ok": false,
   "orden": 26
  },
  "i_c_caja_escalera_hormigon_27": {
   "ent": "c_caja_escalera",
   "rubro": "hormigon",
   "texto": "Reparar bajo losa escalera que va a piso 13",
   "ok": false,
   "orden": 27
  },
  "i_c_fachada_pintura_0": {
   "ent": "c_fachada",
   "rubro": "pintura",
   "texto": "Aplicar maquillaje en hormigón visto balcones",
   "ok": false,
   "orden": 0
  },
  "i_c_fachada_pintura_1": {
   "ent": "c_fachada",
   "rubro": "pintura",
   "texto": "Hacer tarquini en medianera anexo desde piso 7 a 11 (100 m2 aprox)",
   "ok": false,
   "orden": 1
  },
  "i_c_fachada_ayuda_de_gremio_2": {
   "ent": "c_fachada",
   "rubro": "ayuda_de_gremio",
   "texto": "Balancín/silletero para sellado carpinterías esquina",
   "ok": false,
   "orden": 2
  },
  "i_c_subsuelo_albanileria_0": {
   "ent": "c_subsuelo",
   "rubro": "albanileria",
   "texto": "Terminar de revocar sectores de pared y tapar agujeros en espacio bauleras",
   "ok": false,
   "orden": 0
  },
  "i_c_subsuelo_albanileria_1": {
   "ent": "c_subsuelo",
   "rubro": "albanileria",
   "texto": "Hacer carpeta en sala de servicios generales",
   "ok": false,
   "orden": 1
  },
  "i_c_subsuelo_albanileria_2": {
   "ent": "c_subsuelo",
   "rubro": "albanileria",
   "texto": "Emprolijar paredes pasillo y columnas de hormigón y revocar",
   "ok": false,
   "orden": 2
  },
  "i_c_subsuelo_albanileria_3": {
   "ent": "c_subsuelo",
   "rubro": "albanileria",
   "texto": "Terminar carpeta en pasillo apenas se baja de la escalera",
   "ok": false,
   "orden": 3
  },
  "i_c_subsuelo_albanileria_4": {
   "ent": "c_subsuelo",
   "rubro": "albanileria",
   "texto": "Recuadrar escalera y colocar narices",
   "ok": false,
   "orden": 4
  },
  "i_c_subsuelo_albanileria_5": {
   "ent": "c_subsuelo",
   "rubro": "albanileria",
   "texto": "Hacer banquina para bombas",
   "ok": false,
   "orden": 5
  },
  "i_c_subsuelo_albanileria_6": {
   "ent": "c_subsuelo",
   "rubro": "albanileria",
   "texto": "Colocar tapa para pozo de bombeo pluvial",
   "ok": false,
   "orden": 6
  },
  "i_c_subsuelo_albanileria_7": {
   "ent": "c_subsuelo",
   "rubro": "albanileria",
   "texto": "Colocar tapa en pozo de bombeo cloacal",
   "ok": false,
   "orden": 7
  },
  "i_c_subsuelo_albanileria_8": {
   "ent": "c_subsuelo",
   "rubro": "albanileria",
   "texto": "Terminar de revocar y emprolijar paredes y piso en laundry",
   "ok": false,
   "orden": 8
  },
  "i_c_subsuelo_albanileria_9": {
   "ent": "c_subsuelo",
   "rubro": "albanileria",
   "texto": "Colocar revestimiento en baño",
   "ok": false,
   "orden": 9
  },
  "i_c_subsuelo_albanileria_10": {
   "ent": "c_subsuelo",
   "rubro": "albanileria",
   "texto": "Colocar revestimiento en laundry",
   "ok": false,
   "orden": 10
  },
  "i_c_subsuelo_albanileria_11": {
   "ent": "c_subsuelo",
   "rubro": "albanileria",
   "texto": "Terminar pozo bombeo cloacal, impermeabilizar por dentro y amurar tapa",
   "ok": false,
   "orden": 11
  },
  "i_c_subsuelo_pintura_12": {
   "ent": "c_subsuelo",
   "rubro": "pintura",
   "texto": "Pintar espacio bauleras",
   "ok": false,
   "orden": 12
  },
  "i_c_subsuelo_pintura_13": {
   "ent": "c_subsuelo",
   "rubro": "pintura",
   "texto": "Pintar pasillo",
   "ok": false,
   "orden": 13
  },
  "i_c_subsuelo_pintura_14": {
   "ent": "c_subsuelo",
   "rubro": "pintura",
   "texto": "Pintar paredes sala tanque de bombeo",
   "ok": false,
   "orden": 14
  },
  "i_c_subsuelo_durlock_15": {
   "ent": "c_subsuelo",
   "rubro": "durlock",
   "texto": "Cerrar hueco que queda contra la pared entre viga y mampostería",
   "ok": false,
   "orden": 15
  },
  "i_c_subsuelo_plomeria_16": {
   "ent": "c_subsuelo",
   "rubro": "plomeria",
   "texto": "Conectar bombas a tanque de bombeo",
   "ok": false,
   "orden": 16
  },
  "i_c_subsuelo_plomeria_17": {
   "ent": "c_subsuelo",
   "rubro": "plomeria",
   "texto": "Armar colector tanque de bombeo",
   "ok": false,
   "orden": 17
  },
  "i_c_subsuelo_plomeria_18": {
   "ent": "c_subsuelo",
   "rubro": "plomeria",
   "texto": "Conectar bomba para pozo de bombeo pluvial",
   "ok": false,
   "orden": 18
  },
  "i_c_subsuelo_plomeria_19": {
   "ent": "c_subsuelo",
   "rubro": "plomeria",
   "texto": "Conectar bomba para pozo de bombeo cloacal",
   "ok": false,
   "orden": 19
  },
  "i_c_subsuelo_sanitarios_20": {
   "ent": "c_subsuelo",
   "rubro": "sanitarios",
   "texto": "Terminar de conectar rejilla local a pozo de bombeo cloacal",
   "ok": false,
   "orden": 20
  },
  "i_c_subsuelo_sanitarios_21": {
   "ent": "c_subsuelo",
   "rubro": "sanitarios",
   "texto": "Terminar de conectar laundry a pozo de bombeo cloacal",
   "ok": false,
   "orden": 21
  },
  "i_c_subsuelo_sanitarios_22": {
   "ent": "c_subsuelo",
   "rubro": "sanitarios",
   "texto": "Hacer instalación completa baño",
   "ok": false,
   "orden": 22
  },
  "i_c_subsuelo_sanitarios_23": {
   "ent": "c_subsuelo",
   "rubro": "sanitarios",
   "texto": "Conectar bomba para pozo de bombeo cloacal",
   "ok": false,
   "orden": 23
  },
  "i_c_subsuelo_detalles_24": {
   "ent": "c_subsuelo",
   "rubro": "detalles",
   "texto": "Hacer limpieza general, sacar todas las maderas",
   "ok": false,
   "orden": 24
  },
  "i_c_sala_maq_frente_albanileria_0": {
   "ent": "c_sala_maq_frente",
   "rubro": "albanileria",
   "texto": "Tapar caños electricidad",
   "ok": false,
   "orden": 0
  },
  "i_c_sala_maq_frente_albanileria_1": {
   "ent": "c_sala_maq_frente",
   "rubro": "albanileria",
   "texto": "Amurar rejilla ventilación 40x40",
   "ok": false,
   "orden": 1
  },
  "i_c_sala_maq_frente_albanileria_2": {
   "ent": "c_sala_maq_frente",
   "rubro": "albanileria",
   "texto": "Hacer bordes antiderrames donde van cables ascensor",
   "ok": false,
   "orden": 2
  },
  "i_c_sala_maq_frente_albanileria_3": {
   "ent": "c_sala_maq_frente",
   "rubro": "albanileria",
   "texto": "Terminar de encuadrar rejilla ventilación losa",
   "ok": false,
   "orden": 3
  },
  "i_c_sala_maq_frente_electricidad_4": {
   "ent": "c_sala_maq_frente",
   "rubro": "electricidad",
   "texto": "Terminar tablero",
   "ok": false,
   "orden": 4
  },
  "i_c_sala_maq_frente_electricidad_5": {
   "ent": "c_sala_maq_frente",
   "rubro": "electricidad",
   "texto": "Conectar termostato ventilador",
   "ok": false,
   "orden": 5
  },
  "i_c_sala_maq_contrafrente_albanileria_0": {
   "ent": "c_sala_maq_contrafrente",
   "rubro": "albanileria",
   "texto": "Tapar pase en piso de pleno no utilizado",
   "ok": false,
   "orden": 0
  },
  "i_c_sala_maq_contrafrente_albanileria_1": {
   "ent": "c_sala_maq_contrafrente",
   "rubro": "albanileria",
   "texto": "Cerrar pleno en mampostería",
   "ok": false,
   "orden": 1
  },
  "i_c_sala_maq_contrafrente_albanileria_2": {
   "ent": "c_sala_maq_contrafrente",
   "rubro": "albanileria",
   "texto": "Hacer carpeta rodillada",
   "ok": false,
   "orden": 2
  },
  "i_c_sala_maq_contrafrente_albanileria_3": {
   "ent": "c_sala_maq_contrafrente",
   "rubro": "albanileria",
   "texto": "Amurar rejilla ventilación 40x40",
   "ok": false,
   "orden": 3
  },
  "i_c_sala_maq_contrafrente_albanileria_4": {
   "ent": "c_sala_maq_contrafrente",
   "rubro": "albanileria",
   "texto": "Hacer bordes antiderrames donde van cables ascensor",
   "ok": false,
   "orden": 4
  },
  "i_c_sala_maq_contrafrente_electricidad_5": {
   "ent": "c_sala_maq_contrafrente",
   "rubro": "electricidad",
   "texto": "Terminar tablero",
   "ok": false,
   "orden": 5
  },
  "i_c_sala_maq_contrafrente_electricidad_6": {
   "ent": "c_sala_maq_contrafrente",
   "rubro": "electricidad",
   "texto": "Conectar termostato ventilador",
   "ok": false,
   "orden": 6
  },
  "i_c_sala_maq_contrafrente_pintura_7": {
   "ent": "c_sala_maq_contrafrente",
   "rubro": "pintura",
   "texto": "Pintar paredes",
   "ok": false,
   "orden": 7
  },
  "i_c_piso13_albanileria_0": {
   "ent": "c_piso13",
   "rubro": "albanileria",
   "texto": "Falta colocar tapa tanque acceso flotante",
   "ok": false,
   "orden": 0
  },
  "i_c_piso13_albanileria_1": {
   "ent": "c_piso13",
   "rubro": "albanileria",
   "texto": "Aplicar membrana sobre piso 13",
   "ok": false,
   "orden": 1
  },
  "i_c_piso13_albanileria_2": {
   "ent": "c_piso13",
   "rubro": "albanileria",
   "texto": "Colocar dos escaleras gato para acceso a azotea",
   "ok": false,
   "orden": 2
  },
  "i_c_piso13_albanileria_3": {
   "ent": "c_piso13",
   "rubro": "albanileria",
   "texto": "Encuadrar y cerrar pleno frente (ver plano detalle)",
   "ok": false,
   "orden": 3
  },
  "i_c_piso13_albanileria_4": {
   "ent": "c_piso13",
   "rubro": "albanileria",
   "texto": "Colocar sombrerete pleno contrafrente",
   "ok": false,
   "orden": 4
  },
  "i_c_piso13_albanileria_5": {
   "ent": "c_piso13",
   "rubro": "albanileria",
   "texto": "Colocar sombrerete pleno frente",
   "ok": false,
   "orden": 5
  },
  "i_c_piso13_albanileria_6": {
   "ent": "c_piso13",
   "rubro": "albanileria",
   "texto": "Colocar sombrerete pleno parrilla",
   "ok": false,
   "orden": 6
  },
  "i_c_piso13_albanileria_7": {
   "ent": "c_piso13",
   "rubro": "albanileria",
   "texto": "Colocar sombrerete ventilación sala ascensores (x2)",
   "ok": false,
   "orden": 7
  },
  "i_c_piso13_plomeria_8": {
   "ent": "c_piso13",
   "rubro": "plomeria",
   "texto": "Modificar conexión tanque, que quede desde el lateral no desde la tapa superior",
   "ok": false,
   "orden": 8
  },
  "i_c_piso13_plomeria_9": {
   "ent": "c_piso13",
   "rubro": "plomeria",
   "texto": "Instalar tanque reserva agua de lluvia",
   "ok": false,
   "orden": 9
  },
  "i_c_piso13_pintura_10": {
   "ent": "c_piso13",
   "rubro": "pintura",
   "texto": "Hacer tarquini en todo el volumen del piso 13",
   "ok": false,
   "orden": 10
  },
  "i_c_piso13_pintura_11": {
   "ent": "c_piso13",
   "rubro": "pintura",
   "texto": "Impermeabilizar con pintura aislante en el alero (sector macetas)",
   "ok": false,
   "orden": 11
  }
 }
};
