// =========================================================
// GM REAL ESTATE - TOWN-WISE AGENT DIRECTORY (shared file)
// index.html (main.js) aur property.html (property.js) dono
// isi file ko use karte hain -- is liye yeh dono jagah <script>
// tag se apni-apni logic wali file se PEHLE link honi chahiye.
// =========================================================

// Har Karachi town ka apna dedicated agent WhatsApp number.
// (Yeh demo/placeholder numbers hain -- asal numbers se replace kar dein.)
const TOWN_AGENTS = {
  'Gulshan-e-Iqbal Town': '923089011588',
  'Gulistan-e-Johar': '923089011588',
  'DHA Phase 1 to 8': '923089011588',
  'Clifton': '923089011588',
  'Bahria Town Karachi': '923089011588',
  'North Nazimabad Town': '923089011588',
  'Nazimabad': '923089011588',
  'PECHS': '923089011588',
  'Federal B Area (Gulberg)': '923089011588',
  'Scheme 33': '923089011588',
  'Malir Cantt': '923089011588',
  'Malir Town': '923089011588',
  'Model Colony': '923089011588',
  'Korangi Town': '923089011588',
  'Landhi Town': '923089011588',
  'Saddar Town': '923089011588',
  'Jamshed Town': '923089011588',
  'Liaquatabad Town': '923089011588',
  'Orangi Town': '923089011588',
  'SITE Town': '923089011588',
  'Keamari Town': '923089011588',
  'Lyari Town': '923089011588',
  'Gadap Town': '923089011588',
  'Hawkesbay / Mauripur': '923089011588',
  'North Karachi / New Karachi': '923089011588',
  'Other Area': '923089011588',
};

const DEFAULT_AGENT_PHONE = '923089011588';

// property.area mein hum "Town (Exact Address)" format mein save karte
// hain (form.js dekhein) -- is liye yahan sirf shuru ka town-name
// nikaal kar TOWN_AGENTS table se match karte hain.
function getAgentPhoneForProperty(property) {
  if (!property || !property.area) return DEFAULT_AGENT_PHONE;
  const townName = property.area.split(' (')[0].trim();
  return TOWN_AGENTS[townName] || DEFAULT_AGENT_PHONE;
}

// Owner/Admin record: jab bhi koi "Contact Agent", WhatsApp ya Call
// button dabata hai, ek entry localStorage mein save hoti hai taake
// owner "owner-dashboard.html" par dekh sake -- kab, kis property par,
// kis agent number par contact hua.
function logAgentContact(property, agentPhone) {
  try {
    const log = JSON.parse(localStorage.getItem('gm_contact_log')) || [];
    log.push({
      propertyId: property.id,
      propertyTitle: property.title,
      town: property.area,
      agentPhone,
      time: new Date().toLocaleString('en-PK'),
    });
    localStorage.setItem('gm_contact_log', JSON.stringify(log));
  } catch (err) {
    // Log fail hone se contact button ka kaam nahi rukna chahiye
    console.error('Contact log save nahi ho saka:', err);
  }
}