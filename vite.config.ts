import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico.png', 'brand/logo.png', 'brand/icon-192.png', 'brand/icon-512.png'],
      manifest: {
        name: 'Dinning Zone - Food Delivery',
        short_name: 'Dinning Zone',
        description: 'Fresh food. Fast at your door.',
        theme_color: '#D94F30',
        background_color: '#FFF9F3',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/brand/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/brand/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/brand/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,webp,svg}']
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
