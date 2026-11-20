import {
  badge, errorBlock, esc, formatDate, icon, money, moneyShort, number, relativeTime,
} from '../ui.js';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 19) return 'Selamat sore';
  return 'Selamat malam';
}

function statCard(toneName, iconName, labelText, value, sub) {
  return `
    <div class="stat-card tone-${toneName}">
      <div class="stat-card__icon">${icon(iconName, 20)}</div>
      <div style="min-width:0">
        <span class="stat-card__label">${esc(labelText)}</span>
        <span class="stat-card__value">${value}</span>
        <span class="stat-card__sub">${sub}</span>
      </div>
    </div>`;
}

function activityIcon(type) {
  return { booking: 'calendar', invoice: 'receipt', request: 'wrench' }[type] || 'activity';
}

function renderRevenue(points) {
  if (!points.length) return '<p class="muted" style="font-size:12px">Belum ada data pendapatan.</p>';
  const max = Math.max(...points.map((point) => Number(point.total) || 0), 1);

  return `
    <div class="bars">
      ${points.map((point) => {
        const value = Number(point.total) || 0;
        const height = Math.max(3, Math.round((value / max) * 100));
        return `
          <div class="bar-col" title="${esc(point.label)}: ${esc(money(value))}">
            <span class="bar-col__value">${value ? esc(moneyShort(value)) : ''}</span>
            <div class="bar-col__track"><div class="bar-col__fill" style="height:${height}%"></div></div>
            <span class="bar-col__label">${esc((point.label || '').split(' ')[0])}</span>
          </div>`;
      }).join('')}
    </div>`;
}

function renderProperties(rows) {
  if (!rows.length) return '<p class="muted" style="font-size:12px">Belum ada properti.</p>';
  return rows.map((row) => `
    <div class="progress-row">
      <div class="progress-row__label">
        <span>${esc(row.name)}</span>
        <span class="tag">${esc(row.type)}</span>
      </div>
      <span class="progress-row__value">${row.rate}%</span>
      <div class="progress"><span style="width:${Math.min(100, row.rate)}%"></span></div>
    </div>`).join('');
}

function renderActivity(items) {
  if (!items.length) return '<p class="muted" style="font-size:12px">Belum ada aktivitas.</p>';
  return items.map((item) => `
    <div class="activity__item">
      <div class="activity__icon">${icon(activityIcon(item.type), 15)}</div>
      <div class="activity__body">
        <div class="activity__title">${esc(item.title)}</div>
        <div class="activity__meta">
          ${badge(item.status)}
          <span>${esc(relativeTime(item.createdAt))}</span>
        </div>
      </div>
      ${Number(item.amount) ? `<div class="activity__amount">${esc(money(item.amount))}</div>` : ''}
    </div>`).join('');
}

