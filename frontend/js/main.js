// =========================================================
// GM REAL ESTATE - MAIN SITE LOGIC (index.html)
// Note: the "Post Property" form now lives on its own page
// (form.html / form.css / form.js) -- this file only handles
// things that stay on the homepage: mobile menu, hero search
// tabs/filters, the public listings grid, the property detail
// popup, and the "mark as sold + feedback" popup.
// =========================================================

// MOBILE MENU TOGGLE
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
const mobileMenuCloseBtn = document.getElementById('mobileMenuCloseBtn');

function openMobileMenu() {
  if (mobileMenu) mobileMenu.classList.add('open');
  if (mobileMenuOverlay) mobileMenuOverlay.classList.add('open');
}

function closeMobileMenu() {
  if (mobileMenu) mobileMenu.classList.remove('open');
  if (mobileMenuOverlay) mobileMenuOverlay.classList.remove('open');
}

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => {
    // Agar pehle se open hai to band kar do, warna khol do
    if (mobileMenu.classList.contains('open')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });
}

// Overlay (background ka dark hissa) par click karte hi menu band ho jaye
if (mobileMenuOverlay) {
  mobileMenuOverlay.addEventListener('click', closeMobileMenu);
}

// "X" close button
if (mobileMenuCloseBtn) {
  mobileMenuCloseBtn.addEventListener('click', closeMobileMenu);
}

// HERO TABS SELECTION & FILTER SYSTEM
const tabButtons = document.querySelectorAll('.tab-btn');
let selectedPurpose = 'Sale';
let selectedCategoryType = null; // Property Categories section se set hota hai

tabButtons.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabButtons.forEach((t) => t.classList.remove('active-tab'));
    tab.classList.add('active-tab');

    const tabType = tab.dataset.tab;
    if (tabType === 'buy') selectedPurpose = 'Sale';
    if (tabType === 'rent') selectedPurpose = 'Rent';
    if (tabType === 'installments') selectedPurpose = 'Installments';

    // Tab dobara select karne ka matlab hai category filter hata dein
    selectedCategoryType = null;
    resetListingsHeading();

    updatePublicListings();
  });
});

// PROPERTY CATEGORIES SECTION -- category card click karne par us
// type ki SAARI properties dikhengi (Sale + Rent dono, purpose tab
// ki parwah kiye baghair).
const categoryCards = document.querySelectorAll('.category-card');
categoryCards.forEach((card) => {
  card.addEventListener('click', () => {
    const type = card.dataset.type;
    const label = card.dataset.label;

    selectedCategoryType = type;

    const heading = document.getElementById('listingsHeading');
    if (heading) heading.textContent = `${label} - All Listings`;

    updatePublicListings();

    // Neeche listings section tak smoothly scroll kar dein
    const listingsSection = document.getElementById('listingsGrid');
    if (listingsSection) listingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Kuch categories ke andar ek se zyada specific "type" values shamil
// hoti hain (form.html ke Property Type dropdown se match karta hai).
// Jab bhi koi category select/click ki jaye (category card, navbar
// link, ya hero search), is group ki saari matching types dikhengi.
const CATEGORY_GROUPS = {
  Commercial: ['Shop', 'Godown / Warehouse', 'Office', 'Plaza / Building', 'Commercial'],
  House: ['House', 'Portion'],
};

function propertyMatchesCategory(prop, category) {
  const group = CATEGORY_GROUPS[category];
  return group ? group.includes(prop.type) : prop.type === category;
}

function resetListingsHeading() {
  const heading = document.getElementById('listingsHeading');
  if (heading) heading.textContent = 'Latest Properties (Public View)';
}

// =========================================================
// TOP NAVBAR LINKS (Buy / Rent / Commercial)
// Yeh links wahi filtering logic use karte hain jo hero tabs aur
// category cards use karte hain -- bas seedha listings tak scroll
// kar dete hain. data-nav attribute desktop aur mobile menu dono
// mein duplicate hai, is liye querySelectorAll se dono pakre jate hain.
// =========================================================
function setActiveNavLink(key) {
  document.querySelectorAll('.nav-link, .mobile-link').forEach((el) => el.classList.remove('active'));
  document.querySelectorAll(`[data-nav="${key}"]`).forEach((el) => el.classList.add('active'));
}

function goToPurposeSection(purpose) {
  selectedCategoryType = null;
  selectedPurpose = purpose;

  tabButtons.forEach((t) => {
    const matches =
      (purpose === 'Sale' && t.dataset.tab === 'buy') ||
      (purpose === 'Rent' && t.dataset.tab === 'rent') ||
      (purpose === 'Installments' && t.dataset.tab === 'installments');
    t.classList.toggle('active-tab', matches);
  });

  setActiveNavLink(purpose === 'Sale' ? 'buy' : purpose === 'Rent' ? 'rent' : 'installments');
  resetListingsHeading();
  updatePublicListings();

  const grid = document.getElementById('listingsGrid');
  if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });

  closeMobileMenu();
}

function goToCommercialSection() {
  selectedCategoryType = 'Commercial';

  const heading = document.getElementById('listingsHeading');
  if (heading) heading.textContent = 'Commercial - All Listings';

  setActiveNavLink('commercial');
  updatePublicListings();

  const grid = document.getElementById('listingsGrid');
  if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });

  closeMobileMenu();
}

