// =========================================================
// GM REAL ESTATE - LOGIN / SIGNUP LOGIC (login.html)
// Django backend se connected hai. Server chalana zaroori hai
// (python manage.py runserver), warna fetch() calls fail hongi.
// =========================================================

const API_BASE_URL = 'https://gmrealestate.onrender.com'

async function apiRequest(path, method, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  const rawText = await response.text();
  let data = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch (parseErr) {
    if (!response.ok) {
      throw new Error(`Server error (status ${response.status}). Django terminal check karein.`);
    }
  }

  if (!response.ok) {
    const firstError = Object.values(data)[0];
    const message = Array.isArray(firstError) ? firstError[0] : (data.detail || `Server error (status ${response.status}).`);
    throw new Error(message);
  }

  return data;
}

function saveSession(token, profile) {
  localStorage.setItem('gm_auth_token', token);
  localStorage.setItem('gm_current_user', JSON.stringify({
    name: profile.name,
    email: profile.email,
    role: profile.role,
  }));
}

// =========================================================
// PASSWORD SHOW/HIDE TOGGLE
// =========================================================
document.querySelectorAll('.toggle-password-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.textContent = input.type === 'password' ? '👁️' : '🙈';
  });
});

// =========================================================
// PASSWORD STRENGTH METER (live)
// =========================================================
function checkPasswordRules(password) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=[\]/\\;'`~]/.test(password),
  };
}

function setupPasswordStrengthMeter(inputId, meterId, labelId, rulesListId) {
  const input = document.getElementById(inputId);
  const meterBar = document.querySelector(`#${meterId} .password-strength-bar`);
  const label = document.getElementById(labelId);
  const rulesList = document.getElementById(rulesListId);
  if (!input) return;

  input.addEventListener('input', () => {
    const rules = checkPasswordRules(input.value);
    const metCount = Object.values(rules).filter(Boolean).length;

    if (rulesList) {
      rulesList.querySelectorAll('li').forEach((li) => {
        const ruleKey = li.dataset.rule;
        li.classList.toggle('rule-met', !!rules[ruleKey]);
      });
    }

    if (!meterBar || !label) return;

    const percent = (metCount / 5) * 100;
    meterBar.style.width = `${percent}%`;

    if (input.value.length === 0) {
      meterBar.style.width = '0%';
      label.textContent = '';
    } else if (metCount <= 2) {
      meterBar.style.background = '#dc2626';
      label.textContent = 'Weak';
      label.style.color = '#dc2626';
    } else if (metCount <= 4) {
      meterBar.style.background = '#f59e0b';
      label.textContent = 'Fair';
      label.style.color = '#f59e0b';
    } else {
      meterBar.style.background = '#10b981';
      label.textContent = 'Strong';
      label.style.color = '#10b981';
    }
  });
}

setupPasswordStrengthMeter('userPassword', 'userPasswordStrengthMeter', 'userPasswordStrengthLabel', 'userPasswordRules');
setupPasswordStrengthMeter('agentPassword', 'agentPasswordStrengthMeter', 'agentPasswordStrengthLabel', 'agentPasswordRules');
setupPasswordStrengthMeter('forgotNewPassword', 'forgotPasswordStrengthMeter', 'forgotPasswordStrengthLabel', 'forgotPasswordRules');

function isPasswordStrong(password) {
  const rules = checkPasswordRules(password);
  return Object.values(rules).every(Boolean);
}

// =========================================================
// 6-BOX OTP INPUT (auto-focus next, backspace to previous, paste support)
// =========================================================
function setupOtpBoxes(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const boxes = Array.from(container.querySelectorAll('.otp-box'));

  boxes.forEach((box, index) => {
    box.addEventListener('input', () => {
      box.value = box.value.replace(/[^0-9]/g, '').slice(0, 1);
      if (box.value && index < boxes.length - 1) {
        boxes[index + 1].focus();
      }
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && index > 0) {
        boxes[index - 1].focus();
      }
    });

    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
      pasted.split('').slice(0, boxes.length).forEach((char, i) => {
        if (boxes[i]) boxes[i].value = char;
      });
      const lastFilled = Math.min(pasted.length, boxes.length) - 1;
      if (lastFilled >= 0) boxes[lastFilled].focus();
    });
  });
}

function getOtpValue(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return '';
  return Array.from(container.querySelectorAll('.otp-box')).map((b) => b.value).join('');
}

function clearOtpBoxes(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.otp-box').forEach((b) => { b.value = ''; });
}

setupOtpBoxes('signupOtpBoxes');
setupOtpBoxes('forgotOtpBoxes');

