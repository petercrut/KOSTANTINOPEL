@extends('layouts.app')

@section('title', 'Pengaturan')

@section('content')
    @php
        $size = function (int $bytes): string {
            if ($bytes >= 1048576) return number_format($bytes / 1048576, 1, ',', '.') . ' MB';
            if ($bytes >= 1024) return number_format($bytes / 1024, 0, ',', '.') . ' KB';
            return $bytes . ' B';
        };
        $cards = [
            ['label' => 'Properti', 'value' => $counts['properties'], 'icon' => 'property'],
            ['label' => 'Kamar', 'value' => $counts['rooms'], 'icon' => 'room'],
            ['label' => 'Penyewa', 'value' => $counts['tenants'], 'icon' => 'tenant'],
            ['label' => 'Booking', 'value' => $counts['bookings'], 'icon' => 'booking'],
            ['label' => 'Tagihan', 'value' => $counts['invoices'], 'icon' => 'invoice'],
            ['label' => 'Laporan', 'value' => $counts['requests'], 'icon' => 'request'],
            ['label' => 'Pengumuman', 'value' => $counts['announcements'], 'icon' => 'announcement'],
            ['label' => 'Akun', 'value' => $counts['users'], 'icon' => 'tenant'],
        ];
    @endphp

    <div class="page-head">
        <div>
            <h2>Pengaturan</h2>
            <p class="page-sub">Informasi aplikasi, preferensi tampilan, dan pengelolaan data demo.</p>
        </div>
    </div>

    <div class="stat-grid cols-4">
        @foreach ($cards as $card)
            <div class="mini-stat">
                <span>{{ $card['label'] }}</span>
                <strong>{{ $card['value'] }}</strong>
                <small>Total data tersimpan</small>
            </div>
        @endforeach
    </div>

    <div class="grid-2 wide-left">
        <section class="card">
            <div class="card-head"><h3>Informasi Aplikasi</h3></div>
            <div class="card-body">
                <div class="detail-grid">
                    <div class="detail-item"><span>Nama aplikasi</span><strong>{{ config('app.name') }}</strong></div>
                    <div class="detail-item"><span>Versi</span><strong>{{ $version }}</strong></div>
                    <div class="detail-item"><span>Lingkungan</span><strong>{{ app()->environment() }}</strong></div>
                    <div class="detail-item"><span>Zona waktu</span><strong>{{ config('app.timezone') }}</strong></div>
                    <div class="detail-item"><span>Bahasa</span><strong>{{ config('app.locale') }}</strong></div>
                    <div class="detail-item"><span>Basis data</span><strong>SQLite</strong></div>
                    <div class="detail-item"><span>Ukuran basis data</span><strong>{{ $size($storageBytes) }}</strong></div>
                    <div class="detail-item"><span>Data demo dibuat</span><strong>{{ $seededAt ? \App\Support\Format::dateLong($seededAt) : '-' }}</strong></div>
                </div>
                <div class="alert alert-info mt-16 mb-0">
                    Aplikasi ini menggunakan Laravel {{ app()->version() }} dengan autentikasi sesi untuk panel web
                    dan token Sanctum untuk REST API di <span class="mono">/api/v1</span>.
                </div>
            </div>
        </section>

        <section class="card">
            <div class="card-head"><h3>Preferensi Tampilan</h3></div>
            <div class="card-body">
                <p class="text-muted-sm">Pilih mode terang atau gelap. Pilihan disimpan di peramban Anda dan berlaku di seluruh halaman.</p>
                <div class="row-between">
                    <span>Mode gelap</span>
                    @include('partials.theme-switch')
                </div>
                <hr class="sep">
                <a class="btn btn-ghost btn-block" href="{{ route('docs') }}">
                    Lihat Dokumentasi API
                </a>
            </div>
        </section>
    </div>

    <section class="card mb-22">
        <div class="card-head"><h3>Cadangkan &amp; Pulihkan Data</h3></div>
        <div class="card-body">
            <div class="grid-2">
                <div>
                    <h4 class="mb-8">Unduh cadangan</h4>
                    <p class="text-muted-sm">Mengunduh seluruh data properti, kamar, penyewa, booking, tagihan, laporan, dan pengumuman dalam satu berkas JSON.</p>
                    <a class="btn btn-primary" href="{{ route('settings.backup') }}">
                        Unduh Backup JSON
                    </a>
                </div>
                <div>
                    <h4 class="mb-8">Pulihkan dari cadangan</h4>
                    <p class="text-muted-sm">Unggah berkas JSON hasil backup. Data saat ini akan diganti seluruhnya.</p>
                    <form method="POST" action="{{ route('settings.restore') }}" enctype="multipart/form-data" data-confirm="Pulihkan data dari berkas ini? Data saat ini akan diganti.">
                        @csrf
                        <label class="form-field">
                            <span class="form-label">Berkas backup (JSON, maks. 10 MB)</span>
                            <input type="file" name="backup" accept="application/json,.json" required>
                            @error('backup')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                        <button class="btn btn-ghost" type="submit">Pulihkan Data</button>
                    </form>
                </div>
            </div>
        </div>
    </section>

    <section class="card">
        <div class="card-head"><h3>Reset Data Demo</h3></div>
        <div class="card-body">
            <div class="alert alert-warning">
                Tindakan ini menghapus seluruh data saat ini dan memuat ulang data demo bawaan.
                Anda akan dikeluarkan dari sesi dan harus masuk kembali.
            </div>
            <form method="POST" action="{{ route('settings.reset') }}" data-confirm="Reset seluruh data ke kondisi demo awal? Tindakan ini tidak dapat dibatalkan.">
                @csrf
                <button class="btn btn-danger" type="submit">Reset Data Demo</button>
            </form>
        </div>
    </section>
@endsection
