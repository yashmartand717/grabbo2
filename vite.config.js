import { defineConfig } from 'vite'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { products, events, CATEGORY_LABELS, getImageDimensions } from './src/content.js'
import { SITE_URL, pageMeta } from './src/seo.js'

const imgDimsAttr = src => {
  const dims = getImageDimensions(src)
  return dims ? ` width="${dims[0]}" height="${dims[1]}"` : ''
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
  html = replaceOnce(html, /id="home-view" class="view-section active"/, 'id="home-view" class="view-section hidden" aria-hidden="true" inert', 'home-view')
  return replaceOnce(html, new RegExp(`id="${viewId}" class="view-section hidden" aria-hidden="true" inert`), `id="${viewId}" class="view-section active"`, viewId)
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

const BREADCRUMB_NAMES = { products: 'Products', about: 'About', events: 'Events', 'cafe-fomo': 'Café FOMO' }

const parsePriceInr = price => {
  const m = typeof price === 'string' && price.match(/(\d+(?:\.\d+)?)/)
  return m ? m[1] : null
}

const pageStructuredData = view => {
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: BREADCRUMB_NAMES[view], item: SITE_URL + pageMeta[view].path }
    ]
  }
  const graph = [breadcrumb]
  const pageUrl = SITE_URL + pageMeta[view].path

  if (view === 'products') {
    graph.push({
      '@type': 'CollectionPage',
      name: pageMeta.products.title,
      description: pageMeta.products.description,
      url: pageUrl,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: products.length,
        itemListElement: products.map((prod, index) => {
          const numericPrice = parsePriceInr(prod.price)
          const item = {
            '@type': 'Product',
            name: prod.name,
            description: prod.desc,
            image: prod.image.startsWith('http') ? prod.image : `${SITE_URL}${prod.image}`,
            category: CATEGORY_LABELS[prod.category] || prod.category,
            brand: { '@type': 'Brand', name: 'Grabbo Store' }
          }
          if (numericPrice) {
            item.offers = {
              '@type': 'Offer',
              price: numericPrice,
              priceCurrency: 'INR',
              availability: 'https://schema.org/InStock',
              url: pageUrl
            }
          }
          return { '@type': 'ListItem', position: index + 1, item }
        })
      }
    })
  } else if (view === 'about') {
    graph.push({
      '@type': 'AboutPage',
      name: pageMeta.about.title,
      description: pageMeta.about.description,
      url: pageUrl,
      mainEntity: { '@id': `${SITE_URL}/#store` }
    })
  } else if (view === 'events') {
    graph.push({
      '@type': 'CollectionPage',
      name: pageMeta.events.title,
      description: pageMeta.events.description,
      url: pageUrl
    })
  }

  return `    <script type="application/ld+json">
      ${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}
    </script>
  </head>`
}

const productCard = prod => `
            <div class="catalog-card">
              <div class="catalog-card-img"><img src="${escapeHtml(prod.image)}" alt="${escapeHtml(prod.name)}"${imgDimsAttr(prod.image)} class="product-image" loading="lazy" decoding="async"></div>
              <div class="catalog-card-details">
                <h3>${escapeHtml(prod.name)}</h3>
                <p>${escapeHtml(prod.desc)}</p>
                <div class="catalog-card-meta"><span class="catalog-price">${escapeHtml(prod.price || 'In Store')}</span><span class="catalog-stock-tag">${escapeHtml(CATEGORY_LABELS[prod.category] || '')}</span></div>
              </div>
            </div>`

