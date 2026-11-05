// Grabbo Web - Premium Campus Essentials @ SNU Shopping Arcade
import './style.css';
import anime from 'animejs';
import { products, events, testimonials, newsSources, weatherSuggestions } from './content.js';
import { SITE_URL, pageMeta } from './seo.js';

// --- Scroll Sequence Animation ---
const canvas = document.getElementById('bg-canvas');
const context = canvas.getContext('2d');

// Storefront Interior Sequence: 300 full 2560x1440 frames on desktop; portrait phones get
// 150 lighter full-width frames (every 2nd frame, scaled to 1920x1080)
const useMobileFrames = window.matchMedia('(max-width: 900px) and (orientation: portrait)').matches;
const frameCount = useMobileFrames ? 150 : 300;
const currentFrame = index => {
  const frameNumber = (index + 1).toString().padStart(3, '0');
  return useMobileFrames
    ? `/hero-frames-mobile/frame-${frameNumber}.webp`
    : `/hero-frames/ezgif-frame-${frameNumber}.webp`;
};

const images = [];
for (let i = 0; i < frameCount; i++) {
  images[i] = new Image();
}

// Progressive & On-Demand Frame Loader
let drawnIndex = -1;

const isFrameReady = (index) =>
  index >= 0 && index < frameCount && images[index].complete && images[index].naturalWidth > 0;

const loadFrame = (index, priority = 'auto') => {
  if (index >= 0 && index < frameCount && !images[index].src) {
    const img = images[index];
    img.fetchPriority = priority;
    img.addEventListener('load', () => {
      // Repaint when a frame closer to the scroll position than the one on screen arrives
      if (Math.abs(index - scrollProgressIndex) < Math.abs(drawnIndex - scrollProgressIndex)) {
        renderFrame(scrollProgressIndex);
      }
    }, { once: true });
    img.src = currentFrame(index);
  }
};

// Load the first frame now; frames 1-11 (for a smooth first scroll) wait until the page is idle
// so they don't compete with the first paint (see images[0].onload)
const initialFrames = 12;
loadFrame(0, 'high');
const loadInitialFrames = () => {
  for (let i = 1; i < Math.min(initialFrames, frameCount); i++) {
    loadFrame(i);
  }
};

// Then a coarse pass (every 10th frame) so any scroll position has a nearby frame to show.
// The rest load on demand around the scroll position (see renderFrame), so visitors who
// don't scroll through the whole page don't download the whole sequence (~86 MB on desktop)
const preloadOrder = [];
for (const step of [10]) {
  for (let i = initialFrames; i < frameCount; i += step) {
    preloadOrder.push(i);
  }
}

let preloadPos = 0;
const preloadBatchSize = 6;
const preloadRemainingFrames = () => {
  const batch = [];
  while (batch.length < preloadBatchSize && preloadPos < preloadOrder.length) {
    const index = preloadOrder[preloadPos++];
    if (!images[index].src) {
      loadFrame(index);
      batch.push(images[index]);
    }
  }
  if (!batch.length) return;
  // Wait for this batch before queuing more, so frames requested by scrolling aren't stuck behind it
  Promise.all(batch.map(img => new Promise(resolve => {
    img.addEventListener('load', resolve, { once: true });
    img.addEventListener('error', resolve, { once: true });
  }))).then(preloadRemainingFrames);
};

let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
let scrollProgressIndex = 0;

// Start closer on portrait screens, then follow the swipe directly into the store.
const PORTRAIT_START_WIDTH = 1.6; // keep in sync with the CSS first-frame poster
const PORTRAIT_CENTER_Y = 0.45;  // storefront centre, as a fraction of the screen height
let portraitZoom = 0;

const isPortraitCanvas = () => canvasWidth / canvasHeight < 1;

// Where a frame of the given size is drawn on the canvas
const getFrameRect = (imgWidth, imgHeight) => {
  const imgRatio = imgWidth / imgHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  // Cover the canvas without zooming on scroll (landscape screens always use this)
  let coverWidth, coverHeight;
  if (canvasRatio > imgRatio) {
    coverWidth = canvasWidth;
    coverHeight = canvasWidth / imgRatio;
  } else {
    coverWidth = canvasHeight * imgRatio;
    coverHeight = canvasHeight;
  }
  if (!isPortraitCanvas()) {
    return { x: (canvasWidth - coverWidth) / 2, y: (canvasHeight - coverHeight) / 2, w: coverWidth, h: coverHeight };
  }

  const fitWidth = Math.min(coverWidth, canvasWidth * PORTRAIT_START_WIDTH);
  const t = portraitZoom;
  const w = fitWidth + (coverWidth - fitWidth) * t;
  const h = w / imgRatio;
  const fitY = canvasHeight * PORTRAIT_CENTER_Y - h / 2;
  const coverY = (canvasHeight - h) / 2;
  return { x: (canvasWidth - w) / 2, y: fitY + (coverY - fitY) * t, w, h };
};

// Average colour of a horizontal strip of a frame, used to extend the sky and the
// parking lot above and below the storefront on portrait screens
const edgeSampler = document.createElement('canvas');
edgeSampler.width = 16;
edgeSampler.height = 4;
const edgeContext = edgeSampler.getContext('2d', { willReadFrequently: true });
edgeContext.imageSmoothingQuality = 'high';
const edgeColorCache = new Map();

const getEdgeColors = (index) => {
  if (edgeColorCache.has(index)) return edgeColorCache.get(index);
  const img = images[index];
  const average = (sy, sh) => {
    edgeContext.clearRect(0, 0, 16, 4);
    edgeContext.drawImage(img, 0, sy, img.width, sh, 0, 0, 16, 4);
    const data = edgeContext.getImageData(0, 0, 16, 4).data;
    const sum = [0, 0, 0];
    for (let i = 0; i < data.length; i += 4) {
      sum[0] += data[i];
      sum[1] += data[i + 1];
      sum[2] += data[i + 2];
    }
    const pixels = data.length / 4;
    return sum.map(value => Math.round(value / pixels)).join(', ');
  };
  const colors = {
    top: average(0, img.height * 0.03),
    bottom: average(img.height * 0.94, img.height * 0.06)
  };
  edgeColorCache.set(index, colors);
  return colors;
};

// Fills the canvas above and below the frame with its edge colours, fading into the frame
const drawPortraitSurround = (index, rect) => {
  const { top } = getEdgeColors(index);
  const frameBottom = rect.y + rect.h;

  if (rect.y > 0) {
    context.fillStyle = `rgb(${top})`;
    context.fillRect(0, 0, canvasWidth, Math.ceil(rect.y));
    const fade = context.createLinearGradient(0, rect.y, 0, rect.y + rect.h * 0.12);
    fade.addColorStop(0, `rgba(${top}, 1)`);
    fade.addColorStop(1, `rgba(${top}, 0)`);
    context.fillStyle = fade;
    context.fillRect(0, rect.y, canvasWidth, rect.h * 0.12);
  }

  if (frameBottom < canvasHeight) {
    // The photo ends here; do not manufacture more pavement beneath it.
    context.fillStyle = '#121110';
    context.fillRect(0, Math.floor(frameBottom), canvasWidth, canvasHeight - Math.floor(frameBottom));
    const fade = context.createLinearGradient(0, frameBottom - rect.h * 0.15, 0, frameBottom);
    fade.addColorStop(0, 'rgba(18, 17, 16, 0)');
    fade.addColorStop(1, '#121110');
    context.fillStyle = fade;
    context.fillRect(0, frameBottom - rect.h * 0.15, canvasWidth, rect.h * 0.15);
  }
};

