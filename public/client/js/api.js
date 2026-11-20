/**
 * Kostantinopel REST API client.
 *
 * Same-origin by default (`/api/v1`), so the standalone client served at
 * `/client` talks to the Laravel app without any CORS setup.
 */

const KEYS = {
  baseUrl: 'kostantinopel.client.baseUrl',
  token: 'kostantinopel.client.token',
  user: 'kostantinopel.client.user',
  theme: 'kostantinopel.client.theme',
};

const DEFAULT_BASE = '/api/v1';

function safeGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    /* storage penuh / diblokir — abaikan */
  }
}

function safeRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    /* abaikan */
  }
}

function readUser() {
  const raw = safeGet(KEYS.user);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    return null;
  }
}

function normalizeBase(value) {
  const raw = String(value || '').trim();
  if (!raw) return DEFAULT_BASE;
  return raw.replace(/\/+$/, '');
}

export class ApiError extends Error {
  constructor(status, payload, meta = {}) {
    const envelope = payload && typeof payload === 'object' ? payload.error : null;
    const message = (envelope && envelope.message)
      || (payload && typeof payload === 'object' && payload.message)
      || (status === 0
        ? 'Tidak dapat terhubung ke API. Pastikan server Laravel sedang berjalan.'
        : `Permintaan gagal (HTTP ${status}).`);

    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = (envelope && envelope.code) || (status === 0 ? 'NETWORK_ERROR' : 'HTTP_ERROR');
    this.details = (envelope && Array.isArray(envelope.details)) ? envelope.details : [];
    this.payload = payload;
    this.meta = meta;
  }
}

export { KEYS, DEFAULT_BASE, safeGet, safeSet, safeRemove };

export class ApiClient {
  constructor() {
    this.baseUrl = normalizeBase(safeGet(KEYS.baseUrl) || DEFAULT_BASE);
    this.token = safeGet(KEYS.token) || '';
    this.user = readUser();
    this._logListeners = new Set();
    this._unauthorizedListeners = new Set();
    this._log = [];
    this._logSeq = 0;
    this._lookups = {};
  }

  /* ------------------------------ session ------------------------------ */

  get isAuthenticated() {
    return Boolean(this.token);
  }

  get basePath() {
    return this.baseUrl;
  }

  setBaseUrl(value) {
    this.baseUrl = normalizeBase(value);
    safeSet(KEYS.baseUrl, this.baseUrl);
    this.invalidateLookups();
  }

  setSession(token, user) {
    this.token = token || '';
    this.user = user || null;
    safeSet(KEYS.token, this.token);
    if (this.user) {
      safeSet(KEYS.user, JSON.stringify(this.user));
    } else {
      safeRemove(KEYS.user);
    }
  }

  updateUser(user) {
    this.user = user;
    if (user) safeSet(KEYS.user, JSON.stringify(user));
  }

  clearSession() {
    this.token = '';
    this.user = null;
    safeRemove(KEYS.token);
    safeRemove(KEYS.user);
    this._lookups = {};
  }

  absoluteUrl(path = '') {
    const base = this.baseUrl;
    const suffix = path.startsWith('/') ? path : `/${path}`;
    if (/^https?:\/\//i.test(base)) return `${base}${suffix}`;
    return `${window.location.origin}${base}${suffix}`;
  }

  /* ------------------------------ events ------------------------------- */

  onLog(listener) {
    this._logListeners.add(listener);
    return () => this._logListeners.delete(listener);
  }

  onUnauthorized(listener) {
    this._unauthorizedListeners.add(listener);
    return () => this._unauthorizedListeners.delete(listener);
  }

  get log() {
    return this._log.slice().reverse();
  }

  clearLog() {
    this._log = [];
    this._emitLog({ type: 'clear' });
  }

  _emitLog(entry) {
    for (const listener of this._logListeners) {
      try {
        listener(entry);
      } catch (error) {
        /* listener rusak tidak boleh mematikan request */
      }
    }
  }

  _handleUnauthorized() {
    this.clearSession();
    for (const listener of this._unauthorizedListeners) {
      try {
        listener();
      } catch (error) {
        /* abaikan */
      }
    }
  }

  /* ------------------------------ request ------------------------------ */

  _buildUrl(path, query) {
    let url;
    if (/^https?:\/\//i.test(path)) {
      url = path;
    } else {
      url = this.baseUrl + (path.startsWith('/') ? path : `/${path}`);
    }

    if (query && typeof query === 'object') {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === '') continue;
        params.set(key, String(value));
      }
      const qs = params.toString();
      if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    }

