import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['khoiva.id.vn'],
    host: true,
    port: 5173,
  },
})