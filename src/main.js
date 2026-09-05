import './style.css';

import * as THREE from 'three';

import anime from 'animejs';

// --- Scroll Sequence Animation ---
const canvas = document.getElementById('bg-canvas');
const context = canvas.getContext('2d');

const frameCount = 150;
const currentFrame = index => (
  `/scroll_sequence/ezgif-frame-${(index + 1).toString().padStart(3, '0')}.jpg`
);

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
    context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }
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
  
  renderFrame(scrollProgressIndex);
};

window.addEventListener('resize', resizeCanvas);

// Initial render once the first image is loaded
images[0].onload = () => {
  resizeCanvas(); // This will trigger a renderFrame(0)
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

    targets: '.hero-title',

    translateY: [30, 0],

    opacity: [0, 1],

    duration: 1000,

  }, '-=600')

  .add({

    targets: '.hero-subtitle',

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
    { name: "N95 Face Mask", desc: "High filtration efficiency mask for protection against viruses.", image: "/images/precautions/n95_mask.jpg", suggestion: "Protects against Covid & Viruses" },
    { name: "Dettol Hand Sanitizer", desc: "Kills 99.9% of germs without water.", image: "/images/precautions/sanitizer.jpg", suggestion: "Prevents Viral Infections" },
    { name: "Lifebuoy Soap", desc: "Total 10 germ protection soap.", image: "/images/precautions/soap.jpg", suggestion: "Washes away germs" },
    { name: "Odomos Mosquito Repellent", desc: "Cream for protection against Dengue/Malaria mosquitoes.", image: "/images/precautions/repellent.jpg", suggestion: "Helps in Dengue & Malaria" },
    { name: "Savlon Antiseptic Liquid", desc: "First aid and personal hygiene liquid.", image: "/images/precautions/antiseptic.jpg", suggestion: "First aid & hygiene" },
    { name: "Crocin Advance Tablet", desc: "Relieves pain and reduces fever effectively.", image: "/images/precautions/crocin.jpg", suggestion: "Relieves Fever & Pain" },
    { name: "Vicks VapoRub", desc: "Relief from cold, cough, and blocked nose.", image: "/images/precautions/vicks.jpg", suggestion: "Relieves Cold & Cough" },
    { name: "Electral ORS Powder", desc: "WHO based ORS formula for rehydration.", image: "/images/precautions/electral.jpg", suggestion: "Prevents Dehydration" },
    { name: "Digital Thermometer", desc: "Fast and accurate fever measurement.", image: "/images/precautions/thermometer.jpg", suggestion: "Checks Fever Accurately" }
  ],

  beverages: [

    { name: "Alo Frut Blood Orange Mojito", desc: "Refreshing mocktail with a tangy twist.", image: "https://www.bbassets.com/media/uploads/p/l/40228655_1-axiom-alo-frut-blood-orange-mojito-brewed-naturally-no-artificial-flavours.jpg" },

    { name: "Alo Frut Kiwi Mojito", desc: "Sweet and sour kiwi refreshment.", image: "https://axiomayurveda.com/cdn/shop/files/Alo_Frut_Kiwi_Mojito_250Ml_Pack_Of_6.jpg" },

    { name: "Amul Badam Shaker", desc: "Rich and creamy almond milk.", image: "https://www.bbassets.com/media/uploads/p/l/40003716_4-amul-kool-milk-shake-badam.jpg" },

    { name: "Amul Kool Kesar", desc: "Saffron flavored milk.", image: "https://www.bbassets.com/media/uploads/p/l/129237_1-amul-kool-kesar-flavor.jpg" },

    { name: "Coolberg Cranberry", desc: "Non-alcoholic cranberry beer.", image: "https://www.bbassets.com/media/uploads/p/l/40122152_2-coolberg-beer-cranberry-non-alcoholic.jpg" },

    { name: "Coolberg Peach", desc: "Non-alcoholic peach beer.", image: "https://www.bbassets.com/media/uploads/p/l/40122151_9-coolberg-non-alcoholic-beer-peach.jpg" },

    { name: "Schweppes Tonic Water", desc: "Classic Indian Tonic Water.", image: "https://www.schweppesus.com/images/catalog/products/schweppes-tonic-water.png" },

    { name: "Schweppes Ginger Ale", desc: "Crisp and bubbly ginger ale.", image: "https://www.bbassets.com/media/uploads/p/l/30009570_9-schweppes-soda-original-ginger-ale.jpg" },

    { name: "Epigamia Protein Milkshake Vanilla", desc: "High protein vanilla shake.", image: "https://www.bbassets.com/media/uploads/p/l/40262089_2-epigamia-milkshake-vanilla-high-protein-creamy-rich-flavour-good-source-of-calcium-vitamin-a.jpg" },

    { name: "Epigamia Milkshake Strawberry", desc: "Classic strawberry milkshake.", image: "https://www.bbassets.com/media/uploads/p/l/40231752_3-epigamia-origins-strawberry-milkshake-contains-vitamin-a.jpg" },

    { name: "Raw Pressery Aam Panna", desc: "Traditional Indian raw mango drink.", image: "https://www.bbassets.com/media/uploads/p/l/40341067_2-raw-pressery-aam-panna.jpg" },

    { name: "Hell Energy Watermelon", desc: "Watermelon flavored energy booster.", image: "https://www.bbassets.com/media/uploads/p/l/40318745_1-hell-watermelon-energy-drink.jpg" },

    { name: "Amul Lassi", desc: "Classic sweet yogurt drink.", image: "https://frugivore-bucket.s3.amazonaws.com/media/package/img_one/2019-08-28/amul_lassi_200ml_1.jpg" },

    { name: "Amul Masti Buttermilk", desc: "Spiced cooling buttermilk.", image: "https://www.bbassets.com/media/uploads/p/l/161899_9-amul-masti-buttermilk-spice.jpg" },

    { name: "Sofit Soya Milk Chocolate", desc: "Plant-based chocolate milk.", image: "https://www.bbassets.com/media/uploads/p/l/40009970_15-sofit-soya-drink-chocolate.jpg" },

    { name: "Hershey's Milkshake Cookies & Cream", desc: "Thick cookies and cream shake.", image: "https://www.hersheyland.in/content/dam/Hersheyland_India/en_in/products/milkshakes/milkshake-cnc-180ml-FOP.png" }

  ],

  coffee: [

    { name: "Davidoff Fine Aroma", desc: "Premium instant coffee, 100% Arabica.", image: "https://www.bbassets.com/media/uploads/p/l/40354906_3-davidoff-fine-aroma-instant-coffee-powder.jpg" }

  ],

  bakery: [

    { name: "Winkies Mango Swiss Roll", desc: "Soft cake roll with mango cream.", image: "https://www.bbassets.com/media/uploads/p/l/40134921_2-winkies-roll-swiss-mini-mango.jpg" },

    { name: "Winkies Rich Butter Fruit Cake", desc: "Traditional fruit cake loaded with dry fruits.", image: "https://www.bbassets.com/media/uploads/p/xl/40095075_2-winkies-cake-rich-butter-fruit-cake.jpg" },

    { name: "Winkies Sliced Choco Cake", desc: "Rich chocolate sliced cake.", image: "https://www.bbassets.com/media/uploads/p/l/40058835_6-winkies-cake-chocolate-cake-slice.jpg" }

  ],

  snacks: [

    { name: "Bingo! Cheese Nachos", desc: "Crispy corn nachos with cheesy flavor.", image: "https://www.bbassets.com/media/uploads/p/l/40207039_9-bingo-mad-angles-cheese-nachos-chips.jpg" },

    { name: "Bingo! Mad Angles", desc: "Tangy and spicy triangular chips.", image: "https://www.bbassets.com/media/uploads/p/l/1203988_7-bingo-bingo-mad-angles-achaari-masti.jpg" },

    { name: "Fun Flips Puffs", desc: "Classic crunchy puffed snacks.", image: "https://www.bbassets.com/media/uploads/p/l/40196131_5-fun-flips-baked-crunchy-puffs-khatta-meetha.jpg" }

  ]

};



