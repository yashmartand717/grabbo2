import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      // Only the RSS search endpoint is proxied (mirrors vercel.json)
      '^/api/news/rss/search': {
        target: 'https://news.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/news/, '')
      },
      // SNU weather from MET Norway (mirrors vercel.json); MET asks callers to identify themselves
      '^/api/weather$': {
        target: 'https://api.met.no',
        changeOrigin: true,
        headers: { 'User-Agent': 'grabbo-web/1.0 grabbo.snu@gmail.com' },
        rewrite: () => '/weatherapi/locationforecast/2.0/compact?lat=28.5254&lon=77.5755'
      }
    }
  }
})
