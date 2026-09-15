// @ts-check
import { defineConfig } from 'astro/config';
import AstroPWA from '@vite-pwa/astro';
import vercel from '@astrojs/vercel';

import tailwindcss from '@tailwindcss/vite';

const noFirebase = process.argv.includes('--nofirebase');
if (noFirebase) {
  console.log('🔥 Running in NO-FIREBASE mode');
}

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover'
  },

  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.PUBLIC_NO_FIREBASE': JSON.stringify(noFirebase ? 'true' : 'false')
    }
  },

  integrations: [
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '2 Bach A Sardiñeira',
        short_name: '2bach',
        description: 'Sitio de noticias y exámenes',
        theme_color: '#2000ad',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },

      workbox: {
        // Estrategia de caché: solo imágenes
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 días
              }
            }
          },
          {
            // Todo lo demás: NetworkOnly (sin caché)
            urlPattern: /.*/,
            handler: 'NetworkOnly'
          }
        ],
        // No precachear nada automáticamente
        globPatterns: [],
        navigateFallback: null
      },

      devOptions: {
        enabled: true,
        navigateFallbackAllowlist: [/^\/$/],
        suppressWarnings: true,
      }
    })
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});