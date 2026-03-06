/* ===== AUTH.JS — CryptoCard Authentication Module ===== */

// ─── WORD LIST for 12-word recovery phrase ───
const RECOVERY_WORDS = [
  'abandon','ability','able','about','above','absent','absorb','abstract',
  'access','accident','account','achieve','acid','acoustic','acquire','across',
  'action','actor','adapt','address','adjust','adult','advance','advice',
  'afford','agent','agree','airport','album','alien','allow','alley',
  'alpha','alter','amateur','anchor','ancient','anger','animal','ankle',
  'annual','answer','arctic','arena','argue','armor','army','arrange',
  'artist','asset','assist','atom','attack','author','aware','awesome',
  'balance','bamboo','banner','barrel','basic','battle','beach','beauty',
  'become','begin','below','bench','best','bird','blame','blast',
  'blend','blind','block','blood','bloom','blue','blur','boil',
  'bomb','bone','bonus','boost','border','brave','bridge','brief',
  'bright','bring','bronze','brown','bulb','bundle','butter','cable',
  'canvas','carbon','card','carry','castle','cattle','cause','chain',
  'chalk','chaos','charge','charm','check','circle','claim','class',
  'clean','clever','climb','cloud','cluster','coach','coast','coil',
  'color','column','comfort','common','coral','corner','cover','craft',
  'crane','credit','cross','crowd','crystal','curve','dance','danger',
  'dawn','debate','decade','decide','delay','deliver','desert','detail',
  'develop','diamond','direct','discover','domain','double','draft','dragon',
  'drama','dream','drive','drop','dune','eagle','earth','echo',
  'edge','effort','elect','elite','emerge','employ','enable','engine',
  'enjoy','enrich','enter','equal','escape','evolve','exact','exceed',
  'expand','expect','expert','explain','expose','extra','fabric','face',
  'faith','fancy','fast','fiber','field','figure','filter','final',
  'finger','flame','flash','flight','float','floor','flower','fluid',
  'focus','force','forest','forge','fossil','frame','fresh','frost',
  'frozen','fuel','future','galaxy','garden','gift','glare','glide',
  'globe','glory','grace','grain','gravity','guard','guide','harbor',
  'harvest','hawk','heart','hero','hollow','honor','horizon','hover',
  'humble','hunt','ideal','image','impact','index','inner','input',
  'island','ivory','jungle','kernel','knife','lance','laser','launch',
  'layer','learn','legacy','level','light','limit','linen','logic',
  'lunar','magic','major','manor','maple','master','matrix','medal',
];

// ─── STORAGE HELPERS ───
function getUsers() {
  return JSON.parse(localStorage.getItem('cc_users') || '[]');
}
function saveUsers(users) {
  localStorage.setItem('cc_users', JSON.stringify(users));
}
function getCurrentUserId() {
  return localStorage.getItem('cc_current_user');
}
function setCurrentUserId(id) {
  localStorage.setItem('cc_current_user', id);
}
function getCurrentUser() {
  const id = getCurrentUserId();
  if (!id) return null;
  return getUsers().find(u => u.id === id) || null;
}
function updateCurrentUser(updates) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === getCurrentUserId());
  if (idx === -1) return;
  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);
}

// ─── SESSION (PIN verified this tab session) ───
function isPinVerified() {
  const pinUserId = sessionStorage.getItem('cc_pin_user');
  return pinUserId && pinUserId === getCurrentUserId();
}
function setPinVerified() {
  sessionStorage.setItem('cc_pin_user', getCurrentUserId());
}
function clearSession() {
  sessionStorage.removeItem('cc_pin_user');
}

// ─── AUTH GUARD ─── call at top of every protected page
function authGuard() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'auth.html';
    return false;
  }
  if (!isPinVerified()) {
    window.location.href = 'auth.html?mode=pin';
    return false;
  }
  return true;
}

// ─── SIMPLE HASH (non-crypto, for demo PIN/password storage) ───
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

// ─── RECOVERY PHRASE GENERATOR ───
function generateRecoveryPhrase() {
  const shuffled = [...RECOVERY_WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 12);
}

// ─── GENERATE CARD NUMBER ───
function generateCardNumber() {
  let num = '4216';
  for (let i = 0; i < 12; i++) {
    num += Math.floor(Math.random() * 10);
  }
  return num;
}

// ─── REGISTER USER ───
function registerUser(name, email, password, pin, recoveryPhrase) {
  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: 'An account with this email already exists.' };
  }
  const id = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const cardNum = generateCardNumber();
  const user = {
    id,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: simpleHash(password),
    pinHash: simpleHash(pin),
    recoveryPhrase,
    cardNumber: cardNum,
    balance: 0,
    totalDeposited: 0,
    totalSpent: 0,
    plan: 'free',
    createdAt: new Date().toISOString()
  };
  users.push(user);
  saveUsers(users);
  setCurrentUserId(id);
  setPinVerified();
  return { success: true, user };
}

// ─── LOGIN USER ───
function loginUser(email, password) {
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    return { success: false, error: 'No account found with this email address.' };
  }
  if (user.passwordHash !== simpleHash(password)) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }
  setCurrentUserId(user.id);
  return { success: true, user, needsPin: true };
}

// ─── VERIFY PIN ───
function verifyPin(pin) {
  const user = getCurrentUser();
  if (!user) return false;
  if (user.pinHash === simpleHash(pin)) {
    setPinVerified();
    return true;
  }
  return false;
}

// ─── LOGOUT ───
function logout() {
  clearSession();
  localStorage.removeItem('cc_current_user');
  window.location.href = 'auth.html';
}

// ─── FORMAT CARD NUMBER ───
function formatCardNumber(num) {
  return num.replace(/(\d{4})/g, '$1 ').trim();
}
function maskCardNumber(num) {
  return num.slice(0,4) + ' •••• •••• ' + num.slice(12);
}

// Expose globally
window.authGuard = authGuard;
window.getCurrentUser = getCurrentUser;
window.updateCurrentUser = updateCurrentUser;
window.loginUser = loginUser;
window.registerUser = registerUser;
window.verifyPin = verifyPin;
window.logout = logout;
window.generateRecoveryPhrase = generateRecoveryPhrase;
window.simpleHash = simpleHash;
window.formatCardNumber = formatCardNumber;
window.maskCardNumber = maskCardNumber;
