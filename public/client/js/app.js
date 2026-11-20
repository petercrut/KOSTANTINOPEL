import { ApiClient } from './api.js';
import {
  esc, highlightJson, icon, initials, label, toast,
} from './ui.js';

import dashboardView from './views/dashboard.js';
import propertiesView from './views/properties.js';
import roomsView from './views/rooms.js';
import tenantsView from './views/tenants.js';
import bookingsView from './views/bookings.js';
import invoicesView from './views/invoices.js';
import requestsView from './views/requests.js';
import announcementsView from './views/announcements.js';
import explorerView from './views/explorer.js';

const api = new ApiClient();

const THEME_KEY = 'kostantinopel.client.theme';

const ROUTES = {
  dashboard: { view: dashboardView, group: 'Ringkasan', nav: 'Dashboard', icon: 'grid' },
  properties: { view: propertiesView, group: 'Manajemen', nav: 'Properti', icon: 'building' },
  rooms: { view: roomsView, group: 'Manajemen', nav: 'Kamar', icon: 'bed' },
  tenants: { view: tenantsView, group: 'Manajemen', nav: 'Penyewa', icon: 'users' },
  bookings: { view: bookingsView, group: 'Operasional', nav: 'Booking', icon: 'calendar' },
  invoices: { view: invoicesView, group: 'Operasional', nav: 'Tagihan', icon: 'receipt' },
  requests: { view: requestsView, group: 'Operasional', nav: 'Laporan', icon: 'wrench' },
  announcements: { view: announcementsView, group: 'Komunikasi', nav: 'Pengumuman', icon: 'megaphone' },
  explorer: { view: explorerView, group: 'Developer', nav: 'API Explorer', icon: 'terminal' },
};

const NAV_GROUPS = [
  { label: 'Ringkasan', routes: ['dashboard'] },
  { label: 'Manajemen', routes: ['properties', 'rooms', 'tenants'] },
  { label: 'Operasional', routes: ['bookings', 'invoices', 'requests'] },
  { label: 'Komunikasi', routes: ['announcements'] },
  { label: 'Developer', routes: ['explorer'] },
];

const state = {
  mode: 'boot',
  name: 'dashboard',
  params: {},
  logCount: 0,
  drawerOpen: false,
  shellReady: false,
};

/* ----------------------------- theme ----------------------------- */

function currentTheme() {
  const stored = (() => {
    try {
      return window.localStorage.getItem(THEME_KEY);
    } catch (error) {
      return null;
    }
  })();
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    /* abaikan */
  }

  const button = document.querySelector('[data-theme-toggle]');
  if (button) {
    button.innerHTML = theme === 'dark' ? icon('sun', 17) : icon('moon', 17);
    button.setAttribute('title', theme === 'dark' ? 'Mode terang' : 'Mode gelap');
    button.setAttribute('aria-label', theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap');
  }
}

function toggleTheme() {
  applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}

/* ----------------------------- routing ---------------------------- */

function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [path, query] = raw.split('?');
  const name = (path || 'dashboard').trim() || 'dashboard';
  const params = {};
  const search = new URLSearchParams(query || '');
  for (const [key, value] of search.entries()) params[key] = value;
  return { name, params };
}

function routeOf(name) {
  return ROUTES[name] || null;
}

function hashFor(name, params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return `#/${name}${query ? `?${query}` : ''}`;
}

function navigate(target) {
  const [path, query] = String(target).split('?');
  const name = path.replace(/^#\/?/, '').replace(/\/$/, '') || 'dashboard';
  const params = {};
  for (const [key, value] of new URLSearchParams(query || '').entries()) params[key] = value;

  const hash = hashFor(name, params);
  if (window.location.hash === hash) {
    state.name = name;
    state.params = params;
    renderCurrentView();
    return;
  }
  window.location.hash = hash;
}

function setParams(patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === null || value === '') {
      delete state.params[key];
    } else {
      state.params[key] = String(value);
    }
  }
  window.history.replaceState(null, '', hashFor(state.name, state.params));
}

function buildContext() {
  return {
    api,
    user: api.user,
    get params() {
      return state.params;
    },
    navigate,
    setParams,
    refresh: () => renderCurrentView(),
  };
}

