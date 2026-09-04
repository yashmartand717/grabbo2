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

      renderCatalog('beverages');

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


