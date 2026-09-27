import { MAX_INTENTOS, normalizar, evaluar, estadoTeclado, estadoJugador, parsearFormacion } from './logic.js';

const $app = document.getElementById('app');
const CLAVE = 'onceuy.v1';

let partidos = [];
let equipos = {};
let esDemo = false;
let panel = null; // { partido, idx, actual }

// ---------- persistencia ----------
function cargarEstado() {
  try {
    const s = JSON.parse(localStorage.getItem(CLAVE));
    if (s && s.niveles) return { config: { arqueroPista: false, ...s.config }, niveles: s.niveles };
  } catch {}
  return { config: { arqueroPista: false }, niveles: {} };
}
let estado = cargarEstado();
function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch {}
}
function nivelDe(id) {
  if (!estado.niveles[id]) {
    estado.niveles[id] = { intentos: {}, rendido: false, pistaArquero: estado.config.arqueroPista };
    guardar();
  }
  return estado.niveles[id];
}

// ---------- estado derivado ----------
function estadoDe(p, i) {
  const n = estado.niveles[p.id] || { intentos: {}, rendido: false, pistaArquero: estado.config.arqueroPista };
  const intentos = n.intentos[i] || [];
  const j = p.jugadores[i];
  if (n.pistaArquero && j.fila === 0 && !intentos.length) return 'pista';
  return estadoJugador(intentos, j.apellido_juego, n.rendido);
}
const resuelto = (e) => e !== 'pendiente';
function resumenNivel(p) {
  const est = p.jugadores.map((_, i) => estadoDe(p, i));
  const hechos = est.filter((e) => e === 'resuelto' || e === 'pista').length;
  const terminado = est.every(resuelto);
  const tocado = Boolean(estado.niveles[p.id] && Object.keys(estado.niveles[p.id].intentos).length);
  return { est, hechos, terminado, tocado };
}

// ---------- utilidades ----------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function fechaCorta(f) {
  const m = String(f || '').match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${Number(m[3])}-${Number(m[2])}-${m[1]}` : f || '';
}
let toastT;
function toast(msg, ms = 1600) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('ver');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('ver'), ms);
}
function equipo(clave, nombreTM) {
  const e = { ...equipos._default, ...(equipos[clave] || {}) };
  if (!equipos[clave]) e.nombre = nombreTM;
  return e;
}
function nombresPartido(p) {
  const once = p.equipo_del_once === 'visitante' ? p.visitante : p.local;
  const rival = p.equipo_del_once === 'visitante' ? p.local : p.visitante;
  const o = equipo(p.club_once, once);
  return { once: p.colores_once ? { ...o, ...p.colores_once } : o, rival: equipo(p.club_rival, rival) };
}

// ---------- camiseta pixel (SVG) ----------
const FORMA = [
  '...XXX..XXX...',
  '.XXXXXXXXXXXX.',
  'XXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXX',
  'XXX.XXXXXXX.XX',
  '....XXXXXXX...',
  '...XXXXXXXX...',
  '...XXXXXXXX...',
  '...XXXXXXXX...',
  '...XXXXXXXX...',
  '...XXXXXXXX...',
  '...XXXXXXXX...',
].map((f) => f.slice(0, 14));
// Normalizo la forma para que sea simétrica: espejo de la mitad izquierda.
const SIL = FORMA.map((f) => f.slice(0, 7) + f.slice(0, 7).split('').reverse().join(''));

function colorCelda(x, y, e) {
  const { primario: p, secundario: s, patron } = e;
  const manga = y >= 2 && y <= 5 && (x <= 2 || x >= 11);
  if (y <= 1 && x >= 5 && x <= 8) return s; // cuello
  switch (patron) {
    case 'rayas': return x >= 3 && x <= 10 && Math.floor((x - 3) / 2) % 2 === 1 ? s : p;
    case 'banda': return !manga && Math.abs(x - 12 + y) <= 1 ? s : p;
    case 'mitad': return x < 7 ? p : s;
    case 'cuello': return manga && (x === 0 || x === 13 || y === 5) ? s : p;
    default: return manga && y === 5 ? s : p;
  }
}
function camisetaSVG(e, clase = 'camiseta') {
  const W = 14, H = SIL.length;
  const lleno = (x, y) => y >= 0 && y < H && x >= 0 && x < W && SIL[y][x] === 'X';
  let rects = '';
  for (let y = -1; y <= H; y++)
    for (let x = -1; x <= W; x++) {
      if (lleno(x, y)) rects += `<rect x="${x + 1}" y="${y + 1}" width="1" height="1" fill="${colorCelda(x, y, e)}"/>`;
      else if (lleno(x + 1, y) || lleno(x - 1, y) || lleno(x, y + 1) || lleno(x, y - 1))
        rects += `<rect x="${x + 1}" y="${y + 1}" width="1" height="1" fill="#0b0b0b"/>`;
    }
  return `<svg class="${clase}" viewBox="0 0 ${W + 2} ${H + 2}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}
