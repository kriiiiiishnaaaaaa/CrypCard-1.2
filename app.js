/* ===== GLOBAL APP.JS — CryptoCard ===== */

// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// ===== HAMBURGER MENU =====
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileMenu = document.getElementById('mobileMenu');
const mobileClose = document.getElementById('mobileClose');

if (hamburgerBtn && mobileMenu) {
  hamburgerBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
}
if (mobileClose && mobileMenu) {
  mobileClose.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
  });
}

// Close mobile menu on link click
document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    if (mobileMenu) mobileMenu.classList.remove('open');
  });
});

// ===== SCROLL REVEAL (Intersection Observer) =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
  revealObserver.observe(el);
});

// ===== FAQ TOGGLE =====
function toggleFAQ(questionEl) {
  const item = questionEl.closest('.faq-item');
  const wasOpen = item.classList.contains('open');
  // Close all
  document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
  // Open clicked if it was closed
  if (!wasOpen) item.classList.add('open');
}
window.toggleFAQ = toggleFAQ;

// ===== COPY TO CLIPBOARD =====
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    const toast = document.getElementById('copyToast');
    if (toast) {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    }
  }).catch(() => {
    // Fallback
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  });
}
window.copyToClipboard = copyToClipboard;

// ===== LIVE USDC RATE SIMULATION =====
function startRateTicker() {
  const els = document.querySelectorAll('.usdc-rate-val');
  if (!els.length) return;
  let base = 1.0003;
  setInterval(() => {
    base += (Math.random() - 0.5) * 0.0001;
    base = Math.max(0.999, Math.min(1.001, base));
    els.forEach(el => el.textContent = '$' + base.toFixed(4));
  }, 2000);
}
startRateTicker();

// ===== SIDEBAR TOGGLE (Dashboard pages — mobile) =====
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.querySelector('.sidebar');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');

function openSidebar() {
  if (sidebar) sidebar.classList.add('open');
  if (sidebarBackdrop) sidebarBackdrop.classList.add('active');
}
function closeSidebar() {
  if (sidebar) sidebar.classList.remove('open');
  if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
}

if (sidebarToggle) {
  sidebarToggle.addEventListener('click', () => {
    if (sidebar && sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });
}
if (sidebarBackdrop) {
  sidebarBackdrop.addEventListener('click', closeSidebar);
}

// Close sidebar when a nav link is clicked on mobile
document.querySelectorAll('.sidebar-nav a').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth <= 1024) closeSidebar();
  });
});

// ===== CARD FLIP =====
function flipCard() {
  const container = document.getElementById('cardFlip');
  if (container) container.classList.toggle('flipped');
}
window.flipCard = flipCard;

// ===== REVEAL CVV (10 second auto-hide) =====
let cvvTimer;
function revealCVV() {
  const masked = document.getElementById('cvvMasked');
  const revealed = document.getElementById('cvvRevealed');
  const btn = document.getElementById('revealCVVBtn');
  if (!masked || !revealed) return;
  
  masked.style.display = 'none';
  revealed.style.display = 'block';
  if (btn) btn.textContent = 'Hide CVV';
  
  clearTimeout(cvvTimer);
  cvvTimer = setTimeout(() => {
    masked.style.display = 'block';
    revealed.style.display = 'none';
    if (btn) btn.textContent = 'Reveal CVV';
  }, 10000);
}
window.revealCVV = revealCVV;

// ===== FREEZE CARD TOGGLE =====
function toggleFreeze() {
  const freezeBtn = document.getElementById('freezeBtn');
  const statusBadge = document.getElementById('cardStatusBadge');
  if (!freezeBtn) return;
  
  const isFrozen = freezeBtn.dataset.frozen === 'true';
  
  if (isFrozen) {
    freezeBtn.dataset.frozen = 'false';
    freezeBtn.innerHTML = '❄️ Freeze Card';
    freezeBtn.className = 'btn btn-secondary btn-sm';
    if (statusBadge) {
      statusBadge.textContent = '● ACTIVE';
      statusBadge.className = 'badge badge-active';
    }
  } else {
    freezeBtn.dataset.frozen = 'true';
    freezeBtn.innerHTML = '🔥 Unfreeze Card';
    freezeBtn.className = 'btn btn-primary btn-sm';
    if (statusBadge) {
      statusBadge.textContent = '● FROZEN';
      statusBadge.className = 'badge badge-frozen';
    }
  }
}
window.toggleFreeze = toggleFreeze;

