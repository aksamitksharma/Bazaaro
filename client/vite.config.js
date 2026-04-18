import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Bazaaro Hyperlocal',
        short_name: 'Bazaaro',
        description: 'Connect with your local roadside vendors and shops.',
        theme_color: '#312E81',
        background_color: '#F8FAFC',
        display: 'standalone',
        icons: [
          { src: 'icons.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: 'icons.svg', sizes: '512x512', type: 'image/svg+xml' }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/api\/vendors\/dashboard/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'vendor-dashboard-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/api\/products\/vendor\/my/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'vendor-products-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', ws: true }
    }
  }
});
