import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use a relative base path to ensure it works regardless of the repo name
  base: './', 
  publicDir: 'public',
  build: {
    outDir: 'dist',
    // Ensures the manifest and assets are linked correctly
    assetsDir: 'assets',
  }
})
