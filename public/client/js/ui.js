/* ============================================================
   Shared UI helpers: icons, formatting, tables, modals, toasts.
   ============================================================ */

const ICON_PATHS = {
  grid: '<rect x="3" y="3" width="7" height="9" rx="1.6"/><rect x="14" y="3" width="7" height="5" rx="1.6"/><rect x="14" y="12" width="7" height="9" rx="1.6"/><rect x="3" y="16" width="7" height="5" rx="1.6"/>',
  building: '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M16 9h3a1 1 0 0 1 1 1v11"/><path d="M2 21h20"/><path d="M8 7h4M8 11h4M8 15h4"/>',
  bed: '<path d="M3 8v11"/><path d="M21 19v-6a3 3 0 0 0-3-3H8v6"/><path d="M3 19h18"/><path d="M3 15h18"/><circle cx="6.5" cy="11.5" r="1.5"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  receipt: '<path d="M4 3v18l2.5-1.5L9 21l3-1.5L15 21l2.5-1.5L20 21V3l-2.5 1.5L15 3l-3 1.5L9 3 6.5 4.5 4 3Z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.3-2.3 2.3-2.3Z"/>',
  megaphone: '<path d="m3 11 18-6v14L3 13v-2Z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  terminal: '<path d="m4 17 6-6-6-6"/><path d="M12 19h8"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
  key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 8.3-8.3M17 6l2 2M14 9l2 2"/>',
  door: '<path d="M3 21h18"/><path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17"/><path d="m14 12 .01 0"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  'arrow-up-right': '<path d="M7 17 17 7M8 7h9v9"/>',
  login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/>',
  sparkles: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  code: '<path d="m8 6-6 6 6 6"/><path d="m16 6 6 6-6 6"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin: '<path d="M12 17v5"/><path d="M9 10.8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v5.3l2 2.7a1 1 0 0 1-.8 1.6H7.8a1 1 0 0 1-.8-1.6l2-2.7Z"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  dots: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  'x-circle': '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  wallet: '<path d="M20 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15v12H5a2 2 0 0 1-2-2V5"/><path d="M17 12h.01"/>',
  zap: '<path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z"/>',
  phone: '<path d="M6.6 3h3l1.5 4.5-2 1.5a12 12 0 0 0 5.9 5.9l1.5-2L21 14.4v3a2.6 2.6 0 0 1-2.8 2.6A17 17 0 0 1 4 5.8 2.6 2.6 0 0 1 6.6 3Z"/>',
};

const LABELS = {
  propertyType: { kost: 'Kost', kontrakan: 'Kontrakan', apartemen: 'Apartemen', hotel: 'Hotel' },
  roomStatus: { available: 'Tersedia', occupied: 'Terisi', maintenance: 'Perawatan' },
  tenantStatus: { active: 'Aktif', inactive: 'Selesai' },
  bookingStatus: { pending: 'Menunggu', confirmed: 'Terkonfirmasi', checkin: 'Check-in', checkedout: 'Check-out', cancelled: 'Dibatalkan' },
  invoiceStatus: { unpaid: 'Belum Bayar', late: 'Terlambat', paid: 'Lunas' },
  requestCategory: { perbaikan: 'Perbaikan', kebersihan: 'Kebersihan', keamanan: 'Keamanan', keluhan: 'Keluhan', lainnya: 'Lainnya' },
  requestStatus: { open: 'Baru', in_progress: 'Diproses', done: 'Selesai', rejected: 'Ditolak' },
  priority: { low: 'Rendah', normal: 'Normal', high: 'Tinggi' },
  rentType: { harian: 'Harian', mingguan: 'Mingguan', bulanan: 'Bulanan' },
  method: { Tunai: 'Tunai', Transfer: 'Transfer Bank', QRIS: 'QRIS', 'Kartu Debit': 'Kartu Debit' },
  role: { admin: 'Admin', tenant: 'Penyewa' },
  gender: { 'Laki-laki': 'Laki-laki', Perempuan: 'Perempuan' },
};

const TONES = {
  available: 'green', occupied: 'blue', maintenance: 'amber',
  active: 'green', inactive: 'slate',
  pending: 'amber', confirmed: 'violet', checkin: 'blue', checkedout: 'slate', cancelled: 'red',
  unpaid: 'amber', late: 'red', paid: 'green',
  open: 'amber', in_progress: 'blue', done: 'green', rejected: 'red',
  low: 'slate', normal: 'blue', high: 'red',
  harian: 'blue', mingguan: 'violet', bulanan: 'cyan',
  kost: 'brand', kontrakan: 'cyan', apartemen: 'violet', hotel: 'amber',
  admin: 'violet', tenant: 'blue',
};

