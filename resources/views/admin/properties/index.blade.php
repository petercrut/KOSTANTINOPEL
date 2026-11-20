@extends('layouts.app')

@section('title', 'Properti')

@section('content')
    <div class="page-head">
        <div>
            <h2>Properti</h2>
            <p class="page-sub">Kelola kost, kontrakan, apartemen, dan hotel yang Anda jalankan.</p>
        </div>
        <a class="btn btn-primary" href="{{ route('properties.create') }}">+ Tambah Properti</a>
    </div>

    <form class="filter-bar" method="GET" action="{{ route('properties.index') }}">
        <input type="text" name="search" value="{{ request('search') }}" placeholder="Cari nama atau alamat properti…">
        <button class="btn btn-ghost btn-sm" type="submit">Cari</button>
        @if (request('search'))
            <a class="btn btn-ghost btn-sm" href="{{ route('properties.index') }}">Reset</a>
        @endif
        <span class="filter-count">{{ $properties->total() }} properti</span>
    </form>

    <section class="card">
        <div class="card-body no-pad table-wrap">
            <table class="table">
                <thead>
                    <tr>
                        <th>Properti</th>
                        <th>Alamat</th>
                        <th>Telepon</th>
                        <th class="num">Kamar</th>
                        <th class="right">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($properties as $property)
                        <tr>
                            <td class="cell-main">
                                <a href="{{ route('properties.show', $property) }}"><strong>{{ $property->name }}</strong></a>
                                <span>{{ \App\Support\Labels::label('propertyType', $property->type) }}</span>
                            </td>
                            <td>{{ $property->address ?: '-' }}</td>
                            <td class="nowrap">{{ $property->phone ?: '-' }}</td>
                            <td class="num">{{ $property->rooms_count }}</td>
                            <td class="actions">
                                <a class="btn btn-ghost btn-sm" href="{{ route('properties.show', $property) }}">Lihat</a>
                                <a class="btn btn-ghost btn-sm" href="{{ route('properties.edit', $property) }}">Edit</a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5">
                                <div class="empty-state">
                                    <div class="empty-icon">🏠</div>
                                    <p>Belum ada properti</p>
                                    <small>Tambahkan properti untuk mulai mengelola kamar dan penyewa.</small>
                                </div>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        {{ $properties->links('partials.pagination') }}
    </section>
@endsection