const renderFrame = (index) => {
  // Ensure current and adjacent frames are prioritized immediately, plus a short lookahead
  loadFrame(index, 'high');
  loadFrame(index + 1, 'high');
  for (let i = 2; i <= 8; i++) loadFrame(index + i);
  loadFrame(index - 1);
  loadFrame(index - 2);

  // Draw the requested frame, or the nearest loaded one so the animation never freezes
  let drawIndex = -1;
  for (let d = 0; d < frameCount && drawIndex === -1; d++) {
    if (isFrameReady(index - d)) drawIndex = index - d;
    else if (isFrameReady(index + d)) drawIndex = index + d;
  }

  if (drawIndex !== -1) {
    const img = images[drawIndex];
    drawnIndex = drawIndex;

    const rect = getFrameRect(img.width, img.height);

    // Clear using actual DOM scaled size just in case, or reset transform
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.drawImage(img, rect.x, rect.y, rect.w, rect.h);
    if (isPortraitCanvas()) drawPortraitSurround(drawIndex, rect);
  }
};

// --- Storefront Sign Hotspot Positioning ---
let storefrontSignBtn = null;

const updateStorefrontSignPosition = () => {
  if (!storefrontSignBtn) {
    storefrontSignBtn = document.getElementById('storefront-sign-btn');
  }
  if (!storefrontSignBtn) return;

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const home = document.getElementById('home-view');
  if (scrollTop > 80 || scrollProgressIndex > 5 || (home && !home.classList.contains('active'))) {
    storefrontSignBtn.classList.add('hidden-hotspot');
    return;
  } else {
    storefrontSignBtn.classList.remove('hidden-hotspot');
  }

  const rect = getFrameRect(2560, 1440);

  // Exact coordinates of the main storefront fascia board in 2560x1440 (tightly framing GRABBO inside banner)
  const signLeft = rect.x + (630 / 2560) * rect.w;
  const signTop = rect.y + (240 / 1440) * rect.h;
  const signWidth = ((1740 - 630) / 2560) * rect.w;
  const signHeight = ((475 - 240) / 1440) * rect.h;

  storefrontSignBtn.style.left = `${Math.round(signLeft)}px`;
  storefrontSignBtn.style.top = `${Math.round(signTop)}px`;
  storefrontSignBtn.style.width = `${Math.round(signWidth)}px`;
  storefrontSignBtn.style.height = `${Math.round(signHeight)}px`;
};

let canvasSized = false;

const resizeCanvas = () => {
  // CSS sizes the canvas to the large viewport (100lvh), so mobile address-bar
  // show/hide doesn't change it; skip those resizes to avoid clearing and redrawing
  const width = canvas.clientWidth || window.innerWidth;
  const height = canvas.clientHeight || window.innerHeight;
  if (canvasSized && width === canvasWidth && height === canvasHeight) {
    updateStorefrontSignPosition();
    return;
  }
  canvasSized = true;
  canvasWidth = width;
  canvasHeight = height;

  // Capped at 2: phone 3x screens add memory and draw cost without visible gain here
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;

  // Scale the context to match the device pixel ratio
  context.scale(dpr, dpr);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  updateScrollAnimation();
  renderFrame(scrollProgressIndex);
  updateStorefrontSignPosition();
};

window.addEventListener('resize', resizeCanvas);

// Initial render once the first image is loaded
images[0].onload = () => {
  resizeCanvas(); // This will trigger a renderFrame(0) and updateStorefrontSignPosition()
  if ('requestIdleCallback' in window) requestIdleCallback(loadInitialFrames, { timeout: 3000 });
  else setTimeout(loadInitialFrames, 1500);
};

// The coarse pass only starts once the visitor scrolls, so visitors who never scroll
// download just the first frames
window.addEventListener('scroll', () => {
  loadInitialFrames();
  preloadRemainingFrames();
}, { once: true, passive: true });

// A single pending paint always uses the latest scroll position, even during fast swipes.
let scrollRenderPending = false;
const updateScrollAnimation = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  // Calculate max scroll for the page
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

  let scrollFraction = maxScroll > 0 ? scrollTop / maxScroll : 0;
  if (scrollFraction > 1) scrollFraction = 1;
  if (scrollFraction < 0) scrollFraction = 0;

  // Mobile content grows as cards/news load. Use a stable two-screen distance so
  // the same swipe always reaches the same frame, independent of page length.
  const sequenceFraction = isPortraitCanvas()
    ? Math.max(0, Math.min(1, scrollTop / (canvasHeight * 2)))
    : scrollFraction;
  const frameIndex = isPortraitCanvas()
    ? Math.round(sequenceFraction * (frameCount - 1))
    : Math.min(frameCount - 1, Math.floor(scrollFraction * frameCount));

  // Dim background canvas dynamically on scroll
  const brightness = 1 - (scrollFraction * 0.8);
  canvas.style.opacity = brightness;


  // Linear zoom has no ease-in dead zone at the beginning of the first swipe.
  const zoom = Math.max(0, Math.min(1, scrollTop / canvasHeight));
  const zoomChanged = isPortraitCanvas() && zoom !== portraitZoom;
  portraitZoom = zoom;

  if (scrollProgressIndex !== frameIndex || zoomChanged) {
    scrollProgressIndex = frameIndex;
    if (!scrollRenderPending) {
      scrollRenderPending = true;
      requestAnimationFrame(() => {
        scrollRenderPending = false;
        renderFrame(scrollProgressIndex);
      });
    }
  }
  updateStorefrontSignPosition();
};
window.addEventListener('scroll', updateScrollAnimation, { passive: true });


// --- Page Load Animations ---
// The hero entrance (navbar, title, subtitle, Explore button) is a CSS animation in style.css
// ("Hero entrance"), so it runs on the compositor instead of the main thread during page load.



// Scroll Animation for Product Cards

const observer = new IntersectionObserver((entries) => {

  entries.forEach(entry => {

    if (entry.isIntersecting) {

      anime({

        targets: entry.target,

        translateY: [50, 0],

        opacity: [0, 1],

        easing: 'easeOutQuad',

        duration: 800,

        delay: anime.stagger(150) // Stagger if multiple cards enter

      });

      observer.unobserve(entry.target);

    }

  });

}, { threshold: 0.1 });



document.querySelectorAll('.product-card').forEach(card => {

  card.style.opacity = 0; // hide initially

  observer.observe(card);

});



// --- Catalog SPA Logic ---



// Products, events and testimonials live in ./content.js

// Clean URLs: each view has its own path (vercel.json serves index.html for them)
const ROUTES = { home: '/', products: '/products', about: '/about', events: '/events', story: '/story' };
// Old "#products"-style links are redirected to the matching path on load
const LEGACY_HASHES = { '#home': 'home', '#products': 'products', '#about': 'about', '#events': 'events', '#cafe-fomo': 'cafe-fomo', '#story': 'story' };

const currentRoute = () => {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return Object.keys(ROUTES).find(view => ROUTES[view] === path) || 'home';
};

// Keeps the title, description and canonical URL in step with the visible view
const applyPageMeta = (view) => {
  const meta = pageMeta[view] || pageMeta.home;
  const url = SITE_URL + meta.path;
  document.title = meta.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', url);
  document.querySelector('meta[property="og:url"]')?.setAttribute('content', url);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', meta.title);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', meta.description);
};

const navigateTo = (view) => {
  if (window.location.pathname !== ROUTES[view]) {
    history.pushState({ view }, '', ROUTES[view]);
  }
  applyPageMeta(view);
};

