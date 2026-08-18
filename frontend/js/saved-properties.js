// =========================================================
// GM REAL ESTATE - SAVED PROPERTIES PAGE (saved-properties.html)
// =========================================================

function renderSavedProperties() {
  const grid = document.getElementById('savedGrid');
  if (!grid) return;

  const savedIds = JSON.parse(localStorage.getItem('gm_saved_properties')) || [];
  const allProperties = JSON.parse(localStorage.getItem('gm_properties')) || [];
  const savedProperties = allProperties.filter((p) => savedIds.includes(String(p.id)));

  if (savedProperties.length === 0) {
    grid.innerHTML = '<p class="no-listings-msg">Abhi tak koi property save nahi ki. Kisi property ki detail page par ❤️ Save button dabayein.</p>';
    return;
  }

  grid.innerHTML = '';

  savedProperties.forEach((property) => {
    const imgList = property.images && property.images.length > 0
      ? property.images
      : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80'];

    const priceSuffix = property.purpose === 'Rent' ? ' / month' : '';

    const card = document.createElement('div');
    card.className = 'property-card';
    card.style.position = 'relative';

    card.innerHTML = `
      <button type="button" class="btn-hide-property btn-unsave" title="Saved list se hatayein">✕ Unsave</button>

      <div class="property-img-container" style="width:100%; height:180px; overflow:hidden; border-radius:6px; margin-bottom:12px; cursor:pointer;">
        <img src="${imgList[0]}" alt="${property.title}" style="width:100%; height:100%; object-fit:cover;">
      </div>

      <h3 style="cursor:pointer;">${property.title}</h3>
      <div style="color:#777; font-size:0.9rem; margin-bottom:8px;">📍 ${property.area}, ${property.city}</div>
      <div class="price">PKR ${property.price.toLocaleString('en-PK')}${priceSuffix}</div>
    `;

    card.querySelector('.btn-unsave').addEventListener('click', (e) => {
      e.stopPropagation();
      const updated = savedIds.filter((id) => id !== String(property.id));
      localStorage.setItem('gm_saved_properties', JSON.stringify(updated));
      renderSavedProperties();
    });

    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-unsave')) return;
      window.location.href = `property.html?id=${property.id}`;
    });

    grid.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', renderSavedProperties);