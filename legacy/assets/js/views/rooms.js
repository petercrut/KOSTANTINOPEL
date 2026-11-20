/* ============================================================
   Kostantinopel — views/rooms.js
   ============================================================ */
window.KOL = window.KOL || {};
KOL.views = KOL.views || {};

KOL.views.rooms = (function () {
  'use strict';

  var filter = { property: 'all', status: 'all', search: '' };

  function render(el) {
    var U = KOL.utils, DB = KOL.db;
    var properties = DB.all('properties');
    var rooms = DB.all('rooms').filter(function (r) {
      if (filter.property !== 'all' && r.propertyId !== filter.property) return false;
      if (filter.status !== 'all' && DB.roomEffectiveStatus(r) !== filter.status) return false;
      if (filter.search && (r.number + ' ' + (r.type || '')).toLowerCase().indexOf(filter.search.toLowerCase()) === -1) return false;
      return true;
    });

    var propOpts = [{ value: 'all', label: 'Semua Properti' }].concat(
      properties.map(function (p) { return { value: p.id, label: p.name }; })
    );

    var html = '<div class="page-head">' +
      '<div><h2>Kamar / Unit</h2><p class="page-sub">Kelola kamar, harga sewa, dan status ketersediaan.</p></div>' +
      '<button class="btn btn-primary" id="btn-add">' + KOL.icons.plus + ' Tambah Kamar</button>' +
    '</div>';

    html += '<div class="filter-bar">' +
      '<select id="f-property">' + U.options(propOpts, filter.property) + '</select>' +
      '<select id="f-status">' + U.options([
        { value: 'all', label: 'Semua Status' },
        { value: 'available', label: 'Tersedia' },
        { value: 'occupied', label: 'Terisi' },
        { value: 'maintenance', label: 'Perawatan' }
      ], filter.status) + '</select>' +
      '<input type="text" id="f-search" placeholder="Cari nomor / tipe kamar..." value="' + U.escapeHTML(filter.search) + '">' +
      '<span class="filter-count">' + rooms.length + ' kamar</span>' +
    '</div>';

    if (!rooms.length) {
      html += '<div class="card">' + U.emptyState('Tidak ada kamar yang cocok.', 'Ubah filter atau tambahkan kamar baru.') + '</div>';
    } else {
      html += '<div class="card"><div class="card-body no-pad"><table class="table">' +
        '<thead><tr><th>Kamar</th><th>Properti</th><th>Tipe</th><th class="num">Kapasitas</th><th class="num">Harga/Hari</th><th class="num">Harga/Bulan</th><th>Fasilitas</th><th>Status</th><th class="ta-right">Aksi</th></tr></thead>' +
        '<tbody>' + rooms.map(rowHtml).join('') + '</tbody>' +
      '</table></div></div>';
    }

    el.innerHTML = html;

    U.qs('#btn-add').addEventListener('click', function () { openForm(null); });
    U.qs('#f-property').addEventListener('change', function (e) { filter.property = e.target.value; render(el); });
    U.qs('#f-status').addEventListener('change', function (e) { filter.status = e.target.value; render(el); });
    U.qs('#f-search').addEventListener('input', function (e) { filter.search = e.target.value; render(el); });
    U.qsa('[data-edit]', el).forEach(function (b) {
      b.addEventListener('click', function () { openForm(b.getAttribute('data-edit')); });
    });
    U.qsa('[data-delete]', el).forEach(function (b) {
      b.addEventListener('click', function () { removeRoom(b.getAttribute('data-delete')); });
    });

    function rowHtml(r) {
      var p = DB.propertyById(r.propertyId);
      var status = DB.roomEffectiveStatus(r);
      var fac = (r.facilities || []).join(', ');
      return '<tr>' +
        '<td><strong>' + U.escapeHTML(r.number) + '</strong></td>' +
        '<td class="cell-muted">' + U.escapeHTML(p ? p.name : '-') + '</td>' +
        '<td>' + U.escapeHTML(r.type || '-') + '</td>' +
        '<td class="num">' + (r.capacity || 1) + ' orang</td>' +
        '<td class="num">' + U.formatIDR(r.priceDaily) + '</td>' +
        '<td class="num">' + U.formatIDR(r.priceMonthly) + '</td>' +
        '<td class="cell-muted">' + U.escapeHTML(fac || '-') + '</td>' +
        '<td><span class="badge badge-' + status + '">' + U.escapeHTML(DB.L.roomStatus[status] || status) + '</span></td>' +
        '<td class="ta-right">' +
          '<button class="btn btn-ghost btn-sm" data-edit="' + r.id + '">Edit</button> ' +
          '<button class="btn btn-danger-ghost btn-sm" data-delete="' + r.id + '">Hapus</button>' +
        '</td>' +
      '</tr>';
    }

    function openForm(id) {
      var r = id ? DB.roomById(id) : null;
      if (!properties.length) {
        U.toast('Tambahkan properti terlebih dahulu di menu Properti', 'error');
        return;
      }
      var body = document.createElement('div');
      body.innerHTML =
        U.formField('Properti', '<select name="propertyId">' + U.options(
          properties.map(function (p) { return { value: p.id, label: p.name }; }),
          r ? r.propertyId : properties[0].id
        ) + '</select>') +
        U.formField('Nomor Kamar', '<input type="text" name="number" value="' + U.escapeHTML(r ? r.number : '') + '" placeholder="cth: K-101 / H-201" required>') +
        '<div class="form-row">' +
          U.formField('Tipe Kamar', '<input type="text" name="type" value="' + U.escapeHTML(r ? (r.type || '') : '') + '" placeholder="Single / Deluxe / Suite">') +
          U.formField('Kapasitas', '<input type="number" name="capacity" min="1" max="20" value="' + (r ? (r.capacity || 1) : 1) + '">') +
        '</div>' +
        '<div class="form-row">' +
          U.formField('Harga per Hari (Rp)', '<input type="number" name="priceDaily" min="0" step="1000" value="' + (r ? r.priceDaily : 0) + '">') +
          U.formField('Harga per Bulan (Rp)', '<input type="number" name="priceMonthly" min="0" step="1000" value="' + (r ? r.priceMonthly : 0) + '">') +
        '</div>' +
        U.formField('Fasilitas', '<input type="text" name="facilities" value="' + U.escapeHTML(r ? (r.facilities || []).join(', ') : '') + '" placeholder="WiFi, AC, TV (pisahkan dengan koma)">') +
        U.formField('Status', '<select name="status">' + U.options([
          { value: 'available', label: 'Tersedia' },
          { value: 'maintenance', label: 'Perawatan' }
        ], r ? r.status : 'available') + '</select>');

      U.openModal({
        title: r ? 'Edit Kamar' : 'Tambah Kamar',
        bodyNode: body,
        actions: [
          { label: 'Batal', class: 'btn-ghost', onClick: function (close) { close(); } },
          {
            label: 'Simpan', class: 'btn-primary',
            onClick: function (close) {
              var data = U.readForm(body);
              if (!data.number) { U.toast('Nomor kamar wajib diisi', 'error'); return; }
              if (!data.propertyId) { U.toast('Pilih properti', 'error'); return; }
              data.priceDaily = Number(data.priceDaily) || 0;
              data.priceMonthly = Number(data.priceMonthly) || 0;
              data.capacity = Number(data.capacity) || 1;
              data.facilities = data.facilities
                ? data.facilities.split(',').map(function (s) { return s.trim(); }).filter(Boolean)
                : [];
              if (r) {
                DB.update('rooms', r.id, data);
                U.toast('Kamar diperbarui', 'success');
              } else {
                DB.insert('rooms', data);
                U.toast('Kamar ditambahkan', 'success');
              }
              close();
              render(el);
            }
          }
        ]
      });
    }

    function removeRoom(id) {
      var r = DB.roomById(id);
      if (!r) return;
      var hasTenant = DB.all('tenants').some(function (t) { return t.roomId === id && t.status === 'active'; });
      var hasBooking = DB.all('bookings').some(function (b) {
        return b.roomId === id && ['pending', 'confirmed', 'checkin'].indexOf(b.status) !== -1;
      });
      if (hasTenant) { U.toast('Kamar masih dihuni penyewa aktif. Akhiri sewa terlebih dahulu.', 'error'); return; }
      if (hasBooking) { U.toast('Kamar memiliki booking berjalan. Batalkan booking terlebih dahulu.', 'error'); return; }
      U.confirmDialog('Hapus kamar "' + r.number + '"?', { danger: true, confirmLabel: 'Ya, Hapus' }).then(function (ok) {
        if (!ok) return;
        DB.remove('rooms', id);
        U.toast('Kamar dihapus', 'success');
        render(el);
      });
    }
  }

  return { render: render };
})();
