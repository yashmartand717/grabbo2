// Grabbo Web - Premium Campus Essentials @ SNU Shopping Arcade
import './style.css';

import * as THREE from 'three';

import anime from 'animejs';

// --- Scroll Sequence Animation ---
const canvas = document.getElementById('bg-canvas');
const context = canvas.getContext('2d');

// Toggle this variable to switch animations:
// false = Original Coffee Animation
// true = New Animation
const useNewAnimation = true;

const frameCount = useNewAnimation ? 300 : 150;
const currentFrame = index => {
  const frameNumber = (index + 1).toString().padStart(3, '0');
  
  if (useNewAnimation) {
    // Note: Make sure the 'ezgif-409ce6f3040f8cae-jpg' folder is moved inside the 'public' folder!
    return `/ezgif-409ce6f3040f8cae-jpg/ezgif-frame-${frameNumber}.jpg`;
  } else {
    return `/scroll_sequence/ezgif-frame-${frameNumber}.jpg`;
  }
};

const images = [];
const preloadImages = () => {
  for (let i = 0; i < frameCount; i++) {
    images[i] = new Image();
    images[i].src = currentFrame(i);
  }
};

preloadImages();

let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
let scrollProgressIndex = 0;

const renderFrame = (index) => {
  if (images[index] && images[index].complete) {
    const img = images[index];
    
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



const catalogData = {
  precautions: [
    { name: "N95 Face Mask", desc: "High filtration efficiency mask for protection against viruses & dust.", image: "/images/precautions/n95_mask.jpg", price: "₹25", suggestion: "Protects against Covid & Viruses" },
    { name: "Dettol Hand Sanitizer", desc: "Kills 99.9% of germs without water. Essential pocket protection.", image: "/images/precautions/sanitizer.jpg", price: "₹50", suggestion: "Prevents Viral Infections" },
    { name: "Lifebuoy Total 10 Soap", desc: "Advanced germ protection soap with silver shield formula.", image: "/images/precautions/soap.jpg", price: "₹38", suggestion: "Washes away germs" },
    { name: "Odomos Mosquito Repellent", desc: "Clinically tested cream for Dengue and Malaria protection.", image: "/images/precautions/repellent.jpg", price: "₹65", suggestion: "Helps in Dengue & Malaria" },
    { name: "Savlon Antiseptic Liquid", desc: "First aid disinfectant liquid for wounds, cuts & personal hygiene.", image: "/images/precautions/antiseptic.jpg", price: "₹45", suggestion: "First aid & hygiene" },
    { name: "Crocin Advance Tablet", desc: "Fast-acting relief for fever, headache, and body aches.", image: "/images/precautions/crocin.jpg", price: "₹20", suggestion: "Relieves Fever & Pain" },
    { name: "Vicks VapoRub", desc: "Effective multi-symptom relief from cold, cough, and blocked nose.", image: "/images/precautions/vicks.jpg", price: "₹55", suggestion: "Relieves Cold & Cough" },
    { name: "Electral ORS Powder", desc: "WHO-based oral rehydration salts formula for dehydration & fatigue.", image: "/images/precautions/electral.jpg", price: "₹22", suggestion: "Prevents Dehydration" },
    { name: "Digital Thermometer", desc: "Quick 10-second accurate digital body temperature measurement.", image: "/images/precautions/thermometer.jpg", price: "₹180", suggestion: "Checks Fever Accurately" }
  ],

  beverages: [
    { name: "Alo Frut Blood Orange Mojito", desc: "Refreshing mocktail with tangy blood orange and real aloe vera.", image: "/alo_frut_orange_1788390073204.jpg", price: "₹40" },
    { name: "Alo Frut Kiwi Mojito", desc: "Crisp sweet and sour kiwi refreshment packed with aloe pulp.", image: "/alo_frut_kiwi_transparent.png", price: "₹40" },
    { name: "Amul Badam Shaker", desc: "Rich and creamy almond flavored milk with real badam bits.", image: "/amul_badam_1788390094373.jpg", price: "₹35" },
    { name: "Amul Kool Kesar", desc: "Classic saffron-infused chilled milk for an instant energy boost.", image: "/cold_drink_1788388374768.jpg", price: "₹30" },
    { name: "Coolberg Cranberry", desc: "Non-alcoholic craft cranberry malt beer with rich fruity notes.", image: "/coolberg_1788390109163.jpg", price: "₹85" },
    { name: "Coolberg Peach", desc: "Crisp and aromatic non-alcoholic peach flavored malt beverage.", image: "/coolberg_1788390109163.jpg", price: "₹85" },
    { name: "Schweppes Tonic Water", desc: "Crisp, bubbly Indian tonic water with delicate citrus quinine notes.", image: "/schweppes_1788390124215.jpg", price: "₹60" },
    { name: "Schweppes Ginger Ale", desc: "Bubbly golden ginger ale with a sharp and refreshing kick.", image: "/schweppes.jpg", price: "₹60" },
    { name: "Epigamia Milkshake Vanilla", desc: "High protein, creamy milkshake enriched with real vanilla & calcium.", image: "/epigamia_vanilla_1788390147485.jpg", price: "₹40" },
    { name: "Raw Pressery Aam Panna", desc: "Traditional Indian raw mango cooler packed with electrolytes.", image: "/raw_pressery_1788390158064.jpg", price: "₹70" },
    { name: "Hell Energy Watermelon", desc: "High-octane watermelon energy drink with B-vitamins & taurine.", image: "/hell_energy_1788390167837.jpg", price: "₹60" },
    { name: "Amul Sweet Lassi", desc: "Thick, traditional probiotic sweet yogurt drink served chilled.", image: "/amul_lassi_transparent.png", price: "₹25" },
    { name: "Amul Masti Buttermilk", desc: "Refreshing spiced cooling chaas with curry leaves & ginger.", image: "/buttermilk.jpg", price: "₹15" },
    { name: "Sofit Soya Milk Chocolate", desc: "Plant-based dairy-free chocolate milk rich in protein & omega-3.", image: "/sofit_choco_1788390189395.jpg", price: "₹38" },
    { name: "Hershey's Cookies & Cream", desc: "Thick and indulgent cookies & cream chocolate milkshake.", image: "/hersheys.jpg", price: "₹45" }
  ],

  coffee: [
    { name: "Davidoff Fine Aroma Coffee", desc: "100% Arabica luxury instant coffee with delicate acidic notes.", image: "/hot_coffee_transparent.png", price: "₹550" },
    { name: "Grabbo Special Hot Coffee", desc: "Freshly brewed rich espresso roast coffee made to order.", image: "/hot_coffee_1788388353442.jpg", price: "₹30" },
    { name: "Maggi Masala Special Noodles", desc: "Classic late-night 2 AM companion cooked piping hot with veggies.", image: "/maggi_noodles_1788388364141.jpg", price: "₹40" }
  ],

  bakery: [
    { name: "Winkies Mango Swiss Roll", desc: "Soft, fluffy sponge roll wrapped around luscious mango cream.", image: "/swiss_roll.jpg", price: "₹25" },
    { name: "Winkies Rich Butter Fruit Cake", desc: "Golden butter sponge loaded with candied fruit bits and raisins.", image: "/fruit_cake.jpg", price: "₹30" },
    { name: "Winkies Sliced Choco Cake", desc: "Decadent dark chocolate slice cake with cocoa drizzle.", image: "/choco_cake.jpg", price: "₹25" }
  ],

  snacks: [
    { name: "Bingo! Cheese Nachos", desc: "Crunchy golden corn tortilla chips layered with cheesy tang.", image: "/nachos.jpg", price: "₹30" },
    { name: "Bingo! Mad Angles Achaari", desc: "Perfect triangular crunchy chips coated in zesty achaari masala.", image: "/mad_angles.jpg", price: "₹20" },
    { name: "Fun Flips Baked Puffs", desc: "Classic nostalgic khatta-meetha crunchy baked corn puffs.", image: "/puffs.jpg", price: "₹15" }
  ]
};



const homeView = document.getElementById('home-view');
const aboutView = document.getElementById('about-view');
const aboutBtn = document.querySelector('a[href="#about"]');
const eventsView = document.getElementById('events-view');
const eventsBtn = document.querySelector('a[href="#events"]');

const catalogView = document.getElementById('catalog-view');

const exploreBtns = document.querySelectorAll('.explore-btn, a[href="#products"]');

const backToHomeBtn = document.getElementById('back-to-home');

const catalogGrid = document.getElementById('catalog-grid');

const tabBtns = document.querySelectorAll('.tab-btn');



function showCatalog(e) {
  if(e) e.preventDefault();
  
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

function hideCatalog() {
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
  const products = catalogData[category] || [];

  if (products.length === 0) {
    catalogGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; color: #fff; font-size: 1.2rem; background: rgba(22, 20, 18, 0.9); border-radius: 20px;">No products found in this category.</div>`;
    return;
  }

  products.forEach((prod, i) => {
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
      badge.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M2 12h20"/></svg> ${prod.suggestion}`;
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
      <span class="catalog-price">${prod.price || 'In Store'}</span>
      <span class="catalog-stock-tag">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
        In Stock @ Arcade
      </span>
    `;
    
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

function showAbout(e) {
  if(e) e.preventDefault();
  
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

function showEvents(e) {
  if (e) e.preventDefault();
  
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

exploreBtns.forEach(btn => {
  btn.addEventListener('click', showCatalog);
});

document.querySelectorAll('.close-overlay-btn, .about-back-btn, .events-back-btn, #back-to-home').forEach(btn => {
  btn.addEventListener('click', hideCatalog);
});

document.querySelectorAll('.about-explore-btn').forEach(btn => {
  btn.addEventListener('click', showCatalog);
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

// About Modal 3-Pillar Tab Switching (1. About Store, 2. Our Vision, 3. Our Mission)
const aboutTabBtns = document.querySelectorAll('.about-tab-btn');
const aboutPanels = document.querySelectorAll('.about-panel');

function switchAboutTab(targetTab) {
  aboutTabBtns.forEach(btn => {
    const isActive = btn.getAttribute('data-tab') === targetTab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  aboutPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel-${targetTab}`);
  });
}

aboutTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetTab = btn.getAttribute('data-tab');
    if (targetTab) switchAboutTab(targetTab);
  });
});

