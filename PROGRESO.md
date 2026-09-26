# PROGRESO — Once Uruguayo

> Leé SOLO este archivo al retomar. No releas archivos grandes ni vuelvas a pedir páginas que ya estén en /cache.

## Etapa actual
**ETAPA 1 — COMPLETA.** Los 5 partidos verificados están cargados (`data/matches.json`), motor + UI ya los muestran (demo.json ya no se usa). Falta aprobación del usuario para pasar a Etapa 2 (lista candidata de 100 partidos).

**Red:** `www.transfermarkt.com` ya es accesible desde este entorno (se destrabó solo; ver historial si vuelve a bloquearse, las 3 opciones del bloqueo anterior siguen siendo válidas como plan B).

## Hecho
- Motor Wordle por jugador (`js/logic.js`): normalización, letras repetidas, teclado, estados. 11 tests OK (`npm test`).
- UI mobile-first pixel-art (`index.html`, `css/style.css`, `js/app.js`): niveles, cancha por formación, panel con teclado, "Me rindo", resumen, compartir con emojis, dato curioso, ajuste "arquero como pista" (default: activado), progreso en localStorage.
- Scraper `scraper/scrape.mjs` (Node + cheerio), ya probado contra HTML real de Transfermarkt y ajustado:
  - cache en `/cache` (acepta `.html` plano o `.gz`), pausas 2–3 s, frena ante 403/429/503 sin reintentar, tope de requests por corrida.
  - validaciones (11 titulares, 1 arquero, números sin repetir, formación suma 10), `apellidos_override.json`, `apellidos_revisar.md`, aviso de apellidos repetidos.
  - **Fixes sobre el HTML real de Transfermarkt (2026):** la formación ("Starting Line-up: 4-3-3") ahora está en la página de informe, no en la de alineación → `parsearFormaciones()` prueba ambas. La vista de cancha con coordenadas también se movió al informe. El selector de marcadores de cancha usaba `[style*="top"][style*="left"]` genérico, que además matcheaba el DIV contenedor de toda la cancha (`top:0;left:0`, sin `%`) y le "robaba" al primer jugador (arquero) sus coordenadas y a veces el ícono de capitán ajeno; ahora usa `.formation-player-container` (marcador real) y descarta cualquier match sin `top`/`left` en `%`.
- `data/equipos.json` con colores de 26 clubes uruguayos + la selección de Uruguay (celeste, antes se confundía por matching difuso con el club "Uruguay Montevideo").
- `data/apellidos_override.json`: Maxi Pereira → "M. Pereira" / Álvaro Pereira → "Á. Pereira" (mismo apellido, se repetía en 4 de los 5 onces).
- `data/demo.json`: nivel ficticio, ya no se usa porque hay partidos verificados (queda como fallback si `matches.json` quedara vacío).

## Partidos cargados (ids) — ETAPA 1, los 5 de Uruguay en el Mundial 2010 (Sudáfrica)
1. `tm-986777` — Sudáfrica 0-3 Uruguay (fase de grupos, 16/6/2010) — XI de visitante
2. `tm-1026846` — Uruguay 2-1 Corea del Sur (octavos, 26/6/2010) — XI de local
3. `tm-1027723` — Uruguay 1-1 Ghana, 4-2 en penales (cuartos, 2/7/2010, la mano de Suárez) — XI de local
4. `tm-1029770` — Uruguay 2-3 Holanda (semifinal, 6/7/2010) — XI de local
5. `tm-1030711` — Uruguay 2-3 Alemania (tercer puesto, 10/7/2010) — XI de local

Los 5 están `verificado: true`, sin avisos, capitán único por partido. HTML fuente en `cache/<id>_informe.html` y `cache/<id>_alineacion.html`, URLs en `scraper/partidos.txt`.

## Pendientes
- Mostrarle estos 5 partidos al usuario y pedir su aprobación para cerrar formalmente la Etapa 1.
- Etapa 2: armar lista candidata de 100 partidos (clubes uruguayos + selección) y esperar aprobación del usuario antes de scrapear.
- Etapa 3: scrapeo en tandas de 15–20 (respetando pausas/tope de requests).
- Etapa 4: VERIFICACION.md.

## Próximo paso
Esperar que el usuario revise/apruebe estos 5 partidos (jugarlos en `npm run serve`). Con luz verde, armar la lista candidata de 100 para la Etapa 2.

## Cómo correr
- Juego: `npm run serve` → http://localhost:8080 (o cualquier hosting estático: GitHub Pages, Netlify, Cloudflare Pages).
- Scraper: `npm install`, completar `scraper/partidos.txt`, `npm run scrape` (o `npm run scrape:cache` sin requests).
