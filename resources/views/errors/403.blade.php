@extends('layouts.guest')

@section('title', 'Akses ditolak')
@section('body-class', 'error-body')

@section('content')
    <div class="auth-theme">
        @include('partials.theme-switch')
    </div>
    @include('partials.error-card', [
        'code' => 403,
        'title' => 'Akses ditolak',
        'message' => 'Anda tidak memiliki izin untuk membuka halaman ini. Silakan masuk dengan akun yang sesuai.',
    ])
@endsection
