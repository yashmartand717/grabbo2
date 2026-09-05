import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/api/news': {
        target: 'https://news.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news/, '')
      }
    }
  }
})