const homeView = document.getElementById('home-view');
const aboutView = document.getElementById('about-view');
const aboutBtn = document.querySelector('a[href="#about"]');

const catalogView = document.getElementById('catalog-view');

const exploreBtns = document.querySelectorAll('.explore-btn, a[href="#products"]');

const backToHomeBtn = document.getElementById('back-to-home');

const catalogGrid = document.getElementById('catalog-grid');

const tabBtns = document.querySelectorAll('.tab-btn');



function showCatalog(e) {
  if(e) e.preventDefault();
  
  // Fade out home
  homeView.style.opacity = '0';
  setTimeout(() => {
    homeView.classList.add('hidden');

    homeView.classList.remove('active');

    

    // Fade in catalog

    catalogView.classList.remove('hidden');

    catalogView.classList.add('active');

    

    // Check if grid is empty, render default if so

    if (catalogGrid.children.length === 0) {

      renderCatalog('precautions');

    }



    setTimeout(() => {

      catalogView.style.opacity = '1';

      // Scroll to top

      window.scrollTo({ top: 0, behavior: 'smooth' });

    }, 50);

  }, 500);

}



function hideCatalog() {
  
  // Fade out catalog
  catalogView.style.opacity = '0';
  if (aboutView) aboutView.style.opacity = '0';
  
  setTimeout(() => {
    catalogView.classList.add('hidden');

    catalogView.classList.remove('active');
    if (aboutView) { aboutView.classList.add('hidden'); aboutView.classList.remove('active'); }

    

    // Fade in home

    homeView.classList.remove('hidden');

    homeView.classList.add('active');

    setTimeout(() => {

      homeView.style.opacity = '1';

      window.scrollTo({ top: 0, behavior: 'smooth' });

    }, 50);

  }, 500);

}



