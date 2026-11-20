/* ============================================================
   Kostantinopel — views/bookings.js
   ============================================================ */
window.KOL = window.KOL || {};
KOL.views = KOL.views || {};

KOL.views.bookings = (function () {
  'use strict';

  var filter = { status: 'all', property: 'all', search: '' };

  function render(el) {
    var U = KOL.utils, DB = KOL.db;
    var properties = DB.all('properties');
    var bookings = DB.all('bookings').filter(function (b) {
      if (filter.status !== 'all' && b.status !== filter.status) return false;
      if (filter.property !== 'all' && b.propertyId !== filter.property) return false;
      if (filter.search) {
        var hay = (b.code + ' ' + b.guestName + ' ' + (b.guestPhone || '')).toLowerCase();
        if (hay.indexOf(filter.search.toLowerCase()) === -1) return false;
      }
      return true;
    }).sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });

    var propOpts = [{ value: 'all', label: 'Semua Properti' }].concat(
      properties.map(function (p) { return { value: p.id, label: p.name }; })
    );

    var html = '<div class="page-head">' +
      '<div><h2>Booking &amp; Reservasi</h2><p class="page-sub">Kelola reservasi kamar dengan status check-in dan check-out.</p></div>' +
      '<button class="btn btn-primary" id="btn-add">' + KOL.icons.plus + ' Booking Baru</button>' +
    '</div>';

    html += '<div class="filter-bar">' +
      '<select id="f-status">' + U.options([
        { value: 'all', label: 'Semua Status' },
        { value: 'pending', label: 'Menunggu' },
        { value: 'confirmed', label: 'Terkonfirmasi' },
        { value: 'checkin', label: 'Check-in' },
        { value: 'checkedout', label: 'Check-out' },
        { value: 'cancelled', label: 'Dibatalkan' }
      ], filter.status) + '</select>' +
      '<select id="f-property">' + U.options(propOpts, filter.property) + '</select>' +
      '<input type="text" id="f-search" placeholder="Cari kode / nama tamu..." value="' + U.escapeHTML(filter.search) + '">' +
      '<span class="filter-count">' + bookings.length + ' booking</span>' +
    '</div>';

    if (!bookings.length) {
      html += '<div class="card">' + U.emptyState('Tidak ada booking yang cocok.', 'Ubah filter atau buat booking baru.') + '</div>';
    } else {
      html += '<div class="card"><div class="card-body no-pad"><table class="table">' +
        '<thead><tr><th>Kode</th><th>Tamu</th><th>Kamar</th><th>Check-in</th><th>Check-out</th><th class="num">Durasi</th><th class="num">Total</th><th>Status</th><th class="ta-right">Aksi</th></tr></thead>' +
        '<tbody>' + bookings.map(rowHtml).join('') + '</tbody>' +
      '</table></div></div>';
    }

    el.innerHTML = html;

    U.qs('#btn-add').addEventListener('click', function () { openForm(); });
    U.qs('#f-status').addEventListener('change', function (e) { filter.status = e.target.value; render(el); });
    U.qs('#f-property').addEventListener('change', function (e) { filter.property = e.target.value; render(el); });
    U.qs('#f-search').addEventListener('input', function (e) { filter.search = e.target.value; render(el); });
    U.qsa('[data-act]', el).forEach(function (b) {
      b.addEventListener('click', function () { handleAction(b.getAttribute('data-act'), b.getAttribute('data-id')); });
    });

    function rowHtml(b) {
      var room = DB.roomById(b.roomId);
      return '<tr>' +
        '<td><strong>' + U.escapeHTML(b.code) + '</strong></td>' +
        '<td><div class="cell-main"><strong>' + U.escapeHTML(b.guestName) + '</strong>' +
          '<span>' + U.escapeHTML(b.guestPhone || '-') + '</span></div></td>' +
        '<td class="cell-muted">' + U.escapeHTML(room ? (room.number + ' · ' + (room.type || '')) : '-') + '</td>' +
        '<td>' + U.formatDate(b.checkIn) + '</td>' +
        '<td>' + U.formatDate(b.checkOut) + '</td>' +
        '<td class="num">' + b.units + ' ' + U.escapeHTML(b.unitLabel || '') + '</td>' +
        '<td class="num"><strong>' + U.formatIDR(b.total) + '</strong></td>' +
        '<td><span class="badge badge-' + b.status + '">' + U.escapeHTML(DB.L.bookingStatus[b.status] || b.status) + '</span></td>' +
        '<td class="ta-right">' + actionsHtml(b) + '</td>' +
      '</tr>';
    }

    function actionsHtml(b) {
      var a = '';
      if (b.status === 'pending') a += '<button class="btn btn-primary btn-sm" data-act="confirmed" data-id="' + b.id + '">Konfirmasi</button> ';
      if (b.status === 'confirmed') a += '<button class="btn btn-primary btn-sm" data-act="checkin" data-id="' + b.id + '">Check-in</button> ';
      if (b.status === 'checkin') a += '<button class="btn btn-primary btn-sm" data-act="checkedout" data-id="' + b.id + '">Check-out</button> ';
      if (b.status === 'pending' || b.status === 'confirmed') a += '<button class="btn btn-ghost btn-sm" data-act="cancelled" data-id="' + b.id + '">Batal</button> ';
      a += '<button class="btn btn-danger-ghost btn-sm" data-act="delete" data-id="' + b.id + '">Hapus</button>';
      return a;
    }

    function handleAction(action, id) {
      if (action === 'delete') {
        U.confirmDialog('Hapus booking ini? Tagihan terkait juga akan dihapus.', {
          danger: true, confirmLabel: 'Ya, Hapus'
        }).then(function (ok) {
          if (!ok) return;
          try {
            DB.deleteBooking(id);
            U.toast('Booking dihapus', 'success');
            render(el);
          } catch (err) {
            U.toast(err.message, 'error');
          }
        });
        return;
      }
      if (action === 'checkedout') {
        var unpaid = DB.bookingUnpaidInvoices(id);
        if (unpaid.length) {
          U.confirmDialog('Masih ada ' + unpaid.length + ' tagihan belum dibayar untuk booking ini. Lanjutkan check-out?', {
            confirmLabel: 'Ya, Check-out'
          }).then(function (ok) {
            if (ok) applyStatus(id, action);
          });
          return;
        }
      }
      applyStatus(id, action);
    }

    function applyStatus(id, status) {
      try {
        DB.setBookingStatus(id, status);
        U.toast('Status booking diperbarui', 'success');
        render(el);
      } catch (err) {
        U.toast(err.message, 'error');
      }
    }

    function roomOptions(propertyId) {
      var rooms = DB.all('rooms').filter(function (r) { return r.propertyId === propertyId; });
      var opts = rooms.map(function (r) {
        var st = DB.roomEffectiveStatus(r);
        var label = r.number + ' — ' + (r.type || '') +
          ' (' + U.formatIDR(r.priceDaily) + '/hari' + (r.priceMonthly ? ', ' + U.formatIDR(r.priceMonthly) + '/bln' : '') + ')' +
          (st === 'maintenance' ? ' · PERAWATAN' : '');
        return { value: r.id, label: label };
      });
      return U.options(opts, null);
    }

    function openForm() {
      var properties = DB.all('properties');
      if (!properties.length) {
        U.toast('Tambahkan properti dan kamar terlebih dahulu', 'error');
        return;
      }
      var propertyId = properties[0].id;
      var defaultRent = (DB.propertyById(propertyId) || {}).type === 'hotel' ? 'harian' : 'bulanan';

      var body = document.createElement('div');
      body.innerHTML =
        U.formField('Properti', '<select name="propertyId">' + U.options(
          properties.map(function (p) { return { value: p.id, label: p.name }; }), propertyId
        ) + '</select>') +
        U.formField('Kamar', '<select name="roomId">' + roomOptions(propertyId) + '</select>') +
        '<div class="form-row">' +
          U.formField('Nama Tamu', '<input type="text" name="guestName" placeholder="Nama tamu" required>') +
          U.formField('Telepon', '<input type="text" name="guestPhone" placeholder="08xx">') +
        '</div>' +
        '<div class="form-row">' +
          U.formField('Check-in', '<input type="date" name="checkIn" value="' + U.todayISO() + '">') +
          U.formField('Check-out', '<input type="date" name="checkOut" value="' + U.addDays(U.todayISO(), 1) + '">') +
        '</div>' +
        '<div class="form-row">' +
          U.formField('Tipe Sewa', '<select name="rentType">' + U.options(DB.L.rentType, defaultRent) + '</select>') +
          U.formField('Catatan', '<input type="text" name="notes" placeholder="Opsional">') +
        '</div>' +
        '<div class="booking-summary" id="booking-summary"></div>';

      var modal = U.openModal({
        title: 'Booking Baru',
        size: 'lg',
        bodyNode: body,
        actions: [
          { label: 'Batal', class: 'btn-ghost', onClick: function (close) { close(); } },
          {
            label: 'Simpan Booking', class: 'btn-primary',
            onClick: function (close) {
              var data = U.readForm(body);
              try {
                var booking = DB.createBooking(data);
                U.toast('Booking ' + booking.code + ' dibuat', 'success');
                close();
                render(el);
              } catch (err) {
                U.toast(err.message, 'error');
              }
            }
          }
        ]
      });

      function refreshSummary() {
        var d = U.readForm(body);
        var box = modal.body.querySelector('#booking-summary');
        var room = DB.roomById(d.roomId);
        if (!room) {
          box.innerHTML = '<span class="text-muted">Pilih kamar untuk melihat estimasi.</span>';
          return;
        }
        if (!d.checkIn || !d.checkOut || d.checkOut <= d.checkIn) {
          box.innerHTML = '<span class="text-muted">Periode tanggal tidak valid.</span>';
          return;
        }
        var calc = DB.computeBookingTotal(room, d.checkIn, d.checkOut, d.rentType);
        var available = DB.isRoomAvailable(room.id, d.checkIn, d.checkOut, null);
        box.innerHTML =
          '<div class="bs-row"><span>' + U.escapeHTML(room.number) + ' · ' + U.escapeHTML(room.type || '') + '</span>' +
          '<span>' + calc.units + ' ' + U.escapeHTML(calc.label) + '</span></div>' +
          '<div class="bs-row bs-total"><span>Total</span><span>' + U.formatIDR(calc.amount) + '</span></div>' +
          (available
            ? '<div class="bs-ok">✓ Kamar tersedia pada periode ini</div>'
            : '<div class="bs-bad">✕ Kamar tidak tersedia pada periode ini</div>');
      }

      ['propertyId', 'roomId', 'checkIn', 'checkOut', 'rentType'].forEach(function (n) {
        var input = body.querySelector('[name="' + n + '"]');
        if (!input) return;
        input.addEventListener('change', function () {
          if (n === 'propertyId') {
            body.querySelector('[name="roomId"]').innerHTML = roomOptions(input.value);
          }
          refreshSummary();
        });
      });

      refreshSummary();
    }
  }

  return { render: render };
})();
