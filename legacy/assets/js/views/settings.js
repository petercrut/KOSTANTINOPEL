/* ============================================================
   Kostantinopel — views/settings.js
   Pengaturan akun (admin) / akun penyewa (tenant).
   ============================================================ */
window.KOL = window.KOL || {};
KOL.views = KOL.views || {};

KOL.views.settings = (function () {
  'use strict';

  function render(el, role) {
    var U = KOL.utils, DB = KOL.db, AUTH = KOL.auth;
    var user = AUTH.currentUser();
    var isTenant = role === 'tenant';
    var tenant = isTenant ? AUTH.tenantProfile() : null;
    var info = DB.storageInfo();

    if (!user) { window.location.href = 'login.html'; return; }

    var room = tenant ? DB.roomById(tenant.roomId) : null;
    var property = room ? DB.propertyById(room.propertyId) : null;

    var html = '<div class="page-head">' +
      '<div><h2>' + (isTenant ? 'Akun Saya' : 'Pengaturan') + '</h2>' +
      '<p class="page-sub">' + (isTenant
        ? 'Kelola profil, keamanan, dan preferensi tampilan Anda.'
        : 'Profil, keamanan, dan data aplikasi.') + '</p></div>' +
    '</div>';

    html += '<div class="grid-2 settings-grid">' +

      '<div class="card"><div class="card-head"><h3>Profil</h3></div><div class="card-body">' +
        U.formField('Nama Lengkap', '<input type="text" id="profile-name" value="' + U.escapeHTML(user.name) + '">') +
        U.formField('Email Login', '<input type="email" id="profile-email" value="' + U.escapeHTML(user.email) + '">',
          isTenant ? 'Email ini dipakai untuk masuk ke portal penyewa.' : '') +
        '<button class="btn btn-primary" id="btn-save-profile">Simpan Profil</button>' +
      '</div></div>' +

      '<div class="card"><div class="card-head"><h3>Tampilan</h3></div><div class="card-body">' +
        '<div class="theme-setting">' +
          '<div><strong>Mode Gelap</strong>' +
          '<span class="theme-mode">Tema saat ini: <span data-theme-label>Terang</span></span></div>' +
          '<button class="theme-switch" type="button" data-theme-toggle role="switch" aria-checked="false" aria-label="Mode gelap" title="Ubah mode terang/gelap">' +
            '<span class="ts-track">' +
              '<svg class="ts-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' +
              '<svg class="ts-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>' +
              '<span class="ts-knob"></span>' +
            '</span>' +
          '</button>' +
        '</div>' +
        '<p class="text-muted" style="margin-top:14px">Pilihan tema tersimpan di browser ini dan diterapkan ' +
        'ke seluruh halaman (landing, login, dan panel).</p>' +
      '</div></div>' +

      '<div class="card"><div class="card-head"><h3>Keamanan</h3></div><div class="card-body">' +
        U.formField('Password Saat Ini', '<input type="password" id="pw-current" autocomplete="current-password">') +
        U.formField('Password Baru', '<input type="password" id="pw-new" autocomplete="new-password">', 'Minimal 6 karakter') +
        U.formField('Ulangi Password Baru', '<input type="password" id="pw-confirm" autocomplete="new-password">') +
        '<button class="btn btn-primary" id="btn-change-pw">Ubah Password</button>' +
      '</div></div>' +

      (isTenant
        ? '<div class="card"><div class="card-head"><h3>Data Sewa</h3></div><div class="card-body">' +
            (tenant
              ? '<div class="info-grid">' +
                  '<div class="info-item"><span>Nama Penyewa</span><strong>' + U.escapeHTML(tenant.name) + '</strong></div>' +
                  '<div class="info-item"><span>Kamar</span><strong>' + U.escapeHTML(room ? room.number : '-') + '</strong></div>' +
                  '<div class="info-item"><span>Properti</span><strong>' + U.escapeHTML(property ? property.name : '-') + '</strong></div>' +
                  '<div class="info-item"><span>Status</span><strong>' + (DB.isTenantActive(tenant) ? 'Aktif' : 'Selesai') + '</strong></div>' +
                '</div>' +
                '<p class="text-muted" style="margin-top:12px">Untuk memperbarui data diri, buka menu ' +
                '<a class="card-link" href="#/identity">Identitas</a>.</p>'
              : U.emptyState('Akun belum terhubung ke data penyewa.', 'Hubungi pengelola properti Anda.')) +
          '</div></div>'
        : '<div class="card"><div class="card-head"><h3>Data Aplikasi</h3></div><div class="card-body">' +
            '<p class="text-muted">Penyimpanan lokal: <strong>' + info.kb + ' KB</strong> · ' +
            'Dibuat ' + U.formatDateTime(info.seededAt) + '</p>' +
            '<div class="btn-row">' +
              '<button class="btn btn-ghost" id="btn-export">⬇ Cadangkan (JSON)</button>' +
              '<label class="btn btn-ghost" for="file-import">⬆ Pulihkan</label>' +
              '<input type="file" id="file-import" accept="application/json" hidden>' +
            '</div>' +
            '<hr class="sep">' +
            '<p class="text-muted">Reset akan mengembalikan seluruh data ke kondisi demo awal. ' +
            'Anda akan keluar dari sesi ini.</p>' +
            '<button class="btn btn-danger" id="btn-reset">Reset ke Data Demo</button>' +
          '</div></div>') +

      '<div class="card"><div class="card-head"><h3>Tentang</h3></div><div class="card-body">' +
        '<p><strong>Kostantinopel</strong> <span class="badge badge-indigo">v1.0</span></p>' +
        '<p class="text-muted" style="margin-top:8px">Sistem manajemen co-living untuk kost, kontrakan, ' +
        'apartemen, dan hotel.</p>' +
        '<p class="text-muted" style="margin-top:8px">Aplikasi berjalan sepenuhnya di browser Anda. ' +
        'Data tersimpan lokal (localStorage) dan tidak dikirim ke server mana pun.</p>' +
      '</div></div>' +

    '</div>';

    el.innerHTML = html;
    if (KOL.theme) KOL.theme.mount();

    U.qs('#btn-save-profile').addEventListener('click', function () {
      var name = U.qs('#profile-name').value.trim();
      var email = U.qs('#profile-email').value.trim();
      if (!name) { U.toast('Nama wajib diisi', 'error'); return; }
      if (!email || email.indexOf('@') === -1) { U.toast('Email tidak valid', 'error'); return; }
      var res = AUTH.updateProfile({ name: name, email: email });
      if (res && res.ok === false) { U.toast(res.error || 'Gagal menyimpan profil', 'error'); return; }
      if (isTenant && tenant) DB.update('tenants', tenant.id, { name: name });
      U.toast('Profil disimpan', 'success');
      if (KOL.app.refreshUser) KOL.app.refreshUser();
      render(el, role);
    });

    U.qs('#btn-change-pw').addEventListener('click', function () {
      var current = U.qs('#pw-current').value;
      var next = U.qs('#pw-new').value;
      var confirm = U.qs('#pw-confirm').value;
      if (!current || !next) { U.toast('Lengkapi semua kolom password', 'error'); return; }
      if (next.length < 6) { U.toast('Password baru minimal 6 karakter', 'error'); return; }
      if (next !== confirm) { U.toast('Ulangi password tidak cocok', 'error'); return; }
      AUTH.changePassword(current, next).then(function (res) {
        if (!res.ok) { U.toast(res.error, 'error'); return; }
        U.toast('Password berhasil diubah', 'success');
        U.qs('#pw-current').value = '';
        U.qs('#pw-new').value = '';
        U.qs('#pw-confirm').value = '';
      });
    });

    var exportBtn = U.qs('#btn-export');
    if (exportBtn) exportBtn.addEventListener('click', function () {
      U.downloadFile('kostantinopel-backup-' + U.todayISO() + '.json', DB.exportBackup(), 'application/json');
      U.toast('Cadangan diunduh', 'success');
    });

    var importInput = U.qs('#file-import');
    if (importInput) importInput.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          DB.importBackup(reader.result);
          U.toast('Data berhasil dipulihkan', 'success');
          setTimeout(function () { location.reload(); }, 700);
        } catch (err) {
          U.toast(err.message, 'error');
        }
      };
      reader.readAsText(file);
    });

    var resetBtn = U.qs('#btn-reset');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      U.confirmDialog('Seluruh data akan dikembalikan ke kondisi demo awal dan Anda akan keluar. Lanjutkan?', {
        danger: true, confirmLabel: 'Ya, Reset'
      }).then(function (ok) {
        if (!ok) return;
        DB.reset();
        U.toast('Data demo dipulihkan', 'success');
        setTimeout(function () { window.location.href = 'login.html'; }, 600);
      });
    });
  }

  return { render: render };
})();
