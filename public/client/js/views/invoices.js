import {
  actionButton, badge, debounce, emptyState, errorBlock, esc, field, formatDate, icon,
  input, loadingTable, money, openModal, pagination, select, tableCard, toast, today,
} from '../ui.js';

const STATUS_OPTIONS = [
  { value: 'unpaid', label: 'Belum Bayar' },
  { value: 'late', label: 'Terlambat' },
  { value: 'paid', label: 'Lunas' },
];

const METHOD_OPTIONS = [
  { value: 'Tunai', label: 'Tunai' },
  { value: 'Transfer', label: 'Transfer Bank' },
  { value: 'QRIS', label: 'QRIS' },
  { value: 'Kartu Debit', label: 'Kartu Debit' },
];

const HEADERS = [
  'Tagihan',
  'Terkait',
  'Jatuh tempo',
  { label: 'Nominal' },
  { label: 'Status' },
  { label: 'Aksi', align: 'right' },
];

function statCard(toneName, iconName, labelText, value, sub) {
  return `
    <div class="stat-card tone-${toneName}">
      <div class="stat-card__icon">${icon(iconName, 20)}</div>
      <div style="min-width:0">
        <span class="stat-card__label">${esc(labelText)}</span>
        <span class="stat-card__value">${esc(value)}</span>
        <span class="stat-card__sub">${esc(sub)}</span>
      </div>
    </div>`;
}

function formBody(invoice = {}, state = {}, isEdit = false) {
  const tenantOptions = (state.tenants || []).map((tenant) => ({ value: tenant.id, label: tenant.name }));
  const roomOptions = (state.rooms || []).map((room) => ({
    value: room.id,
    label: `No. ${room.number} — ${state.propertyMap.get(String(room.propertyId))?.name || `Properti #${room.propertyId}`}`,
  }));

  return `
    <div class="form-grid form-grid--2">
      ${field('Deskripsi tagihan', input('description', invoice.description || '', { placeholder: 'Sewa kamar A-101 — November', required: true }), { required: true, span: true })}
      ${field('Nominal (Rp)', input('amount', invoice.amount ?? '', { type: 'number', kind: 'number', min: 0, step: 1000, required: true }), { required: true })}
      ${field('Jatuh tempo', input('dueDate', invoice.dueDate || today(7), { type: 'date', required: true }), { required: true })}
      ${isEdit ? '' : `
        ${field('Penyewa (opsional)', select('tenantId', tenantOptions, invoice.tenantId || '', { placeholder: 'Tidak terkait penyewa', block: true }))}
        ${field('Kamar (opsional)', select('roomId', roomOptions, invoice.roomId || '', { placeholder: 'Tidak terkait kamar', block: true }))}
      `}
    </div>`;
}

function openForm(ctx, existing, state, reload) {
  openModal({
    title: existing ? 'Ubah tagihan' : 'Buat tagihan manual',
    subtitle: existing ? `PATCH /invoices/${existing.id}` : 'POST /invoices',
    body: formBody(existing || {}, state, Boolean(existing)),
    submitLabel: existing ? 'Simpan perubahan' : 'Buat tagihan',
    onSubmit: async (data, { close }) => {
      if (existing) {
        await ctx.api.update('invoices', existing.id, data);
        toast('Tagihan berhasil diperbarui.', 'success');
      } else {
        await ctx.api.create('invoices', data);
        toast('Tagihan baru berhasil dibuat.', 'success');
      }
      close();
      reload();
    },
  });
}

function openPayment(ctx, invoice, reload) {
  openModal({
    title: `Bayar tagihan ${invoice.code}`,
    subtitle: `POST /invoices/${invoice.id}/payment`,
    size: 'sm',
    submitLabel: 'Tandai lunas',
    body: `
      <div class="notice" style="margin-bottom:14px">
        ${icon('wallet', 17)}
        <div>
          <strong>${esc(money(invoice.amount))}</strong>
          <div class="muted" style="font-size:11.5px">${esc(invoice.description)}</div>
        </div>
      </div>
      <div class="form-grid">
        ${field('Metode pembayaran', select('method', METHOD_OPTIONS, invoice.method || 'Tunai', { block: true }))}
        ${field('Tanggal bayar', input('paidAt', invoice.paidAt || today(), { type: 'date' }))}
        ${field('Dicatat via', input('paidVia', invoice.paidVia || 'admin', { placeholder: 'admin / portal' }))}
      </div>`,
    onSubmit: async (data, { close }) => {
      await ctx.api.post(`/invoices/${invoice.id}/payment`, data);
      toast('Tagihan ditandai lunas.', 'success');
      close();
      reload();
    },
  });
}

