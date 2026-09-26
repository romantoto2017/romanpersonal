// Prueba el parser con HTML SINTÉTICO que imita la estructura de Transfermarkt.
// Nombres ficticios. Cuando haya HTML real en /cache, conviene sumar un test con ese archivo.
import test from 'node:test';
import assert from 'node:assert/strict';
import { armarPartido, sacarApellido } from '../scraper/scrape.mjs';

const XI = [
  [1, 'Juan Pereyra', 'J. Pereyra', 'Goalkeeper', 90, 50],
  [2, 'Pablo de León', 'P. De León', 'Centre-Back', 72, 38],
  [4, 'Luis Da Silva', 'L. Da Silva', 'Right-Back', 70, 80],
  [6, 'Ana Fernández', 'A. Fernández', 'Centre-Back', 72, 62],
  [3, 'Mario Muñoz', 'M. Muñoz', 'Left-Back', 70, 20],
  [5, 'Raúl Rodríguez', 'R. Rodríguez', 'Central Midfield', 50, 50],
  [8, 'Ciro Sosa', 'C. Sosa', 'Central Midfield', 52, 30],
  [10, 'Omar Olivera', 'O. Olivera', 'Attacking Midfield', 52, 70],
  [7, 'Caco Cabrera', 'C. Cabrera', 'Right Winger', 25, 80],
  [9, 'Pelado', 'Pelado', 'Centre-Forward', 20, 50],
  [11, 'Sergio Silveira', 'S. Silveira', 'Left Winger', 25, 20],
];

function html(xi, formacion = '4-3-3') {
  const cancha = (arr) =>
    arr.map(([n, , corto, , top, left], i) => `<div class="aufstellung-spieler-container" style="top: ${top}%; left: ${left}%;">
      <div class="aufstellung-rueckennummer-name"><div class="tm-shirt-number">${n}</div>
      <span><a href="/x/profil/spieler/${1000 + i}">${corto}</a></span>${n === 2 ? '<span class="kapitaenicon-formation"></span>' : ''}</div></div>`).join('');
  const tabla = (arr) =>
    `<table class="items">${arr.map(([n, completo, , pos], i) => `<tr><td class="rn_nummer">${n}</td><td><table class="inline-table"><tr><td><a href="/x/profil/spieler/${1000 + i}" title="${completo}">${completo}</a>${n === 2 ? '<span class="kapitaenicon-table" title="Captain"></span>' : ''}</td></tr><tr><td>${pos}, 25</td></tr></table></td></tr>`).join('')}</table>`;
  return `<html><body>
  <div class="direct-headline__header">Primera División Apertura</div>
  <div class="sb-team sb-heim"><a class="sb-vereinslink" href="/x/startseite/verein/1">Club Demo</a></div>
  <div class="sb-team sb-gast"><a class="sb-vereinslink" href="/x/startseite/verein/2">Liverpool FC Montevideo</a></div>
  <p class="sb-datum">Final | <a href="/aktuell/waspassiertheute/aktuell/new/datum/2023-12-16">Sat, 12/16/23</a> | 8:30 PM</p>
  <div class="sb-endstand">1:2 <div class="sb-halbzeit">(0:1)</div></div>
  <div class="row">
    <div class="large-6 columns"><div class="aufstellung-vereinsseite">Starting Line-up: ${formacion}</div>${cancha(xi)}
      <div class="box"><h2 class="content-box-headline">Club Demo</h2>${tabla(xi)}</div></div>
    <div class="large-6 columns"><div class="aufstellung-vereinsseite">Starting Line-up: 4-4-2</div>${cancha(xi)}
      <div class="box"><h2 class="content-box-headline">Liverpool</h2>${tabla(xi)}</div></div>
  </div></body></html>`;
}

const equipos = { liverpool: { alias: ['Liverpool FC Montevideo'] } };

test('partido válido', () => {
  const h = html(XI);
  const { partido, revisar } = armarPartido({ id: '1', lado: 'local', dato: '', canonica: 'u' }, h, h, equipos, {});
  assert.deepEqual(partido.errores, []);
  assert.equal(partido.verificado, true);
  assert.equal(partido.fecha, '2023-12-16');
  assert.equal(partido.resultado, '1-2');
  assert.equal(partido.ronda, 'Final');
  assert.equal(partido.formacion, '4-3-3');
  assert.equal(partido.jugadores[0].apellido_juego, 'PEREYRA');
  assert.equal(partido.jugadores[0].fila, 0);
  // defensa ordenada de izquierda a derecha
  assert.deepEqual(partido.jugadores.filter((j) => j.fila === 1).map((j) => j.numero), [3, 2, 6, 4]);
  assert.equal(partido.jugadores.find((j) => j.numero === 2).capitan, true);
  assert.equal(partido.jugadores.find((j) => j.numero === 2).apellido_mostrar, 'De León');
  const motivos = Object.fromEntries(revisar.map((r) => [r.apellido_mostrar, r.motivos.join()]));
  assert.match(motivos['De León'], /partícula/);
  assert.match(motivos['Muñoz'], /especiales/);
  assert.match(motivos['Pelado'], /un solo nombre/);
});

test('visitante y club conocido', () => {
  const h = html(XI);
  const { partido } = armarPartido({ id: '1', lado: 'visitante', dato: 'x', canonica: 'u' }, h, h, equipos, {});
  assert.equal(partido.club_once, 'liverpool');
  assert.equal(partido.formacion, '4-4-2');
});

test('validaciones: 10 titulares, números repetidos, sin arquero', () => {
  const malo = XI.slice(1).map((x) => [...x]);
  malo[1][0] = 2;
  const h = html(malo);
  const { partido } = armarPartido({ id: '1', lado: 'local', canonica: 'u' }, h, h, equipos, {});
  assert.equal(partido.verificado, false);
  assert.ok(partido.errores.some((e) => /10 titulares/.test(e)));
  assert.ok(partido.errores.some((e) => /repetidos/.test(e)));
  assert.ok(partido.errores.some((e) => /0 arqueros/.test(e)));
});

test('override manual pisa lo extraído', () => {
  const h = html(XI);
  const ov = { 1009: { apellido_mostrar: 'Pelado Díaz' } };
  const { partido } = armarPartido({ id: '1', lado: 'local', canonica: 'u' }, h, h, equipos, ov);
  const j = partido.jugadores.find((x) => x.numero === 9);
  // apellido compuesto: conserva el espacio (se juega como dos palabras)
  assert.equal(j.apellido_juego, 'PELADO DIAZ');
});

test('sacarApellido', () => {
  assert.equal(sacarApellido('G. de Arrascaeta').apellido_mostrar, 'De Arrascaeta');
  assert.equal(sacarApellido('J. M. Pérez').apellido_mostrar, 'Pérez');
});
