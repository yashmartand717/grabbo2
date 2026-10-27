import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      // Only the RSS search endpoint is proxied (mirrors vercel.json)
      '^/api/news/rss/search': {
        target: 'https://news.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news/, '')
      }
    }
  }
})