async function openDetail(ctx, invoice, state, reload) {
  const modal = openModal({
    title: 'Detail tagihan',
    subtitle: `GET /invoices/${invoice.id}`,
    hideSubmit: true,
    body: `<div class="loading-block"><div class="skeleton skeleton-line skeleton-line--md"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line skeleton-line--sm"></div></div>`,
    footer: `
      <button type="button" class="btn btn--ghost" data-close>Tutup</button>
      <button type="button" class="btn btn--ghost" data-edit>${icon('edit', 14)} Ubah</button>
      <button type="button" class="btn btn--primary" data-pay>${icon('wallet', 14)} Bayar</button>`,
  });

  const body = modal.overlay.querySelector('.modal__body');

  try {
    const response = await ctx.api.getOne('invoices', invoice.id);
    const detail = response.data;
    const tenant = state.tenantMap.get(String(detail.tenantId));
    const room = state.roomMap.get(String(detail.roomId));
    const property = state.propertyMap.get(String(detail.propertyId));

    body.innerHTML = `
      <div class="detail-hero tone-${detail.effectiveStatus === 'paid' ? 'green' : detail.effectiveStatus === 'late' ? 'red' : 'amber'}">
        <div class="detail-hero__icon">${icon('receipt', 22)}</div>
        <div style="min-width:0">
          <h3>${esc(detail.code)}</h3>
          <p>${esc(detail.description)}</p>
        </div>
        <div style="margin-left:auto">${badge(detail.effectiveStatus)}</div>
      </div>
      <div class="detail-grid">
        <div class="detail-row">
          <span class="detail-row__label">Nominal</span>
          <span class="detail-row__value"><strong style="font-size:16px">${esc(money(detail.amount))}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-row__label">Jatuh tempo</span>
          <span class="detail-row__value">${esc(formatDate(detail.dueDate))}</span>
        </div>
        ${`<div class="detail-row"><span class="detail-row__label">Penyewa</span><span class="detail-row__value">${tenant ? esc(tenant.name) : '<span class="muted">—</span>'}</span></div>`}
        ${`<div class="detail-row"><span class="detail-row__label">Kamar</span><span class="detail-row__value">${room ? `No. ${esc(room.number)}${property ? ` · ${esc(property.name)}` : ''}` : '<span class="muted">—</span>'}</span></div>`}
        ${`<div class="detail-row"><span class="detail-row__label">Booking</span><span class="detail-row__value mono">${esc(detail.bookingId || '—')}</span></div>`}
        ${`<div class="detail-row"><span class="detail-row__label">Metode</span><span class="detail-row__value">${detail.method ? esc(detail.method) : '<span class="muted">—</span>'}</span></div>`}
        ${`<div class="detail-row"><span class="detail-row__label">Dibayar pada</span><span class="detail-row__value">${esc(formatDate(detail.paidAt))}</span></div>`}
        ${`<div class="detail-row"><span class="detail-row__label">Dicatat via</span><span class="detail-row__value">${esc(detail.paidVia || '—')}</span></div>`}
      </div>`;

    const payButton = modal.overlay.querySelector('[data-pay]');
    if (detail.effectiveStatus === 'paid') {
      payButton.disabled = true;
      payButton.title = 'Tagihan sudah lunas';
    }

    modal.overlay.querySelector('[data-edit]').addEventListener('click', () => {
      modal.close();
      openForm(ctx, detail, state, reload);
    });
    payButton.addEventListener('click', () => {
      if (payButton.disabled) return;
      modal.close();
      openPayment(ctx, detail, reload);
    });
  } catch (error) {
    body.innerHTML = errorBlock(error.message, false);
  }
}