const homeView = document.getElementById('home-view');
const aboutView = document.getElementById('about-view');
const aboutBtn = document.querySelector('a[href="/about"]');
const eventsView = document.getElementById('events-view');
const eventsBtn = document.querySelector('a[href="/events"]');
const cafeFomoView = document.getElementById('cafe-fomo-view');

const catalogView = document.getElementById('catalog-view');

const backToHomeBtn = document.getElementById('back-to-home');

const catalogGrid = document.getElementById('catalog-grid');

const tabBtns = document.querySelectorAll('.tab-btn');



function showCatalog(e, updateHistory = true) {
  if (e && e.preventDefault) e.preventDefault();
  if (updateHistory) navigateTo('products');

  canvas.style.opacity = 0.25;
  window.scrollTo(0, 0);

  // Fade out home, about, events and cafe-fomo
  homeView.style.opacity = '0';
  if (aboutView) aboutView.style.opacity = '0';
  if (eventsView) eventsView.style.opacity = '0';
  if (cafeFomoView) cafeFomoView.style.opacity = '0';

  setTimeout(() => {
    homeView.classList.add('hidden');
    homeView.classList.remove('active');
    if (aboutView) {
      aboutView.classList.add('hidden');
      aboutView.classList.remove('active');
    }
    if (eventsView) {
      eventsView.classList.add('hidden');
      eventsView.classList.remove('active');
    }
    if (cafeFomoView) {
      cafeFomoView.classList.add('hidden');
      cafeFomoView.classList.remove('active');
    }

    // Fade in catalog
    catalogView.classList.remove('hidden');
    catalogView.classList.add('active');

    // Render the default tab if no tab has been rendered yet (the grid may hold the
    // build-time product list, which is replaced here)
    if (!catalogGrid.dataset.category) {
      renderCatalog('precautions');
    }

    catalogView.style.opacity = '1';
    window.scrollTo(0, 0);
  }, 200);
}

function hideCatalog(e, updateHistory = true) {
  if (e && e.preventDefault) e.preventDefault();
  if (updateHistory) navigateTo('home');

  catalogView.style.opacity = '0';
  if (aboutView) aboutView.style.opacity = '0';
  if (eventsView) eventsView.style.opacity = '0';
  if (cafeFomoView) cafeFomoView.style.opacity = '0';
  window.scrollTo(0, 0);

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  let scrollFraction = maxScroll > 0 ? scrollTop / maxScroll : 0;
  canvas.style.opacity = 1 - (scrollFraction * 0.8);

  setTimeout(() => {
    catalogView.classList.add('hidden');
    catalogView.classList.remove('active');
    if (aboutView) {
      aboutView.classList.add('hidden');
      aboutView.classList.remove('active');
    }
    if (eventsView) {
      eventsView.classList.add('hidden');
      eventsView.classList.remove('active');
    }
    if (cafeFomoView) {
      cafeFomoView.classList.add('hidden');
      cafeFomoView.classList.remove('active');
    }

    // Fade in home
    homeView.classList.remove('hidden');
    homeView.classList.add('active');
    homeView.style.opacity = '1';
    window.scrollTo(0, 0);
    setTimeout(updateStorefrontSignPosition, 250);
  }, 200);
}



// Every product is rendered and other tabs' cards are hidden, so the whole catalog stays
// in the page for search engines
function renderCatalog(category) {
  catalogGrid.innerHTML = '';
  catalogGrid.dataset.category = category;
  const categoryProducts = products.filter(prod => prod.category === category);
  const visibleCards = [];

  if (categoryProducts.length === 0) {
    catalogGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; color: #fff; font-size: 1.2rem; background: rgba(22, 20, 18, 0.9); border-radius: 20px;">No products found in this category.</div>`;
  }

  products.forEach((prod, i) => {
    const card = document.createElement('div');
    card.className = 'catalog-card';
    card.style.opacity = '1';
    if (prod.category === category) visibleCards.push(card);
    else card.style.display = 'none';

    const imgContainer = document.createElement('div');
    imgContainer.className = 'catalog-card-img';

    const img = document.createElement('img');
    img.src = prod.image;
    img.alt = prod.name;
    img.className = 'product-image';
    img.loading = 'lazy';
    img.onerror = () => {
      img.src = '/logo.png';
      img.style.objectFit = 'contain';
      img.style.padding = '25px';
    };

    imgContainer.appendChild(img);

    if (prod.suggestion) {
      const badge = document.createElement('div');
      badge.className = 'suggestion-badge';
      badge.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M2 12h20"/></svg>`;
      badge.append(` ${prod.suggestion}`);
      imgContainer.appendChild(badge);
    }

    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'catalog-card-details';

    const title = document.createElement('h3');
    title.textContent = prod.name;

    const desc = document.createElement('p');
    desc.textContent = prod.desc;

    const meta = document.createElement('div');
    meta.className = 'catalog-card-meta';
    meta.innerHTML = `
      <span class="catalog-price"></span>
      <span class="catalog-stock-tag">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
        In Stock @ Arcade
      </span>
    `;
    meta.querySelector('.catalog-price').textContent = prod.price || 'In Store';

    detailsContainer.appendChild(title);
    detailsContainer.appendChild(desc);
    detailsContainer.appendChild(meta);

    card.appendChild(imgContainer);
    card.appendChild(detailsContainer);

    catalogGrid.appendChild(card);
  });

  if (typeof anime !== 'undefined' && visibleCards.length) {
    anime({
      targets: visibleCards,
      opacity: [0, 1],
      translateY: [15, 0],
      duration: 400,
      easing: 'easeOutQuad',
      delay: anime.stagger(30)
    });
  }
}



// Event Listeners

function showAbout(e, updateHistory = true) {
  if (e && e.preventDefault) e.preventDefault();
  if (updateHistory) navigateTo('about');

  canvas.style.opacity = 0.3;
  window.scrollTo(0, 0);

  homeView.style.opacity = '0';
  catalogView.style.opacity = '0';
  if (eventsView) eventsView.style.opacity = '0';
  if (cafeFomoView) cafeFomoView.style.opacity = '0';
  if (storefrontSignBtn) storefrontSignBtn.classList.add('hidden-hotspot');
  if (customCursor) {
    isHoveringSign = false;
    customCursor.classList.remove('sign-hover');
    customCursor.style.width = '';
    customCursor.style.height = '';
    customCursor.style.transform = 'translate(-50%, -50%)';
  }

  setTimeout(() => {
    homeView.classList.add('hidden');
    homeView.classList.remove('active');
    catalogView.classList.add('hidden');
    catalogView.classList.remove('active');
    if (eventsView) {
      eventsView.classList.add('hidden');
      eventsView.classList.remove('active');
    }
    if (cafeFomoView) {
      cafeFomoView.classList.add('hidden');
      cafeFomoView.classList.remove('active');
    }

    aboutView.classList.remove('hidden');
    aboutView.classList.add('active');
    aboutView.style.opacity = '1';
    window.scrollTo(0, 0);
  }, 200);
}

function showEvents(e, updateHistory = true) {
  if (e && e.preventDefault) e.preventDefault();
  if (updateHistory) navigateTo('events');

  canvas.style.opacity = 0.3;
  window.scrollTo(0, 0);

  homeView.style.opacity = '0';
  catalogView.style.opacity = '0';
  if (aboutView) aboutView.style.opacity = '0';
  if (cafeFomoView) cafeFomoView.style.opacity = '0';

  setTimeout(() => {
    homeView.classList.add('hidden');
    homeView.classList.remove('active');
    catalogView.classList.add('hidden');
    catalogView.classList.remove('active');
    if (aboutView) {
      aboutView.classList.add('hidden');
      aboutView.classList.remove('active');
    }
    if (cafeFomoView) {
      cafeFomoView.classList.add('hidden');
      cafeFomoView.classList.remove('active');
    }

    eventsView.classList.remove('hidden');
    eventsView.classList.add('active');
    eventsView.style.opacity = '1';
    window.scrollTo(0, 0);
  }, 200);
}

