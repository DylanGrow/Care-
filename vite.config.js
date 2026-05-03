import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Ensures the build assumes the sub-folder path of GitHub Pages
  base: '/carecompass-lite/',
  // Explicitly tells Vite where your static assets are
  publicDir: 'public',
})
