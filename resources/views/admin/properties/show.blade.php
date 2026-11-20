@extends('layouts.app')

@section('title', $property->name)

@section('content')
    @php($total = array_sum($counts))

    <div class="page-head">
        <div>
            <h2>{{ $property->name }}</h2>
            <p class="page-sub">
                {{ \App\Support\Labels::label('propertyType', $property->type) }}
                @if ($property->address) · {{ $property->address }} @endif
                @if ($property->phone) · {{ $property->phone }} @endif
            </p>
        </div>
        <div class="actions-row">
            <a class="btn btn-ghost" href="{{ route('properties.index') }}">Kembali</a>
            <a class="btn btn-ghost" href="{{ route('properties.edit', $property) }}">Edit</a>
            <a class="btn btn-primary" href="{{ route('rooms.create', ['property_id' => $property->id]) }}">+ Kamar</a>
        </div>
    </div>

    <div class="stat-grid cols-4">
        <div class="mini-stat">
            <span>Total Kamar</span>
            <strong>{{ $total }}</strong>
            <small>Terdaftar di properti ini</small>
        </div>
        <div class="mini-stat">
            <span>Terisi</span>
            <strong>{{ $counts['occupied'] }}</strong>
            <small>{{ $total > 0 ? (int) round(($counts['occupied'] / $total) * 100) : 0 }}% okupansi</small>
        </div>
        <div class="mini-stat">
            <span>Tersedia</span>
            <strong>{{ $counts['available'] }}</strong>
            <small>Siap disewakan</small>
        </div>
        <div class="mini-stat">
            <span>Perawatan</span>
            <strong>{{ $counts['maintenance'] }}</strong>
            <small>Sedang tidak tersedia</small>
        </div>
    </div>

    @if ($property->notes)
        <div class="alert alert-info">{{ $property->notes }}</div>
    @endif

    <section class="card mb-22">
        <div class="card-head">
            <h3>Daftar Kamar</h3>
            <a class="card-link" href="{{ route('rooms.index', ['property_id' => $property->id]) }}">Kelola kamar</a>
        </div>
        <div class="card-body no-pad table-wrap">
            <table class="table">
                <thead>
                    <tr>
                        <th>Kamar</th>
                        <th>Tipe</th>
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
                            <td><a href="{{ route('rooms.show', $room) }}"><strong>{{ $room->number }}</strong></a></td>
                            <td>{{ $room->type }}</td>
                            <td class="num">{{ $room->capacity }} orang</td>
                            <td class="num">{{ \App\Support\Format::rupiah($room->price_daily) }}</td>
                            <td class="num">{{ \App\Support\Format::rupiah($room->price_monthly) }}</td>
                            <td><x-status-badge :status="$occupancy->effectiveStatus($room)" group="roomStatus" /></td>
                            <td class="actions"><a class="btn btn-ghost btn-sm" href="{{ route('rooms.show', $room) }}">Detail</a></td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7">
                                <div class="empty-state">
                                    <div class="empty-icon">🚪</div>
                                    <p>Belum ada kamar</p>
                                    <small>Tambahkan kamar untuk properti ini.</small>
                                </div>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </section>

    <section class="card mb-22">
        <div class="card-head">
            <h3>Penyewa Aktif</h3>
            <a class="card-link" href="{{ route('tenants.index', ['property_id' => $property->id]) }}">Lihat semua</a>
        </div>
        <div class="card-body no-pad table-wrap">
            <table class="table">
                <thead>
                    <tr>
                        <th>Nama</th>
                        <th>Kamar</th>
                        <th>Mulai</th>
                        <th>Telepon</th>
                        <th class="right">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($tenants as $tenant)
                        <tr>
                            <td class="cell-main">
                                <a href="{{ route('tenants.show', $tenant) }}"><strong>{{ $tenant->name }}</strong></a>
                                <span>{{ $tenant->email ?: '-' }}</span>
                            </td>
                            <td>{{ $tenant->room?->number ?? '-' }}</td>
                            <td>{{ \App\Support\Format::date($tenant->start_date?->toDateString()) }}</td>
                            <td>{{ $tenant->phone ?: '-' }}</td>
                            <td class="actions"><a class="btn btn-ghost btn-sm" href="{{ route('tenants.show', $tenant) }}">Detail</a></td>
                        </tr>
                    @empty
                        <tr><td colspan="5"><div class="empty-state"><p>Belum ada penyewa aktif</p></div></td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </section>

    <section class="card">
        <div class="card-head"><h3>Hapus Properti</h3></div>
        <div class="card-body row-between">
            <p class="text-muted-sm mb-0">Properti hanya dapat dihapus jika belum memiliki kamar.</p>
            <form method="POST" action="{{ route('properties.destroy', $property) }}" data-confirm="Hapus properti {{ $property->name }}? Tindakan ini tidak dapat dibatalkan.">
                @csrf
                @method('DELETE')
                <button class="btn btn-danger-ghost" type="submit">Hapus Properti</button>
            </form>
        </div>
    </section>
@endsection
