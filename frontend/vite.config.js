import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'robots.txt'],
      manifest: {
        name: 'Getnews', // Ganti dengan nama app spesifik
        short_name: 'getnew',
        description: 'Dapatkan Kabar keluarga dan teman', // Deskripsi lebih spesifik
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#3367D6', // Warna tema yang kontras
        lang: 'en',
        icons: [
          {
            src: '/pwa-192x192.png', // Tambahkan slash di awal path
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Gabungkan dengan deklarasi utama
          }
        ],
        categories: ['social', 'productivity'] // Tambahkan kategori
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}']
      },
      devOptions: {
        enabled: true // Aktifkan PWA di development
      }
    })
  ],
  build: {
    sourcemap: true // Memudahkan debugging
  }
})