/* ============================================================
   Kostantinopel — app.js
   Shell aplikasi: ikon, sidebar, router hash, navigasi berbasis peran.
   ============================================================ */
window.KOL = window.KOL || {};

/* ---------- Ikon SVG (stroke, currentColor) ---------- */
KOL.icons = {
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="12" height="18" rx="1.5"/><path d="M16 9h4a1 1 0 0 1 1 1v11M8 7h4M8 11h4M8 15h4M2 21h20"/></svg>',
  bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M2 17h20M6 8h4v2H6z"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="3.5"/><path d="M21 21v-2a4 4 0 0 0-3-3.87M15.5 3.6a3.5 3.5 0 0 1 0 6.8"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7H4a2 2 0 0 1 0-4h14v4"/><path d="M4 7v12a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1"/><circle cx="16.5" cy="14" r="1.3"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6" rx="0.5"/><rect x="12" y="8" width="3" height="10" rx="0.5"/><rect x="17" y="5" width="3" height="13" rx="0.5"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  idcard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5 16a3.5 3.5 0 0 1 6 0M14 9h5M14 13h5"/></svg>',
  tool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0 5 5l-9.4 9.4a2.1 2.1 0 0 1-3-3l9.4-9.4Z"/><path d="M6 3l2 2-3 3-2-2 3-3Z"/></svg>',
  megaphone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h2l4 3V7L6 10H4a1 1 0 0 0-1 1Z"/><path d="M14 8a4 4 0 0 1 0 8M17 5a8 8 0 0 1 0 14"/></svg>'
};

