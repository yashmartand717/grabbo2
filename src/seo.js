// Grabbo Web - Per-page SEO
// Titles and descriptions for each page. Used in the browser (when switching views)
// and at build time (vite.config.js writes a separate HTML file for each page).

export const SITE_URL = 'https://www.grabbo.store';

export const pageMeta = {
  home: {
    path: '/',
    title: 'Grabbo @ SNU – Convenience Store & Café at Shiv Nadar University',
    description: 'Grabbo is the in-campus convenience store and café at the Shiv Nadar University Shopping Arcade, Greater Noida: snacks, beverages, coffee, bakery, health essentials and hostel delivery.'
  },
  products: {
    path: '/products',
    title: 'Products & Prices – Snacks, Drinks, Coffee & Health | Grabbo @ SNU',
    description: 'Browse what Grabbo stocks at the Shiv Nadar University Shopping Arcade: beverages, shakes, coffee, Maggi, bakery, snacks and health essentials, with prices.'
  },
  about: {
    path: '/about',
    title: 'About Grabbo – In-Campus Store & Experience Center at SNU',
    description: 'Grabbo has served Shiv Nadar University since April 2021: a full departmental store, heat & eat café, Local Vocal lounge and hostel delivery at the Shopping Arcade.'
  },
  events: {
    path: '/events',
    title: 'Events & Offers | Grabbo @ SNU',
    description: 'Upcoming events, offers and past campus collaborations from Grabbo at Shiv Nadar University, including JALSA and TEDx.'
  },
  'cafe-fomo': {
    path: '/cafe-fomo',
    title: 'CAFÉ FOMO – Feed Your FOMO | An Offline Hangout Venture by Grabbo',
    description: 'CAFÉ FOMO by Grabbo: Artisanal brews, cold coffees, loaded bites, and offline community hangout vibe. Feed Your FOMO at our upcoming physical venture.'
  }
};

// /story is a section of the home page, so it shares the home page's title and canonical URL
pageMeta.story = { ...pageMeta.home };
