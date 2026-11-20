@extends('layouts.guest')

@section('title', 'Layanan tidak tersedia')
@section('body-class', 'error-body')

@section('content')
    <div class="auth-theme">
        @include('partials.theme-switch')
    </div>
    @include('partials.error-card', [
        'code' => 503,
        'title' => 'Layanan sedang tidak tersedia',
        'message' => 'Aplikasi sedang dalam pemeliharaan. Silakan kembali beberapa saat lagi.',
    ])
@endsection
