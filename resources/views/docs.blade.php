@extends('layouts.guest')

@section('title', 'Dokumentasi API')
@section('body-class', 'docs')

@push('styles')
    <link rel="stylesheet" href="{{ asset('assets/vendor/swagger-ui/swagger-ui.css') }}">
    <link rel="stylesheet" href="{{ asset('assets/css/docs.css') }}">
@endpush

@section('content')
    <header class="docs-topbar">
        <a class="brand" href="{{ route('home') }}">
            <span class="brand-logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 11.5 12 6.5l5.5 5"/><path d="M8.5 10.5V18h7v-7.5"/></svg>
            </span>
            Kostantinopel
        </a>

        <nav class="docs-nav" aria-label="Navigasi dokumentasi">
            <a href="{{ route('home') }}">Beranda</a>
            @auth
                <a href="{{ auth()->user()->isAdmin() ? route('dashboard') : route('portal.dashboard') }}">Aplikasi</a>
            @else
                <a href="{{ route('login') }}">Masuk</a>
            @endauth
            <a href="{{ route('docs') }}" class="active" aria-current="page">Dokumentasi API</a>
            <a href="{{ route('openapi') }}" download>openapi.json</a>
        </nav>

        <div class="docs-actions">
            @include('partials.theme-switch')
            <a class="btn btn-ghost" href="{{ route('openapi') }}" download>Unduh JSON</a>
            <a class="btn btn-primary" href="{{ auth()->check() ? (auth()->user()->isAdmin() ? route('dashboard') : route('portal.dashboard')) : route('login') }}">Buka Aplikasi</a>
        </div>
    </header>

    <main class="docs-shell">
        <section class="docs-hero">
            <span class="eyebrow">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m8 6-6 6 6 6M16 6l6 6-6 6"/></svg>
                OpenAPI 3.0.3
            </span>
            <h1>Dokumentasi API Kostantinopel</h1>
            <p class="lead">
                Kontrak REST API untuk sistem manajemen co-living — kost, kontrakan, apartemen, dan hotel.
                Mencakup autentikasi, properti, kamar, penyewa, booking, tagihan, laporan, pengumuman,
                analitik, portal penyewa, dan endpoint sistem. Setiap operasi menampilkan skema request,
                response, serta peran yang diizinkan.
            </p>

            <div class="hero-actions">
                <a class="btn btn-primary" href="{{ route('openapi') }}" download>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg>
                    Unduh openapi.json
                </a>
                <a class="btn btn-ghost" href="{{ route('home') }}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>
                    Kembali ke Beranda
                </a>
            </div>

            <div class="docs-pills">
                <span class="docs-pill">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 6v6c0 5 3.4 9.2 8 10 4.6-.8 8-5 8-10V6z"/><path d="m9 12 2 2 4-4"/></svg>
                    Bearer Token · Sanctum
                </span>
                <span class="docs-pill">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M8 4v16"/></svg>
                    <span id="pill-modules">12 modul</span>
                </span>
                <span class="docs-pill">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
                    <span id="pill-ops">57 operasi</span>
                </span>
                <span class="docs-pill">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h5M9.5 14.5h5"/></svg>
                    Nominal Rupiah (integer)
                </span>
            </div>
        </section>

        <div class="docs-stats">
            <div class="docs-stat">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 6h6a3 3 0 0 1 3 3v6M15 18H9a3 3 0 0 1-3-3V9"/></svg></span>
                <span><span class="value" id="stat-paths">—</span><span class="label">Path / resource</span></span>
            </div>
            <div class="docs-stat">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17 10 11l4 4 6-8"/><path d="M14 7h6v6"/></svg></span>
                <span><span class="value" id="stat-ops">—</span><span class="label">Operasi HTTP</span></span>
            </div>
            <div class="docs-stat">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/></svg></span>
                <span><span class="value" id="stat-schemas">—</span><span class="label">Skema data</span></span>
            </div>
            <div class="docs-stat">
                <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></span>
                <span><span class="value" id="stat-tags">—</span><span class="label">Modul / tag</span></span>
            </div>
        </div>

        <div class="docs-notice">
            <span class="icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>
            </span>
            <div>
                <h2>Server API aktif di aplikasi ini</h2>
                <p>
                    Semua endpoint tersedia di bawah <code>/api/v1</code>. Masuk melalui
                    <code>POST /api/v1/auth/login</code> untuk memperoleh token, lalu gunakan tombol
                    <strong>Authorize</strong> pada Swagger UI dengan format <code>Bearer &lt;token&gt;</code>.
                    Spesifikasi asli juga dapat diunduh sebagai <a href="{{ route('openapi') }}" download>openapi.json</a>.
                </p>
                <div id="spec-source" data-state="loading" role="status" aria-live="polite">
                    <span class="dot"></span><span id="spec-source-text">Memuat spesifikasi…</span>
                </div>
            </div>
        </div>

        <section class="docs-panel" aria-label="Eksplorasi endpoint">
            <div class="docs-panel-head">
                <h2>Eksplorasi Endpoint</h2>
                <span class="hint">Base URL <code id="base-url">{{ url('/api/v1') }}</code></span>
            </div>
            <div id="swagger-ui">
                <div class="docs-loading" id="docs-loading">
                    <span class="spinner" aria-hidden="true"></span>
                    <span>Menyiapkan Swagger UI…</span>
                </div>
            </div>
        </section>
    </main>

    <footer class="docs-footer">
        <div>© {{ now()->year }} Kostantinopel · Spesifikasi API v1.0.0</div>
        <div class="links">
            <a href="{{ route('home') }}">Beranda</a>
            <a href="{{ route('login') }}">Masuk</a>
            <a href="{{ route('openapi') }}" download>openapi.json</a>
        </div>
    </footer>
