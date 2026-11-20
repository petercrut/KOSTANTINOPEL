@extends('layouts.guest')

@section('title', 'Terjadi kesalahan')
@section('body-class', 'error-body')

@section('content')
    <div class="auth-theme">
        @include('partials.theme-switch')
    </div>
    @include('partials.error-card', [
        'code' => 500,
        'title' => 'Terjadi kesalahan pada server',
        'message' => 'Kami tidak dapat memproses permintaan Anda saat ini. Silakan coba beberapa saat lagi.',
    ])
@endsection
