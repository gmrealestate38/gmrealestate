// =========================================================
// GM REAL ESTATE - OWNER DASHBOARD LOGIC (owner-dashboard.html)
// "gm_contact_log" ko localStorage se parh kar table mein
// dikhata hai -- yeh log agents-data.js ke logAgentContact()
// function se banta hai (main.js aur property.js dono call
// karte hain jab koi buyer/tenant agent ko contact karta hai).
// =========================================================

function renderContactLog() {
  const tableBody = document.getElementById('logTableBody');
  const countText = document.getElementById('logCountText');
  if (!tableBody) return;

  const log = JSON.parse(localStorage.getItem('gm_contact_log')) || [];

  if (countText) {
    countText.textContent = `${log.length} contact${log.length === 1 ? '' : 's'} recorded`;
  }

  if (log.length === 0) {
    tableBody.innerHTML = '<tr class="owner-empty-row"><td colspan="4">Abhi tak koi contact record nahi hua.</td></tr>';
    return;
  }

  // Sabse nayi entry sabse upar dikhayein
  const reversedLog = log.slice().reverse();

  tableBody.innerHTML = reversedLog
    .map(
      (entry) => `
        <tr>
          <td>${entry.time}</td>
          <td>${entry.propertyTitle}</td>
          <td>${entry.town}</td>
          <td>+${entry.agentPhone}</td>
        </tr>
      `
    )
    .join('');
}

const clearLogBtn = document.getElementById('clearLogBtn');
if (clearLogBtn) {
  clearLogBtn.addEventListener('click', () => {
    const confirmed = confirm('Kya aap poora contact log clear karna chahte hain? Yeh wapis nahi ho sakega.');
    if (confirmed) {
      localStorage.removeItem('gm_contact_log');
      renderContactLog();
    }
  });
}

document.addEventListener('DOMContentLoaded', renderContactLog);