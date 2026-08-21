// =========================================================
// GM REAL ESTATE - POST PROPERTY FORM LOGIC (form.html)
// Reads the propertyForm inputs, saves the new listing into
// localStorage (same "gm_properties" key that index.html
// reads from), then sends the user back to the homepage.
//
// Yeh file "Edit" mode bhi support karti hai: agar URL
// "form.html?edit=<id>" ke sath khula ho (my-listings.html se
// aane par), to form us property ke maujooda data se bhar jata
// hai aur submit karne par NAYI property banane ke bajaye
// WOHI property update kar deta hai.
// =========================================================

let propertyDatabase = JSON.parse(localStorage.getItem('gm_properties')) || [];
const currentUser = JSON.parse(localStorage.getItem('gm_current_user') || 'null');

// Safety-net: agar koi seedha URL se form.html khol le bina login kiye
// (guarded nav links ko bypass kar ke), yahan bhi rok dete hain.
if (!currentUser) {
  alert('Property post karne ke liye pehle login/signup karna zaroori hai.');
  window.location.href = '/login/';
}

// =========================================================
// EDIT MODE: agar ?edit=<id> URL mein ho, us property ka data dhoondo
// =========================================================
const urlParams = new URLSearchParams(window.location.search);
const editId = urlParams.get('edit');
let editingProperty = null;

if (editId) {
  editingProperty = propertyDatabase.find((p) => String(p.id) === String(editId)) || null;
}

// =========================================================
// PURPOSE TOGGLE: Sale -> Price field | Rent -> Advance + Monthly Rent
// =========================================================
const purposeSelect = document.getElementById('purpose');
const saleFieldsRow = document.getElementById('saleFieldsRow');
const rentFieldsRow = document.getElementById('rentFieldsRow');
const priceInput = document.getElementById('price');
const advanceInput = document.getElementById('advanceAmount');
const monthlyRentInput = document.getElementById('monthlyRent');

function togglePurposeFields() {
  const isRent = purposeSelect.value === 'Rent';

  if (saleFieldsRow) saleFieldsRow.style.display = isRent ? 'none' : 'flex';
  if (rentFieldsRow) rentFieldsRow.style.display = isRent ? 'flex' : 'none';

  // Sirf jo fields is waqt visible hain wohi "required" honi chahiye
  if (priceInput) priceInput.required = !isRent;
  if (advanceInput) advanceInput.required = isRent;
  if (monthlyRentInput) monthlyRentInput.required = isRent;
}

if (purposeSelect) {
  purposeSelect.addEventListener('change', togglePurposeFields);
}

// =========================================================
// EDIT MODE: form ko maujooda property ke data se bhar dena
// =========================================================
function prefillFormForEdit(property) {
  document.getElementById('title').value = property.title || '';
  document.getElementById('propertyType').value = property.type || '';
  document.getElementById('purpose').value = property.purpose || 'Sale';
  document.getElementById('district').value = property.district || '';

  // "area" field "Town (Exact Address)" format mein save hoti hai -- wapis alag karna
  const areaMatch = (property.area || '').match(/^(.*)\s\((.*)\)$/);
  if (areaMatch) {
    document.getElementById('townSelect').value = areaMatch[1];
    document.getElementById('exactAddress').value = areaMatch[2];
  }

  if (property.purpose === 'Rent') {
    document.getElementById('monthlyRent').value = property.price || '';
    document.getElementById('advanceAmount').value = property.advance || '';
  } else {
    document.getElementById('price').value = property.price || '';
  }

  // "size" field "120 Sq. Yds" format mein save hoti hai -- wapis alag karna
  const sizeParts = (property.size || '').split(' ');
  document.getElementById('areaSize').value = sizeParts[0] || '';
  document.getElementById('areaUnit').value = sizeParts.slice(1).join(' ') || 'Sq. Yds';

  document.getElementById('bedrooms').value = property.bedrooms || '';
  document.getElementById('bathrooms').value = property.bathrooms || '';
  document.getElementById('description').value = property.description || '';
  document.getElementById('clientPhone').value = property.ownerContact || '';
  document.getElementById('agreePolicy').checked = true;

  togglePurposeFields();

  // Page ka heading aur button text "Edit" mode ke mutabiq badal dena
  const cardHeading = document.querySelector('.form-card h2');
  if (cardHeading) cardHeading.textContent = 'Edit Your Property';

  const submitBtn = document.querySelector('.btn-submit');
  if (submitBtn) submitBtn.textContent = 'Update Property Listing';

  document.title = 'Edit Property | GM Real Estate';
}

