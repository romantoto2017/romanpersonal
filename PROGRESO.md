# PROGRESO — Once Uruguayo

> Leé SOLO este archivo al retomar. No releas archivos grandes ni vuelvas a pedir páginas que ya estén en /cache.

## Etapa actual
**ETAPA 1 — casi completa.** Motor + UI terminados y testeados. Faltan los 5 partidos verificados.

**Bloqueo:** desde el entorno cloud de Claude Code, `www.transfermarkt.*` está bloqueado por la política de red (el proxy rechaza la conexión, 403). No se hizo ningún request exitoso a Transfermarkt y no se cargó ningún dato de memoria.
Opciones para destrabar:
1. Agregar `www.transfermarkt.com` (y/o `.es`, `.com.ar`) a los dominios permitidos del entorno (menú del entorno → Edit → Network access), o
2. Correr el scraper en tu compu (`npm install && npm run scrape`) y commitear `cache/` + `data/`, o
3. Guardar a mano desde el navegador el HTML de cada partido en `cache/<id>_informe.html` (página del informe) y `cache/<id>_alineacion.html` (página "Alineación") y correr `npm run scrape:cache`.

## Hecho
- Motor Wordle por jugador (`js/logic.js`): normalización, letras repetidas, teclado, estados. 11 tests OK (`npm test`).
- UI mobile-first pixel-art (`index.html`, `css/style.css`, `js/app.js`): niveles, cancha por formación, panel con teclado, "Me rindo", resumen, compartir con emojis, dato curioso, ajuste "arquero como pista" (default: activado), progreso en localStorage.
- Scraper `scraper/scrape.mjs` (Node + cheerio): cache gzip en `/cache`, pausas 2–3 s, frena ante 403/429/503 sin reintentar, tope de requests por corrida, validaciones (11 titulares, 1 arquero, números sin repetir, formación suma 10), `apellidos_override.json`, `apellidos_revisar.md`, aviso de apellidos repetidos.
  - ⚠️ Probado solo con HTML sintético: los selectores de Transfermarkt se ajustan con el primer HTML real.
- `data/equipos.json` con colores de 26 clubes uruguayos.
- `data/demo.json`: 1 nivel FICTICIO (se muestra solo mientras no haya partidos verificados, con cartel de demo).

## Partidos cargados (ids)
Ninguno todavía.

## Pendientes
- 5 partidos verificados para cerrar la Etapa 1 (requiere acceso a Transfermarkt).
- Etapa 2: lista candidata de 100 partidos (esperar aprobación).
- Etapa 3: scrapeo en tandas de 15–20.
- Etapa 4: VERIFICACION.md.

## Próximo paso
Destrabar el acceso a Transfermarkt (ver opciones arriba). Después: cargar 5 URLs en `scraper/partidos.txt`, `npm run scrape`, revisar salida y ajustar selectores si hace falta.

## Cómo correr
- Juego: `npm run serve` → http://localhost:8080 (o cualquier hosting estático: GitHub Pages, Netlify, Cloudflare Pages).
- Scraper: `npm install`, completar `scraper/partidos.txt`, `npm run scrape` (o `npm run scrape:cache` sin requests).
