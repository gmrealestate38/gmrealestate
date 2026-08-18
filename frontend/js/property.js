// =========================================================
// GM REAL ESTATE - PROPERTY DETAIL PAGE LOGIC (property.html)
// =========================================================

let currentImageIndex = 0;
let isScrolling = false;

// =========================================================
// DYNAMIC PROPERTY LOADER
// Homepage ke property card par click karne se yahan
// "property.html?id=12345" ke sath aaya jata hai. Yahan hum
// wohi ID localStorage ("gm_properties") mein dhoondh kar
// page ke placeholder content ko asli data se replace karte hain.
// Agar URL mein koi id na ho (ya id na mile), page apna
// static/demo content hi dikhata rehta hai -- jaisa pehle tha.
// =========================================================
function loadDynamicPropertyData() {
  const params = new URLSearchParams(window.location.search);
  const propertyId = params.get('id');
  if (!propertyId) return; // Direct/demo open -- kuch change nahi karna

  const allProperties = JSON.parse(localStorage.getItem('gm_properties')) || [];
  const property = allProperties.find((p) => String(p.id) === String(propertyId));
  if (!property) return; // ID nahi mila -- demo content hi rehne dein

  // Basic Info & Price
  document.getElementById('propTitle').textContent = property.title;
  document.getElementById('propLocation').textContent = `📍 ${property.area}, ${property.city}`;

  const priceSuffix = property.purpose === 'Rent' ? ' / month' : '';
  document.getElementById('propPrice').textContent = `PKR ${property.price.toLocaleString('en-PK')}${priceSuffix}`;

  // Rent properties ke liye Advance amount dikhayein (agar diya gaya ho)
  const advanceEl = document.getElementById('propAdvance');
  if (advanceEl) {
    if (property.purpose === 'Rent' && property.advance) {
      advanceEl.textContent = `Advance: PKR ${property.advance.toLocaleString('en-PK')}`;
      advanceEl.style.display = 'block';
    } else {
      advanceEl.style.display = 'none';
    }
  }

  // Key Specifications
  document.getElementById('specType').textContent = property.type;
  document.getElementById('specPurpose').textContent = `For ${property.purpose}`;
  document.getElementById('specBeds').textContent = `${property.bedrooms || 0} Beds`;
  document.getElementById('specBaths').textContent = `${property.bathrooms || 0} Baths`;

  // Description
  document.getElementById('propDescription').textContent =
    property.description || 'No description provided.';

  // Town ke mutabiq agent ka WhatsApp/Call number set karna, aur jab
  // buyer contact button dabaye to owner ke record ke liye log karna
  const agentPhone = getAgentPhoneForProperty(property);
  const whatsappBtn = document.getElementById('whatsappContactBtn');
  const callBtn = document.getElementById('callContactBtn');

  if (whatsappBtn) {
    const message = `Hi, I am interested in ${property.title} (ID: ${property.id})`;
    whatsappBtn.href = `https://wa.me/${agentPhone}?text=${encodeURIComponent(message)}`;
    whatsappBtn.addEventListener('click', () => logAgentContact(property, agentPhone));
  }
  if (callBtn) {
    callBtn.href = `tel:+${agentPhone}`;
    callBtn.addEventListener('click', () => logAgentContact(property, agentPhone));
  }

  // Gallery -- thumbnails ko is property ki apni images se replace karna
  const imgList = property.images && property.images.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'];

  const thumbContainer = document.getElementById('thumbContainer');
  if (thumbContainer) {
    thumbContainer.innerHTML = '';
    imgList.forEach((src, idx) => {
      const img = document.createElement('img');
      img.src = src;
      img.className = 'thumb-img' + (idx === 0 ? ' active' : '');
      thumbContainer.appendChild(img);
    });
  }

  const mainImage = document.getElementById('mainImage');
  if (mainImage) mainImage.src = imgList[0];
}

// 1. Main Gallery Switcher Function
function changeImage(index) {
  const thumbnails = document.querySelectorAll('.thumb-img');
  const mainImage = document.getElementById('mainImage');
  const counter = document.getElementById('imgCounter');
  const dots = document.querySelectorAll('.dot');

  // Agar koi image nahi hai toh stop kar dein
  if (thumbnails.length === 0) return;

  // Index Out of Bounds Check
  if (index >= thumbnails.length) currentImageIndex = 0;
  else if (index < 0) currentImageIndex = thumbnails.length - 1;
  else currentImageIndex = index;

  const targetThumb = thumbnails[currentImageIndex];

  // Main Image Update
  if (mainImage && targetThumb) {
    mainImage.src = targetThumb.src;
  }

  // Active Thumbnail Highlight
  thumbnails.forEach((thumb, idx) => {
    thumb.classList.toggle('active', idx === currentImageIndex);
  });

  // Active Dot Highlight
  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === currentImageIndex);
  });

  // Exact Counter Text (e.g., 1/2)
  if (counter) {
    counter.textContent = `${currentImageIndex + 1}/${thumbnails.length}`;
  }
}

