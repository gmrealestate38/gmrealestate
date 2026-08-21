// =========================================================
// GM REAL ESTATE - PAST PROJECTS PAGE LOGIC (past-projects.html)
// Jab koi property homepage par "Hide/Sold" button se hide ki
// jaati hai, uska status "Sold" ho jata hai (main.js dekhein).
// Yeh page sirf wohi "Sold" properties dhoondh kar dikhata hai.
// =========================================================

// MOBILE MENU TOGGLE (isi tarah jaise index.html par kaam karta hai)
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
const mobileMenuCloseBtn = document.getElementById('mobileMenuCloseBtn');

function closeMobileMenu() {
  if (mobileMenu) mobileMenu.classList.remove('open');
  if (mobileMenuOverlay) mobileMenuOverlay.classList.remove('open');
}

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    if (mobileMenuOverlay) mobileMenuOverlay.classList.toggle('open');
  });
}

if (mobileMenuOverlay) mobileMenuOverlay.addEventListener('click', closeMobileMenu);
if (mobileMenuCloseBtn) mobileMenuCloseBtn.addEventListener('click', closeMobileMenu);

document.querySelectorAll('.mobile-link').forEach((el) => {
  el.addEventListener('click', closeMobileMenu);
});

// "Post Property" -- login zaroori hai (agents-only feature)
function guardPostPropertyClick(e) {
  const currentUser = JSON.parse(localStorage.getItem('gm_current_user') || 'null');
  if (!currentUser) {
    e.preventDefault();
    alert('Property post karne ke liye pehle login/signup karna zaroori hai.');
    window.location.href = '/login/';
  }
}

document.querySelectorAll('#postPropertyBtn, #mobilePostPropertyBtn').forEach((btn) => {
  btn.addEventListener('click', guardPostPropertyClick);
});

function renderPastProjects() {
  const grid = document.getElementById('pastProjectsGrid');
  if (!grid) return;

  const allProperties = JSON.parse(localStorage.getItem('gm_properties')) || [];
  const pastProjects = allProperties.filter((p) => p.status === 'Sold');

  if (pastProjects.length === 0) {
    grid.innerHTML = '<p class="no-listings-msg">Abhi tak koi past project record nahi hua.</p>';
    return;
  }

  grid.innerHTML = '';

  pastProjects.forEach((property) => {
    const card = document.createElement('div');
    card.className = 'property-card past-project-card';

    const imgList = property.images && property.images.length > 0
      ? property.images
      : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80'];

    // Purpose ke mutabiq badge text: "Sale" wali property "Sold" kehlati
    // hai, "Rent" wali "Rented" -- dono ka status DB mein "Sold" hi hota
    // hai (dono ko "completed" mark karne ka tareeqa), yahan sirf label
    // farq hai.
    const badgeText = property.purpose === 'Rent' ? 'Rented' : 'Sold';

    const review = property.saleReview;
    let reviewHtml = '';
    if (review) {
      const filledStars = '★'.repeat(review.rating);
      const emptyStars = '☆'.repeat(5 - review.rating);
      reviewHtml = `
        <div class="past-project-review">
          <div class="review-stars">${filledStars}${emptyStars}</div>
          <p class="review-text">"${review.feedback}"</p>
          <span class="review-date">${review.date}</span>
        </div>
      `;
    }

    card.innerHTML = `
      <span class="sold-badge">${badgeText}</span>

      <div class="property-img-container" style="width:100%; height:180px; overflow:hidden; border-radius:6px; margin-bottom:12px;">
        <img src="${imgList[0]}" alt="${property.title}" style="width:100%; height:100%; object-fit:cover;">
      </div>

      <h3>${property.title}</h3>
      <div style="color:#777; font-size:0.9rem; margin-bottom:8px;">📍 ${property.area}, ${property.city}</div>
      <div class="price">PKR ${property.price.toLocaleString('en-PK')}</div>

      ${reviewHtml}
    `;

    grid.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', renderPastProjects);
