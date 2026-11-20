/* ============================================================
   Kostantinopel — views/requests.js
   Laporan & permintaan: penyewa membuat, admin menanggapi.
   ============================================================ */
window.KOL = window.KOL || {};
KOL.views = KOL.views || {};

KOL.views.requests = (function () {
  'use strict';

  var filter = { status: 'all', property: 'all', search: '' };

  var BADGE = {
    open: 'badge-pending', in_progress: 'badge-confirmed',
    done: 'badge-paid', rejected: 'badge-cancelled'
  };

  function render(el, role) {
    var U = KOL.utils, DB = KOL.db, AUTH = KOL.auth;
    var isTenant = role === 'tenant';
    var tenant = isTenant ? AUTH.tenantProfile() : null;

    if (isTenant && !tenant) {
      el.innerHTML = '<div class="page-head"><div><h2>Laporan &amp; Permintaan</h2></div></div>' +
        '<div class="card">' + U.emptyState('Akun Anda belum terhubung ke data penyewa.',
          'Hubungi pengelola properti untuk menautkan akun Anda.') + '</div>';
      return;
    }

    var source = isTenant
      ? DB.requestsForTenant(tenant.id)
      : DB.all('requests').slice();

    var properties = DB.all('properties');
    var list = source.filter(function (r) {
      if (filter.status !== 'all' && r.status !== filter.status) return false;
      if (!isTenant && filter.property !== 'all' && r.propertyId !== filter.property) return false;
      if (filter.search) {
        var hay = (r.code + ' ' + r.title + ' ' + r.description).toLowerCase();
        if (hay.indexOf(filter.search.toLowerCase()) === -1) return false;
      }
      return true;
    }).sort(function (a, b) {
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });

    var openCount = source.filter(function (r) { return r.status === 'open'; }).length;
    var progressCount = source.filter(function (r) { return r.status === 'in_progress'; }).length;
    var doneCount = source.filter(function (r) { return r.status === 'done'; }).length;

    var html = '<div class="page-head">' +
      '<div><h2>Laporan &amp; Permintaan</h2><p class="page-sub">' +
        (isTenant
          ? 'Sampaikan keluhan, permintaan perbaikan, atau kebutuhan terkait kamar Anda.'
          : 'Kelola laporan dan permintaan dari seluruh penyewa.') +
      '</p></div>' +
      '<button class="btn btn-primary" id="btn-add">' + KOL.icons.plus +
        (isTenant ? ' Buat Laporan' : ' Tambah Laporan') + '</button>' +
    '</div>';

    html += '<div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">' +
      '<div class="stat-card"><div class="stat-icon" style="background:#FEF3C7;color:#B45309">' +
        KOL.icons.alert + '</div><div class="stat-body">' +
        '<span class="stat-label">Laporan Baru</span>' +
        '<strong class="stat-value">' + openCount + '</strong>' +
        '<span class="stat-sub">menunggu ditangani</span></div></div>' +
      '<div class="stat-card"><div class="stat-icon" style="background:#CFFAFE;color:#0E7490">' +
        KOL.icons.tool + '</div><div class="stat-body">' +
        '<span class="stat-label">Diproses</span>' +
        '<strong class="stat-value">' + progressCount + '</strong>' +
        '<span class="stat-sub">sedang dikerjakan</span></div></div>' +
      '<div class="stat-card"><div class="stat-icon" style="background:#D1FAE5;color:#065F46">' +
        KOL.icons.bell + '</div><div class="stat-body">' +
        '<span class="stat-label">Selesai</span>' +
        '<strong class="stat-value">' + doneCount + '</strong>' +
        '<span class="stat-sub">laporan tuntas</span></div></div>' +
    '</div>';

    html += '<div class="filter-bar">' +
      '<select id="f-status">' + U.options([
        { value: 'all', label: 'Semua Status' },
        { value: 'open', label: 'Baru' },
        { value: 'in_progress', label: 'Diproses' },
        { value: 'done', label: 'Selesai' },
        { value: 'rejected', label: 'Ditolak' }
      ], filter.status) + '</select>' +
      (!isTenant
        ? '<select id="f-property">' + U.options(
            [{ value: 'all', label: 'Semua Properti' }].concat(
              properties.map(function (p) { return { value: p.id, label: p.name }; })
            ), filter.property) + '</select>'
        : '') +
      '<input type="text" id="f-search" placeholder="Cari kode / judul laporan..." value="' +
        U.escapeHTML(filter.search) + '">' +
      '<span class="filter-count">' + list.length + ' laporan</span>' +
    '</div>';

    if (!list.length) {
      html += '<div class="card">' + U.emptyState('Belum ada laporan.',
        isTenant ? 'Gunakan tombol Buat Laporan untuk menyampaikan keluhan.' : 'Laporan penyewa akan tampil di sini.') +
        '</div>';
    } else {
      html += '<div class="request-list">' + list.map(function (r) { return cardHtml(r); }).join('') + '</div>';
    }

    el.innerHTML = html;

    U.qs('#btn-add').addEventListener('click', function () { openForm(null); });
    U.qs('#f-status').addEventListener('change', function (e) { filter.status = e.target.value; render(el, role); });
    var propFilter = U.qs('#f-property');
    if (propFilter) propFilter.addEventListener('change', function (e) { filter.property = e.target.value; render(el, role); });
    U.qs('#f-search').addEventListener('input', function (e) { filter.search = e.target.value; render(el, role); });

    U.qsa('[data-respond]', el).forEach(function (b) {
      b.addEventListener('click', function () { respondForm(b.getAttribute('data-respond')); });
    });
    U.qsa('[data-edit]', el).forEach(function (b) {
      b.addEventListener('click', function () { openForm(b.getAttribute('data-edit')); });
    });
    U.qsa('[data-delete]', el).forEach(function (b) {
      b.addEventListener('click', function () { removeRequest(b.getAttribute('data-delete')); });
    });

    function cardHtml(r) {
      var t = DB.find('tenants', r.tenantId);
      var room = DB.roomById(r.roomId);
      var property = DB.propertyById(r.propertyId);
      var badge = BADGE[r.status] || 'badge-slate';
      return '<article class="request-card">' +
        '<div class="request-head">' +
          '<div>' +
            '<strong class="request-title">' + U.escapeHTML(r.title) + '</strong>' +
            '<div class="request-meta">' +
              '<span class="badge badge-indigo">' + U.escapeHTML(r.code) + '</span>' +
              '<span>' + U.escapeHTML(DB.L.requestCategory[r.category] || r.category) + '</span>' +
              '<span>·</span>' +
              '<span>' + U.escapeHTML(U.formatDateTime(r.createdAt)) + '</span>' +
              (!isTenant && t ? '<span>· ' + U.escapeHTML(t.name) + '</span>' : '') +
            '</div>' +
          '</div>' +
          '<div class="request-head-side">' +
            '<span class="badge ' + badge + '">' +
              U.escapeHTML(DB.L.requestStatus[r.status] || r.status) + '</span>' +
            '<span class="badge badge-slate">' +
              U.escapeHTML(DB.L.requestPriority[r.priority] || r.priority) + '</span>' +
          '</div>' +
        '</div>' +
        '<p class="request-desc">' + U.escapeHTML(r.description) + '</p>' +
        '<div class="request-foot">' +
          '<span class="request-room">' +
            (room ? '🚪 ' + U.escapeHTML(room.number) : '') +
            (property ? ' · ' + U.escapeHTML(property.name) : '') +
          '</span>' +
          '<div class="request-actions">' +
            (!isTenant
              ? '<button class="btn btn-primary btn-sm" data-respond="' + r.id + '">Tanggapi</button> ' +
                '<button class="btn btn-ghost btn-sm" data-edit="' + r.id + '">Edit</button> ' +
                '<button class="btn btn-danger-ghost btn-sm" data-delete="' + r.id + '">Hapus</button>'
              : '') +
          '</div>' +
        '</div>' +
        (r.response
          ? '<div class="request-response"><strong>Tanggapan pengelola:</strong> ' +
            U.escapeHTML(r.response) + '</div>'
          : '') +
      '</article>';
    }

    function openForm(id) {
      var r = id ? DB.find('requests', id) : null;
      if (id && !r) return;
      if (!r && !isTenant) {
        var activeTenants = DB.all('tenants').filter(function (t) { return DB.isTenantActive(t); });
        if (!activeTenants.length) { U.toast('Belum ada penyewa aktif', 'error'); return; }
      }

      var body = document.createElement('div');
      if (isTenant) {
        body.innerHTML =
          U.formField('Kategori', '<select name="category">' + U.options(DB.L.requestCategory, 'perbaikan') + '</select>') +
          U.formField('Prioritas', '<select name="priority">' + U.options(DB.L.requestPriority, 'normal') + '</select>') +
          U.formField('Judul Laporan', '<input type="text" name="title" maxlength="80" ' +
            'value="' + U.escapeHTML(r ? r.title : '') + '" placeholder="Contoh: AC kurang dingin">') +
          U.formField('Deskripsi', '<textarea name="description" rows="4" ' +
            'placeholder="Jelaskan kendala yang Anda alami...">' + U.escapeHTML(r ? r.description : '') + '</textarea>',
            'Sertakan lokasi/Detail bila perlu agar pengelola cepat menindaklanjuti.');
      } else {
        var active = DB.all('tenants').filter(function (t) {
          return DB.isTenantActive(t) || (r && t.id === r.tenantId);
        });
        body.innerHTML =
          U.formField('Penyewa', '<select name="tenantId">' + U.options(
            active.map(function (t) {
              var rm = DB.roomById(t.roomId);
              return { value: t.id, label: t.name + ' · ' + (rm ? rm.number : '-') };
            }), r ? r.tenantId : (active[0] || {}).id) + '</select>') +
          '<div class="form-row">' +
            U.formField('Kategori', '<select name="category">' + U.options(DB.L.requestCategory, r ? r.category : 'perbaikan') + '</select>') +
            U.formField('Prioritas', '<select name="priority">' + U.options(DB.L.requestPriority, r ? r.priority : 'normal') + '</select>') +
          '</div>' +
          U.formField('Judul Laporan', '<input type="text" name="title" value="' +
            U.escapeHTML(r ? r.title : '') + '" placeholder="Judul laporan">') +
          U.formField('Deskripsi', '<textarea name="description" rows="3">' +
            U.escapeHTML(r ? r.description : '') + '</textarea>') +
          U.formField('Status', '<select name="status">' + U.options(DB.L.requestStatus, r ? r.status : 'open') + '</select>');
      }

      U.openModal({
        title: r ? 'Edit Laporan' : (isTenant ? 'Buat Laporan Baru' : 'Tambah Laporan'),
        bodyNode: body,
        actions: [
          { label: 'Batal', class: 'btn-ghost', onClick: function (close) { close(); } },
          {
            label: 'Simpan', class: 'btn-primary',
            onClick: function (close) {
              var data = U.readForm(body);
              if (!data.title) { U.toast('Judul laporan wajib diisi', 'error'); return; }
              if (!data.description) { U.toast('Deskripsi laporan wajib diisi', 'error'); return; }
              try {
                if (r) {
                  DB.updateRequest(r.id, {
                    category: data.category, priority: data.priority,
                    title: data.title, description: data.description,
                    status: isTenant ? r.status : (data.status || r.status)
                  });
                  U.toast('Laporan diperbarui', 'success');
                } else {
                  var targetTenant = isTenant ? tenant.id : data.tenantId;
                  DB.createRequest({
                    tenantId: targetTenant, category: data.category,
                    priority: data.priority, title: data.title, description: data.description,
                    status: isTenant ? 'open' : (data.status || 'open')
                  });
                  U.toast('Laporan berhasil dikirim', 'success');
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

    function respondForm(id) {
      var r = DB.find('requests', id);
      if (!r) return;
      var body = document.createElement('div');
      body.innerHTML =
        '<div class="pay-summary">' +
          '<div class="bs-row"><span>' + U.escapeHTML(r.code) + '</span>' +
            '<span>' + U.escapeHTML(DB.L.requestCategory[r.category] || r.category) + '</span></div>' +
          '<strong>' + U.escapeHTML(r.title) + '</strong>' +
          '<p class="text-muted" style="margin-top:6px">' + U.escapeHTML(r.description) + '</p>' +
        '</div>' +
        U.formField('Status', '<select name="status">' + U.options(DB.L.requestStatus, r.status) + '</select>') +
        U.formField('Tanggapan untuk Penyewa', '<textarea name="response" rows="4" ' +
          'placeholder="Contoh: Teknisi dijadwalkan besok pukul 10.00.">' + U.escapeHTML(r.response || '') + '</textarea>');

      U.openModal({
        title: 'Tanggapi Laporan',
        bodyNode: body,
        actions: [
          { label: 'Batal', class: 'btn-ghost', onClick: function (close) { close(); } },
          {
            label: 'Simpan Tanggapan', class: 'btn-primary',
            onClick: function (close) {
              var data = U.readForm(body);
              try {
                DB.updateRequest(r.id, {
                  status: data.status, response: data.response,
                  respondedAt: new Date().toISOString()
                });
                U.toast('Tanggapan tersimpan & status diperbarui', 'success');
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

    function removeRequest(id) {
      var r = DB.find('requests', id);
      if (!r) return;
      U.confirmDialog('Hapus laporan "' + r.code + ' — ' + r.title + '"?', {
        danger: true, confirmLabel: 'Ya, Hapus'
      }).then(function (ok) {
        if (!ok) return;
        DB.remove('requests', id);
        U.toast('Laporan dihapus', 'success');
        render(el, role);
      });
    }
  }

  return { render: render };
})();