document.querySelectorAll('[data-nav="buy"]').forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    goToPurposeSection('Sale');
  });
});

document.querySelectorAll('[data-nav="rent"]').forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    goToPurposeSection('Rent');
  });
});

document.querySelectorAll('[data-nav="commercial"]').forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    goToCommercialSection();
  });
});

// Baaki plain anchor links (Projects/About Us/Contact Us) mobile
// menu par click hone ke baad mobile menu apne aap band ho jaye
document.querySelectorAll('.mobile-link').forEach((el) => {
  el.addEventListener('click', () => {
    closeMobileMenu();
  });
});

// =========================================================
// LOGIN STATE: agar user login.html se login/signup kar chuka hai,
// to "Login / Register" button ki jagah uska naam + Logout dikhayein
// =========================================================
function renderAuthNav() {
  const currentUser = JSON.parse(localStorage.getItem('gm_current_user') || 'null');
  const areas = [document.getElementById('authNavArea'), document.getElementById('authNavAreaMobile')];

  areas.forEach((area) => {
    if (!area) return;

    if (currentUser) {
      const myListingsLink = currentUser.role === 'Agent'
        ? `<a href="/my-listings/" class="btn btn-outline">My Listings</a>`
        : '';
      area.innerHTML = `
        <a href="/my-profile/" class="btn btn-outline">My Profile</a>
        ${myListingsLink}
        <span class="auth-welcome">Hi, ${currentUser.name.split(' ')[0]} (${currentUser.role})</span>
        <button type="button" class="btn btn-outline btn-logout">Logout</button>
      `;
      const logoutBtn = area.querySelector('.btn-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          localStorage.removeItem('gm_current_user');
          renderAuthNav();
        });
      }
    } else {
      area.innerHTML = `<a href="/login/" class="btn btn-outline">Login / Register</a>`;
    }
  });
}

renderAuthNav();

// Navbar mein "Saved (N)" ka count dikhana
function renderSavedCount() {
  const countEl = document.getElementById('savedCount');
  if (!countEl) return;
  const saved = JSON.parse(localStorage.getItem('gm_saved_properties')) || [];
  countEl.textContent = saved.length;
}
renderSavedCount();

// "Post Property" -- agar user login nahi hai to form.html ki jagah
// login.html par bhej dete hain (property post karne ke liye login
// zaroori hai).
function guardPostPropertyClick(e) {
  const currentUser = JSON.parse(localStorage.getItem('gm_current_user') || 'null');
  if (!currentUser) {
    e.preventDefault();
    alert('Property post karne ke liye pehle login/signup karna zaroori hai.');
    window.location.href = '/login/';
  }
}

const postPropertyBtn = document.getElementById('postPropertyBtn');
if (postPropertyBtn) postPropertyBtn.addEventListener('click', guardPostPropertyClick);