export function esc(value) {
  return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

export function icon(name, size = 18) {
  const path = ICON_PATHS[name] || ICON_PATHS.info;
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

export function label(value, group) {
  if (value === null || value === undefined || value === '') return '—';
  const dictionary = LABELS[group];
  if (dictionary && dictionary[value]) return dictionary[value];
  const fallback = Object.values(LABELS).find((map) => map[value]);
  return fallback ? fallback[value] : String(value);
}

export function tone(value) {
  return TONES[value] || 'slate';
}

export function badge(value, group = null) {
  if (value === null || value === undefined || value === '') return '<span class="muted">—</span>';
  return `<span class="badge badge--${tone(value)}">${esc(label(value, group))}</span>`;
}

export function tag(text) {
  return `<span class="tag">${esc(text)}</span>`;
}

export function initials(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  const letters = words.length === 1
    ? words[0].slice(0, 2)
    : words[0][0] + words[words.length - 1][0];
  return letters.toUpperCase();
}

const moneyFormatter = new Intl.NumberFormat('id-ID');

export function money(value) {
  return `Rp ${moneyFormatter.format(Number(value) || 0)}`;
}

export function number(value) {
  return moneyFormatter.format(Number(value) || 0);
}

export function moneyShort(value) {
  const amount = Number(value) || 0;
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace('.', ',')} jt`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)} rb`;
  return String(amount);
}

function parseDate(value) {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const date = parseDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export function formatDateTime(value) {
  const date = parseDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
}

export function relativeTime(value) {
  const date = parseDate(value);
  if (!date) return '—';
  const diff = (date.getTime() - Date.now()) / 1000;
  const units = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  const formatter = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' });
  for (const [unit, seconds] of units) {
    if (Math.abs(diff) >= seconds) return formatter.format(Math.round(diff / seconds), unit);
  }
  return 'baru saja';
}

export function today(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

/* ------------------------------ toasts ------------------------------ */

const TOAST_ICONS = { success: 'check-circle', error: 'x-circle', warning: 'alert', info: 'info' };

export function toast(message, type = 'info', title = null) {
  const root = document.getElementById('toast-root');
  if (!root) return;

  const element = document.createElement('div');
  element.className = `toast toast--${type}`;
  const heading = title || { success: 'Berhasil', error: 'Gagal', warning: 'Perhatian', info: 'Info' }[type];
  element.innerHTML = `
    <div class="toast__icon">${icon(TOAST_ICONS[type] || 'info', 16)}</div>
    <div class="toast__body">
      <div class="toast__title">${esc(heading)}</div>
      <div class="toast__message">${esc(message)}</div>
    </div>
    <button class="toast__close" type="button" aria-label="Tutup notifikasi">${icon('close', 14)}</button>`;

  const remove = () => {
    element.classList.add('is-leaving');
    window.setTimeout(() => element.remove(), 230);
  };

  element.querySelector('.toast__close').addEventListener('click', remove);
  root.append(element);
  window.setTimeout(remove, type === 'error' ? 7000 : 4400);
}

/* ------------------------------ modal ------------------------------- */

const modalStack = [];

export function openModal(options = {}) {
  const {
    title = 'Formulir',
    subtitle = '',
    body = '',
    size = 'md',
    submitLabel = 'Simpan',
    cancelLabel = 'Batal',
    hideSubmit = false,
    footer = '',
    onSubmit = null,
    onClose = null,
    onMount = null,
    danger = false,
  } = options;

  const root = document.getElementById('modal-root');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const titleId = `modal-title-${Math.random().toString(36).slice(2, 8)}`;
  const closeButton = `<button class="modal__close" type="button" data-close aria-label="Tutup">${icon('close', 15)}</button>`;

  const head = `
    <div class="modal__head">
      <div style="flex:1">
        <h2 id="${titleId}">${esc(title)}</h2>
        ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
      </div>
      ${closeButton}
    </div>`;

  const footerInner = footer || `
    <button type="button" class="btn btn--ghost" data-close>${esc(cancelLabel)}</button>
    ${hideSubmit ? '' : `<button type="submit" class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-submit>${esc(submitLabel)}</button>`}`;

  if (onSubmit) {
    overlay.innerHTML = `
      <div class="modal modal--${size}" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
        ${head}
        <form>
          <div class="modal__body">
            <div class="form-alert" data-alert hidden>${icon('alert', 16)}<div data-alert-text></div></div>
            ${body}
          </div>
          <div class="modal__foot">${footerInner}</div>
        </form>
      </div>`;
  } else {
    overlay.innerHTML = `
      <div class="modal modal--${size}" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
        ${head}
        <div class="modal__body">${body}</div>
        <div class="modal__foot">${footerInner}</div>
      </div>`;
  }

  const modal = overlay.querySelector('.modal');
  const form = overlay.querySelector('form');
  const submitButton = overlay.querySelector('[data-submit]');
  const alertBox = overlay.querySelector('[data-alert]');
  const alertText = overlay.querySelector('[data-alert-text]');
  let closed = false;
  let busy = false;

  const close = () => {
    if (closed) return;
    closed = true;
    const index = modalStack.indexOf(instance);
    if (index >= 0) modalStack.splice(index, 1);
    overlay.classList.remove('is-open');
    window.setTimeout(() => {
      overlay.remove();
      if (!document.querySelector('.modal-overlay')) {
        document.body.style.overflow = '';
      }
    }, 180);
    document.removeEventListener('keydown', onKeydown);
    if (typeof onClose === 'function') onClose();
  };

  const showError = (error) => {
    if (!alertBox) {
      toast(error.message || 'Terjadi kesalahan.', 'error');
      return;
    }
    let details = '';
    if (Array.isArray(error.details) && error.details.length) {
      details = `<ul>${error.details.slice(0, 6).map((detail) => (
        `<li><strong>${esc(detail.field)}</strong>: ${esc(detail.message)}</li>`
      )).join('')}</ul>`;
    }
    alertText.innerHTML = `${esc(error.message || 'Terjadi kesalahan.')}${details}`;
    alertBox.hidden = false;
    alertBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

    if (form) {
      form.querySelectorAll('.is-invalid').forEach((input) => input.classList.remove('is-invalid'));
      for (const detail of error.details || []) {
        const field = form.elements.namedItem(detail.field);
        if (field && field.classList) field.classList.add('is-invalid');
      }
    }
  };

  const setBusy = (value) => {
    busy = value;
    if (!submitButton) return;
    submitButton.disabled = value;
    submitButton.classList.toggle('is-busy', value);
    if (value) {
      submitButton.dataset.label = submitButton.innerHTML;
      submitButton.innerHTML = `<span class="btn__spinner"></span> Memproses…`;
    } else if (submitButton.dataset.label) {
      submitButton.innerHTML = submitButton.dataset.label;
    }
  };

  const onKeydown = (event) => {
    if (modalStack[modalStack.length - 1] !== instance) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'Tab') {
      const focusable = Array.from(modal.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay || event.target.closest('[data-close]')) {
      event.preventDefault();
      close();
    }
  });

  if (form && onSubmit) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (busy) return;

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      if (alertBox) alertBox.hidden = true;
      setBusy(true);
      try {
        await onSubmit(serializeForm(form), { close, form, overlay, setBusy, showError });
      } catch (error) {
        showError(error);
        setBusy(false);
      }
    });
  }

  document.getElementById('modal-root').append(overlay);
  document.body.style.overflow = 'hidden';

  const instance = { overlay, modal, form, close, setBusy, showError, alertBox };
  modalStack.push(instance);
  document.addEventListener('keydown', onKeydown);

  requestAnimationFrame(() => {
    overlay.classList.add('is-open');
    const focusTarget = modal.querySelector('[autofocus]')
      || modal.querySelector('input:not([type="hidden"]):not([disabled]), select, textarea, button[data-submit], [data-close]');
    if (focusTarget) window.setTimeout(() => focusTarget.focus(), 60);
  });

  if (typeof onMount === 'function') onMount(instance);

  return instance;
}