export default {
  title: 'Dashboard',
  subtitle: 'Ringkasan operasional langsung dari endpoint /dashboard dan /invoices.',
  render(container, ctx) {
    container.innerHTML = '<div class="view-enter"><div class="loading-block"><div class="skeleton skeleton-line skeleton-line--md"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line skeleton-line--sm"></div></div></div>';

    load();

    async function load() {
      try {
        const [statsResponse, occupancyResponse, revenueResponse, propertyResponse, activityResponse] = await Promise.all([
          ctx.api.get('/dashboard/stats'),
          ctx.api.get('/dashboard/occupancy'),
          ctx.api.get('/dashboard/revenue', { query: { months: 6 } }),
          ctx.api.get('/dashboard/occupancy/by-property'),
          ctx.api.get('/dashboard/activity', { query: { limit: 8 } }),
        ]);

        const stats = statsResponse.data;
        const occupancy = occupancyResponse.data;
        const points = revenueResponse.data || [];
        const properties = propertyResponse.data || [];
        const activity = activityResponse.data || [];
        const user = ctx.user || {};

        const total = Number(occupancy.total) || 0;
        const occupied = Number(occupancy.occupied) || 0;
        const available = Number(occupancy.available) || 0;
        const maintenance = Number(occupancy.maintenance) || 0;
        const occupiedPercent = total ? Math.round((occupied / total) * 100) : 0;
        const availablePercent = total ? Math.round(((occupied + available) / total) * 100) : 100;

        container.innerHTML = `
          <div class="view-enter">
            <div class="panel" style="margin-bottom:16px;background:linear-gradient(120deg,var(--brand-soft),var(--surface) 55%,var(--surface));">
              <div class="panel__body" style="display:flex;align-items:center;gap:18px;flex-wrap:wrap">
                <div style="flex:1;min-width:220px">
                  <div class="topbar__eyebrow" style="margin-bottom:4px">${icon('sparkles', 13)} ${esc(formatDate(new Date().toISOString()))}</div>
                  <h2 style="font-size:19px;font-weight:800;letter-spacing:-0.03em">${esc(greeting())}, ${esc(user.name || 'Admin')}</h2>
                  <p class="muted" style="font-size:12px;margin-top:2px">
                    ${number(stats.roomsOccupied)} dari ${number(stats.roomsTotal)} kamar terisi ·
                    ${number(stats.arrivals)} kedatangan & ${number(stats.departures)} keberangkatan hari ini ·
                    ${number(stats.inHouse)} tamu menginap.
                  </p>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                  <button class="btn btn--ghost" type="button" data-action="refresh">${icon('refresh', 14)} Segarkan</button>
                  <button class="btn btn--primary" type="button" data-action="explorer">${icon('terminal', 14)} Buka API Explorer</button>
                </div>
              </div>
            </div>

            <div class="stat-grid">
              ${statCard('green', 'wallet', 'Pendapatan Bulan Ini', esc(money(stats.revenueThisMonth)), `${number(stats.activeTenants)} penyewa aktif`)}
              ${statCard('indigo', 'activity', 'Tingkat Hunian', `${number(stats.occupancyRate)}<small>%</small>`, `${number(stats.roomsOccupied)} / ${number(stats.roomsTotal)} kamar`)}
              ${statCard('amber', 'receipt', 'Belum Dibayar', esc(money(stats.outstanding)), `Terlambat ${esc(money(stats.late))}`)}
              ${statCard('blue', 'users', 'Penyewa Aktif', number(stats.activeTenants), `${number(stats.properties)} properti · ${number(stats.pendingBookings)} booking menunggu`)}
            </div>

            <div class="dash-grid">
              <div class="stack">
                <section class="panel">
                  <div class="panel__head">
                    <div>
                      <h3>Pendapatan 6 bulan</h3>
                      <p>Tagihan lunas per bulan.</p>
                    </div>
                    <span class="kbd">GET /dashboard/revenue</span>
                  </div>
                  <div class="panel__body">${renderRevenue(points)}</div>
                </section>

                <section class="panel">
                  <div class="panel__head">
                    <div>
                      <h3>Aktivitas terbaru</h3>
                      <p>Booking, tagihan, dan laporan terakhir.</p>
                    </div>
                    <span class="kbd">GET /dashboard/activity</span>
                  </div>
                  <div class="panel__body">
                    <div class="activity">${renderActivity(activity)}</div>
                  </div>
                </section>
              </div>

              <div class="stack">
                <section class="panel">
                  <div class="panel__head">
                    <div>
                      <h3>Okupansi kamar</h3>
                      <p>Status efektif hari ini.</p>
                    </div>
                    <span class="kbd">GET /dashboard/occupancy</span>
                  </div>
                  <div class="panel__body">
                    <div class="occupancy-widget">
                      <div class="ring" style="--seg-occupied:${occupiedPercent}%;--seg-available:${availablePercent}%">
                        <div class="ring__center">
                          <strong>${number(occupancy.rate)}<small style="font-size:11px">%</small></strong>
                          <span>okupansi</span>
                        </div>
                      </div>
                      <div class="legend">
                        <div class="legend__row"><span class="legend__dot" style="background:var(--green)"></span> Terisi <strong>${number(occupied)}</strong></div>
                        <div class="legend__row"><span class="legend__dot" style="background:var(--amber)"></span> Tersedia <strong>${number(available)}</strong></div>
                        <div class="legend__row"><span class="legend__dot" style="background:var(--slate)"></span> Perawatan <strong>${number(maintenance)}</strong></div>
                        <div class="legend__row"><span class="legend__dot" style="background:var(--surface-3);box-shadow:inset 0 0 0 1px var(--border)"></span> Total kamar <strong>${number(total)}</strong></div>
                      </div>
                    </div>
                  </div>
                </section>

                <section class="panel">
                  <div class="panel__head">
                    <div>
                      <h3>Okupansi per properti</h3>
                      <p>Persentase kamar terisi.</p>
                    </div>
                  </div>
                  <div class="panel__body">${renderProperties(properties)}</div>
                </section>

                <section class="panel">
                  <div class="panel__head">
                    <div>
                      <h3>Aksi cepat</h3>
                      <p>Buat data baru via REST API.</p>
                    </div>
                  </div>
                  <div class="panel__body">
                    <div class="quick-grid">
                      <button class="quick-tile" type="button" data-action="new-property">${icon('building', 16)} Properti</button>
                      <button class="quick-tile" type="button" data-action="new-room">${icon('bed', 16)} Kamar</button>
                      <button class="quick-tile" type="button" data-action="new-booking">${icon('calendar', 16)} Booking</button>
                      <button class="quick-tile" type="button" data-action="new-invoice">${icon('receipt', 16)} Tagihan</button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>`;

        const view = container.querySelector('.view-enter');
        view.addEventListener('click', (event) => {
          const action = event.target.closest('[data-action]');
          if (!action) return;
          const name = action.dataset.action;
          if (name === 'refresh') {
            load();
            return;
          }
          if (name === 'explorer') {
            ctx.navigate('explorer');
            return;
          }
          const map = {
            'new-property': 'properties?new=1',
            'new-room': 'rooms?new=1',
            'new-booking': 'bookings?new=1',
            'new-invoice': 'invoices?new=1',
          };
          if (map[name]) ctx.navigate(map[name]);
        });
      } catch (error) {
        container.innerHTML = `<div class="view-enter">${errorBlock(error.message)}</div>`;
        const retry = container.querySelector('[data-retry]');
        if (retry) retry.addEventListener('click', load);
      }
    }
  },
};
