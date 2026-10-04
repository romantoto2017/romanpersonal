# PROGRESO — Once Uruguayo

> Leé SOLO este archivo al retomar. No releas archivos grandes ni vuelvas a pedir páginas que ya estén en /cache.

## Etapa actual
**ETAPA 1, 2 y 3 — COMPLETAS.** `data/matches.json` tiene **200 partidos verificados de clubes uruguayos** (2019–2026): los 100 originales + 100 más agregados a pedido del usuario, con foco en variedad de jugadores (ver abajo). Publicado en GitHub Pages / Netlify (ver README).

**Red:** `www.transfermarkt.com` es accesible desde este entorno, pero tira 403/405 seguido si se pide muy rápido (WAF/anti-bot). Lo que funcionó: pausas de 4 s entre requests normales, reintento único a los 7-10 s ante un 405, y si sigue fallando esperar 15-40 s y reintentar suelto. Nunca hace falta más de 2-3 reintentos por URL.

## Hecho
- Motor Wordle por jugador (`js/logic.js`): normalización, letras repetidas, teclado, estados, `normalizarApellido()` (conserva un espacio en apellidos compuestos). 12 tests OK (`npm test`).
- UI mobile-first pixel-art (`index.html`, `css/style.css`, `js/app.js`): niveles, cancha por formación, panel con teclado, "Me rindo", resumen, compartir con emojis, progreso en localStorage.
  - Apellidos compuestos ("Arévalo Ríos") se juegan como dos palabras: la grilla muestra un hueco entre ellas y el espacio se auto-completa al tipear (no hay que apretar espacio).
  - Apellidos repetidos en un mismo once (ej. dos "Rodríguez") se dejan tal cual, sin desambiguar con inicial — el jugador los adivina por separado.
  - "Arquero revelado como pista" es un ajuste opcional que **arranca apagado** (antes venía activado por defecto, lo cual mostraba el nombre del golero sin jugar).
- Scraper `scraper/scrape.mjs` (Node + cheerio), probado y ajustado contra HTML real de Transfermarkt:
  - cache en `/cache` (acepta `.html` plano o `.gz`), pausas 2–3 s, frena ante 403/429/503 sin reintentar, tope de requests por corrida.
  - validaciones (11 titulares, 1 arquero, números sin repetir, formación suma 10), `apellidos_override.json`, `apellidos_revisar.md`.
  - **Fixes sobre el HTML real (2026):** la formación y la vista de cancha con coordenadas están en la página de informe, no en la de alineación → `parsearFormaciones()`/`parsearCancha()` prueban ambas. El selector de marcadores de cancha usaba `[style*="top"][style*="left"]` genérico, que también matcheaba el DIV contenedor de toda la cancha y le "robaba" al primer jugador sus coordenadas (y a veces el ícono de capitán ajeno); ahora usa `.formation-player-container` y descarta cualquier match sin `top`/`left` en `%`.
- `data/equipos.json`: 26 clubes uruguayos + selección + La Luz FC + Tacuarembó FC + Huracán FC + IA Río Negro (colores reales buscados a mano, son clubes chicos sin ficha previa).
- `data/apellidos_override.json`: vacío (ya no se usa para desambiguar apellidos repetidos).
- `data/demo.json`: sin uso mientras `matches.json` tenga partidos verificados (solo es fallback).
- Pixel art propio para la pelota de gol (⚽): `pelotaSVG()` en `js/app.js`, círculo con contorno negro automático (mismo método que las camisetas) y parche tipo pentágono adentro. Varias iteraciones hasta que se viera bien (ver historial de commits si hace falta tocarla).

## Los 200 partidos (`data/matches.json`, `scraper/partidos.txt`)
**Primeros 100** (líneas 1-104 de `partidos.txt`): bajando los fixtures completos de Transfermarkt 2018–2025 (season_id) de Nacional (866) y Peñarol (861), más Liverpool/Danubio/Defensor/Wanderers/Racing/Cerro/Progreso/Boston River para partidos memorables de otros clubes. ~78% N/P, ~45/55 liga/copas, priorizando partidos importantes (clásicos, finales, semis continentales).

**Segundos 100** (líneas 105-204): mismo pool de fixtures (ya descargado, reusado de `/tmp/tm_fixtures` si sigue vivo — si no, hay que rehacerlo: ids de verein en el código de abajo). A pedido del usuario, esta tanda **no prioriza partidos importantes sino variedad de plantel**: reparte parejo entre Liga AUF Intermedio, fase de grupos de Libertadores/Sudamericana y rondas comunes de liga (donde los clubes rotan más), con muestreo aleatorio en vez de por goleada/resultado. Resultado verificado: 117 jugadores que nunca habían aparecido en los primeros 100 (sobre 319 únicos en esta tanda). Los arqueros titulares sí se repiten bastante entre tandas — es esperable, un club no cambia de arquero seguido.
- Composición exacta: **90 Nacional/Peñarol + 10 de otro club** (Liverpool, Progreso, River Plate, Torque, Huracán, IA Río Negro, Sud América), sin repetir ningún id de los primeros 100.
- 2 candidatos de esta tanda se descartaron por no pasar validación (Peñarol-Piriápolis F.C.: la página no traía alineación; Nacional-Frontera Rivera: números de camiseta faltantes/repetidos — clubes muy chicos, Transfermarkt no tiene el dato) y se repusieron con otros 2 candidatos de la misma categoría (Peñarol-Liverpool Playoffs 2025, Nacional-Progreso 2021).
- **Verein ids de Transfermarkt usados:** nacional=866, penarol=861, liverpool=10663, danubio=1306, defensor=2619, wanderers=2403, racing=14758, cerro=14806, progreso=17595, bostonriver=18074.

HTML fuente de los 200 en `cache/<id>_informe.html` y `cache/<id>_alineacion.html` (~400 archivos, todos commiteados).

## Pendientes / posibles próximos pasos
- Que el usuario juegue los 200 niveles y avise si algo se ve mal (colores de club, apellidos raros en `data/apellidos_revisar.md`, etc.).
- Si quiere más partidos a futuro: mismo proceso — bajar fixtures (o reusar los de `/tmp/tm_fixtures` si el contenedor no se reinició), filtrar ids ya usados en `data/matches.json`, elegir candidatos nuevos, scrapear, revisar `apellidos_revisar.md` y clubes sin colores en `equipos.json`.
- Nunca completar datos de memoria: todo sale del HTML descargado.

## Cómo correr
- Jugar sin instalar nada: https://romantoto2017.github.io/romanpersonal/ o el link de Netlify (ver README).
- Local: `npm run serve` → http://localhost:8080.
- Scraper: `npm install`, completar `scraper/partidos.txt`, `npm run scrape` (o `npm run scrape:cache` sin requests, usa lo que haya en `/cache`).
