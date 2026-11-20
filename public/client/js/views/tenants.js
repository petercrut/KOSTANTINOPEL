import {
  actionButton, badge, confirmDialog, debounce, detailHero, detailRow, emptyState,
  errorBlock, esc, field, formatDate, icon, initials, input, loadingTable, money,
  openModal, pagination, select, tableCard, textarea, toast, today,
} from '../ui.js';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Selesai' },
];

const GENDER_OPTIONS = [
  { value: 'Laki-laki', label: 'Laki-laki' },
  { value: 'Perempuan', label: 'Perempuan' },
];

const HEADERS = [
  'Penyewa',
  'Kamar',
  'Masa sewa',
  { label: 'Status' },
  { label: 'Akun' },
  { label: 'Aksi', align: 'right' },
];

function roomOptions(rooms, properties) {
  const names = new Map(properties.map((property) => [String(property.id), property.name]));
  return rooms
    .slice()
    .sort((a, b) => String(a.propertyId).localeCompare(String(b.propertyId)) || String(a.number).localeCompare(String(b.number)))
    .map((room) => ({
      value: room.id,
      label: `No. ${room.number} — ${names.get(String(room.propertyId)) || `Properti #${room.propertyId}`}`,
      disabled: room.effectiveStatus === 'occupied',
    }));
}

function formBody(tenant = {}, rooms = [], properties = [], isEdit = false) {
  const list = roomOptions(rooms, properties);
  const roomSelect = `
    <select class="select select--block" name="roomId" id="field-roomId" required>
      <option value="">Pilih kamar</option>
      ${list.map((item) => `<option value="${esc(item.value)}"${String(item.value) === String(tenant.roomId || '') ? ' selected' : ''}${item.disabled ? ' disabled' : ''}>${esc(item.label)}${item.disabled ? ' (terisi)' : ''}</option>`).join('')}
    </select>`;

  return `
    <div class="form-section">Data penyewa</div>
    <div class="form-grid form-grid--2">
      ${field('Nama lengkap', input('name', tenant.name || '', { placeholder: 'Nama sesuai KTP', required: true }), { required: true })}
      ${field('Kamar', roomSelect, { required: true })}
      ${field('Nomor telepon', input('phone', tenant.phone || '', { placeholder: '0812…' }))}
      ${field('Email', input('email', tenant.email || '', { type: 'email', placeholder: 'nama@email.com' }))}
      ${field('Nomor identitas (KTP)', input('idNumber', tenant.idNumber || '', { placeholder: '3271…' }))}
      ${field('Jenis kelamin', select('gender', GENDER_OPTIONS, tenant.gender || '', { placeholder: 'Pilih jenis kelamin', block: true }))}
      ${field('Tanggal lahir', input('birthDate', tenant.birthDate || '', { type: 'date' }))}
      ${field('Pekerjaan', input('occupation', tenant.occupation || '', { placeholder: 'Karyawan, mahasiswa, …' }))}
      ${field('Alamat asal', input('address', tenant.address || '', { placeholder: 'Alamat lengkap' }), { span: true })}
    </div>

    <div class="form-section">Masa sewa</div>
    <div class="form-grid form-grid--2">
      ${field('Tanggal masuk', input('startDate', tenant.startDate || today(), { type: 'date', required: true }), { required: true })}
      ${field('Tanggal keluar', input('endDate', tenant.endDate || '', { type: 'date' }))}
      ${isEdit ? '' : field('Tagihan awal (Rp)', input('amount', '', { type: 'number', kind: 'number', min: 0, step: 10000, placeholder: 'Kosongkan untuk harga kamar' }), { hint: 'Opsional. Dibuat otomatis sebagai tagihan sewa pertama.', span: true })}
    </div>

    <div class="form-section">Kontak darurat</div>
    <div class="form-grid form-grid--2">
      ${field('Nama kontak', input('emergencyName', tenant.emergencyName || '', { placeholder: 'Nama keluarga / kerabat' }))}
      ${field('Telepon kontak', input('emergencyPhone', tenant.emergencyPhone || '', { placeholder: '0812…' }))}
      ${field('Catatan', textarea('note', tenant.note || '', { rows: 3, placeholder: 'Catatan tambahan tentang penyewa' }), { span: true })}
    </div>`;
}

function openForm(ctx, existing, state, reload) {
  openModal({
    title: existing ? 'Ubah data penyewa' : 'Tambah penyewa',
    subtitle: existing ? `PATCH /tenants/${existing.id}` : 'POST /tenants',
    size: 'lg',
    body: formBody(existing || {}, state.rooms, state.properties, Boolean(existing)),
    submitLabel: existing ? 'Simpan perubahan' : 'Buat penyewa',
    onSubmit: async (data, { close }) => {
      if (existing) {
        await ctx.api.update('tenants', existing.id, data);
        toast('Data penyewa berhasil diperbarui.', 'success');
      } else {
        await ctx.api.create('tenants', data);
        toast('Penyewa baru berhasil dibuat beserta tagihan pertama.', 'success');
      }
      ctx.api.invalidateLookups('tenants');
      close();
      reload();
    },
  });
}