/* ------------------------------ login ----------------------------- */

function renderLogin(message = '') {
  state.mode = 'login';
  state.shellReady = false;
  closeDrawer(true);
  document.getElementById('modal-root').innerHTML = '';
  document.body.style.overflow = '';
  document.title = 'Masuk · Kostantinopel API Client';

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="auth">
      <aside class="auth__visual">
        <div class="auth__top">
          <div class="auth__brand">
            <span class="auth__logo">${icon('building', 21)}</span>
            <div>
              Kostantinopel
              <small>API Client</small>
            </div>
          </div>
        </div>

        <div class="auth__center">
          <h1 class="auth__headline">Kelola properti, kamar, dan tagihan lewat <em>REST API</em>.</h1>
          <p class="auth__lead">
            Client CRUD terpisah yang membaca dan menulis ke <span class="mono">/api/v1</span>.
            Setiap aksi di UI adalah permintaan API nyata yang bisa Anda periksa.
          </p>

          <div class="auth__features">
            <div class="auth__feature">
              ${icon('layers', 18)}
              <div>
                <strong>CRUD lengkap</strong>
                <span>Properti, kamar, penyewa, booking, tagihan, laporan, pengumuman.</span>
              </div>
            </div>
            <div class="auth__feature">
              ${icon('shield', 18)}
              <div>
                <strong>Token Bearer</strong>
                <span>Login Sanctum, sesi disimpan di localStorage browser ini.</span>
              </div>
            </div>
            <div class="auth__feature">
              ${icon('terminal', 18)}
              <div>
                <strong>API Explorer</strong>
                <span>Uji endpoint, lihat status, durasi, dan body respons JSON.</span>
              </div>
            </div>
          </div>

          <div class="auth__snippet" style="margin-top:22px">
            <div><b>POST</b> <i>/api/v1/auth/login</i></div>
            <div>{ <u>"email"</u>: "admin@kostantinopel.id", <u>"password"</u>: "••••••" }</div>
            <div>→ { <u>"token"</u>: "1|…", <u>"user"</u>: { … } }</div>
          </div>
        </div>

        <div class="auth__bottom">
          <div class="auth__meta">
            <span>Laravel 12</span>
            <span>Sanctum</span>
            <span>REST /api/v1</span>
            <span>Tanpa build step</span>
          </div>
        </div>
      </aside>

      <div class="auth__panel">
        <div class="auth__card">
          <div class="auth__mobile-brand">
            <span class="auth__logo">${icon('building', 20)}</span>
            Kostantinopel API Client
          </div>

          <div class="auth__card-head">
            <h1>Masuk ke client</h1>
            <p>Gunakan akun admin Kostantinopel untuk mengelola data.</p>
          </div>

          <div class="form-alert" data-login-error ${message ? '' : 'hidden'}>
            ${icon('alert', 16)}
            <div data-login-error-text>${esc(message)}</div>
          </div>

          <form data-login-form novalidate>
            <div class="form-grid">
              <div class="field">
                <label for="login-email">Email <span class="req">*</span></label>
                <input class="input" id="login-email" name="email" type="email" autocomplete="username" placeholder="admin@kostantinopel.id" required autofocus>
              </div>
              <div class="field">
                <label for="login-password">Password <span class="req">*</span></label>
                <input class="input" id="login-password" name="password" type="password" autocomplete="current-password" placeholder="••••••••" required>
              </div>
            </div>

            <button class="btn btn--primary btn--block" type="submit" data-login-submit style="margin-top:16px">
              ${icon('login', 15)} Masuk
            </button>
          </form>

          <div class="auth__demo">
            <button class="demo-btn" type="button" data-demo="admin">
              <strong>Akun admin demo</strong>
              admin@kostantinopel.id / admin123
            </button>
            <a class="demo-btn" href="/" target="_blank" rel="noopener">
              <strong>Panel utama</strong>
              Buka aplikasi Blade di tab baru
            </a>
          </div>

          <details class="auth__advanced">
            <summary>Pengaturan koneksi API</summary>
            <div class="field" style="margin-top:8px">
              <label for="login-base">Base URL API</label>
              <input class="input mono" id="login-base" name="baseUrl" type="text" value="${esc(api.baseUrl)}" placeholder="/api/v1">
              <span class="field__hint">Biarkan <span class="code-inline">/api/v1</span> untuk same-origin. Bisa juga URL absolut.</span>
            </div>
          </details>

          <div class="auth__note">
            ${icon('lock', 15)}
            <div>Client ini memakai token API, bukan sesi cookie Blade. Logout akan menghapus token dari browser.</div>
          </div>
        </div>
      </div>
    </div>`;

  const form = app.querySelector('[data-login-form]');
  const emailInput = app.querySelector('#login-email');
  const passwordInput = app.querySelector('#login-password');
  const baseInput = app.querySelector('#login-base');
  const errorBox = app.querySelector('[data-login-error]');
  const errorText = app.querySelector('[data-login-error-text]');
  const submitButton = app.querySelector('[data-login-submit]');

  const showError = (text) => {
    errorText.textContent = text;
    errorBox.hidden = false;
  };

  app.querySelector('[data-demo="admin"]').addEventListener('click', () => {
    emailInput.value = 'admin@kostantinopel.id';
    passwordInput.value = 'admin123';
    emailInput.classList.remove('is-invalid');
    passwordInput.classList.remove('is-invalid');
    passwordInput.focus();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError('Email dan password wajib diisi.');
      if (!email) emailInput.classList.add('is-invalid');
      if (!password) passwordInput.classList.add('is-invalid');
      return;
    }

    const base = baseInput.value.trim();
    if (base) api.setBaseUrl(base);

    errorBox.hidden = true;
    submitButton.disabled = true;
    submitButton.classList.add('is-busy');
    submitButton.innerHTML = '<span class="btn__spinner"></span> Memeriksa kredensial…';

    try {
      const session = await api.login(email, password);

      if (session.user && session.user.role === 'tenant') {
        showError('Akun ini adalah akun penyewa. Client admin hanya dapat dipakai oleh akun admin; portal penyewa ada di aplikasi utama.');
        await api.logout();
        submitButton.disabled = false;
        submitButton.classList.remove('is-busy');
        submitButton.innerHTML = `${icon('login', 15)} Masuk`;
        return;
      }

      toast(`Selamat datang, ${session.user?.name || email}.`, 'success');
      const route = parseHash();
      state.name = routeOf(route.name) ? route.name : 'dashboard';
      state.params = route.params;
      renderShell();
    } catch (error) {
      showError(error.message);
      passwordInput.classList.add('is-invalid');
      passwordInput.focus();
      passwordInput.select();
      submitButton.disabled = false;
      submitButton.classList.remove('is-busy');
      submitButton.innerHTML = `${icon('login', 15)} Masuk`;
    }
  });

  const bootEl = document.getElementById('boot');
  if (bootEl) bootEl.classList.add('is-gone');
  emailInput.focus();
}

/* ------------------------------ shell ----------------------------- */

function navMarkup() {
  return NAV_GROUPS.map((group) => `
    <div class="nav__label">${esc(group.label)}</div>
    ${group.routes.map((key) => {
      const route = ROUTES[key];
      return `<a class="nav__item" href="#/${key}" data-route="${key}">
        ${icon(route.icon, 17)}
        <span>${esc(route.nav)}</span>
      </a>`;
    }).join('')}`).join('');
}

function renderShell() {
  state.mode = 'shell';
  document.title = 'Kostantinopel API Client';

  const user = api.user || { name: 'Admin', email: '', role: 'admin' };

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="shell">
      <div class="sidebar-scrim" data-sidebar-scrim></div>

      <aside class="sidebar" data-sidebar>
        <div class="sidebar__brand">
          <span class="auth__logo">${icon('building', 20)}</span>
          <div>
            <strong>Kostantinopel</strong>
            <small>API Client</small>
          </div>
        </div>

        <nav class="nav" aria-label="Navigasi utama">${navMarkup()}</nav>

        <div class="sidebar__footer">
          <div class="api-status">
            <span class="api-status__dot" data-api-dot></span>
            <div style="min-width:0">
              <span data-api-status>Menghubungkan…</span>
              <a href="${esc(api.absoluteUrl(''))}" target="_blank" rel="noopener" class="truncate" title="${esc(api.absoluteUrl(''))}">${esc(api.baseUrl)}</a>
            </div>
          </div>
        </div>
      </aside>

      <div class="main">
        <header class="topbar">
          <button class="icon-btn sidebar-toggle" type="button" data-sidebar-toggle aria-label="Buka navigasi">${icon('menu', 18)}</button>
          <div class="topbar__left">
            <div class="topbar__eyebrow">${icon('code', 12)} <span data-eyebrow>Kostantinopel</span></div>
            <h1 class="topbar__title" data-title>Dashboard</h1>
            <p class="topbar__subtitle" data-subtitle></p>
          </div>
          <div class="topbar__actions">
            <button class="icon-btn" type="button" data-logs title="Log permintaan API" aria-label="Buka log permintaan API">
              ${icon('activity', 17)}
              <span class="icon-btn__dot" data-log-count hidden>0</span>
            </button>
            <button class="icon-btn" type="button" data-theme-toggle title="Mode gelap" aria-label="Ubah tema"></button>
            <div class="user-menu" data-user-menu>
              <button class="user-chip" type="button" data-user-toggle aria-haspopup="menu" aria-expanded="false">
                <span class="avatar">${esc(initials(user.name))}</span>
                <span class="user-chip__text">
                  <strong>${esc(user.name)}</strong>
                  <span>${esc(label(user.role, 'role'))}</span>
                </span>
              </button>
              <div class="dropdown" data-user-dropdown hidden>
                <div class="dropdown__head">
                  <strong>${esc(user.name)}</strong>
                  <span>${esc(user.email || '—')}</span>
                </div>
                <button class="dropdown__item" type="button" data-go="explorer">${icon('terminal', 15)} API Explorer</button>
                <a class="dropdown__item" href="/" target="_blank" rel="noopener">${icon('external', 15)} Panel utama</a>
                <a class="dropdown__item" href="/docs" target="_blank" rel="noopener">${icon('code', 15)} Dokumentasi API</a>
                <div class="divider" style="margin:5px 0"></div>
                <button class="dropdown__item is-danger" type="button" data-logout>${icon('logout', 15)} Keluar</button>
              </div>
            </div>
          </div>
        </header>

        <main class="content" data-content></main>
      </div>
    </div>

    <div class="drawer-overlay" data-drawer-overlay></div>
    <aside class="drawer" data-drawer aria-label="Log permintaan API">
      <div class="drawer__head">
        <span class="icon" style="color:var(--brand)">${icon('activity', 17)}</span>
        <h2>Log permintaan API</h2>
        <button class="btn btn--ghost btn--sm" type="button" data-log-clear>${icon('trash', 13)} Bersihkan</button>
        <button class="modal__close" type="button" data-drawer-close aria-label="Tutup log">${icon('close', 15)}</button>
      </div>
      <div class="drawer__body" data-drawer-body></div>
    </aside>`;

  applyTheme(currentTheme());
  state.logCount = 0;
  updateLogBadge();
  state.shellReady = true;

  const bootEl = document.getElementById('boot');
  if (bootEl) bootEl.classList.add('is-gone');

  const appRoot = app;
  const sidebar = appRoot.querySelector('[data-sidebar]');
  const scrim = appRoot.querySelector('[data-sidebar-scrim]');
  const dropdown = appRoot.querySelector('[data-user-dropdown]');
  const userToggle = appRoot.querySelector('[data-user-toggle]');

  const closeSidebar = () => {
    sidebar.classList.remove('is-open');
    scrim.classList.remove('is-open');
  };

  appRoot.querySelector('[data-sidebar-toggle]').addEventListener('click', () => {
    sidebar.classList.toggle('is-open');
    scrim.classList.toggle('is-open', sidebar.classList.contains('is-open'));
  });
  scrim.addEventListener('click', closeSidebar);

  appRoot.querySelector('[data-theme-toggle]').addEventListener('click', toggleTheme);
  appRoot.querySelector('[data-logs]').addEventListener('click', toggleDrawer);
  appRoot.querySelector('[data-drawer-close]').addEventListener('click', () => closeDrawer());
  appRoot.querySelector('[data-drawer-overlay]').addEventListener('click', () => closeDrawer());
  appRoot.querySelector('[data-log-clear]').addEventListener('click', () => {
    api.clearLog();
    state.logCount = 0;
    updateLogBadge();
    renderDrawer();
  });

  const closeMenu = () => {
    dropdown.hidden = true;
    userToggle.setAttribute('aria-expanded', 'false');
  };

  userToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    dropdown.hidden = !dropdown.hidden;
    userToggle.setAttribute('aria-expanded', dropdown.hidden ? 'false' : 'true');
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-user-menu]')) closeMenu();
  });

  dropdown.querySelector('[data-go="explorer"]').addEventListener('click', () => {
    closeMenu();
    navigate('explorer');
  });

  dropdown.querySelector('[data-logout]').addEventListener('click', async () => {
    closeMenu();
    await api.logout();
    if (state.mode !== 'login') renderLogin();
  });

  appRoot.querySelectorAll('.nav__item').forEach((item) => {
    item.addEventListener('click', () => {
      closeSidebar();
    });
  });

  appRoot.querySelector('[data-drawer-body]').addEventListener('click', (event) => {
    const summary = event.target.closest('[data-log-toggle]');
    if (!summary) return;
    const pre = summary.parentElement.querySelector('pre');
    if (pre) pre.hidden = !pre.hidden;
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) closeSidebar();
  });

  checkApiHealth();
  renderCurrentView();
}