function showCafeFomo(e, updateHistory = true) {
  if (e && e.preventDefault) e.preventDefault();
  if (updateHistory) navigateTo('cafe-fomo');

  canvas.style.opacity = 0.3;
  window.scrollTo(0, 0);

  homeView.style.opacity = '0';
  catalogView.style.opacity = '0';
  if (aboutView) aboutView.style.opacity = '0';
  if (eventsView) eventsView.style.opacity = '0';

  setTimeout(() => {
    homeView.classList.add('hidden');
    homeView.classList.remove('active');
    catalogView.classList.add('hidden');
    catalogView.classList.remove('active');
    if (aboutView) {
      aboutView.classList.add('hidden');
      aboutView.classList.remove('active');
    }
    if (eventsView) {
      eventsView.classList.add('hidden');
      eventsView.classList.remove('active');
    }

    cafeFomoView.classList.remove('hidden');
    cafeFomoView.classList.add('active');
    cafeFomoView.style.opacity = '1';
    window.scrollTo(0, 0);
  }, 200);
}

// Starting screen "Explore Now" button -> Opens About view
const heroExploreBtn = document.querySelector('.hero .explore-btn');
if (heroExploreBtn) {
  heroExploreBtn.addEventListener('click', (e) => showAbout(e, true));
}

// Navbar "Products" link -> Opens Catalog view
document.querySelectorAll('a[href="/products"]').forEach(btn => {
  btn.addEventListener('click', (e) => showCatalog(e, true));
});

// Navbar "Events" link -> Opens Events view
document.querySelectorAll('a[href="/events"]').forEach(btn => {
  btn.addEventListener('click', (e) => showEvents(e, true));
});

// Café FOMO is a dedicated separate page (/cafe-fomo) -> allow natural browser navigation
// (No click interception so the separate page opens cleanly)

// About & Events: clicking the dimmed area outside the card returns to Home
const dismissibleViews = [
  { view: aboutView, card: '.about-card' },
  { view: eventsView, card: '.events-container' }
];
// Navbar links and the logo do their own navigation; empty navbar space counts as outside
const isOutsideCard = (target, card) => !target.closest(card) && !target.closest('.navbar a, .navbar button, #logo-home-btn');
let pointerDownTarget = null;

// Remember where the press started, so selecting text inside the card and releasing outside doesn't close it
document.addEventListener('pointerdown', (e) => {
  pointerDownTarget = e.target;
});

document.addEventListener('click', (e) => {
  const open = dismissibleViews.find(({ view }) => view && view.classList.contains('active'));
  if (!open || !pointerDownTarget) return;
  if (isOutsideCard(e.target, open.card) && isOutsideCard(pointerDownTarget, open.card)) {
    hideCatalog(null, true);
  }
});

// Esc closes About, Events, Café FOMO or Products
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const anyOpen = [aboutView, eventsView, cafeFomoView, catalogView].some(view => view && view.classList.contains('active'));
  if (anyOpen) hideCatalog(null, true);
});

// Show the whole Story section: centred when it fits in the window, otherwise aligned to the top
const scrollSectionIntoView = (target) => {
  const rect = target.getBoundingClientRect();
  const offset = rect.height < window.innerHeight ? (window.innerHeight - rect.height) / 2 : 0;
  window.scrollTo({ top: window.scrollY + rect.top - offset, behavior: 'smooth' });
};

// Navbar "Story" link -> Scrolls down to the Story section
function scrollToStory(e, updateHistory = true) {
  if (e && e.preventDefault) e.preventDefault();
  if (updateHistory) navigateTo('story');
  scrollToHomeSection(document.getElementById('story') || document.getElementById('author-section'));
}

// Shows the home view if another view is open, then scrolls to a section on it
function scrollToHomeSection(storyTarget) {
  if (!storyTarget) return;

  const isHomeActive = homeView && homeView.classList.contains('active') && !homeView.classList.contains('hidden');

  if (!isHomeActive) {
    catalogView.style.opacity = '0';
    if (aboutView) aboutView.style.opacity = '0';
    if (eventsView) eventsView.style.opacity = '0';
    if (cafeFomoView) cafeFomoView.style.opacity = '0';

    catalogView.classList.add('hidden');
    catalogView.classList.remove('active');
    if (aboutView) {
      aboutView.classList.add('hidden');
      aboutView.classList.remove('active');
    }
    if (eventsView) {
      eventsView.classList.add('hidden');
      eventsView.classList.remove('active');
    }
    if (cafeFomoView) {
      cafeFomoView.classList.add('hidden');
      cafeFomoView.classList.remove('active');
    }

    homeView.classList.remove('hidden');
    homeView.classList.add('active');
    homeView.style.opacity = '1';

    setTimeout(() => scrollSectionIntoView(storyTarget), 150);
  } else {
    scrollSectionIntoView(storyTarget);
  }
}

document.querySelectorAll('a[href="/story"], .nav-story-link').forEach(btn => {
  btn.addEventListener('click', (e) => scrollToStory(e, true));
});

const navbar = document.querySelector('.navbar');
const navMenuToggle = document.querySelector('.nav-menu-toggle');
const navMenu = document.getElementById('primary-nav-menu');
const closeMobileNavMenu = () => {
  navbar?.classList.remove('menu-open');
  navMenuToggle?.setAttribute('aria-expanded', 'false');
  navMenuToggle?.setAttribute('aria-label', 'Open navigation menu');
};

if (navbar && navMenuToggle && navMenu) {
  navMenuToggle.addEventListener('click', () => {
    const isOpen = navbar.classList.toggle('menu-open');
    navMenuToggle.setAttribute('aria-expanded', String(isOpen));
    navMenuToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  });

  navMenu.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) closeMobileNavMenu();
  });

  navbar.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('#logo-home-btn')) closeMobileNavMenu();
  });

  document.addEventListener('click', (event) => {
    if (event.target instanceof Node && !navbar.contains(event.target)) closeMobileNavMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMobileNavMenu();
  });
}

// Navbar "Query" link and footer "Ask us" -> Scrolls down to the Queries & Collaboration form
document.querySelectorAll('.nav-query-link, a[href="#queries"]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('home');
    scrollToHomeSection(document.getElementById('queries'));
  });
});

// Navbar "About" link fallback -> Opens About view
document.querySelectorAll('a[href="/about"]').forEach(btn => {
  btn.addEventListener('click', (e) => showAbout(e, true));
});

document.querySelectorAll('.close-overlay-btn, .about-back-btn, .events-back-btn, .cafe-fomo-back-btn, #back-to-home').forEach(btn => {
  btn.addEventListener('click', (e) => hideCatalog(e, true));
});

// Direct redirect button inside About view -> Opens Catalog view
document.querySelectorAll('.about-explore-btn, .direct-catalog-btn, #about-redirect-catalog-btn').forEach(btn => {
  btn.addEventListener('click', (e) => showCatalog(e, true));
});

