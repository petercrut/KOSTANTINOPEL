@extends('layouts.app')

@section('title', 'Booking')

@section('content')
    <div class="page-head">
        <div>
            <h2>Booking</h2>
            <p class="page-sub">Kelola reservasi tamu harian, mingguan, dan bulanan beserta tagihannya.</p>
        </div>
        <a class="btn btn-primary" href="{{ route('bookings.create') }}">+ Tambah Booking</a>
    </div>

    <form class="filter-bar" method="GET" action="{{ route('bookings.index') }}">
        <input type="text" name="search" value="{{ request('search') }}" placeholder="Cari kode, nama tamu, atau telepon…">
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
        <label class="form-field mb-0">
            <span class="form-label">Dari</span>
            <input type="date" name="from" value="{{ request('from') }}">
        </label>
        <label class="form-field mb-0">
            <span class="form-label">Sampai</span>
            <input type="date" name="to" value="{{ request('to') }}">
        </label>
        <button class="btn btn-ghost btn-sm" type="submit">Filter</button>
        @if (request()->hasAny(['search', 'status', 'property_id', 'room_id', 'from', 'to']))
            <a class="btn btn-ghost btn-sm" href="{{ route('bookings.index') }}">Reset</a>
        @endif
        <span class="filter-count">{{ $bookings->total() }} booking</span>
    </form>

    <section class="card">
        <div class="card-body no-pad table-wrap">
            <table class="table">
                <thead>
                    <tr>
                        <th>Kode</th>
                        <th>Tamu</th>
                        <th>Kamar</th>
                        <th>Periode</th>
                        <th class="num">Total</th>
                        <th>Status</th>
                        <th class="right">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($bookings as $booking)
                        <tr>
                            <td><a href="{{ route('bookings.show', $booking) }}" class="mono">{{ $booking->code }}</a></td>
                            <td class="cell-main">
                                <strong>{{ $booking->guest_name }}</strong>
                                <span>{{ $booking->guest_phone ?: '-' }}</span>
                            </td>
                            <td>
                                {{ $booking->room?->number ?? '-' }}
                                <span class="cell-muted"> · {{ $booking->room?->property?->name }}</span>
                            </td>
                            <td class="nowrap">{{ \App\Support\Format::date($booking->check_in?->toDateString()) }} – {{ \App\Support\Format::date($booking->check_out?->toDateString()) }}</td>
                            <td class="num">{{ \App\Support\Format::rupiah($booking->total) }}</td>
                            <td><x-status-badge :status="$booking->status" group="bookingStatus" /></td>
                            <td class="actions">
                                <a class="btn btn-ghost btn-sm" href="{{ route('bookings.show', $booking) }}">Lihat</a>
                                <a class="btn btn-ghost btn-sm" href="{{ route('bookings.edit', $booking) }}">Edit</a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7">
                                <div class="empty-state">
                                    <div class="empty-icon">📅</div>
                                    <p>Belum ada booking</p>
                                    <small>Buat booking baru untuk tamu yang akan menginap.</small>
                                </div>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        {{ $bookings->links('partials.pagination') }}
    </section>
@endsection
