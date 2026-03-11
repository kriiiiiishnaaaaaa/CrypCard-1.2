/* ===== auth.js — CryptoCard Authentication ===== */

const CC_USERS_KEY   = 'cc_users';
const CC_SESSION_KEY = 'cryptocard_user';

/* ---- Generate a unique card number per user ---- */
/* ---- Virtual card pool — shuffled and assigned to users ---- */
const CARD_POOL = [
  { number: '4622943127011022', cvv: '341' },
  { number: '4622943127011030', cvv: '287' },
  { number: '4622943127011048', cvv: '193' },
  { number: '4622943127011055', cvv: '462' },
  { number: '4622943127011063', cvv: '758' },
  { number: '4622943127011071', cvv: '524' },
  { number: '4622943127011089', cvv: '316' },
  { number: '4622943127010990', cvv: '847' },
  { number: '4622943127011006', cvv: '139' },
  { number: '4622943127011014', cvv: '673' },
];

function getNextCard() {
  // Get already assigned cards from storage
  let users = [];
  try { users = JSON.parse(localStorage.getItem(CC_USERS_KEY) || '[]'); } catch(e) {}
  const usedNumbers = users.map(u => u.cardNumber).filter(Boolean);

  // Find unassigned card — shuffle pool first using current timestamp seed
  const shuffled = [...CARD_POOL].sort(() => {
    const seed = usedNumbers.length * 1337 + 42;
    return (Math.sin(seed) * 10000) % 1 - 0.5;
  });

  const available = shuffled.find(c => !usedNumbers.includes(c.number));
  // If all 10 used, cycle back from beginning (re-use from shuffled pool)
  return available || shuffled[usedNumbers.length % CARD_POOL.length];
}

function generateCardNumber(email) {
  // Legacy - not used for new users, kept for compatibility
  const card = getNextCard();
  return card.number;
}

function generateCVV(email) {
  // Legacy - not used for new users, kept for compatibility
  const card = getNextCard();
  return card.cvv;
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
      cardNumber: CARD_POOL[0].number,
      cvv:        CARD_POOL[0].cvv,
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

/* ---- pinGuard: check PIN is entered for this session ---- */
function pinGuard() {
  const user = getCurrentUser();
  if (!user) { window.location.href = 'auth.html'; return false; }
  // If PIN is set and session not unlocked yet, redirect to pin page
  if (user.pin && sessionStorage.getItem('cc_pin_ok') !== '1') {
    const current = encodeURIComponent(location.pathname.split('/').pop() || 'dashboard.html');
    window.location.href = 'pin.html?r=' + current;
    return false;
  }
  return true;
}
window.pinGuard = pinGuard;


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
  const assignedCard = getNextCard();
  const user = {
    name:       name.trim(),
    email:      emailClean,
    password,
    balance:    0,
    deposits:   [],
    cardNumber: assignedCard.number,
    cvv:        assignedCard.cvv,
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