export function confirmDialog(options = {}) {
  const {
    title = 'Konfirmasi',
    message = 'Lanjutkan tindakan ini?',
    confirmLabel = 'Ya, lanjutkan',
    cancelLabel = 'Batal',
    danger = true,
  } = options;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const instance = openModal({
      title,
      body: `<div class="notice">${icon('alert', 18)}<div>${esc(message)}</div></div>`,
      size: 'sm',
      hideSubmit: true,
      footer: `
        <button type="button" class="btn btn--ghost" data-cancel>${esc(cancelLabel)}</button>
        <button type="button" class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-confirm>${esc(confirmLabel)}</button>`,
      onClose: () => finish(false),
    });

    instance.overlay.querySelector('[data-cancel]').addEventListener('click', () => instance.close());
    instance.overlay.querySelector('[data-confirm]').addEventListener('click', () => {
      finish(true);
      instance.close();
    });
  });
}

/* --------------------------- form helpers --------------------------- */

export function serializeForm(form) {
  const data = {};
  for (const element of Array.from(form.elements)) {
    if (!element.name || element.disabled) continue;
    if (['submit', 'button', 'reset', 'file'].includes(element.type)) continue;

    if (element.type === 'checkbox') {
      data[element.name] = element.checked;
      continue;
    }

    if (element.type === 'radio') {
      if (element.checked) data[element.name] = element.value;
      continue;
    }

    const raw = element.value;
    const value = typeof raw === 'string' ? raw.trim() : raw;
    if (value === '') continue;

    const kind = element.dataset.kind || 'text';
    if (kind === 'number') {
      const numeric = Number(value);
      if (!Number.isNaN(numeric)) data[element.name] = numeric;
      continue;
    }
    if (kind === 'array') {
      data[element.name] = value.split(',').map((item) => item.trim()).filter(Boolean);
      continue;
    }
    if (kind === 'boolean') {
      data[element.name] = value === 'true' || value === '1';
      continue;
    }
    data[element.name] = value;
  }
  return data;
}

