import {
  actionButton, badge, bindPagination, confirmDialog, debounce, detailHero, detailRow,
  emptyState, errorBlock, esc, field, formatDate, icon, initials, input, loadingTable,
  money, openModal, pagination, select, tableCard, textarea, toast,
} from '../ui.js';

const TYPE_OPTIONS = [
  { value: 'kost', label: 'Kost' },
  { value: 'kontrakan', label: 'Kontrakan' },
  { value: 'apartemen', label: 'Apartemen' },
  { value: 'hotel', label: 'Hotel' },
];

const HEADERS = [
  'Properti',
  { label: 'Tipe' },
  'Kontak',
  'Dibuat',
  { label: 'Aksi', align: 'right' },
];

function formBody(property = {}) {
  return `
    <div class="form-grid form-grid--2">
      ${field('Nama properti', input('name', property.name || '', { placeholder: 'Contoh: Kost Melati', required: true }), { required: true })}
      ${field('Tipe', select('type', TYPE_OPTIONS, property.type || 'kost', { required: true }), { required: true })}
      ${field('Alamat', input('address', property.address || '', { placeholder: 'Jl. Contoh No. 12, Kota' }), { span: true })}
      ${field('Nomor telepon', input('phone', property.phone || '', { placeholder: '0812…' }))}
      ${field('Catatan', textarea('notes', property.notes || '', { rows: 3, placeholder: 'Catatan internal properti' }), { span: true })}
    </div>`;
}

function openForm(ctx, device, existing, reload) {
  openModal({
    title: existing ? 'Ubah properti' : 'Tambah properti',
    subtitle: existing ? `PATCH /properties/${existing.id}` : 'POST /properties',
    body: formBody(existing || {}),
    submitLabel: existing ? 'Simpan perubahan' : 'Buat properti',
    onSubmit: async (data, { close }) => {
      if (existing) {
        await ctx.api.update('properties', existing.id, data);
        toast('Properti berhasil diperbarui.', 'success');
      } else {
        await ctx.api.create('properties', data);
        toast('Properti baru berhasil dibuat.', 'success');
      }
      ctx.api.invalidateLookups('properties');
      close();
      reload();
    },
  });
}

async function openDetail(ctx, property, reload) {
  const modal = openModal({
    title: 'Detail properti',
    subtitle: `GET /properties/${property.id}`,
    size: 'lg',
    hideSubmit: true,
    body: `<div class="loading-block"><div class="skeleton skeleton-line skeleton-line--md"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line skeleton-line--sm"></div></div>`,
    footer: `
      <button type="button" class="btn btn--ghost" data-close>Tutup</button>
      <button type="button" class="btn btn--primary" data-edit>${icon('edit', 14)} Ubah properti</button>`,
  });

  const body = modal.overlay.querySelector('.modal__body');

  try {
    const [detailResponse, summaryResponse, roomsResponse] = await Promise.all([
      ctx.api.getOne('properties', property.id),
      ctx.api.get(`/properties/${property.id}/summary`),
      ctx.api.get(`/properties/${property.id}/rooms`),
    ]);

    const detail = detailResponse.data;
    const summary = summaryResponse.data;
    const rooms = roomsResponse.data || [];

    body.innerHTML = `
      ${detailHero('building', detail.name, `${detail.type} · ${detail.address || 'Alamat belum diisi'}`, 'indigo')}
      <div class="detail-grid">
        ${detailRow('Telepon', esc(detail.phone || '—'))}
        ${detailRow('Dibuat', esc(formatDate(detail.createdAt)))}
        ${detailRow('Catatan', esc(detail.notes || '—'), true)}
      </div>

      <div class="subhead">
        <span>Ringkasan kamar</span>
        <span class="kbd">GET /properties/${detail.id}/summary</span>
      </div>
      <div class="detail-grid">
        ${detailRow('Total kamar', `<strong>${Number(summary.totalRooms)}</strong>`)}
        ${detailRow('Tingkat hunian', `<strong>${Number(summary.occupancyRate)}%</strong>`)}
        ${detailRow('Terisi', badge('occupied') + ` ${Number(summary.occupied)}`)}
        ${detailRow('Tersedia', badge('available') + ` ${Number(summary.available)}`)}
        ${detailRow('Perawatan', badge('maintenance') + ` ${Number(summary.maintenance)}`)}
      </div>

      <div class="subhead">
        <span>Kamar (${rooms.length})</span>
        <span class="kbd">GET /properties/${detail.id}/rooms</span>
      </div>
      ${rooms.length ? `
        <div class="detail-list">
          ${rooms.map((room) => `
            <div class="detail-list__item">
              ${icon('bed', 15)}
              <strong>No. ${esc(room.number)}</strong>
              <span>${esc(room.type || 'Tanpa tipe')} · ${Number(room.capacity)} orang</span>
              ${badge(room.effectiveStatus || room.status)}
            </div>`).join('')}
        </div>` : '<p class="muted" style="font-size:12px">Belum ada kamar pada properti ini.</p>'}
    `;

    modal.overlay.querySelector('[data-edit]').addEventListener('click', () => {
      modal.close();
      openForm(ctx, 'properties', detail, reload);
    });
  } catch (error) {
    body.innerHTML = errorBlock(error.message, false);
  }
}

