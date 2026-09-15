# Mi mapa de viajes

Diario de viajes y mapa del mundo, hecho para el celular. Anda **offline**, se
**instala** en la pantalla de inicio y **no manda tus datos a ningún lado**: todo
queda guardado en el propio teléfono (IndexedDB).

Pensado desde Uruguay: todo en español rioplatense y las cotizaciones van contra
el peso uruguayo.

## Qué hace

- **Mapa** — los 195 países del mundo, pintados según cómo los marcaste
  (no visitado / visitado / pendiente / deseo). Uruguay aparece rayado, como "tu casa".
- **Viajes** — ciudades, fechas, con quién fuiste, puntaje, notas, etiquetas propias,
  lo mejor y lo peor, y fotos comprimidas que quedan en el celular.
- **Stats** — viajes y días por año, continentes, país más repetido, ciudad favorita.
- **Descubrir** — recomendaciones armadas con tus datos, con clima y cotización en vivo.
- **Backup** — exportás e importás todo en un JSON, para no perder nada al cambiar de celular.

## Arrancar el proyecto

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # queda en dist/
npm run preview    # para probar el build (el service worker solo anda acá, no en dev)
```

## Cómo está armado

| | |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| Estilos | Tailwind CSS |
| Mapa | react-simple-maps sobre TopoJSON de Natural Earth (`world-atlas`), bundleado |
| Base de datos | Dexie (IndexedDB) |
| Gráficos | Recharts |
| PWA | vite-plugin-pwa (Workbox) |

Rutas con `HashRouter`, así funciona en cualquier hosting sin configurar nada.

### Estructura

```
scripts/build-data.mjs      genera src/data/countries.json y copia el TopoJSON
scripts/build-icons.mjs     genera los íconos PWA (se corre a mano)
src/data/                   países (195 soberanos + territorios) y mapa
src/db/db.ts                esquema Dexie
src/lib/                    países, stats, recomendaciones, APIs, backup, fotos
src/screens/                Mapa · Viajes · Formulario · Stats · Descubrir · Ajustes
src/components/             navegación, bottom sheet, mapa, tarjetas
```

`npm run build` corre `build-data.mjs` solo, así que `src/data/` se puede regenerar
en cualquier momento.

## APIs externas

Todas gratuitas y **sin clave**. Si no hay internet, el service worker sirve la
última respuesta guardada.

| Para qué | Servicio |
|---|---|
| Clima y pronóstico | [Open-Meteo](https://open-meteo.com) |
| Cotización contra el peso | [open.er-api.com](https://open.er-api.com), respaldo: [currency-api](https://github.com/fawazahmed0/exchange-api) |
| Ficha de países | [REST Countries](https://restcountries.com) |

> Frankfurter quedó afuera a propósito: solo cubre las monedas del BCE y el peso
> uruguayo no está en esa lista, así que como respaldo no servía.

## Publicar en Netlify

El `netlify.toml` ya está listo: build `npm run build`, carpeta `dist`.
Los pasos completos están en [`DEPLOY.md`](./DEPLOY.md).