// Storefront Sign (Main Fascia Board) Click -> Open About Section
const signHotspot = document.getElementById('storefront-sign-btn');
if (signHotspot) {
  signHotspot.addEventListener('mouseenter', () => {
    if (!customCursor) return;
    isHoveringSign = true;
    customCursor.classList.remove('hover', 'text-hover');
    customCursor.classList.add('sign-hover');

    const rect = signHotspot.getBoundingClientRect();
    customCursor.style.left = `${rect.left + rect.width / 2}px`;
    customCursor.style.top = `${rect.top + rect.height / 2}px`;
    customCursor.style.width = `${rect.width}px`;
    customCursor.style.height = `${rect.height}px`;
  });

  signHotspot.addEventListener('mouseleave', () => {
    if (!customCursor) return;
    isHoveringSign = false;
    customCursor.classList.remove('sign-hover');
    customCursor.style.width = '';
    customCursor.style.height = '';
    customCursor.style.transform = 'translate(-50%, -50%)';
  });

  signHotspot.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (customCursor) {
      isHoveringSign = false;
      customCursor.classList.remove('sign-hover');
      customCursor.style.width = '';
      customCursor.style.height = '';
      customCursor.style.transform = 'translate(-50%, -50%)';
    }
    showAbout();
  });
}

// Canvas click backup for the storefront sign (frame 0 only)
canvas.addEventListener('click', (e) => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const home = document.getElementById('home-view');
  if (scrollTop > 80 || scrollProgressIndex > 5 || (home && !home.classList.contains('active'))) return;

  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  const frameRect = getFrameRect(2560, 1440);
  const signLeft = frameRect.x + (630 / 2560) * frameRect.w;
  const signTop = frameRect.y + (240 / 1440) * frameRect.h;
  const signWidth = ((1740 - 630) / 2560) * frameRect.w;
  const signHeight = ((475 - 240) / 1440) * frameRect.h;

  if (
    clickX >= signLeft &&
    clickX <= signLeft + signWidth &&
    clickY >= signTop &&
    clickY <= signTop + signHeight
  ) {
    showAbout();
  }
});





tabBtns.forEach(btn => {

  btn.addEventListener('click', () => {

    // Update active tab

    tabBtns.forEach(b => b.classList.remove('active'));

    btn.classList.add('active');



    // Render category

    const cat = btn.getAttribute('data-category');

    renderCatalog(cat);

  });

});

// --- Health News: outbreak headlines from trusted outlets (newsSources in content.js) ---
const NEWS_LOOKBACK_DAYS = 14;
const NEWS_QUERY = `(dengue OR malaria OR chikungunya OR H1N1 OR "swine flu" OR "viral fever" OR influenza OR covid OR typhoid OR cholera OR cough OR pollution OR aqi OR smog OR respiratory) (delhi OR noida OR "greater noida" OR gurugram OR ghaziabad OR ncr) when:${NEWS_LOOKBACK_DAYS}d`;
const NEWS_URL = `/api/news/rss/search?q=${encodeURIComponent(NEWS_QUERY)}&hl=en-IN&gl=IN&ceid=IN:en`;
const MAX_NEWS_CARDS = 8;
const MIN_NEWS_CARDS = 3; // topped up with health tips below this
const NCR_PATTERN = /delhi|noida|gurugram|gurgaon|ghaziabad|faridabad|\bncr\b/i;
// Filter for genuine medical/health/spread context
const HEALTH_CONTEXT = /\bcases?\b|outbreak|surge|spike|\brise\b|rising|infect|patients?|deaths?|\bdied\b|hospitali[sz]|alert|advisory|symptoms?|prevent|precaution|spread|\bwave\b|down with|fevers?|cough|respiratory|illness|illnesses|doctor|doctors|health|complication|complications|warn|warning|treatment|care|hospital|hospitals|aqi|pollution/i;
const OFF_TOPIC = /fraud|scam|insur|\bclaim|court|appeal|verdict|stock|shares|tariff|price|budget|tender|criticism|diploma|refund|scoreboard|cricket|bjp|congress|rahul gandhi|modi|politics|minister/i;

const NEWS_TOPICS = [
  { pattern: /dengue|chikungunya|malaria|mosquito|vector/i, label: 'Dengue & Malaria Alert', tip: 'Use mosquito repellent, wear full sleeves after sunset, and don\'t let water collect near your room.' },
  { pattern: /h1n1|swine flu|influenza|viral fever/i, label: 'Flu & Viral Alert', tip: 'Wear a mask in crowded places, wash hands often, and see a doctor if a fever lasts more than two days.' },
  { pattern: /\bflu\b/i, label: 'Flu & Viral Alert', tip: 'Wear a mask in crowded places, wash hands often, and see a doctor if a fever lasts more than two days.' },
  { pattern: /covid/i, label: 'Covid Update', tip: 'Mask up in crowded indoor spaces, sanitise your hands, and get tested if you have symptoms.' },
  { pattern: /typhoid|cholera/i, label: 'Water-borne Alert', tip: 'Drink only purified water, avoid uncovered street food, and keep ORS handy.' },
  { pattern: /cough|pollution|aqi|smog|respiratory|breathing|asthma/i, label: 'Air Quality & Respiratory Alert', tip: 'Wear an N95 mask outdoors, avoid strenuous exercise during peak smog hours, and stay hydrated.' }
];