export default {
  title: 'Properti',
  subtitle: 'CRUD properti melalui /api/v1/properties — cocok untuk kost, kontrakan, apartemen, dan hotel.',
  render(container, ctx) {
    const params = ctx.params;
    const current = { rows: [], meta: null };

    container.innerHTML = `
      <div class="view-enter">
        <div class="toolbar">
          <div class="search-box">
            ${icon('search', 15)}
            <input class="input" data-search type="search" placeholder="Cari nama, alamat, atau telepon…" value="${esc(params.search || '')}" aria-label="Cari properti">
          </div>
          ${select('typeFilter', TYPE_OPTIONS, params.type || '', { placeholder: 'Semua tipe' })}
          <div class="toolbar__spacer"></div>
          <button class="btn btn--ghost" type="button" data-action="refresh">${icon('refresh', 14)} Muat ulang</button>
          <button class="btn btn--primary" type="button" data-action="create">${icon('plus', 14)} Properti</button>
        </div>
        <div data-slot>${loadingTable(HEADERS)}</div>
      </div>`;

    const view = container.querySelector('.view-enter');
    const slot = view.querySelector('[data-slot]');
    const search = view.querySelector('[data-search]');
    const typeFilter = view.querySelector('#field-typeFilter');

    let requestId = 0;

    async function load() {
      const id = ++requestId;
      slot.innerHTML = loadingTable(HEADERS);
      try {
        const response = await ctx.api.list('properties', {
          page: params.page || 1,
          perPage: 20,
          search: params.search || undefined,
          type: params.type || undefined,
        });
        if (id !== requestId) return;

        current.rows = response.data || [];
        current.meta = response.meta;

        if (!current.rows.length) {
          const filtered = Boolean(params.search || params.type);
          slot.innerHTML = tableCard(HEADERS, `<tr><td colspan="${HEADERS.length}">${emptyState({
            iconName: 'building',
            title: filtered ? 'Tidak ada properti yang cocok' : 'Belum ada properti',
            message: filtered ? 'Coba ubah kata kunci atau filter tipe properti.' : 'Tambahkan properti pertama untuk mulai mengelola kamar dan penyewa.',
            action: filtered
              ? '<button class="btn btn--ghost btn--sm" type="button" data-action="clear-filter">Hapus filter</button>'
              : '<button class="btn btn--primary btn--sm" type="button" data-action="create">Tambah properti</button>',
          })}</td></tr>`);
          return;
        }

        const rows = current.rows.map((property) => `
          <tr>
            <td>
              <div class="cell-main">
                <span class="avatar avatar--sm">${esc(initials(property.name))}</span>
                <div class="cell-main__text">
                  <strong>${esc(property.name)}</strong>
                  <span>${esc(property.address || 'Alamat belum diisi')}</span>
                </div>
              </div>
            </td>
            <td>${badge(property.type)}</td>
            <td>${property.phone ? `<span class="mono">${esc(property.phone)}</span>` : '<span class="muted">—</span>'}</td>
            <td class="nowrap muted">${esc(formatDate(property.createdAt))}</td>
            <td class="is-right">
              <div class="row-actions">
                ${actionButton('view', 'eye', 'Lihat detail', 'is-accent')}
                ${actionButton('edit', 'edit', 'Ubah properti')}
                ${actionButton('delete', 'trash', 'Hapus properti', 'is-danger')}
              </div>
            </td>
          </tr>`).join('');

        slot.innerHTML = tableCard(HEADERS, rows, pagination(current.meta));
      } catch (error) {
        if (id !== requestId) return;
        slot.innerHTML = errorBlock(error.message);
        const retry = slot.querySelector('[data-retry]');
        if (retry) retry.addEventListener('click', load);
      }
    }

    function reloadList() {
      return load();
    }

    function setFilters(patch) {
      ctx.setParams(patch);
      load();
    }

    search.addEventListener('input', debounce(() => {
      setFilters({ search: search.value.trim() || undefined, page: 1 });
    }, 350));

    typeFilter.addEventListener('change', () => {
      setFilters({ type: typeFilter.value || undefined, page: 1 });
    });

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
        openForm(ctx, 'properties', null, reloadList);
        return;
      }
      if (action === 'clear-filter') {
        search.value = '';
        typeFilter.value = '';
        ctx.setParams({ search: undefined, type: undefined, page: 1 });
        load();
        return;
      }

      const row = button.closest('tr');
      if (!row) return;
      const index = Array.from(slot.querySelectorAll('tbody tr')).indexOf(row);
      const property = current.rows[index];
      if (!property) return;

      if (action === 'view') {
        openDetail(ctx, property, reloadList);
      } else if (action === 'edit') {
        openForm(ctx, 'properties', property, reloadList);
      } else if (action === 'delete') {
        confirmDialog({
          title: 'Hapus properti?',
          message: `Properti "${property.name}" akan dihapus permanen. Properti yang masih memiliki kamar akan ditolak oleh API.`,
          confirmLabel: 'Hapus properti',
        }).then(async (confirmed) => {
          if (!confirmed) return;
          try {
            await ctx.api.remove('properties', property.id);
            ctx.api.invalidateLookups();
            toast('Properti berhasil dihapus.', 'success');
            if (current.rows.length === 1 && Number(current.meta?.page) > 1) {
              ctx.setParams({ page: Number(current.meta.page) - 1 });
            }
            load();
          } catch (error) {
            toast(error.message, 'error');
          }
        });
      }
    });

    view.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action="refresh"]');
      if (button) load();
    });

    load();

    if (params.new === '1') {
      ctx.setParams({ new: undefined });
      openForm(ctx, 'properties', null, reloadList);
    }
  },
};
