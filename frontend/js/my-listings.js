// =========================================================
// GM REAL ESTATE - MY LISTINGS PAGE (my-listings.html)
// Sirf logged-in Agent ki apni properties dikhata hai (form.js
// ke "postedByEmail" field se match karke). Edit -> form.html
// ko "?edit=<id>" ke sath khol deta hai; Delete -> confirm ke
// baad list se hata deta hai.
// =========================================================

function renderMyListings() {
  const grid = document.getElementById('myListingsGrid');
  const notLoggedInMsg = document.getElementById('notLoggedInMsg');
  if (!grid) return;

  const currentUser = JSON.parse(localStorage.getItem('gm_current_user') || 'null');

  if (!currentUser || currentUser.role !== 'Agent') {
    grid.style.display = 'none';
    if (notLoggedInMsg) notLoggedInMsg.style.display = 'block';
    return;
  }

  const allProperties = JSON.parse(localStorage.getItem('gm_properties')) || [];
  const myProperties = allProperties.filter((p) => p.postedByEmail === currentUser.email);

  if (myProperties.length === 0) {
    grid.innerHTML = '<p class="no-listings-msg">Aapne abhi tak koi property post nahi ki. <a href="form.html">Pehli property post karein</a>.</p>';
    return;
  }

  grid.innerHTML = '';

  myProperties.forEach((property) => {
    const isSold = property.status === 'Sold';
    const imgList = property.images && property.images.length > 0
      ? property.images
      : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80'];
    const priceSuffix = property.purpose === 'Rent' ? ' / month' : '';

    const card = document.createElement('div');
    card.className = 'property-card';
    card.style.position = 'relative';

    card.innerHTML = `
      <span class="my-listing-status-badge ${isSold ? 'sold' : 'active'}">${isSold ? 'SOLD' : 'ACTIVE'}</span>

      <div class="property-img-container" style="width:100%; height:180px; overflow:hidden; border-radius:6px; margin-bottom:12px;">
        <img src="${imgList[0]}" alt="${property.title}" style="width:100%; height:100%; object-fit:cover;">
      </div>

      <h3>${property.title}</h3>
      <div style="color:#777; font-size:0.9rem; margin-bottom:8px;">📍 ${property.area}, ${property.city}</div>
      <div class="price">PKR ${property.price.toLocaleString('en-PK')}${priceSuffix}</div>

      <div class="my-listing-actions">
        <button type="button" class="btn-edit-listing" data-id="${property.id}">✏️ Edit</button>
        <button type="button" class="btn-delete-listing" data-id="${property.id}">🗑️ Delete</button>
      </div>
    `;

    grid.appendChild(card);
  });

  grid.querySelectorAll('.btn-edit-listing').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.href = `form.html?edit=${btn.dataset.id}`;
    });
  });

  grid.querySelectorAll('.btn-delete-listing').forEach((btn) => {
    btn.addEventListener('click', () => {
      const confirmed = confirm('Kya aap waqai is property ko delete karna chahte hain? Yeh wapis nahi ho sakega.');
      if (!confirmed) return;

      let allProperties = JSON.parse(localStorage.getItem('gm_properties')) || [];
      allProperties = allProperties.filter((p) => String(p.id) !== String(btn.dataset.id));
      localStorage.setItem('gm_properties', JSON.stringify(allProperties));

      renderMyListings();
    });
  });
}

document.addEventListener('DOMContentLoaded', renderMyListings);