function camisetaArquero(e) {
  const amarillo = /^#f[a-f0-9]d/i.test(e.primario) || e.primario.toLowerCase() === '#ffd100';
  return { primario: amarillo ? '#22c55e' : '#f5d90a', secundario: '#111111', numero: '#111111', patron: 'liso' };
}

// Pelota en pixel art: círculo blanco con contorno negro automático (mismo método
// que camisetaSVG) y un parche negro tipo pentágono adentro, como el ícono ⚽.
const PELOTA_SIL = [
  '....XXX....',
  '..XXXXXXX..',
  '.XXXXXXXXX.',
  'XXXXXXXXXXX',
  'XXXXXXXXXXX',
  'XXXXXXXXXXX',
  'XXXXXXXXXXX',
  'XXXXXXXXXXX',
  '.XXXXXXXXX.',
  '..XXXXXXX..',
  '....XXX....',
];
const PELOTA_PARCHE = new Set([
  '4,4', '4,5', '4,6',
  '5,3', '5,4', '5,5', '5,6', '5,7',
  '6,4', '6,5', '6,6',
  '7,5',
]);
function pelotaSVG() {
  const H = PELOTA_SIL.length, W = PELOTA_SIL[0].length;
  const lleno = (x, y) => y >= 0 && y < H && x >= 0 && x < W && PELOTA_SIL[y][x] === 'X';
  let rects = '';
  for (let y = -1; y <= H; y++)
    for (let x = -1; x <= W; x++) {
      if (lleno(x, y)) {
        const negro = PELOTA_PARCHE.has(`${y},${x}`);
        rects += `<rect x="${x + 1}" y="${y + 1}" width="1" height="1" fill="${negro ? '#111111' : '#f4f4f4'}"/>`;
      } else if (lleno(x + 1, y) || lleno(x - 1, y) || lleno(x, y + 1) || lleno(x, y - 1)) {
        rects += `<rect x="${x + 1}" y="${y + 1}" width="1" height="1" fill="#111111"/>`;
      }
    }
  return `<svg class="pelota" viewBox="0 0 ${W + 2} ${H + 2}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

// ---------- carga de datos ----------
async function cargar() {
  const [eq, ms] = await Promise.all([
    fetch('data/equipos.json').then((r) => r.json()),
    fetch('data/matches.json').then((r) => (r.ok ? r.json() : [])).catch(() => []),
  ]);
  equipos = eq;
  partidos = ms.filter((p) => p.verificado);
  if (!partidos.length) {
    esDemo = true;
    partidos = await fetch('data/demo.json').then((r) => r.json());
  }
}

// ---------- router ----------
function ruta() {
  cerrarPanel(false);
  const m = location.hash.match(/^#\/nivel\/(.+)$/);
  const p = m && partidos.find((x) => x.id === decodeURIComponent(m[1]));
  if (p) vistaPartido(p);
  else vistaNiveles();
  window.scrollTo(0, 0);
}

// ---------- pantalla de niveles ----------
function vistaNiveles() {
  const completos = partidos.filter((p) => resumenNivel(p).terminado).length;
  const items = partidos
    .map((p, i) => {
      const r = resumenNivel(p);
      const { once, rival } = nombresPartido(p);
      const cls = r.terminado ? 'completo' : r.tocado ? 'encurso' : '';
      const etq = r.terminado ? `${r.hechos}/11` : r.tocado ? 'en curso' : 'pendiente';
      return `<li><button class="nivel ${cls}" data-id="${esc(p.id)}">
        <span class="num">${i + 1}</span>
        ${camisetaSVG(once)}
        <span><div class="t1">XI de ${esc(once.nombre)}</div><div class="t2">vs ${esc(rival.nombre)} · ${esc(fechaCorta(p.fecha))}</div></span>
        <span class="estado">${etq}</span>
      </button></li>`;
    })
    .join('');
  $app.innerHTML = `
    <header class="home-top">
      <button class="btn-link engranaje" id="ajustes" aria-label="Ajustes">⚙</button>
      <h1 class="logo">ONCE<br><span>URUGUAYO</span></h1>
      <p class="sub">Adiviná el once titular. Partidos reales desde 2020.</p>
      <div class="stats">${completos}/${partidos.length} completados</div>
    </header>
    ${esDemo ? '<div class="aviso-demo"><b>Modo demo:</b> todavía no hay partidos verificados. Este nivel usa jugadores ficticios para probar el juego.</div>' : ''}
    <ul class="lista">${items || '<li class="vacio">No hay niveles.</li>'}</ul>`;
  $app.querySelectorAll('.nivel').forEach((b) =>
    b.addEventListener('click', () => (location.hash = `#/nivel/${encodeURIComponent(b.dataset.id)}`)),
  );
  $app.querySelector('#ajustes').addEventListener('click', abrirAjustes);
}