export function field(labelText, control, options = {}) {
  const { hint = '', required = false, span = false } = options;
  return `
    <div class="field${span ? ' span-2' : ''}">
      <label>${esc(labelText)}${required ? ' <span class="req">*</span>' : ''}</label>
      ${control}
      ${hint ? `<span class="field__hint">${hint}</span>` : ''}
    </div>`;
}

export function input(name, value = '', options = {}) {
  const {
    type = 'text', placeholder = '', required = false, kind = null,
    autocomplete = 'off', min = null, max = null, step = null, extra = '',
  } = options;
  const attributes = [
    `type="${type}"`,
    `name="${esc(name)}"`,
    `id="field-${esc(name)}"`,
    `value="${esc(value)}"`,
    placeholder ? `placeholder="${esc(placeholder)}"` : '',
    required ? 'required' : '',
    kind ? `data-kind="${esc(kind)}"` : '',
    autocomplete ? `autocomplete="${esc(autocomplete)}"` : '',
    min !== null ? `min="${esc(min)}"` : '',
    max !== null ? `max="${esc(max)}"` : '',
    step !== null ? `step="${esc(step)}"` : '',
    extra,
  ].filter(Boolean).join(' ');
  return `<input class="input" ${attributes}>`;
}

export function textarea(name, value = '', options = {}) {
  const { placeholder = '', required = false, rows = 4 } = options;
  return `<textarea class="textarea" name="${esc(name)}" id="field-${esc(name)}" rows="${rows}"${required ? ' required' : ''} placeholder="${esc(placeholder)}">${esc(value)}</textarea>`;
}

export function select(name, options, value, config = {}) {
  const { placeholder = null, required = false, block = false } = config;
  const list = options.map((item) => {
    const selected = String(item.value) === String(value ?? '') ? ' selected' : '';
    return `<option value="${esc(item.value)}"${selected}>${esc(item.label)}</option>`;
  }).join('');

  return `<select class="select${block ? ' select--block' : ''}" name="${esc(name)}" id="field-${esc(name)}"${required ? ' required' : ''}>
    ${placeholder ? `<option value=""${value ? '' : ' selected'}>${esc(placeholder)}</option>` : ''}
    ${list}
  </select>`;
}

export function optionsFrom(items, valueKey = 'id', labelKey = 'name') {
  return items.map((item) => ({ value: item[valueKey], label: item[labelKey] }));
}

export function yesNo(value) {
  return value ? 'Ya' : 'Tidak';
}

/* ----------------------------- tables ------------------------------- */

export function tableCard(headers, rows, footer = '') {
  const head = headers.map((header) => {
    if (typeof header === 'string') return `<th>${esc(header)}</th>`;
    return `<th${header.align === 'right' ? ' class="is-right"' : ''}>${esc(header.label)}</th>`;
  }).join('');

  return `
    <div class="table-card">
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>${head}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${footer}
    </div>`;
}

export function loadingTable(headers, rowCount = 6) {
  const columns = headers.length;
  const rows = Array.from({ length: rowCount }, () => `
    <tr class="skeleton-row">
      ${Array.from({ length: columns }, (_, index) => (
        `<td><div class="skeleton skeleton-line ${index === 0 ? 'skeleton-line--md' : 'skeleton-line--sm'}"></div></td>`
      )).join('')}
    </tr>`).join('');

  return `<div class="table-card"><div class="table-wrap"><table class="data-table"><tbody>${rows}</tbody></table></div></div>`;
}

