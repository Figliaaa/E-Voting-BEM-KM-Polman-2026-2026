import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Mengizinkan domain cloudflare agar tidak diblokir
    allowedHosts: ['.trycloudflare.com'], 
    
    // Atau jika ingin mengizinkan semua host (paling praktis untuk hari-H):
    // allowedHosts: true,

    host: '0.0.0.0', // Memastikan Vite mendengarkan di semua interface (0.0.0.0)
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 443,
    }
  },
})