function openAccount(ctx, tenant, reload) {
  const existing = tenant.loginAccount;

  if (!existing) {
    openModal({
      title: 'Buat akun portal',
      subtitle: `POST /tenants/${tenant.id}/account`,
      size: 'sm',
      submitLabel: 'Buat akun',
      body: `
        <div class="form-note" style="margin-bottom:14px">
          ${icon('info', 15)}
          <div>Akun ini dipakai penyewa untuk masuk ke portal penyewa di aplikasi utama.</div>
        </div>
        <div class="form-grid">
          ${field('Email akun', input('email', tenant.email || '', { type: 'email', required: true, placeholder: 'nama@email.com' }), { required: true })}
          ${field('Password', input('password', '', { type: 'password', required: true, placeholder: 'Minimal 6 karakter', autocomplete: 'new-password' }), { required: true })}
        </div>`,
      onSubmit: async (data, { close }) => {
        await ctx.api.post(`/tenants/${tenant.id}/account`, data);
        toast('Akun portal berhasil dibuat.', 'success');
        close();
        reload();
      },
    });
    return;
  }

  const modal = openModal({
    title: 'Akun portal penyewa',
    subtitle: `PATCH /tenants/${tenant.id}/account/password`,
    size: 'sm',
    submitLabel: 'Reset password',
    body: `
      ${detailHero('user', existing.name, existing.email, 'violet')}
      <div class="detail-grid">
        ${detailRow('Peran', badge(existing.role))}
        ${detailRow('Dibuat', esc(formatDate(existing.createdAt)))}
      </div>
      <div class="form-note" style="margin:14px 0">
        ${icon('shield', 15)}
        <div>Masukkan password baru bila penyewa lupa kata sandi portal.</div>
      </div>
      <div class="form-grid">
        ${field('Password baru', input('password', '', { type: 'password', required: true, placeholder: 'Minimal 6 karakter', autocomplete: 'new-password' }), { required: true })}
      </div>`,
    footer: `
      <button type="button" class="btn btn--danger-soft" data-delete-account>${icon('trash', 14)} Hapus akun</button>
      <div style="flex:1"></div>
      <button type="button" class="btn btn--ghost" data-close>Batal</button>
      <button type="submit" class="btn btn--primary" data-submit>Reset password</button>`,
    onSubmit: async (data, { close }) => {
      await ctx.api.patch(`/tenants/${tenant.id}/account/password`, data);
      toast('Password akun berhasil direset.', 'success');
      close();
      reload();
    },
  });

  modal.overlay.querySelector('[data-delete-account]').addEventListener('click', async () => {
    const confirmed = await confirmDialog({
      title: 'Hapus akun portal?',
      message: `Akun login untuk ${existing.email} akan dihapus. Data penyewa tetap tersimpan.`,
      confirmLabel: 'Hapus akun',
    });
    if (!confirmed) return;
    try {
      await ctx.api.delete(`/tenants/${tenant.id}/account`);
      toast('Akun portal berhasil dihapus.', 'success');
      modal.close();
      reload();
    } catch (error) {
      toast(error.message, 'error');
    }
  });
}

