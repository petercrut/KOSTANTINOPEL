import {
  copyText, esc, highlightJson, icon, toast,
} from '../ui.js';

const METHODS = ['GET', 'POST', 'PATCH', 'DELETE'];

const PRESETS = [
  {
    group: 'Sistem',
    items: [
      { method: 'GET', path: '/health' },
      { method: 'GET', path: '/auth/me' },
    ],
  },
  {
    group: 'Dashboard',
    items: [
      { method: 'GET', path: '/dashboard/stats' },
      { method: 'GET', path: '/dashboard/occupancy' },
      { method: 'GET', path: '/dashboard/revenue?months=6' },
    ],
  },
  {
    group: 'Data master',
    items: [
      { method: 'GET', path: '/properties?perPage=5' },
      { method: 'GET', path: '/rooms?perPage=5' },
      { method: 'GET', path: '/tenants?perPage=5&status=active' },
    ],
  },
  {
    group: 'Transaksi',
    items: [
      { method: 'GET', path: '/bookings?perPage=5' },
      { method: 'GET', path: '/invoices?perPage=5&status=late' },
      { method: 'GET', path: '/invoices/summary' },
      { method: 'GET', path: '/requests?perPage=5&status=open' },
      { method: 'GET', path: '/announcements?perPage=5' },
    ],
  },
  {
    group: 'Contoh tulis',
    items: [
      {
        method: 'POST',
        path: '/announcements',
        body: {
          title: 'Contoh pengumuman dari API Explorer',
          body: 'Uji coba membuat pengumuman melalui REST API.',
          pinned: false,
          author: 'API Explorer',
        },
      },
      {
        method: 'POST',
        path: '/bookings/quote',
        body: { roomId: 1, checkIn: new Date().toISOString().slice(0, 10), checkOut: new Date(Date.now() + 86400000).toISOString().slice(0, 10), rentType: 'harian' },
      },
    ],
  },
];