@endsection

@push('scripts')
    <script src="{{ asset('assets/vendor/swagger-ui/swagger-ui-bundle.js') }}"></script>
    <script>
        (function () {
            'use strict';

            var METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'];
            var source = document.getElementById('spec-source');
            var sourceText = document.getElementById('spec-source-text');

            function setSource(state, text) {
                source.setAttribute('data-state', state);
                sourceText.textContent = text;
            }

            function count(spec) {
                var paths = spec.paths || {};
                var operations = 0;
                Object.keys(paths).forEach(function (key) {
                    METHODS.forEach(function (method) {
                        if (paths[key][method]) operations += 1;
                    });
                });
                var schemas = (spec.components && spec.components.schemas)
                    ? Object.keys(spec.components.schemas).length
                    : 0;
                return {
                    paths: Object.keys(paths).length,
                    operations: operations,
                    tags: (spec.tags || []).length,
                    schemas: schemas
                };
            }

            function fillStats(spec) {
                var c = count(spec);
                document.getElementById('stat-paths').textContent = c.paths;
                document.getElementById('stat-ops').textContent = c.operations;
                document.getElementById('stat-schemas').textContent = c.schemas;
                document.getElementById('stat-tags').textContent = c.tags;
                document.getElementById('pill-modules').textContent = c.tags + ' modul';
                document.getElementById('pill-ops').textContent = c.operations + ' operasi';
            }

            function fail(error) {
                var loading = document.getElementById('docs-loading');
                if (loading) {
                    loading.innerHTML = '<span style="max-width:640px;text-align:center">Spesifikasi OpenAPI gagal dimuat. ' +
                        'Pastikan berkas <code>/openapi.json</code> tersedia.<br><br>' +
                        '<span style="color:var(--error)">' + String(error && error.message ? error.message : error) + '</span></span>';
                }
                setSource('error', 'Gagal memuat spesifikasi: ' + String(error && error.message ? error.message : error));
            }

            if (!window.SwaggerUIBundle) {
                fail(new Error('Berkas Swagger UI tidak termuat.'));
                return;
            }

            fetch('{{ route('openapi') }}', { cache: 'no-store' })
                .then(function (response) {
                    if (!response.ok) throw new Error('HTTP ' + response.status);
                    return response.json();
                })
                .then(function (spec) {
                    if (!spec || !spec.openapi) throw new Error('Struktur spesifikasi tidak dikenali.');

                    fillStats(spec);
                    spec.servers = [{ url: window.location.origin + '/api/v1', description: 'Server ini' }];

                    var loading = document.getElementById('docs-loading');
                    if (loading && loading.parentNode) loading.parentNode.removeChild(loading);

                    window.ui = SwaggerUIBundle({
                        spec: spec,
                        dom_id: '#swagger-ui',
                        deepLinking: true,
                        docExpansion: 'none',
                        defaultModelsExpandDepth: 1,
                        defaultModelExpandDepth: 1,
                        displayOperationId: false,
                        displayRequestDuration: true,
                        filter: true,
                        tryItOutEnabled: false,
                        validatorUrl: null,
                        presets: [SwaggerUIBundle.presets.apis],
                        layout: 'BaseLayout'
                    });

                    setSource('ok', 'Spesifikasi dimuat dari ' + window.location.origin + '/openapi.json.');
                })
                .catch(fail);
        })();
    </script>
@endpush
