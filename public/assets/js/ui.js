/* ============================================================
   Kostantinopel — ui.js
   Interaksi kecil untuk panel Blade: sidebar, toast, konfirmasi,
   dan kalkulator tarif booking.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Sidebar ---------- */
  var body = document.body;
  var collapseBtn = document.getElementById('nav-collapse');
  var toggleBtn = document.getElementById('sidebar-toggle');

  try {
    if (localStorage.getItem('kol-nav') === 'collapsed') body.classList.add('nav-collapsed');
  } catch (e) { /* mode privat */ }

  if (collapseBtn) {
    collapseBtn.addEventListener('click', function () {
      body.classList.toggle('nav-collapsed');
      try {
        localStorage.setItem('kol-nav', body.classList.contains('nav-collapsed') ? 'collapsed' : 'expanded');
      } catch (e) { /* abaikan */ }
    });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      body.classList.toggle('sidebar-open');
    });
  }

  document.addEventListener('click', function (event) {
    if (event.target === body && body.classList.contains('sidebar-open')) {
      body.classList.remove('sidebar-open');
    }
  });

  /* ---------- Toast ---------- */
  document.querySelectorAll('.toast[data-autohide]').forEach(function (toast) {
    setTimeout(function () {
      toast.classList.add('toast-out');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 320);
    }, 4200);
  });

  /* ---------- Konfirmasi ---------- */
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function confirmDialog(message, onConfirm) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    var panel = document.createElement('div');
    panel.className = 'modal-panel modal-sm';
    panel.innerHTML =
      '<div class="modal-head"><h3>Konfirmasi</h3>' +
      '<button type="button" class="modal-close" data-close aria-label="Tutup">&times;</button></div>' +
      '<div class="modal-body"><p class="modal-message">' + escapeHtml(message) + '</p></div>' +
      '<div class="modal-foot">' +
      '<button type="button" class="btn btn-ghost" data-close>Batal</button>' +
      '<button type="button" class="btn btn-danger" data-confirm>Ya, Lanjutkan</button>' +
      '</div>';

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');

    function close() {
      overlay.classList.add('modal-leaving');
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        document.body.classList.remove('modal-open');
      }, 150);
    }

    overlay.querySelectorAll('[data-close]').forEach(function (btn) {
      btn.addEventListener('click', close);
    });

    overlay.addEventListener('mousedown', function (event) {
      if (event.target === overlay) close();
    });

    document.addEventListener('keydown', function onKey(event) {
      if (event.key === 'Escape') {
        close();
        document.removeEventListener('keydown', onKey);
      }
    });

    overlay.querySelector('[data-confirm]').addEventListener('click', function () {
      close();
      onConfirm();
    });
  }

  document.querySelectorAll('form[data-confirm]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      if (form.getAttribute('data-confirmed') === '1') return;

      event.preventDefault();
      confirmDialog(form.getAttribute('data-confirm'), function () {
        form.setAttribute('data-confirmed', '1');
        if (typeof form.requestSubmit === 'function') {
          form.requestSubmit();
        } else {
          form.submit();
        }
      });
    });
  });

  document.querySelectorAll('a[data-confirm]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      confirmDialog(link.getAttribute('data-confirm'), function () {
        window.location.href = link.getAttribute('href');
      });
    });
  });

  /* ---------- Kalkulator tarif booking ---------- */
  var bookingForm = document.querySelector('[data-booking-form]');

  if (bookingForm) {
    var quoteUrl = bookingForm.getAttribute('data-quote-url');
    var quoteBox = bookingForm.querySelector('[data-quote]');
    var roomField = bookingForm.querySelector('[name="room_id"]');
    var inField = bookingForm.querySelector('[name="check_in"]');
    var outField = bookingForm.querySelector('[name="check_out"]');
    var typeField = bookingForm.querySelector('[name="rent_type"]');
    var timer = null;

    function rupiah(value) {
      return 'Rp ' + Number(value || 0).toLocaleString('id-ID');
    }

    function renderQuote(data) {
      quoteBox.innerHTML =
        '<div class="quote-row"><span>Durasi</span><strong>' + escapeHtml(data.days) + ' hari</strong></div>' +
        '<div class="quote-row"><span>Satuan sewa</span><strong>' + escapeHtml(data.units) + ' ' + escapeHtml(data.unitLabel) + '</strong></div>' +
        '<div class="quote-row quote-total"><span>Total perkiraan</span><span>' + rupiah(data.total) + '</span></div>';
    }

    function refreshQuote() {
      if (!quoteUrl || !quoteBox || !roomField || !inField || !outField || !typeField) return;

      if (!roomField.value || !inField.value || !outField.value) {
        quoteBox.innerHTML = '<span class="text-muted-sm">Pilih kamar dan tanggal untuk melihat perkiraan biaya.</span>';
        return;
      }

      var params = new URLSearchParams({
        room_id: roomField.value,
        check_in: inField.value,
        check_out: outField.value,
        rent_type: typeField.value || 'harian'
      });

      quoteBox.innerHTML = '<span class="text-muted-sm">Menghitung perkiraan biaya…</span>';

      fetch(quoteUrl + '?' + params.toString(), {
        headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
      })
        .then(function (response) {
          return response.json().then(function (payload) {
            if (!response.ok) {
              var message = payload && payload.error && payload.error.message
                ? payload.error.message
                : 'Tidak dapat menghitung tarif.';
              throw new Error(message);
            }
            return payload;
          });
        })
        .then(renderQuote)
        .catch(function (error) {
          quoteBox.innerHTML = '<span class="bs-bad">' + escapeHtml(error.message) + '</span>';
        });
    }

    function scheduleQuote() {
      clearTimeout(timer);
      timer = setTimeout(refreshQuote, 250);
    }

    ['change', 'input'].forEach(function (eventName) {
      bookingForm.addEventListener(eventName, function (event) {
        if (event.target && ['room_id', 'check_in', 'check_out', 'rent_type'].indexOf(event.target.name) !== -1) {
          scheduleQuote();
        }
      });
    });

    if (inField && outField) {
      inField.addEventListener('change', function () {
        if (inField.value && (!outField.value || outField.value <= inField.value)) {
          var date = new Date(inField.value + 'T00:00:00');
          if (!isNaN(date.getTime())) {
            date.setDate(date.getDate() + 1);
            outField.value = date.getFullYear() + '-' +
              String(date.getMonth() + 1).padStart(2, '0') + '-' +
              String(date.getDate()).padStart(2, '0');
          }
        }
      });
    }

    refreshQuote();
  }

  /* ---------- Landing: navbar ---------- */
  var navBar = document.querySelector('.nav-bar');
  if (navBar) {
    var onScroll = function () {
      navBar.classList.toggle('scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var navToggle = navBar.querySelector('.nav-toggle');
    if (navToggle) {
      navToggle.addEventListener('click', function () {
        navBar.classList.toggle('menu-open');
      });
    }
  }

  /* ---------- Isi cepat kredensial demo ---------- */
  document.querySelectorAll('[data-fill-login]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      var email = document.querySelector('#email');
      var password = document.querySelector('#password');
      if (email) email.value = link.getAttribute('data-email') || '';
      if (password) password.value = link.getAttribute('data-password') || '';
    });
  });
})();
