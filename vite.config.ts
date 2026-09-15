import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png'],
      manifest: {
        name: 'Mi mapa de viajes',
        short_name: 'Mi mapa',
        description: 'Tu diario de viajes y tu mapa del mundo, en el celular y sin internet.',
        lang: 'es-UY',
        dir: 'ltr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F3EDE3',
        theme_color: '#F3EDE3',
        categories: ['travel', 'lifestyle', 'utilities'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Clima, cambio y datos de países: primero la red, y si no hay, lo último guardado.
            urlPattern:
              /^https:\/\/(api\.open-meteo\.com|open\.er-api\.com|cdn\.jsdelivr\.net|restcountries\.com)\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'apis-viaje',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 12 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    target: 'es2019',
    rollupOptions: {
      output: {
        manualChunks: {
          mapa: ['react-simple-maps'],
          graficos: ['recharts'],
        },
      },
    },
  },
})
