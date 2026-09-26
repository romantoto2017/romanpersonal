#!/usr/bin/env node
// Scraper de alineaciones de Transfermarkt → data/matches.json
//
// Uso:
//   node scraper/scrape.mjs                 # procesa scraper/partidos.txt (baja lo que falte en cache)
//   node scraper/scrape.mjs --solo-cache    # no hace ningún request, solo parsea lo cacheado
//   node scraper/scrape.mjs --max-fetch 40  # tope de requests por corrida (default 40 = ~20 partidos)
//
// partidos.txt, una línea por partido (el orden = orden de niveles):
//   URL_TRANSFERMARKT | local|visitante | dato curioso (opcional, sacado de Transfermarkt)
//
// Reglas: los datos salen SIEMPRE del HTML descargado. Nunca se completa nada de memoria.
// Ante 403/429 u otro bloqueo, el script frena y NO reintenta.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { normalizar, normalizarApellido, parsearFormacion } from '../js/logic.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, 'cache');
const DATA = path.join(ROOT, 'data');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const args = process.argv.slice(2);
const SOLO_CACHE = args.includes('--solo-cache');
const MAX_FETCH = Number(args[args.indexOf('--max-fetch') + 1]) || 40;
const ENTRADA = path.join(ROOT, args.find((a) => a.endsWith('.txt')) || 'scraper/partidos.txt');

const PARTICULAS = ['DE', 'DA', 'DO', 'DOS', 'DAS', 'DEL', 'DI', 'LA', 'LE', 'VAN', 'VON', 'MC', 'MAC'];

let fetches = 0;
class Bloqueo extends Error {}

// ---------- descarga con cache ----------
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

function rutaCache(id, tipo) {
  return path.join(CACHE, `${id}_${tipo}.html.gz`);
}

function leerCache(id, tipo) {
  const f = rutaCache(id, tipo);
  if (fs.existsSync(f)) return zlib.gunzipSync(fs.readFileSync(f)).toString('utf8');
  // También acepta HTML guardado a mano desde el navegador: cache/<id>_<tipo>.html
  const plano = f.replace(/\.gz$/, '');
  if (fs.existsSync(plano)) return fs.readFileSync(plano, 'utf8');
  return null;
}

async function obtener(url, id, tipo) {
  const cacheado = leerCache(id, tipo);
  if (cacheado) return cacheado;
  if (SOLO_CACHE) return null;
  if (fetches >= MAX_FETCH) throw new Bloqueo(`Tope de ${MAX_FETCH} requests alcanzado. Volvé a correr para seguir.`);
  if (fetches > 0) await dormir(2000 + Math.random() * 1000);
  fetches++;
  let res;
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8', Accept: 'text/html' },
    });
  } catch (e) {
    throw new Bloqueo(`Error de red pidiendo ${url}: ${e.message}. Frenando sin reintentar.`);
  }
  if (res.status === 403 || res.status === 429 || res.status === 503) {
    throw new Bloqueo(`Transfermarkt devolvió ${res.status} en ${url}. Frenando sin reintentar.`);
  }
  if (!res.ok) {
    console.warn(`  ! HTTP ${res.status} en ${url}`);
    return null;
  }
  const html = await res.text();
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(rutaCache(id, tipo), zlib.gzipSync(html));
  return html;
}

// ---------- URLs ----------
function urlsPartido(url) {
  const u = new URL(url.trim());
  const m = u.pathname.match(/\/spielbericht\/(?:index\/spielbericht\/)?(\d+)/);
  if (!m) throw new Error(`No reconozco la URL de partido: ${url}`);
  const id = m[1];
  const base = `${u.protocol}//${u.host}`;
  return {
    id,
    bericht: `${base}/spielbericht/index/spielbericht/${id}`,
    aufstellung: `${base}/spielbericht/aufstellung/spielbericht/${id}`,
    canonica: `${base}/spielbericht/index/spielbericht/${id}`,
  };
}

// ---------- parseo ----------
const limpio = (t) => String(t || '').replace(/\s+/g, ' ').trim();
const idJugador = (href) => (String(href || '').match(/\/spieler\/(\d+)/) || [])[1] || null;
const idClub = (href) => (String(href || '').match(/\/verein\/(\d+)/) || [])[1] || null;