function abrirAjustes() {
  const fondo = modal(`
    <h2>Ajustes</h2>
    <label class="ajuste"><span>Arquero revelado como pista<br><small style="color:var(--texto-2)">Aplica a los niveles que empieces de ahora en más.</small></span>
      <input type="checkbox" id="optArq" ${estado.config.arqueroPista ? 'checked' : ''}></label>
    <div class="botones" style="margin-top:16px">
      <button class="btn peligro" id="borrar">Borrar progreso</button>
      <button class="btn primario" id="cerrar">Listo</button>
    </div>`);
  fondo.querySelector('#optArq').addEventListener('change', (e) => {
    estado.config.arqueroPista = e.target.checked;
    guardar();
  });
  fondo.querySelector('#borrar').addEventListener('click', () => {
    if (!confirm('¿Borrar todo el progreso?')) return;
    estado = { config: estado.config, niveles: {} };
    guardar();
    fondo.remove();
    vistaNiveles();
  });
  fondo.querySelector('#cerrar').addEventListener('click', () => fondo.remove());
}

// ---------- pantalla de partido ----------
function vistaPartido(p) {
  nivelDe(p.id);
  const { once, rival } = nombresPartido(p);
  const [gl, gv] = String(p.resultado).match(/\d+/g) || ['?', '?'];
  const extra = (String(p.resultado).match(/\((.*)\)/) || [])[1] || '';
  const marcador = p.equipo_del_once === 'visitante' ? `${gv}-${gl}` : `${gl}-${gv}`;
  const localia = p.equipo_del_once === 'visitante' ? 'de visitante' : 'de local';
  const comp = [p.competicion, p.ronda].filter(Boolean).join(' · ');
  $app.innerHTML = `
    <div class="barra">
      <button class="btn-link" id="volver">← NIVELES</button>
      <span class="progreso" id="prog"></span>
    </div>
    <div class="cabecera">
      <div class="cab-eq">${camisetaSVG(once)}<div class="nom">XI de ${esc(once.nombre)}</div></div>
      <div class="cab-centro"><div class="marcador">${marcador}${extra ? `<small>${esc(extra)}</small>` : ''}</div><div class="fecha">${esc(fechaCorta(p.fecha))}</div></div>
      <div class="cab-eq rival">${camisetaSVG(rival.nombre && equipos[p.club_rival] ? rival : equipos._default)}<div class="nom">vs ${esc(rival.nombre)}</div></div>
    </div>
    <div class="comp">${esc(comp)} · ${localia}</div>
    <div class="cancha" id="cancha"></div>
    <div class="acciones">
      <button class="btn peligro" id="rindo">Me rindo</button>
      <button class="btn" id="verRes" hidden>Resumen</button>
    </div>`;
  $app.querySelector('#volver').addEventListener('click', () => (location.hash = '#/'));
  $app.querySelector('#rindo').addEventListener('click', () => {
    if (!confirm('¿Te rendís? Se revelan todos los que faltan.')) return;
    estado.niveles[p.id].rendido = true;
    guardar();
    pintarCancha(p);
    mostrarResumen(p);
  });
  $app.querySelector('#verRes').addEventListener('click', () => mostrarResumen(p));
  pintarCancha(p);
}

function filasDe(p) {
  const f = parsearFormacion(p.formacion) || [];
  const filas = [[], ...f.map(() => [])];
  p.jugadores.forEach((j, i) => (filas[j.fila] || filas[filas.length - 1]).push(i));
  return filas;
}

