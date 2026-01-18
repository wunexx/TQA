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
      'see-plan-combat-cheats.trycloudflare.com'
    ],
    hmr: {
      protocol: 'wss',
      host: 'see-plan-combat-cheats.trycloudflare.com',
      port: 443,
    }
  }
})
