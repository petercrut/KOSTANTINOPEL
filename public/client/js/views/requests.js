import {
  actionButton, badge, confirmDialog, debounce, emptyState, errorBlock, esc, field,
  formatDate, icon, input, loadingTable, openModal, pagination, select, tableCard,
  textarea, toast,
} from '../ui.js';

const CATEGORY_OPTIONS = [
  { value: 'perbaikan', label: 'Perbaikan' },
  { value: 'kebersihan', label: 'Kebersihan' },
  { value: 'keamanan', label: 'Keamanan' },
  { value: 'keluhan', label: 'Keluhan' },
  { value: 'lainnya', label: 'Lainnya' },
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Baru' },
  { value: 'in_progress', label: 'Diproses' },
  { value: 'done', label: 'Selesai' },
  { value: 'rejected', label: 'Ditolak' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Rendah' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Tinggi' },
];

const HEADERS = [
  'Laporan',
  'Penyewa',
  { label: 'Kategori' },
  { label: 'Prioritas' },
  { label: 'Status' },
  'Dibuat',
  { label: 'Aksi', align: 'right' },
];

function formBody(ctx, request = {}, tenants = [], isEdit = false) {
  return `
    <div class="form-grid form-grid--2">
      ${field('Penyewa', select('tenantId', tenants.map((tenant) => ({
        value: tenant.id,
        label: `${tenant.name} — kamar ${tenant.roomId ? `#${tenant.roomId}` : '—'}`,
      })), request.tenantId || '', { placeholder: 'Pilih penyewa', required: true, block: true }), { required: true, hint: isEdit ? 'Penyewa tidak dapat diubah.' : 'Laporan otomatis mengikuti properti dan kamar penyewa.' })}
      ${field('Kategori', select('category', CATEGORY_OPTIONS, request.category || 'lainnya', { block: true }))}
      ${field('Prioritas', select('priority', PRIORITY_OPTIONS, request.priority || 'normal', { block: true }))}
      ${field('Status', select('status', STATUS_OPTIONS, request.status || 'open', { block: true }))}
      ${field('Judul laporan', input('title', request.title || '', { placeholder: 'Contoh: AC kamar tidak dingin', required: true }), { required: true, span: true })}
      ${field('Deskripsi', textarea('description', request.description || '', { rows: 4, placeholder: 'Jelaskan keluhan atau permintaan secara detail', required: true }), { required: true, span: true })}
    </div>`;
}

function openForm(ctx, existing, state, reload) {
  const modal = openModal({
    title: existing ? 'Ubah laporan' : 'Buat laporan',
    subtitle: existing ? `PATCH /requests/${existing.id}` : 'POST /requests',
    size: 'lg',
    body: formBody(ctx, existing || {}, state.tenants, Boolean(existing)),
    submitLabel: existing ? 'Simpan perubahan' : 'Buat laporan',
    onSubmit: async (data, { close }) => {
      if (existing) {
        const payload = { ...data };
        delete payload.tenantId;
        await ctx.api.update('requests', existing.id, payload);
        toast('Laporan berhasil diperbarui.', 'success');
      } else {
        await ctx.api.create('requests', data);
        toast('Laporan baru berhasil dibuat.', 'success');
      }
      close();
      reload();
    },
  });

  if (existing) {
    const tenantSelect = modal.form?.elements.namedItem('tenantId');
    if (tenantSelect) tenantSelect.disabled = true;
  }
}

function openRespond(ctx, request, reload) {
  openModal({
    title: `Tanggapi laporan ${request.code}`,
    subtitle: `POST /requests/${request.id}/response`,
    body: `
      <div class="notice" style="margin-bottom:14px">
        ${icon('info', 17)}
        <div>
          <strong>${esc(request.title)}</strong>
          <div class="muted" style="font-size:11.5px">${esc(request.description)}</div>
        </div>
      </div>
      <div class="form-grid">
        ${field('Status penanganan', select('status', STATUS_OPTIONS.slice(0, 3), request.status === 'rejected' ? 'open' : request.status || 'in_progress', { block: true }), { required: true })}
        ${field('Tanggapan admin', textarea('response', request.response || '', {
          rows: 5, placeholder: 'Contoh: Teknisi akan datang besok pukul 10.00.', required: true,
        }), { required: true })}
      </div>`,
    submitLabel: 'Kirim tanggapan',
    onSubmit: async (data, { close }) => {
      await ctx.api.post(`/requests/${request.id}/response`, data);
      toast('Tanggapan berhasil dikirim.', 'success');
      close();
      reload();
    },
  });
}