const mobilePostPropertyBtn = document.getElementById('mobilePostPropertyBtn');
if (mobilePostPropertyBtn && mobileMenu) {
  mobilePostPropertyBtn.addEventListener('click', (e) => {
    guardPostPropertyClick(e);
    closeMobileMenu();
  });
}

// PROPERTY DATA (read-only here; form.html is the one that writes new listings)
let propertyDatabase = JSON.parse(localStorage.getItem('gm_properties')) || [];

// SEARCH FILTER BUTTON LOGIC
const searchBtn = document.getElementById('btnSearch');
if (searchBtn) {
  searchBtn.addEventListener('click', () => {
    updatePublicListings(true);
  });
}

// PUBLIC CARDS RENDER ENGINE
function updatePublicListings(applyAdvancedSearch = false) {
  const grid = document.getElementById('listingsGrid');
  if (!grid) return;

  grid.innerHTML = '';

  // Agar koi category (Houses/Plots/Flats/etc.) select ki gayi hai to
  // sirf "type" ke mutabiq filter karo (Sale/Rent dono shamil hongi).
  // Warna normal Buy/Rent/Installments tab ke mutabiq purpose filter karo.
  // Sold properties ab list se hatai nahi jatin -- unhein SOLD badge ke
  // sath dikhaya jata hai (neeche card render karte waqt). Sirf category
  // aur purpose ke mutabiq filter karte hain, status ke mutabiq nahi.
  let filtered = propertyDatabase.slice();

  if (selectedCategoryType) {
    filtered = filtered.filter((prop) => propertyMatchesCategory(prop, selectedCategoryType));
  } else {
    filtered = filtered.filter((prop) => prop.purpose === selectedPurpose);
  }

  if (applyAdvancedSearch) {
    const cityFilter = document.getElementById('searchCity').value;
    const districtFilter = document.getElementById('searchDistrict').value;
    const townFilter = document.getElementById('searchTown').value;
    const typeFilter = document.getElementById('searchType').value;
    const minPrice = parseInt(document.getElementById('searchMinPrice').value) || 0;
    const maxPrice = parseInt(document.getElementById('searchMaxPrice').value) || Infinity;

    filtered = filtered.filter((prop) => {
      const matchCity = cityFilter === '' || prop.city === cityFilter;

      // District/Town labels form.html aur hero search mein thora alag
      // likhe ja sakte hain (e.g. "Gulshan-e-Iqbal" vs "Gulshan-e-Iqbal
      // Town"), is liye substring match use karte hain taake dono match
      // ho sakein.
      const matchDistrict = districtFilter === '' ||
        (prop.district && prop.district.toLowerCase().includes(districtFilter.toLowerCase()));
      const matchTown = townFilter === '' ||
        (prop.area && prop.area.toLowerCase().includes(townFilter.toLowerCase()));

      const matchType = typeFilter === '' || propertyMatchesCategory(prop, typeFilter);
      const matchPrice = prop.price >= minPrice && prop.price <= maxPrice;
      return matchCity && matchDistrict && matchTown && matchType && matchPrice;
    });
  }

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="no-listings-msg">No properties found matching your criteria.</p>';
    return;
  }

  filtered.forEach((property) => {
    const isSold = property.status === 'Sold';

    const card = document.createElement('div');
    card.className = 'property-card' + (isSold ? ' is-sold' : '');
    card.style.cursor = 'pointer';
    card.style.position = 'relative';
    card.tabIndex = 0;

    const imgList = property.images && property.images.length > 0
      ? property.images
      : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80'];

    // Rent wali properties "/ month" ke sath dikhengi
    const priceSuffix = property.purpose === 'Rent' ? ' / month' : '';

    card.innerHTML = `
      ${isSold
        ? '<span class="sold-badge-inline">SOLD</span>'
        : '<button type="button" class="btn-hide-property" title="Property Sold ho chuki hai to yahan click karein">✅ Mark as Sold</button>'
      }

      <div class="property-img-container" style="width:100%; height:180px; overflow:hidden; border-radius:6px; margin-bottom:12px;">
        <img src="${imgList[0]}" alt="${property.title}" style="width:100%; height:100%; object-fit:cover;">
      </div>

      <h3>${property.title}</h3>
      <div style="color:#777; font-size:0.9rem; margin-bottom:8px;">📍 ${property.area}, ${property.city}</div>
      <div style="color:#555; font-size:0.9rem; margin-bottom:8px;">
        ${property.bedrooms ? `🛏️ ${property.bedrooms} Beds` : ''}
        ${property.bathrooms ? `🛁 ${property.bathrooms} Baths` : ''}
      </div>

      <div class="price">PKR ${property.price.toLocaleString('en-PK')}${priceSuffix}</div>

      ${isSold ? '' : '<button type="button" class="btn-broker-contact">Contact Agent (GM Real Estate)</button>'}
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-hide-property')) {
        e.stopPropagation();
        hidePropertyFromPublic(property.id);
        return;
      }

      if (e.target.closest('.btn-broker-contact')) {
        e.stopPropagation();

        // Us property ke town ke mutabiq agent ka number nikalo,
        // aur owner ke record ke liye is contact ko log kar do.
        const agentPhone = getAgentPhoneForProperty(property);
        logAgentContact(property, agentPhone);

        const message = `Hi GM Real Estate, I am interested in property ID: ${property.id} (${property.title})`;
        window.open(`https://wa.me/${agentPhone}?text=${encodeURIComponent(message)}`, '_blank');
        return;
      }

      // property.html par jayein taake pura, achi tarah design ki hui
      // detail page dikhe (property.js waha is ID ke mutabiq data bharta hai)
      window.location.href = `property.html?id=${property.id}`;
    });

    grid.appendChild(card);
  });
}

