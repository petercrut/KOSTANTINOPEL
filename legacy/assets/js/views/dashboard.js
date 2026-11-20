/* ============================================================
   Kostantinopel — views/dashboard.js
   ============================================================ */
window.KOL = window.KOL || {};
KOL.views = KOL.views || {};

KOL.views.dashboard = (function () {
  'use strict';

  function badgeClass(status) {
    return {
      paid: 'badge-green', unpaid: 'badge-amber', late: 'badge-red',
      pending: 'badge-amber', confirmed: 'badge-blue', checkin: 'badge-green',
      checkedout: 'badge-slate', cancelled: 'badge-red'
    }[status] || 'badge-slate';
  }

  function compact(n) {
    if (n >= 1000000) return (n / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
    if (n >= 1000) return Math.round(n / 1000) + ' rb';
    return String(n);
  }

  function statusLabel(item, DB) {
    if (item.type === 'invoice') return DB.L.invoiceStatus[item.status] || item.status;
    return DB.L.bookingStatus[item.status] || item.status;
  }

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
    var stats = DB.dashboardStats();
    var occ = DB.occupancyByProperty();
    var rev = DB.last6MonthsRevenue();
    var recent = DB.recentActivity(6);
    var user = AUTH.currentUser();
    var maxRev = Math.max.apply(null, rev.map(function (r) { return r.total; }).concat([1]));

    var html = '';

    /* Banner sambutan */
    html += '<section class="welcome-banner">' +
      '<div class="welcome-text">' +
        '<h2>Halo, ' + U.escapeHTML(user ? user.name : 'Pengguna') + ' 👋</h2>' +
        '<p>Ringkasan operasional seluruh properti Anda hari ini, ' + U.escapeHTML(U.formatDate(U.todayISO())) + '.</p>' +
      '</div>' +
      '<div class="welcome-actions">' +
        '<a class="btn btn-light" href="#/bookings">+ Booking Baru</a>' +
        '<a class="btn btn-ghost-light" href="#/invoices">Lihat Tagihan</a>' +
      '</div>' +
    '</section>';

    /* Kartu statistik */
    html += '<section class="stat-grid">' +
      statCard('building', 'Properti Aktif', stats.properties, 'seluruh portofolio') +
      statCard('bed', 'Kamar Terisi', stats.roomsOccupied + '<small> / ' + stats.roomsTotal + ' kamar</small>', stats.occupancyRate + '% okupansi') +
      statCard('wallet', 'Pendapatan Bulan Ini', U.formatIDR(stats.revenueThisMonth), 'dari tagihan lunas') +
      statCard('alert', 'Tagihan Tertunda', U.formatIDR(stats.outstanding), stats.late > 0 ? U.formatIDR(stats.late) + ' terlambat' : 'tidak ada yang terlambat') +
      statCard('users', 'Penyewa Aktif', stats.activeTenants, 'penghuni kost/kontrakan') +
      statCard('calendar', 'Booking Menunggu', stats.pendingBookings, stats.inHouse + ' tamu in-house') +
    '</section>';

    /* Grafik */
    html += '<section class="grid-2">' +
      '<div class="card">' +
        '<div class="card-head"><h3>Okupansi per Properti</h3><a class="card-link" href="#/rooms">Kelola kamar</a></div>' +
        '<div class="card-body">' +
          (occ.length ? occ.map(function (o) {
            return '<div class="occ-row">' +
              '<div class="occ-info"><strong>' + U.escapeHTML(o.name) + '</strong>' +
              '<span>' + o.occupied + ' / ' + o.total + ' kamar · ' + U.escapeHTML(DB.L.propertyType[o.type] || o.type) + '</span></div>' +
              '<div class="occ-bar"><span style="width:' + o.rate + '%"></span></div>' +
              '<div class="occ-rate">' + o.rate + '%</div>' +
            '</div>';
          }).join('') : U.emptyState('Belum ada properti.', 'Tambahkan properti dan kamar terlebih dahulu.')) +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<div class="card-head"><h3>Pendapatan 6 Bulan Terakhir</h3><a class="card-link" href="#/reports">Laporan</a></div>' +
        '<div class="card-body">' +
          '<div class="bar-chart">' +
            rev.map(function (r) {
              var h = Math.round(r.total / maxRev * 100);
              return '<div class="bar-col" title="' + U.escapeHTML(r.key) + '">' +
                '<div class="bar-value">' + (r.total ? compact(r.total) : '') + '</div>' +
                '<div class="bar" style="height:' + Math.max(h, 3) + '%"></div>' +
                '<div class="bar-label">' + U.escapeHTML(r.label) + '</div>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>' +
    '</section>';

    /* Aktivitas terbaru */
    html += '<section class="card">' +
      '<div class="card-head"><h3>Aktivitas Terbaru</h3><a class="card-link" href="#/invoices">Lihat semua</a></div>' +
      '<div class="card-body no-pad">' +
        (recent.length
          ? '<ul class="activity-list">' + recent.map(function (item) {
              return '<li>' +
                '<span class="activity-icon ' + (item.type === 'invoice' ? 'ai-wallet' : 'ai-calendar') + '">' +
                  KOL.icons[item.type === 'invoice' ? 'wallet' : 'calendar'] + '</span>' +
                '<div class="activity-main"><strong>' + U.escapeHTML(item.title) + '</strong>' +
                '<span>' + U.formatDateTime(item.createdAt) + '</span></div>' +
                '<span class="activity-amount">' + U.formatIDR(item.amount) + '</span>' +
                '<span class="badge ' + badgeClass(item.status) + '">' + U.escapeHTML(statusLabel(item, DB)) + '</span>' +
              '</li>';
            }).join('') + '</ul>'
          : U.emptyState('Belum ada aktivitas.')) +
      '</div>' +
    '</section>';

    el.innerHTML = html;
  }

  return { render: render };
})();
