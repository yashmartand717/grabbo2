// Grabbo Web - Premium Campus Essentials @ SNU Shopping Arcade
import './style.css';
import anime from 'animejs';
import { products, events, testimonials } from './content.js';

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

const homeView = document.getElementById('home-view');
const aboutView = document.getElementById('about-view');
const aboutBtn = document.querySelector('a[href="#about"]');
const eventsView = document.getElementById('events-view');
const eventsBtn = document.querySelector('a[href="#events"]');

const catalogView = document.getElementById('catalog-view');

const backToHomeBtn = document.getElementById('back-to-home');

const catalogGrid = document.getElementById('catalog-grid');

const tabBtns = document.querySelectorAll('.tab-btn');



function showCatalog(e, updateHistory = true) {
  if (e && e.preventDefault) e.preventDefault();
  if (updateHistory && window.location.hash !== '#products') {
    history.pushState({ view: 'products' }, '', '#products');
  }
  
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
  if (updateHistory && window.location.hash && window.location.hash !== '#home') {
    history.pushState({ view: 'home' }, '', '#home');
  }

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
  if (updateHistory && window.location.hash !== '#about') {
    history.pushState({ view: 'about' }, '', '#about');
  }
  
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
  if (updateHistory && window.location.hash !== '#events') {
    history.pushState({ view: 'events' }, '', '#events');
  }
  
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
document.querySelectorAll('a[href="#products"]').forEach(btn => {
  btn.addEventListener('click', (e) => showCatalog(e, true));
});

// Navbar "Events" link -> Opens Events view
document.querySelectorAll('a[href="#events"]').forEach(btn => {
  btn.addEventListener('click', (e) => showEvents(e, true));
});

// Navbar "Story" link -> Scrolls down to the Story section
function scrollToStory(e, updateHistory = true) {
  if (e && e.preventDefault) e.preventDefault();
  if (updateHistory && window.location.hash !== '#story') {
    history.pushState({ view: 'story' }, '', '#story');
  }
  
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
    
    setTimeout(() => {
      storyTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  } else {
    storyTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

document.querySelectorAll('a[href="#story"], .nav-story-link').forEach(btn => {
  btn.addEventListener('click', (e) => scrollToStory(e, true));
});

// Navbar "About" link fallback -> Opens About view
document.querySelectorAll('a[href="#about"]').forEach(btn => {
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

async function fetchHealthNews() {
  const newsGrid = document.getElementById('dynamic-news-grid');
  if (!newsGrid) return;

  const fallbackAlerts = [
    {
      badge: "Flu & Viral Alert • Delhi NCR",
      title: "Seasonal Viral & H1N1 Flu Advisory",
      desc: "Weather changes and seasonal humidity have led to an uptick in viral fevers and sore throats. Grabbo recommends keeping N95 masks, Crocin, and Vicks handy in your hostel room.",
      action: "View Fever & Cold Essentials",
      category: "precautions"
    },
    {
      badge: "Vector Prevention • Campus",
      title: "Dengue & Mosquito Defense Measures",
      desc: "Rainwater pooling after showers increases mosquito breeding. Protect yourself during evening study walks with Odomos mosquito repellent cream and protective lotions.",
      action: "View Mosquito Defense",
      category: "precautions"
    },
    {
      badge: "Daily Vitality • SNU Arcade",
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
    card.style.cursor = 'pointer';

    // Static markup only; feed-supplied text is set via textContent (headlines are third-party input)
    card.innerHTML = `
      <div class="news-card-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
        <span class="news-card-badge-text"></span>
      </div>
      <h3 class="news-card-title"></h3>
      <p class="news-card-desc"></p>
      <div class="news-card-action">
        <span class="news-card-action-text"></span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>
    `;
    card.querySelector('.news-card-badge-text').textContent = item.badge;
    card.querySelector('.news-card-title').textContent = item.title;
    card.querySelector('.news-card-desc').textContent = item.desc;
    card.querySelector('.news-card-action-text').textContent = item.action || 'View Essentials & Products';

    card.addEventListener('click', () => {
      const category = card.getAttribute('data-category') || 'precautions';
      tabBtns.forEach(b => b.classList.remove('active'));
      const targetTab = Array.from(tabBtns).find(b => b.getAttribute('data-category') === category);
      if (targetTab) targetTab.classList.add('active');
      renderCatalog(category);
      showCatalog();
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

    newsGrid.appendChild(group1);
    newsGrid.appendChild(group2);
  }

  try {
    let textData = null;

    // 1. Try real-time API
    try {
      const response = await fetch('/api/news/rss/search?q=disease+OR+fever+OR+dengue+OR+malaria+OR+covid+delhi+ncr&hl=en-IN&gl=IN&ceid=IN:en');
      if (response.ok) {
        textData = await response.text();
      }
    } catch (e) {
      // ignore
    }

    // 2. Try local rss.xml
    if (!textData) {
      try {
        const localResp = await fetch('/rss.xml');
        if (localResp.ok) {
          textData = await localResp.text();
        }
      } catch (e) {
        // ignore
      }
    }

    if (textData) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(textData, "text/xml");
      const items = xmlDoc.querySelectorAll('item');

      if (items.length > 0) {
        const topNews = Array.from(items).slice(0, 8);
        const parsedCards = topNews.map((item) => {
          let title = item.querySelector('title')?.textContent || 'Health Advisory';
          title = title.split(' - ')[0].replace(/[\?]{2,}/g, '"').trim();

          let description = item.querySelector('description')?.textContent || '';
          // DOMParser yields an inert document: no scripts run, no images load
          let textContent = new DOMParser().parseFromString(description, 'text/html').body.textContent || '';
          textContent = textContent.replace(/[\?]{2,}/g, '"').trim();
          
          if (!textContent || textContent === title) {
            if (/dengue|mosquito/i.test(title)) {
              textContent = "Post-rain water pooling increases mosquito breeding. Wear covered clothing and use Odomos repellent cream to safeguard against dengue and malaria.";
            } else if (/h1n1|flu|fever/i.test(title)) {
              textContent = "Seasonal weather variations are causing a surge in viral fever and influenza. Keep Crocin, paracetamol, and N95 masks at hand.";
            } else {
              textContent = "Stay protected with daily hygiene, proper hydration, and first-aid essentials available at the Grabbo SNU Arcade.";
            }
          }

          const badge = /dengue|mosquito/i.test(title) 
            ? "Mosquito Advisory • Delhi NCR"
            : /h1n1|flu|fever/i.test(title)
            ? "Viral & Flu Alert • Delhi NCR"
            : "Health Notice • Delhi NCR";

          return {
            badge,
            title,
            desc: textContent,
            action: "View Precautions & Essentials",
            category: "precautions"
          };
        });

        renderNewsCards(parsedCards);
        return;
      }
    }

    // Fallback if no items
    renderNewsCards(fallbackAlerts);
  } catch (err) {
    console.warn('Health news fallback activated:', err);
    renderNewsCards(fallbackAlerts);
  }
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

// --- SPA Router: Browser Back/Forward & Direct URL Sync ---
const logoHomeBtn = document.getElementById('logo-home-btn');
if (logoHomeBtn) {
  logoHomeBtn.addEventListener('click', (e) => hideCatalog(e, true));
}

// Popstate listener handles browser Back & Forward navigation seamlessly
window.addEventListener('popstate', (e) => {
  const hash = window.location.hash;
  if (hash === '#products') {
    showCatalog(null, false);
  } else if (hash === '#about') {
    showAbout(null, false);
  } else if (hash === '#events') {
    showEvents(null, false);
  } else if (hash === '#story') {
    scrollToStory(null, false);
  } else {
    hideCatalog(null, false);
  }
});

// Initial route inspection on page load
const initialHash = window.location.hash;
if (initialHash === '#products') {
  showCatalog(null, false);
} else if (initialHash === '#about') {
  showAbout(null, false);
} else if (initialHash === '#events') {
  showEvents(null, false);
} else if (initialHash === '#story') {
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