async function checkApiHealth() {
  const dot = document.querySelector('[data-api-dot]');
  const text = document.querySelector('[data-api-status]');
  if (!dot || !text) return;

  try {
    const response = await fetch(api.absoluteUrl('/health'), {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('down');
    dot.classList.remove('is-down');
    text.textContent = 'REST API terhubung';
  } catch (error) {
    dot.classList.add('is-down');
    text.textContent = 'REST API tidak merespons';
  }
}

/* --------------------------- view mounting ------------------------ */

function renderCurrentView() {
  if (state.mode !== 'shell') return;

  const route = routeOf(state.name);
  const content = document.querySelector('[data-content]');
  if (!content) return;

  if (!route) {
    state.name = 'dashboard';
    state.params = {};
    window.history.replaceState(null, '', '#/dashboard');
    renderCurrentView();
    return;
  }

  const view = route.view;

  document.querySelectorAll('.nav__item').forEach((item) => {
    item.classList.toggle('is-active', item.dataset.route === state.name);
  });

  const eyebrow = document.querySelector('[data-eyebrow]');
  if (eyebrow) eyebrow.innerHTML = `${icon('code', 12)} Kostantinopel / ${esc(route.group)}`;
  const title = document.querySelector('[data-title]');
  if (title) title.textContent = view.title || route.nav;
  const subtitle = document.querySelector('[data-subtitle]');
  if (subtitle) subtitle.textContent = view.subtitle || '';

  document.title = `${view.title || route.nav} · Kostantinopel API Client`;

  content.innerHTML = '';
  window.scrollTo({ top: 0, behavior: 'auto' });

  try {
    view.render(content, buildContext());
  } catch (error) {
    content.innerHTML = `
      <div class="error-block">
        ${icon('alert', 20)}
        <div>
          <h3>Halaman gagal dimuat</h3>
          <p>${esc(error.message)}</p>
          <button class="btn btn--sm btn--ghost" type="button" data-retry>Tambah ulang halaman</button>
        </div>
      </div>`;
    content.querySelector('[data-retry]')?.addEventListener('click', renderCurrentView);
  }
}

/* ------------------------------ drawer ---------------------------- */

function formatLogPath(path) {
  return String(path || '')
    .replace(window.location.origin, '')
    .replace(api.baseUrl, '') || '/';
}

function logEntryMarkup(entry) {
  const status = Number(entry.status) || 0;
  const bad = !(status >= 200 && status < 300);
  const time = (() => {
    try {
      return new Date(entry.at).toLocaleTimeString('id-ID');
    } catch (error) {
      return '';
    }
  })();

  return `
    <div class="log-item">
      <button class="log-item__summary" type="button" data-log-toggle>
        <span class="log-item__method" data-method="${esc(entry.method)}">${esc(entry.method)}</span>
        <span class="log-item__path">${esc(formatLogPath(entry.path))}</span>
        <span class="log-item__status${bad ? ' is-bad' : ''}">${status || 'ERR'}</span>
      </button>
      <div class="log-item__meta">
        <span>${esc(time)}</span>
        <span>${esc(entry.ms ?? 0)} ms</span>
      </div>
      <pre hidden>${highlightJson({ request: entry.requestBody, response: entry.responseBody })}</pre>
    </div>`;
}

function renderDrawer() {
  const body = document.querySelector('[data-drawer-body]');
  if (!body) return;
  const entries = api.log.slice(0, 40);
  body.innerHTML = entries.length
    ? entries.map(logEntryMarkup).join('')
    : `<div class="empty" style="padding:36px 12px">
        <div class="empty__icon">${icon('activity', 20)}</div>
        <h3>Belum ada permintaan</h3>
        <p>Setiap panggilan API dari client ini akan muncul di sini.</p>
      </div>`;
}

function updateLogBadge() {
  const badgeEl = document.querySelector('[data-log-count]');
  if (!badgeEl) return;
  if (state.logCount > 0) {
    badgeEl.hidden = false;
    badgeEl.textContent = state.logCount > 99 ? '99+' : String(state.logCount);
  } else {
    badgeEl.hidden = true;
  }
}

function toggleDrawer() {
  if (state.drawerOpen) closeDrawer();
  else openDrawer();
}

function openDrawer() {
  const drawer = document.querySelector('[data-drawer]');
  const overlay = document.querySelector('[data-drawer-overlay]');
  if (!drawer || !overlay) return;
  state.drawerOpen = true;
  state.logCount = 0;
  updateLogBadge();
  renderDrawer();
  overlay.classList.add('is-open');
  drawer.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer(immediate = false) {
  const drawer = document.querySelector('[data-drawer]');
  const overlay = document.querySelector('[data-drawer-overlay]');
  if (!drawer || !overlay) {
    state.drawerOpen = false;
    if (!document.querySelector('.modal-overlay') && immediate) document.body.style.overflow = '';
    return;
  }
  state.drawerOpen = false;
  overlay.classList.remove('is-open');
  drawer.classList.remove('is-open');
  if (!document.querySelector('.modal-overlay')) document.body.style.overflow = '';
}

/* ------------------------------- boot ----------------------------- */

api.onLog((entry) => {
  if (entry.type !== 'entry') {
    if (entry.type === 'clear') {
      state.logCount = 0;
      updateLogBadge();
    }
    return;
  }
  state.logCount += 1;
  updateLogBadge();
  if (state.drawerOpen) renderDrawer();
});

api.onUnauthorized(() => {
  if (state.mode === 'shell') {
    renderLogin('Sesi Anda berakhir atau token tidak valid. Silakan masuk kembali.');
    toast('Silakan masuk kembali untuk melanjutkan.', 'warning');
  }
});

window.addEventListener('hashchange', () => {
  if (state.mode !== 'shell') return;

  const route = parseHash();
  if (!routeOf(route.name)) {
    window.history.replaceState(null, '', '#/dashboard');
    state.name = 'dashboard';
    state.params = {};
    renderCurrentView();
    return;
  }

  state.name = route.name;
  state.params = route.params;
  renderCurrentView();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeDrawer();
    const dropdown = document.querySelector('[data-user-dropdown]');
    if (dropdown) dropdown.hidden = true;
    document.querySelector('[data-user-toggle]')?.setAttribute('aria-expanded', 'false');
  }
});

async function boot() {
  applyTheme(currentTheme());

  if (!api.isAuthenticated) {
    renderLogin();
    return;
  }

  try {
    await api.me();
  } catch (error) {
    if (error && error.status === 401) {
      renderLogin('Sesi tersimpan sudah tidak valid. Silakan masuk kembali.');
      return;
    }
    /* Gangguan jaringan: tetap tampilkan shell dengan data user tersimpan. */
  }

  if (!api.user) {
    api.clearSession();
    renderLogin();
    return;
  }

  const route = parseHash();
  state.name = routeOf(route.name) ? route.name : 'dashboard';
  state.params = route.params;
  renderShell();
}

boot();