const LINEAS = `<svg class="lineas" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true">
  <g fill="none" stroke="#8ed62d" stroke-width="3" vector-effect="non-scaling-stroke">
    <line x1="0" y1="75" x2="100" y2="75" vector-effect="non-scaling-stroke"/>
    <polygon points="42,66 58,66 64,71 64,79 58,84 42,84 36,79 36,71" vector-effect="non-scaling-stroke"/>
    <rect x="20" y="0" width="60" height="22" vector-effect="non-scaling-stroke"/>
    <rect x="36" y="0" width="28" height="8" vector-effect="non-scaling-stroke"/>
    <rect x="20" y="128" width="60" height="22" vector-effect="non-scaling-stroke"/>
    <rect x="36" y="142" width="28" height="8" vector-effect="non-scaling-stroke"/>
  </g></svg>`;

function pintarCancha(p) {
  const { once } = nombresPartido(p);
  const n = estado.niveles[p.id];
  const filas = filasDe(p).reverse(); // ataque arriba, arquero abajo
  const html = filas
    .map(
      (fila) =>
        `<div class="fila">${fila
          .map((i) => {
            const j = p.jugadores[i];
            const e = estadoDe(p, i);
            const usados = (n.intentos[i] || []).length;
            const txt = e === 'pendiente' ? j.apellido_juego.replace(/[^ ]/g, '.') : esc(j.apellido_mostrar);
            const cam = j.fila === 0 ? camisetaArquero(once) : once;
            return `<button class="jug ${e}" data-i="${i}" aria-label="Camiseta ${j.numero}">
              <span class="camiseta-wrap">${camisetaSVG(cam)}<span class="dorsal" style="color:${cam.numero};--sombra:${cam.primario}">${j.numero}</span>${j.capitan ? '<span class="capi">C</span>' : ''}${j.goles ? `<span class="gol">${pelotaSVG()}${j.goles > 1 ? `<i>×${j.goles}</i>` : ''}</span>` : ''}</span>
              <span class="etiqueta"><span class="txt">${txt}</span><span class="cnt">${e === 'pista' ? '★' : usados}</span></span>
            </button>`;
          })
          .join('')}</div>`,
    )
    .join('');
  const cancha = document.getElementById('cancha');
  cancha.innerHTML = LINEAS + html;
  cancha.querySelectorAll('.jug').forEach((b) =>
    b.addEventListener('click', () => {
      const i = Number(b.dataset.i);
      const e = estadoDe(p, i);
      if (e === 'pendiente') abrirPanel(p, i);
      else {
        const j = p.jugadores[i];
        toast(`${j.numero} · ${j.nombre_completo}${j.posicion ? ' · ' + j.posicion : ''}`, 2200);
      }
    }),
  );
  const r = resumenNivel(p);
  document.getElementById('prog').textContent = `${r.hechos}/11`;
  document.getElementById('rindo').hidden = r.terminado;
  document.getElementById('verRes').hidden = !r.terminado;
}

// ---------- panel de adivinanza ----------
const TECLAS = ['QWERTYUIOP', 'ASDFGHJKL', '<ZXCVBNM>'];

function abrirPanel(p, idx) {
  panel = { p, idx, actual: '' };
  const j = p.jugadores[idx];
  const el = document.createElement('div');
  el.className = 'overlay';
  el.id = 'panel';
  el.innerHTML = `
    <button class="btn-link" id="atras">← VOLVER</button>
    <div class="info">#${j.numero}${j.posicion ? ' · ' + esc(j.posicion) : ''} · ${j.apellido_juego.replace(/ /g, '').length} letras</div>
    <div class="grilla" id="grilla"></div>
    <div class="teclado" id="teclado">${TECLAS.map(
      (f) =>
        `<div class="tf">${f
          .split('')
          .map((k) =>
            k === '<'
              ? '<button class="tecla ancha" data-k="BORRAR">Borrar</button>'
              : k === '>'
                ? '<button class="tecla ancha" data-k="ENVIAR">Enviar</button>'
                : `<button class="tecla" data-k="${k}">${k}</button>`,
          )
          .join('')}</div>`,
    ).join('')}</div>`;
  document.body.appendChild(el);
  el.querySelector('#atras').addEventListener('click', () => cerrarPanel());
  el.querySelectorAll('.tecla').forEach((b) =>
    b.addEventListener('click', (ev) => {
      ev.preventDefault();
      tecla(b.dataset.k);
    }),
  );
  pintarPanel();
}

