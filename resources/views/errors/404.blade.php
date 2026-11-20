@extends('layouts.guest')

@section('title', 'Halaman tidak ditemukan')
@section('body-class', 'error-body')

@section('content')
    <div class="auth-theme">
        @include('partials.theme-switch')
    </div>
    @include('partials.error-card', [
        'code' => 404,
        'title' => 'Halaman tidak ditemukan',
        'message' => 'Halaman atau data yang Anda cari tidak tersedia. Periksa kembali tautan Anda.',
    ])
@endsection
