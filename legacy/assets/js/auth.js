/* ============================================================
   Kostantinopel — auth.js
   Autentikasi berbasis sesi (localStorage) + hash password.
   Catatan: ini demo front-end; untuk produksi gunakan backend.
   ============================================================ */
window.KOL = window.KOL || {};

KOL.auth = (function () {
  'use strict';

  var U = KOL.utils;
  var DB = KOL.db;
  var SESSION_DAYS = 7;

  function hashPassword(password, salt) {
    salt = salt || U.randomSalt();
    if (window.crypto && window.crypto.subtle && window.isSecureContext) {
      var encoder = new TextEncoder();
      return window.crypto.subtle.digest('SHA-256', encoder.encode(salt + ':' + password)).then(function (buf) {
        var hex = Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
        return 's1$' + salt + '$' + hex;
      });
    }
    return Promise.resolve('s0$' + salt + '$' + U.cyrb53(salt + ':' + password));
  }

  function verifyPassword(password, stored) {
    stored = String(stored || '');
    var parts = stored.split('$');
    if (parts[0] === 's1') {
      return hashPassword(password, parts[1]).then(function (h) { return h === stored; });
    }
    return Promise.resolve('s0$' + parts[1] + '$' + U.cyrb53(parts[1] + ':' + password) === stored);
  }

  function getSessionUser() {
    DB.init();
    var s = DB.getSession();
    if (!s || !s.expiresAt || s.expiresAt < Date.now()) return null;
    return DB.find('users', s.userId);
  }

  function isLoggedIn() { return !!getSessionUser(); }
  function currentUser() { return getSessionUser(); }

  function role() {
    var user = currentUser();
    return user && user.role === 'tenant' ? 'tenant' : 'admin';
  }
  function isAdmin() { return role() === 'admin'; }
  function isTenant() { return role() === 'tenant'; }

  function tenantProfile() {
    var user = currentUser();
    if (!user || user.role !== 'tenant' || !user.tenantId) return null;
    return DB.find('tenants', user.tenantId);
  }

  function login(email, password) {
    DB.init();
    var user = DB.all('users').find(function (u) {
      return u.email.toLowerCase() === String(email || '').toLowerCase();
    });
    if (!user) return Promise.resolve({ ok: false, error: 'Email atau password salah' });
    return verifyPassword(password, user.passwordHash).then(function (match) {
      if (!match) return { ok: false, error: 'Email atau password salah' };
      DB.setSession({ userId: user.id, token: U.uid('sess'), expiresAt: Date.now() + SESSION_DAYS * 24 * 3600 * 1000 });
      return { ok: true, role: user.role === 'tenant' ? 'tenant' : 'admin' };
    });
  }

  function register(data) {
    DB.init();
    var email = String(data.email || '').toLowerCase().trim();
    var role = data.role === 'tenant' ? 'tenant' : 'admin';
    var exists = DB.all('users').some(function (u) { return u.email.toLowerCase() === email; });
    if (exists) return Promise.resolve({ ok: false, error: 'Email sudah terdaftar. Silakan masuk.' });
    return hashPassword(data.password).then(function (hash) {
      if (role === 'tenant') {
        var tenant = DB.all('tenants').find(function (t) {
          return String(t.email || '').toLowerCase() === email && t.status === 'active';
        });
        if (!tenant) {
          return { ok: false, error: 'Email belum terdaftar sebagai penyewa. Hubungi pengelola properti Anda.' };
        }
        if (DB.tenantAccount(tenant.id)) {
          return { ok: false, error: 'Akun penyewa untuk email ini sudah dibuat. Silakan masuk.' };
        }
        var tenantUser = DB.insert('users', {
          name: tenant.name, email: email, passwordHash: hash,
          role: 'tenant', tenantId: tenant.id
        });
        DB.setSession({ userId: tenantUser.id, token: U.uid('sess'), expiresAt: Date.now() + SESSION_DAYS * 24 * 3600 * 1000 });
        return { ok: true, role: 'tenant' };
      }
      var user = DB.insert('users', { name: data.name, email: email, passwordHash: hash, role: 'admin' });
      DB.setSession({ userId: user.id, token: U.uid('sess'), expiresAt: Date.now() + SESSION_DAYS * 24 * 3600 * 1000 });
      return { ok: true, role: 'admin' };
    });
  }

  /* Buat akun login untuk penyewa (dipakai admin dari menu Penyewa) */
  function createTenantLogin(tenantId, email, password) {
    DB.init();
    var tenant = DB.find('tenants', tenantId);
    if (!tenant) return Promise.resolve({ ok: false, error: 'Data penyewa tidak ditemukan' });
    email = String(email || '').toLowerCase().trim();
    if (!email || email.indexOf('@') === -1) return Promise.resolve({ ok: false, error: 'Masukkan email yang valid' });
    if (!password || password.length < 6) return Promise.resolve({ ok: false, error: 'Password minimal 6 karakter' });
    if (DB.tenantAccount(tenantId)) return Promise.resolve({ ok: false, error: 'Penyewa ini sudah memiliki akun login' });
    if (DB.all('users').some(function (u) { return u.email.toLowerCase() === email; })) {
      return Promise.resolve({ ok: false, error: 'Email sudah digunakan akun lain' });
    }
    return hashPassword(password).then(function (hash) {
      var user = DB.insert('users', {
        name: tenant.name, email: email, passwordHash: hash,
        role: 'tenant', tenantId: tenantId
      });
      DB.update('tenants', tenantId, { email: email });
      return { ok: true, user: user };
    });
  }

  function resetTenantPassword(tenantId, password) {
    DB.init();
    var account = DB.tenantAccount(tenantId);
    if (!account) return Promise.resolve({ ok: false, error: 'Penyewa belum memiliki akun login' });
    if (!password || password.length < 6) return Promise.resolve({ ok: false, error: 'Password minimal 6 karakter' });
    return hashPassword(password).then(function (hash) {
      DB.update('users', account.id, { passwordHash: hash });
      return { ok: true };
    });
  }

  function removeTenantLogin(tenantId) {
    DB.init();
    var account = DB.tenantAccount(tenantId);
    if (!account) return { ok: false, error: 'Penyewa belum memiliki akun login' };
    DB.remove('users', account.id);
    return { ok: true };
  }

  function logout() { DB.init(); DB.setSession(null); }

  function updateProfile(patch) {
    var user = currentUser();
    if (!user) return;
    var data = {};
    if (patch.name) data.name = patch.name.trim();
    if (patch.email) data.email = patch.email.trim().toLowerCase();
    DB.update('users', user.id, data);
  }

  function changePassword(currentPw, newPw) {
    var user = currentUser();
    if (!user) return Promise.resolve({ ok: false, error: 'Sesi berakhir, silakan masuk kembali' });
    return verifyPassword(currentPw, user.passwordHash).then(function (match) {
      if (!match) return { ok: false, error: 'Password saat ini salah' };
      return hashPassword(newPw).then(function (h) {
        DB.update('users', user.id, { passwordHash: h });
        return { ok: true };
      });
    });
  }

  return {
    login: login, register: register, logout: logout,
    isLoggedIn: isLoggedIn, currentUser: currentUser,
    role: role, isAdmin: isAdmin, isTenant: isTenant, tenantProfile: tenantProfile,
    createTenantLogin: createTenantLogin, resetTenantPassword: resetTenantPassword,
    removeTenantLogin: removeTenantLogin,
    updateProfile: updateProfile, changePassword: changePassword
  };
})();
