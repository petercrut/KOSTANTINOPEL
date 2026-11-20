/* ============================================================
   Kostantinopel — views/invoices.js
   ============================================================ */
window.KOL = window.KOL || {};
KOL.views = KOL.views || {};

KOL.views.invoices = (function () {
  'use strict';

  var filter = { status: 'all', property: 'all', search: '' };

  function render(el) {
    var U = KOL.utils, DB = KOL.db;
    var properties = DB.all('properties');
    var totals = DB.invoiceTotals();
    var invoices = DB.all('invoices').filter(function (inv) {
      var st = DB.invoiceStatus(inv);
      if (filter.status !== 'all' && st !== filter.status) return false;
      if (filter.property !== 'all' && inv.propertyId !== filter.property) return false;
      if (filter.search) {
        var hay = (inv.code + ' ' + inv.description).toLowerCase();
        if (hay.indexOf(filter.search.toLowerCase()) === -1) return false;
      }
      return true;
    }).sort(function (a, b) { return String(b.code || '').localeCompare(String(a.code || '')); });

    var propOpts = [{ value: 'all', label: 'Semua Properti' }].concat(
      properties.map(function (p) { return { value: p.id, label: p.name }; })
    );

    var html = '<div class="page-head">' +
      '<div><h2>Tagihan &amp; Pembayaran</h2><p class="page-sub">Pantau tagihan sewa dan booking serta pencatatan pembayaran.</p></div>' +
      '<button class="btn btn-primary" id="btn-add">' + KOL.icons.plus + ' Tambah Tagihan</button>' +
    '</div>';

    /* Ringkasan */
    html += '<div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">' +
      '<div class="stat-card"><div class="stat-icon" style="background:#FEF3C7;color:#B45309">' + KOL.icons.alert + '</div>' +
        '<div class="stat-body"><span class="stat-label">Belum Dibayar</span>' +
        '<strong class="stat-value">' + U.formatIDR(totals.unpaidTotal) + '</strong>' +
        '<span class="stat-sub">termasuk ' + U.formatIDR(totals.lateTotal) + ' terlambat</span></div></div>' +
      '<div class="stat-card"><div class="stat-icon" style="background:#D1FAE5;color:#065F46">' + KOL.icons.wallet + '</div>' +
        '<div class="stat-body"><span class="stat-label">Lunas Bulan Ini</span>' +
        '<strong class="stat-value">' + U.formatIDR(totals.paidThisMonth) + '</strong>' +
        '<span class="stat-sub">dari ' + DB.all('invoices').length + ' tagihan</span></div></div>' +
      '<div class="stat-card"><div class="stat-icon">' + KOL.icons.chart + '</div>' +
        '<div class="stat-body"><span class="stat-label">Total Terbayar</span>' +
        '<strong class="stat-value">' + U.formatIDR(totals.paidTotal) + '</strong>' +
        '<span class="stat-sub">seluruh periode</span></div></div>' +
    '</div>';

    html += '<div class="filter-bar">' +
      '<select id="f-status">' + U.options([
        { value: 'all', label: 'Semua Status' },
        { value: 'unpaid', label: 'Belum Bayar' },
        { value: 'late', label: 'Terlambat' },
        { value: 'paid', label: 'Lunas' }
      ], filter.status) + '</select>' +
      '<select id="f-property">' + U.options(propOpts, filter.property) + '</select>' +
      '<input type="text" id="f-search" placeholder="Cari kode / deskripsi..." value="' + U.escapeHTML(filter.search) + '">' +
      '<span class="filter-count">' + invoices.length + ' tagihan</span>' +
    '</div>';

    if (!invoices.length) {
      html += '<div class="card">' + U.emptyState('Tidak ada tagihan yang cocok.', 'Ubah filter atau buat tagihan baru.') + '</div>';
    } else {
      html += '<div class="card"><div class="card-body no-pad"><table class="table">' +
        '<thead><tr><th>Kode</th><th>Deskripsi</th><th class="num">Jumlah</th><th>Jatuh Tempo</th><th>Status</th><th>Pembayaran</th><th class="ta-right">Aksi</th></tr></thead>' +
        '<tbody>' + invoices.map(rowHtml).join('') + '</tbody>' +
      '</table></div></div>';
    }

    el.innerHTML = html;

    U.qs('#btn-add').addEventListener('click', function () { openCreateForm(); });
    U.qs('#f-status').addEventListener('change', function (e) { filter.status = e.target.value; render(el); });
    U.qs('#f-property').addEventListener('change', function (e) { filter.property = e.target.value; render(el); });
    U.qs('#f-search').addEventListener('input', function (e) { filter.search = e.target.value; render(el); });
    U.qsa('[data-pay]', el).forEach(function (b) {
      b.addEventListener('click', function () { payForm(b.getAttribute('data-pay')); });
    });
    U.qsa('[data-delete]', el).forEach(function (b) {
      b.addEventListener('click', function () { removeInvoice(b.getAttribute('data-delete')); });
    });

    function rowHtml(inv) {
      var st = DB.invoiceStatus(inv);
      var room = inv.roomId ? DB.roomById(inv.roomId) : null;
      return '<tr>' +
        '<td><strong>' + U.escapeHTML(inv.code) + '</strong></td>' +
        '<td><div class="cell-main"><strong>' + U.escapeHTML(inv.description) + '</strong>' +
          (room ? '<span>' + U.escapeHTML(room.number) + '</span>' : '') + '</div></td>' +
        '<td class="num"><strong>' + U.formatIDR(inv.amount) + '</strong></td>' +
        '<td>' + U.formatDate(inv.dueDate) + '</td>' +
        '<td><span class="badge badge-' + st + '">' + U.escapeHTML(DB.L.invoiceStatus[st]) + '</span></td>' +
        '<td class="cell-muted">' + (inv.status === 'paid'
          ? U.escapeHTML(inv.method || '-') + ' · ' + U.formatDate(inv.paidAt) +
            (inv.paidVia === 'tenant' ? ' · via penyewa' : '')
          : '-') + '</td>' +
        '<td class="ta-right">' +
          (inv.status !== 'paid'
            ? '<button class="btn btn-primary btn-sm" data-pay="' + inv.id + '">Bayar</button> ' +
              '<button class="btn btn-danger-ghost btn-sm" data-delete="' + inv.id + '">Hapus</button>'
            : '') +
        '</td>' +
      '</tr>';
    }

    function payForm(id) {
      var inv = DB.find('invoices', id);
      if (!inv) return;
      var body = document.createElement('div');
      body.innerHTML =
        '<div class="pay-summary">' +
          '<div class="bs-row"><span>' + U.escapeHTML(inv.code) + '</span><span>' + U.formatDate(inv.dueDate) + '</span></div>' +
          '<div class="text-muted">' + U.escapeHTML(inv.description) + '</div>' +
          '<div class="pay-amount">' + U.formatIDR(inv.amount) + '</div>' +
        '</div>' +
        U.formField('Metode Pembayaran', '<select name="method">' + U.options(DB.L.method, 'Tunai') + '</select>') +
        U.formField('Tanggal Bayar', '<input type="date" name="paidAt" value="' + U.todayISO() + '">');

      U.openModal({
        title: 'Catat Pembayaran',
        bodyNode: body,
        actions: [
          { label: 'Batal', class: 'btn-ghost', onClick: function (close) { close(); } },
          {
            label: 'Tandai Lunas', class: 'btn-primary',
            onClick: function (close) {
              var data = U.readForm(body);
              try {
                DB.payInvoice(inv.id, data.method, data.paidAt);
                U.toast('Pembayaran ' + inv.code + ' dicatat', 'success');
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

    function openCreateForm() {
      var tenants = DB.all('tenants').filter(function (t) { return DB.isTenantActive(t); });
      var bookings = DB.all('bookings').filter(function (b) { return b.status !== 'cancelled' && b.status !== 'checkedout'; });
      var body = document.createElement('div');
      body.innerHTML =
        U.formField('Sumber Tagihan', '<select name="source">' + U.options([
          { value: 'tenant', label: 'Penyewa (sewa rutin)' },
          { value: 'booking', label: 'Booking (inap)' },
          { value: 'general', label: 'Umum / lainnya' }
        ], 'tenant') + '</select>') +
        '<div id="src-tenant">' +
          U.formField('Penyewa', '<select name="tenantId">' + U.options(
            tenants.map(function (t) { return { value: t.id, label: t.name + ' · ' + (DB.roomById(t.roomId) || {}).number }; }),
            tenants.length ? tenants[0].id : ''
          ) + '</select>', tenants.length ? '' : 'Tidak ada penyewa aktif') +
        '</div>' +
        '<div id="src-booking" style="display:none">' +
          U.formField('Booking', '<select name="bookingId">' + U.options(
            bookings.map(function (b) { return { value: b.id, label: b.code + ' · ' + b.guestName + ' (' + U.formatIDR(b.total) + ')' }; }),
            bookings.length ? bookings[0].id : ''
          ) + '</select>', bookings.length ? '' : 'Tidak ada booking berjalan') +
        '</div>' +
        '<div class="form-row">' +
          U.formField('Deskripsi', '<input type="text" name="description" value="">') +
          U.formField('Jumlah (Rp)', '<input type="number" name="amount" min="0" step="1000" value="0">') +
        '</div>' +
        U.formField('Jatuh Tempo', '<input type="date" name="dueDate" value="' + U.todayISO() + '">');

      var modal = U.openModal({
        title: 'Tambah Tagihan Manual',
        bodyNode: body,
        actions: [
          { label: 'Batal', class: 'btn-ghost', onClick: function (close) { close(); } },
          {
            label: 'Buat Tagihan', class: 'btn-primary',
            onClick: function (close) {
              var data = U.readForm(body);
              if (!data.amount) { U.toast('Jumlah tagihan wajib diisi', 'error'); return; }
              var payload = { description: data.description || 'Tagihan', amount: data.amount, dueDate: data.dueDate };
              if (data.source === 'tenant' && data.tenantId) {
                var t = DB.find('tenants', data.tenantId);
                payload.tenantId = t.id;
                payload.propertyId = t.propertyId;
                payload.roomId = t.roomId;
                if (!payload.description) {
                  var room = DB.roomById(t.roomId);
                  payload.description = 'Sewa kamar ' + (room ? room.number : '') + ' — ' + U.monthLabel(U.currentMonthKey());
                }
                if (!Number(data.amount)) payload.amount = (DB.roomById(t.roomId) || {}).priceMonthly || 0;
              } else if (data.source === 'booking' && data.bookingId) {
                var b = DB.find('bookings', data.bookingId);
                payload.bookingId = b.id;
                payload.propertyId = b.propertyId;
                payload.roomId = b.roomId;
                if (!payload.description) payload.description = 'Booking ' + b.code;
                if (!Number(data.amount)) payload.amount = b.total;
              }
              DB.createInvoice(payload);
              U.toast('Tagihan berhasil dibuat', 'success');
              close();
              render(el);
            }
          }
        ]
      });

      var sourceSelect = body.querySelector('[name="source"]');
      var descInput = body.querySelector('[name="description"]');
      var amountInput = body.querySelector('[name="amount"]');

      function autoFill() {
        var src = sourceSelect.value;
        body.querySelector('#src-tenant').style.display = src === 'tenant' ? '' : 'none';
        body.querySelector('#src-booking').style.display = src === 'booking' ? '' : 'none';
        if (src === 'tenant') {
          var t = DB.find('tenants', body.querySelector('[name="tenantId"]').value);
          if (t) {
            var room = DB.roomById(t.roomId);
            descInput.value = 'Sewa kamar ' + (room ? room.number : '') + ' — ' + U.monthLabel(U.currentMonthKey());
            amountInput.value = room ? room.priceMonthly : 0;
          }
        } else if (src === 'booking') {
          var b = DB.find('bookings', body.querySelector('[name="bookingId"]').value);
          if (b) {
            descInput.value = 'Booking ' + b.code + ' — ' + b.guestName;
            amountInput.value = b.total;
          }
        }
      }

      sourceSelect.addEventListener('change', autoFill);
      body.querySelector('[name="tenantId"]').addEventListener('change', autoFill);
      body.querySelector('[name="bookingId"]').addEventListener('change', autoFill);
      autoFill();
    }

    function removeInvoice(id) {
      var inv = DB.find('invoices', id);
      if (!inv) return;
      if (inv.status === 'paid') {
        U.toast('Tagihan lunas tidak dapat dihapus.', 'error');
        return;
      }
      U.confirmDialog('Hapus tagihan "' + inv.code + '"?', { danger: true, confirmLabel: 'Ya, Hapus' }).then(function (ok) {
        if (!ok) return;
        DB.remove('invoices', id);
        U.toast('Tagihan dihapus', 'success');
        render(el);
      });
    }
  }

  return { render: render };
})();
