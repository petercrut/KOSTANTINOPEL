/* ============================================================
   Kostantinopel — theme.js
   Pengendali mode terang / gelap (tema Sneat).
   Pilihan disimpan di localStorage: kol-theme = light | dark.
   ============================================================ */
window.KOL = window.KOL || {};

KOL.theme = (function () {
  'use strict';

  var KEY = 'kol-theme';
  var root = document.documentElement;

  function stored() {
    try {
      var v = localStorage.getItem(KEY);
      return (v === 'dark' || v === 'light') ? v : null;
    } catch (e) { return null; }
  }

  function systemPref() {
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }

  function current() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function sync() {
    var dark = current() === 'dark';
    root.style.colorScheme = dark ? 'dark' : 'light';

    Array.prototype.forEach.call(document.querySelectorAll('[data-theme-toggle]'), function (btn) {
      btn.setAttribute('aria-checked', dark ? 'true' : 'false');
      btn.title = dark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap';
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-theme-label]'), function (el) {
      el.textContent = dark ? 'Gelap' : 'Terang';
    });
  }

  function apply(mode, persist) {
    mode = (mode === 'dark') ? 'dark' : 'light';

    // Nonaktifkan transisi sesaat: perubahan variabel warna pada elemen
    // ber-transition (mis. transition: all) bisa membuat nilai "nyangkut".
    root.classList.add('theme-no-transition');
    root.setAttribute('data-theme', mode);
    void root.offsetWidth;

    if (persist !== false) {
      try { localStorage.setItem(KEY, mode); } catch (e) { /* mode privat */ }
    }

    sync();

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        root.classList.remove('theme-no-transition');
      });
    });

    window.dispatchEvent(new CustomEvent('kol:themechange', { detail: { mode: mode } }));
  }

  function toggle() {
    apply(current() === 'dark' ? 'light' : 'dark');
  }

  function mount() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-theme-toggle]'), function (btn) {
      if (btn.getAttribute('data-theme-bound') === '1') return;
      btn.setAttribute('data-theme-bound', '1');
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        toggle();
      });
    });
    sync();
  }

  function init() {
    // Bootstrap awal (biasanya sudah dijalankan inline di <head>).
    if (!root.getAttribute('data-theme')) {
      root.setAttribute('data-theme', stored() || systemPref());
    }
    root.style.colorScheme = current();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mount);
    } else {
      mount();
    }

    // Ikuti preferensi sistem selama pengguna belum memilih secara manual.
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function (e) {
        if (!stored()) apply(e.matches ? 'dark' : 'light', false);
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }

    // Sinkronkan antar-tab.
    window.addEventListener('storage', function (e) {
      if (e.key === KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
        apply(e.newValue, false);
      }
    });
  }

  init();

  return {
    KEY: KEY,
    current: current,
    apply: apply,
    toggle: toggle,
    mount: mount,
    sync: sync
  };
})();
