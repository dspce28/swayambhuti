import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// '@pages' resolves to eager pages for the prerender (full HTML) and lazy pages for the browser.
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@pages': fileURLToPath(new URL(isSsrBuild ? './src/pages/registry.server.jsx' : './src/pages/registry.client.jsx', import.meta.url)),
    },
  },
}))
