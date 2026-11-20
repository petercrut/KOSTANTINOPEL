@extends('layouts.guest')

@section('title', 'Terlalu banyak permintaan')
@section('body-class', 'error-body')

@section('content')
    <div class="auth-theme">
        @include('partials.theme-switch')
    </div>
    @include('partials.error-card', [
        'code' => 429,
        'title' => 'Terlalu banyak permintaan',
        'message' => 'Anda mengirim terlalu banyak permintaan dalam waktu singkat. Tunggu sebentar lalu coba lagi.',
    ])
@endsection