export function emptyState(options = {}) {
  const {
    iconName = 'database', title = 'Belum ada data', message = '', action = '',
  } = options;
  return `
    <div class="empty">
      <div class="empty__icon">${icon(iconName, 22)}</div>
      <h3>${esc(title)}</h3>
      ${message ? `<p>${esc(message)}</p>` : ''}
      ${action}
    </div>`;
}

export function errorBlock(message, retry = true) {
  return `
    <div class="error-block">
      ${icon('alert', 20)}
      <div>
        <h3>Gagal memuat data</h3>
        <p>${esc(message)}</p>
        ${retry ? '<button class="btn btn--sm btn--ghost" type="button" data-retry>Ulangi</button>' : ''}
      </div>
    </div>`;
}

export function pagination(meta) {
  if (!meta || !meta.total) return '';
  const totalPages = Math.max(1, Number(meta.totalPages) || 1);
  const page = Math.min(Math.max(1, Number(meta.page) || 1), totalPages);
  const from = (page - 1) * meta.perPage + 1;
  const to = Math.min(meta.total, page * meta.perPage);

  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const list = [...pages].filter((number) => number >= 1 && number <= totalPages).sort((a, b) => a - b);

  let buttons = '';
  let previous = 0;
  for (const number of list) {
    if (previous && number - previous > 1) buttons += '<span class="pager__gap">…</span>';
    buttons += `<button type="button" data-page="${number}" class="${number === page ? 'is-active' : ''}" aria-label="Halaman ${number}">${number}</button>`;
    previous = number;
  }

  return `
    <div class="table-footer">
      <span>Menampilkan <strong>${from}–${to}</strong> dari <strong>${meta.total}</strong> data</span>
      <div class="pager">
        <button type="button" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''} aria-label="Halaman sebelumnya">${icon('chevron-left', 14)}</button>
        ${buttons}
        <button type="button" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''} aria-label="Halaman berikutnya">${icon('chevron-right', 14)}</button>
      </div>
    </div>`;
}

export function bindPagination(root, handler) {
  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-page]');
    if (!button || button.disabled) return;
    const page = Number(button.dataset.page);
    if (Number.isFinite(page) && page > 0) handler(page);
  });
}

export function debounce(callback, wait = 320) {
  let timer = null;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => callback(...args), wait);
  };
}

/* ---------------------------- JSON / misc --------------------------- */

export function prettyJson(value) {
  if (value === null || value === undefined) return '';
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
}

export function highlightJson(value) {
  const json = esc(prettyJson(value));
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let className = 'json-number';
      if (/^"/.test(match)) {
        className = /:$/.test(match) ? 'json-key' : 'json-string';
      } else if (/true|false/.test(match)) {
        className = 'json-boolean';
      } else if (/null/.test(match)) {
        className = 'json-null';
      }
      return `<span class="${className}">${match}</span>`;
    },
  );
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Disalin ke clipboard.', 'success');
    return true;
  } catch (error) {
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.append(helper);
    helper.select();
    try {
      document.execCommand('copy');
      toast('Disalin ke clipboard.', 'success');
      return true;
    } catch (fallbackError) {
      toast('Browser menolak akses clipboard.', 'warning');
      return false;
    } finally {
      helper.remove();
    }
  }
}

export function detailHero(iconName, title, subtitle, toneName = 'indigo') {
  return `
    <div class="detail-hero tone-${toneName}">
      <div class="detail-hero__icon">${icon(iconName, 22)}</div>
      <div style="min-width:0">
        <h3>${esc(title)}</h3>
        <p>${esc(subtitle)}</p>
      </div>
    </div>`;
}

export function detailRow(labelText, value, wide = false) {
  return `
    <div class="detail-row${wide ? ' detail-row--wide' : ''}">
      <span class="detail-row__label">${esc(labelText)}</span>
      <span class="detail-row__value">${value === null || value === undefined || value === '' ? '<span class="muted">—</span>' : value}</span>
    </div>`;
}

export function actionButton(action, iconName, title, extraClass = '', attributes = '') {
  return `<button type="button" class="row-btn ${extraClass}" data-action="${esc(action)}" ${attributes} title="${esc(title)}" aria-label="${esc(title)}">${icon(iconName, 15)}</button>`;
}