function cerrarPanel(repintar = true) {
  const el = document.getElementById('panel');
  if (!el) return;
  el.remove();
  const p = panel && panel.p;
  panel = null;
  if (repintar && p) {
    pintarCancha(p);
    if (resumenNivel(p).terminado) setTimeout(() => mostrarResumen(p), 250);
  }
}

function pintarPanel(animarFila = -1) {
  const { p, idx, actual } = panel;
  const sol = p.jugadores[idx].apellido_juego;
  const L = sol.length;
  const intentos = estado.niveles[p.id].intentos[idx] || [];
  const ancho = Math.min(window.innerWidth, 520) - 24;
  const tam = Math.max(16, Math.min(52, Math.floor((ancho - (L - 1) * 5) / L)));
  const fuente = Math.max(10, Math.floor(tam * 0.5));
  let html = '';
  for (let r = 0; r < MAX_INTENTOS; r++) {
    const g = intentos[r];
    const ev = g ? evaluar(g, sol) : null;
    const letras = g || (r === intentos.length ? actual : '');
    html += `<div class="fila-g" style="grid-template-columns:repeat(${L},${tam}px)">`;
    for (let c = 0; c < L; c++) {
      if (sol[c] === ' ') {
        html += `<div class="tile hueco" style="width:${Math.round(tam / 2)}px;height:${tam}px;"></div>`;
        continue;
      }
      const l = letras[c] || '';
      const cls = ev ? `${ev[c]}${r === animarFila ? ' flip' : ''}` : l ? 'lleno' : '';
      const delay = r === animarFila ? `animation-delay:${c * 60}ms;` : '';
      html += `<div class="tile ${cls}" style="width:${tam}px;height:${tam}px;font-size:${fuente}px;${delay}">${l}</div>`;
    }
    html += '</div>';
  }
  document.getElementById('grilla').innerHTML = html;
  const colores = estadoTeclado(intentos, sol);
  document.querySelectorAll('#teclado .tecla').forEach((b) => {
    b.classList.remove('verde', 'amarillo', 'gris');
    if (colores[b.dataset.k]) b.classList.add(colores[b.dataset.k]);
  });
}

function tecla(k) {
  if (!panel || panel.bloqueado) return;
  const { p, idx } = panel;
  const sol = p.jugadores[idx].apellido_juego;
  if (k === 'BORRAR') {
    panel.actual = panel.actual.slice(0, -1);
    while (panel.actual.length && sol[panel.actual.length - 1] === ' ') panel.actual = panel.actual.slice(0, -1);
  } else if (k === 'ENVIAR') return enviar();
  else if (/^[A-Z]$/.test(k)) {
    // los apellidos compuestos ("AREVALO RIOS") rellenan el espacio solos: no hace falta tipearlo.
    while (panel.actual.length < sol.length && sol[panel.actual.length] === ' ') panel.actual += ' ';
    if (panel.actual.length < sol.length) panel.actual += k;
  }
  pintarPanel();
}

function enviar() {
  const { p, idx } = panel;
  const j = p.jugadores[idx];
  const sol = j.apellido_juego;
  const n = estado.niveles[p.id];
  const intentos = (n.intentos[idx] = n.intentos[idx] || []);
  if (panel.actual.length < sol.length) {
    toast('Faltan letras');
    const filas = document.querySelectorAll('#grilla .fila-g');
    const f = filas[intentos.length];
    if (f) { f.classList.remove('sacudir'); void f.offsetWidth; f.classList.add('sacudir'); }
    return;
  }
  intentos.push(panel.actual);
  panel.actual = '';
  guardar();
  pintarPanel(intentos.length - 1);
  const e = estadoJugador(intentos, sol);
  if (e === 'resuelto') {
    panel.bloqueado = true;
    toast(`¡Bien! ${j.apellido_mostrar}`);
    setTimeout(() => cerrarPanel(), 1300);
  } else if (e === 'fallado') {
    panel.bloqueado = true;
    toast(`Era ${j.apellido_mostrar}`, 2200);
    setTimeout(() => cerrarPanel(), 1900);
  }
}

