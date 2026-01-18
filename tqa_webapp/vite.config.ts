import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/TQA/',

  //cloudflared tunnel stuff below

  server: {
    host: true,
    port: 5173,
    strictPort: false,
    allowedHosts: [
      'director-gardening-annie-contract.trycloudflare.com'
    ],
    hmr: {
      protocol: 'wss',
      host: 'director-gardening-annie-contract.trycloudflare.com',
      port: 443,
    }
  }
})