function renderCatalog(category) {

  catalogGrid.innerHTML = '';

  const products = catalogData[category] || [];

  

  products.forEach((prod, i) => {

    const card = document.createElement('div');

    card.className = 'catalog-card';

    card.style.opacity = '0';

    card.style.transform = 'translateY(20px)';

    

    const imgContainer = document.createElement('div');
    imgContainer.className = 'catalog-card-img';
    
    const img = document.createElement('img');
    img.src = prod.image;
    img.alt = prod.name;
    img.className = 'product-image';
    
    imgContainer.appendChild(img);

    if (prod.suggestion) {
      const badge = document.createElement('div');
      badge.className = 'suggestion-badge';
      badge.innerHTML = `<i class="fa-solid fa-notes-medical"></i> ${prod.suggestion}`;
      imgContainer.appendChild(badge);
    }
    
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'catalog-card-details';
    
    const title = document.createElement('h3');
    title.textContent = prod.name;
    
    const desc = document.createElement('p');
    desc.textContent = prod.desc;
    
    detailsContainer.appendChild(title);
    detailsContainer.appendChild(desc);
    
    card.appendChild(imgContainer);
    card.appendChild(detailsContainer);

    

    catalogGrid.appendChild(card);

    

    // Animate cards in

    anime({

      targets: card,

      opacity: [0, 1],

      translateY: [20, 0],

      duration: 600,

      easing: 'easeOutQuad',

      delay: i * 50

    });

  });

}



// Event Listeners

function showAbout(e) {
  if(e) e.preventDefault();
  
  homeView.style.opacity = '0';
  catalogView.style.opacity = '0';
  setTimeout(() => {
    homeView.classList.add('hidden');
    homeView.classList.remove('active');
    catalogView.classList.add('hidden');
    catalogView.classList.remove('active');
    
    aboutView.classList.remove('hidden');
    aboutView.classList.add('active');
    
    setTimeout(() => {
      aboutView.style.opacity = '1';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }, 500);
}

exploreBtns.forEach(btn => {

  btn.addEventListener('click', showCatalog);

});

if (backToHomeBtn) backToHomeBtn.addEventListener('click', hideCatalog);



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

  try {
    const rssUrl = '/api/news/rss/search?q=disease+OR+fever+OR+dengue+OR+malaria+OR+covid+delhi+ncr&hl=en-IN&gl=IN&ceid=IN:en';
    const response = await fetch(rssUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const textData = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(textData, "text/xml");
    const items = xmlDoc.querySelectorAll('item');

    if (items.length > 0) {
      newsGrid.innerHTML = ''; 
      
      const topNews = Array.from(items).slice(0, 3);
      
      topNews.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'product-card news-card';
        card.setAttribute('data-category', 'precautions');
        card.style.cursor = 'pointer';
        
        let title = item.querySelector('title')?.textContent || 'Health Alert';
        title = title.split(' - ')[0];

        let description = item.querySelector('description')?.textContent || '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = description;
        let textContent = tempDiv.textContent || tempDiv.innerText || '';
        
        card.innerHTML = `
          <h3 style="font-size: 1.1rem; margin-bottom: 10px; line-height: 1.3;">${title}</h3>
          <p style="font-size: 0.9rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; opacity: 0.8;">${textContent}</p>
        `;
        
        card.addEventListener('click', () => {
          const category = card.getAttribute('data-category');
          tabBtns.forEach(b => b.classList.remove('active'));
          const targetTab = Array.from(tabBtns).find(b => b.getAttribute('data-category') === category);
          if (targetTab) targetTab.classList.add('active');
          renderCatalog(category);
          showCatalog();
        });
        
        newsGrid.appendChild(card);
      });
      
      document.querySelectorAll('#dynamic-news-grid .product-card').forEach(card => {
        card.style.opacity = 0;
        card.style.transform = 'translateY(20px)';
        if (typeof observer !== 'undefined') {
          observer.observe(card);
        }
      });
      return;
    }
    throw new Error('No items found');
  } catch (error) {
    console.error('Error fetching news:', error);
    newsGrid.innerHTML = `<div style="color: rgba(255, 255, 255, 0.7); text-align: center; width: 100%; grid-column: 1 / -1; padding: 20px;">Unable to fetch real-time news right now. Error: ${error.message}</div>`;
  }
}

fetchHealthNews();

const logoHomeBtn = document.getElementById('logo-home-btn');
if (logoHomeBtn) logoHomeBtn.addEventListener('click', hideCatalog);

if (aboutBtn) aboutBtn.addEventListener('click', showAbout);




// --- Custom Cursor ---
const customCursor = document.getElementById('custom-cursor');
if (customCursor) {
  document.addEventListener('mousemove', (e) => {
    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top = e.clientY + 'px';
  });

  const addHover = () => customCursor.classList.add('hover');
  const removeHover = () => customCursor.classList.remove('hover');

  document.querySelectorAll('a, button, .catalog-card').forEach(el => {
    el.addEventListener('mouseenter', addHover);
    el.addEventListener('mouseleave', removeHover);
  });

  const addTextHover = () => customCursor.classList.add('text-hover');
  const removeTextHover = () => customCursor.classList.remove('text-hover');

  document.querySelectorAll('#about-view p, #about-view h1, #about-view h2, #about-view h3, #about-view span, #about-view li, #about-view .about-content').forEach(el => {
    el.addEventListener('mouseenter', addTextHover);
    el.addEventListener('mouseleave', removeTextHover);
  });
}


