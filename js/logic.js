// Lógica pura del juego (sin DOM). La usan la UI, el scraper y los tests.

export const MAX_INTENTOS = 6;

// Mayúsculas, sin tildes/diéresis, sin espacios, guiones, apóstrofes ni puntos.
// La Ñ se convierte en N (el teclado no tiene Ñ; esos casos van a apellidos_revisar.md).
export function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}

// Igual que normalizar(), pero conserva un solo espacio entre palabras (apellidos
// compuestos como "Arévalo Ríos" se juegan como dos palabras, no como una sola).
export function normalizarApellido(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Evaluación tipo Wordle con manejo correcto de letras repetidas:
// 1) marca verdes; 2) con las letras sobrantes de la solución marca amarillos de izquierda a derecha.
export function evaluar(intento, solucion) {
  const g = intento.split('');
  const s = solucion.split('');
  const res = new Array(g.length).fill('gris');
  const sobrantes = {};
  for (let i = 0; i < s.length; i++) {
    if (g[i] === s[i]) res[i] = 'verde';
    else sobrantes[s[i]] = (sobrantes[s[i]] || 0) + 1;
  }
  for (let i = 0; i < g.length; i++) {
    if (res[i] === 'verde') continue;
    if (sobrantes[g[i]] > 0) {
      res[i] = 'amarillo';
      sobrantes[g[i]]--;
    }
  }
  return res;
}

// Estado del teclado: cada letra toma el mejor color visto (verde > amarillo > gris).
const RANGO = { gris: 1, amarillo: 2, verde: 3 };
export function estadoTeclado(intentos, solucion) {
  const out = {};
  for (const intento of intentos) {
    const ev = evaluar(intento, solucion);
    intento.split('').forEach((l, i) => {
      if (!out[l] || RANGO[ev[i]] > RANGO[out[l]]) out[l] = ev[i];
    });
  }
  return out;
}

// Estado de un jugador a partir de sus intentos guardados.
export function estadoJugador(intentos, solucion, rendido = false) {
  if (intentos.includes(solucion)) return 'resuelto';
  if (intentos.length >= MAX_INTENTOS) return 'fallado';
  if (rendido) return 'revelado';
  return 'pendiente';
}

// Parte la formación "4-2-3-1" en [4,2,3,1]. Devuelve null si no suma 10.
export function parsearFormacion(f) {
  const m = String(f || '').match(/\d(?:\s*-\s*\d){1,5}/);
  if (!m) return null;
  const partes = m[0].split('-').map((x) => parseInt(x, 10));
  return partes.reduce((a, b) => a + b, 0) === 10 ? partes : null;
}