function parsearCabecera($) {
  const equipo = (sel) => {
    const box = $(sel).first();
    const a = box.find('a.sb-vereinslink').first().length
      ? box.find('a.sb-vereinslink').first()
      : box.find('a[href*="/verein/"]').filter((_, el) => limpio($(el).text())).first();
    return { nombre: limpio(a.text()) || limpio(a.attr('title')), tm_club_id: idClub(a.attr('href')) };
  };
  const local = equipo('.sb-heim');
  const visitante = equipo('.sb-gast');

  const endstand = $('.sb-endstand').first().clone();
  endstand.find('.sb-halbzeit').remove();
  const textoRes = limpio(endstand.text());
  const mr = textoRes.match(/(\d+)\s*:\s*(\d+)/);
  let resultado = mr ? `${mr[1]}-${mr[2]}` : null;
  const extra = textoRes.replace(/(\d+)\s*:\s*(\d+)/, '').trim();
  if (resultado && extra) resultado += ` (${extra})`;

  let fecha = null;
  $('a[href*="/datum/"]').each((_, el) => {
    const m = String($(el).attr('href')).match(/\/datum\/(\d{4}-\d{2}-\d{2})/);
    if (m && !fecha) fecha = m[1];
  });

  let competicion =
    limpio($('.direct-headline__header').first().text()) ||
    limpio($('a.direct-headline__link').first().text()) ||
    limpio($('.spielername-profil a[href*="/wettbewerb/"]').first().text()) ||
    limpio($('.box-content a[href*="/wettbewerb/"]').first().attr('title')) ||
    null;

  const datum = limpio($('.sb-datum').first().text());
  const ronda = limpio(datum.split('|')[0]) || null;

  return { local, visitante, resultado, fecha, competicion, ronda };
}

// Vista de cancha: nombre abreviado ("G. De Arrascaeta") + coordenadas, por id de jugador.
function parsearCancha($) {
  const porEquipo = [];
  $('.aufstellung-box, .aufstellung-spielfeld-container, .large-6.columns').each((_, box) => {
    const jugadores = {};
    // .formation-player-container es el marcador real de cada jugador. Un selector genérico por
    // estilo también matea el div contenedor de toda la cancha (top:0;left:0, sin %), que envuelve
    // a los 11 y "roba" el primer jugador con coordenadas nulas; por eso va primero y sin fallback
    // salvo que la página no lo tenga.
    let marcadores = $(box).find('.formation-player-container');
    if (!marcadores.length) marcadores = $(box).find('[style*="top"][style*="left"]');
    marcadores.each((_, el) => {
      const a = $(el).find('a[href*="/spieler/"]').first();
      const id = idJugador(a.attr('href'));
      if (!id || jugadores[id]) return;
      const st = $(el).attr('style');
      const top = parseFloat((st.match(/top:\s*([\d.]+)%/) || [])[1]);
      const left = parseFloat((st.match(/left:\s*([\d.]+)%/) || [])[1]);
      if (isNaN(top) || isNaN(left)) return; // no es un marcador de cancha real
      const numero = limpio($(el).find('.tm-shirt-number, .aufstellung-rueckennummer').first().text());
      jugadores[id] = {
        corto: limpio(a.text()) || limpio(a.attr('title')),
        top,
        left,
        numero: numero || null,
        capitan: $(el).find('[class*="kapitaen"], [title="Captain"], [title="Capitán"]').length > 0,
      };
    });
    if (Object.keys(jugadores).length >= 11) porEquipo.push(jugadores);
  });
  return porEquipo; // [local, visitante] si los encontró
}

// Tablas de alineación: nombre completo, número, posición, capitán. Solo titulares.
function parsearTablas($) {
  const columnas = $('.large-6.columns').filter((_, c) => $(c).find('table.items').length > 0);
  const equipos = [];
  columnas.each((_, col) => {
    const box = $(col).find('.box').first();
    const tabla = box.find('table.items').first();
    const titulares = [];
    tabla.find('tr').each((_, tr) => {
      const $tr = $(tr);
      const num = limpio($tr.find('.rn_nummer').first().text());
      const a = $tr.find('a[href*="/spieler/"]').filter((_, el) => limpio($(el).text())).first();
      if (!a.length || !$tr.find('.rn_nummer').length) return;
      const inline = $tr.find('table.inline-table tr');
      const posicion = inline.length > 1 ? limpio($(inline[1]).text()).replace(/,.*$/, '') : '';
      titulares.push({
        tm_id: idJugador(a.attr('href')),
        nombre_completo: limpio(a.attr('title')) || limpio(a.text()),
        numero: num.replace(/[^\d]/g, '') || null,
        posicion,
        capitan: $tr.find('[class*="kapitaen"], [title="Captain"], [title="Capitán"]').length > 0,
      });
    });
    const titulo = limpio(box.find('.content-box-headline, h2').first().text());
    equipos.push({ titulares, titulo });
  });
  return { equipos };
}

