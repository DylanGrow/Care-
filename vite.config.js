import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This matches your repository name 'Care-' exactly for GitHub Pages
  base: '/Care-/', 
  // This ensures manifest.json, sw.js, and icons are copied to the build folder
  publicDir: 'public',
  build: {
    // This ensures the output is compatible with the GitHub Actions deployment
    outDir: 'dist',
  }
})
