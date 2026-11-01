// Grabbo Web - Premium Campus Essentials @ SNU Shopping Arcade
import './style.css';
import anime from 'animejs';
import { products, events, testimonials, newsSources, weatherSuggestions } from './content.js';

// --- Scroll Sequence Animation ---
const canvas = document.getElementById('bg-canvas');
const context = canvas.getContext('2d');

// 300-frame Storefront Interior Sequence
const frameCount = 300;
const currentFrame = index => {
  const frameNumber = (index + 1).toString().padStart(3, '0');
  return `/hero-frames/ezgif-frame-${frameNumber}.webp`;
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

// Immediately load initial frame & initial 30 frames for smooth first experience
loadFrame(0, 'high');
for (let i = 1; i < Math.min(30, frameCount); i++) {
  loadFrame(i);
}

// Then a coarse pass over the whole sequence (every 10th, 5th, 2nd frame, then the rest)
// so any scroll position has a nearby frame to show early
const preloadOrder = [];
for (const step of [10, 5, 2, 1]) {
  for (let i = 30; i < frameCount; i += step) {
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

const renderFrame = (index) => {
  // Ensure current and adjacent frames are prioritized immediately
  loadFrame(index, 'high');
  loadFrame(index + 1, 'high');
  loadFrame(index + 2);
  loadFrame(index - 1);

  // Draw the requested frame, or the nearest loaded one so the animation never freezes
  let drawIndex = -1;
  for (let d = 0; d < frameCount && drawIndex === -1; d++) {
    if (isFrameReady(index - d)) drawIndex = index - d;
    else if (isFrameReady(index + d)) drawIndex = index + d;
  }

  if (drawIndex !== -1) {
    const img = images[drawIndex];
    drawnIndex = drawIndex;

    // Draw image covering the canvas without zooming on scroll
    const imgRatio = img.width / img.height;
    const canvasRatio = canvasWidth / canvasHeight;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (canvasRatio > imgRatio) {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
      offsetX = 0;
      offsetY = (canvasHeight - drawHeight) / 2;
    } else {
      drawWidth = canvasHeight * imgRatio;
      drawHeight = canvasHeight;
      offsetX = (canvasWidth - drawWidth) / 2;
      offsetY = 0;
    }
    
    // Clear using actual DOM scaled size just in case, or reset transform
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
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

  const imgWidth = 2560;
  const imgHeight = 1440;
  const imgRatio = imgWidth / imgHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let drawWidth, drawHeight, offsetX, offsetY;

  if (canvasRatio > imgRatio) {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgRatio;
    offsetX = 0;
    offsetY = (canvasHeight - drawHeight) / 2;
  } else {
    drawWidth = canvasHeight * imgRatio;
    drawHeight = canvasHeight;
    offsetX = (canvasWidth - drawWidth) / 2;
    offsetY = 0;
  }

  // Exact coordinates of the main storefront fascia board in 2560x1440 (tightly framing GRABBO inside banner)
  const signLeft = offsetX + (630 / imgWidth) * drawWidth;
  const signTop = offsetY + (240 / imgHeight) * drawHeight;
  const signWidth = ((1740 - 630) / imgWidth) * drawWidth;
  const signHeight = ((475 - 240) / imgHeight) * drawHeight;

  storefrontSignBtn.style.left = `${Math.round(signLeft)}px`;
  storefrontSignBtn.style.top = `${Math.round(signTop)}px`;
  storefrontSignBtn.style.width = `${Math.round(signWidth)}px`;
  storefrontSignBtn.style.height = `${Math.round(signHeight)}px`;
};

const resizeCanvas = () => {
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  
  const dpr = window.devicePixelRatio || 1;
  
  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  
  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;
  
  // Scale the context to match the device pixel ratio
  context.scale(dpr, dpr);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  
  renderFrame(scrollProgressIndex);
  updateStorefrontSignPosition();
};

window.addEventListener('resize', resizeCanvas);

// Initial render once the first image is loaded
images[0].onload = () => {
  resizeCanvas(); // This will trigger a renderFrame(0) and updateStorefrontSignPosition()
  preloadRemainingFrames();
};

// Listen to scroll to update frame
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  // Calculate max scroll for the page
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  
  let scrollFraction = maxScroll > 0 ? scrollTop / maxScroll : 0;
  if (scrollFraction > 1) scrollFraction = 1;
  if (scrollFraction < 0) scrollFraction = 0;
  
  const frameIndex = Math.min(
    frameCount - 1,
    Math.floor(scrollFraction * frameCount)
  );
  
  // Dim background canvas dynamically on scroll
  const brightness = 1 - (scrollFraction * 0.8);
  canvas.style.filter = `brightness(${brightness})`;

  
  if (scrollProgressIndex !== frameIndex) {
    scrollProgressIndex = frameIndex;
    requestAnimationFrame(() => renderFrame(frameIndex));
  }
  updateStorefrontSignPosition();
});


// --- Page Load Animations (Anime.js) ---

document.addEventListener('DOMContentLoaded', () => {
  // Initial Hero Animation

  anime.timeline({
    easing: 'easeOutExpo',
  })
  .add({
    targets: '.navbar',
    translateY: [-20, 0],
    opacity: [0, 1],
    duration: 1000,
    delay: 200
  })
  .add({
    targets: '.hero-brand-title, .hero-title',
    translateY: [30, 0],
    opacity: [0, 1],
    duration: 1000,
  }, '-=600')
  .add({
    targets: '.hero-brand-subtitle, .hero-subtitle',
    translateY: [20, 0],
    opacity: [0, 1],
    duration: 800,
  }, '-=600')
  .add({
    targets: '.explore-btn',
    scale: [0.9, 1],
    opacity: [0, 1],
    duration: 600,
  }, '-=400');

  



});



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
const LEGACY_HASHES = { '#home': 'home', '#products': 'products', '#about': 'about', '#events': 'events', '#story': 'story' };

const currentRoute = () => {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return Object.keys(ROUTES).find(view => ROUTES[view] === path) || 'home';
};

// Per-view title, description and canonical URL for search engines (Google runs this JS when indexing)
const SITE_URL = 'https://www.grabbo.store';
const PAGE_META = {
  home: {
    title: 'Grabbo @ SNU - Premium Essentials & Experience Center',
    description: 'Grabbo @ Shiv Nadar University - In-campus departmental store and experience center offering everyday essentials, fresh café bites, beverages, late-night snacks, and health precautions at Shopping Arcade.'
  },
  products: {
    title: 'Products - Snacks, Beverages, Coffee & Health Essentials | Grabbo @ SNU',
    description: 'Browse Grabbo\'s collection at Shiv Nadar University: health precautions, beverages and shakes, bakery, café coffee and snacks, with prices.'
  },
  about: {
    title: 'About Grabbo - Campus Store at Shiv Nadar University',
    description: 'The story, mission and vision behind Grabbo, the in-campus departmental store and experience center at the Shiv Nadar University Shopping Arcade.'
  },
  events: {
    title: 'Events & Offers | Grabbo @ SNU',
    description: 'Upcoming events, offers and past campus collaborations from Grabbo at Shiv Nadar University, including Jalsa and TEDx.'
  }
};
PAGE_META.story = PAGE_META.home;

const applyPageMeta = (view) => {
  const meta = PAGE_META[view] || PAGE_META.home;
  // The Story view is the home page scrolled down, so it shares the home canonical
  const url = SITE_URL + (view === 'story' ? '/' : ROUTES[view] || '/');
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

const catalogView = document.getElementById('catalog-view');

const backToHomeBtn = document.getElementById('back-to-home');

const catalogGrid = document.getElementById('catalog-grid');

const tabBtns = document.querySelectorAll('.tab-btn');



function showCatalog(e, updateHistory = true) {
  if (e && e.preventDefault) e.preventDefault();
  if (updateHistory) navigateTo('products');
  
  canvas.style.filter = 'brightness(0.25)';
  window.scrollTo(0, 0);
  
  // Fade out home, about and events
  homeView.style.opacity = '0';
  if (aboutView) aboutView.style.opacity = '0';
  if (eventsView) eventsView.style.opacity = '0';
  
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

    // Fade in catalog
    catalogView.classList.remove('hidden');
    catalogView.classList.add('active');

    // Check if grid is empty, render default if so
    if (catalogGrid.children.length === 0) {
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
  window.scrollTo(0, 0);
  
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  let scrollFraction = maxScroll > 0 ? scrollTop / maxScroll : 0;
  canvas.style.filter = `brightness(${1 - (scrollFraction * 0.8)})`;
  
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

    // Fade in home
    homeView.classList.remove('hidden');
    homeView.classList.add('active');
    homeView.style.opacity = '1';
    window.scrollTo(0, 0);
    setTimeout(updateStorefrontSignPosition, 250);
  }, 200);
}



function renderCatalog(category) {
  catalogGrid.innerHTML = '';
  const categoryProducts = products.filter(prod => prod.category === category);

  if (categoryProducts.length === 0) {
    catalogGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; color: #fff; font-size: 1.2rem; background: rgba(22, 20, 18, 0.9); border-radius: 20px;">No products found in this category.</div>`;
    return;
  }

  categoryProducts.forEach((prod, i) => {
    const card = document.createElement('div');
    card.className = 'catalog-card';
    card.style.opacity = '1';

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

  if (typeof anime !== 'undefined') {
    anime({
      targets: '.catalog-card',
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
  
  canvas.style.filter = 'brightness(0.3)';
  window.scrollTo(0, 0);
  
  homeView.style.opacity = '0';
  catalogView.style.opacity = '0';
  if (eventsView) eventsView.style.opacity = '0';
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
    
    aboutView.classList.remove('hidden');
    aboutView.classList.add('active');
    aboutView.style.opacity = '1';
    window.scrollTo(0, 0);
  }, 200);
}

function showEvents(e, updateHistory = true) {
  if (e && e.preventDefault) e.preventDefault();
  if (updateHistory) navigateTo('events');
  
  canvas.style.filter = 'brightness(0.3)';
  window.scrollTo(0, 0);
  
  homeView.style.opacity = '0';
  catalogView.style.opacity = '0';
  if (aboutView) aboutView.style.opacity = '0';

  setTimeout(() => {
    homeView.classList.add('hidden');
    homeView.classList.remove('active');
    catalogView.classList.add('hidden');
    catalogView.classList.remove('active');
    if (aboutView) {
      aboutView.classList.add('hidden');
      aboutView.classList.remove('active');
    }
    
    eventsView.classList.remove('hidden');
    eventsView.classList.add('active');
    eventsView.style.opacity = '1';
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

// Esc closes About, Events or Products
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const anyOpen = [aboutView, eventsView, catalogView].some(view => view && view.classList.contains('active'));
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
  
  const storyTarget = document.getElementById('story') || document.getElementById('author-section');
  if (!storyTarget) return;

  const isHomeActive = homeView && homeView.classList.contains('active') && !homeView.classList.contains('hidden');
  
  if (!isHomeActive) {
    catalogView.style.opacity = '0';
    if (aboutView) aboutView.style.opacity = '0';
    if (eventsView) eventsView.style.opacity = '0';
    
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

// Navbar "About" link fallback -> Opens About view
document.querySelectorAll('a[href="/about"]').forEach(btn => {
  btn.addEventListener('click', (e) => showAbout(e, true));
});

document.querySelectorAll('.close-overlay-btn, .about-back-btn, .events-back-btn, #back-to-home').forEach(btn => {
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

  const imgWidth = 2560;
  const imgHeight = 1440;
  const imgRatio = imgWidth / imgHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let drawWidth, drawHeight, offsetX, offsetY;
  if (canvasRatio > imgRatio) {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgRatio;
    offsetX = 0;
    offsetY = (canvasHeight - drawHeight) / 2;
  } else {
    drawWidth = canvasHeight * imgRatio;
    drawHeight = canvasHeight;
    offsetX = (canvasWidth - drawWidth) / 2;
    offsetY = 0;
  }

  const signLeft = offsetX + (630 / imgWidth) * drawWidth;
  const signTop = offsetY + (240 / imgHeight) * drawHeight;
  const signWidth = ((1740 - 630) / imgWidth) * drawWidth;
  const signHeight = ((475 - 240) / imgHeight) * drawHeight;

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
const NEWS_QUERY = `(dengue OR malaria OR chikungunya OR H1N1 OR "swine flu" OR "viral fever" OR influenza OR covid OR typhoid OR cholera) (delhi OR noida OR "greater noida" OR gurugram OR ghaziabad OR ncr) when:${NEWS_LOOKBACK_DAYS}d`;
const NEWS_URL = `/api/news/rss/search?q=${encodeURIComponent(NEWS_QUERY)}&hl=en-IN&gl=IN&ceid=IN:en`;
const MAX_NEWS_CARDS = 8;
const MIN_NEWS_CARDS = 3; // topped up with health tips below this
const NCR_PATTERN = /delhi|noida|gurugram|gurgaon|ghaziabad|faridabad|\bncr\b/i;
// Outside Delhi NCR (and for Covid/flu everywhere, which turn up in unrelated stories), a headline
// must be about the illness spreading, not about policy, courts or money
const HEALTH_CONTEXT = /\bcases?\b|outbreak|surge|spike|\brise\b|rising|infect|patients?|deaths?|\bdied\b|hospitali[sz]|alert|advisory|symptoms?|prevent|precaution|spread|\bwave\b|down with|fevers?/i;
const OFF_TOPIC = /fraud|scam|insur|\bclaim|court|appeal|verdict|stock|shares|tariff|price|budget|tender/i;

const NEWS_TOPICS = [
  { pattern: /dengue|chikungunya|malaria|mosquito|vector/i, label: 'Dengue & Malaria Alert', tip: 'Use mosquito repellent, wear full sleeves after sunset, and don\'t let water collect near your room.' },
  { pattern: /h1n1|swine flu|influenza|viral fever/i, label: 'Flu & Viral Alert', tip: 'Wear a mask in crowded places, wash hands often, and see a doctor if a fever lasts more than two days.' },
  { pattern: /\bflu\b/i, label: 'Flu & Viral Alert', tip: 'Wear a mask in crowded places, wash hands often, and see a doctor if a fever lasts more than two days.', needsContext: true },
  { pattern: /covid/i, label: 'Covid Update', tip: 'Mask up in crowded indoor spaces, sanitise your hands, and get tested if you have symptoms.', needsContext: true },
  { pattern: /typhoid|cholera/i, label: 'Water-borne Alert', tip: 'Drink only purified water, avoid uncovered street food, and keep ORS handy.' }
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

    // Link back to the publisher's article; feed URLs are third-party input, so only https is allowed
    let link = '';
    try {
      const url = new URL(item.querySelector('link')?.textContent.trim() || '');
      if (url.protocol === 'https:') link = url.href;
    } catch (e) {
      // no usable link: the headline is shown without one
    }

    cards.push({
      badge: `${topic.label} • ${isNCR ? 'Delhi NCR' : 'India'}`,
      title,
      link,
      source: `${sourceName} • ${formatNewsDate(published)}`,
      desc: `Grabbo tip: ${topic.tip}`,
      action: 'View Precautions & Essentials',
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

  // Shown when there is little or no recent news; labelled as tips so they never pass as headlines
  const fallbackAlerts = [
    {
      badge: "Grabbo Health Tip",
      title: "Seasonal Viral & H1N1 Flu Advisory",
      desc: "Weather changes and seasonal humidity have led to an uptick in viral fevers and sore throats. Grabbo recommends keeping N95 masks, Crocin, and Vicks handy in your hostel room.",
      action: "View Fever & Cold Essentials",
      category: "precautions"
    },
    {
      badge: "Grabbo Health Tip",
      title: "Dengue & Mosquito Defense Measures",
      desc: "Rainwater pooling after showers increases mosquito breeding. Protect yourself during evening study walks with Odomos mosquito repellent cream and protective lotions.",
      action: "View Mosquito Defense",
      category: "precautions"
    },
    {
      badge: "Grabbo Health Tip",
      title: "Electrolyte Balance & Exhaustion Care",
      desc: "Humid campus days and long study sessions quickly drain vital salts and energy. Replenish with WHO-standard Electral ORS and cold energy drinks from Grabbo.",
      action: "View Hydration & ORS",
      category: "precautions"
    }
  ];

  function createCardElement(item) {
    const card = document.createElement('div');
    card.className = 'product-card news-card';
    card.setAttribute('data-category', item.category || 'precautions');

    // Static markup only; feed-supplied text is set via textContent (headlines are third-party input)
    card.innerHTML = `
      <div class="news-card-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
        <span class="news-card-badge-text"></span>
      </div>
      <h3 class="news-card-title"></h3>
      <p class="news-card-source"></p>
      <p class="news-card-desc"></p>
      <button type="button" class="news-card-action">
        <span class="news-card-action-text"></span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
    `;
    card.querySelector('.news-card-badge-text').textContent = item.badge;

    // Headline and source open the original article on the publisher's site
    const titleEl = card.querySelector('.news-card-title');
    const sourceEl = card.querySelector('.news-card-source');
    if (item.link) {
      const titleLink = document.createElement('a');
      titleLink.href = item.link;
      titleLink.target = '_blank';
      titleLink.rel = 'noopener noreferrer';
      titleLink.className = 'news-card-link';
      titleLink.textContent = item.title;
      titleEl.appendChild(titleLink);
    } else {
      titleEl.textContent = item.title;
    }
    if (item.source) {
      if (item.link) {
        const sourceLink = document.createElement('a');
        sourceLink.href = item.link;
        sourceLink.target = '_blank';
        sourceLink.rel = 'noopener noreferrer';
        sourceLink.className = 'news-card-link';
        sourceLink.textContent = `${item.source} ↗`;
        sourceLink.setAttribute('aria-label', `Read the full story on ${item.source.split(' • ')[0]}`);
        sourceEl.appendChild(sourceLink);
      } else {
        sourceEl.textContent = item.source;
      }
    } else {
      sourceEl.remove();
    }
    card.querySelector('.news-card-desc').textContent = item.desc;
    card.querySelector('.news-card-action-text').textContent = item.action || 'View Essentials & Products';

    // Grabbo's own suggestion, kept separate from the publisher's headline
    card.querySelector('.news-card-action').addEventListener('click', () => {
      openCatalogCategory(card.getAttribute('data-category') || 'precautions');
    });

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
    // The clone is decorative; keep its links and buttons out of keyboard navigation
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
  img.src = prod.image;
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
  } else if (route === 'story') {
    scrollToStory(null, false);
  } else {
    hideCatalog(null, false);
  }
});

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

// --- Footer Newsletter Subscription (CSP-compliant) ---
const subscribeForm = document.getElementById('footer-subscribe-form');
if (subscribeForm) {
  subscribeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailInput = subscribeForm.querySelector('input[type="email"]');
    if (emailInput && emailInput.value.trim()) {
      alert(`Thank you for subscribing (${emailInput.value.trim()})! You'll receive updates on Grabbo releases and campus events.`);
      subscribeForm.reset();
    }
  });
}

// --- Custom Cursor with Global Event Delegation ---
const customCursor = document.getElementById('custom-cursor');
let isHoveringSign = false;

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
    const interactive = e.target.closest('a, button:not(#storefront-sign-btn), .catalog-card, .event-card, .news-card, .testimonial-card, .tab-btn, .store-photo-card, .vision-visual-card, .mission-visual-card, input');
    if (interactive) {
      customCursor.classList.add('hover');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (isHoveringSign) return;
    const interactive = e.target.closest('a, button:not(#storefront-sign-btn), .catalog-card, .event-card, .news-card, .testimonial-card, .tab-btn, .store-photo-card, .vision-visual-card, .mission-visual-card, input');
    if (interactive) {
      customCursor.classList.remove('hover');
    }
  });
}


