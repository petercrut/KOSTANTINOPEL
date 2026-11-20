@extends('layouts.auth')

@section('title', 'Daftar')

@section('content')
    <div class="auth-card">
        <div class="auth-brand">
            <span class="brand-logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 11.5 12 6.5l5.5 5"/><path d="M8.5 10.5V18h7v-7.5"/></svg>
            </span>
            <span>Kostantinopel</span>
        </div>

        <h1>Buat Akun Baru</h1>
        <p class="auth-sub">Daftar sebagai pengelola properti baru atau aktifkan akun portal penyewa.</p>

        <form method="POST" action="{{ route('register.attempt') }}">
            @csrf

            <label class="form-field">
                <span class="form-label">Daftar sebagai *</span>
                <select name="role" id="role" required>
                    <option value="admin" @selected(old('role', 'admin') === 'admin')>Admin / Pemilik Properti</option>
                    <option value="tenant" @selected(old('role') === 'tenant')>Penyewa</option>
                </select>
                @error('role')<span class="field-error">{{ $message }}</span>@enderror
            </label>

            <label class="form-field">
                <span class="form-label">Nama lengkap *</span>
                <input type="text" name="name" value="{{ old('name') }}" required maxlength="120" placeholder="Nama Anda" autocomplete="name">
                @error('name')<span class="field-error">{{ $message }}</span>@enderror
            </label>

            <label class="form-field">
                <span class="form-label">Email *</span>
                <input type="email" name="email" value="{{ old('email') }}" required maxlength="190" placeholder="nama@email.com" autocomplete="email">
                @error('email')<span class="field-error">{{ $message }}</span>@enderror
                <small class="form-hint">Penyewa harus memakai email yang terdaftar pada data penyewa.</small>
            </label>

            <div class="form-row">
                <label class="form-field">
                    <span class="form-label">Password *</span>
                    <input type="password" name="password" required minlength="6" autocomplete="new-password">
                    @error('password')<span class="field-error">{{ $message }}</span>@enderror
                </label>
                <label class="form-field">
                    <span class="form-label">Ulangi password *</span>
                    <input type="password" name="password_confirmation" required minlength="6" autocomplete="new-password">
                </label>
            </div>

            <button type="submit" class="btn btn-primary btn-block">Daftar Sekarang</button>
        </form>

        <div class="auth-alt">Sudah punya akun? <a href="{{ route('login') }}">Masuk</a></div>

        <div class="alert alert-info mt-16 mb-0">
            <strong>Catatan pendaftaran penyewa:</strong> akun portal hanya dapat dibuat jika email Anda sudah terdaftar sebagai penyewa aktif oleh pengelola properti.
        </div>

        <div class="auth-alt mt-16">
            <a href="{{ route('home') }}">← Kembali ke beranda</a>
        </div>
    </div>
@endsection