if (editingProperty) {
  prefillFormForEdit(editingProperty);
} else {
  togglePurposeFields(); // Naya form -- default state set kar dein
}

const propertyForm = document.getElementById('propertyForm');

if (propertyForm) {
  propertyForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // Commission Policy checkbox validation
    const policyCheckbox = document.getElementById('agreePolicy');
    if (policyCheckbox && !policyCheckbox.checked) {
      alert('Baraye meharbani property submit karne se pehle Commission Policy ke checkbox ko tick karein.');
      return;
    }

    // Collect basic + specification fields
    const title = document.getElementById('title').value;
    const purpose = document.getElementById('purpose').value;
    const clientPhone = document.getElementById('clientPhone').value;
    const imageInput = document.getElementById('propertyImages');

    const type = document.getElementById('propertyType').value;
    const city = document.getElementById('city').value;
    const district = document.getElementById('district').value;
    const town = document.getElementById('townSelect').value;
    const address = document.getElementById('exactAddress').value;
    const areaSize = document.getElementById('areaSize').value;
    const areaUnit = document.getElementById('areaUnit').value;
    const bedrooms = document.getElementById('bedrooms').value;
    const bathrooms = document.getElementById('bathrooms').value;
    const description = document.getElementById('description').value;

    // Purpose ke mutabiq price nikalna: Sale/Installments ke liye
    // "price" field, Rent ke liye "monthlyRent" field
    const isRent = purpose === 'Rent';
    const price = isRent
      ? document.getElementById('monthlyRent').value
      : document.getElementById('price').value;
    const advanceAmount = isRent ? document.getElementById('advanceAmount').value : null;

    const defaultImg = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80';

    // Builds the final property object and writes it to localStorage.
    // Edit mode mein wohi ID istemal hoti hai (naye ki bajaye update
    // karta hai). Agar quota exceed ho jaye, hum khud hi images
    // chhoti/hata kar dobara try karte hain taake save kabhi bhi
    // sirf "storage full" ki wajah se fail na ho.
    const saveProperty = (images) => {
      const finalImages = images.length > 0
        ? images
        : (editingProperty ? editingProperty.images : [defaultImg]);

      const buildProperty = (imgs) => ({
        id: editingProperty ? editingProperty.id : Date.now(),
        title,
        type,
        purpose,
        city,
        district,
        area: `${town} (${address})`,
        price: parseInt(price),
        advance: advanceAmount ? parseInt(advanceAmount) : null,
        size: `${areaSize} ${areaUnit}`,
        bedrooms,
        bathrooms,
        description,
        images: imgs.length > 0 ? imgs : [defaultImg],
        ownerContact: clientPhone,
        status: editingProperty ? editingProperty.status : 'Active',
        // Agent ki "My Listings" page isi field se uski apni properties
        // dhoondti hai. Edit karte waqt purana postedByEmail hi barqarar rehta hai.
        postedByEmail: editingProperty
          ? editingProperty.postedByEmail
          : (currentUser ? currentUser.email : null),
      });

      const tryWrite = (imgs) => {
        const propertyData = buildProperty(imgs);
        const updatedList = editingProperty
          ? propertyDatabase.map((p) => (String(p.id) === String(editingProperty.id) ? propertyData : p))
          : [...propertyDatabase, propertyData];

        localStorage.setItem('gm_properties', JSON.stringify(updatedList));
        propertyDatabase = updatedList; // sirf successful save ke baad update karo
      };

      try {
        // Attempt 1: jaisi images hain waisi hi save karne ki koshish
        tryWrite(finalImages);
      } catch (err1) {
        try {
          // Attempt 2: sirf pehli 1 image rakh ke dobara try karo
          tryWrite(finalImages.slice(0, 1));
        } catch (err2) {
          try {
            // Attempt 3: purani images (edit mein) ya koi bhi image na
            // rakh kar (nayi property mein) save karo
            tryWrite(editingProperty ? editingProperty.images : []);
            alert('Note: Storage bhar chuka tha, is liye tasveerein poori tarah save nahi ho sakin.');
          } catch (err3) {
            alert(
              'Property save nahi ho saki kyunke browser ka storage (localStorage) bilkul bhar chuka hai.\n\n' +
              'Isay theek karne ke liye: browser mein is site ka page kholein, keyboard se F12 dabayein, ' +
              '"Console" tab mein jayein, yeh line likh kar Enter dabayein:\n\n' +
              'localStorage.clear()\n\n' +
              'Phir dobara form submit karein.'
            );
            return;
          }
        }
      }

      alert(editingProperty ? 'Property update ho gayi!' : 'Property submitted successfully!');

      // Edit mode se aane wale ko wapis "My Listings" bhej dein,
      // naya post karne wale ko homepage par
      window.location.href = editingProperty ? '/my-listings/' : '/';
    };

    // Har uploaded picture ko chhota/compress karke base64 banate hain
    // (localStorage ki limit ~5-10MB hoti hai -- bina compress kiye
    // 2-3 normal photos hi yeh limit paar kar dete hain aur save fail ho jata hai)
    function compressImage(file, maxWidth = 700, quality = 0.5) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const scale = Math.min(1, maxWidth / img.width);
            const canvas = document.createElement('canvas');
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            resolve(canvas.toDataURL('image/jpeg', quality));
          };
          img.onerror = reject;
          img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    if (imageInput && imageInput.files && imageInput.files.length > 0) {
      const filesArray = Array.from(imageInput.files);

      Promise.all(filesArray.map((file) => compressImage(file)))
        .then((compressedImages) => {
          saveProperty(compressedImages);
        })
        .catch(() => {
          alert('Tasveerein process karte waqt masla hua, baraye meharbani dobara koshish karein.');
        });
    } else {
      // Edit mode mein: agar nayi tasveerein select nahi ki gayin,
      // purani tasveerein hi barqarar rahengi (saveProperty ke andar handle hota hai)
      saveProperty([]);
    }
  });
}