export default {
  title: 'API Explorer',
  subtitle: 'Uji endpoint REST langsung dari browser. Setiap permintaan memakai token login Anda dan tercatat di panel log.',
  render(container, ctx) {
    container.innerHTML = `
      <div class="view-enter">
        <div class="explorer">
          <section class="explorer__panel">
            <div class="explorer__head">${icon('terminal', 16)} Permintaan</div>
            <div class="explorer__body">
              <div class="field" style="margin-bottom:10px">
                <label>Endpoint</label>
                <div class="request-line">
                  <select class="select" data-method aria-label="Metode HTTP">
                    ${METHODS.map((method) => `<option value="${method}">${method}</option>`).join('')}
                  </select>
                  <input class="input" data-path value="/dashboard/stats" placeholder="/properties?perPage=5" aria-label="Path endpoint">
                </div>
              </div>
              <div class="field" data-body-field>
                <label>Body JSON</label>
                <textarea class="textarea mono" data-body rows="8" placeholder='{"title": "Contoh"}' style="font-size:11.5px">{}</textarea>
              </div>
              <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
                <button class="btn btn--primary" type="button" data-send>${icon('send', 14)} Kirim permintaan</button>
                <button class="btn btn--ghost" type="button" data-copy>${icon('copy', 14)} Salin cURL</button>
                <button class="btn btn--ghost" type="button" data-clear>${icon('refresh', 14)} Reset</button>
              </div>
              <div class="notice" style="margin-top:12px">
                ${icon('shield', 16)}
                <div>Base URL <span class="code-inline">${esc(ctx.api.absoluteUrl(''))}</span> — token Bearer dikirim otomatis dari sesi login.</div>
              </div>

              ${PRESETS.map((group) => `
                <div class="preset-group">
                  <div class="preset-group__label">${esc(group.group)}</div>
                  <div class="presets">
                    ${group.items.map((preset) => `
                      <button class="preset" type="button" data-preset="${esc(JSON.stringify(preset))}">
                        <span class="preset__method" data-method="${preset.method}">${preset.method}</span>
                        ${esc(preset.path)}
                      </button>`).join('')}
                  </div>
                </div>`).join('')}
            </div>
          </section>

          <section>
            <div class="response-console">
              <div class="response-console__bar">
                <span class="console-dot"></span><span class="console-dot"></span><span class="console-dot"></span>
                <span class="response-console__title" data-console-title>Respons API</span>
                <span class="status-pill" data-status hidden>—</span>
              </div>
              <pre data-output>Kirim permintaan untuk melihat respons di sini.</pre>
              <div class="response-meta" data-meta>
                <span>Belum ada permintaan</span>
              </div>
            </div>
            <div class="panel" style="margin-top:16px">
              <div class="panel__head">
                <div>
                  <h3>Tip</h3>
                  <p>Semua endpoint di explorer memakai API yang sama dengan halaman CRUD.</p>
                </div>
              </div>
              <div class="panel__body" style="display:grid;gap:8px">
                <div class="detail-list__item">${icon('info', 15)}<span>Tambahkan <span class="code-inline">?perPage=5</span> untuk membatasi jumlah data.</span></div>
                <div class="detail-list__item">${icon('info', 15)}<span>Gunakan <span class="code-inline">search=nama</span> untuk pencarian teks.</span></div>
                <div class="detail-list__item">${icon('info', 15)}<span>Respons error memakai amplop <span class="code-inline">{ error: { code, message, details } }</span>.</span></div>
              </div>
            </div>
          </section>
        </div>
      </div>`;

    const view = container.querySelector('.view-enter');
    const methodSelect = view.querySelector('[data-method]');
    const pathInput = view.querySelector('[data-path]');
    const bodyField = view.querySelector('[data-body-field]');
    const bodyInput = view.querySelector('[data-body]');
    const output = view.querySelector('[data-output]');
    const statusPill = view.querySelector('[data-status]');
    const metaBox = view.querySelector('[data-meta]');
    const titleEl = view.querySelector('[data-console-title]');
    const sendButton = view.querySelector('[data-send]');

    function syncBodyVisibility() {
      const needsBody = ['POST', 'PATCH', 'PUT'].includes(methodSelect.value);
      bodyField.style.display = needsBody ? '' : 'none';
    }

    function setPreset(preset) {
      methodSelect.value = preset.method;
      pathInput.value = preset.path;
      bodyInput.value = preset.body ? JSON.stringify(preset.body, null, 2) : '';
      syncBodyVisibility();
      send();
    }

    async function send() {
      const method = methodSelect.value;
      const path = pathInput.value.trim();
      if (!path) {
        toast('Path endpoint belum diisi.', 'warning');
        pathInput.focus();
        return;
      }

      let body;
      if (['POST', 'PATCH', 'PUT'].includes(method)) {
        const raw = bodyInput.value.trim();
        if (raw) {
          try {
            body = JSON.parse(raw);
          } catch (error) {
            toast('Body bukan JSON valid.', 'error');
            bodyInput.focus();
            return;
          }
        }
      }

      sendButton.disabled = true;
      sendButton.classList.add('is-busy');
      output.textContent = 'Mengirim permintaan…';
      statusPill.hidden = true;
      metaBox.innerHTML = '<span>Menunggu respons…</span>';
      titleEl.textContent = `${method} ${path}`;

      const started = performance.now();
      let status = 0;
      let ok = false;
      let payload = null;
      let message = '';

      try {
        payload = await ctx.api.request(method, path, { body });
        ok = true;
        status = 200;
      } catch (error) {
        status = error.status || 0;
        ok = false;
        message = error.message || 'Permintaan gagal.';
        payload = error.payload ?? { error: { code: error.code, message } };
      } finally {
        sendButton.disabled = false;
        sendButton.classList.remove('is-busy');
      }

      const elapsed = Math.round(performance.now() - started);

      if (status === 200) {
        const log = ctx.api.log[0];
        if (log) status = log.status;
        ok = status >= 200 && status < 300;
      }

      statusPill.hidden = false;
      statusPill.textContent = status ? `${status} ${status === 204 ? 'No Content' : ok ? 'OK' : 'Error'}` : 'Network error';
      statusPill.classList.toggle('is-bad', !ok);

      if (payload === null || payload === undefined || payload === '') {
        output.textContent = status === 204 ? '204 No Content — permintaan berhasil tanpa isi respons.' : 'Respons kosong.';
      } else if (typeof payload === 'string') {
        output.textContent = payload;
      } else {
        output.innerHTML = highlightJson(payload);
      }

      metaBox.innerHTML = `
        <span>${esc(method)} ${esc(path)}</span>
        <span>${esc(String(status || 'ERR'))} · ${elapsed} ms</span>
        <span>${esc(new Date().toLocaleTimeString('id-ID'))}</span>
        ${message ? `<span style="color:#f87171">${esc(message)}</span>` : ''}`;
    }

    methodSelect.addEventListener('change', syncBodyVisibility);

    sendButton.addEventListener('click', send);

    pathInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        send();
      }
    });

    view.addEventListener('click', (event) => {
      const presetButton = event.target.closest('[data-preset]');
      if (presetButton) {
        try {
          setPreset(JSON.parse(presetButton.dataset.preset));
        } catch (error) {
          toast('Preset tidak valid.', 'error');
        }
        return;
      }

      if (event.target.closest('[data-send]')) {
        send();
        return;
      }

      if (event.target.closest('[data-clear]')) {
        methodSelect.value = 'GET';
        pathInput.value = '/dashboard/stats';
        bodyInput.value = '{}';
        output.textContent = 'Kirim permintaan untuk melihat respons di sini.';
        statusPill.hidden = true;
        metaBox.innerHTML = '<span>Belum ada permintaan</span>';
        titleEl.textContent = 'Respons API';
        syncBodyVisibility();
        return;
      }

      if (event.target.closest('[data-copy]')) {
        const method = methodSelect.value;
        const curl = `curl -X ${method} "${ctx.api.absoluteUrl(pathInput.value.trim())}" \\\n  -H "Accept: application/json" \\\n  -H "Authorization: Bearer ${ctx.api.token ? '$TOKEN' : ''}"${
          ['POST', 'PATCH', 'PUT'].includes(method) && bodyInput.value.trim()
            ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${bodyInput.value.trim()}'`
            : ''
        }`;
        copyText(curl);
      }
    });

    syncBodyVisibility();

    if (ctx.params.path) {
      pathInput.value = ctx.params.path;
      if (ctx.params.method) methodSelect.value = String(ctx.params.method).toUpperCase();
      syncBodyVisibility();
      send();
    }
  },
};