document.addEventListener('keydown', (ev) => {
  if (!panel || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  if (ev.key === 'Enter') tecla('ENVIAR');
  else if (ev.key === 'Backspace') tecla('BORRAR');
  else if (ev.key === 'Escape') cerrarPanel();
  else {
    const l = normalizar(ev.key);
    if (l.length === 1) tecla(l);
    else return;
  }
  ev.preventDefault();
});

// ---------- resumen y compartir ----------
function modal(html) {
  const fondo = document.createElement('div');
  fondo.className = 'modal-fondo';
  fondo.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  fondo.addEventListener('click', (e) => e.target === fondo && fondo.remove());
  document.body.appendChild(fondo);
  return fondo;
}

function emojiDe(p, i) {
  const e = estadoDe(p, i);
  if (e === 'pista') return '⬜';
  if (e !== 'resuelto') return '🟥';
  const k = estado.niveles[p.id].intentos[i].length;
  return k <= 2 ? '🟩' : k <= 4 ? '🟨' : '🟧';
}

function textoCompartir(p) {
  const { once, rival } = nombresPartido(p);
  const r = resumenNivel(p);
  const nro = partidos.indexOf(p) + 1;
  const total = Object.values(estado.niveles[p.id].intentos).reduce((a, x) => a + x.length, 0);
  const grilla = filasDe(p)
    .reverse()
    .map((f) => f.map((i) => emojiDe(p, i)).join(''))
    .join('\n');
  return `⚽ Once Uruguayo · Nivel ${nro}\nXI de ${once.nombre} vs ${rival.nombre} (${fechaCorta(p.fecha)})\n${r.hechos}/11 · ${total} intentos\n\n${grilla}\n\n${location.origin}${location.pathname}`;
}

function mostrarResumen(p) {
  document.querySelectorAll('.modal-fondo').forEach((m) => m.remove());
  const r = resumenNivel(p);
  const n = estado.niveles[p.id];
  const filas = p.jugadores
    .map((j, i) => {
      const e = r.est[i];
      const k = (n.intentos[i] || []).length;
      const col =
        e === 'resuelto' ? `<span class="ok">${k}/${MAX_INTENTOS}</span>`
        : e === 'pista' ? '<span class="pst">pista</span>'
        : e === 'fallado' ? '<span class="mal">✗ 6/6</span>'
        : `<span class="mal">rendido${k ? ` (${k})` : ''}</span>`;
      return `<tr><td>${j.numero}</td><td>${esc(j.apellido_mostrar)}${j.capitan ? ' (C)' : ''}${j.goles ? ` ⚽${j.goles > 1 ? `×${j.goles}` : ''}` : ''}</td><td>${col}</td></tr>`;
    })
    .join('');
  const idx = partidos.indexOf(p);
  const sig = partidos[idx + 1];
  const titulo = r.hechos === 11 ? '¡Once completo!' : r.hechos >= 8 ? '¡Muy bien!' : 'Terminado';
  const fondo = modal(`
    <h2>${titulo}</h2>
    <p class="res">${r.hechos}/11 adivinados</p>
    ${p.dato_curioso ? `<div class="dato"><b>DATO</b>${esc(p.dato_curioso)}</div>` : ''}
    <table class="tabla-res">${filas}</table>
    <div class="botones">
      <button class="btn primario full" id="compartir">Compartir</button>
      <button class="btn" id="verCancha">Ver cancha</button>
      ${sig ? '<button class="btn" id="siguiente">Siguiente →</button>' : '<button class="btn" id="niveles">Niveles</button>'}
    </div>`);
  fondo.querySelector('#compartir').addEventListener('click', async () => {
    const texto = textoCompartir(p);
    try {
      if (navigator.share) await navigator.share({ text: texto });
      else {
        await navigator.clipboard.writeText(texto);
        toast('Copiado al portapapeles');
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      try { await navigator.clipboard.writeText(texto); toast('Copiado al portapapeles'); }
      catch { prompt('Copiá el resultado:', texto); }
    }
  });
  fondo.querySelector('#verCancha').addEventListener('click', () => fondo.remove());
  const s = fondo.querySelector('#siguiente');
  if (s) s.addEventListener('click', () => { fondo.remove(); location.hash = `#/nivel/${encodeURIComponent(sig.id)}`; });
  const nv = fondo.querySelector('#niveles');
  if (nv) nv.addEventListener('click', () => { fondo.remove(); location.hash = '#/'; });
}

// ---------- inicio ----------
window.addEventListener('hashchange', () => {
  document.querySelectorAll('.modal-fondo').forEach((m) => m.remove());
  ruta();
});
cargar()
  .then(ruta)
  .catch((e) => {
    console.error(e);
    $app.innerHTML = '<p class="vacio">No se pudieron cargar los datos. Abrí el juego desde un servidor (npm run serve).</p>';
  });
