import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizar, normalizarApellido, evaluar, estadoTeclado, estadoJugador, parsearFormacion } from '../js/logic.js';

test('normalizar', () => {
  assert.equal(normalizar('De Arrascaeta'), 'DEARRASCAETA');
  assert.equal(normalizar('Fernández'), 'FERNANDEZ');
  assert.equal(normalizar('Muñoz'), 'MUNOZ');
  assert.equal(normalizar("D'Alessandro"), 'DALESSANDRO');
  assert.equal(normalizar('Cabrera-Rey'), 'CABRERAREY');
});

test('normalizarApellido conserva un espacio entre palabras', () => {
  assert.equal(normalizarApellido('Arévalo Ríos'), 'AREVALO RIOS');
  assert.equal(normalizarApellido('Pereira'), 'PEREIRA');
  assert.equal(normalizarApellido('  De   León  '), 'DE LEON');
});

test('evaluar básico', () => {
  assert.deepEqual(evaluar('NEPOR', 'NEEUR'), ['verde', 'verde', 'gris', 'gris', 'verde']);
});

test('letras repetidas estilo Wordle', () => {
  // solución con una sola E: solo la primera E sobrante se marca amarilla
  assert.deepEqual(evaluar('EERIE', 'SOSAE'), ['gris', 'gris', 'gris', 'gris', 'verde']);
  assert.deepEqual(evaluar('EEXXX', 'AXEAA'), ['amarillo', 'gris', 'amarillo', 'gris', 'gris']);
  // verde tiene prioridad sobre amarillo anterior
  assert.deepEqual(evaluar('AAB', 'BCA'), ['amarillo', 'gris', 'amarillo']);
  assert.deepEqual(evaluar('LLAMA', 'SALLA'), ['amarillo', 'amarillo', 'amarillo', 'gris', 'verde']);
  assert.deepEqual(evaluar('OLIVA', 'OLIVERA'.slice(0, 5)), ['verde', 'verde', 'verde', 'verde', 'gris']);
});

test('teclado toma el mejor color', () => {
  const t = estadoTeclado(['SALLA', 'LLAMA'], 'SALLA');
  assert.equal(t.S, 'verde');
  assert.equal(t.L, 'verde');
  assert.equal(t.M, 'gris');
});

test('estado jugador', () => {
  assert.equal(estadoJugador([], 'SOSA'), 'pendiente');
  assert.equal(estadoJugador(['SOSA'], 'SOSA'), 'resuelto');
  assert.equal(estadoJugador(Array(6).fill('XXXX'), 'SOSA'), 'fallado');
  assert.equal(estadoJugador(['XXXX'], 'SOSA', true), 'revelado');
});

test('formación', () => {
  assert.deepEqual(parsearFormacion('4-2-3-1 Attacking'), [4, 2, 3, 1]);
  assert.equal(parsearFormacion('4-4-3'), null);
});
