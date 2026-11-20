@extends('layouts.app')

@section('title', 'Tagihan ' . $invoice->code)

@section('content')
    <div class="page-head">
        <div>
            <h2>{{ $invoice->code }}</h2>
            <p class="page-sub">{{ $invoice->description }}</p>
        </div>
        <div class="actions-row">
            <a class="btn btn-ghost" href="{{ route('invoices.index') }}">Kembali</a>
            <a class="btn btn-ghost" href="{{ route('invoices.edit', $invoice) }}">Edit</a>
            <button class="btn btn-ghost no-print" type="button" onclick="window.print()">Cetak</button>
        </div>
    </div>

    <div class="stat-grid cols-4">
        <div class="mini-stat">
            <span>Status</span>
            <strong>{{ \App\Support\Labels::label('invoiceStatus', $effectiveStatus) }}</strong>
            <small>{{ $invoice->isPaid() ? 'Pembayaran tercatat' : 'Belum lunas' }}</small>
        </div>
        <div class="mini-stat">
            <span>Nominal</span>
            <strong>{{ \App\Support\Format::rupiah($invoice->amount) }}</strong>
            <small>Jatuh tempo {{ \App\Support\Format::dateLong($invoice->due_date) }}</small>
        </div>
        <div class="mini-stat">
            <span>Untuk</span>
            <strong>{{ $invoice->tenant?->name ?? $invoice->booking?->guest_name ?? 'Umum' }}</strong>
            <small>{{ $invoice->room?->number ?? '-' }} · {{ $invoice->property?->name ?? '-' }}</small>
        </div>
        <div class="mini-stat">
            <span>Dibuat</span>
            <strong>{{ \App\Support\Format::date($invoice->created_at?->toDateString()) }}</strong>
            <small>{{ $invoice->paid_via ? 'Via ' . $invoice->paid_via : 'Belum dibayar' }}</small>
        </div>
    </div>

    <div class="grid-2 wide-left">
        <section class="card">
            <div class="card-head"><h3>Rincian Tagihan</h3></div>
            <div class="card-body">
                <div class="detail-grid">
                    <div class="detail-item"><span>Kode</span><strong class="mono">{{ $invoice->code }}</strong></div>
                    <div class="detail-item"><span>Deskripsi</span><strong>{{ $invoice->description }}</strong></div>
                    <div class="detail-item"><span>Penyewa</span><strong>{{ $invoice->tenant?->name ?? '-' }}</strong></div>
                    <div class="detail-item"><span>Booking</span><strong>{{ $invoice->booking?->code ?? '-' }}</strong></div>
                    <div class="detail-item"><span>Kamar</span><strong>{{ $invoice->room?->number ?? '-' }}</strong></div>
                    <div class="detail-item"><span>Properti</span><strong>{{ $invoice->property?->name ?? '-' }}</strong></div>
                    <div class="detail-item"><span>Jatuh tempo</span><strong>{{ \App\Support\Format::dateLong($invoice->due_date) }}</strong></div>
                    <div class="detail-item"><span>Tanggal bayar</span><strong>{{ $invoice->paid_at ? \App\Support\Format::dateLong($invoice->paid_at) : '-' }}</strong></div>
                    <div class="detail-item"><span>Metode</span><strong>{{ $invoice->method ?? '-' }}</strong></div>
                    <div class="detail-item"><span>Dicatat melalui</span><strong>{{ $invoice->paid_via ?? '-' }}</strong></div>
                </div>
            </div>
        </section>

        <section class="card">
            <div class="card-head"><h3>{{ $invoice->isPaid() ? 'Pembayaran' : 'Catat Pembayaran' }}</h3></div>
            <div class="card-body">
                @if ($invoice->isPaid())
                    <div class="alert alert-success mb-0">
                        Tagihan sudah lunas pada {{ \App\Support\Format::dateLong($invoice->paid_at) }}
                        melalui {{ $invoice->method ?: 'Tunai' }}.
                    </div>
                @else
                    <div class="pay-summary">
                        <span class="stat-label">Jumlah yang harus dibayar</span>
                        <div class="pay-amount">{{ \App\Support\Format::rupiah($invoice->amount) }}</div>
                    </div>
                    <form method="POST" action="{{ route('invoices.payment', $invoice) }}">
                        @csrf
                        <label class="form-field">
                            <span class="form-label">Metode pembayaran *</span>
                            <select name="method" required>
                                @foreach ($methods as $value => $label)
                                    <option value="{{ $value }}">{{ $label }}</option>
                                @endforeach
                            </select>
                            @error('method')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                        <label class="form-field">
                            <span class="form-label">Tanggal bayar</span>
                            <input type="date" name="paid_at" value="{{ old('paid_at', now()->toDateString()) }}">
                            @error('paid_at')<span class="field-error">{{ $message }}</span>@enderror
                        </label>
                        <input type="hidden" name="paid_via" value="admin">
                        <button class="btn btn-primary btn-block" type="submit">Tandai Lunas</button>
                    </form>
                @endif
            </div>
        </section>
    </div>
@endsection