const eventCard = event => `
            <div class="event-card">
              <div class="event-card-img"><img src="${escapeHtml(event.image)}" alt="${escapeHtml(event.imageAlt || event.title)}"${imgDimsAttr(event.image)} loading="lazy" decoding="async"></div>
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

const sitemapXml = () => {
  const today = new Date().toISOString().slice(0, 10)
  const paths = [...['home', 'cafe-fomo', ...Object.keys(PAGES)].map(view => pageMeta[view].path), '/privacy']
  const entries = paths.map(path => `  <url>\n    <loc>${SITE_URL}${path}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
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
    `- [Privacy Policy & Terms of Use | Grabbo Store @ SNU](${SITE_URL}/privacy): Privacy policy and terms of use for Grabbo @ SNU at Shiv Nadar Institution of Eminence, Greater Noida.`,
    '',
    '## Products (prices in INR, available in store)',
  ]
  for (const [category, label] of Object.entries(CATEGORY_LABELS)) {
    const items = products.filter(prod => prod.category === category)
    if (!items.length) continue
    lines.push('', `### ${label}`, '', ...items.map(prod => `- ${prod.name}${prod.price ? ` (${prod.price})` : ''}: ${prod.desc}`))
  }
  lines.push(
    '',
    '## Café FOMO (Offline Café & Hangout Hub by Grabbo @ SNU)',
    '',
    '- Phone / Direct Order: +91 9205599102',
    '- Location: Shopping Arcade, Shiv Nadar Institution of Eminence, Greater Noida',
    '- Momo Delights (5 pcs / 10 pcs): Steamed Veg (₹60/₹120), Steamed Paneer (₹80/₹150), Steamed Cheese Corn (₹100/₹180), Crackling Cheese Corn (₹80/₹150), Crackling Veg (₹100/₹180), Crackling Paneer (₹120/₹200), Creamy Sauce Veg (₹100/₹160), Creamy Sauce Paneer (₹120/₹200), Creamy Sauce Cheese Corn (₹150/₹220)',
    '- Sandwiches: Veg Grilled Sandwich (₹100), Cheese Corn Sandwich (₹120), Paneer Tikka Sandwich (₹150)',
    '- Burgers: Aloo Tikki Burger (₹60), Iceland Burger (₹70), Veg Spicy Burger (₹70), Double Tikki Burger (₹90), Crispy Paneer Burger (₹90), Cheese Burger (₹100)',
    '- Soups: Manchow Soup (₹50), Tomato Soup (₹50), Mix Veg Soup (₹70), Sweet Corn Soup (₹70)',
    '- Hot Beverages: Chai (₹25), Kulhad Chai (₹30), Green Tea (₹25), Lemon Tea (₹25), Kadha Winter Special (₹25), Hot Coffee (₹40)',
    '- Snacks with Tea & Maggi: Bun Maska (₹40), Plain Maggi (₹40), Veg Maggi (₹60), Veg Spicy Maggi (₹70), Cheese Maggi (₹80), Garlic Bread (₹100), French Fries (₹90), Peri Peri Fries (₹100), Cheese Loaded Fries (₹120)',
    '- Mocktails: Virgin Mojito (₹90), Green Apple Mojito (₹90), Blue Lagoon (₹90), Pink Lady (₹90), Pinacolada (₹100), Kaala Khatta (₹90)',
    '- Shakes & Coolers: Vanilla Shake (₹100), Chocolate Shake (₹100), Strawberry Shake (₹100), Black Currant Shake (₹100), Cold Coffee (₹100), Oreo Shake (₹120), Iced Tea (₹100)'
  )
  const upcoming = events.filter(event => !isPastEvent(event))
  const past = events.filter(event => isPastEvent(event))
  if (upcoming.length) {
    lines.push('', '## Upcoming events', '', ...upcoming.map(event => `- ${event.title} (${event.date}, ${event.location}): ${event.desc}`))
  }
  if (past.length) {
    lines.push('', '## Past campus events', '', ...past.map(event => `- ${event.title} (${event.date}, ${event.location}): ${event.desc}`))
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
        html = replaceOnce(html, /  <\/head>/, pageStructuredData(view), '</head>')
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

const rewriteCleanUrls = (req, res, next) => {
  const pathname = req.url.split('?')[0].split('#')[0]
  if (['/cafe-fomo', '/products', '/about', '/events', '/privacy'].includes(pathname)) {
    const query = req.url.includes('?') ? '?' + req.url.split('?')[1] : ''
    req.url = `${pathname}/index.html${query}`
  }
  next()
}

const devServerMultiPageRewrite = () => ({
  name: 'grabbo-dev-multipage-rewrite',
  configureServer(server) {
    server.middlewares.use(rewriteCleanUrls)
  },
  configurePreviewServer(server) {
    server.middlewares.use(rewriteCleanUrls)
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