const formatNewsDate = (date) => {
  const hours = Math.floor((Date.now() - date.getTime()) / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (hours < 48) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const isTrustedNewsSource = (url) => {
  let host = '';
  try {
    host = new URL(url).hostname.replace(/^(www|m)\./, '');
  } catch (e) {
    return false;
  }
  return newsSources.some(domain => host === domain || host.endsWith(`.${domain}`));
};

// Google News RSS -> news cards: trusted outlets only, recent, on-topic, Delhi NCR stories first
function parseHealthNews(xmlText) {
  const items = new DOMParser().parseFromString(xmlText, 'text/xml').querySelectorAll('item');
  const cutoff = Date.now() - NEWS_LOOKBACK_DAYS * 24 * 3600000;
  const seenTitles = new Set();
  const cards = [];

  items.forEach(item => {
    const source = item.querySelector('source');
    if (!source || !isTrustedNewsSource(source.getAttribute('url'))) return;
    const sourceName = source.textContent.trim();

    // Google appends " - <Source Name>" to every headline
    let title = (item.querySelector('title')?.textContent || '').trim();
    if (sourceName && title.endsWith(` - ${sourceName}`)) {
      title = title.slice(0, -(sourceName.length + 3)).trim();
    }

    const topic = NEWS_TOPICS.find(t => t.pattern.test(title));
    if (!topic || OFF_TOPIC.test(title)) return;
    const isNCR = NCR_PATTERN.test(title);
    if ((topic.needsContext || !isNCR) && !HEALTH_CONTEXT.test(title)) return;

    const published = new Date(item.querySelector('pubDate')?.textContent || '');
    if (isNaN(published.getTime()) || published.getTime() < cutoff) return;

    const titleKey = title.toLowerCase();
    if (seenTitles.has(titleKey)) return;
    seenTitles.add(titleKey);

    // Link back to the original article; validate scheme
    let link = '';
    try {
      const rawLink = item.querySelector('link')?.textContent.trim()
        || item.getElementsByTagName('link')[0]?.textContent.trim()
        || '';
      if (rawLink) {
        const url = new URL(rawLink);
        if (url.protocol === 'https:' || url.protocol === 'http:') link = url.href;
      }
    } catch (e) {
      // invalid url
    }

    // Secondary fallback: extract anchor href from <description>
    if (!link) {
      const descText = item.querySelector('description')?.textContent || '';
      const hrefMatch = descText.match(/href="([^"]+)"/i);
      if (hrefMatch && hrefMatch[1]) {
        try {
          const url = new URL(hrefMatch[1]);
          if (url.protocol === 'https:' || url.protocol === 'http:') link = url.href;
        } catch (e) {}
      }
    }

    // Tertiary fallback: link to verified publisher domain
    if (!link && source.getAttribute('url')) {
      link = source.getAttribute('url');
    }

    cards.push({
      badge: `${topic.label} • ${isNCR ? 'Delhi NCR' : 'India'}`,
      title,
      link,
      source: `${sourceName} • ${formatNewsDate(published)}`,
      sourceName,
      desc: `Grabbo tip: ${topic.tip}`,
      action: `Read on ${sourceName}`,
      category: 'precautions',
      isNCR,
      published
    });
  });

  return cards
    .sort((a, b) => (b.isNCR - a.isNCR) || (b.published - a.published))
    .slice(0, MAX_NEWS_CARDS);
}

async function fetchHealthNews() {
  const newsGrid = document.getElementById('dynamic-news-grid');
  if (!newsGrid) return;

  // Fallback advisories linking directly to verified global/national health bodies
  const fallbackAlerts = [
    {
      badge: "Grabbo Health Advisory",
      title: "Seasonal Viral & H1N1 Flu Advisory",
      desc: "Weather transitions and seasonal humidity often cause surges in viral coughs and sore throats. Grabbo recommends keeping N95 masks, Crocin, and Vicks handy in your hostel room.",
      source: "World Health Organization • Global Health Advisory",
      sourceName: "WHO Advisory",
      link: "https://www.who.int/news-room/fact-sheets/detail/influenza-(seasonal)",
      action: "Read WHO Advisory",
      category: "precautions"
    },
    {
      badge: "Grabbo Health Advisory",
      title: "Dengue & Mosquito Defense Measures",
      desc: "Stagnant rainwater after seasonal showers increases vector-borne risks. Protect yourself during evening study walks with Odomos mosquito repellent cream and protective lotions.",
      source: "World Health Organization • Vector Health Advisory",
      sourceName: "WHO Advisory",
      link: "https://www.who.int/news-room/fact-sheets/detail/dengue-and-severe-dengue",
      action: "Read WHO Advisory",
      category: "precautions"
    },
    {
      badge: "Grabbo Health Advisory",
      title: "Electrolyte Balance & Exhaustion Care",
      desc: "Humid campus days and long study sessions quickly drain vital salts and energy. Replenish with WHO-standard Electral ORS and cold energy drinks from Grabbo.",
      source: "World Health Organization • Hydration & Health",
      sourceName: "WHO Advisory",
      link: "https://www.who.int/news-room/fact-sheets/detail/diarrhoeal-disease",
      action: "Read WHO Advisory",
      category: "precautions"
    }
  ];

  function createCardElement(item) {
    // The entire card is an anchor linking directly to the external publisher article
    const card = document.createElement('a');
    card.className = 'product-card news-card';
    card.href = item.link || '#';
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.setAttribute('data-category', item.category || 'precautions');
    card.setAttribute('aria-label', `${item.title} - Read full article on ${item.sourceName || 'external publisher'}`);

    // Static markup only; feed-supplied text is set via textContent for security
    card.innerHTML = `
      <div class="news-card-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
        <span class="news-card-badge-text"></span>
      </div>
      <h3 class="news-card-title"></h3>
      <p class="news-card-source"></p>
      <p class="news-card-desc"></p>
      <div class="news-card-action">
        <span class="news-card-action-text"></span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
      </div>
    `;

    card.querySelector('.news-card-badge-text').textContent = item.badge;
    card.querySelector('.news-card-title').textContent = item.title;

    const sourceEl = card.querySelector('.news-card-source');
    if (item.source) {
      sourceEl.textContent = `${item.source} ↗`;
    } else {
      sourceEl.remove();
    }

    card.querySelector('.news-card-desc').textContent = item.desc;
    card.querySelector('.news-card-action-text').textContent = item.action || `Read on ${item.sourceName || 'Publisher'}`;

    return card;
  }

  function renderNewsCards(cards) {
    newsGrid.innerHTML = '';

    // Ensure we have enough cards to fill and loop seamlessly
    let list = [...cards];
    while (list.length < 6) {
      list = list.concat(cards);
    }

    // Track 1
    const group1 = document.createElement('div');
    group1.className = 'news-marquee-group';
    list.forEach(item => {
      group1.appendChild(createCardElement(item));
    });

    // Track 2 (Clone for infinite seamless loop)
    const group2 = document.createElement('div');
    group2.className = 'news-marquee-group';
    group2.setAttribute('aria-hidden', 'true');
    list.forEach(item => {
      group2.appendChild(createCardElement(item));
    });
    // The clone is decorative; keep its links out of keyboard navigation
    group2.querySelectorAll('a, button').forEach(el => el.setAttribute('tabindex', '-1'));

    newsGrid.appendChild(group1);
    newsGrid.appendChild(group2);
  }

  let newsCards = [];
  try {
    const response = await fetch(NEWS_URL);
    if (response.ok) {
      newsCards = parseHealthNews(await response.text());
    }
  } catch (err) {
    console.warn('Health news unavailable, showing health tips:', err);
  }

  // Top up with health tips when there are only a few (or no) recent headlines
  const tips = fallbackAlerts.slice(0, Math.max(0, MIN_NEWS_CARDS - newsCards.length));
  renderNewsCards([...newsCards, ...tips]);
}

fetchHealthNews();

// --- Campus Testimonials Marquee ---
function initTestimonials() {
  const testimonialsGrid = document.getElementById('dynamic-testimonials-grid');
  if (!testimonialsGrid) return;

  function createTestimonialCard(item) {
    const card = document.createElement('div');
    card.className = 'testimonial-card';

    card.innerHTML = `
      <div>
        <div class="testimonial-top-row">
          <div class="testimonial-stars" aria-label="5 stars">★★★★★</div>
          <span class="testimonial-badge"></span>
        </div>
        <p class="testimonial-text"></p>
      </div>
      <div class="testimonial-author-row">
        <div class="testimonial-avatar"></div>
        <div class="testimonial-author-info">
          <strong></strong>
          <span></span>
        </div>
      </div>
    `;
    card.querySelector('.testimonial-badge').textContent = item.badge;
    card.querySelector('.testimonial-text').textContent = `“${item.text}”`;
    card.querySelector('.testimonial-avatar').textContent = item.avatar;
    card.querySelector('.testimonial-author-info strong').textContent = item.author;
    card.querySelector('.testimonial-author-info span').textContent = item.role;

    return card;
  }

  // Create two identical groups for seamless infinite loop (just like health news)
  const group1 = document.createElement('div');
  group1.className = 'testimonials-marquee-group';
  testimonials.forEach(item => {
    group1.appendChild(createTestimonialCard(item));
  });

  const group2 = document.createElement('div');
  group2.className = 'testimonials-marquee-group';
  group2.setAttribute('aria-hidden', 'true');
  testimonials.forEach(item => {
    group2.appendChild(createTestimonialCard(item));
  });

  testimonialsGrid.innerHTML = '';
  testimonialsGrid.appendChild(group1);
  testimonialsGrid.appendChild(group2);
}

initTestimonials();

// --- Events (About page & Events page) ---
// An event is past from the day after its endDate, in the visitor's local time
const todayISO = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
const isPastEvent = event => Boolean(event.endDate) && event.endDate < todayISO;

function createEventCard(event, isPast = false) {
  const card = document.createElement('div');
  card.className = event.featured ? 'event-card featured-event-card' : 'event-card';
  if (isPast) card.classList.add('past-event-card');

  card.innerHTML = `
    <div class="event-card-img">
      <img loading="lazy">
      <div class="event-img-overlay-badge"><span></span></div>
    </div>
    <div class="event-card-body">
      <div class="event-badge-row">
        <span class="event-status-pill fest"></span>
        <span class="event-category-tag"></span>
      </div>
      <h3 class="event-title"></h3>
      <p class="event-desc"></p>
      <div class="event-meta">
        <div class="event-meta-item">
          <span class="meta-icon">📅</span>
          <div><strong>Date & Time:</strong> <span class="event-date"></span></div>
        </div>
        <div class="event-meta-item">
          <span class="meta-icon">📍</span>
          <div><strong>Location:</strong> <span class="event-location"></span></div>
        </div>
        <div class="event-meta-item">
          <span class="meta-icon">🤝</span>
          <div><strong>Hosted by:</strong> <span class="event-host"></span></div>
        </div>
      </div>
      <div class="event-perk-badge"></div>
    </div>
  `;

  const img = card.querySelector('.event-card-img img');
  img.src = event.image;
  img.alt = event.imageAlt || event.title;
  card.querySelector('.event-status-pill').textContent = event.status || '';
  card.querySelector('.event-category-tag').textContent = event.tag || '';
  card.querySelector('.event-title').textContent = event.title;
  card.querySelector('.event-desc').textContent = event.desc;
  card.querySelector('.event-date').textContent = event.date;
  card.querySelector('.event-location').textContent = event.location;
  card.querySelector('.event-host').textContent = event.host;

  if (event.featured) {
    card.querySelector('.event-card-img').classList.add('featured-img');
    card.querySelector('.event-title').style.cssText = 'font-size: 1.85rem; margin-bottom: 12px;';
  }
  // Optional fields: drop their elements when left out
  if (event.imageBadge) {
    card.querySelector('.event-img-overlay-badge span').textContent = event.imageBadge;
  } else {
    card.querySelector('.event-img-overlay-badge').remove();
  }
  if (event.perk) {
    card.querySelector('.event-perk-badge').textContent = event.perk;
  } else {
    card.querySelector('.event-perk-badge').remove();
  }
  if (isPast) {
    const pill = card.querySelector('.event-status-pill');
    pill.className = 'event-status-pill past';
    pill.textContent = '✓ Past Event';
  } else if (!event.status) {
    card.querySelector('.event-status-pill').remove();
  }
  if (!event.tag) card.querySelector('.event-category-tag').remove();

  return card;
}

function initEvents() {
  const upcomingEvents = events.filter(event => !isPastEvent(event));
  const pastEvents = events.filter(isPastEvent);

  const upcomingContainers = [
    document.getElementById('about-events-list'),
    document.getElementById('events-grid')
  ];

  upcomingContainers.forEach(container => {
    if (!container) return;
    container.innerHTML = '';

    if (upcomingEvents.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'events-empty-note';
      empty.innerHTML = 'No upcoming events right now. Follow <a href="https://www.instagram.com/grabbo_snu" target="_blank" rel="noopener noreferrer">@grabbo_snu</a> for announcements.';
      container.appendChild(empty);
      return;
    }

    upcomingEvents.forEach(event => container.appendChild(createEventCard(event)));
  });

  // Past events: Events page only, most recent first
  const pastSection = document.getElementById('past-events-section');
  const pastGrid = document.getElementById('past-events-grid');
  if (!pastSection || !pastGrid) return;

  pastGrid.innerHTML = '';
  pastSection.hidden = pastEvents.length === 0;
  pastEvents
    .sort((a, b) => b.endDate.localeCompare(a.endDate))
    .forEach(event => pastGrid.appendChild(createEventCard(event, true)));
}

initEvents();

// Opens the Products view on a given category tab
function openCatalogCategory(category) {
  tabBtns.forEach(b => b.classList.remove('active'));
  const targetTab = Array.from(tabBtns).find(b => b.getAttribute('data-category') === category);
  if (targetTab) targetTab.classList.add('active');
  renderCatalog(category);
  showCatalog();
}

// --- Weather at SNU: food picks for the current campus weather (picks in content.js) ---
const WEATHER_URL = '/api/weather';
const WEATHER_REFRESH_MS = 30 * 60 * 1000;
const RAIN_SYMBOL = /rain|sleet|snow|thunder|shower/;

// MET Norway symbol codes, e.g. "partlycloudy_day", "lightrainshowers_night"
const WEATHER_LABELS = [
  [/thunder/, 'Thunderstorms'],
  [/heavyrain/, 'Heavy rain'],
  [/lightrain/, 'Light rain'],
  [/rain|shower/, 'Rainy'],
  [/sleet|snow/, 'Sleet'],
  [/fog/, 'Foggy'],
  [/clearsky/, 'Clear skies'],
  [/fair/, 'Mostly clear'],
  [/partlycloudy/, 'Partly cloudy'],
  [/cloudy/, 'Cloudy']
];

const weatherMood = (temperature, symbol, precipitation) => {
  if (RAIN_SYMBOL.test(symbol) || precipitation >= 0.3) return 'rainy';
  if (temperature >= 32) return 'hot';
  if (temperature >= 26) return 'warm';
  if (temperature >= 18) return 'pleasant';
  return 'cold';
};

// Used when live weather is unavailable: typical Delhi NCR seasons by month (in IST)
const seasonalMood = () => {
  const month = Number(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', month: 'numeric' }));
  if (month >= 4 && month <= 6) return 'hot';
  if (month >= 7 && month <= 9) return 'rainy';
  if (month === 12 || month <= 2) return 'cold';
  return 'pleasant';
};

function createWeatherProductCard(prod) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'weather-product';
  card.innerHTML = `
    <span class="weather-product-img"><img loading="lazy"></span>
    <span class="weather-product-name"></span>
    <span class="weather-product-price"></span>
  `;
  const img = card.querySelector('img');
  img.src = prod.image.replace('/products/', '/products/thumbs/'); // 240px copies made for these small cards
  img.alt = prod.name;
  img.onerror = () => {
    img.src = '/logo.png';
  };
  card.querySelector('.weather-product-name').textContent = prod.name;
  card.querySelector('.weather-product-price').textContent = prod.price || 'In Store';
  card.addEventListener('click', () => openCatalogCategory(prod.category));
  return card;
}

function renderWeatherPicks(mood, reading) {
  const suggestion = weatherSuggestions[mood];
  const productsEl = document.getElementById('weather-products');
  if (!suggestion || !productsEl) return;

  document.getElementById('weather-icon').textContent = suggestion.icon;
  document.getElementById('weather-title').textContent = suggestion.title;
  document.getElementById('weather-subtitle').textContent = suggestion.subtitle;

  const tempEl = document.getElementById('weather-temp');
  const conditionEl = document.getElementById('weather-condition');
  const creditEl = document.getElementById('weather-credit');
  if (reading) {
    tempEl.textContent = `${Math.round(reading.temperature)}°C`;
    tempEl.hidden = false;
    conditionEl.textContent = `${reading.label} on campus right now`;
    creditEl.hidden = false;
  } else {
    // No live reading: show seasonal picks without claiming a current temperature
    tempEl.hidden = true;
    conditionEl.textContent = 'Seasonal picks for this time of year';
    creditEl.hidden = true;
  }

  productsEl.innerHTML = '';
  suggestion.products
    .map(name => products.find(prod => prod.name === name))
    .filter(Boolean)
    .forEach(prod => productsEl.appendChild(createWeatherProductCard(prod)));
}

async function updateWeatherPicks() {
  try {
    const response = await fetch(WEATHER_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    // Forecast steps are hourly; use the one covering the current hour
    const now = Date.now();
    const steps = data?.properties?.timeseries || [];
    const current = steps.find((step, i) => !steps[i + 1] || Date.parse(steps[i + 1].time) > now);
    const temperature = current?.data?.instant?.details?.air_temperature;
    if (typeof temperature !== 'number') throw new Error('No temperature in forecast');

    const nextHour = current.data.next_1_hours || {};
    const symbol = nextHour.summary?.symbol_code || '';
    const precipitation = nextHour.details?.precipitation_amount || 0;
    const label = (WEATHER_LABELS.find(([pattern]) => pattern.test(symbol)) || [null, 'Current weather'])[1];

    renderWeatherPicks(weatherMood(temperature, symbol, precipitation), { temperature, label });
  } catch (err) {
    console.warn('SNU weather unavailable, showing seasonal picks:', err);
    renderWeatherPicks(seasonalMood(), null);
  }
}

updateWeatherPicks();
setInterval(updateWeatherPicks, WEATHER_REFRESH_MS);

// --- SPA Router: Browser Back/Forward & Direct URL Sync ---
const logoHomeBtn = document.getElementById('logo-home-btn');
if (logoHomeBtn) {
  logoHomeBtn.addEventListener('click', (e) => hideCatalog(e, true));
}

// Popstate listener handles browser Back & Forward navigation seamlessly
window.addEventListener('popstate', () => {
  const route = currentRoute();
  applyPageMeta(route);
  if (route === 'products') {
    showCatalog(null, false);
  } else if (route === 'about') {
    showAbout(null, false);
  } else if (route === 'events') {
    showEvents(null, false);
  } else if (route === 'cafe-fomo') {
    showCafeFomo(null, false);
  } else if (route === 'story') {
    scrollToStory(null, false);
  } else {
    hideCatalog(null, false);
  }
});

// About routing resets the cursor, so initialize its state before opening a deep link.
const customCursor = document.getElementById('custom-cursor');
let isHoveringSign = false;

// Initial route inspection on page load (old "#view" links are rewritten to their clean path first)
const legacyView = LEGACY_HASHES[window.location.hash];
if (legacyView) {
  history.replaceState({ view: legacyView }, '', ROUTES[legacyView]);
}
const initialRoute = currentRoute();
applyPageMeta(initialRoute);
if (initialRoute === 'products') {
  showCatalog(null, false);
} else if (initialRoute === 'about') {
  showAbout(null, false);
} else if (initialRoute === 'events') {
  showEvents(null, false);
} else if (initialRoute === 'story') {
  setTimeout(() => scrollToStory(null, false), 400);
}

// --- Queries & Collaboration form ---
// Sent with EmailJS (https://www.emailjs.com). These IDs are public by design; the VITE_EMAILJS_*
// variables (see .env.example) can override them. If any is empty, "Send Query" opens a pre-filled email instead.
const EMAILJS = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_9dha86m',
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_yl2x5dc',
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'L9aCpqQ90KTRu-ZCb'
};
// Every query is delivered here (the EmailJS template's "To Email" is {{to_email}})
const QUERY_INBOX = 'grabbo37@gmail.com';
const emailjsReady = Boolean(EMAILJS.serviceId && EMAILJS.templateId && EMAILJS.publicKey);

const sendWithEmailJS = async (params) => {
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS.serviceId,
      template_id: EMAILJS.templateId,
      user_id: EMAILJS.publicKey,
      template_params: params
    })
  });
  if (!res.ok) throw new Error(`EmailJS ${res.status}: ${await res.text()}`);
};