async function openDetail(ctx, tenant, state, reload) {
  const modal = openModal({
    title: 'Detail penyewa',
    subtitle: `GET /tenants/${tenant.id}`,
    size: 'lg',
    hideSubmit: true,
    body: `<div class="loading-block"><div class="skeleton skeleton-line skeleton-line--md"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line skeleton-line--sm"></div></div>`,
    footer: `
      <button type="button" class="btn btn--ghost" data-close>Tutup</button>
      <button type="button" class="btn btn--primary" data-edit>${icon('edit', 14)} Ubah data</button>`,
  });

  const body = modal.overlay.querySelector('.modal__body');

  try {
    const [detailResponse, invoiceResponse, requestResponse] = await Promise.all([
      ctx.api.getOne('tenants', tenant.id),
      ctx.api.get(`/tenants/${tenant.id}/invoices`),
      ctx.api.get(`/tenants/${tenant.id}/requests`),
    ]);

    const detail = detailResponse.data;
    const invoices = invoiceResponse.data || [];
    const requests = requestResponse.data || [];
    const room = state.roomMap.get(String(detail.roomId));
    const property = state.propertyMap.get(String(detail.propertyId));

    body.innerHTML = `
      ${detailHero('user', detail.name, `${room ? `Kamar ${room.number}` : 'Kamar'} · ${property ? property.name : 'Properti'}`, 'blue')}
      <div class="detail-grid">
        ${detailRow('Status', badge(detail.status))}
        ${detailRow('Akun portal', detail.loginAccount ? badge('active') + ' ' + esc(detail.loginAccount.email) : '<span class="muted">Belum ada</span>')}
        ${detailRow('Telepon', esc(detail.phone || '—'))}
        ${detailRow('Email', esc(detail.email || '—'))}
        ${detailRow('No. identitas', esc(detail.idNumber || '—'))}
        ${detailRow('Jenis kelamin', esc(detail.gender || '—'))}
        ${detailRow('Tanggal lahir', esc(formatDate(detail.birthDate)))}
        ${detailRow('Pekerjaan', esc(detail.occupation || '—'))}
        ${detailRow('Masa sewa', `${esc(formatDate(detail.startDate))} → ${detail.endDate ? esc(formatDate(detail.endDate)) : 'sekarang'}`)}
        ${detailRow('Alamat', esc(detail.address || '—'), true)}
        ${detailRow('Kontak darurat', `${esc(detail.emergencyName || '—')}${detail.emergencyPhone ? ` · ${esc(detail.emergencyPhone)}` : ''}`)}
        ${detailRow('Catatan', esc(detail.note || '—'), true)}
      </div>

      <div class="subhead">
        <span>Tagihan (${invoices.length})</span>
        <span class="kbd">GET /tenants/${detail.id}/invoices</span>
      </div>
      ${invoices.length ? `
        <div class="detail-list">
          ${invoices.map((invoice) => `
            <div class="detail-list__item">
              <strong>${esc(invoice.code)}</strong>
              <span class="truncate">${esc(invoice.description)}</span>
              ${badge(invoice.effectiveStatus)}
              <span class="mono">${esc(money(invoice.amount))}</span>
            </div>`).join('')}
        </div>` : '<p class="muted" style="font-size:12px">Belum ada tagihan.</p>'}

      <div class="subhead">
        <span>Laporan (${requests.length})</span>
        <span class="kbd">GET /tenants/${detail.id}/requests</span>
      </div>
      ${requests.length ? `
        <div class="detail-list">
          ${requests.map((request) => `
            <div class="detail-list__item">
              <strong>${esc(request.code)}</strong>
              <span class="truncate">${esc(request.title)}</span>
              ${badge(request.status)}
            </div>`).join('')}
        </div>` : '<p class="muted" style="font-size:12px">Belum ada laporan.</p>'}
    `;

    modal.overlay.querySelector('[data-edit]').addEventListener('click', () => {
      modal.close();
      openForm(ctx, detail, state, reload);
    });
  } catch (error) {
    body.innerHTML = errorBlock(error.message, false);
  }
}