async function openDetail(ctx, request, state, reload) {
  const modal = openModal({
    title: 'Detail laporan',
    subtitle: `GET /requests/${request.id}`,
    size: 'lg',
    hideSubmit: true,
    body: `<div class="loading-block"><div class="skeleton skeleton-line skeleton-line--md"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line skeleton-line--sm"></div></div>`,
    footer: `
      <button type="button" class="btn btn--ghost" data-close>Tutup</button>
      <button type="button" class="btn btn--ghost" data-edit>${icon('edit', 14)} Ubah</button>
      <button type="button" class="btn btn--primary" data-respond>${icon('send', 14)} Tanggapi</button>`,
  });

  const body = modal.overlay.querySelector('.modal__body');

  try {
    const response = await ctx.api.getOne('requests', request.id);
    const detail = response.data;
    const tenant = state.tenantMap.get(String(detail.tenantId));
    const room = state.roomMap.get(String(detail.roomId));
    const property = state.propertyMap.get(String(detail.propertyId));

    body.innerHTML = `
      <div class="detail-hero tone-${detail.priority === 'high' ? 'red' : 'indigo'}">
        <div class="detail-hero__icon">${icon('wrench', 22)}</div>
        <div style="min-width:0">
          <h3>${esc(detail.title)}</h3>
          <p>${esc(detail.code)} · ${esc(tenant ? tenant.name : 'Penyewa')}${room ? ` · Kamar ${esc(room.number)}` : ''}${property ? ` · ${esc(property.name)}` : ''}</p>
        </div>
        <div style="margin-left:auto;display:flex;gap:6px">${badge(detail.priority)}${badge(detail.status)}</div>
      </div>
      <div class="detail-grid">
        ${`<div class="detail-row"><span class="detail-row__label">Kategori</span><span class="detail-row__value">${badge(detail.category)}</span></div>`}
        ${`<div class="detail-row"><span class="detail-row__label">Dibuat</span><span class="detail-row__value">${esc(formatDate(detail.createdAt))}</span></div>`}
        ${`<div class="detail-row detail-row--wide"><span class="detail-row__label">Deskripsi</span><span class="detail-row__value">${esc(detail.description)}</span></div>`}
      </div>

      <div class="subhead">Tanggapan admin</div>
      ${detail.response ? `
        <div class="notice" style="align-items:flex-start">
          ${icon('send', 17)}
          <div>
            <div>${esc(detail.response)}</div>
            <div class="muted" style="font-size:10.5px;margin-top:6px">
              ${esc(formatDate(detail.respondedAt))}${detail.resolvedAt ? ` · selesai ${esc(formatDate(detail.resolvedAt))}` : ''}
            </div>
          </div>
        </div>` : '<p class="muted" style="font-size:12px">Belum ada tanggapan.</p>'}
    `;

    modal.overlay.querySelector('[data-edit]').addEventListener('click', () => {
      modal.close();
      openForm(ctx, detail, state, reload);
    });
    modal.overlay.querySelector('[data-respond]').addEventListener('click', () => {
      modal.close();
      openRespond(ctx, detail, reload);
    });
  } catch (error) {
    body.innerHTML = errorBlock(error.message, false);
  }
}

