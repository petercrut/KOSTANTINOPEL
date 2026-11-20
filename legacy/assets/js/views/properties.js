/* ============================================================
   Kostantinopel — views/properties.js
   ============================================================ */
window.KOL = window.KOL || {};
KOL.views = KOL.views || {};

KOL.views.properties = (function () {
  'use strict';

  function render(el) {
    var U = KOL.utils, DB = KOL.db;
    var list = DB.all('properties');

    var html = '<div class="page-head">' +
      '<div><h2>Properti</h2><p class="page-sub">Kelola kost, kontrakan, apartemen, dan hotel Anda.</p></div>' +
      '<button class="btn btn-primary" id="btn-add">' + KOL.icons.plus + ' Tambah Properti</button>' +
    '</div>';

    if (!list.length) {
      html += '<div class="card">' + U.emptyState('Belum ada properti.', 'Tambahkan properti pertama Anda untuk mulai mengelola kamar dan penyewa.') + '</div>';
    } else {
      html += '<div class="card"><div class="card-body no-pad"><table class="table">' +
        '<thead><tr><th>Properti</th><th>Tipe</th><th>Alamat</th><th>Telepon</th><th class="num">Kamar</th><th class="num">Terisi</th><th class="ta-right">Aksi</th></tr></thead>' +
        '<tbody>' + list.map(rowHtml).join('') + '</tbody>' +
      '</table></div></div>';
    }

    el.innerHTML = html;

    U.qs('#btn-add').addEventListener('click', function () { openForm(null); });
    U.qsa('[data-edit]', el).forEach(function (b) {
      b.addEventListener('click', function () { openForm(b.getAttribute('data-edit')); });
    });
    U.qsa('[data-delete]', el).forEach(function (b) {
      b.addEventListener('click', function () { removeProperty(b.getAttribute('data-delete')); });
    });

    function rowHtml(p) {
      var rooms = DB.all('rooms').filter(function (r) { return r.propertyId === p.id; });
      var occupied = rooms.filter(function (r) { return DB.roomEffectiveStatus(r) === 'occupied'; }).length;
      return '<tr>' +
        '<td><div class="cell-main"><strong>' + U.escapeHTML(p.name) + '</strong>' +
          (p.notes ? '<span>' + U.escapeHTML(p.notes) + '</span>' : '') + '</div></td>' +
        '<td><span class="badge badge-indigo">' + U.escapeHTML(DB.L.propertyType[p.type] || p.type) + '</span></td>' +
        '<td class="cell-muted">' + U.escapeHTML(p.address || '-') + '</td>' +
        '<td>' + U.escapeHTML(p.phone || '-') + '</td>' +
        '<td class="num">' + rooms.length + '</td>' +
        '<td class="num">' + occupied + '</td>' +
        '<td class="ta-right">' +
          '<button class="btn btn-ghost btn-sm" data-edit="' + p.id + '">Edit</button> ' +
          '<button class="btn btn-danger-ghost btn-sm" data-delete="' + p.id + '">Hapus</button>' +
        '</td>' +
      '</tr>';
    }

    function openForm(id) {
      var p = id ? DB.find('properties', id) : null;
      var body = document.createElement('div');
      body.innerHTML =
        U.formField('Nama Properti', '<input type="text" name="name" value="' + U.escapeHTML(p ? p.name : '') + '" placeholder="cth: Kostantinopel Kost Putri" required>') +
        U.formField('Tipe Properti', '<select name="type">' + U.options(DB.L.propertyType, p ? p.type : 'kost') + '</select>') +
        U.formField('Alamat', '<input type="text" name="address" value="' + U.escapeHTML(p ? (p.address || '') : '') + '" placeholder="Jl. ...">') +
        U.formField('Telepon', '<input type="text" name="phone" value="' + U.escapeHTML(p ? (p.phone || '') : '') + '" placeholder="08xx / 02x">') +
        U.formField('Catatan', '<textarea name="notes" rows="2" placeholder="Opsional">' + U.escapeHTML(p ? (p.notes || '') : '') + '</textarea>');

      U.openModal({
        title: p ? 'Edit Properti' : 'Tambah Properti',
        bodyNode: body,
        actions: [
          { label: 'Batal', class: 'btn-ghost', onClick: function (close) { close(); } },
          {
            label: 'Simpan', class: 'btn-primary',
            onClick: function (close) {
              var data = U.readForm(body);
              if (!data.name) { U.toast('Nama properti wajib diisi', 'error'); return; }
              if (p) {
                DB.update('properties', p.id, data);
                U.toast('Properti diperbarui', 'success');
              } else {
                DB.insert('properties', data);
                U.toast('Properti ditambahkan', 'success');
              }
              close();
              render(el);
            }
          }
        ]
      });
    }

    function removeProperty(id) {
      var p = DB.find('properties', id);
      if (!p) return;
      var rooms = DB.all('rooms').filter(function (r) { return r.propertyId === id; });
      if (rooms.length) {
        U.toast('Properti memiliki ' + rooms.length + ' kamar. Hapus atau pindahkan kamar terlebih dahulu.', 'error');
        return;
      }
      U.confirmDialog('Hapus properti "' + p.name + '"?', { danger: true, confirmLabel: 'Ya, Hapus' }).then(function (ok) {
        if (!ok) return;
        DB.remove('properties', id);
        U.toast('Properti dihapus', 'success');
        render(el);
      });
    }
  }

  return { render: render };
})();
