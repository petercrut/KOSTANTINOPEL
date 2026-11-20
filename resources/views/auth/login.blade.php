@extends('layouts.auth')

@section('title', 'Masuk')

@section('content')
    <div class="auth-card">
        <div class="auth-brand">
            <span class="brand-logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 11.5 12 6.5l5.5 5"/><path d="M8.5 10.5V18h7v-7.5"/></svg>
            </span>
            <span>Kostantinopel</span>
        </div>

        <h1>Masuk ke Akun Anda</h1>
        <p class="auth-sub">Kelola properti, kamar, penyewa, dan pembayaran dalam satu panel.</p>

        <form method="POST" action="{{ route('login.attempt') }}">
            @csrf

            <label class="form-field">
                <span class="form-label">Email</span>
                <input type="email" id="email" name="email" value="{{ old('email') }}" placeholder="nama@email.com" autocomplete="email" required autofocus>
                @error('email')<span class="field-error">{{ $message }}</span>@enderror
            </label>

            <label class="form-field">
                <span class="form-label">Password</span>
                <input type="password" id="password" name="password" placeholder="••••••••" autocomplete="current-password" required>
                @error('password')<span class="field-error">{{ $message }}</span>@enderror
            </label>

            <label class="check-line mb-16">
                <input type="checkbox" name="remember" value="1" @checked(old('remember'))>
                Ingat saya di perangkat ini
            </label>

            <button type="submit" class="btn btn-primary btn-block">Masuk</button>
        </form>

        <div class="auth-alt">Belum punya akun? <a href="{{ route('register') }}">Daftar gratis</a></div>

        <div class="auth-demo">
            <strong>Akun demo:</strong><br>
            Admin/pemilik: admin@kostantinopel.id · admin123
            <a href="#" data-fill-login data-email="admin@kostantinopel.id" data-password="admin123">Isi</a><br>
            Penyewa: siti@kostantinopel.id · siti123
            <a href="#" data-fill-login data-email="siti@kostantinopel.id" data-password="siti123">Isi</a>
        </div>

        <div class="auth-alt mt-16">
            <a href="{{ route('home') }}">← Kembali ke beranda</a>
        </div>
    </div>
@endsection
