#!/usr/bin/env node
// Baja calendarios (spielplan) de clubes en Transfermarkt y los vuelca a JSON.
//
// Uso: node scraper/fixtures.mjs <dirCache> <salida.json> <club:verein_id> [...] --temporadas 2018-2025
//   ej: node scraper/fixtures.mjs /tmp/fx fixtures.json nacional:866 penarol:861 --temporadas 2018-2025
// saison_id N = temporada uruguaya N+1 (ej. 2023 → torneos 2024).
// Pausa 4 s entre requests; ante 403/405/429 reintenta UNA vez a los 9 s y si sigue, frena.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as cheerio from 'cheerio';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const limpio = (t) => String(t || '').replace(/\s+/g, ' ').trim();

const args = process.argv.slice(2);
const [dir, salida] = args;
const iT = args.indexOf('--temporadas');
const [t0, t1] = (iT >= 0 ? args[iT + 1] : '2018-2025').split('-').map(Number);
const clubes = args.slice(2, iT >= 0 ? iT : undefined).map((c) => c.split(':'));

let pedidos = 0;
async function obtener(url, archivo) {
  if (fs.existsSync(archivo)) return fs.readFileSync(archivo, 'utf8');
  for (let intento = 0; intento < 2; intento++) {
    if (pedidos++ > 0) await dormir(intento ? 9000 : 4000);
    // curl (y no fetch de Node): pasa por el proxy del entorno y Transfermarkt no lo frena.
    const status = execFileSync('curl', ['-sS', '-A', UA, '-H', 'Accept-Language: en-US,en;q=0.9', '-o', archivo + '.tmp', '-w', '%{http_code}', url]).toString();
    if (status === '200') {
      fs.renameSync(archivo + '.tmp', archivo);
      return fs.readFileSync(archivo, 'utf8');
    }
    fs.rmSync(archivo + '.tmp', { force: true });
    const res = { status: Number(status) };
    if (![403, 405, 429].includes(res.status)) throw new Error(`HTTP ${res.status} en ${url}`);
  }
  throw new Error(`Bloqueado (403/405/429) en ${url}. Frenando.`);
}

function parsear(html, club, temporada) {
  const $ = cheerio.load(html);
  const out = [];
  $('.box').each((_, box) => {
    const comp = limpio($(box).find('h2, .content-box-headline').first().text());
    $(box)
      .find('table tbody tr')
      .each((_, tr) => {
        const a = $(tr).find('a[href*="/spielbericht/index/spielbericht/"]').first();
        const id = (String(a.attr('href') || '').match(/spielbericht\/(\d+)/) || [])[1];
        if (!id) return;
        const td = $(tr)
          .find('td')
          .map((_, t) => limpio($(t).text()))
          .get();
        const f = (td[1] || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
        out.push({
          id,
          club,
          temporada: temporada + 1,
          competicion: comp,
          ronda: td[0],
          fecha: f ? `${f[3]}-${f[2]}-${f[1]}` : null,
          lado: td[3] === 'H' ? 'local' : 'visitante',
          rival: limpio(td[6]).replace(/\s*\(\d+\.\)$/, ''),
          formacion: td[7],
          resultado: limpio(a.text()),
        });
      });
  });
  return out;
}

fs.mkdirSync(dir, { recursive: true });
const todos = [];
for (const [club, vid] of clubes)
  for (let t = t0; t <= t1; t++) {
    const archivo = path.join(dir, `sp_${vid}_${t}.html`);
    const html = await obtener(`https://www.transfermarkt.com/x/spielplan/verein/${vid}/saison_id/${t}`, archivo);
    const filas = parsear(html, club, t);
    todos.push(...filas);
    console.log(`${club} ${t + 1}: ${filas.length} partidos`);
  }
fs.writeFileSync(salida, JSON.stringify(todos, null, 1));
console.log(`Total ${todos.length} → ${salida} (requests: ${pedidos})`);
