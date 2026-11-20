/* ============================================================
   Kostantinopel — views/payments.js
   Portal pembayaran penyewa: tagihan sendiri + catat pembayaran.
   ============================================================ */
window.KOL = window.KOL || {};
KOL.views = KOL.views || {};

KOL.views.payments = (function () {
  'use strict';

  var filter = 'all';

  function render(el) {
    var U = KOL.utils, DB = KOL.db, AUTH = KOL.auth;
    var tenant = AUTH.tenantProfile();

    if (!tenant) {
      el.innerHTML = '<div class="page-head"><div><h2>Pembayaran</h2></div></div>' +
        '<div class="card">' + U.emptyState('Akun Anda belum terhubung ke data penyewa.',
          'Hubungi pengelola properti untuk menautkan akun Anda.') + '</div>';
      return;
    }

    var invoices = DB.invoicesForTenant(tenant.id);
    var unpaid = invoices.filter(function (i) { return DB.invoiceStatus(i) !== 'paid'; });
    var paid = invoices.filter(function (i) { return DB.invoiceStatus(i) === 'paid'; });
    var outstanding = unpaid.reduce(function (sum, i) { return sum + (Number(i.amount) || 0); }, 0);
    var paidTotal = paid.reduce(function (sum, i) { return sum + (Number(i.amount) || 0); }, 0);
    var late = unpaid.filter(function (i) { return DB.invoiceStatus(i) === 'late'; });
    var room = DB.roomById(tenant.roomId);

    var list = invoices.filter(function (inv) {
      if (filter === 'all') return true;
      return DB.invoiceStatus(inv) === filter;
    });

    var html = '<div class="page-head">' +
      '<div><h2>Pembayaran</h2><p class="page-sub">Tagihan sewa kamar ' +
        U.escapeHTML(room ? room.number : '-') + ' dan riwayat pembayaran Anda.</p></div>' +
    '</div>';

    html += '<div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">' +
      '<div class="stat-card"><div class="stat-icon" style="background:#FEF3C7;color:#B45309">' +
        KOL.icons.alert + '</div><div class="stat-body">' +
        '<span class="stat-label">Total Tunggakan</span>' +
        '<strong class="stat-value">' + U.formatIDR(outstanding) + '</strong>' +
        '<span class="stat-sub">' + unpaid.length + ' tagihan belum dibayar</span></div></div>' +
      '<div class="stat-card"><div class="stat-icon" style="background:#D1FAE5;color:#065F46">' +
        KOL.icons.wallet + '</div><div class="stat-body">' +
        '<span class="stat-label">Total Terbayar</span>' +
        '<strong class="stat-value">' + U.formatIDR(paidTotal) + '</strong>' +
        '<span class="stat-sub">' + paid.length + ' tagihan lunas</span></div></div>' +
      '<div class="stat-card"><div class="stat-icon">' + KOL.icons.calendar + '</div><div class="stat-body">' +
        '<span class="stat-label">Terlambat</span>' +
        '<strong class="stat-value">' + late.length + '</strong>' +
        '<span class="stat-sub">' + (late.length ? 'segera lunasi tagihan' : 'tidak ada keterlambatan') + '</span></div></div>' +
    '</div>';

    if (outstanding > 0) {
      html += '<div class="pay-banner">' +
        '<div><strong>Tagihan menunggu pembayaran</strong>' +
          '<span>Total ' + U.formatIDR(outstanding) + ' dari ' + unpaid.length + ' tagihan.</span></div>' +
        '<a class="btn btn-primary" href="#/requests">Butuh bantuan?</a>' +
      '</div>';
    }

    html += '<div class="filter-bar">' +
      '<select id="f-status">' + U.options([
        { value: 'all', label: 'Semua Tagihan' },
        { value: 'unpaid', label: 'Belum Bayar' },
        { value: 'late', label: 'Terlambat' },
        { value: 'paid', label: 'Lunas' }
      ], filter) + '</select>' +
      '<span class="filter-count">' + list.length + ' tagihan</span>' +
    '</div>';

    if (!list.length) {
      html += '<div class="card">' + U.emptyState('Tidak ada tagihan pada filter ini.',
        'Tagihan baru akan muncul otomatis di sini.') + '</div>';
    } else {
      html += '<div class="card"><div class="card-body no-pad"><table class="table">' +
        '<thead><tr><th>Kode</th><th>Deskripsi</th><th class="num">Jumlah</th>' +
        '<th>Jatuh Tempo</th><th>Status</th><th>Pembayaran</th><th class="ta-right">Aksi</th></tr></thead>' +
        '<tbody>' + list.map(rowHtml).join('') + '</tbody>' +
      '</table></div></div>';
    }

    html += '<p class="text-muted" style="margin-top:14px">Pembayaran yang Anda catat akan diverifikasi oleh ' +
      'pengelola. Simpan bukti transfer dan hubungi pengelola bila status belum berubah.</p>';

    el.innerHTML = html;

    U.qs('#f-status').addEventListener('change', function (e) {
      filter = e.target.value;
      render(el);
    });
    U.qsa('[data-pay]', el).forEach(function (b) {
      b.addEventListener('click', function () { payForm(b.getAttribute('data-pay')); });
    });

    function rowHtml(inv) {
      var st = DB.invoiceStatus(inv);
      return '<tr>' +
        '<td><strong>' + U.escapeHTML(inv.code) + '</strong></td>' +
        '<td class="cell-muted">' + U.escapeHTML(inv.description) + '</td>' +
        '<td class="num"><strong>' + U.formatIDR(inv.amount) + '</strong></td>' +
        '<td>' + U.formatDate(inv.dueDate) + '</td>' +
        '<td><span class="badge badge-' + st + '">' +
          U.escapeHTML(DB.L.invoiceStatus[st]) + '</span></td>' +
        '<td class="cell-muted">' + (inv.status === 'paid'
          ? U.escapeHTML(inv.method || '-') + ' · ' + U.formatDate(inv.paidAt)
          : '-') + '</td>' +
        '<td class="ta-right">' + (inv.status !== 'paid'
          ? '<button class="btn btn-primary btn-sm" data-pay="' + inv.id + '">Bayar</button>'
          : '<span class="text-muted">Lunas</span>') + '</td>' +
      '</tr>';
    }

    function payForm(id) {
      var inv = DB.find('invoices', id);
      if (!inv || inv.tenantId !== tenant.id) return;

      var body = document.createElement('div');
      body.innerHTML =
        '<div class="pay-summary">' +
          '<div class="bs-row"><span>' + U.escapeHTML(inv.code) + '</span>' +
            '<span>Jatuh tempo ' + U.formatDate(inv.dueDate) + '</span></div>' +
          '<div class="text-muted">' + U.escapeHTML(inv.description) + '</div>' +
          '<div class="pay-amount">' + U.formatIDR(inv.amount) + '</div>' +
        '</div>' +
        U.formField('Metode Pembayaran', '<select name="method">' +
          U.options(DB.L.method, 'Transfer') + '</select>') +
        U.formField('Tanggal Bayar', '<input type="date" name="paidAt" value="' + U.todayISO() + '">') +
        '<p class="text-muted">Dengan menekan "Konfirmasi Bayar", Anda menyatakan pembayaran sudah dilakukan. ' +
        'Pengelola dapat memverifikasi data ini.</p>';

      U.openModal({
        title: 'Konfirmasi Pembayaran',
        bodyNode: body,
        actions: [
          { label: 'Batal', class: 'btn-ghost', onClick: function (close) { close(); } },
          {
            label: 'Konfirmasi Bayar', class: 'btn-primary',
            onClick: function (close) {
              var data = U.readForm(body);
              if (!data.paidAt) { U.toast('Tanggal bayar wajib diisi', 'error'); return; }
              try {
                DB.payInvoice(inv.id, data.method, data.paidAt, 'tenant');
                U.toast('Pembayaran ' + inv.code + ' berhasil dicatat', 'success');
                close();
                render(el);
              } catch (err) {
                U.toast(err.message, 'error');
              }
            }
          }
        ]
      });
    }
  }

  return { render: render };
})();