// =========================================================
// RESEND COUNTDOWN (60 seconds)
// =========================================================
function startResendCountdown(countdownElId, linkElId, seconds = 60) {
  const countdownEl = document.getElementById(countdownElId);
  const linkEl = document.getElementById(linkElId);
  if (!countdownEl || !linkEl) return;

  let remaining = seconds;
  countdownEl.style.display = 'inline';
  linkEl.style.display = 'none';

  const timer = setInterval(() => {
    remaining -= 1;
    countdownEl.textContent = `Dobara code ${remaining}s mein mangwa sakte hain`;

    if (remaining <= 0) {
      clearInterval(timer);
      countdownEl.style.display = 'none';
      linkEl.style.display = 'inline';
    }
  }, 1000);
}

// =========================================================
// TAB SWITCHING (Login / Sign Up / Forgot Password)
// =========================================================
const loginTabBtn = document.getElementById('loginTabBtn');
const signupTabBtn = document.getElementById('signupTabBtn');
const loginForm = document.getElementById('loginForm');
const forgotEmailForm = document.getElementById('forgotEmailForm');
const forgotResetForm = document.getElementById('forgotResetForm');
const roleSelection = document.getElementById('roleSelection');
const userSignupForm = document.getElementById('userSignupForm');
const agentSignupForm = document.getElementById('agentSignupForm');
const signupVerifyForm = document.getElementById('signupVerifyForm');

function hideAllForms() {
  [loginForm, forgotEmailForm, forgotResetForm, roleSelection, userSignupForm, agentSignupForm, signupVerifyForm]
    .forEach((el) => { if (el) el.style.display = 'none'; });
}

function showLoginTab() {
  loginTabBtn.classList.add('active-tab');
  signupTabBtn.classList.remove('active-tab');
  hideAllForms();
  loginForm.style.display = 'flex';
}

function showSignupTab() {
  signupTabBtn.classList.add('active-tab');
  loginTabBtn.classList.remove('active-tab');
  hideAllForms();
  roleSelection.style.display = 'flex';
}

loginTabBtn.addEventListener('click', showLoginTab);
signupTabBtn.addEventListener('click', showSignupTab);

document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
  e.preventDefault();
  hideAllForms();
  forgotEmailForm.style.display = 'flex';
});

document.querySelectorAll('[data-back-to-login]').forEach((btn) => btn.addEventListener('click', showLoginTab));

// ===================== ROLE SELECTION =====================
document.getElementById('chooseUserRole').addEventListener('click', () => {
  roleSelection.style.display = 'none';
  userSignupForm.style.display = 'flex';
});

document.getElementById('chooseAgentRole').addEventListener('click', () => {
  roleSelection.style.display = 'none';
  agentSignupForm.style.display = 'flex';
});

document.querySelectorAll('[data-back]').forEach((btn) => {
  btn.addEventListener('click', () => {
    userSignupForm.style.display = 'none';
    agentSignupForm.style.display = 'none';
    roleSelection.style.display = 'flex';
  });
});

// =========================================================
// LOGIN
// =========================================================
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = '';

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const data = await apiRequest('/accounts/login/', 'POST', { email, password });
    saveSession(data.token, data.profile);
    window.location.href = 'index.html';
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

// =========================================================
// REGISTRATION (User & Agent) -> switches to shared OTP verify screen
// =========================================================
let pendingVerifyEmail = null; // jis email ka OTP verify hona baaki hai

function goToSignupVerify(email) {
  pendingVerifyEmail = email;
  hideAllForms();
  document.getElementById('signupEmailDisplay').textContent = email;
  clearOtpBoxes('signupOtpBoxes');
  document.getElementById('signupVerifyError').textContent = '';
  document.getElementById('signupVerifySuccess').textContent = '';
  signupVerifyForm.style.display = 'flex';
  startResendCountdown('signupResendCountdown', 'signupResendLink');
}

userSignupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('userSignupError');
  errorEl.textContent = '';

  const password = document.getElementById('userPassword').value;
  const confirmPassword = document.getElementById('userConfirmPassword').value;

  if (!isPasswordStrong(password)) {
    errorEl.textContent = 'Password kamzor hai -- upar diye gaye sab rules poore karein.';
    return;
  }
  if (password !== confirmPassword) {
    errorEl.textContent = 'Password aur Confirm Password match nahi kar rahe.';
    return;
  }

  const email = document.getElementById('userEmail').value.trim();
  const payload = {
    name: document.getElementById('userName').value.trim(),
    email,
    phone: document.getElementById('userPhone').value.trim(),
    city: document.getElementById('userCity').value,
    password,
    password2: confirmPassword,
  };

  try {
    await apiRequest('/accounts/register/user/', 'POST', payload);
    goToSignupVerify(email);
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

agentSignupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('agentSignupError');
  errorEl.textContent = '';

  const password = document.getElementById('agentPassword').value;
  const confirmPassword = document.getElementById('agentConfirmPassword').value;

  if (!isPasswordStrong(password)) {
    errorEl.textContent = 'Password kamzor hai -- upar diye gaye sab rules poore karein.';
    return;
  }
  if (password !== confirmPassword) {
    errorEl.textContent = 'Password aur Confirm Password match nahi kar rahe.';
    return;
  }

  const email = document.getElementById('agentEmail').value.trim();
  const payload = {
    name: document.getElementById('agentName').value.trim(),
    agency: document.getElementById('agentAgency').value.trim(),
    email,
    phone: document.getElementById('agentPhone').value.trim(),
    cnic: document.getElementById('agentCnic').value.trim(),
    town: document.getElementById('agentTown').value,
    experience: document.getElementById('agentExperience').value || null,
    password,
    password2: confirmPassword,
  };

  try {
    await apiRequest('/accounts/register/agent/', 'POST', payload);
    goToSignupVerify(email);
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

// =========================================================
// SIGNUP: VERIFY OTP -> activate account -> redirect to Login
// =========================================================
document.getElementById('signupVerifyBtn').addEventListener('click', async () => {
  const errorEl = document.getElementById('signupVerifyError');
  const successEl = document.getElementById('signupVerifySuccess');
  errorEl.textContent = '';
  successEl.textContent = '';

  const otpCode = getOtpValue('signupOtpBoxes');
  if (otpCode.length !== 6) {
    errorEl.textContent = 'Baraye meharbani poora 6-digit code daalein.';
    return;
  }

  try {
    await apiRequest('/accounts/verify-otp/', 'POST', { email: pendingVerifyEmail, otp_code: otpCode });
    successEl.textContent = 'Account verify ho gaya! Login page par ja rahe hain...';
    setTimeout(() => {
      showLoginTab();
      document.getElementById('loginEmail').value = pendingVerifyEmail;
    }, 1200);
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

document.getElementById('signupResendLink').addEventListener('click', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('signupVerifyError');
  errorEl.textContent = '';

  try {
    await apiRequest('/accounts/resend-otp/', 'POST', { email: pendingVerifyEmail, purpose: 'signup' });
    clearOtpBoxes('signupOtpBoxes');
    startResendCountdown('signupResendCountdown', 'signupResendLink');
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

// =========================================================
// FORGOT PASSWORD
// =========================================================
let pendingResetEmail = null;

document.getElementById('forgotSendCodeBtn').addEventListener('click', async () => {
  const errorEl = document.getElementById('forgotEmailError');
  errorEl.textContent = '';

  const email = document.getElementById('forgotEmail').value.trim();
  if (!email) {
    errorEl.textContent = 'Baraye meharbani email daalein.';
    return;
  }

  try {
    await apiRequest('/accounts/resend-otp/', 'POST', { email, purpose: 'reset' });
    pendingResetEmail = email;

    hideAllForms();
    document.getElementById('forgotEmailDisplay').textContent = email;
    clearOtpBoxes('forgotOtpBoxes');
    document.getElementById('forgotResetError').textContent = '';
    document.getElementById('forgotResetSuccess').textContent = '';
    forgotResetForm.style.display = 'flex';
    startResendCountdown('forgotResendCountdown', 'forgotResendLink');
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

document.getElementById('forgotResendLink').addEventListener('click', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('forgotResetError');
  errorEl.textContent = '';

  try {
    await apiRequest('/accounts/resend-otp/', 'POST', { email: pendingResetEmail, purpose: 'reset' });
    clearOtpBoxes('forgotOtpBoxes');
    startResendCountdown('forgotResendCountdown', 'forgotResendLink');
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

document.getElementById('forgotResetBtn').addEventListener('click', async () => {
  const errorEl = document.getElementById('forgotResetError');
  const successEl = document.getElementById('forgotResetSuccess');
  errorEl.textContent = '';
  successEl.textContent = '';

  const otpCode = getOtpValue('forgotOtpBoxes');
  const newPassword = document.getElementById('forgotNewPassword').value;
  const confirmPassword = document.getElementById('forgotConfirmPassword').value;

  if (otpCode.length !== 6) {
    errorEl.textContent = 'Baraye meharbani poora 6-digit code daalein.';
    return;
  }
  if (!isPasswordStrong(newPassword)) {
    errorEl.textContent = 'Password kamzor hai -- upar diye gaye sab rules poore karein.';
    return;
  }
  if (newPassword !== confirmPassword) {
    errorEl.textContent = 'Naya password aur Confirm Password match nahi kar rahe.';
    return;
  }

  try {
    await apiRequest('/accounts/reset-password/', 'POST', {
      email: pendingResetEmail,
      otp_code: otpCode,
      new_password: newPassword,
      new_password2: confirmPassword,
    });

    successEl.textContent = 'Password change ho gaya! Login page par ja rahe hain...';
    setTimeout(() => {
      showLoginTab();
      document.getElementById('loginEmail').value = pendingResetEmail;
    }, 1200);
  } catch (err) {
    errorEl.textContent = err.message;
  }
});
