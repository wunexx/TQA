import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/TQA/',

  //idk

  server: {
    host: true,
    port: 5173,
    strictPort: false,
    allowedHosts: [
      'founded-communities-star-furnished.trycloudflare.com'
    ],
    hmr: {
      protocol: 'wss',
      host: 'founded-communities-star-furnished.trycloudflare.com',
      port: 443,
    }
  }
})
