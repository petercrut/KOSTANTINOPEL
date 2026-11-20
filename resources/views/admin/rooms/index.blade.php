@extends('layouts.app')

@section('title', 'Kamar')

@section('content')
    <div class="page-head">
        <div>
            <h2>Kamar</h2>
            <p class="page-sub">Status kamar dihitung otomatis dari hunian, booking aktif, dan status perawatan.</p>
        </div>
        <a class="btn btn-primary" href="{{ route('rooms.create') }}">+ Tambah Kamar</a>
    </div>

    <form class="filter-bar" method="GET" action="{{ route('rooms.index') }}">
        <select name="property_id">
            <option value="">Semua properti</option>
            @foreach ($properties as $property)
                <option value="{{ $property->id }}" @selected((string) request('property_id') === (string) $property->id)>{{ $property->name }}</option>
            @endforeach
        </select>
        <select name="status">
            <option value="">Semua status</option>
            @foreach ($statuses as $value => $label)
                <option value="{{ $value }}" @selected(request('status') === $value)>{{ $label }}</option>
            @endforeach
        </select>
        <input type="text" name="search" value="{{ request('search') }}" placeholder="Cari nomor atau tipe kamar…">
        <button class="btn btn-ghost btn-sm" type="submit">Filter</button>
        @if (request()->hasAny(['property_id', 'status', 'search']))
            <a class="btn btn-ghost btn-sm" href="{{ route('rooms.index') }}">Reset</a>
        @endif
        <span class="filter-count">{{ $rooms->total() }} kamar</span>
    </form>

    <section class="card">
        <div class="card-body no-pad table-wrap">
            <table class="table">
                <thead>
                    <tr>
                        <th>Kamar</th>
                        <th>Properti</th>
                        <th class="num">Kapasitas</th>
                        <th class="num">Harian</th>
                        <th class="num">Bulanan</th>
                        <th>Status</th>
                        <th class="right">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($rooms as $room)
                        <tr>
                            <td class="cell-main">
                                <a href="{{ route('rooms.show', $room) }}"><strong>{{ $room->number }}</strong></a>
                                <span>{{ $room->type }}</span>
                            </td>
                            <td>{{ $room->property?->name ?? '-' }}</td>
                            <td class="num">{{ $room->capacity }} orang</td>
                            <td class="num">{{ \App\Support\Format::rupiah($room->price_daily) }}</td>
                            <td class="num">{{ \App\Support\Format::rupiah($room->price_monthly) }}</td>
                            <td><x-status-badge :status="$occupancy->effectiveStatus($room)" group="roomStatus" /></td>
                            <td class="actions">
                                <a class="btn btn-ghost btn-sm" href="{{ route('rooms.show', $room) }}">Lihat</a>
                                <a class="btn btn-ghost btn-sm" href="{{ route('rooms.edit', $room) }}">Edit</a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7">
                                <div class="empty-state">
                                    <div class="empty-icon">🚪</div>
                                    <p>Belum ada kamar</p>
                                    <small>Tambahkan kamar dan hubungkan dengan properti.</small>
                                </div>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        {{ $rooms->links('partials.pagination') }}
    </section>
@endsection
