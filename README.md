# Once Uruguayo

Juego web tipo "Missing XI" con partidos reales de clubes uruguayos (2019 en adelante, mayoría Nacional/Peñarol). Adiviná el apellido de cada titular, estilo Wordle.

- Jugar sin instalar nada: https://romantoto2017.github.io/romanpersonal/ (se publica solo con cada push a `claude/intelligent-wozniak-meuiaj` vía `.github/workflows/pages.yml`; hay que activarlo una vez en Settings → Pages → Source → "GitHub Actions").
- Jugar localmente: `npm run serve` y abrir http://localhost:8080
- Deploy: es un sitio estático (sin build). Sirve tal cual desde GitHub Pages / Netlify / Cloudflare Pages — solo necesita `index.html`, `css/`, `js/` y `data/`.
- Datos: `data/matches.json` lo genera `scraper/scrape.mjs` desde Transfermarkt. Ver `PROGRESO.md`.
- Correcciones manuales de apellidos: `data/apellidos_override.json` (clave = `tm_id` del jugador).
- Tests: `npm test`.
