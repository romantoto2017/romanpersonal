# Once Uruguayo

Juego web tipo "Missing XI" con partidos reales del fútbol uruguayo (2020 en adelante). Adiviná el apellido de cada titular, estilo Wordle.

- Jugar localmente: `npm run serve` y abrir http://localhost:8080
- Deploy: es un sitio estático (sin build). Subí la carpeta tal cual a GitHub Pages / Netlify / Cloudflare Pages.
- Datos: `data/matches.json` lo genera `scraper/scrape.mjs` desde Transfermarkt. Ver `PROGRESO.md`.
- Correcciones manuales de apellidos: `data/apellidos_override.json` (clave = `tm_id` del jugador).
- Tests: `npm test`.