document.querySelectorAll('.switch-panel-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetTab = btn.getAttribute('data-target');
    if (targetTab) switchAboutTab(targetTab);
  });
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

    card.innerHTML = `
      <div class="news-card-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
        ${item.badge}
      </div>
      <h3 class="news-card-title">${item.title}</h3>
      <p class="news-card-desc">${item.desc}</p>
      <div class="news-card-action">
        <span>${item.action || 'View Essentials & Products'}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>
    `;

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
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = description;
          let textContent = tempDiv.textContent || tempDiv.innerText || '';
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

const logoHomeBtn = document.getElementById('logo-home-btn');
if (logoHomeBtn) logoHomeBtn.addEventListener('click', hideCatalog);

if (aboutBtn) aboutBtn.addEventListener('click', showAbout);
if (eventsBtn) eventsBtn.addEventListener('click', showEvents);

// Hash routing support for direct links and browser back/forward
window.addEventListener('hashchange', () => {
  if (window.location.hash === '#products') {
    showCatalog();
  } else if (window.location.hash === '#about') {
    showAbout();
  } else if (window.location.hash === '#events') {
    showEvents();
  } else if (!window.location.hash || window.location.hash === '#home') {
    hideCatalog();
  }
});

if (window.location.hash === '#products') {
  showCatalog();
} else if (window.location.hash === '#about') {
  showAbout();
} else if (window.location.hash === '#events') {
  showEvents();
}




// --- Custom Cursor ---
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

  const addHover = () => {
    if (!isHoveringSign) customCursor.classList.add('hover');
  };
  const removeHover = () => {
    if (!isHoveringSign) customCursor.classList.remove('hover');
  };

  document.querySelectorAll('a, button:not(#storefront-sign-btn), .catalog-card, .event-card').forEach(el => {
    el.addEventListener('mouseenter', addHover);
    el.addEventListener('mouseleave', removeHover);
  });

  const addTextHover = () => {
    if (!isHoveringSign) customCursor.classList.add('text-hover');
  };
  const removeTextHover = () => {
    if (!isHoveringSign) customCursor.classList.remove('text-hover');
  };

  document.querySelectorAll('#about-view p, #about-view h1, #about-view h2, #about-view h3, #about-view span, #about-view li, #about-view .about-content').forEach(el => {
    el.addEventListener('mouseenter', addTextHover);
    el.addEventListener('mouseleave', removeTextHover);
  });
}


