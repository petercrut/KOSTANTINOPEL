@extends('layouts.app')

@section('title', 'Booking ' . $booking->code)

@section('content')
    <div class="page-head">
        <div>
            <h2>{{ $booking->code }}</h2>
            <p class="page-sub">
                {{ $booking->guest_name }}
                @if ($booking->guest_phone) · {{ $booking->guest_phone }} @endif
                · dibuat {{ \App\Support\Format::dateLong($booking->created_at) }}
            </p>
        </div>
        <div class="actions-row">
            <a class="btn btn-ghost" href="{{ route('bookings.index') }}">Kembali</a>
            <a class="btn btn-ghost" href="{{ route('bookings.edit', $booking) }}">Edit</a>
            <form method="POST" action="{{ route('bookings.destroy', $booking) }}" data-confirm="Hapus booking {{ $booking->code }}? Tagihan yang belum dibayar juga akan dihapus.">
                @csrf
                @method('DELETE')
                <button class="btn btn-danger-ghost" type="submit">Hapus</button>
            </form>
        </div>
    </div>

    <div class="stat-grid cols-4">
        <div class="mini-stat">
            <span>Status</span>
            <strong>{{ \App\Support\Labels::label('bookingStatus', $booking->status) }}</strong>
            <small>{{ \App\Support\Labels::label('rentType', $booking->rent_type) }}</small>
        </div>
        <div class="mini-stat">
            <span>Kamar</span>
            <strong>{{ $booking->room?->number ?? '-' }}</strong>
            <small>{{ $booking->room?->property?->name ?? '-' }}</small>
        </div>
        <div class="mini-stat">
            <span>Durasi</span>
            <strong>{{ $booking->days }} hari</strong>
            <small>{{ $booking->units }} {{ $booking->unit_label }}</small>
        </div>
        <div class="mini-stat">
            <span>Total Booking</span>
            <strong>{{ \App\Support\Format::rupiah($booking->total) }}</strong>
            <small>{{ $booking->invoices->count() }} tagihan terkait</small>
        </div>
    </div>

    <div class="grid-2 wide-left">
        <section class="card">
            <div class="card-head"><h3>Detail Menginap</h3></div>
            <div class="card-body">
                <div class="detail-grid">
                    <div class="detail-item"><span>Check-in</span><strong>{{ \App\Support\Format::dateLong($booking->check_in) }}</strong></div>
                    <div class="detail-item"><span>Check-out</span><strong>{{ \App\Support\Format::dateLong($booking->check_out) }}</strong></div>
                    <div class="detail-item"><span>Tamu</span><strong>{{ $booking->guest_name }}</strong></div>
                    <div class="detail-item"><span>Telepon</span><strong>{{ $booking->guest_phone ?: '-' }}</strong></div>
                    <div class="detail-item"><span>Properti</span><strong>{{ $booking->room?->property?->name ?? '-' }}</strong></div>
                    <div class="detail-item"><span>Kamar</span><strong>{{ $booking->room?->number ?? '-' }} · {{ $booking->room?->type }}</strong></div>
                </div>
                @if ($booking->notes)
                    <hr class="sep">
                    <p class="text-muted-sm mb-0">{{ $booking->notes }}</p>
                @endif
            </div>
        </section>

        <section class="card">
            <div class="card-head"><h3>Ubah Status</h3></div>
            <div class="card-body">
                @if (count($transitions))
                    <p class="text-muted-sm">Pilih status berikutnya sesuai alur booking.</p>
                    <div class="actions-row">
                        @foreach ($transitions as $status)
                            <form method="POST" action="{{ route('bookings.status', $booking) }}">
                                @csrf
                                @method('PATCH')
                                <input type="hidden" name="status" value="{{ $status }}">
                                <button class="btn {{ $status === 'cancelled' ? 'btn-danger-ghost' : 'btn-primary' }} btn-sm" type="submit">
                                    {{ \App\Support\Labels::label('bookingStatus', $status) }}
                                </button>
                            </form>
                        @endforeach
                    </div>
                @else
                    <p class="text-muted-sm mb-0">Status booking ini sudah final dan tidak dapat diubah lagi.</p>
                @endif
            </div>
        </section>
    </div>

    <section class="card">
        <div class="card-head">
            <h3>Tagihan Booking</h3>
            <a class="card-link" href="{{ route('invoices.create', ['booking_id' => $booking->id]) }}">Buat tagihan tambahan</a>
        </div>
        <div class="card-body no-pad table-wrap">
            <table class="table">
                <thead>
                    <tr>
                        <th>Kode</th>
                        <th>Deskripsi</th>
                        <th>Jatuh Tempo</th>
                        <th class="num">Nominal</th>
                        <th>Status</th>
                        <th class="right">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($booking->invoices as $invoice)
                        <tr>
                            <td><a href="{{ route('invoices.show', $invoice) }}" class="mono">{{ $invoice->code }}</a></td>
                            <td>{{ $invoice->description }}</td>
                            <td class="nowrap">{{ \App\Support\Format::date($invoice->due_date?->toDateString()) }}</td>
                            <td class="num">{{ \App\Support\Format::rupiah($invoice->amount) }}</td>
                            <td><x-status-badge :status="$invoice->effectiveStatus()" group="invoiceStatus" /></td>
                            <td class="actions"><a class="btn btn-ghost btn-sm" href="{{ route('invoices.show', $invoice) }}">Detail</a></td>
                        </tr>
                    @empty
                        <tr><td colspan="6"><div class="empty-state"><p>Belum ada tagihan</p></div></td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </section>
@endsection
