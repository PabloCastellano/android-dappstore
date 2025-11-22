import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 5173,
    fs: {
      // Allow serving files from ignition deployments
      allow: ['..'],
    }
  },
  publicDir: 'public',
  // Copy ignition deployments to public folder during build
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
})
