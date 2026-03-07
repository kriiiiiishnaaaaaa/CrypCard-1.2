/* ===== auth.js — CryptoCard Authentication ===== */

const CC_USERS_KEY   = 'cc_users';
const CC_SESSION_KEY = 'cryptocard_user';

/* ---- Generate a unique card number per user ---- */
function generateCardNumber(email) {
  // Deterministic 16-digit number seeded from email
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);
  // Build 16 digits: 4216 + 12 more
  const part2 = String(seed % 10000).padStart(4, '0');
  const part3 = String((seed * 31) % 10000).padStart(4, '0');
  const part4 = String((seed * 97) % 10000).padStart(4, '0');
  return '4216' + part2 + part3 + part4;
}

/* ---- Generate random CVV ---- */
function generateCVV(email) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 3) - hash) + email.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash) % 900 + 100);
}

/* ---- Seed default test account if not exists ---- */
(function seedDefaultAccount() {
  let users = [];
  try { users = JSON.parse(localStorage.getItem(CC_USERS_KEY) || '[]'); } catch(e) {}
  const exists = users.find(u => u.email === 'test@gmail.com');
  if (!exists) {
    const email = 'test@gmail.com';
    users.push({
      name:       'Test User',
      email:      email,
      password:   'Test12345',
      balance:    0,
      deposits:   [],
      cardNumber: generateCardNumber(email),
      cvv:        generateCVV(email),
      kycStatus:  'pending',
      dailyLimit: 500,
      joined:     Date.now()
    });
    localStorage.setItem(CC_USERS_KEY, JSON.stringify(users));
  }
})();

/* ---- getCurrentUser ---- */
function getCurrentUser() {
  try {
    const raw = localStorage.getItem(CC_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}
window.getCurrentUser = getCurrentUser;

/* ---- authGuard: redirect to auth.html if not logged in ---- */
function authGuard() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'auth.html';
    return false;
  }
  return true;
}
window.authGuard = authGuard;

/* ---- logout ---- */
function logout() {
  localStorage.removeItem(CC_SESSION_KEY);
  window.location.href = 'auth.html';
}
window.logout = logout;

/* ---- loginUser(email, password) → {ok, user, error} ---- */
function loginUser(email, password) {
  let users = [];
  try { users = JSON.parse(localStorage.getItem(CC_USERS_KEY) || '[]'); } catch(e) {}
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user)                      return { ok: false, error: 'No account found with this email.' };
  if (user.password !== password) return { ok: false, error: 'Incorrect password.' };
  // Save session
  localStorage.setItem(CC_SESSION_KEY, JSON.stringify(user));
  return { ok: true, user };
}
window.loginUser = loginUser;

/* ---- registerUser(name, email, password) → {ok, user, error} ---- */
function registerUser(name, email, password) {
  if (!name || !email || !password) return { ok: false, error: 'All fields are required.' };
  if (password.length < 6)          return { ok: false, error: 'Password must be at least 6 characters.' };
  let users = [];
  try { users = JSON.parse(localStorage.getItem(CC_USERS_KEY) || '[]'); } catch(e) {}
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: 'An account with this email already exists.' };
  }
  const emailClean = email.toLowerCase().trim();
  const user = {
    name:       name.trim(),
    email:      emailClean,
    password,
    balance:    0,
    deposits:   [],
    cardNumber: generateCardNumber(emailClean),
    cvv:        generateCVV(emailClean),
    kycStatus:  'pending',
    dailyLimit: 500,
    joined:     Date.now()
  };
  users.push(user);
  localStorage.setItem(CC_USERS_KEY, JSON.stringify(users));
  localStorage.setItem(CC_SESSION_KEY, JSON.stringify(user));
  return { ok: true, user };
}
window.registerUser = registerUser;

/* ---- updateCurrentUser(updates) — persists changes to session + users array ---- */
function updateCurrentUser(updates) {
  const session = getCurrentUser();
  if (!session) return;
  const updated = Object.assign({}, session, updates);
  localStorage.setItem(CC_SESSION_KEY, JSON.stringify(updated));
  // Also sync to users array
  let users = [];
  try { users = JSON.parse(localStorage.getItem(CC_USERS_KEY) || '[]'); } catch(e) {}
  const idx = users.findIndex(u => u.email === session.email);
  if (idx > -1) { users[idx] = updated; localStorage.setItem(CC_USERS_KEY, JSON.stringify(users)); }
}
window.updateCurrentUser = updateCurrentUser;

/* ---- maskCardNumber(num) ---- */
function maskCardNumber(num) {
  if (!num || num.length < 16) return '•••• •••• •••• ••••';
  return num.slice(0,4) + ' •••• •••• ' + num.slice(12);
}
window.maskCardNumber = maskCardNumber;
