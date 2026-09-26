# PROGRESO — Once Uruguayo

> Leé SOLO este archivo al retomar. No releas archivos grandes ni vuelvas a pedir páginas que ya estén en /cache.

## Etapa actual
**ETAPA 1 y 2 — COMPLETAS.** `data/matches.json` tiene **100 partidos verificados de clubes uruguayos** (2019–2026). Se abandonó por completo la idea inicial de usar la selección (partidos de Mundial): el usuario pidió explícitamente clubes, con Nacional/Peñarol como base. Publicado en Netlify (ver README). Falta que el usuario lo juegue y avise si hay algo para ajustar antes de sumar más partidos (Etapa 3 en adelante).

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
- `data/equipos.json`: 26 clubes uruguayos + selección + La Luz FC + Tacuarembó FC (colores reales buscados a mano, son clubes chicos sin ficha previa).
- `data/apellidos_override.json`: vacío (ver arriba, ya no se usa para desambiguar apellidos repetidos).
- `data/demo.json`: sin uso mientras `matches.json` tenga partidos verificados (solo es fallback).

## Los 100 partidos (`data/matches.json`, `scraper/partidos.txt`)
Selección armada bajando los fixtures completos de Transfermarkt 2018–2025 (season_id) de Nacional (866) y Peñarol (861), más Liverpool/Danubio/Defensor/Wanderers/Racing/Cerro/Progreso/Boston River para partidos memorables de otros clubes. Composición real:
- **78% Nacional o Peñarol** (80/100) / **22% otro club uruguayo** en instancia importante (18/100): incluye clásicos internos, finales de Supercopa/Copa Uruguay, semis de Libertadores/Sudamericana, y partidos tipo Liverpool 0-1 Peñarol (final vuelta Playoffs 2023, la que pidió el usuario como ejemplo).
- **45% Liga AUF (Apertura/Clausura/Intermedio/Playoffs)** / **55% copas** (Libertadores, Sudamericana, Copa AUF Uruguay, Supercopa).
- Años: 2019 a 2026 (Transfermarkt no tenía partidos jugados en season_id 2018 para estos clubes; el pool arranca en 2019, cumple igual "2018 en adelante").
- **Orden mezclado a propósito** (no cronológico): se interleavan por año con una semilla fija para que el nivel 2 y el nivel 3 no sean del mismo año.
- 2 partidos candidatos se descartaron por no pasar validación (Nacional-Torque 23/11/24 y Nacional-Durazno 24/10/24: varios titulares sin número de camiseta cargado en Transfermarkt, dato real faltante, no inventado) y se repusieron con la selección original de 102 → 100 finales.

HTML fuente de los 100 en `cache/<id>_informe.html` y `cache/<id>_alineacion.html` (~200 archivos, todos commiteados).

## Pendientes / posibles próximos pasos
- Que el usuario juegue los 100 niveles y avise si algo se ve mal (colores de club, apellidos raros en `data/apellidos_revisar.md`, etc.).
- Si quiere más partidos a futuro: repetir el mismo proceso (bajar fixtures de más clubes o más temporadas, elegir candidatos, scrapear, revisar `apellidos_revisar.md`).
- Nunca completar datos de memoria: todo sale del HTML descargado.

## Cómo correr
- Jugar sin instalar nada: https://romantoto2017.github.io/romanpersonal/ o el link de Netlify (ver README).
- Local: `npm run serve` → http://localhost:8080.
- Scraper: `npm install`, completar `scraper/partidos.txt`, `npm run scrape` (o `npm run scrape:cache` sin requests, usa lo que haya en `/cache`).
