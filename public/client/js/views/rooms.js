import {
  actionButton, badge, confirmDialog, debounce, emptyState, errorBlock, esc, field,
  formatDate, icon, input, loadingTable, money, openModal, pagination, select,
  tableCard, textarea, toast, today,
} from '../ui.js';

const STATUS_OPTIONS = [
  { value: 'available', label: 'Tersedia' },
  { value: 'occupied', label: 'Terisi' },
  { value: 'maintenance', label: 'Perawatan' },
];

const HEADERS = [
  'Kamar',
  'Properti',
  'Tarif',
  { label: 'Kapasitas' },
  { label: 'Status' },
  'Fasilitas',
  { label: 'Aksi', align: 'right' },
];

function formBody(room = {}, properties = []) {
  return `
    <div class="form-grid form-grid--2">
      ${field('Properti', select('propertyId',
        properties.map((property) => ({ value: property.id, label: property.name })),
        room.propertyId || '', { placeholder: 'Pilih properti', required: true, block: true }), { required: true })}
      ${field('Nomor kamar', input('number', room.number || '', { placeholder: 'Contoh: A-101', required: true }), { required: true })}
      ${field('Tipe kamar', input('type', room.type || '', { placeholder: 'Contoh: Deluxe / Standard' }))}
      ${field('Kapasitas', input('capacity', room.capacity ?? 1, { type: 'number', kind: 'number', min: 1, max: 20 }))}
      ${field('Harga harian (Rp)', input('priceDaily', room.priceDaily ?? 0, { type: 'number', kind: 'number', min: 0, step: 1000 }))}
      ${field('Harga bulanan (Rp)', input('priceMonthly', room.priceMonthly ?? 0, { type: 'number', kind: 'number', min: 0, step: 10000 }))}
      ${field('Status kamar', select('status', STATUS_OPTIONS, room.status || 'available', { block: true }))}
      ${field('Fasilitas', input('facilities', (room.facilities || []).join(', '), { placeholder: 'AC, WiFi, Kasur' }), { hint: 'Pisahkan dengan koma.' })}
    </div>`;
}

function openForm(ctx, existing, properties, reload) {
  openModal({
    title: existing ? 'Ubah kamar' : 'Tambah kamar',
    subtitle: existing ? `PATCH /rooms/${existing.id}` : 'POST /rooms',
    body: formBody(existing || {}, properties),
    submitLabel: existing ? 'Simpan perubahan' : 'Buat kamar',
    onSubmit: async (data, { close }) => {
      if (existing) {
        await ctx.api.update('rooms', existing.id, data);
        toast('Data kamar berhasil diperbarui.', 'success');
      } else {
        await ctx.api.create('rooms', data);
        toast('Kamar baru berhasil dibuat.', 'success');
      }
      ctx.api.invalidateLookups('rooms');
      close();
      reload();
    },
  });
}

function openAvailability(ctx, room) {
  const modal = openModal({
    title: `Cek ketersediaan kamar ${room.number}`,
    subtitle: `GET /rooms/${room.id}/availability`,
    size: 'sm',
    submitLabel: 'Cek ketersediaan',
    body: `
      <div class="form-grid form-grid--2">
        ${field('Dari tanggal', input('from', today(), { type: 'date', required: true }), { required: true })}
        ${field('Sampai tanggal', input('to', today(1), { type: 'date', required: true }), { required: true })}
      </div>
      <div data-result style="margin-top:14px"></div>`,
    onSubmit: async (data, { form }) => {
      const result = form.querySelector('[data-result]');
      result.innerHTML = '<span class="muted" style="font-size:12px">Memeriksa ketersediaan…</span>';
      try {
        const response = await ctx.api.get(`/rooms/${room.id}/availability`, {
          query: { from: data.from, to: data.to },
        });
        const info = response.data;
        result.innerHTML = `
          <div class="notice">
            ${icon(info.available ? 'check-circle' : 'alert', 18)}
            <div>
              <strong>${info.available ? 'Kamar tersedia' : 'Kamar tidak tersedia'}</strong>
              <div class="muted" style="font-size:11.5px;margin-top:2px">${esc(info.reason)}</div>
              <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
                ${badge(info.effectiveStatus)}
                <span class="tag">${esc(data.from)} → ${esc(data.to)}</span>
              </div>
            </div>
          </div>`;
      } catch (error) {
        result.innerHTML = `<div class="form-alert" style="margin:0">${icon('alert', 15)}<div>${esc(error.message)}</div></div>`;
      }
    },
  });

  return modal;
}