    return url;
  }

  async request(method, path, options = {}) {
    const { body, query, signal, skipAuth = false } = options;
    const url = this._buildUrl(path, query);
    const headers = { Accept: 'application/json' };

    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (this.token && !skipAuth) headers.Authorization = `Bearer ${this.token}`;

    const started = performance.now();
    let response;
    let text = '';
    let payload = null;

    try {
      response = await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      });
      text = await response.text();
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch (error) {
          payload = text;
        }
      }
    } catch (error) {
      if (error && error.name === 'AbortError') throw error;

      const entry = {
        type: 'entry',
        id: ++this._logSeq,
        at: new Date().toISOString(),
        method,
        path: url,
        status: 0,
        ok: false,
        ms: Math.round(performance.now() - started),
        requestBody: body === undefined ? null : body,
        responseBody: { error: { code: 'NETWORK_ERROR', message: 'Koneksi ke server gagal.' } },
      };
      this._record(entry);
      throw new ApiError(0, entry.responseBody, entry);
    }

    const entry = {
      type: 'entry',
      id: ++this._logSeq,
      at: new Date().toISOString(),
      method,
      path: url,
      status: response.status,
      ok: response.ok,
      ms: Math.round(performance.now() - started),
      requestBody: body === undefined ? null : body,
      responseBody: payload,
      bytes: text ? new Blob([text]).size : 0,
    };
    this._record(entry);

    if (!response.ok) {
      const isLogin = path === '/auth/login';
      if (response.status === 401 && !isLogin && !skipAuth) {
        this._handleUnauthorized();
      }
      throw new ApiError(response.status, payload, entry);
    }

    return response.status === 204 ? null : payload;
  }

  _record(entry) {
    this._log.push(entry);
    if (this._log.length > 80) this._log.splice(0, this._log.length - 80);
    this._emitLog(entry);
  }

  get(path, options = {}) {
    return this.request('GET', path, options);
  }

  post(path, body, options = {}) {
    return this.request('POST', path, { ...options, body });
  }

  patch(path, body, options = {}) {
    return this.request('PATCH', path, { ...options, body });
  }

  delete(path, options = {}) {
    return this.request('DELETE', path, options);
  }

  /* --------------------------- raw logging ----------------------------- */

  /** Catat request manual (dipakai API explorer agar tetap tampil di log). */
  recordManual(entry) {
    const record = {
      type: 'entry',
      id: ++this._logSeq,
      at: new Date().toISOString(),
      method: entry.method,
      path: entry.path,
      status: entry.status,
      ok: entry.ok,
      ms: entry.ms,
      requestBody: entry.requestBody ?? null,
      responseBody: entry.responseBody ?? null,
    };
    this._record(record);
    return record;
  }

  /* ------------------------------ endpoints ---------------------------- */

  async login(email, password) {
    const payload = await this.post('/auth/login', { email, password }, { skipAuth: true });
    if (!payload || !payload.token) {
      throw new ApiError(500, { error: { message: 'Respons login tidak berisi token.' } });
    }
    this.setSession(payload.token, payload.user);
    return payload;
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } catch (error) {
      /* token kedaluwarsa tetap dianggap logout lokal */
    } finally {
      this.clearSession();
    }
  }

  async me() {
    const payload = await this.get('/auth/me');
    this.updateUser(payload.data);
    return payload.data;
  }

  list(resource, params = {}) {
    return this.get(`/${resource}`, { query: params });
  }

  getOne(resource, id) {
    return this.get(`/${resource}/${id}`);
  }

  create(resource, body) {
    return this.post(`/${resource}`, body);
  }

  update(resource, id, body) {
    return this.patch(`/${resource}/${id}`, body);
  }

  remove(resource, id) {
    return this.delete(`/${resource}/${id}`);
  }

  /* ------------------------------ lookups ------------------------------ */

  _lookup(key, resource) {
    const cached = this._lookups[key];
    const now = Date.now();
    if (cached && now - cached.at < 60_000) return cached.promise;

    const promise = this.list(resource, { perPage: 100 })
      .then((response) => response.data || [])
      .catch((error) => {
        delete this._lookups[key];
        throw error;
      });

    this._lookups[key] = { at: now, promise };
    return promise;
  }

  properties() {
    return this._lookup('properties', 'properties');
  }

  rooms() {
    return this._lookup('rooms', 'rooms');
  }

  tenants() {
    return this._lookup('tenants', 'tenants');
  }

  invalidateLookups(resource) {
    if (!resource) {
      this._lookups = {};
      return;
    }
    if (resource === 'properties') delete this._lookups.properties;
    if (resource === 'rooms') delete this._lookups.rooms;
    if (resource === 'tenants') delete this._lookups.tenants;
  }

  /** Muat beberapa lookup sekaligus tanpa menggagalkan semuanya. */
  async loadLookups(keys) {
    const map = {
      properties: () => this.properties(),
      rooms: () => this.rooms(),
      tenants: () => this.tenants(),
    };
    const entries = await Promise.all(
      keys.map(async (key) => {
        try {
          const value = await map[key]();
          return [key, value];
        } catch (error) {
          return [key, []];
        }
      }),
    );
    return Object.fromEntries(entries);
  }
}