const queryForm = document.getElementById('query-form');
const queryStatus = document.getElementById('query-status');
const querySubmit = queryForm?.querySelector('.query-submit');
const setQueryStatus = (text, state) => {
  if (!queryStatus) return;
  queryStatus.textContent = text;
  queryStatus.dataset.state = state || '';
};

if (queryForm) {
  queryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(queryForm);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const topic = String(data.get('topic') || 'General query');
    const message = String(data.get('message') || '').trim();
    if (!name || !email) return;

    const intro = message || '(no message)';
    const subject = `[${topic}] Query from ${name}`;
    const body = `Hi Grabbo,\n\n${intro}\n\nName: ${name}\nEmail: ${email}\n${phone ? `Phone: ${phone}\n` : ''}`;

    if (!emailjsReady) {
      window.location.href = `mailto:${QUERY_INBOX}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return;
    }

    if (querySubmit) querySubmit.disabled = true;
    setQueryStatus('Sending…', 'pending');
    try {
      // These names are the {{variables}} available in the EmailJS template
      await sendWithEmailJS({
        name,
        email,
        phone: phone || 'Not given',
        topic,
        message: intro,
        subject,
        reply_to: email,
        to_email: QUERY_INBOX
      });
      queryForm.reset();
      setQueryStatus(`Thanks, ${name}! We got your query and will reply to ${email} soon.`, 'success');
    } catch (err) {
      console.error(err);
      setQueryStatus(`Sorry, that didn\'t go through. Please try again, or email us at ${QUERY_INBOX}.`, 'error');
    } finally {
      if (querySubmit) querySubmit.disabled = false;
    }
  });
}