// 2. Setup Dots & Event Listeners dynamically
function setupGallery() {
  const thumbnails = document.querySelectorAll('.thumb-img');
  const dotsContainer = document.getElementById('dotsContainer');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (thumbnails.length === 0) return;

  // Thumbnails ki tadaad ke mutabiq dots dynamically banayein
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    thumbnails.forEach((_, idx) => {
      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.addEventListener('click', () => changeImage(idx));
      dotsContainer.appendChild(dot);
    });
  }

  // Thumbnail par click karke image change karna
  thumbnails.forEach((thumb, idx) => {
    thumb.addEventListener('click', () => changeImage(idx));
  });

  // Prev / Next slider button listeners
  if (prevBtn) prevBtn.addEventListener('click', () => changeImage(currentImageIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => changeImage(currentImageIndex + 1));

  // Pehli image ko default active state dikhayein
  changeImage(0);
}

// Mouse Wheel Scroll Navigation (Slower & Smoother Threshold)
const galleryBox = document.getElementById('galleryBox');
if (galleryBox) {
  galleryBox.addEventListener('wheel', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isScrolling) return;

    // Sensitivity Threshold (Choti moti movement bypass karega)
    if (Math.abs(e.deltaY) < 15) return;

    isScrolling = true;

    if (e.deltaY > 0) {
      changeImage(currentImageIndex + 1);
    } else {
      changeImage(currentImageIndex - 1);
    }

    // Delay to prevent fast rapid image scrolling
    setTimeout(() => {
      isScrolling = false;
    }, 400); // 400ms gap for smooth change
  }, { passive: false });
}

// Global Export taake agar aap dynamic images load karein toh isey wapas call kar sakein
window.setupGallery = setupGallery;

// =========================================================
// MORTGAGE / LOAN CALCULATOR
// =========================================================
const ANNUAL_INTEREST_RATE = 0.115; // 11.5% -- typical Pakistani home-loan rate assumption

function calculateMortgage() {
  const priceEl = document.getElementById('propPrice');
  const tenureEl = document.getElementById('loanTenure');
  const resultEl = document.getElementById('monthlyPayResult');
  if (!priceEl || !tenureEl || !resultEl) return;

  // "PKR 1,50,00,000" jaisi text se sirf numbers nikalna
  const price = parseInt(priceEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
  const downPayment = price * 0.2;
  const loanAmount = price - downPayment;

  const years = parseInt(tenureEl.value, 10);
  const totalMonths = years * 12;
  const monthlyRate = ANNUAL_INTEREST_RATE / 12;

  // Standard amortization formula: M = P * r(1+r)^n / ((1+r)^n - 1)
  const factor = Math.pow(1 + monthlyRate, totalMonths);
  const monthlyPayment = (loanAmount * monthlyRate * factor) / (factor - 1);

  resultEl.textContent = `PKR ${Math.round(monthlyPayment).toLocaleString('en-PK')} / month`;
}

const loanTenureSelect = document.getElementById('loanTenure');
if (loanTenureSelect) {
  loanTenureSelect.addEventListener('change', calculateMortgage);
}

// =========================================================
// SAVE / UNSAVE PROPERTY (heart button)
// Saved property IDs "gm_saved_properties" mein store hoti hain.
// Poori list "saved-properties.html" par dekhi ja sakti hai.
// =========================================================
function initSaveButton() {
  const saveBtn = document.getElementById('savePropertyBtn');
  if (!saveBtn) return;

  const params = new URLSearchParams(window.location.search);
  const propertyId = params.get('id');

  // Demo/static page (bina ?id ke) par save karna possible nahi
  if (!propertyId) {
    saveBtn.addEventListener('click', () => {
      alert('Yeh ek demo preview page hai, is property ko save nahi kiya ja sakta.');
    });
    return;
  }

  const refreshButtonLabel = () => {
    const saved = JSON.parse(localStorage.getItem('gm_saved_properties')) || [];
    saveBtn.textContent = saved.includes(propertyId) ? '❤️ Saved' : '🤍 Save';
  };

  refreshButtonLabel();

  saveBtn.addEventListener('click', () => {
    let saved = JSON.parse(localStorage.getItem('gm_saved_properties')) || [];

    if (saved.includes(propertyId)) {
      saved = saved.filter((id) => id !== propertyId);
    } else {
      saved.push(propertyId);
    }

    localStorage.setItem('gm_saved_properties', JSON.stringify(saved));
    refreshButtonLabel();
  });
}

initSaveButton();

// Page Load Event
document.addEventListener('DOMContentLoaded', () => {
  loadDynamicPropertyData(); // Pehle asli data bhar dein (agar ?id= mila ho)
  setupGallery();            // Phir gallery ko naye images ke sath set up karein
  calculateMortgage();       // Aur mortgage ko updated price ke mutabiq calculate karein
});