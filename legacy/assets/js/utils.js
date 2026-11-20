/* ============================================================
   Kostantinopel — utils.js
   Helper umum: format, DOM, modal, toast, dsb.
   ============================================================ */
window.KOL = window.KOL || {};

KOL.utils = (function () {
  'use strict';

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function randomSalt() {
    return Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12);
  }

  function cyrb53(str, seed) {
    seed = seed || 0;
    var h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (var i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1599333441);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16);
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function toISODate(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function todayISO() { return toISODate(new Date()); }

  function addDays(iso, n) {
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    d.setDate(d.getDate() + Number(n));
    return toISODate(d);
  }

  function addMonths(iso, n) {
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    var day = d.getDate();
    d.setMonth(d.getMonth() + Number(n));
    if (d.getDate() < day) d.setDate(0);
    return toISODate(d);
  }

  function daysBetween(aIso, bIso) {
    var a = new Date(aIso + 'T00:00:00'), b = new Date(bIso + 'T00:00:00');
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
    return Math.round((b - a) / 86400000);
  }

  function monthKey(iso) { return iso ? String(iso).slice(0, 7) : ''; }
  function currentMonthKey() { return todayISO().slice(0, 7); }

  function monthLabel(mk) {
    var d = new Date(mk + '-01T00:00:00');
    if (isNaN(d.getTime())) return mk;
    return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }

  function formatIDR(value) {
    var n = Number(value || 0);
    return 'Rp ' + n.toLocaleString('id-ID');
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString('id-ID');
  }

  function formatDate(iso) {
    if (!iso) return '-';
    var d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatDateTime(iso) {
    if (!iso) return '-';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' +
      d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHTML(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clearNode(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }

  function formField(label, inputHtml, hint) {
    return '<label class="form-field">' +
      '<span class="form-label">' + escapeHTML(label) + '</span>' +
      inputHtml +
      (hint ? '<small class="form-hint">' + escapeHTML(hint) + '</small>' : '') +
      '</label>';
  }

  function options(list, selected) {
    var arr = Array.isArray(list) ? list : Object.keys(list).map(function (k) { return { value: k, label: list[k] }; });
    return arr.map(function (item) {
      var value = item && item.value !== undefined ? item.value : item;
      var label = item && item.label !== undefined ? item.label : item;
      return '<option value="' + escapeHTML(value) + '"' + (String(value) === String(selected) ? ' selected' : '') + '>' + escapeHTML(label) + '</option>';
    }).join('');
  }

  function readForm(root) {
    var data = {};
    qsa('[name]', root).forEach(function (input) {
      data[input.getAttribute('name')] = input.value.trim();
    });
    return data;
  }

  function emptyState(message, hint) {
    return '<div class="empty-state"><div class="empty-icon">🗂️</div><p>' + escapeHTML(message) + '</p>' +
      (hint ? '<small>' + escapeHTML(hint) + '</small>' : '') + '</div>';
  }

  /* ---------- Toast ---------- */
  function toast(message, type) {
    type = type || 'info';
    var container = qs('#toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    var el = document.createElement('div');
    el.className = 'toast toast-' + type;
    var icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    el.innerHTML = '<span class="toast-icon">' + icon + '</span><span class="toast-msg">' + escapeHTML(message) + '</span>';
    container.appendChild(el);
    setTimeout(function () {
      el.classList.add('toast-out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }, 3200);
  }

  /* ---------- Modal ---------- */
  function openModal(options) {
    options = options || {};
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    var panel = document.createElement('div');
    panel.className = 'modal-panel' + (options.size === 'sm' ? ' modal-sm' : options.size === 'lg' ? ' modal-lg' : '');
    panel.innerHTML =
      '<div class="modal-head"><h3>' + escapeHTML(options.title || '') + '</h3>' +
      '<button type="button" class="modal-close" data-modal-close aria-label="Tutup">&times;</button></div>' +
      '<div class="modal-body"></div>' +
      (options.actions && options.actions.length
        ? '<div class="modal-foot">' + options.actions.map(function (a, i) {
            return '<button type="button" class="btn ' + (a.class || 'btn-ghost') + '" data-modal-action="' + i + '">' + escapeHTML(a.label) + '</button>';
          }).join('') + '</div>'
        : '');
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');

    if (options.bodyNode) panel.querySelector('.modal-body').appendChild(options.bodyNode);
    else if (options.body) panel.querySelector('.modal-body').innerHTML = options.body;

    function close() {
      overlay.classList.add('modal-leaving');
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (!document.querySelector('.modal-overlay')) document.body.classList.remove('modal-open');
      }, 150);
    }

    panel.querySelector('.modal-close').addEventListener('click', close);
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) close(); });
    function onKey(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } }
    document.addEventListener('keydown', onKey);

    qsa('[data-modal-action]', panel).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = options.actions[Number(btn.getAttribute('data-modal-action'))];
        if (action && action.onClick) action.onClick(close, panel);
      });
    });

    return { close: close, panel: panel, body: panel.querySelector('.modal-body') };
  }

  function confirmDialog(message, options) {
    options = options || {};
    return new Promise(function (resolve) {
      openModal({
        title: options.title || 'Konfirmasi',
        size: 'sm',
        body: '<p class="modal-message">' + escapeHTML(message) + '</p>',
        actions: [
          { label: options.cancelLabel || 'Batal', class: 'btn-ghost', onClick: function (close) { close(); resolve(false); } },
          { label: options.confirmLabel || 'Ya, Lanjutkan', class: options.danger ? 'btn-danger' : 'btn-primary', onClick: function (close) { close(); resolve(true); } }
        ]
      });
    });
  }

  function downloadFile(filename, content, mimeType) {
    var blob = new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 200);
  }

  return {
    uid: uid, randomSalt: randomSalt, cyrb53: cyrb53,
    pad2: pad2, toISODate: toISODate, todayISO: todayISO,
    addDays: addDays, addMonths: addMonths, daysBetween: daysBetween,
    monthKey: monthKey, currentMonthKey: currentMonthKey, monthLabel: monthLabel,
    formatIDR: formatIDR, formatNumber: formatNumber, formatDate: formatDate, formatDateTime: formatDateTime,
    escapeHTML: escapeHTML, qs: qs, qsa: qsa, clearNode: clearNode,
    formField: formField, options: options, readForm: readForm, emptyState: emptyState,
    toast: toast, openModal: openModal, confirmDialog: confirmDialog, downloadFile: downloadFile
  };
})();