// =========================================================
// "MARK AS SOLD" + FEEDBACK/RATING MODAL
// =========================================================
let currentMarkingId = null;
let selectedStarRating = 5;

window.hidePropertyFromPublic = function (id) {
  currentMarkingId = id;
  selectedStarRating = 5;
  highlightStars(5);

  const feedbackModal = document.getElementById('feedbackModal');
  const feedbackText = document.getElementById('feedbackText');
  if (feedbackText) feedbackText.value = '';

  if (feedbackModal) {
    feedbackModal.classList.add('open');
  }
};

let stars = [];

function highlightStars(rating) {
  stars.forEach((s) => {
    const val = parseInt(s.getAttribute('data-value'));
    s.style.color = val <= rating ? '#f59e0b' : '#ddd';
  });
}

function closeFeedback() {
  const feedbackModal = document.getElementById('feedbackModal');
  if (feedbackModal) feedbackModal.classList.remove('open');
  currentMarkingId = null;
}

function finalizePropertyHide(id, reviewData) {
  if (!id) return;
  propertyDatabase = propertyDatabase.map((prop) => {
    if (prop.id === id) {
      return {
        ...prop,
        status: 'Sold',
        saleReview: reviewData,
      };
    }
    return prop;
  });

  localStorage.setItem('gm_properties', JSON.stringify(propertyDatabase));
  updatePublicListings();
}

// =========================================================
// DOM LOADED INITIALIZATION
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
  // Star rating clicks (feedback modal)
  stars = Array.from(document.querySelectorAll('#starContainer span'));
  stars.forEach((star) => {
    star.addEventListener('click', () => {
      selectedStarRating = parseInt(star.getAttribute('data-value'));
      highlightStars(selectedStarRating);
    });
  });

  // Feedback modal buttons
  const closeFeedbackBtn = document.getElementById('closeFeedbackModal');
  const skipBtn = document.getElementById('skipFeedbackBtn');
  const submitBtn = document.getElementById('submitFeedbackBtn');

  if (closeFeedbackBtn) closeFeedbackBtn.addEventListener('click', closeFeedback);
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      finalizePropertyHide(currentMarkingId, null);
      closeFeedback();
    });
  }
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const feedbackText = document.getElementById('feedbackText').value.trim();
      const reviewData = {
        rating: selectedStarRating,
        feedback: feedbackText || 'No feedback provided',
        date: new Date().toLocaleDateString(),
      };
      finalizePropertyHide(currentMarkingId, reviewData);
      closeFeedback();
      alert('Shukriya! Aapka feedback aur rating successfully record ho gayi hai.');
    });
  }

  updatePublicListings();
});


