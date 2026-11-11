// Grabbo Web - Per-page SEO
// Titles and descriptions for each page. Used in the browser (when switching views)
// and at build time (vite.config.js writes a separate HTML file for each page).

export const SITE_URL = 'https://www.grabbo.store';

export const pageMeta = {
  home: {
    path: '/',
    title: 'GRABBO – Convenience Store & Café @ Shiv Nadar University',
    description: 'Grabbo is the in-campus convenience store & café at Shiv Nadar University Shopping Arcade, Greater Noida: snacks, coffee, health essentials & hostel delivery.'
  },
  products: {
    path: '/products',
    title: 'Products & Prices – Snacks, Drinks & Health | Grabbo @ SNU',
    description: 'Browse what Grabbo stocks at the Shiv Nadar University Shopping Arcade: beverages, shakes, coffee, Maggi, bakery, snacks and health essentials, with prices.'
  },
  about: {
    path: '/about',
    title: 'About Grabbo – In-Campus Store & Experience Center at SNU',
    description: 'Grabbo has served Shiv Nadar University since April 2021: a full departmental store, heat & eat café, Local Vocal lounge & hostel delivery at Shopping Arcade.'
  },
  events: {
    path: '/events',
    title: 'Campus Events, Fests & Offers @ SNU | Grabbo Store',
    description: 'Discover upcoming campus events, offers and past student club collaborations from Grabbo at Shiv Nadar University, including JALSA 2.0 and Breeze fests.'
  },
  'cafe-fomo': {
    path: '/cafe-fomo',
    title: 'CAFÉ FOMO – Feed Your FOMO | Offline Café by Grabbo @ SNU',
    description: 'CAFÉ FOMO by Grabbo: Artisanal brews, cold coffees, loaded bites, and offline community hangout vibe at Shiv Nadar University Shopping Arcade. Feed Your FOMO.'
  }
};

// /story is a section of the home page, so it shares the home page's title and canonical URL
pageMeta.story = { ...pageMeta.home };
