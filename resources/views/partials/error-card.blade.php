@php
    $code = $code ?? 404;
    $title = $title ?? 'Halaman tidak ditemukan';
    $message = $message ?? 'Halaman yang Anda cari tidak tersedia.';
@endphp

<div class="error-card">
    <div class="error-code">{{ $code }}</div>
    <h1>{{ $title }}</h1>
    <p>{{ $message }}</p>
    <div class="actions-row" style="justify-content:center">
        <a class="btn btn-primary" href="{{ url('/') }}">Ke Beranda</a>
        @auth
            <a class="btn btn-ghost" href="{{ auth()->user()->isAdmin() ? route('dashboard') : route('portal.dashboard') }}">Buka Panel</a>
        @else
            <a class="btn btn-ghost" href="{{ route('login') }}">Masuk</a>
        @endauth
    </div>
</div>
