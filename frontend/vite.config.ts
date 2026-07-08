import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Inject production API URL at build time so Vercel uses the Render backend
  define: command === 'build' ? {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || 'https://kisanvriddhi.onrender.com'
    )
  } : {},
  server: {
    port: 3000,
    host: '0.0.0.0',
    watch: {
      usePolling: true,
    }
  }
}))

