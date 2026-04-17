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