export default {
  title: 'Laporan & Permintaan',
  subtitle: 'Kelola laporan perbaikan, kebersihan, dan keluhan penyewa beserta tanggapan admin.',
  render(container, ctx) {
    const params = ctx.params;
    const state = {
      rows: [], meta: null, tenants: [], rooms: [], properties: [],
      tenantMap: new Map(), roomMap: new Map(), propertyMap: new Map(),
    };

    container.innerHTML = `
      <div class="view-enter">
        <div class="toolbar">
          <div class="search-box">
            ${icon('search', 15)}
            <input class="input" data-search type="search" placeholder="Cari kode, judul, atau deskripsi…" value="${esc(params.search || '')}" aria-label="Cari laporan">
          </div>
          <select class="select" data-status aria-label="Filter status">
            <option value="">Semua status</option>
            ${STATUS_OPTIONS.map((option) => `<option value="${option.value}"${params.status === option.value ? ' selected' : ''}>${esc(option.label)}</option>`).join('')}
          </select>
          <select class="select" data-category aria-label="Filter kategori">
            <option value="">Semua kategori</option>
            ${CATEGORY_OPTIONS.map((option) => `<option value="${option.value}"${params.category === option.value ? ' selected' : ''}>${esc(option.label)}</option>`).join('')}
          </select>
          <select class="select" data-priority aria-label="Filter prioritas">
            <option value="">Semua prioritas</option>
            ${PRIORITY_OPTIONS.map((option) => `<option value="${option.value}"${params.priority === option.value ? ' selected' : ''}>${esc(option.label)}</option>`).join('')}
          </select>
          <div class="toolbar__spacer"></div>
          <button class="btn btn--ghost" type="button" data-action="refresh">${icon('refresh', 14)} Muat ulang</button>
          <button class="btn btn--primary" type="button" data-action="create">${icon('plus', 14)} Laporan</button>
        </div>
        <div data-slot>${loadingTable(HEADERS)}</div>
      </div>`;

    const view = container.querySelector('.view-enter');
    const slot = view.querySelector('[data-slot]');
    const search = view.querySelector('[data-search]');
    const statusFilter = view.querySelector('[data-status]');
    const categoryFilter = view.querySelector('[data-category]');
    const priorityFilter = view.querySelector('[data-priority]');
    let requestId = 0;

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
        const response = await ctx.api.list('requests', {
          page: params.page || 1,
          perPage: 20,
          search: params.search || undefined,
          status: params.status || undefined,
          category: params.category || undefined,
          priority: params.priority || undefined,
        });
        if (id !== requestId) return;

        state.rows = response.data || [];
        state.meta = response.meta;

        if (!state.rows.length) {
          const filtered = Boolean(params.search || params.status || params.category || params.priority);
          slot.innerHTML = tableCard(HEADERS, `<tr><td colspan="${HEADERS.length}">${emptyState({
            iconName: 'wrench',
            title: filtered ? 'Tidak ada laporan yang cocok' : 'Belum ada laporan',
            message: filtered ? 'Ubah filter status, kategori, atau prioritas.' : 'Catat laporan pertama dari penyewa untuk mulai menindaklanjuti.',
            action: filtered
              ? '<button class="btn btn--ghost btn--sm" type="button" data-action="clear-filter">Hapus filter</button>'
              : '<button class="btn btn--primary btn--sm" type="button" data-action="create">Buat laporan</button>',
          })}</td></tr>`);
          return;
        }

        const rows = state.rows.map((request) => {
          const tenant = state.tenantMap.get(String(request.tenantId));
          const room = state.roomMap.get(String(request.roomId));
          const property = state.propertyMap.get(String(request.propertyId));
          return `
            <tr>
              <td>
                <div class="cell-stack" style="max-width:320px">
                  <strong class="mono">${esc(request.code)}</strong>
                  <span class="truncate">${esc(request.title)}</span>
                </div>
              </td>
              <td>
                <div class="cell-stack">
                  <strong>${esc(tenant ? tenant.name : '—')}</strong>
                  <span>${room ? `Kamar ${esc(room.number)}` : '—'}${property ? ` · ${esc(property.name)}` : ''}</span>
                </div>
              </td>
              <td>${badge(request.category)}</td>
              <td>${badge(request.priority)}</td>
              <td>${badge(request.status)}</td>
              <td class="nowrap muted">${esc(formatDate(request.createdAt))}</td>
              <td class="is-right">
                <div class="row-actions">
                  ${actionButton('view', 'eye', 'Lihat detail', 'is-accent', `data-id="${esc(request.id)}"`)}
                  ${actionButton('respond', 'send', 'Tanggapi laporan', '', `data-id="${esc(request.id)}"`)}
                  ${actionButton('edit', 'edit', 'Ubah laporan', '', `data-id="${esc(request.id)}"`)}
                  ${actionButton('delete', 'trash', 'Hapus laporan', 'is-danger', `data-id="${esc(request.id)}"`)}
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
    categoryFilter.addEventListener('change', () => setFilters({ category: categoryFilter.value || undefined, page: 1 }));
    priorityFilter.addEventListener('change', () => setFilters({ priority: priorityFilter.value || undefined, page: 1 }));

    function findRequest(id) {
      return state.rows.find((request) => String(request.id) === String(id));
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
        categoryFilter.value = '';
        priorityFilter.value = '';
        ctx.setParams({ search: undefined, status: undefined, category: undefined, priority: undefined, page: 1 });
        load();
        return;
      }

      const request = findRequest(button.dataset.id);
      if (!request) return;

      if (action === 'view') {
        openDetail(ctx, request, state, load);
      } else if (action === 'respond') {
        openRespond(ctx, request, load);
      } else if (action === 'edit') {
        openForm(ctx, request, state, load);
      } else if (action === 'delete') {
        confirmDialog({
          title: 'Hapus laporan?',
          message: `Laporan ${request.code} — "${request.title}" akan dihapus permanen.`,
          confirmLabel: 'Hapus laporan',
        }).then(async (confirmed) => {
          if (!confirmed) return;
          try {
            await ctx.api.remove('requests', request.id);
            toast('Laporan berhasil dihapus.', 'success');
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
