/* ============================================================
   Kostantinopel — views/tenants.js
   ============================================================ */
window.KOL = window.KOL || {};
KOL.views = KOL.views || {};

KOL.views.tenants = (function () {
  'use strict';

  var filter = { property: 'all', status: 'active', search: '' };

  function render(el) {
    var U = KOL.utils, DB = KOL.db, AUTH = KOL.auth;
    var properties = DB.all('properties');
    var tenants = DB.all('tenants').filter(function (t) {
      if (filter.property !== 'all') {
        var room = DB.roomById(t.roomId);
        if (!room || room.propertyId !== filter.property) return false;
      }
      if (filter.status === 'active' && !DB.isTenantActive(t)) return false;
      if (filter.status === 'inactive' && t.status !== 'inactive') return false;
      if (filter.search) {
        var hay = (t.name + ' ' + (t.phone || '') + ' ' + (t.idNumber || '') + ' ' + (t.email || '')).toLowerCase();
        if (hay.indexOf(filter.search.toLowerCase()) === -1) return false;
      }
      return true;
    }).sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });

    var propOpts = [{ value: 'all', label: 'Semua Properti' }].concat(
      properties.map(function (p) { return { value: p.id, label: p.name }; })
    );

    var html = '<div class="page-head">' +
      '<div><h2>Penyewa</h2><p class="page-sub">Kelola penghuni kost/kontrakan dan pelanggan sewa unit.</p></div>' +
      '<button class="btn btn-primary" id="btn-add">' + KOL.icons.plus + ' Tambah Penyewa</button>' +
    '</div>';

    html += '<div class="filter-bar">' +
      '<select id="f-property">' + U.options(propOpts, filter.property) + '</select>' +
      '<select id="f-status">' + U.options([
        { value: 'active', label: 'Aktif' },
        { value: 'inactive', label: 'Selesai' },
        { value: 'all', label: 'Semua Status' }
      ], filter.status) + '</select>' +
      '<input type="text" id="f-search" placeholder="Cari nama / telepon / KTP / email..." value="' + U.escapeHTML(filter.search) + '">' +
      '<span class="filter-count">' + tenants.length + ' penyewa</span>' +
    '</div>';

    if (!tenants.length) {
      html += '<div class="card">' + U.emptyState('Tidak ada penyewa yang cocok.', 'Ubah filter atau tambahkan penyewa baru.') + '</div>';
    } else {
      html += '<div class="card"><div class="card-body no-pad"><table class="table">' +
        '<thead><tr><th>Penyewa</th><th>Kamar</th><th>Tanggal Masuk</th><th>Status</th><th>Akun</th><th class="ta-right">Aksi</th></tr></thead>' +
        '<tbody>' + tenants.map(rowHtml).join('') + '</tbody>' +
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
    U.qsa('[data-bill]', el).forEach(function (b) {
      b.addEventListener('click', function () { billForm(b.getAttribute('data-bill')); });
    });
    U.qsa('[data-end]', el).forEach(function (b) {
      b.addEventListener('click', function () { endTenancy(b.getAttribute('data-end')); });
    });
    U.qsa('[data-account]', el).forEach(function (b) {
      b.addEventListener('click', function () { accountForm(b.getAttribute('data-account')); });
    });
    U.qsa('[data-delete]', el).forEach(function (b) {
      b.addEventListener('click', function () { removeTenant(b.getAttribute('data-delete')); });
    });

    function rowHtml(t) {
      var room = DB.roomById(t.roomId);
      var active = DB.isTenantActive(t);
      var account = DB.tenantAccount(t.id);
      return '<tr>' +
        '<td><div class="cell-main"><strong>' + U.escapeHTML(t.name) + '</strong>' +
          '<span>' + U.escapeHTML(t.phone || '-') + (t.email ? ' · ' + U.escapeHTML(t.email) : '') +
          (t.idNumber ? ' · KTP ' + U.escapeHTML(t.idNumber) : '') + '</span></div></td>' +
        '<td class="cell-muted">' + U.escapeHTML(room ? (room.number + ' · ' + (room.type || '')) : '-') + '</td>' +
        '<td>' + U.formatDate(t.startDate) + (t.endDate ? ' → ' + U.formatDate(t.endDate) : '') + '</td>' +
        '<td><span class="badge ' + (active ? 'badge-green' : 'badge-slate') + '">' +
          U.escapeHTML(active ? DB.L.tenantStatus.active : DB.L.tenantStatus.inactive) + '</span></td>' +
        '<td><span class="badge ' + (account ? 'badge-indigo' : 'badge-slate') + '">' +
          (account ? 'Aktif' : 'Belum ada') + '</span></td>' +
        '<td class="ta-right">' +
          '<button class="btn btn-ghost btn-sm" data-account="' + t.id + '">Akun</button> ' +
          '<button class="btn btn-ghost btn-sm" data-bill="' + t.id + '">Tagihan</button> ' +
          (active ? '<button class="btn btn-ghost btn-sm" data-end="' + t.id + '">Akhiri Sewa</button> ' : '') +
          '<button class="btn btn-ghost btn-sm" data-edit="' + t.id + '">Edit</button> ' +
          '<button class="btn btn-danger-ghost btn-sm" data-delete="' + t.id + '">Hapus</button>' +
        '</td>' +
      '</tr>';
    }

    function roomOptions(propertyId, selectedRoomId) {
      var rooms = DB.all('rooms').filter(function (r) { return r.propertyId === propertyId; });
      var opts = rooms.map(function (r) {
        var st = DB.roomEffectiveStatus(r);
        var label = r.number + ' — ' + (r.type || '') + ' (' + U.formatIDR(r.priceMonthly) + '/bln)' +
          (st === 'occupied' ? ' · TERISI' : '') + (st === 'maintenance' ? ' · PERAWATAN' : '');
        return { value: r.id, label: label };
      });
      return U.options(opts, selectedRoomId);
    }

    function openForm(id) {
      var t = id ? DB.find('tenants', id) : null;
      var properties2 = DB.all('properties');
      if (!properties2.length) {
        U.toast('Tambahkan properti dan kamar terlebih dahulu', 'error');
        return;
      }
      var propertyId = t ? (DB.roomById(t.roomId) || {}).propertyId : properties2[0].id;
      var body = document.createElement('div');
      body.innerHTML =
        U.formField('Nama Lengkap', '<input type="text" name="name" value="' + U.escapeHTML(t ? t.name : '') + '" placeholder="Nama penyewa" required>') +
        '<div class="form-row">' +
          U.formField('Telepon', '<input type="text" name="phone" value="' + U.escapeHTML(t ? (t.phone || '') : '') + '" placeholder="08xx">') +
          U.formField('No. KTP', '<input type="text" name="idNumber" value="' + U.escapeHTML(t ? (t.idNumber || '') : '') + '" placeholder="Opsional">') +
        '</div>' +
        '<div class="form-row">' +
          U.formField('Jenis Kelamin', '<select name="gender">' + U.options([
            { value: '', label: 'Pilih…' },
            { value: 'Laki-laki', label: 'Laki-laki' },
            { value: 'Perempuan', label: 'Perempuan' }
          ], t ? (t.gender || '') : '') + '</select>') +
          U.formField('Tanggal Lahir', '<input type="date" name="birthDate" value="' + U.escapeHTML(t ? (t.birthDate || '') : '') + '">') +
        '</div>' +
        '<div class="form-row">' +
          U.formField('Email', '<input type="email" name="email" value="' + U.escapeHTML(t ? (t.email || '') : '') + '" placeholder="nama@email.com">') +
          U.formField('Pekerjaan', '<input type="text" name="occupation" value="' + U.escapeHTML(t ? (t.occupation || '') : '') + '" placeholder="Mahasiswa / Karyawan">') +
        '</div>' +
        U.formField('Alamat Asal', '<textarea name="address" rows="2" placeholder="Alamat sesuai KTP">' + U.escapeHTML(t ? (t.address || '') : '') + '</textarea>') +
        '<div class="form-row">' +
          U.formField('Kontak Darurat', '<input type="text" name="emergencyName" value="' + U.escapeHTML(t ? (t.emergencyName || '') : '') + '" placeholder="Nama kerabat">') +
          U.formField('Telepon Darurat', '<input type="text" name="emergencyPhone" value="' + U.escapeHTML(t ? (t.emergencyPhone || '') : '') + '" placeholder="08xx">') +
        '</div>' +
        '<div class="form-row">' +
          U.formField('Properti', '<select name="propertyId">' + U.options(
            properties2.map(function (p) { return { value: p.id, label: p.name }; }), propertyId
          ) + '</select>') +
          U.formField('Kamar', '<select name="roomId">' + roomOptions(propertyId, t ? t.roomId : null) + '</select>') +
        '</div>' +
        '<div class="form-row">' +
          U.formField('Tanggal Masuk', '<input type="date" name="startDate" value="' + (t ? t.startDate : U.todayISO()) + '" required>') +
          U.formField('Tanggal Keluar', '<input type="date" name="endDate" value="' + (t ? (t.endDate || '') : '') + '">') +
        '</div>' +
        U.formField('Catatan', '<textarea name="note" rows="2" placeholder="Opsional">' + U.escapeHTML(t ? (t.note || '') : '') + '</textarea>');

      var modal = U.openModal({
        title: t ? 'Edit Penyewa' : 'Tambah Penyewa',
        bodyNode: body,
        actions: [
          { label: 'Batal', class: 'btn-ghost', onClick: function (close) { close(); } },
          {
            label: 'Simpan', class: 'btn-primary',
            onClick: function (close) {
              var data = U.readForm(body);
              if (!data.name) { U.toast('Nama penyewa wajib diisi', 'error'); return; }
              if (!data.startDate) { U.toast('Tanggal masuk wajib diisi', 'error'); return; }
              if (!data.roomId) { U.toast('Pilih kamar', 'error'); return; }
              try {
                if (t) {
                  DB.update('tenants', t.id, {
                    name: data.name, phone: data.phone, idNumber: data.idNumber,
                    email: data.email, address: data.address, birthDate: data.birthDate,
                    gender: data.gender, occupation: data.occupation,
                    emergencyName: data.emergencyName, emergencyPhone: data.emergencyPhone,
                    propertyId: (DB.roomById(data.roomId) || {}).propertyId || t.propertyId,
                    roomId: data.roomId, startDate: data.startDate,
                    endDate: data.endDate || null, note: data.note
                  });
                  var account = DB.tenantAccount(t.id);
                  if (account) DB.update('users', account.id, { name: data.name });
                  U.toast('Data penyewa diperbarui', 'success');
                } else {
                  DB.createTenant(data);
                  U.toast('Penyewa ditambahkan & tagihan pertama dibuat', 'success');
                }
                close();
                render(el);
              } catch (err) {
                U.toast(err.message, 'error');
              }
            }
          }
        ]
      });

      var propSelect = body.querySelector('[name="propertyId"]');
      propSelect.addEventListener('change', function () {
        body.querySelector('[name="roomId"]').innerHTML = roomOptions(propSelect.value, null);
      });
    }

    function billForm(id) {
      var t = DB.find('tenants', id);
      if (!t) return;
      var room = DB.roomById(t.roomId);
      var body = document.createElement('div');
      body.innerHTML =
        U.formField('Deskripsi', '<input type="text" name="description" value="Sewa kamar ' + U.escapeHTML(room ? room.number : '') + ' — ' + U.escapeHTML(U.monthLabel(U.currentMonthKey())) + '">') +
        '<div class="form-row">' +
          U.formField('Jumlah (Rp)', '<input type="number" name="amount" min="0" step="1000" value="' + (room ? room.priceMonthly : 0) + '">') +
          U.formField('Jatuh Tempo', '<input type="date" name="dueDate" value="' + U.todayISO() + '">') +
        '</div>';

      U.openModal({
        title: 'Buat Tagihan — ' + t.name,
        bodyNode: body,
        actions: [
          { label: 'Batal', class: 'btn-ghost', onClick: function (close) { close(); } },
          {
            label: 'Buat Tagihan', class: 'btn-primary',
            onClick: function (close) {
              var data = U.readForm(body);
              if (!data.amount) { U.toast('Jumlah tagihan wajib diisi', 'error'); return; }
              DB.createInvoice({
                tenantId: t.id, roomId: t.roomId, propertyId: t.propertyId,
                description: data.description, amount: data.amount, dueDate: data.dueDate
              });
              U.toast('Tagihan berhasil dibuat', 'success');
              close();
              render(el);
            }
          }
        ]
      });
    }

    function accountForm(id) {
      var t = DB.find('tenants', id);
      if (!t) return;
      var account = DB.tenantAccount(t.id);
      var body = document.createElement('div');

      if (account) {
        body.innerHTML =
          '<div class="pay-summary">' +
            '<div class="bs-row"><span>Akun login aktif</span>' +
              '<span class="badge badge-indigo">Penyewa</span></div>' +
            '<strong>' + U.escapeHTML(account.email) + '</strong>' +
            '<p class="text-muted" style="margin-top:6px">Penyewa memakai email ini untuk masuk ke portal penyewa.</p>' +
          '</div>' +
          '<div class="info-grid">' +
            '<div class="info-item"><span>Nama Akun</span><strong>' + U.escapeHTML(account.name) + '</strong></div>' +
            '<div class="info-item"><span>Data Penyewa</span><strong>' + U.escapeHTML(t.name) + '</strong></div>' +
          '</div>' +
          '<p class="text-muted" style="margin-top:14px">Jika penyewa lupa password, atur ulang password dari sini.</p>';

        U.openModal({
          title: 'Akun Penyewa — ' + t.name,
          bodyNode: body,
          actions: [
            { label: 'Tutup', class: 'btn-ghost', onClick: function (close) { close(); } },
            {
              label: 'Hapus Akun', class: 'btn-danger',
              onClick: function (close) {
                close();
                setTimeout(function () {
                  U.confirmDialog('Hapus akun login "' + account.email + '"? Penyewa tidak akan bisa masuk lagi.', {
                    danger: true, confirmLabel: 'Ya, Hapus'
                  }).then(function (ok) {
                    if (!ok) return;
                    AUTH.removeTenantLogin(t.id);
                    U.toast('Akun login penyewa dihapus', 'success');
                    render(el);
                  });
                }, 170);
              }
            },
            {
              label: 'Reset Password', class: 'btn-primary',
              onClick: function (close) {
                close();
                setTimeout(function () { resetPwForm(t); }, 170);
              }
            }
          ]
        });
        return;
      }

      body.innerHTML =
        '<p class="text-muted" style="margin-bottom:14px">Buat akun login agar ' + U.escapeHTML(t.name) +
          ' dapat mengakses portal penyewa (pembayaran, kamar, identitas, laporan, pengumuman).</p>' +
        U.formField('Email Login', '<input type="email" name="email" value="' +
          U.escapeHTML(t.email || '') + '" placeholder="nama@email.com">') +
        U.formField('Password Awal', '<input type="password" name="password" autocomplete="new-password" ' +
          'placeholder="Minimal 6 karakter">', 'Berikan email dan password ini kepada penyewa.');

      U.openModal({
        title: 'Buat Akun Penyewa — ' + t.name,
        bodyNode: body,
        actions: [
          { label: 'Batal', class: 'btn-ghost', onClick: function (close) { close(); } },
          {
            label: 'Buat Akun', class: 'btn-primary',
            onClick: function (close) {
              var data = U.readForm(body);
              AUTH.createTenantLogin(t.id, data.email, data.password).then(function (res) {
                if (!res.ok) { U.toast(res.error, 'error'); return; }
                U.toast('Akun penyewa berhasil dibuat', 'success');
                close();
                render(el);
              });
            }
          }
        ]
      });
    }

    function resetPwForm(t) {
      var body = document.createElement('div');
      body.innerHTML =
        U.formField('Password Baru', '<input type="password" name="password" autocomplete="new-password" ' +
          'placeholder="Minimal 6 karakter">') +
        U.formField('Ulangi Password', '<input type="password" name="confirm" autocomplete="new-password">');

      U.openModal({
        title: 'Reset Password — ' + t.name,
        bodyNode: body,
        actions: [
          { label: 'Batal', class: 'btn-ghost', onClick: function (close) { close(); } },
          {
            label: 'Simpan Password', class: 'btn-primary',
            onClick: function (close) {
              var data = U.readForm(body);
              if (data.password !== data.confirm) { U.toast('Ulangi password tidak cocok', 'error'); return; }
              AUTH.resetTenantPassword(t.id, data.password).then(function (res) {
                if (!res.ok) { U.toast(res.error, 'error'); return; }
                U.toast('Password penyewa diperbarui', 'success');
                close();
              });
            }
          }
        ]
      });
    }

    function endTenancy(id) {
      var t = DB.find('tenants', id);
      if (!t) return;
      U.confirmDialog('Akhiri sewa "' + t.name + '"? Kamar akan berstatus tersedia kembali.', {
        confirmLabel: 'Ya, Akhiri'
      }).then(function (ok) {
        if (!ok) return;
        try {
          DB.endTenancy(id);
          U.toast('Sewa diakhiri', 'success');
          render(el);
        } catch (err) {
          U.toast(err.message, 'error');
        }
      });
    }

    function removeTenant(id) {
      var t = DB.find('tenants', id);
      if (!t) return;
      if (DB.tenantAccount(id)) {
        U.toast('Hapus akun login penyewa terlebih dahulu melalui tombol "Akun".', 'error');
        return;
      }
      var hasInvoice = DB.all('invoices').some(function (i) { return i.tenantId === id; });
      if (hasInvoice) {
        U.toast('Penyewa memiliki riwayat tagihan dan tidak dapat dihapus.', 'error');
        return;
      }
      U.confirmDialog('Hapus data penyewa "' + t.name + '"?', { danger: true, confirmLabel: 'Ya, Hapus' }).then(function (ok) {
        if (!ok) return;
        DB.remove('tenants', id);
        U.toast('Penyewa dihapus', 'success');
        render(el);
      });
    }
  }

  return { render: render };
})();
