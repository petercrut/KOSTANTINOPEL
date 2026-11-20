import {
  actionButton, badge, confirmDialog, debounce, emptyState, errorBlock, esc, field,
  formatDate, icon, input, loadingTable, openModal, pagination, select, tableCard,
  textarea, toast,
} from '../ui.js';

const HEADERS = [
  'Pengumuman',
  'Properti',
  'Penulis',
  { label: 'Status' },
  'Dibuat',
  { label: 'Aksi', align: 'right' },
];

function formBody(announcement = {}, properties = []) {
  return `
    <div class="form-grid">
      ${field('Judul pengumuman', input('title', announcement.title || '', {
        placeholder: 'Contoh: Pemeliharaan air PDAM hari Sabtu', required: true,
      }), { required: true })}
      ${field('Isi pengumuman', textarea('body', announcement.body || '', {
        rows: 6, placeholder: 'Tulis informasi yang akan dibaca penyewa…', required: true,
      }), { required: true })}
      ${field('Berlaku untuk properti', select('propertyId', properties.map((property) => ({
        value: property.id, label: property.name,
      })), announcement.propertyId || '', { placeholder: 'Semua properti', block: true }), {
        hint: 'Kosongkan agar pengumuman tampil untuk seluruh properti.',
      })}
      ${field('Penulis', input('author', announcement.author || 'Admin', { placeholder: 'Nama penulis' }))}
      <label class="check">
        <input type="checkbox" name="pinned" value="1" ${announcement.pinned ? 'checked' : ''}>
        Sematkan pengumuman di paling atas
      </label>
    </div>
    <div class="form-note" style="margin-top:12px">
      ${icon('megaphone', 15)}
      <div>Pengumuman tersemat ditampilkan lebih dulu di portal penyewa dan aplikasi utama.</div>
    </div>`;
}

function openForm(ctx, existing, state, reload) {
  openModal({
    title: existing ? 'Ubah pengumuman' : 'Buat pengumuman',
    subtitle: existing ? `PATCH /announcements/${existing.id}` : 'POST /announcements',
    size: 'lg',
    body: formBody(existing || {}, state.properties),
    submitLabel: existing ? 'Simpan perubahan' : 'Terbitkan pengumuman',
    onSubmit: async (data, { close }) => {
      const payload = { ...data, pinned: Boolean(data.pinned) };
      if (payload.propertyId === undefined) payload.propertyId = null;
      if (existing) {
        await ctx.api.update('announcements', existing.id, payload);
        toast('Pengumuman berhasil diperbarui.', 'success');
      } else {
        await ctx.api.create('announcements', payload);
        toast('Pengumuman berhasil diterbitkan.', 'success');
      }
      close();
      reload();
    },
  });
}

async function openDetail(ctx, announcement, state, reload) {
  const modal = openModal({
    title: 'Detail pengumuman',
    subtitle: `GET /announcements/${announcement.id}`,
    hideSubmit: true,
    body: `<div class="loading-block"><div class="skeleton skeleton-line skeleton-line--md"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line skeleton-line--sm"></div></div>`,
    footer: `
      <button type="button" class="btn btn--ghost" data-close>Tutup</button>
      <button type="button" class="btn btn--ghost" data-edit>${icon('edit', 14)} Ubah</button>`,
  });

  const body = modal.overlay.querySelector('.modal__body');

  try {
    const response = await ctx.api.getOne('announcements', announcement.id);
    const detail = response.data;
    const property = state.propertyMap.get(String(detail.propertyId));

    body.innerHTML = `
      <div class="detail-hero tone-violet">
        <div class="detail-hero__icon">${icon('megaphone', 22)}</div>
        <div style="min-width:0">
          <h3>${esc(detail.title)}</h3>
          <p>${esc(detail.author)} · ${esc(formatDate(detail.createdAt))}</p>
        </div>
        ${detail.pinned ? `<div style="margin-left:auto"><span class="badge badge--violet">Disematkan</span></div>` : ''}
      </div>
      <div style="margin-top:16px;white-space:pre-wrap;font-size:13px;line-height:1.7">${esc(detail.body)}</div>
      <div class="detail-grid">
        <div class="detail-row">
          <span class="detail-row__label">Cakupan</span>
          <span class="detail-row__value">${property ? esc(property.name) : 'Semua properti'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-row__label">Disematkan</span>
          <span class="detail-row__value">${detail.pinned ? 'Ya' : 'Tidak'}</span>
        </div>
      </div>`;

    modal.overlay.querySelector('[data-edit]').addEventListener('click', () => {
      modal.close();
      openForm(ctx, detail, state, reload);
    });
  } catch (error) {
    body.innerHTML = errorBlock(error.message, false);
  }
}