/* ---------- Aplikasi ---------- */
KOL.app = (function () {
  'use strict';

  var U = KOL.utils;
  var DB = KOL.db;
  var AUTH = KOL.auth;

  var routes = [
    {
      key: 'dashboard', label: 'Dashboard', tenantLabel: 'Ringkasan', icon: 'grid',
      roles: ['admin', 'tenant'],
      render: function (el, role) {
        if (role === 'tenant') KOL.views.tenantDashboard.render(el);
        else KOL.views.dashboard.render(el);
      }
    },
    { key: 'properties', label: 'Properti', icon: 'building', roles: ['admin'], render: function (el) { KOL.views.properties.render(el); } },
    { key: 'rooms', label: 'Kamar / Unit', icon: 'bed', roles: ['admin'], render: function (el) { KOL.views.rooms.render(el); } },
    { key: 'tenants', label: 'Penyewa', icon: 'users', roles: ['admin'], render: function (el) { KOL.views.tenants.render(el); } },
    { key: 'bookings', label: 'Booking', icon: 'calendar', roles: ['admin'], render: function (el) { KOL.views.bookings.render(el); } },
    { key: 'invoices', label: 'Tagihan', icon: 'wallet', roles: ['admin'], render: function (el) { KOL.views.invoices.render(el); } },

    { key: 'my-room', label: 'Kamar Saya', icon: 'bed', roles: ['tenant'], render: function (el) { KOL.views.myRoom.render(el); } },
    { key: 'payments', label: 'Pembayaran', icon: 'wallet', roles: ['tenant'], render: function (el) { KOL.views.payments.render(el); } },
    { key: 'identity', label: 'Identitas', icon: 'idcard', roles: ['tenant'], render: function (el) { KOL.views.identity.render(el); } },

    { key: 'requests', label: 'Laporan & Permintaan', icon: 'tool', roles: ['admin', 'tenant'], render: function (el, role) { KOL.views.requests.render(el, role); } },
    { key: 'announcements', label: 'Pengumuman', icon: 'megaphone', roles: ['admin', 'tenant'], render: function (el, role) { KOL.views.announcements.render(el, role); } },

    { key: 'reports', label: 'Analitik', icon: 'chart', roles: ['admin'], render: function (el) { KOL.views.reports.render(el); } },
    { key: 'settings', label: 'Pengaturan', tenantLabel: 'Akun', icon: 'settings', roles: ['admin', 'tenant'], render: function (el, role) { KOL.views.settings.render(el, role); } }
  ];

  function userRole(user) {
    return user && user.role === 'tenant' ? 'tenant' : 'admin';
  }

  function labelFor(route, role) {
    return role === 'tenant' && route.tenantLabel ? route.tenantLabel : route.label;
  }

  function routesFor(role) {
    return routes.filter(function (r) { return r.roles.indexOf(role) !== -1; });
  }

  function initials(name) {
    return String(name || '?').split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
  }

  function buildNav(user) {
    var nav = U.qs('#nav');
    var role = userRole(user);
    U.clearNode(nav);
    routesFor(role).forEach(function (r) {
      var a = document.createElement('a');
      a.href = '#/' + r.key;
      a.className = 'nav-item';
      a.setAttribute('data-route', r.key);
      a.innerHTML = '<span class="nav-icon">' + KOL.icons[r.icon] + '</span>' +
        '<span class="nav-label">' + U.escapeHTML(labelFor(r, role)) + '</span>';
      nav.appendChild(a);
    });
  }

  function currentRouteKey() {
    var h = location.hash.replace(/^#\/?/, '');
    return h.split('?')[0] || 'dashboard';
  }

  function navigate() {
    var user = AUTH.currentUser();
    if (!user) { window.location.href = 'login.html'; return; }

    var role = userRole(user);
    var visible = routesFor(role);
    var key = currentRouteKey();
    var route = visible.find(function (r) { return r.key === key; });

    if (!route) {
      // Peran tidak berhak atas halaman ini — arahkan ke halaman pertama yang diizinkan.
      window.location.hash = '#/' + visible[0].key;
      return;
    }

    document.body.setAttribute('data-role', role);
    var navBrand = U.qs('.sidebar-brand small');
    if (navBrand) navBrand.textContent = role === 'tenant' ? 'Portal Penyewa' : 'Manajemen Co-Living';

    U.qsa('.nav-item').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-route') === route.key);
    });
    var label = labelFor(route, role);
    U.qs('#page-title').textContent = label;
    var view = U.qs('#view');
    U.clearNode(view);
    route.render(view, role, user);
    if (KOL.theme) KOL.theme.mount();
    document.title = label + ' · Kostantinopel';
    document.body.classList.remove('sidebar-open');
    window.scrollTo(0, 0);
  }

  function updateUserBox() {
    var user = AUTH.currentUser();
    var box = U.qs('#user-box');
    if (!box) return;
    if (!user) { box.innerHTML = ''; return; }
    var roleLabel = DB.L.role[userRole(user)] || 'Pengguna';
    box.title = user.email;
    box.innerHTML = '<div class="user-avatar">' + U.escapeHTML(initials(user.name)) + '</div>' +
      '<div class="user-meta"><strong>' + U.escapeHTML(user.name) + '</strong>' +
      '<span>' + U.escapeHTML(roleLabel) + '</span></div>';
  }

  function start() {
    DB.init();
    var user = AUTH.currentUser();
    if (!user) { window.location.href = 'login.html'; return; }
    buildNav(user);
    updateUserBox();

    U.qs('#btn-logout').addEventListener('click', function () {
      AUTH.logout();
      U.toast('Anda telah keluar', 'info');
      window.location.href = 'login.html';
    });

    var toggle = U.qs('#sidebar-toggle');
    if (toggle) toggle.addEventListener('click', function () {
      document.body.classList.toggle('sidebar-open');
    });

    // Navbar mini (collapse) ala Sneat — tersimpan di localStorage
    var navCollapse = U.qs('#nav-collapse');
    if (navCollapse) {
      if (localStorage.getItem('kol-nav-collapsed') === '1') {
        document.body.classList.add('nav-collapsed');
      }
      navCollapse.addEventListener('click', function () {
        document.body.classList.toggle('nav-collapsed');
        localStorage.setItem('kol-nav-collapsed',
          document.body.classList.contains('nav-collapsed') ? '1' : '0');
      });
    }

    window.addEventListener('hashchange', navigate);
    navigate();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  return {
    navigate: navigate, refreshUser: updateUserBox,
    routesFor: routesFor, userRole: userRole
  };
})();
