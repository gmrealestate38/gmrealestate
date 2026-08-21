// =========================================================
// GM REAL ESTATE - MY PROFILE PAGE (my-profile.html)
// Django backend se connected hai (token auth). Logged-in
// client/agent ki profile + unki uploaded properties (Agents)
// + unki saved properties dikhata hai.
// =========================================================

const PROFILE_API_BASE_URL = 'https://gmrealestate.onrender.com/api';

async function profileApiRequest(path, token) {
  const response = await fetch(`${PROFILE_API_BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
  });

  const rawText = await response.text();
  let data = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch (parseErr) {
    if (!response.ok) {
      throw new Error(`Server error (status ${response.status}).`);
    }
  }

  if (!response.ok) {
    throw new Error(data.detail || `Server error (status ${response.status}).`);
  }

  return data;
}

function fallbackImage() {
  return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80';
}

function buildPropertyCard(property, { showUnsave } = {}) {
  const imgUrl = property.images && property.images.length > 0
    ? property.images[0].image
    : fallbackImage();
  const priceSuffix = property.purpose === 'Rent' ? ' / month' : '';
  const isSold = property.status === 'Sold';

  const card = document.createElement('div');
  card.className = 'property-card';
  card.style.position = 'relative';

  card.innerHTML = `
    ${property.status ? `<span class="my-listing-status-badge ${isSold ? 'sold' : 'active'}">${isSold ? 'SOLD' : 'ACTIVE'}</span>` : ''}
    ${showUnsave ? '<button type="button" class="btn-hide-property btn-unsave" title="Saved list se hatayein">✕ Unsave</button>' : ''}

    <div class="property-img-container" style="width:100%; height:180px; overflow:hidden; border-radius:6px; margin-bottom:12px;">
      <img src="${imgUrl}" alt="${property.title}" style="width:100%; height:100%; object-fit:cover;">
    </div>

    <h3>${property.title}</h3>
    <div style="color:#777; font-size:0.9rem; margin-bottom:8px;">📍 ${property.town}, ${property.city}</div>
    <div class="price">PKR ${Number(property.price).toLocaleString('en-PK')}${priceSuffix}</div>
  `;

  if (showUnsave) {
    const unsaveBtn = card.querySelector('.btn-unsave');
    unsaveBtn.addEventListener('click', async () => {
      const token = localStorage.getItem('gm_auth_token');
      try {
        await fetch(`${PROFILE_API_BASE_URL}/properties/saved/${property.id}/`, {
          method: 'DELETE',
          headers: { Authorization: `Token ${token}` },
        });
        card.remove();
      } catch (err) {
        alert('Unsave nahi ho saka, dobara koshish karein.');
      }
    });
  }

  return card;
}

async function loadProfile() {
  const notLoggedInMsg = document.getElementById('notLoggedInMsg');
  const profileContent = document.getElementById('profileContent');
  const token = localStorage.getItem('gm_auth_token');

  if (!token) {
    notLoggedInMsg.style.display = 'block';
    profileContent.style.display = 'none';
    return;
  }

  try {
    const profile = await profileApiRequest('/accounts/me/', token);

    profileContent.style.display = 'block';
    notLoggedInMsg.style.display = 'none';

    document.getElementById('profileName').textContent = profile.name || '-';
    document.getElementById('profileAvatar').textContent = (profile.name || '?').trim().charAt(0).toUpperCase();
    document.getElementById('profileRoleBadge').textContent = profile.role;
    document.getElementById('profileEmail').textContent = profile.email || '-';
    document.getElementById('profilePhone').textContent = profile.phone || '-';

    if (profile.role === 'Agent') {
      document.getElementById('profileCityWrap').style.display = 'none';
      document.getElementById('profileAgencyWrap').style.display = 'flex';
      document.getElementById('profileTownWrap').style.display = 'flex';
      document.getElementById('profileExpWrap').style.display = 'flex';
      document.getElementById('profileAgency').textContent = profile.agency_name || '-';
      document.getElementById('profileTown').textContent = profile.town || '-';
      document.getElementById('profileExp').textContent = profile.experience_years
        ? `${profile.experience_years} years`
        : '-';

      document.getElementById('myListingsSection').style.display = 'block';
      await loadMyListings(token);
    } else {
      document.getElementById('profileCity').textContent = profile.preferred_city || '-';
    }

    await loadSavedProperties(token);
  } catch (err) {
    // Token invalid/expired -- session saaf karke login page bhej dein
    localStorage.removeItem('gm_auth_token');
    localStorage.removeItem('gm_current_user');
    notLoggedInMsg.textContent = 'Session khatam ho chuki hai. Baraye meharbani dobara login karein.';
    notLoggedInMsg.style.display = 'block';
    profileContent.style.display = 'none';
  }
}

async function loadMyListings(token) {
  const grid = document.getElementById('myListingsGrid');
  const noListingsMsg = document.getElementById('noListingsMsg');

  try {
    const listings = await profileApiRequest('/properties/properties/my_listings/', token);
    grid.innerHTML = '';

    if (!listings || listings.length === 0) {
      noListingsMsg.style.display = 'block';
      return;
    }

    noListingsMsg.style.display = 'none';
    listings.forEach((property) => {
      grid.appendChild(buildPropertyCard(property));
    });
  } catch (err) {
    noListingsMsg.textContent = 'Listings load nahi ho sakin.';
    noListingsMsg.style.display = 'block';
  }
}

async function loadSavedProperties(token) {
  const grid = document.getElementById('savedGrid');
  const noSavedMsg = document.getElementById('noSavedMsg');

  try {
    const saved = await profileApiRequest('/properties/saved/', token);
    grid.innerHTML = '';

    if (!saved || saved.length === 0) {
      noSavedMsg.style.display = 'block';
      return;
    }

    noSavedMsg.style.display = 'none';
    saved.forEach((item) => {
      grid.appendChild(buildPropertyCard(item.property_detail, { showUnsave: true }));
    });
  } catch (err) {
    noSavedMsg.textContent = 'Saved properties load nahi ho sakin.';
    noSavedMsg.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', loadProfile);
