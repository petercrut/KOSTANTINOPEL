@extends('layouts.app')

@section('title', 'Penyewa')

@section('content')
    <div class="page-head">
        <div>
            <h2>Penyewa</h2>
            <p class="page-sub">Data penyewa aktif dan riwayat hunian beserta akun portalnya.</p>
        </div>
        <a class="btn btn-primary" href="{{ route('tenants.create') }}">+ Tambah Penyewa</a>
    </div>

    <form class="filter-bar" method="GET" action="{{ route('tenants.index') }}">
        <input type="text" name="search" value="{{ request('search') }}" placeholder="Cari nama, email, atau telepon…">
        <select name="status">
            <option value="">Semua status</option>
            @foreach ($statuses as $value => $label)
                <option value="{{ $value }}" @selected(request('status') === $value)>{{ $label }}</option>
            @endforeach
        </select>
        <select name="property_id">
            <option value="">Semua properti</option>
            @foreach ($properties as $property)
                <option value="{{ $property->id }}" @selected((string) request('property_id') === (string) $property->id)>{{ $property->name }}</option>
            @endforeach
        </select>
        <select name="room_id">
            <option value="">Semua kamar</option>
            @foreach ($rooms as $room)
                <option value="{{ $room->id }}" @selected((string) request('room_id') === (string) $room->id)>{{ $room->number }} · {{ $room->property?->name }}</option>
            @endforeach
        </select>
        <button class="btn btn-ghost btn-sm" type="submit">Filter</button>
        @if (request()->hasAny(['search', 'status', 'property_id', 'room_id']))
            <a class="btn btn-ghost btn-sm" href="{{ route('tenants.index') }}">Reset</a>
        @endif
        <span class="filter-count">{{ $tenants->total() }} penyewa</span>
    </form>

    <section class="card">
        <div class="card-body no-pad table-wrap">
            <table class="table">
                <thead>
                    <tr>
                        <th>Penyewa</th>
                        <th>Kamar</th>
                        <th>Mulai</th>
                        <th>Akhir</th>
                        <th>Akun</th>
                        <th>Status</th>
                        <th class="right">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($tenants as $tenant)
                        <tr>
                            <td class="cell-main">
                                <a href="{{ route('tenants.show', $tenant) }}"><strong>{{ $tenant->name }}</strong></a>
                                <span>{{ $tenant->phone ?: $tenant->email ?: '-' }}</span>
                            </td>
                            <td>
                                {{ $tenant->room?->number ?? '-' }}
                                <span class="cell-muted"> · {{ $tenant->property?->name }}</span>
                            </td>
                            <td class="nowrap">{{ \App\Support\Format::date($tenant->start_date?->toDateString()) }}</td>
                            <td class="nowrap">{{ $tenant->end_date ? \App\Support\Format::date($tenant->end_date->toDateString()) : '-' }}</td>
                            <td>
                                @if ($tenant->user)
                                    <span class="badge badge-indigo">Aktif</span>
                                @else
                                    <span class="badge badge-slate">Belum ada</span>
                                @endif
                            </td>
                            <td><x-status-badge :status="$tenant->status" group="tenantStatus" /></td>
                            <td class="actions">
                                <a class="btn btn-ghost btn-sm" href="{{ route('tenants.show', $tenant) }}">Lihat</a>
                                <a class="btn btn-ghost btn-sm" href="{{ route('tenants.edit', $tenant) }}">Edit</a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7">
                                <div class="empty-state">
                                    <div class="empty-icon">👥</div>
                                    <p>Belum ada penyewa</p>
                                    <small>Tambahkan penyewa dan tempatkan pada kamar yang tersedia.</small>
                                </div>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        {{ $tenants->links('partials.pagination') }}
    </section>
@endsection
