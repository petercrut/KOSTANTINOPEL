/* ============================================================
   Kostantinopel — views/identity.js
   Form identitas penyewa (data diri & kontak darurat).
   ============================================================ */
window.KOL = window.KOL || {};
KOL.views = KOL.views || {};

KOL.views.identity = (function () {
  'use strict';

  var GENDERS = ['Laki-laki', 'Perempuan'];

  function render(el) {
    var U = KOL.utils, DB = KOL.db, AUTH = KOL.auth;
    var user = AUTH.currentUser();
    var tenant = AUTH.tenantProfile();

    if (!tenant) {
      el.innerHTML = '<div class="page-head"><div><h2>Identitas</h2></div></div>' +
        '<div class="card">' + U.emptyState('Akun Anda belum terhubung ke data penyewa.',
          'Hubungi pengelola properti untuk menautkan akun Anda.') + '</div>';
      return;
    }

    var room = DB.roomById(tenant.roomId);
    var property = room ? DB.propertyById(room.propertyId) : null;

    var fields = ['name', 'phone', 'idNumber', 'email', 'address', 'birthDate',
      'gender', 'occupation', 'emergencyName', 'emergencyPhone'];
    var filled = fields.filter(function (k) { return String(tenant[k] || '').trim(); }).length;
    var percent = Math.round((filled / fields.length) * 100);

    var html = '<div class="page-head">' +
      '<div><h2>Identitas</h2><p class="page-sub">Lengkapi data diri dan kontak darurat Anda.</p></div>' +
      '<span class="badge ' + (percent === 100 ? 'badge-paid' : 'badge-pending') + '">' +
        percent + '% lengkap</span>' +
    '</div>';

    html += '<div class="grid-2">' +

      '<div class="card"><div class="card-head"><h3>Data Diri</h3></div><div class="card-body">' +
        '<div class="form-row">' +
          U.formField('Nama Lengkap', '<input type="text" name="name" value="' +
            U.escapeHTML(tenant.name) + '" placeholder="Nama sesuai KTP">') +
          U.formField('No. KTP', '<input type="text" name="idNumber" value="' +
            U.escapeHTML(tenant.idNumber || '') + '" placeholder="16 digit">') +
        '</div>' +
        '<div class="form-row">' +
          U.formField('Jenis Kelamin', '<select name="gender">' +
            '<option value="">Pilih…</option>' + U.options(GENDERS, tenant.gender || '') + '</select>') +
          U.formField('Tanggal Lahir', '<input type="date" name="birthDate" value="' +
            U.escapeHTML(tenant.birthDate || '') + '">') +
        '</div>' +
        U.formField('Pekerjaan', '<input type="text" name="occupation" value="' +
          U.escapeHTML(tenant.occupation || '') + '" placeholder="Mahasiswa / Karyawan / dll.">') +
        U.formField('Alamat Asal', '<textarea name="address" rows="2" placeholder="Alamat sesuai KTP">' +
          U.escapeHTML(tenant.address || '') + '</textarea>') +
      '</div></div>' +

      '<div class="card"><div class="card-head"><h3>Kontak</h3></div><div class="card-body">' +
        U.formField('Nomor Telepon / WhatsApp', '<input type="text" name="phone" value="' +
          U.escapeHTML(tenant.phone || '') + '" placeholder="08xx">') +
        U.formField('Email', '<input type="email" name="email" value="' +
          U.escapeHTML(tenant.email || '') + '" placeholder="nama@email.com">',
          'Email kontak untuk menerima informasi dari pengelola.') +
        U.formField('Nama Kontak Darurat', '<input type="text" name="emergencyName" value="' +
          U.escapeHTML(tenant.emergencyName || '') + '" placeholder="Nama keluarga / kerabat">') +
        U.formField('Telepon Kontak Darurat', '<input type="text" name="emergencyPhone" value="' +
          U.escapeHTML(tenant.emergencyPhone || '') + '" placeholder="08xx">') +
      '</div></div>' +

    '</div>';

    html += '<div class="card"><div class="card-body identity-foot">' +
      '<div class="identity-note">' +
        '<strong>Data Anda aman &amp; hanya dilihat pengelola</strong>' +
        '<span>Informasi ini dipakai untuk administrasi sewa dan keperluan darurat. ' +
        'Perubahan langsung tersimpan pada profil penyewa Anda.</span>' +
      '</div>' +
      '<button class="btn btn-primary" id="btn-save-identity">Simpan Identitas</button>' +
    '</div></div>';

    html += '<div class="card"><div class="card-head"><h3>Ringkasan Akun</h3></div><div class="card-body">' +
      '<div class="info-grid">' +
        '<div class="info-item"><span>Email Login</span><strong>' + U.escapeHTML(user.email) + '</strong></div>' +
        '<div class="info-item"><span>Kamar</span><strong>' + U.escapeHTML(room ? room.number : '-') + '</strong></div>' +
        '<div class="info-item"><span>Properti</span><strong>' + U.escapeHTML(property ? property.name : '-') + '</strong></div>' +
        '<div class="info-item"><span>Status Sewa</span><strong>' +
          (DB.isTenantActive(tenant) ? 'Aktif' : 'Selesai') + '</strong></div>' +
      '</div>' +
      '<p class="text-muted" style="margin-top:12px">Ubah email login dan password melalui menu ' +
        '<a class="card-link" href="#/settings">Akun</a>.</p>' +
    '</div></div>';

    el.innerHTML = html;

    U.qs('#btn-save-identity').addEventListener('click', function () {
      var data = U.readForm(el);
      if (!data.name) { U.toast('Nama lengkap wajib diisi', 'error'); return; }
      if (data.email && data.email.indexOf('@') === -1) { U.toast('Format email tidak valid', 'error'); return; }
      if (data.idNumber && !/^[0-9]{8,20}$/.test(data.idNumber.replace(/\s/g, ''))) {
        U.toast('Nomor KTP harus berupa angka (8–20 digit)', 'error');
        return;
      }
      try {
        DB.update('tenants', tenant.id, {
          name: data.name, phone: data.phone, idNumber: data.idNumber,
          email: data.email, address: data.address, birthDate: data.birthDate,
          gender: data.gender, occupation: data.occupation,
          emergencyName: data.emergencyName, emergencyPhone: data.emergencyPhone
        });
        DB.update('users', user.id, { name: data.name });
        if (KOL.app.refreshUser) KOL.app.refreshUser();
        U.toast('Identitas berhasil disimpan', 'success');
        render(el);
      } catch (err) {
        U.toast(err.message, 'error');
      }
    });
  }

  return { render: render };
})();
