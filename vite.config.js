import { defineConfig } from 'vite'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { products, events } from './src/content.js'
import { SITE_URL, pageMeta } from './src/seo.js'

// Catalog tab names (match the tab buttons in index.html)
const CATEGORY_LABELS = {
  precautions: 'Precautions & Health',
  beverages: 'Beverages & Shakes',
  bakery: 'Bakery & Sweets',
  coffee: 'Coffee & Pantry',
  snacks: 'Snacks & Chips'
}

// Pages written at build time as <view>/index.html (dist/products/index.html is served at /products)
const PAGES = { products: 'catalog-view', about: 'about-view', events: 'events-view' }

const escapeHtml = value => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Replaces one piece of index.html, failing the build if index.html no longer has it
const replaceOnce = (html, pattern, replacement, label) => {
  if (!pattern.test(html)) throw new Error(`prerender: "${label}" not found in index.html`)
  return html.replace(pattern, replacement)
}

const setPageMeta = (html, view) => {
  const { title, description, path } = pageMeta[view]
  const url = SITE_URL + path
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`, 'title')
  html = replaceOnce(html, /(<meta name="description" content=")[^"]*/, `$1${escapeHtml(description)}`, 'description')
  html = replaceOnce(html, /(<link rel="canonical" href=")[^"]*/, `$1${url}`, 'canonical')
  html = replaceOnce(html, /(<meta property="og:url" content=")[^"]*/, `$1${url}`, 'og:url')
  html = replaceOnce(html, /(<meta property="og:title" content=")[^"]*/, `$1${escapeHtml(title)}`, 'og:title')
  html = replaceOnce(html, /(<meta property="og:description" content=")[^"]*/, `$1${escapeHtml(description)}`, 'og:description')
  return html
}

// Shows the page's view instead of the home view, so the content is visible without JavaScript
const showView = (html, viewId) => {
  html = replaceOnce(html, /id="home-view" class="view-section active"/, 'id="home-view" class="view-section hidden"', 'home-view')
  return replaceOnce(html, new RegExp(`id="${viewId}" class="view-section hidden"`), `id="${viewId}" class="view-section active"`, viewId)
}

// Gives the page its own H1: the hidden home hero heading becomes a <p>, and the view's
// first section title becomes the H1
const setPageHeading = (html, viewId) => {
  html = replaceOnce(html, /<h1 class="hero-brand-title">GRABBO(?:<span class="visually-hidden">[^<]*<\/span>)?<\/h1>/,
    '<p class="hero-brand-title">GRABBO</p>', 'hero h1')
  const open = html.indexOf('<h2 class="section-title"', html.indexOf(`id="${viewId}"`))
  const close = html.indexOf('</h2>', open)
  if (open === -1 || close === -1) throw new Error(`prerender: section title not found in ${viewId}`)
  return html.slice(0, open) + '<h1' + html.slice(open + 3, close) + '</h1>' + html.slice(close + 5)
}

const breadcrumbJsonLd = view => `    <script type="application/ld+json">
      ${JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: BREADCRUMB_NAMES[view], item: SITE_URL + pageMeta[view].path }
        ]
      })}
    </script>
  </head>`

const BREADCRUMB_NAMES = { products: 'Products', about: 'About', events: 'Events', 'cafe-fomo': 'Café FOMO' }

const productCard = prod => `
            <div class="catalog-card">
              <div class="catalog-card-img"><img src="${escapeHtml(prod.image)}" alt="${escapeHtml(prod.name)}" class="product-image" loading="lazy"></div>
              <div class="catalog-card-details">
                <h3>${escapeHtml(prod.name)}</h3>
                <p>${escapeHtml(prod.desc)}</p>
                <div class="catalog-card-meta"><span class="catalog-price">${escapeHtml(prod.price || 'In Store')}</span><span class="catalog-stock-tag">${escapeHtml(CATEGORY_LABELS[prod.category] || '')}</span></div>
              </div>
            </div>`

const eventCard = event => `
            <div class="event-card">
              <div class="event-card-img"><img src="${escapeHtml(event.image)}" alt="${escapeHtml(event.imageAlt || event.title)}" loading="lazy"></div>
              <div class="event-card-body">
                <h3 class="event-title">${escapeHtml(event.title)}</h3>
                <p class="event-desc">${escapeHtml(event.desc)}</p>
                <div class="event-meta">
                  ${[event.date, event.location, event.host].filter(Boolean).map(text => `<div class="event-meta-item">${escapeHtml(text)}</div>`).join('\n                  ')}
                </div>
              </div>
            </div>`

// Same upcoming/past split as initEvents() in src/main.js
const todayISO = new Date().toISOString().slice(0, 10)
const isPastEvent = event => Boolean(event.endDate) && event.endDate < todayISO

const fillProducts = html => replaceOnce(html, /<!-- Products will be injected here via JS -->/,
  products.map(productCard).join(''), 'catalog-grid placeholder')

const fillEvents = html => {
  const upcoming = events.filter(event => !isPastEvent(event))
  const past = events.filter(isPastEvent).sort((a, b) => b.endDate.localeCompare(a.endDate))
  html = replaceOnce(html, /<!-- Event cards are built from src\/content.js -->/,
    upcoming.length
      ? upcoming.map(eventCard).join('')
      : '<div class="events-empty-note">No upcoming events right now. Follow <a href="https://www.instagram.com/grabbo_snu" target="_blank" rel="noopener noreferrer">@grabbo_snu</a> for announcements.</div>',
    'events-grid placeholder')
  if (past.length) {
    html = replaceOnce(html, /id="past-events-section" hidden>/, 'id="past-events-section">', 'past-events-section')
    html = replaceOnce(html, /<div class="events-grid" id="past-events-grid"><\/div>/,
      `<div class="events-grid" id="past-events-grid">${past.map(eventCard).join('')}\n          </div>`, 'past-events-grid')
  }
  return html
}

const SITEMAP_CONFIG = {
  home: { changefreq: 'weekly', priority: '1.0' },
  'cafe-fomo': { changefreq: 'weekly', priority: '0.9' },
  products: { changefreq: 'weekly', priority: '0.9' },
  about: { changefreq: 'monthly', priority: '0.8' },
  events: { changefreq: 'weekly', priority: '0.8' },
  privacy: { changefreq: 'yearly', priority: '0.3' }
}

const sitemapXml = () => {
  const today = new Date().toISOString().slice(0, 10)
  const entries = ['home', 'cafe-fomo', ...Object.keys(PAGES)].map(view => {
    const loc = `${SITE_URL}${pageMeta[view].path}`
    const { changefreq, priority } = SITEMAP_CONFIG[view] || { changefreq: 'monthly', priority: '0.7' }
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
  })
  entries.push(`  <url>\n    <loc>${SITE_URL}/privacy</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.3</priority>\n  </url>`)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`
}

