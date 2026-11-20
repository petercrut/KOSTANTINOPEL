import {
  actionButton, badge, confirmDialog, debounce, emptyState, errorBlock, esc, field,
  formatDate, icon, input, loadingTable, money, openModal, pagination, select,
  tableCard, textarea, toast, today,
} from '../ui.js';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'confirmed', label: 'Terkonfirmasi' },
  { value: 'checkin', label: 'Check-in' },
  { value: 'checkedout', label: 'Check-out' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

const RENT_OPTIONS = [
  { value: 'harian', label: 'Harian' },
  { value: 'mingguan', label: 'Mingguan' },
  { value: 'bulanan', label: 'Bulanan' },
];

const TRANSITIONS = {
  pending: [
    { to: 'confirmed', label: 'Konfirmasi booking', iconName: 'check-circle', tone: 'btn--primary' },
    { to: 'cancelled', label: 'Batalkan booking', iconName: 'x-circle', tone: 'btn--danger-soft' },
  ],
  confirmed: [
    { to: 'checkin', label: 'Proses check-in', iconName: 'login', tone: 'btn--primary' },
    { to: 'cancelled', label: 'Batalkan booking', iconName: 'x-circle', tone: 'btn--danger-soft' },
  ],
  checkin: [
    { to: 'checkedout', label: 'Proses check-out', iconName: 'logout', tone: 'btn--primary' },
  ],
  checkedout: [],
  cancelled: [],
};

const HEADERS = [
  'Booking',
  'Kamar',
  'Periode',
  { label: 'Tipe sewa' },
  { label: 'Total' },
  { label: 'Status' },
  { label: 'Aksi', align: 'right' },
];

function roomOptions(rooms, properties) {
  const propertiesById = new Map(properties.map((property) => [String(property.id), property.name]));
  return rooms.map((room) => ({
    value: room.id,
    label: `No. ${room.number} — ${propertiesById.get(String(room.propertyId)) || `Properti #${room.propertyId}`}`,
  }));
}

function quotePanel() {
  return `
    <div data-quote class="notice" style="margin-top:14px;display:none">
      ${icon('receipt', 17)}
      <div style="flex:1">
        <strong data-quote-total>Tentukan periode untuk melihat estimasi</strong>
        <div class="muted" style="font-size:11px" data-quote-detail></div>
      </div>
      <span class="kbd">POST /bookings/quote</span>
    </div>`;
}

function formBody(booking = {}, rooms = [], properties = [], isEdit = false) {
  return `
    <div class="form-section">Data tamu</div>
    <div class="form-grid form-grid--2">
      ${field('Nama tamu', input('guestName', booking.guestName || '', { placeholder: 'Nama tamu / penyewa', required: true }), { required: true })}
      ${field('Nomor telepon', input('guestPhone', booking.guestPhone || '', { placeholder: '0812…' }))}
      ${field('Kamar', select('roomId', roomOptions(rooms, properties), booking.roomId || '', {
        placeholder: 'Pilih kamar', required: true, block: true,
      }), { required: true, hint: isEdit ? 'Kamar tidak dapat diubah setelah booking dibuat.' : 'Kamar yang sudah terisi tetap bisa dipilih untuk booking baru.' })}
      ${field('Tipe sewa', select('rentType', RENT_OPTIONS, booking.rentType || 'harian', { block: true }))}
      ${field('Tanggal check-in', input('checkIn', booking.checkIn || today(), { type: 'date', required: true }), { required: true })}
      ${field('Tanggal check-out', input('checkOut', booking.checkOut || today(1), { type: 'date', required: true }), { required: true })}
      ${field('Catatan', textarea('notes', booking.notes || '', { rows: 3, placeholder: 'Permintaan khusus, keterangan tambahan…' }), { span: true })}
    </div>
    ${quotePanel()}`;
}

function watchQuote(ctx, modal, rooms) {
  const form = modal.form;
  if (!form) return;

  const panel = modal.overlay.querySelector('[data-quote]');
  const totalEl = modal.overlay.querySelector('[data-quote-total]');
  const detailEl = modal.overlay.querySelector('[data-quote-detail]');
  if (!panel || !totalEl) return;

  const run = debounce(async () => {
    const roomId = form.elements.namedItem('roomId')?.value;
    const checkIn = form.elements.namedItem('checkIn')?.value;
    const checkOut = form.elements.namedItem('checkOut')?.value;
    const rentType = form.elements.namedItem('rentType')?.value || 'harian';

    if (!roomId || !checkIn || !checkOut) return;
    if (checkOut <= checkIn) {
      panel.style.display = 'flex';
      totalEl.textContent = 'Tanggal keluar harus setelah check-in';
      detailEl.textContent = '';
      return;
    }

    panel.style.display = 'flex';
    totalEl.textContent = 'Menghitung estimasi…';
    detailEl.textContent = '';

    try {
      const response = await ctx.api.post('/bookings/quote', { roomId, checkIn, checkOut, rentType });
      const quote = response.data;
      const room = rooms.find((item) => String(item.id) === String(roomId));
      totalEl.textContent = money(quote.total);
      detailEl.textContent = [
        room ? `Kamar ${room.number}` : null,
        `${quote.days} hari`,
        `${quote.units} ${quote.unitLabel}`,
        `${formatDate(quote.checkIn)} → ${formatDate(quote.checkOut)}`,
      ].filter(Boolean).join(' · ');
    } catch (error) {
      totalEl.textContent = 'Estimasi tidak tersedia';
      detailEl.textContent = error.message;
    }
  }, 260);

  ['roomId', 'checkIn', 'checkOut', 'rentType'].forEach((name) => {
    const control = form.elements.namedItem(name);
    if (control) control.addEventListener('change', run);
  });

  run();
}

function openForm(ctx, existing, state, reload) {
  const modal = openModal({
    title: existing ? 'Ubah booking' : 'Buat booking',
    subtitle: existing ? `PATCH /bookings/${existing.id}` : 'POST /bookings',
    size: 'lg',
    body: formBody(existing || {}, state.rooms, state.properties, Boolean(existing)),
    submitLabel: existing ? 'Simpan perubahan' : 'Buat booking',
    onSubmit: async (data, { close }) => {
      if (existing) {
        const payload = { ...data };
        delete payload.roomId;
        await ctx.api.update('bookings', existing.id, payload);
        toast('Booking berhasil diperbarui.', 'success');
      } else {
        await ctx.api.create('bookings', data);
        toast('Booking baru berhasil dibuat beserta tagihannya.', 'success');
      }
      ctx.api.invalidateLookups('rooms');
      close();
      reload();
    },
  });

  if (existing) {
    const roomSelect = modal.form?.elements.namedItem('roomId');
    if (roomSelect) roomSelect.disabled = true;
    const hint = modal.overlay.querySelector('#field-roomId');
    if (hint) hint.classList.add('is-invalid');
  }

  watchQuote(ctx, modal, state.rooms);
}

async function openDetail(ctx, booking, state, reload) {
  const modal = openModal({
    title: 'Detail booking',
    subtitle: `GET /bookings/${booking.id}`,
    size: 'lg',
    hideSubmit: true,
    body: `<div class="loading-block"><div class="skeleton skeleton-line skeleton-line--md"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line skeleton-line--sm"></div></div>`,
    footer: `
      <button type="button" class="btn btn--ghost" data-close>Tutup</button>
      <button type="button" class="btn btn--primary" data-edit>${icon('edit', 14)} Ubah booking</button>`,
  });

  const body = modal.overlay.querySelector('.modal__body');

  try {
    const response = await ctx.api.getOne('bookings', booking.id);
    const detail = response.data;
    const room = state.roomMap.get(String(detail.roomId));
    const property = state.propertyMap.get(String(detail.propertyId));

    body.innerHTML = `
      <div class="detail-hero tone-indigo">
        <div class="detail-hero__icon">${icon('calendar', 22)}</div>
        <div style="min-width:0">
          <h3>${esc(detail.guestName)}</h3>
          <p>${esc(detail.code)} · ${esc(property ? property.name : 'Properti')}${room ? ` · Kamar ${esc(room.number)}` : ''}</p>
        </div>
        <div style="margin-left:auto">${badge(detail.status)}</div>
      </div>
      <div class="detail-grid">
        ${`<div class="detail-row"><span class="detail-row__label">Total</span><span class="detail-row__value"><strong>${esc(money(detail.total))}</strong> · ${detail.units} ${esc(detail.unitLabel)} (${detail.days} hari)</span></div>`}
        ${`<div class="detail-row"><span class="detail-row__label">Tipe sewa</span><span class="detail-row__value">${badge(detail.rentType)}</span></div>`}
        ${`<div class="detail-row"><span class="detail-row__label">Check-in</span><span class="detail-row__value">${esc(formatDate(detail.checkIn))}</span></div>`}
        ${`<div class="detail-row"><span class="detail-row__label">Check-out</span><span class="detail-row__value">${esc(formatDate(detail.checkOut))}</span></div>`}
        ${`<div class="detail-row"><span class="detail-row__label">Telepon</span><span class="detail-row__value mono">${esc(detail.guestPhone || '—')}</span></div>`}
        ${`<div class="detail-row"><span class="detail-row__label">Dibuat</span><span class="detail-row__value">${esc(formatDate(detail.createdAt))}</span></div>`}
        ${`<div class="detail-row detail-row--wide"><span class="detail-row__label">Catatan</span><span class="detail-row__value">${esc(detail.notes || '—')}</span></div>`}
      </div>

      <div class="subhead">Ubah status</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap" data-transitions></div>`;

    const transitionBox = body.querySelector('[data-transitions]');
    const options = TRANSITIONS[detail.status] || [];
    if (!options.length) {
      transitionBox.innerHTML = '<span class="muted" style="font-size:12px">Status ini sudah final — tidak ada transisi lanjutan.</span>';
    } else {
      for (const option of options) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `btn ${option.tone}`;
        button.innerHTML = `${icon(option.iconName, 14)} ${esc(option.label)}`;
        button.addEventListener('click', async () => {
          const confirmed = await confirmDialog({
            title: option.label,
            message: `Ubah status booking ${detail.code} dari "${detail.status}" menjadi "${option.to}"?`,
            confirmLabel: option.label,
            danger: option.to === 'cancelled',
          });
          if (!confirmed) return;
          button.disabled = true;
          try {
            await ctx.api.patch(`/bookings/${detail.id}/status`, { status: option.to });
            ctx.api.invalidateLookups('rooms');
            toast(`Status booking menjadi ${option.to}.`, 'success');
            modal.close();
            reload();
          } catch (error) {
            toast(error.message, 'error');
          } finally {
            button.disabled = false;
          }
        });
        transitionBox.append(button);
      }
    }

    modal.overlay.querySelector('[data-edit]').addEventListener('click', () => {
      modal.close();
      openForm(ctx, detail, state, reload);
    });
  } catch (error) {
    body.innerHTML = errorBlock(error.message, false);
  }
}

