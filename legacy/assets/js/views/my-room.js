/* ============================================================
   Kostantinopel — views/my-room.js
   Detail & status kamar untuk portal penyewa.
   ============================================================ */
window.KOL = window.KOL || {};
KOL.views = KOL.views || {};

KOL.views.myRoom = (function () {
  'use strict';

  var REQ_BADGE = {
    open: 'badge-pending', in_progress: 'badge-confirmed',
    done: 'badge-paid', rejected: 'badge-cancelled'
  };

  function render(el) {
    var U = KOL.utils, DB = KOL.db, AUTH = KOL.auth;
    var tenant = AUTH.tenantProfile();

    if (!tenant) {
      el.innerHTML = '<div class="page-head"><div><h2>Kamar Saya</h2></div></div>' +
        '<div class="card">' + U.emptyState('Akun Anda belum terhubung ke kamar.',
          'Hubungi pengelola properti untuk menautkan akun Anda.') + '</div>';
      return;
    }

    var room = DB.roomById(tenant.roomId);
    var property = room ? DB.propertyById(room.propertyId) : null;
    var active = DB.isTenantActive(tenant);
    var roomStatus = room ? DB.roomEffectiveStatus(room) : 'unknown';
    var invoices = DB.invoicesForTenant(tenant.id);
    var unpaid = invoices.filter(function (i) { return DB.invoiceStatus(i) !== 'paid'; });
    var outstanding = unpaid.reduce(function (sum, i) { return sum + (Number(i.amount) || 0); }, 0);
    var requests = DB.requestsForTenant(tenant.id);
    var openRequests = requests.filter(function (r) { return r.status === 'open' || r.status === 'in_progress'; });

    var statusBadge = roomStatus === 'occupied' ? 'badge-paid'
      : roomStatus === 'maintenance' ? 'badge-pending' : 'badge-confirmed';

    var html = '<div class="page-head">' +
      '<div><h2>Kamar Saya</h2><p class="page-sub">Detail kamar, fasilitas, dan status sewa Anda.</p></div>' +
      '<div class="btn-row" style="margin:0">' +
        '<a class="btn btn-ghost" href="#/identity">Perbarui Identitas</a>' +
        '<a class="btn btn-primary" href="#/requests">Laporkan Masalah</a>' +
      '</div>' +
    '</div>';

    if (!room) {
      el.innerHTML = html + '<div class="card">' +
        U.emptyState('Data kamar tidak ditemukan.', 'Hubungi pengelola properti Anda.') + '</div>';
      return;
    }

    /* Kartu utama kamar */
    html += '<div class="room-hero">' +
      '<div class="room-hero-main">' +
        '<span class="badge ' + statusBadge + '">' + U.escapeHTML(DB.L.roomStatus[roomStatus] || roomStatus) + '</span>' +
        '<h3>' + U.escapeHTML(room.number) + '</h3>' +
        '<p>' + U.escapeHTML(property ? property.name : 'Properti') + ' · ' + U.escapeHTML(room.type || '-') + '</p>' +
        '<div class="facility-chips">' +
          (room.facilities || []).map(function (f) {
            return '<span class="facility-chip">' + U.escapeHTML(f) + '</span>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div class="room-hero-side">' +
        '<span class="room-hero-label">Sewa Bulanan</span>' +
        '<strong class="room-hero-price">' + U.formatIDR(room.priceMonthly) + '</strong>' +
        '<span class="room-hero-sub">' + U.escapeHTML(DB.L.rentType.bulanan) + ' · kapasitas ' + U.escapeHTML(room.capacity) + ' orang</span>' +
      '</div>' +
    '</div>';

    /* Info grid */
    html += '<div class="card"><div class="card-head"><h3>Informasi Sewa</h3>' +
      '<span class="badge ' + (active ? 'badge-paid' : 'badge-slate') + '">' +
        (active ? 'Sewa Aktif' : 'Sewa Selesai') + '</span></div>' +
      '<div class="card-body">' +
        '<div class="info-grid">' +
          '<div class="info-item"><span>Nama Penyewa</span><strong>' + U.escapeHTML(tenant.name) + '</strong></div>' +
          '<div class="info-item"><span>Kamar</span><strong>' + U.escapeHTML(room.number + ' · ' + (room.type || '-')) + '</strong></div>' +
          '<div class="info-item"><span>Tanggal Masuk</span><strong>' + U.formatDate(tenant.startDate) + '</strong></div>' +
          '<div class="info-item"><span>Akhir Sewa</span><strong>' + (tenant.endDate ? U.formatDate(tenant.endDate) : 'Belum ditentukan') + '</strong></div>' +
          '<div class="info-item"><span>Properti</span><strong>' + U.escapeHTML(property ? property.name : '-') + '</strong></div>' +
          '<div class="info-item"><span>Alamat</span><strong>' + U.escapeHTML(property ? property.address : '-') + '</strong></div>' +
          '<div class="info-item"><span>Kontak Pengelola</span><strong>' + U.escapeHTML(property ? (property.phone || '-') : '-') + '</strong></div>' +
          '<div class="info-item"><span>Harga Harian</span><strong>' + U.formatIDR(room.priceDaily) + '</strong></div>' +
        '</div>' +
        (property && property.notes
          ? '<p class="text-muted" style="margin-top:16px">' + U.escapeHTML(property.notes) + '</p>'
          : '') +
      '</div>' +
    '</div>';

    html += '<div class="grid-2">' +

      /* Tagihan ringkas */
      '<div class="card"><div class="card-head"><h3>Status Pembayaran</h3>' +
        '<a class="card-link" href="#/payments">Kelola</a></div><div class="card-body">' +
        '<div class="info-grid">' +
          '<div class="info-item"><span>Tagihan Belum Dibayar</span><strong>' + unpaid.length + ' tagihan</strong></div>' +
          '<div class="info-item"><span>Total Tunggakan</span><strong>' + U.formatIDR(outstanding) + '</strong></div>' +
        '</div>' +
        (unpaid.length
          ? '<div class="btn-row"><a class="btn btn-primary" href="#/payments">Bayar Sekarang</a></div>'
          : '<p class="bs-ok" style="margin-top:14px">✓ Semua tagihan Anda sudah lunas.</p>') +
      '</div></div>' +

      /* Laporan ringkas */
      '<div class="card"><div class="card-head"><h3>Laporan Kamar</h3>' +
        '<a class="card-link" href="#/requests">Lihat semua</a></div><div class="card-body no-pad">' +
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
          : U.emptyState('Belum ada laporan.', 'Gunakan tombol Laporkan Masalah bila ada kendala di kamar.')) +
      '</div></div>' +

    '</div>';

    el.innerHTML = html;
  }

  return { render: render };
})();