export default {
  title: 'Kamar',
  subtitle: 'Kelola inventaris kamar, tarif harian/bulanan, fasilitas, dan status perawatan.',
  render(container, ctx) {
    const params = ctx.params;
    const state = { rows: [], meta: null, properties: [], propertyMap: new Map() };

    container.innerHTML = `
      <div class="view-enter">
        <div class="toolbar">
          <div class="search-box">
            ${icon('search', 15)}
            <input class="input" data-search type="search" placeholder="Cari nomor atau tipe kamar…" value="${esc(params.search || '')}" aria-label="Cari kamar">
          </div>
          <select class="select" data-property aria-label="Filter properti"><option value="">Semua properti</option></select>
          <select class="select" data-status aria-label="Filter status">
            <option value="">Semua status</option>
            ${STATUS_OPTIONS.map((option) => `<option value="${option.value}"${params.status === option.value ? ' selected' : ''}>${esc(option.label)}</option>`).join('')}
          </select>
          <div class="toolbar__spacer"></div>
          <button class="btn btn--ghost" type="button" data-action="refresh">${icon('refresh', 14)} Muat ulang</button>
          <button class="btn btn--primary" type="button" data-action="create">${icon('plus', 14)} Kamar</button>
        </div>
        <div data-slot>${loadingTable(HEADERS)}</div>
      </div>`;

    const view = container.querySelector('.view-enter');
    const slot = view.querySelector('[data-slot]');
    const search = view.querySelector('[data-search]');
    const propertyFilter = view.querySelector('[data-property]');
    const statusFilter = view.querySelector('[data-status]');

    let requestId = 0;

    function propertyName(id) {
      return state.propertyMap.get(String(id))?.name || `Properti #${id}`;
    }

    async function loadProperties() {
      try {
        state.properties = await ctx.api.properties();
      } catch (error) {
        state.properties = [];
      }

      state.propertyMap = new Map(state.properties.map((property) => [String(property.id), property]));
      propertyFilter.innerHTML = `<option value="">Semua properti</option>${state.properties.map((property) => (
        `<option value="${esc(property.id)}"${String(params.propertyId) === String(property.id) ? ' selected' : ''}>${esc(property.name)}</option>`
      )).join('')}`;
    }

    async function load() {
      const id = ++requestId;
      slot.innerHTML = loadingTable(HEADERS);
      try {
        const response = await ctx.api.list('rooms', {
          page: params.page || 1,
          perPage: 20,
          search: params.search || undefined,
          propertyId: params.propertyId || undefined,
          status: params.status || undefined,
        });
        if (id !== requestId) return;

        state.rows = response.data || [];
        state.meta = response.meta;

        if (!state.rows.length) {
          const filtered = Boolean(params.search || params.propertyId || params.status);
          slot.innerHTML = tableCard(HEADERS, `<tr><td colspan="${HEADERS.length}">${emptyState({
            iconName: 'bed',
            title: filtered ? 'Tidak ada kamar yang cocok' : 'Belum ada kamar',
            message: filtered ? 'Ubah filter properti/status atau kata kunci pencarian.' : 'Tambahkan kamar untuk properti yang sudah dibuat.',
            action: filtered
              ? '<button class="btn btn--ghost btn--sm" type="button" data-action="clear-filter">Hapus filter</button>'
              : '<button class="btn btn--primary btn--sm" type="button" data-action="create">Tambah kamar</button>',
          })}</td></tr>`);
          return;
        }

        const rows = state.rows.map((room) => `
          <tr>
            <td>
              <div class="cell-main">
                <span class="avatar avatar--sm">${icon('bed', 14)}</span>
                <div class="cell-main__text">
                  <strong>No. ${esc(room.number)}</strong>
                  <span>${esc(room.type || 'Tanpa tipe')}</span>
                </div>
              </div>
            </td>
            <td class="muted">${esc(propertyName(room.propertyId))}</td>
            <td class="nowrap">
              <div class="cell-stack">
                <strong>${esc(money(room.priceDaily))} <span class="muted" style="font-weight:500">/hari</span></strong>
                <span>${esc(money(room.priceMonthly))} /bulan</span>
              </div>
            </td>
            <td>${Number(room.capacity)} orang</td>
            <td>${badge(room.effectiveStatus || room.status)}</td>
            <td>
              <div class="facilities">
                ${(room.facilities || []).slice(0, 3).map((facility) => `<span class="tag">${esc(facility)}</span>`).join('') || '<span class="muted">—</span>'}
                ${(room.facilities || []).length > 3 ? `<span class="tag">+${room.facilities.length - 3}</span>` : ''}
              </div>
            </td>
            <td class="is-right">
              <div class="row-actions">
                ${actionButton('availability', 'calendar', 'Cek ketersediaan', 'is-accent', `data-id="${esc(room.id)}"`)}
                ${actionButton('edit', 'edit', 'Ubah kamar', '', `data-id="${esc(room.id)}"`)}
                ${actionButton('delete', 'trash', 'Hapus kamar', 'is-danger', `data-id="${esc(room.id)}"`)}
              </div>
            </td>
          </tr>`).join('');

        slot.innerHTML = tableCard(HEADERS, rows, pagination(state.meta));
      } catch (error) {
        if (id !== requestId) return;
        slot.innerHTML = errorBlock(error.message);
        const retry = slot.querySelector('[data-retry]');
        if (retry) retry.addEventListener('click', load);
      }
    }

    function setFilters(patch) {
      ctx.setParams(patch);
      load();
    }

    search.addEventListener('input', debounce(() => {
      setFilters({ search: search.value.trim() || undefined, page: 1 });
    }, 350));

    propertyFilter.addEventListener('change', () => {
      setFilters({ propertyId: propertyFilter.value || undefined, page: 1 });
    });

    statusFilter.addEventListener('change', () => {
      setFilters({ status: statusFilter.value || undefined, page: 1 });
    });

    function findRoom(id) {
      return state.rows.find((room) => String(room.id) === String(id));
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
        openForm(ctx, null, state.properties, load);
        return;
      }
      if (action === 'clear-filter') {
        search.value = '';
        propertyFilter.value = '';
        statusFilter.value = '';
        ctx.setParams({ search: undefined, propertyId: undefined, status: undefined, page: 1 });
        load();
        return;
      }

      const room = findRoom(button.dataset.id);
      if (!room) return;

      if (action === 'edit') {
        openForm(ctx, room, state.properties, load);
      } else if (action === 'availability') {
        openAvailability(ctx, room);
      } else if (action === 'delete') {
        confirmDialog({
          title: 'Hapus kamar?',
          message: `Kamar No. ${room.number} akan dihapus. API menolak penghapusan jika kamar memiliki riwayat penyewa atau booking.`,
          confirmLabel: 'Hapus kamar',
        }).then(async (confirmed) => {
          if (!confirmed) return;
          try {
            await ctx.api.remove('rooms', room.id);
            ctx.api.invalidateLookups();
            toast('Kamar berhasil dihapus.', 'success');
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

    loadProperties().then(load);

    if (params.new === '1') {
      ctx.setParams({ new: undefined });
      loadProperties().then(() => openForm(ctx, null, state.properties, load));
    }
  },
};