// =========================================================
// LIVE GOOGLE MAP PREVIEW
// District / Town / Address / Landmark change hone par map
// ka embed URL update karta hai (chhota debounce ke sath).
// =========================================================
let mapDebounceTimer;
function updateLiveMapPreview() {
  clearTimeout(mapDebounceTimer);
  mapDebounceTimer = setTimeout(() => {
    const district = document.getElementById('district')?.value || '';
    const town = document.getElementById('townSelect')?.value || '';
    const address = document.getElementById('exactAddress')?.value || '';
    const landmark = document.getElementById('landmark')?.value || '';

    const locationQuery = `${address} ${landmark} ${town} ${district} Karachi Pakistan`.trim();
    const mapFrame = document.getElementById('mapPreviewFrame');
    if (mapFrame) {
      const encodedQuery = encodeURIComponent(locationQuery);
      mapFrame.src = `https://maps.google.com/maps?q=${encodedQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }
  }, 400);
}

// Map preview ko un sab fields se jodo jo location define karte hain
['district', 'townSelect'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', updateLiveMapPreview);
});
['exactAddress', 'landmark'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', updateLiveMapPreview);
});

// =========================================================
// COMMISSION POLICY DETAILS LINK
// =========================================================
const policyLink = document.getElementById('policyDetailsLink');
if (policyLink) {
  policyLink.addEventListener('click', (e) => {
    e.preventDefault();
    alert(
      'GM Real Estate Policy:\n' +
      '1. Rent deal par 25% first month rent comission.\n' +
      '2. Sale/Purchase deal par 2% Buyer aur 2% Seller dono se brokerage fee li jayegi.'
    );
  });
}

