// ==================== AUTH SYSTEM (Firebase-backed) ====================
const ADMIN_SECRET_CODE = 'araria2024';  // Change this secret code
const STORAGE_SESSION_KEY = 'electroshop_session';

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'electroshop_salt_v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Session is still browser-local (per tab)
function getSession() {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_SESSION_KEY)); } catch { return null; }
}
function saveSession(user) { sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user)); }
function clearSession() { sessionStorage.removeItem(STORAGE_SESSION_KEY); }

// Firebase user operations
async function getUsers() {
  try {
    const snap = await dbRef.users.once('value');
    return snap.val() || {};
  } catch(e) { console.warn('Firebase read failed:', e); return {}; }
}

async function saveUser(username, userData) {
  try { await dbRef.users.child(username).set(userData); }
  catch(e) { console.warn('Firebase write failed:', e); }
}

// Initialize default admin if no users exist
async function initDefaultAdmin() {
  const users = await getUsers();
  if (!Object.keys(users).length) {
    const hash = await hashPassword('admin123');
    await saveUser('admin', { name: 'Administrator', role: 'admin', passHash: hash, createdAt: new Date().toISOString() });
  }
}

function switchAuth(mode) {
  const btns = document.querySelectorAll('.auth-toggle button');
  btns.forEach(b => b.classList.remove('active'));
  if (mode === 'login') {
    btns[0].classList.add('active');
    document.getElementById('login-form').style.display = '';
    document.getElementById('signup-form').style.display = 'none';
  } else {
    btns[1].classList.add('active');
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = '';
  }
  document.getElementById('login-msg').className = 'auth-msg';
  document.getElementById('signup-msg').className = 'auth-msg';
}