// Plain-text summary for AI assistants (https://llmstxt.org)
const llmsTxt = () => {
  const lines = [
    '# GRABBO',
    '',
    '> In-campus convenience store, café and experience center at the Shopping Arcade of Shiv Nadar University (Shiv Nadar Institution of Eminence), Greater Noida, Uttar Pradesh, India. Run by Auctus Resources since April 2021; founder Vijay Tiwary.',
    '',
    '- Address: Shopping Arcade, Shiv Nadar Institution of Eminence, G. T. Road, Dadri, Greater Noida, Uttar Pradesh 201314, India',
    '- Phone: +91 9999725000, +91 9289300102',
    '- Email: grabbo.snu@gmail.com',
    '- Instagram: https://www.instagram.com/grabbo_snu',
    '- Services: departmental store, heat & eat café, "Local Vocal" lounge for performances, hostel and on-campus deliveries, events with student clubs',
    '',
    '## Pages',
    '',
    ...['home', 'cafe-fomo', ...Object.keys(PAGES)].map(view => `- [${pageMeta[view].title}](${SITE_URL}${pageMeta[view].path}): ${pageMeta[view].description}`),
    '',
    '## Products (prices in INR, available in store)',
  ]
  for (const [category, label] of Object.entries(CATEGORY_LABELS)) {
    const items = products.filter(prod => prod.category === category)
    if (!items.length) continue
    lines.push('', `### ${label}`, '', ...items.map(prod => `- ${prod.name}${prod.price ? ` (${prod.price})` : ''}: ${prod.desc}`))
  }
  const upcoming = events.filter(event => !isPastEvent(event))
  if (upcoming.length) {
    lines.push('', '## Upcoming events', '', ...upcoming.map(event => `- ${event.title} (${event.date}, ${event.location}): ${event.desc}`))
  }
  return lines.join('\n') + '\n'
}

const prerenderPages = () => {
  let outDir
  return {
    name: 'grabbo-prerender-pages',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    writeBundle() {
      const indexHtml = readFileSync(resolve(outDir, 'index.html'), 'utf8')
      for (const [view, viewId] of Object.entries(PAGES)) {
        let html = setPageHeading(showView(setPageMeta(indexHtml, view), viewId), viewId)
        html = replaceOnce(html, /  <\/head>/, breadcrumbJsonLd(view), '</head>')
        if (view === 'products') html = fillProducts(html)
        if (view === 'events') html = fillEvents(html)
        mkdirSync(resolve(outDir, view), { recursive: true })
        writeFileSync(resolve(outDir, view, 'index.html'), html)
      }
      writeFileSync(resolve(outDir, 'sitemap.xml'), sitemapXml())
      writeFileSync(resolve(outDir, 'llms.txt'), llmsTxt())
    }
  }
}

const devServerMultiPageRewrite = () => ({
  name: 'grabbo-dev-multipage-rewrite',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const pathname = req.url.split('?')[0].split('#')[0];
      if (pathname === '/cafe-fomo') {
        req.url = '/cafe-fomo/index.html' + (req.url.includes('?') ? '?' + req.url.split('?')[1] : '');
      }
      next();
    });
  }
});

export default defineConfig({
  plugins: [devServerMultiPageRewrite(), prerenderPages()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        cafeFomo: resolve(process.cwd(), 'cafe-fomo/index.html')
      }
    }
  },
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
        rewrite: () => '/weatherapi/locationforecast/2.0/compact?lat=28.5269&lon=77.5754'
      }
    }
  }
})