export default {
  title: 'Booking',
  subtitle: 'Alur booking: menunggu → terkonfirmasi → check-in → check-out, lengkap dengan kalkulasi tarif otomatis.',
  render(container, ctx) {
    const params = ctx.params;
    const state = { rows: [], meta: null, properties: [], rooms: [], propertyMap: new Map(), roomMap: new Map() };

    container.innerHTML = `
      <div class="view-enter">
        <div class="toolbar">
          <div class="search-box">
            ${icon('search', 15)}
            <input class="input" data-search type="search" placeholder="Cari kode booking, nama, atau telepon…" value="${esc(params.search || '')}" aria-label="Cari booking">
          </div>
          <select class="select" data-status aria-label="Filter status">
            <option value="">Semua status</option>
            ${STATUS_OPTIONS.map((option) => `<option value="${option.value}"${params.status === option.value ? ' selected' : ''}>${esc(option.label)}</option>`).join('')}
          </select>
          <div class="toolbar__spacer"></div>
          <button class="btn btn--ghost" type="button" data-action="refresh">${icon('refresh', 14)} Muat ulang</button>
          <button class="btn btn--primary" type="button" data-action="create">${icon('plus', 14)} Booking</button>
        </div>
        <div data-slot>${loadingTable(HEADERS)}</div>
      </div>`;

    const view = container.querySelector('.view-enter');
    const slot = view.querySelector('[data-slot]');
    const search = view.querySelector('[data-search]');
    const statusFilter = view.querySelector('[data-status]');
    let requestId = 0;

    async function loadLookups() {
      const lookups = await ctx.api.loadLookups(['properties', 'rooms']);
      state.properties = lookups.properties || [];
      state.rooms = lookups.rooms || [];
      state.propertyMap = new Map(state.properties.map((property) => [String(property.id), property]));
      state.roomMap = new Map(state.rooms.map((room) => [String(room.id), room]));
    }

    function roomLabel(roomId) {
      const room = state.roomMap.get(String(roomId));
      if (!room) return { number: `#${roomId}`, property: '—' };
      const property = state.propertyMap.get(String(room.propertyId));
      return { number: room.number, property: property ? property.name : '—' };
    }

    async function load() {
      const id = ++requestId;
      slot.innerHTML = loadingTable(HEADERS);
      try {
        const response = await ctx.api.list('bookings', {
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
            iconName: 'calendar',
            title: filtered ? 'Tidak ada booking yang cocok' : 'Belum ada booking',
            message: filtered ? 'Coba ubah filter status atau kata kunci pencarian.' : 'Buat booking pertama untuk kamar yang tersedia.',
            action: filtered
              ? '<button class="btn btn--ghost btn--sm" type="button" data-action="clear-filter">Hapus filter</button>'
              : '<button class="btn btn--primary btn--sm" type="button" data-action="create">Buat booking</button>',
          })}</td></tr>`);
          return;
        }

        const rows = state.rows.map((booking) => {
          const room = roomLabel(booking.roomId);
          return `
            <tr>
              <td>
                <div class="cell-stack">
                  <strong class="mono">${esc(booking.code)}</strong>
                  <span>${esc(booking.guestName)}${booking.guestPhone ? ` · ${esc(booking.guestPhone)}` : ''}</span>
                </div>
              </td>
              <td>
                <div class="cell-stack">
                  <strong>No. ${esc(room.number)}</strong>
                  <span>${esc(room.property)}</span>
                </div>
              </td>
              <td class="nowrap">
                <div class="cell-stack">
                  <strong>${esc(formatDate(booking.checkIn))}</strong>
                  <span>s.d. ${esc(formatDate(booking.checkOut))}</span>
                </div>
              </td>
              <td>${badge(booking.rentType)}</td>
              <td class="nowrap mono">${esc(money(booking.total))}</td>
              <td>${badge(booking.status)}</td>
              <td class="is-right">
                <div class="row-actions">
                  ${actionButton('view', 'eye', 'Lihat detail', 'is-accent', `data-id="${esc(booking.id)}"`)}
                  ${actionButton('edit', 'edit', 'Ubah booking', '', `data-id="${esc(booking.id)}"`)}
                  ${actionButton('delete', 'trash', 'Hapus booking', 'is-danger', `data-id="${esc(booking.id)}"`)}
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

    function findBooking(id) {
      return state.rows.find((booking) => String(booking.id) === String(id));
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
        openForm(ctx, null, state, load);
        return;
      }
      if (action === 'clear-filter') {
        search.value = '';
        statusFilter.value = '';
        ctx.setParams({ search: undefined, status: undefined, page: 1 });
        load();
        return;
      }

      const booking = findBooking(button.dataset.id);
      if (!booking) return;

      if (action === 'view') {
        openDetail(ctx, booking, state, load);
      } else if (action === 'edit') {
        openForm(ctx, booking, state, load);
      } else if (action === 'delete') {
        confirmDialog({
          title: 'Hapus booking?',
          message: `Booking ${booking.code} akan dihapus. Booking dengan tagihan lunas tidak dapat dihapus.`,
          confirmLabel: 'Hapus booking',
        }).then(async (confirmed) => {
          if (!confirmed) return;
          try {
            await ctx.api.remove('bookings', booking.id);
            ctx.api.invalidateLookups('rooms');
            toast('Booking berhasil dihapus.', 'success');
            if (state.rows.length === 1 && Number(state.meta?.page) > 1) {
              ctx.setParams({ page: Number(state.meta.page) - 1 });
            }
            load();
          } catch (error) {
            toast(error.message, 'error');
          }
        });
      }
    });

    view.addEventListener('click', (event) => {
      if (event.target.closest('[data-action="refresh"]')) load();
    });

    loadLookups().then(load);

    if (params.new === '1') {
      ctx.setParams({ new: undefined });
      loadLookups().then(() => openForm(ctx, null, state, load));
    }
  },
};
