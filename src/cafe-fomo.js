// Grabbo Web - CAFÉ FOMO Dedicated Page
import './style.css';

// Menu category tabs filtering
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

// Mobile Navigation Menu Toggle
const navToggle = document.querySelector('.nav-menu-toggle');
const navMenu = document.getElementById('primary-nav-menu');
if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    navMenu.classList.toggle('nav-menu-open');
  });
}

// Custom Cursor (matches homepage custom cursor)
const customCursor = document.getElementById('custom-cursor');
if (customCursor) {
  document.addEventListener('mousemove', (e) => {
    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top = e.clientY + 'px';
    customCursor.style.transform = 'translate(-50%, -50%)';
  });

  document.addEventListener('mouseover', (e) => {
    const interactive = e.target.closest('a, button, .cafe-fomo-card, .cafe-menu-card, .cafe-menu-tab, .cafe-fomo-bento-item, input, select, textarea');
    if (interactive) {
      customCursor.classList.add('hover');
    }
  });

  document.addEventListener('mouseout', (e) => {
    const interactive = e.target.closest('a, button, .cafe-fomo-card, .cafe-menu-card, .cafe-menu-tab, .cafe-fomo-bento-item, input, select, textarea');
    if (interactive) {
      customCursor.classList.remove('hover');
    }
  });
}

