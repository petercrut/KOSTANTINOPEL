/* ============================================================
   Kostantinopel — views/announcements.js
   Pengumuman pengelola: admin mengelola, penyewa membaca.
   ============================================================ */
window.KOL = window.KOL || {};
KOL.views = KOL.views || {};

KOL.views.announcements = (function () {
  'use strict';

  function render(el, role) {
    var U = KOL.utils, DB = KOL.db, AUTH = KOL.auth;
    var isTenant = role === 'tenant';
    var tenant = isTenant ? AUTH.tenantProfile() : null;
    var user = AUTH.currentUser();

    if (isTenant && !tenant) {
      el.innerHTML = '<div class="page-head"><div><h2>Pengumuman</h2></div></div>' +
        '<div class="card">' + U.emptyState('Akun Anda belum terhubung ke data penyewa.',
          'Hubungi pengelola properti untuk menautkan akun Anda.') + '</div>';
      return;
    }

    var list = isTenant
      ? DB.announcementsFor(tenant.propertyId)
      : DB.all('announcements').slice().sort(function (a, b) {
          if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
          return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
        });

    var html = '<div class="page-head">' +
      '<div><h2>Pengumuman</h2><p class="page-sub">' +
        (isTenant
          ? 'Informasi dan pemberitahuan terbaru dari pengelola properti Anda.'
          : 'Kirim informasi penting kepada penyewa di properti Anda.') +
      '</p></div>' +
      (!isTenant
        ? '<button class="btn btn-primary" id="btn-add">' + KOL.icons.plus + ' Buat Pengumuman</button>'
        : '') +
    '</div>';

    if (!list.length) {
      html += '<div class="card">' + U.emptyState('Belum ada pengumuman.',
        isTenant ? 'Pengumuman dari pengelola akan tampil di sini.' : 'Buat pengumuman pertama untuk penyewa Anda.') +
        '</div>';
    } else {
      html += '<div class="announcement-list">' + list.map(function (a) { return cardHtml(a); }).join('') + '</div>';
    }

    el.innerHTML = html;

    var addBtn = U.qs('#btn-add');
    if (addBtn) addBtn.addEventListener('click', function () { openForm(null); });

    U.qsa('[data-edit]', el).forEach(function (b) {
      b.addEventListener('click', function () { openForm(b.getAttribute('data-edit')); });
    });
    U.qsa('[data-delete]', el).forEach(function (b) {
      b.addEventListener('click', function () { removeAnnouncement(b.getAttribute('data-delete')); });
    });
    U.qsa('[data-pin]', el).forEach(function (b) {
      b.addEventListener('click', function () { togglePin(b.getAttribute('data-pin')); });
    });

    function targetLabel(a) {
      if (!a.propertyId) return 'Semua properti';
      var p = DB.propertyById(a.propertyId);
      return p ? p.name : 'Properti';
    }

    function cardHtml(a) {
      return '<article class="announcement-item' + (a.pinned ? ' is-pinned' : '') + '">' +
        '<div class="request-head">' +
          '<div>' +
            '<strong class="request-title">' +
              (a.pinned ? '<span class="pin-flag">📌</span> ' : '') +
              U.escapeHTML(a.title) + '</strong>' +
            '<div class="request-meta">' +
              '<span>' + U.escapeHTML(U.formatDateTime(a.createdAt)) + '</span>' +
              '<span>·</span>' +
              '<span>' + U.escapeHTML(a.author || 'Pengelola') + '</span>' +
              '<span>·</span>' +
              '<span class="badge badge-indigo">' + U.escapeHTML(targetLabel(a)) + '</span>' +
            '</div>' +
          '</div>' +
          (!isTenant
            ? '<div class="request-head-side">' +
                '<button class="btn btn-ghost btn-sm" data-pin="' + a.id + '">' +
                  (a.pinned ? 'Lepas Pin' : 'Pin') + '</button>' +
                '<button class="btn btn-ghost btn-sm" data-edit="' + a.id + '">Edit</button>' +
                '<button class="btn btn-danger-ghost btn-sm" data-delete="' + a.id + '">Hapus</button>' +
              '</div>'
            : '') +
        '</div>' +
        '<p class="announcement-body">' + U.escapeHTML(a.body) + '</p>' +
      '</article>';
    }

    function openForm(id) {
      var a = id ? DB.find('announcements', id) : null;
      var properties = DB.all('properties');
      var body = document.createElement('div');
      body.innerHTML =
        U.formField('Judul', '<input type="text" name="title" maxlength="90" value="' +
          U.escapeHTML(a ? a.title : '') + '" placeholder="Contoh: Pemeliharaan air lantai 2">') +
        U.formField('Isi Pengumuman', '<textarea name="body" rows="5" ' +
          'placeholder="Tulis informasi yang ingin disampaikan...">' + U.escapeHTML(a ? a.body : '') + '</textarea>') +
        U.formField('Tujuan', '<select name="propertyId">' +
          U.options([{ value: '', label: 'Semua properti' }].concat(
            properties.map(function (p) { return { value: p.id, label: p.name }; })
          ), a ? (a.propertyId || '') : '') + '</select>') +
        '<label class="check-line"><input type="checkbox" name="pinned"' + (a && a.pinned ? ' checked' : '') + '> ' +
          '<span>Sematkan di paling atas</span></label>';

      U.openModal({
        title: a ? 'Edit Pengumuman' : 'Buat Pengumuman',
        bodyNode: body,
        actions: [
          { label: 'Batal', class: 'btn-ghost', onClick: function (close) { close(); } },
          {
            label: 'Simpan', class: 'btn-primary',
            onClick: function (close) {
              var data = U.readForm(body);
              if (!data.title) { U.toast('Judul pengumuman wajib diisi', 'error'); return; }
              if (!data.body) { U.toast('Isi pengumuman wajib diisi', 'error'); return; }
              var pinned = !!body.querySelector('[name="pinned"]').checked;
              try {
                if (a) {
                  DB.updateAnnouncement(a.id, {
                    title: data.title, body: data.body,
                    propertyId: data.propertyId || null, pinned: pinned
                  });
                  U.toast('Pengumuman diperbarui', 'success');
                } else {
                  DB.createAnnouncement({
                    title: data.title, body: data.body, propertyId: data.propertyId || null,
                    pinned: pinned, author: user ? user.name : 'Pengelola'
                  });
                  U.toast('Pengumuman dikirim ke penyewa', 'success');
                }
                close();
                render(el, role);
              } catch (err) {
                U.toast(err.message, 'error');
              }
            }
          }
        ]
      });
    }

    function togglePin(id) {
      var a = DB.find('announcements', id);
      if (!a) return;
      DB.updateAnnouncement(id, { pinned: !a.pinned });
      U.toast(a.pinned ? 'Pin dilepas' : 'Pengumuman disematkan', 'success');
      render(el, role);
    }

    function removeAnnouncement(id) {
      var a = DB.find('announcements', id);
      if (!a) return;
      U.confirmDialog('Hapus pengumuman "' + a.title + '"?', {
        danger: true, confirmLabel: 'Ya, Hapus'
      }).then(function (ok) {
        if (!ok) return;
        DB.remove('announcements', id);
        U.toast('Pengumuman dihapus', 'success');
        render(el, role);
      });
    }
  }

  return { render: render };
})();