export default {
  title: 'Tagihan',
  subtitle: 'Kelola tagihan, pantau tunggakan, dan catat pembayaran lewat /api/v1/invoices.',
  render(container, ctx) {
    const params = ctx.params;
    const state = {
      rows: [], meta: null, summary: null, tenants: [], rooms: [], properties: [],
      tenantMap: new Map(), roomMap: new Map(), propertyMap: new Map(),
    };

    container.innerHTML = `
      <div class="view-enter">
        <div data-summary class="stat-grid">
          ${statCard('green', 'wallet', 'Total lunas', '—', 'Memuat ringkasan…')}
          ${statCard('amber', 'clock', 'Belum dibayar', '—', 'Memuat ringkasan…')}
          ${statCard('red', 'alert', 'Terlambat', '—', 'Memuat ringkasan…')}
          ${statCard('indigo', 'receipt', 'Lunas bulan ini', '—', 'Memuat ringkasan…')}
        </div>
        <div class="toolbar">
          <div class="search-box">
            ${icon('search', 15)}
            <input class="input" data-search type="search" placeholder="Cari kode atau deskripsi tagihan…" value="${esc(params.search || '')}" aria-label="Cari tagihan">
          </div>
          <select class="select" data-status aria-label="Filter status">
            <option value="">Semua status</option>
            ${STATUS_OPTIONS.map((option) => `<option value="${option.value}"${params.status === option.value ? ' selected' : ''}>${esc(option.label)}</option>`).join('')}
          </select>
          <div class="toolbar__spacer"></div>
          <button class="btn btn--ghost" type="button" data-action="refresh">${icon('refresh', 14)} Muat ulang</button>
          <button class="btn btn--primary" type="button" data-action="create">${icon('plus', 14)} Tagihan</button>
        </div>
        <div data-slot>${loadingTable(HEADERS)}</div>
      </div>`;

    const view = container.querySelector('.view-enter');
    const slot = view.querySelector('[data-slot]');
    const summarySlot = view.querySelector('[data-summary]');
    const search = view.querySelector('[data-search]');
    const statusFilter = view.querySelector('[data-status]');
    let requestId = 0;

    async function loadSummary() {
      try {
        const response = await ctx.api.get('/invoices/summary');
        state.summary = response.data;
        const summary = state.summary;
        summarySlot.innerHTML = `
          ${statCard('green', 'check-circle', 'Total lunas', money(summary.paidTotal), 'Seluruh pembayaran tercatat')}
          ${statCard('amber', 'clock', 'Belum dibayar', money(summary.unpaidTotal), 'Termasuk tagihan mendatang')}
          ${statCard('red', 'alert', 'Terlambat', money(summary.lateTotal), summary.lateTotal ? 'Perlu ditindaklanjuti' : 'Tidak ada tunggakan')}
          ${statCard('indigo', 'receipt', 'Lunas bulan ini', money(summary.paidThisMonth), 'Pembayaran periode berjalan')}`;
      } catch (error) {
        summarySlot.innerHTML = `<div style="grid-column:1/-1">${errorBlock(error.message, false)}</div>`;
      }
    }

    async function loadLookups() {
      const lookups = await ctx.api.loadLookups(['properties', 'rooms', 'tenants']);
      state.properties = lookups.properties || [];
      state.rooms = lookups.rooms || [];
      state.tenants = lookups.tenants || [];
      state.propertyMap = new Map(state.properties.map((property) => [String(property.id), property]));
      state.roomMap = new Map(state.rooms.map((room) => [String(room.id), room]));
      state.tenantMap = new Map(state.tenants.map((tenant) => [String(tenant.id), tenant]));
    }

    async function load() {
      const id = ++requestId;
      slot.innerHTML = loadingTable(HEADERS);
      try {
        const response = await ctx.api.list('invoices', {
          page: params.page || 1,
          perPage: 20,
          search: params.search || undefined,
          status: params.status || undefined,
        });
        if (id !== requestId) return;

        state.rows = response.data || [];
        state.meta = response.meta;

        if (!state.rows.length) {
          const filtered = Boolean(params.search || params.status);
          slot.innerHTML = tableCard(HEADERS, `<tr><td colspan="${HEADERS.length}">${emptyState({
            iconName: 'receipt',
            title: filtered ? 'Tidak ada tagihan yang cocok' : 'Belum ada tagihan',
            message: filtered ? 'Ubah filter status atau kata kunci pencarian.' : 'Tagihan otomatis dibuat saat booking atau penyewa baru ditambahkan. Anda juga bisa membuat tagihan manual.',
            action: filtered
              ? '<button class="btn btn--ghost btn--sm" type="button" data-action="clear-filter">Hapus filter</button>'
              : '<button class="btn btn--primary btn--sm" type="button" data-action="create">Buat tagihan</button>',
          })}</td></tr>`);
          return;
        }

        const rows = state.rows.map((invoice) => {
          const tenant = state.tenantMap.get(String(invoice.tenantId));
          const room = state.roomMap.get(String(invoice.roomId));
          const related = tenant
            ? tenant.name
            : room
              ? `Kamar ${room.number}`
              : invoice.bookingId
                ? `Booking #${invoice.bookingId}`
                : 'Umum';

          return `
            <tr>
              <td>
                <div class="cell-stack">
                  <strong class="mono">${esc(invoice.code)}</strong>
                  <span>${esc(invoice.description)}</span>
                </div>
              </td>
              <td class="muted">${esc(related)}</td>
              <td class="nowrap">${esc(formatDate(invoice.dueDate))}</td>
              <td class="nowrap mono"><strong>${esc(money(invoice.amount))}</strong></td>
              <td>${badge(invoice.effectiveStatus)}</td>
              <td class="is-right">
                <div class="row-actions">
                  ${actionButton('view', 'eye', 'Lihat detail', 'is-accent', `data-id="${esc(invoice.id)}"`)}
                  ${invoice.effectiveStatus !== 'paid' ? actionButton('pay', 'wallet', 'Catat pembayaran', '', `data-id="${esc(invoice.id)}"`) : ''}
                  ${actionButton('edit', 'edit', 'Ubah tagihan', '', `data-id="${esc(invoice.id)}"`)}
                </div>
              </td>
            </tr>`;
        }).join('');

        slot.innerHTML = tableCard(HEADERS, rows, pagination(state.meta));
      } catch (error) {
        if (id !== requestId) return;
        slot.innerHTML = errorBlock(error.message);
        const retry = slot.querySelector('[data-retry]');
        if (retry) retry.addEventListener('click', load);
      }
    }

    function setFilters(patch) {
      Object.assign(params, patch);
      ctx.setParams(patch);
      load();
    }

    search.addEventListener('input', debounce(() => {
      setFilters({ search: search.value.trim() || undefined, page: 1 });
    }, 350));

    statusFilter.addEventListener('change', () => setFilters({ status: statusFilter.value || undefined, page: 1 }));

    function findInvoice(id) {
      return state.rows.find((invoice) => String(invoice.id) === String(id));
    }

    slot.addEventListener('click', (event) => {
      const pageButton = event.target.closest('[data-page]');
      if (pageButton && !pageButton.disabled) {
        setFilters({ page: Number(pageButton.dataset.page) });
        return;
      }

      const button = event.target.closest('[data-action]');
      if (!button) return;
      const action = button.dataset.action;

      if (action === 'create') {
        openForm(ctx, null, state, reloadAll);
        return;
      }
      if (action === 'clear-filter') {
        search.value = '';
        statusFilter.value = '';
        ctx.setParams({ search: undefined, status: undefined, page: 1 });
        load();
        return;
      }

      const invoice = findInvoice(button.dataset.id);
      if (!invoice) return;

      if (action === 'view') {
        openDetail(ctx, invoice, state, reloadAll);
      } else if (action === 'pay') {
        openPayment(ctx, invoice, reloadAll);
      } else if (action === 'edit') {
        openForm(ctx, invoice, state, reloadAll);
      }
    });

    view.addEventListener('click', (event) => {
      if (event.target.closest('[data-action="refresh"]')) reloadAll();
    });

    function reloadAll() {
      load();
      loadSummary();
    }

    Promise.all([loadLookups(), loadSummary()]).then(load);

    if (params.new === '1') {
      ctx.setParams({ new: undefined });
      loadLookups().then(() => openForm(ctx, null, state, reloadAll));
    }
  },
};