export default {
  title: 'Penyewa',
  subtitle: 'CRUD penyewa, akhiri masa sewa, dan kelola akun portal lewat /api/v1/tenants.',
  render(container, ctx) {
    const params = ctx.params;
    const state = {
      rows: [], meta: null, properties: [], rooms: [],
      propertyMap: new Map(), roomMap: new Map(),
    };

    container.innerHTML = `
      <div class="view-enter">
        <div class="toolbar">
          <div class="search-box">
            ${icon('search', 15)}
            <input class="input" data-search type="search" placeholder="Cari nama, email, telepon, atau NIK…" value="${esc(params.search || '')}" aria-label="Cari penyewa">
          </div>
          <select class="select" data-property aria-label="Filter properti"><option value="">Semua properti</option></select>
          <select class="select" data-status aria-label="Filter status">
            <option value="">Semua status</option>
            ${STATUS_OPTIONS.map((option) => `<option value="${option.value}"${params.status === option.value ? ' selected' : ''}>${esc(option.label)}</option>`).join('')}
          </select>
          <div class="toolbar__spacer"></div>
          <button class="btn btn--ghost" type="button" data-action="refresh">${icon('refresh', 14)} Muat ulang</button>
          <button class="btn btn--primary" type="button" data-action="create">${icon('plus', 14)} Penyewa</button>
        </div>
        <div data-slot>${loadingTable(HEADERS)}</div>
      </div>`;

    const view = container.querySelector('.view-enter');
    const slot = view.querySelector('[data-slot]');
    const search = view.querySelector('[data-search]');
    const propertyFilter = view.querySelector('[data-property]');
    const statusFilter = view.querySelector('[data-status]');
    let requestId = 0;

    async function loadLookups() {
      const lookups = await ctx.api.loadLookups(['properties', 'rooms']);
      state.properties = lookups.properties || [];
      state.rooms = lookups.rooms || [];
      state.propertyMap = new Map(state.properties.map((property) => [String(property.id), property]));
      state.roomMap = new Map(state.rooms.map((room) => [String(room.id), room]));
      propertyFilter.innerHTML = `<option value="">Semua properti</option>${state.properties.map((property) => (
        `<option value="${esc(property.id)}"${String(params.propertyId) === String(property.id) ? ' selected' : ''}>${esc(property.name)}</option>`
      )).join('')}`;
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
        const response = await ctx.api.list('tenants', {
          page: params.page || 1,
          perPage: 20,
          search: params.search || undefined,
          status: params.status || undefined,
          propertyId: params.propertyId || undefined,
        });
        if (id !== requestId) return;

        state.rows = response.data || [];
        state.meta = response.meta;

        if (!state.rows.length) {
          const filtered = Boolean(params.search || params.status || params.propertyId);
          slot.innerHTML = tableCard(HEADERS, `<tr><td colspan="${HEADERS.length}">${emptyState({
            iconName: 'users',
            title: filtered ? 'Tidak ada penyewa yang cocok' : 'Belum ada penyewa',
            message: filtered ? 'Ubah kata kunci atau filter status/properti.' : 'Tambahkan penyewa untuk kamar yang tersedia.',
            action: filtered
              ? '<button class="btn btn--ghost btn--sm" type="button" data-action="clear-filter">Hapus filter</button>'
              : '<button class="btn btn--primary btn--sm" type="button" data-action="create">Tambah penyewa</button>',
          })}</td></tr>`);
          return;
        }

        const rows = state.rows.map((tenant) => {
          const room = roomLabel(tenant.roomId);
          return `
            <tr>
              <td>
                <div class="cell-main">
                  <span class="avatar avatar--sm">${esc(initials(tenant.name))}</span>
                  <div class="cell-main__text">
                    <strong>${esc(tenant.name)}</strong>
                    <span>${esc(tenant.email || tenant.phone || 'Kontak belum diisi')}</span>
                  </div>
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
                  <strong>${esc(formatDate(tenant.startDate))}</strong>
                  <span>${tenant.endDate ? `s.d. ${esc(formatDate(tenant.endDate))}` : 'masih berjalan'}</span>
                </div>
              </td>
              <td>${badge(tenant.status)}</td>
              <td>${tenant.loginAccount ? `<span class="badge badge--green">Akun aktif</span>` : '<span class="muted" style="font-size:11px">Belum ada</span>'}</td>
              <td class="is-right">
                <div class="row-actions">
                  ${actionButton('view', 'eye', 'Lihat detail', 'is-accent', `data-id="${esc(tenant.id)}"`)}
                  ${actionButton('edit', 'edit', 'Ubah penyewa', '', `data-id="${esc(tenant.id)}"`)}
                  ${actionButton('account', 'key', tenant.loginAccount ? 'Kelola akun portal' : 'Buat akun portal', '', `data-id="${esc(tenant.id)}"`)}
                  ${tenant.status === 'active' ? actionButton('end', 'door', 'Akhiri masa sewa', '', `data-id="${esc(tenant.id)}"`) : ''}
                  ${tenant.status !== 'active' ? actionButton('delete', 'trash', 'Hapus penyewa', 'is-danger', `data-id="${esc(tenant.id)}"`) : ''}
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

    function findTenant(id) {
      return state.rows.find((tenant) => String(tenant.id) === String(id));
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
        statusFilter.value = '';
        ctx.setParams({ search: undefined, propertyId: undefined, status: undefined, page: 1 });
        load();
        return;
      }

      const tenant = findTenant(button.dataset.id);
      if (!tenant) return;

      if (action === 'view') {
        openDetail(ctx, tenant, state, load);
      } else if (action === 'edit') {
        openForm(ctx, tenant, state, load);
      } else if (action === 'account') {
        openAccount(ctx, tenant, load);
      } else if (action === 'end') {
        confirmDialog({
          title: 'Akhiri masa sewa?',
          message: `Masa sewa ${tenant.name} akan diakhiri hari ini dan kamar menjadi tersedia. Tindakan ini mengubah status penyewa menjadi selesai.`,
          confirmLabel: 'Akhiri masa sewa',
        }).then(async (confirmed) => {
          if (!confirmed) return;
          try {
            await ctx.api.post(`/tenants/${tenant.id}/end-tenancy`);
            ctx.api.invalidateLookups('tenants');
            toast('Masa sewa telah diakhiri.', 'success');
            load();
          } catch (error) {
            toast(error.message, 'error');
          }
        });
      } else if (action === 'delete') {
        confirmDialog({
          title: 'Hapus penyewa?',
          message: `Data penyewa "${tenant.name}" akan dihapus permanen.`,
          confirmLabel: 'Hapus penyewa',
        }).then(async (confirmed) => {
          if (!confirmed) return;
          try {
            await ctx.api.remove('tenants', tenant.id);
            ctx.api.invalidateLookups('tenants');
            toast('Penyewa berhasil dihapus.', 'success');
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
