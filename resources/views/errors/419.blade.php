@extends('layouts.guest')

@section('title', 'Sesi kedaluwarsa')
@section('body-class', 'error-body')

@section('content')
    <div class="auth-theme">
        @include('partials.theme-switch')
    </div>
    @include('partials.error-card', [
        'code' => 419,
        'title' => 'Sesi kedaluwarsa',
        'message' => 'Halaman Anda sudah kedaluwarsa karena tidak ada aktivitas. Muat ulang lalu coba lagi.',
    ])
@endsection