const esArquero = (pos) => /goalkeeper|portero|arquero|guardameta|torwart|keeper/i.test(pos || '');

// Formación: "Starting Line-up: 4-3-3 Attacking" (o su versión en español/alemán), local primero.
// Transfermarkt la muestra en la página del informe (bericht); puede faltar en la de alineación.
function parsearFormaciones($) {
  const formaciones = [];
  const re = /(?:Starting Line-up|Once inicial|Alineaci[oó]n inicial|Startaufstellung)\s*:?\s*(\d(?:\s*-\s*\d){1,5})/gi;
  const txt = $('body').text();
  let m;
  while ((m = re.exec(txt))) formaciones.push(m[1].replace(/\s/g, ''));
  if (formaciones.length < 2) {
    formaciones.length = 0;
    $('.aufstellung-vereinsseite').each((_, el) => {
      const f = limpio($(el).text()).match(/(\d(?:-\d){1,5})/);
      if (f) formaciones.push(f[1]);
    });
  }
  return formaciones;
}

// ---------- apellidos ----------
function sacarApellido(corto, completo) {
  const motivos = [];
  let base = limpio(corto);
  if (base) {
    // "G. De Arrascaeta" → "De Arrascaeta"; "J. M. Pérez" → "Pérez"
    const sinInicial = base.replace(/^(?:[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]?\.\s*)+/, '');
    if (sinInicial === base) motivos.push('sin inicial en Transfermarkt (un solo nombre / apodo)');
    base = sinInicial;
  } else {
    // Sin vista de cancha: último token del nombre completo (y partícula si la hay). Revisar.
    const t = limpio(completo).split(' ');
    base = t.length > 1 ? t.slice(-1)[0] : t[0];
    if (t.length > 2 && PARTICULAS.includes(normalizar(t[t.length - 2]))) base = `${t[t.length - 2]} ${base}`;
    motivos.push('apellido derivado del nombre completo (no había versión abreviada)');
  }
  // Partícula con mayúscula inicial: "de Arrascaeta" → "De Arrascaeta"
  const palabras = base.split(' ');
  if (palabras.length > 1 && PARTICULAS.includes(normalizar(palabras[0]))) {
    palabras[0] = palabras[0][0].toUpperCase() + palabras[0].slice(1);
    motivos.push('partícula');
  } else if (palabras.length > 1) motivos.push('apellido compuesto/doble');
  const mostrar = palabras.join(' ');
  if (/[ñÑüÜçÇ'’]/.test(mostrar)) motivos.push('caracteres especiales (ñ/ü/ç/apóstrofe)');
  return { apellido_mostrar: mostrar, motivos };
}

// ---------- armado del partido ----------
function buscarClub(nombre, equipos) {
  const n = normalizar(nombre);
  let mejor = null;
  for (const [clave, e] of Object.entries(equipos)) {
    if (clave.startsWith('_')) continue;
    for (const al of e.alias || []) {
      const na = normalizar(al);
      if (n === na) return clave;
      if (!mejor && na.length > 4 && (n.includes(na) || na.includes(n))) mejor = clave;
    }
  }
  return mejor;
}

function ordenarEnFilas(jugadores, filas) {
  // filas = [4,3,3]. Arquero fila 0. Resto por distancia vertical al arquero, luego izquierda→derecha.
  const gk = jugadores.find((j) => j._gk);
  const campo = jugadores.filter((j) => j !== gk);
  const conCoords = campo.every((j) => j._top != null && j._left != null) && gk && gk._top != null;
  const avisos = [];
  if (conCoords) campo.sort((a, b) => Math.abs(a._top - gk._top) - Math.abs(b._top - gk._top));
  else avisos.push('sin coordenadas de cancha: se usó el orden de la tabla');
  let i = 0;
  const out = gk ? [{ ...gk, fila: 0 }] : [];
  filas.forEach((n, f) => {
    const linea = campo.slice(i, i + n).map((j) => ({ ...j, fila: f + 1 }));
    if (conCoords) linea.sort((a, b) => a._left - b._left);
    out.push(...linea);
    i += n;
  });
  return { jugadores: out, avisos };
}

function armarPartido(entrada, htmlB, htmlA, equipos, overrides) {
  const errores = [];
  const avisos = [];
  const $a = cheerio.load(htmlA || '');
  const $b = cheerio.load(htmlB || '');
  let cab = parsearCabecera($b);
  if (!cab.local.nombre) cab = parsearCabecera($a);

  const lado = entrada.lado === 'visitante' ? 1 : 0;
  const tablas = parsearTablas($a);
  const canchaB = parsearCancha($b);
  const cancha = canchaB.length >= 2 ? canchaB : parsearCancha($a);
  const tabla = tablas.equipos[lado];
  const canchaEq = cancha[lado] || {};
  let formaciones = parsearFormaciones($a);
  if (formaciones.length < 2) formaciones = parsearFormaciones($b);
  const formacion = formaciones[lado] || null;

  if (!cab.fecha) errores.push('sin fecha');
  if (!cab.resultado) errores.push('sin resultado');
  if (!cab.local.nombre || !cab.visitante.nombre) errores.push('sin nombres de equipos');
  if (!tabla || !tabla.titulares.length) errores.push('la página no trae alineación');

  const titulares = tabla ? tabla.titulares : [];
  const revisar = [];
  let jugadores = titulares.map((t) => {
    const c = canchaEq[t.tm_id] || {};
    const ov = overrides[t.tm_id] || {};
    const { apellido_mostrar, motivos } = sacarApellido(c.corto, t.nombre_completo);
    const mostrar = ov.apellido_mostrar || apellido_mostrar;
    // Conserva el espacio en apellidos compuestos (se juegan como dos palabras, ej. "AREVALO RIOS").
    const juego = normalizarApellido(ov.apellido_juego || mostrar);
    const soloLetras = juego.replace(/ /g, '');
    if (soloLetras.length < 3 || soloLetras.length > 15) motivos.push(`largo fuera de rango (${soloLetras.length})`);
    if (ov.apellido_mostrar || ov.apellido_juego) motivos.length = 0; // corregido a mano
    const j = {
      numero: t.numero ? Number(t.numero) : c.numero ? Number(c.numero) : null,
      apellido_mostrar: mostrar,
      apellido_juego: juego,
      nombre_completo: t.nombre_completo,
      posicion: t.posicion,
      capitan: Boolean(t.capitan || c.capitan),
      tm_id: t.tm_id,
      _gk: esArquero(t.posicion),
      _top: c.top ?? null,
      _left: c.left ?? null,
    };
    if (motivos.length) revisar.push({ ...j, motivos });
    return j;
  });

  // Validaciones
  if (jugadores.length !== 11) errores.push(`${jugadores.length} titulares (se esperan 11)`);
  const gks = jugadores.filter((j) => j._gk).length;
  if (gks !== 1) errores.push(`${gks} arqueros (se espera 1)`);
  const nums = jugadores.map((j) => j.numero);
  if (nums.some((n) => !n)) errores.push('faltan números de camiseta');
  if (new Set(nums).size !== nums.length) errores.push('números de camiseta repetidos');
  const filas = parsearFormacion(formacion);
  if (!filas) errores.push(`formación inválida (${formacion || 'no encontrada'})`);
  const dup = {};
  jugadores.forEach((j) => (dup[j.apellido_juego] = (dup[j.apellido_juego] || 0) + 1));
  Object.entries(dup)
    .filter(([, n]) => n > 1)
    .forEach(([ap]) => avisos.push(`apellido repetido en el once: ${ap}`));

  if (filas && gks === 1 && jugadores.length === 11) {
    const r = ordenarEnFilas(jugadores, filas);
    jugadores = r.jugadores;
    avisos.push(...r.avisos);
  }
  jugadores = jugadores.map(({ _gk, _top, _left, ...j }) => j);

  const nombreOnce = lado ? cab.visitante.nombre : cab.local.nombre;
  const nombreRival = lado ? cab.local.nombre : cab.visitante.nombre;
  const clubOnce = buscarClub(nombreOnce, equipos);
  if (!clubOnce) avisos.push(`club "${nombreOnce}" no está en equipos.json (camiseta gris)`);

  return {
    partido: {
      id: `tm-${entrada.id}`,
      fecha: cab.fecha,
      competicion: cab.competicion,
      ronda: cab.ronda,
      local: cab.local.nombre,
      visitante: cab.visitante.nombre,
      resultado: cab.resultado,
      equipo_del_once: lado ? 'visitante' : 'local',
      club_once: clubOnce,
      club_rival: buscarClub(nombreRival, equipos),
      formacion,
      dato_curioso: entrada.dato || '',
      jugadores,
      url_transfermarkt: entrada.canonica,
      verificado: errores.length === 0,
      errores,
      avisos,
    },
    revisar,
  };
}

// ---------- main ----------
function leerEntrada() {
  if (!fs.existsSync(ENTRADA)) {
    console.error(`No existe ${path.relative(ROOT, ENTRADA)}`);
    process.exit(1);
  }
  return fs
    .readFileSync(ENTRADA, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const [url, lado, dato] = l.split('|').map((x) => (x || '').trim());
      return { ...urlsPartido(url), lado: /visit/i.test(lado) ? 'visitante' : 'local', dato: dato || '' };
    });
}

function escribirRevisar(items) {
  const lineas = [
    '# Apellidos a revisar',
    '',
    'Corregí en `data/apellidos_override.json` usando el `tm_id` del jugador, por ejemplo:',
    '`{ "12345": { "apellido_mostrar": "De Arrascaeta", "apellido_juego": "DEARRASCAETA" } }`',
    '',
    '| Partido | # | Mostrar | Juego | Largo | Nombre completo | tm_id | Motivo |',
    '|---|---|---|---|---|---|---|---|',
  ];
  for (const r of items)
    lineas.push(
      `| ${r.partido} | ${r.numero ?? ''} | ${r.apellido_mostrar} | ${r.apellido_juego} | ${r.apellido_juego.length} | ${r.nombre_completo} | ${r.tm_id} | ${r.motivos.join('; ')} |`,
    );
  if (!items.length) lineas.push('| — | | | | | | | nada para revisar |');
  fs.writeFileSync(path.join(DATA, 'apellidos_revisar.md'), lineas.join('\n') + '\n');
}

async function main() {
  const entradas = leerEntrada();
  const equipos = JSON.parse(fs.readFileSync(path.join(DATA, 'equipos.json'), 'utf8'));
  const ovPath = path.join(DATA, 'apellidos_override.json');
  const overrides = fs.existsSync(ovPath) ? JSON.parse(fs.readFileSync(ovPath, 'utf8')) : {};
  const partidos = [];
  const revisar = [];
  let bloqueo = null;

  for (const e of entradas) {
    let htmlB, htmlA;
    try {
      htmlB = await obtener(e.bericht, e.id, 'informe');
      htmlA = await obtener(e.aufstellung, e.id, 'alineacion');
    } catch (err) {
      if (err instanceof Bloqueo) {
        bloqueo = err.message;
        break;
      }
      throw err;
    }
    if (!htmlB && !htmlA) {
      console.log(`- ${e.id}: sin HTML (pendiente)`);
      continue;
    }
    const { partido, revisar: rv } = armarPartido(e, htmlB, htmlA, equipos, overrides);
    partidos.push(partido);
    rv.forEach((r) => revisar.push({ ...r, partido: `${partido.local} vs ${partido.visitante} (${partido.fecha})` }));
    const est = partido.verificado ? 'OK ' : 'ERR';
    console.log(
      `${est} ${partido.fecha} | ${partido.local} ${partido.resultado} ${partido.visitante} | ${partido.competicion || '?'} | XI: ${partido.equipo_del_once} ${partido.formacion || ''}` +
        (partido.errores.length ? `\n     errores: ${partido.errores.join('; ')}` : '') +
        (partido.avisos.length ? `\n     avisos: ${partido.avisos.join('; ')}` : ''),
    );
  }

  // Conserva partidos ya cargados que no se procesaron en esta corrida (p.ej. por bloqueo).
  const prev = fs.existsSync(path.join(DATA, 'matches.json'))
    ? JSON.parse(fs.readFileSync(path.join(DATA, 'matches.json'), 'utf8'))
    : [];
  const nuevos = new Map(partidos.map((p) => [p.id, p]));
  const orden = entradas.map((e) => `tm-${e.id}`);
  const todos = [...orden.map((id) => nuevos.get(id) || prev.find((p) => p.id === id)).filter(Boolean)];
  fs.writeFileSync(path.join(DATA, 'matches.json'), JSON.stringify(todos, null, 2) + '\n');
  escribirRevisar(revisar);

  const ok = todos.filter((p) => p.verificado).length;
  console.log(`\nmatches.json: ${todos.length} partidos, ${ok} verificados. Requests hechos: ${fetches}.`);
  console.log(`apellidos_revisar.md: ${revisar.length} jugadores.`);
  if (bloqueo) {
    console.error(`\n⛔ FRENADO: ${bloqueo}`);
    process.exit(2);
  }
}

export { armarPartido, sacarApellido, parsearFormacion };

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