export default {
  title: 'Pengumuman',
  subtitle: 'Terbitkan informasi untuk penyewa, sematkan pengumuman penting, dan atur cakupan properti.',
  render(container, ctx) {
    const params = ctx.params;
    const state = { rows: [], meta: null, properties: [], propertyMap: new Map() };

    container.innerHTML = `
      <div class="view-enter">
        <div class="toolbar">
          <div class="search-box">
            ${icon('search', 15)}
            <input class="input" data-search type="search" placeholder="Cari judul, isi, atau penulis…" value="${esc(params.search || '')}" aria-label="Cari pengumuman">
          </div>
          <select class="select" data-property aria-label="Filter properti"><option value="">Semua properti</option></select>
          <select class="select" data-pinned aria-label="Filter sematan">
            <option value="">Semua</option>
            <option value="true"${params.pinned === 'true' ? ' selected' : ''}>Disematkan</option>
            <option value="false"${params.pinned === 'false' ? ' selected' : ''}>Tidak disematkan</option>
          </select>
          <div class="toolbar__spacer"></div>
          <button class="btn btn--ghost" type="button" data-action="refresh">${icon('refresh', 14)} Muat ulang</button>
          <button class="btn btn--primary" type="button" data-action="create">${icon('plus', 14)} Pengumuman</button>
        </div>
        <div data-slot>${loadingTable(HEADERS)}</div>
      </div>`;

    const view = container.querySelector('.view-enter');
    const slot = view.querySelector('[data-slot]');
    const search = view.querySelector('[data-search]');
    const propertyFilter = view.querySelector('[data-property]');
    const pinnedFilter = view.querySelector('[data-pinned]');
    let requestId = 0;

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
        const response = await ctx.api.list('announcements', {
          page: params.page || 1,
          perPage: 20,
          search: params.search || undefined,
          propertyId: params.propertyId || undefined,
          pinned: params.pinned || undefined,
        });
        if (id !== requestId) return;

        state.rows = response.data || [];
        state.meta = response.meta;

        if (!state.rows.length) {
          const filtered = Boolean(params.search || params.propertyId || params.pinned);
          slot.innerHTML = tableCard(HEADERS, `<tr><td colspan="${HEADERS.length}">${emptyState({
            iconName: 'megaphone',
            title: filtered ? 'Tidak ada pengumuman yang cocok' : 'Belum ada pengumuman',
            message: filtered ? 'Ubah filter atau kata kunci pencarian.' : 'Terbitkan pengumuman pertama untuk menyampaikan informasi ke penyewa.',
            action: filtered
              ? '<button class="btn btn--ghost btn--sm" type="button" data-action="clear-filter">Hapus filter</button>'
              : '<button class="btn btn--primary btn--sm" type="button" data-action="create">Buat pengumuman</button>',
          })}</td></tr>`);
          return;
        }

        const rows = state.rows.map((announcement) => {
          const property = state.propertyMap.get(String(announcement.propertyId));
          return `
            <tr>
              <td>
                <div class="cell-main" style="max-width:360px">
                  <span class="avatar avatar--sm">${announcement.pinned ? icon('pin', 14) : icon('megaphone', 14)}</span>
                  <div class="cell-main__text">
                    <strong>${esc(announcement.title)}</strong>
                    <span>${esc(announcement.body)}</span>
                  </div>
                </div>
              </td>
              <td class="muted">${property ? esc(property.name) : 'Semua properti'}</td>
              <td>${esc(announcement.author || '—')}</td>
              <td>${announcement.pinned
                ? '<span class="badge badge--violet">Disematkan</span>'
                : '<span class="badge badge--slate">Normal</span>'}</td>
              <td class="nowrap muted">${esc(formatDate(announcement.createdAt))}</td>
              <td class="is-right">
                <div class="row-actions">
                  ${actionButton('view', 'eye', 'Lihat pengumuman', 'is-accent', `data-id="${esc(announcement.id)}"`)}
                  ${actionButton('pin', 'pin', announcement.pinned ? 'Lepas sematan' : 'Sematkan', '', `data-id="${esc(announcement.id)}"`)}
                  ${actionButton('edit', 'edit', 'Ubah pengumuman', '', `data-id="${esc(announcement.id)}"`)}
                  ${actionButton('delete', 'trash', 'Hapus pengumuman', 'is-danger', `data-id="${esc(announcement.id)}"`)}
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

    propertyFilter.addEventListener('change', () => setFilters({ propertyId: propertyFilter.value || undefined, page: 1 }));
    pinnedFilter.addEventListener('change', () => setFilters({ pinned: pinnedFilter.value || undefined, page: 1 }));

    function findAnnouncement(id) {
      return state.rows.find((announcement) => String(announcement.id) === String(id));
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
        propertyFilter.value = '';
        pinnedFilter.value = '';
        ctx.setParams({ search: undefined, propertyId: undefined, pinned: undefined, page: 1 });
        load();
        return;
      }

      const announcement = findAnnouncement(button.dataset.id);
      if (!announcement) return;

      if (action === 'view') {
        openDetail(ctx, announcement, state, load);
      } else if (action === 'edit') {
        openForm(ctx, announcement, state, load);
      } else if (action === 'pin') {
        const next = !announcement.pinned;
        ctx.api.patch(`/announcements/${announcement.id}/pin`, { pinned: next })
          .then(() => {
            toast(next ? 'Pengumuman disematkan.' : 'Sematan pengumuman dilepas.', 'success');
            load();
          })
          .catch((error) => toast(error.message, 'error'));
      } else if (action === 'delete') {
        confirmDialog({
          title: 'Hapus pengumuman?',
          message: `Pengumuman "${announcement.title}" akan dihapus permanen.`,
          confirmLabel: 'Hapus pengumuman',
        }).then(async (confirmed) => {
          if (!confirmed) return;
          try {
            await ctx.api.remove('announcements', announcement.id);
            toast('Pengumuman berhasil dihapus.', 'success');
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
      loadProperties().then(() => openForm(ctx, null, state, load));
    }
  },
};