// Show/hide admin code field
document.addEventListener('DOMContentLoaded', () => {
  const roleSelect = document.getElementById('signup-role');
  if (roleSelect) {
    roleSelect.addEventListener('change', function() {
      document.getElementById('admin-code-field').style.display = this.value === 'admin' ? '' : 'none';
    });
  }
  // Allow Enter key to submit
  document.getElementById('login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('signup-pass2').addEventListener('keydown', e => { if (e.key === 'Enter') doSignup(); });
});

async function doLogin() {
  const msgEl = document.getElementById('login-msg');
  const username = document.getElementById('login-user').value.trim().toLowerCase();
  const password = document.getElementById('login-pass').value;
  if (!username || !password) { msgEl.className = 'auth-msg err'; msgEl.textContent = 'Please enter both username and password.'; return; }
  msgEl.className = 'auth-msg'; msgEl.textContent = '';
  try {
    const users = await getUsers();
    const user = users[username];
    if (!user) { msgEl.className = 'auth-msg err'; msgEl.textContent = 'Account not found. Please sign up first.'; return; }
    const hash = await hashPassword(password);
    if (hash !== user.passHash) { msgEl.className = 'auth-msg err'; msgEl.textContent = 'Incorrect password. Please try again.'; return; }
    saveSession({ username, name: user.name, role: user.role });
    enterApp();
  } catch(e) {
    msgEl.className = 'auth-msg err'; msgEl.textContent = 'Connection error. Please check your internet.';
  }
}

async function doSignup() {
  const msgEl = document.getElementById('signup-msg');
  const name = document.getElementById('signup-name').value.trim();
  const username = document.getElementById('signup-user').value.trim().toLowerCase();
  const password = document.getElementById('signup-pass').value;
  const password2 = document.getElementById('signup-pass2').value;
  const role = document.getElementById('signup-role').value;
  if (!name || !username || !password) { msgEl.className = 'auth-msg err'; msgEl.textContent = 'Please fill in all fields.'; return; }
  if (username.length < 3) { msgEl.className = 'auth-msg err'; msgEl.textContent = 'Username must be at least 3 characters.'; return; }
  if (!/^[a-z0-9_]+$/.test(username)) { msgEl.className = 'auth-msg err'; msgEl.textContent = 'Username can only contain lowercase letters, numbers, and underscores.'; return; }
  if (password.length < 6) { msgEl.className = 'auth-msg err'; msgEl.textContent = 'Password must be at least 6 characters.'; return; }
  if (password !== password2) { msgEl.className = 'auth-msg err'; msgEl.textContent = 'Passwords do not match.'; return; }
  if (role === 'admin') {
    const code = document.getElementById('signup-admin-code').value;
    if (code !== ADMIN_SECRET_CODE) { msgEl.className = 'auth-msg err'; msgEl.textContent = 'Invalid admin authorization code. Contact the owner.'; return; }
  }
  msgEl.className = 'auth-msg'; msgEl.textContent = '';
  try {
    const users = await getUsers();
    if (users[username]) { msgEl.className = 'auth-msg err'; msgEl.textContent = 'Username already taken. Choose a different one.'; return; }
    const hash = await hashPassword(password);
    await saveUser(username, { name, role, passHash: hash, createdAt: new Date().toISOString() });
    msgEl.className = 'auth-msg ok'; msgEl.textContent = 'Account created successfully! You can now sign in.';
    document.getElementById('signup-name').value = '';
    document.getElementById('signup-user').value = '';
    document.getElementById('signup-pass').value = '';
    document.getElementById('signup-pass2').value = '';
    setTimeout(() => switchAuth('login'), 1500);
  } catch(e) {
    msgEl.className = 'auth-msg err'; msgEl.textContent = 'Connection error. Please check your internet.';
  }
}

function doLogout() {
  clearSession();
  document.getElementById('app-shell').classList.remove('visible');
  document.getElementById('auth-overlay').style.display = 'flex';
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-msg').className = 'auth-msg';
}

let currentUser = null;

function enterApp() {
  currentUser = getSession();
  if (!currentUser) return;
  document.getElementById('auth-overlay').style.display = 'none';
  document.getElementById('app-shell').classList.add('visible');
  document.getElementById('topbar-info').textContent = currentUser.name;
  const badge = document.getElementById('topbar-role');
  badge.textContent = currentUser.role;
  badge.className = 'user-badge ' + currentUser.role;
  applyRoleAccess();
  loadAppData().then(() => {
    renderDash();
    startRealtimeSync();
  });
}

function applyRoleAccess() {
  const tabs = document.querySelectorAll('.tab');
  const isAdmin = currentUser && currentUser.role === 'admin';
  tabs.forEach(tab => {
    const text = tab.textContent.trim();
    if (!isAdmin && (text === 'Inventory' || text === 'Daily Reports' || text === 'Admin' || text === 'Staff' || text === 'Performance')) {
      tab.classList.add('hidden-tab');
    } else {
      tab.classList.remove('hidden-tab');
    }
  });
  if (!isAdmin) {
    const activeSection = document.querySelector('.section.active');
    if (activeSection && (activeSection.id === 'tab-inv' || activeSection.id === 'tab-report' || activeSection.id === 'tab-admin' || activeSection.id === 'tab-staff' || activeSection.id === 'tab-perf')) {
      showTab('dash', tabs[0]);
    }
  }
}

// ==================== DATA PERSISTENCE (Firebase) ====================
function saveAppData() {
  try {
    dbRef.products.set(prods);
    dbRef.sales.set(sales.map(s => ({...s, date: s.date instanceof Date ? s.date.toISOString() : s.date})));
    dbRef.adjLog.set(adjLog.map(l => ({...l, time: l.time instanceof Date ? l.time.toISOString() : l.time})));
    dbRef.counters.set({ nextId, nextSaleId, nextGstBillId });
  } catch(e) { console.warn('Firebase save failed:', e); }
}

async function loadAppData() {
  try {
    const [prodsSnap, salesSnap, adjSnap, ctrSnap] = await Promise.all([
      dbRef.products.once('value'),
      dbRef.sales.once('value'),
      dbRef.adjLog.once('value'),
      dbRef.counters.once('value')
    ]);
    const savedProds = prodsSnap.val();
    if (savedProds && Array.isArray(savedProds) && savedProds.length) prods = savedProds;
    const savedSales = salesSnap.val();
    if (savedSales) {
      sales = Array.isArray(savedSales) ? savedSales : Object.values(savedSales);
      sales.forEach(s => s.date = new Date(s.date));
    }
    const savedAdj = adjSnap.val();
    if (savedAdj) {
      adjLog = Array.isArray(savedAdj) ? savedAdj : Object.values(savedAdj);
      adjLog.forEach(l => l.time = new Date(l.time));
    }
    const savedCounters = ctrSnap.val();
    if (savedCounters) { nextId = savedCounters.nextId; nextSaleId = savedCounters.nextSaleId; if(savedCounters.nextGstBillId) nextGstBillId = savedCounters.nextGstBillId; }
  } catch(e) { console.warn('Firebase load failed, using defaults:', e); }
}

// Listen for real-time updates from other devices
function startRealtimeSync() {
  dbRef.products.on('value', (snap) => {
    const val = snap.val();
    if (val && Array.isArray(val)) {
      prods = val;
      // Re-render current view if applicable
      const active = document.querySelector('.section.active');
      if (active) {
        if (active.id === 'tab-inv') renderInv();
        if (active.id === 'tab-dash') renderDash();
        if (active.id === 'tab-admin') { renderAdjLog(); renderLowStockList(); }
      }
    }
  });

  dbRef.sales.on('value', (snap) => {
    const val = snap.val();
    if (val) {
      sales = Array.isArray(val) ? val : Object.values(val);
      sales.forEach(s => s.date = new Date(s.date));
      const active = document.querySelector('.section.active');
      if (active) {
        if (active.id === 'tab-hist') renderHist();
        if (active.id === 'tab-dash') renderDash();
      }
    }
  });

  dbRef.adjLog.on('value', (snap) => {
    const val = snap.val();
    if (val) {
      adjLog = Array.isArray(val) ? val : Object.values(val);
      adjLog.forEach(l => l.time = new Date(l.time));
      const active = document.querySelector('.section.active');
      if (active && active.id === 'tab-admin') renderAdjLog();
    }
  });

  dbRef.counters.on('value', (snap) => {
    const val = snap.val();
    if (val) { nextId = val.nextId; nextSaleId = val.nextSaleId; if(val.nextGstBillId) nextGstBillId = val.nextGstBillId; }
  });
}

function autoSave() { try { saveAppData(); } catch(e) { console.warn('Auto-save failed:', e); } }
