import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/carecompass-lite/',
  server: {
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})
