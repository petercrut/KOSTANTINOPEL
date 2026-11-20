@extends('layouts.app')

@section('title', 'Kamar ' . $room->number)

@section('content')
    <div class="page-head">
        <div>
            <h2>Kamar {{ $room->number }}</h2>
            <p class="page-sub">
                <a href="{{ route('properties.show', $room->property) }}">{{ $room->property?->name }}</a>
                · {{ $room->type }} · kapasitas {{ $room->capacity }} orang
            </p>
        </div>
        <div class="actions-row">
            <a class="btn btn-ghost" href="{{ route('rooms.index') }}">Kembali</a>
            <a class="btn btn-ghost" href="{{ route('rooms.edit', $room) }}">Edit</a>
            <a class="btn btn-primary" href="{{ route('bookings.create', ['room_id' => $room->id]) }}">+ Booking</a>
        </div>
    </div>

    <div class="stat-grid cols-4">
        <div class="mini-stat">
            <span>Status Efektif</span>
            <strong>{{ \App\Support\Labels::label('roomStatus', $effectiveStatus) }}</strong>
            <small>Status dasar: {{ \App\Support\Labels::label('roomStatus', $room->status) }}</small>
        </div>
        <div class="mini-stat">
            <span>Harga Harian</span>
            <strong>{{ \App\Support\Format::rupiah($room->price_daily) }}</strong>
            <small>Per malam</small>
        </div>
        <div class="mini-stat">
            <span>Harga Bulanan</span>
            <strong>{{ \App\Support\Format::rupiah($room->price_monthly) }}</strong>
            <small>Per bulan</small>
        </div>
        <div class="mini-stat">
            <span>Penyewa</span>
            <strong>{{ $tenants->where('status', 'active')->count() }}</strong>
            <small>{{ $bookings->count() }} booking tercatat</small>
        </div>
    </div>

    <div class="grid-2 wide-left">
        <section class="card">
            <div class="card-head"><h3>Cek Ketersediaan</h3></div>
            <div class="card-body">
                <form class="filter-bar mb-16" method="GET" action="{{ route('rooms.show', $room) }}">
                    <label class="form-field mb-0">
                        <span class="form-label">Dari</span>
                        <input type="date" name="from" value="{{ $from }}">
                    </label>
                    <label class="form-field mb-0">
                        <span class="form-label">Sampai</span>
                        <input type="date" name="to" value="{{ $to }}">
                    </label>
                    <button class="btn btn-primary btn-sm" type="submit">Cek</button>
                </form>

                @if ($checking && $available !== null)
                    @if ($available)
                        <div class="alert alert-success mb-0">Kamar tersedia pada {{ \App\Support\Format::dateLong($from) }} – {{ \App\Support\Format::dateLong($to) }}.</div>
                    @else
                        <div class="alert alert-error mb-0">Kamar tidak tersedia pada periode tersebut.</div>
                    @endif
                @else
                    <p class="text-muted-sm mb-0">Pilih rentang tanggal untuk memeriksa ketersediaan kamar.</p>
                @endif

                <div class="mt-16">
                    @php($facilities = $room->facilities ?? [])
                    @if (count($facilities))
                        <div class="facility-chips">
                            @foreach ($facilities as $facility)
                                <span class="facility-chip">{{ $facility }}</span>
                            @endforeach
                        </div>
                    @else
                        <p class="text-muted-sm mb-0">Belum ada fasilitas tercatat.</p>
                    @endif
                </div>
            </div>
        </section>

        <section class="card">
            <div class="card-head"><h3>Informasi Kamar</h3></div>
            <div class="card-body">
                <div class="detail-grid">
                    <div class="detail-item"><span>Properti</span><strong>{{ $room->property?->name ?? '-' }}</strong></div>
                    <div class="detail-item"><span>Tipe</span><strong>{{ $room->type }}</strong></div>
                    <div class="detail-item"><span>Kapasitas</span><strong>{{ $room->capacity }} orang</strong></div>
                    <div class="detail-item"><span>Status dasar</span><strong>{{ \App\Support\Labels::label('roomStatus', $room->status) }}</strong></div>
                </div>
            </div>
        </section>
    </div>

    <section class="card mb-22">
        <div class="card-head">
            <h3>Riwayat Penyewa</h3>
            <a class="card-link" href="{{ route('tenants.create', ['room_id' => $room->id]) }}">Tambah penyewa</a>
        </div>
        <div class="card-body no-pad table-wrap">
            <table class="table">
                <thead>
                    <tr>
                        <th>Nama</th>
                        <th>Periode</th>
                        <th>Status</th>
                        <th class="right">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($tenants as $tenant)
                        <tr>
                            <td class="cell-main">
                                <a href="{{ route('tenants.show', $tenant) }}"><strong>{{ $tenant->name }}</strong></a>
                                <span>{{ $tenant->phone ?: '-' }}</span>
                            </td>
                            <td>{{ \App\Support\Format::date($tenant->start_date?->toDateString()) }} – {{ $tenant->end_date ? \App\Support\Format::date($tenant->end_date->toDateString()) : 'sekarang' }}</td>
                            <td><x-status-badge :status="$tenant->status" group="tenantStatus" /></td>
                            <td class="actions"><a class="btn btn-ghost btn-sm" href="{{ route('tenants.show', $tenant) }}">Detail</a></td>
                        </tr>
                    @empty
                        <tr><td colspan="4"><div class="empty-state"><p>Belum ada penyewa</p></div></td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </section>

    <section class="card mb-22">
        <div class="card-head">
            <h3>Booking Kamar</h3>
            <a class="card-link" href="{{ route('bookings.index', ['room_id' => $room->id]) }}">Lihat semua</a>
        </div>
        <div class="card-body no-pad table-wrap">
            <table class="table">
                <thead>
                    <tr>
                        <th>Kode</th>
                        <th>Tamu</th>
                        <th>Periode</th>
                        <th class="num">Total</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($bookings as $booking)
                        <tr>
                            <td><a href="{{ route('bookings.show', $booking) }}" class="mono">{{ $booking->code }}</a></td>
                            <td>{{ $booking->guest_name }}</td>
                            <td>{{ \App\Support\Format::date($booking->check_in?->toDateString()) }} – {{ \App\Support\Format::date($booking->check_out?->toDateString()) }}</td>
                            <td class="num">{{ \App\Support\Format::rupiah($booking->total) }}</td>
                            <td><x-status-badge :status="$booking->status" group="bookingStatus" /></td>
                        </tr>
                    @empty
                        <tr><td colspan="5"><div class="empty-state"><p>Belum ada booking</p></div></td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </section>

    <section class="card">
        <div class="card-head"><h3>Hapus Kamar</h3></div>
        <div class="card-body row-between">
            <p class="text-muted-sm mb-0">Kamar yang memiliki riwayat penyewa atau booking tidak dapat dihapus.</p>
            <form method="POST" action="{{ route('rooms.destroy', $room) }}" data-confirm="Hapus kamar {{ $room->number }}? Tindakan ini tidak dapat dibatalkan.">
                @csrf
                @method('DELETE')
                <button class="btn btn-danger-ghost" type="submit">Hapus Kamar</button>
            </form>
        </div>
    </section>
@endsection