// --- Custom Cursor with Global Event Delegation ---

if (customCursor) {
  document.addEventListener('mousemove', (e) => {
    if (isHoveringSign && signHotspot) {
      const rect = signHotspot.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.04;
      const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.04;
      customCursor.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      return;
    }
    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top = e.clientY + 'px';
    customCursor.style.transform = 'translate(-50%, -50%)';
  });

  // Global delegation ensures all dynamically rendered cards (catalog, news, testimonials) trigger cursor morph
  document.addEventListener('mouseover', (e) => {
    if (isHoveringSign) return;
    const interactive = e.target.closest('a, button:not(#storefront-sign-btn), .catalog-card, .event-card, .news-card, .testimonial-card, .tab-btn, .store-photo-card, .vision-visual-card, .mission-visual-card, input, select, textarea');
    if (interactive) {
      customCursor.classList.add('hover');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (isHoveringSign) return;
    const interactive = e.target.closest('a, button:not(#storefront-sign-btn), .catalog-card, .event-card, .news-card, .testimonial-card, .tab-btn, .store-photo-card, .vision-visual-card, .mission-visual-card, input, select, textarea');
    if (interactive) {
      customCursor.classList.remove('hover');
    }
  });
}

// OS-aware Maps link handler (directs to Apple Maps on iOS/macOS, Google Maps on Android/desktop)
const isAppleDevice = /iPad|iPhone|iPod|Macintosh/i.test(navigator.userAgent) && !window.MSStream;
if (isAppleDevice) {
  document.querySelectorAll('a.directions-link').forEach((link) => {
    link.href = 'https://maps.apple.com/?daddr=28.527621311362424,77.57296806811677&q=Grabbo+Store';
  });
}

// Café FOMO Menu Tabs Filtering
const cafeMenuTabs = document.querySelectorAll('.cafe-menu-tab');
const cafeMenuCards = document.querySelectorAll('.cafe-menu-card');

cafeMenuTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const targetTab = tab.getAttribute('data-tab');

    cafeMenuTabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    cafeMenuCards.forEach(card => {
      const category = card.getAttribute('data-category');
      if (targetTab === 'all' || category === targetTab) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  });
});



