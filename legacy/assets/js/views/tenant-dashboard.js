/* ============================================================
   Kostantinopel — views/tenant-dashboard.js
   Ringkasan portal untuk penyewa (tenant).
   ============================================================ */
window.KOL = window.KOL || {};
KOL.views = KOL.views || {};

KOL.views.tenantDashboard = (function () {
  'use strict';

  var REQ_BADGE = {
    open: 'badge-pending', in_progress: 'badge-confirmed',
    done: 'badge-paid', rejected: 'badge-cancelled'
  };

  function statCard(iconName, label, value, sub) {
    return '<div class="stat-card">' +
      '<div class="stat-icon">' + KOL.icons[iconName] + '</div>' +
      '<div class="stat-body">' +
        '<span class="stat-label">' + KOL.utils.escapeHTML(label) + '</span>' +
        '<strong class="stat-value">' + value + '</strong>' +
        '<span class="stat-sub">' + KOL.utils.escapeHTML(sub) + '</span>' +
      '</div>' +
    '</div>';
  }

  function render(el) {
    var U = KOL.utils, DB = KOL.db, AUTH = KOL.auth;
    var user = AUTH.currentUser();
    var tenant = AUTH.tenantProfile();

    if (!tenant) {
      el.innerHTML = '<div class="page-head"><div><h2>Ringkasan</h2>' +
        '<p class="page-sub">Portal penyewa Kostantinopel.</p></div></div>' +
        '<div class="card">' + U.emptyState('Akun Anda belum terhubung ke data penyewa.',
          'Hubungi admin/pengelola properti untuk menautkan akun Anda ke kamar.') + '</div>';
      return;
    }

    var room = DB.roomById(tenant.roomId);
    var property = room ? DB.propertyById(room.propertyId) : null;
    var invoices = DB.invoicesForTenant(tenant.id);
    var unpaid = invoices.filter(function (i) { return DB.invoiceStatus(i) !== 'paid'; });
    var outstanding = unpaid.reduce(function (sum, i) { return sum + (Number(i.amount) || 0); }, 0);
    var nextDue = unpaid.slice().sort(function (a, b) { return String(a.dueDate).localeCompare(String(b.dueDate)); })[0];
    var requests = DB.requestsForTenant(tenant.id);
    var openRequests = requests.filter(function (r) { return r.status === 'open' || r.status === 'in_progress'; });
    var announcements = DB.announcementsFor(tenant.propertyId);
    var active = DB.isTenantActive(tenant);
    var roomStatus = room ? DB.roomEffectiveStatus(room) : 'unknown';

    var html = '<div class="page-head">' +
      '<div><h2>Halo, ' + U.escapeHTML(tenant.name.split(' ')[0]) + ' 👋</h2>' +
      '<p class="page-sub">Ringkasan kamar, tagihan, dan aktivitas Anda hari ini.</p></div>' +
      '<div class="btn-row" style="margin:0">' +
        '<a class="btn btn-ghost" href="#/requests">Laporkan Masalah</a>' +
        '<a class="btn btn-primary" href="#/payments">Bayar Tagihan</a>' +
      '</div>' +
    '</div>';

    /* Kartu statistik */
    html += '<section class="stat-grid" style="grid-template-columns:repeat(4,1fr)">' +
      statCard('wallet', 'Tagihan Belum Dibayar', U.formatIDR(outstanding),
        unpaid.length + ' tagihan menunggu') +
      statCard('calendar', 'Jatuh Tempo Berikutnya', nextDue ? U.formatDate(nextDue.dueDate) : 'Tidak ada',
        nextDue ? U.formatIDR(nextDue.amount) : 'semua tagihan lunas') +
      statCard('bed', 'Kamar Anda', room ? room.number : '-',
        room ? (DB.L.roomStatus[roomStatus] || roomStatus) + ' · ' + (room.type || '') : 'belum ada kamar') +
      statCard('tool', 'Laporan Aktif', openRequests.length,
        requests.length + ' total laporan') +
    '</section>';

    html += '<section class="grid-2">' +

      /* Kamar */
      '<div class="card">' +
        '<div class="card-head"><h3>Kamar Saya</h3><a class="card-link" href="#/my-room">Detail kamar</a></div>' +
        '<div class="card-body">' +
          (room
            ? '<div class="room-summary">' +
                '<div class="room-badge">' + U.escapeHTML(room.number) + '</div>' +
                '<div class="room-summary-main"><strong>' + U.escapeHTML(property ? property.name : 'Properti') + '</strong>' +
                  '<span>' + U.escapeHTML((room.type || '-') + ' · kapasitas ' + room.capacity + ' orang') + '</span></div>' +
                '<span class="badge ' + (roomStatus === 'occupied' ? 'badge-paid' : roomStatus === 'maintenance' ? 'badge-pending' : 'badge-confirmed') + '">' +
                  U.escapeHTML(DB.L.roomStatus[roomStatus] || roomStatus) + '</span>' +
              '</div>' +
              '<div class="facility-chips" style="margin-top:14px">' +
                (room.facilities || []).map(function (f) { return '<span class="facility-chip">' + U.escapeHTML(f) + '</span>'; }).join('') +
              '</div>' +
              '<div class="info-grid" style="margin-top:16px">' +
                '<div class="info-item"><span>Sewa Bulanan</span><strong>' + U.formatIDR(room.priceMonthly) + '</strong></div>' +
                '<div class="info-item"><span>Mulai Tinggal</span><strong>' + U.formatDate(tenant.startDate) + '</strong></div>' +
                '<div class="info-item"><span>Alamat</span><strong>' + U.escapeHTML(property ? property.address : '-') + '</strong></div>' +
                '<div class="info-item"><span>Status Sewa</span><strong>' + (active ? 'Aktif' : 'Selesai') + '</strong></div>' +
              '</div>'
            : U.emptyState('Kamar belum ditautkan.', 'Hubungi pengelola properti.')) +
        '</div>' +
      '</div>' +

      /* Tagihan */
      '<div class="card">' +
        '<div class="card-head"><h3>Tagihan Terbaru</h3><a class="card-link" href="#/payments">Lihat semua</a></div>' +
        '<div class="card-body no-pad">' +
          (invoices.length
            ? '<ul class="mini-list">' + invoices.slice(0, 4).map(function (inv) {
                var st = DB.invoiceStatus(inv);
                return '<li>' +
                  '<div class="mini-main"><strong>' + U.escapeHTML(inv.code) + '</strong>' +
                    '<span>' + U.escapeHTML(inv.description) + '</span>' +
                    '<small>Jatuh tempo ' + U.formatDate(inv.dueDate) + '</small></div>' +
                  '<div class="mini-side"><strong>' + U.formatIDR(inv.amount) + '</strong>' +
                    '<span class="badge badge-' + st + '">' + U.escapeHTML(DB.L.invoiceStatus[st]) + '</span></div>' +
                '</li>';
              }).join('') + '</ul>'
            : U.emptyState('Belum ada tagihan.', 'Tagihan akan muncul di sini.')) +
        '</div>' +
      '</div>' +
    '</section>';

    html += '<section class="grid-2">' +

      /* Pengumuman */
      '<div class="card">' +
        '<div class="card-head"><h3>Pengumuman</h3><a class="card-link" href="#/announcements">Lihat semua</a></div>' +
        '<div class="card-body">' +
          (announcements.length
            ? announcements.slice(0, 3).map(function (a) {
                return '<div class="announcement-item" style="padding-top:0">' +
                  '<div class="request-head"><strong class="request-title">' +
                    (a.pinned ? '<span class="pin-flag">📌 </span>' : '') + U.escapeHTML(a.title) + '</strong>' +
                    '<span class="request-meta">' + U.formatDate(a.createdAt) + '</span></div>' +
                  '<p class="announcement-body">' + U.escapeHTML(a.body) + '</p>' +
                '</div>';
              }).join('')
            : U.emptyState('Belum ada pengumuman.', 'Pengumuman dari pengelola akan tampil di sini.')) +
        '</div>' +
      '</div>' +

      /* Laporan */
      '<div class="card">' +
        '<div class="card-head"><h3>Laporan &amp; Permintaan</h3><a class="card-link" href="#/requests">Lihat semua</a></div>' +
        '<div class="card-body no-pad">' +
          (requests.length
            ? '<ul class="mini-list">' + requests.slice(0, 3).map(function (r) {
                return '<li>' +
                  '<div class="mini-main"><strong>' + U.escapeHTML(r.title) + '</strong>' +
                    '<span>' + U.escapeHTML(DB.L.requestCategory[r.category] || r.category) + '</span>' +
                    '<small>' + U.formatDateTime(r.createdAt) + '</small></div>' +
                  '<div class="mini-side"><span class="badge ' + (REQ_BADGE[r.status] || 'badge-slate') + '">' +
                    U.escapeHTML(DB.L.requestStatus[r.status] || r.status) + '</span></div>' +
                '</li>';
              }).join('') + '</ul>'
            : U.emptyState('Belum ada laporan.', 'Sampaikan keluhan atau permintaan terkait kamar Anda.')) +
        '</div>' +
      '</div>' +
    '</section>';

    el.innerHTML = html;
  }

  return { render: render };
})();