// ===== CARD NUMBER MASK/REVEAL =====
function toggleCardNumber() {
  const numEl = document.getElementById('dashCardNumber');
  const btn = document.getElementById('revealNumBtn');
  if (!numEl) return;
  const u = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  const cardNum = (u && u.cardNumber) ? u.cardNumber : '0000000000000000';
  const full = cardNum.replace(/(\d{4})/g, '$1 ').trim();
  const masked = cardNum.slice(0,4) + ' •••• •••• ' + cardNum.slice(12);
  if (numEl.textContent.includes('•')) {
    numEl.textContent = full;
    if (btn) btn.textContent = 'Hide';
    setTimeout(() => {
      numEl.textContent = masked;
      if (btn) btn.textContent = 'Reveal';
    }, 12000);
  } else {
    numEl.textContent = masked;
    if (btn) btn.textContent = 'Reveal';
  }
}
window.toggleCardNumber = toggleCardNumber;

// ===== RANGE SLIDER DISPLAY =====
document.querySelectorAll('input[type="range"]').forEach(slider => {
  const display = document.getElementById(slider.id + '-display');
  if (display) {
    display.textContent = '$' + Number(slider.value).toLocaleString();
    slider.addEventListener('input', () => {
      display.textContent = '$' + Number(slider.value).toLocaleString();
    });
  }
});

// ===== LIVE BALANCE ANIMATION =====
function animateBalance() {
  const balEl = document.getElementById('liveBalance');
  if (!balEl) return;
  
  let balance = 1247.83;
  setInterval(() => {
    // Simulate tiny fluctuation
    const change = (Math.random() - 0.5) * 0.01;
    balance = Math.max(0, balance + change);
    balEl.textContent = balance.toFixed(2);
  }, 3000);
}
animateBalance();

// ===== NETWORK TABS (Deposit Page) =====
function selectNetwork(network) {
  document.querySelectorAll('.network-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.network === network);
  });
  document.querySelectorAll('.network-address').forEach(addr => {
    addr.classList.toggle('active', addr.dataset.network === network);
  });
}
window.selectNetwork = selectNetwork;

// ===== KYC STEPS =====
let currentKycStep = 1;

function goToKycStep(step) {
  document.querySelectorAll('.kyc-panel').forEach((panel, i) => {
    panel.style.display = (i + 1 === step) ? 'block' : 'none';
  });
  document.querySelectorAll('.kyc-step').forEach((dot, i) => {
    if (i + 1 < step) {
      dot.classList.add('completed');
      dot.classList.remove('active');
    } else if (i + 1 === step) {
      dot.classList.add('active');
      dot.classList.remove('completed');
    } else {
      dot.classList.remove('completed', 'active');
    }
  });
  currentKycStep = step;
}
window.goToKycStep = goToKycStep;

function nextKycStep() {
  if (currentKycStep < 5) goToKycStep(currentKycStep + 1);
}
window.nextKycStep = nextKycStep;

// ===== DONUT CHART (Canvas) =====
function drawDonutChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const total = data.reduce((a, b) => a + b.value, 0);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = Math.min(cx, cy) - 20;
  const innerR = r * 0.62;
  let startAngle = -Math.PI / 2;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  data.forEach(item => {
    const sliceAngle = (item.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();
    startAngle += sliceAngle;
  });
  
  // Inner circle (donut hole)
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = '#0D1117';
  ctx.fill();
  
  // Center text
  ctx.fillStyle = '#F9FAFB';
  ctx.font = 'bold 16px Space Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$' + total.toLocaleString(), cx, cy - 8);
  ctx.font = '12px Inter, sans-serif';
  ctx.fillStyle = '#6B7280';
  ctx.fillText('Spent', cx, cy + 12);
}
window.drawDonutChart = drawDonutChart;

// ===== BAR CHART (Canvas) =====
function drawBarChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const max = Math.max(...data.map(d => d.value));
  const barW = (w - 60) / data.length - 10;
  const padLeft = 40;
  const padBot = 30;
  
  ctx.clearRect(0, 0, w, h);
  
  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padBot + ((h - padBot - 20) / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  
  // Bars
  data.forEach((item, i) => {
    const barH = ((item.value / max) * (h - padBot - 20));
    const x = padLeft + i * (barW + 10);
    const y = h - padBot - barH;
    
    // Gradient
    const grad = ctx.createLinearGradient(0, y, 0, h - padBot);
    grad.addColorStop(0, '#6366F1');
    grad.addColorStop(1, 'rgba(99,102,241,0.2)');
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
    ctx.fill();
    
    // Label
    ctx.fillStyle = '#4B5563';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.label, x + barW / 2, h - 8);
  });
}
window.drawBarChart = drawBarChart;

// ===== SETTINGS TABS =====
function activateSettingsTab(tabId) {
  document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabId);
  });
  document.querySelectorAll('.settings-panel').forEach(panel => {
    panel.style.display = panel.id === tabId ? 'block' : 'none';
  });
}
window.activateSettingsTab = activateSettingsTab;

// ===== MODAL =====
function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.add('open');
}
function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.remove('open');
}
window.openModal = openModal;
window.closeModal = closeModal;

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Re-observe any dynamically added elements
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
    revealObserver.observe(el);
  });
});
