@extends('layouts.portal')

@section('title', 'Tagihan Saya')

@section('content')
    <div class="page-head">
        <div>
            <h2>Tagihan Saya</h2>
            <p class="page-sub">Pantau dan bayar tagihan sewa Anda. Pembayaran dicatat setelah dikonfirmasi pengelola.</p>
        </div>
    </div>

    <div class="stat-grid cols-4">
        <div class="mini-stat">
            <span>Total Belum Lunas</span>
            <strong>{{ \App\Support\Format::rupiah($outstanding) }}</strong>
            <small>Termasuk tagihan jatuh tempo</small>
        </div>
        <div class="mini-stat">
            <span>Total Lunas</span>
            <strong>{{ \App\Support\Format::rupiah($paidTotal) }}</strong>
            <small>Sepanjang masa sewa</small>
        </div>
        <div class="mini-stat">
            <span>Jumlah Tagihan</span>
            <strong>{{ $invoices->count() }}</strong>
            <small>Pada filter saat ini</small>
        </div>
        <div class="mini-stat">
            <span>Kamar</span>
            <strong>{{ $tenant->room?->number ?? '-' }}</strong>
            <small>{{ $tenant->property?->name ?? '-' }}</small>
        </div>
    </div>

    <div class="chip-bar">
        <a class="chip {{ ! request('status') ? 'active' : '' }}" href="{{ route('portal.invoices') }}">Semua</a>
        <a class="chip {{ request('status') === 'unpaid' ? 'active' : '' }}" href="{{ route('portal.invoices', ['status' => 'unpaid']) }}">Belum Bayar</a>
        <a class="chip {{ request('status') === 'late' ? 'active' : '' }}" href="{{ route('portal.invoices', ['status' => 'late']) }}">Terlambat</a>
        <a class="chip {{ request('status') === 'paid' ? 'active' : '' }}" href="{{ route('portal.invoices', ['status' => 'paid']) }}">Lunas</a>
    </div>

    <div class="request-list">
        @forelse ($invoices as $invoice)
            <article class="request-card">
                <div class="request-head">
                    <div>
                        <span class="request-title">{{ $invoice->description }}</span>
                        <div class="request-meta">
                            <span class="mono">{{ $invoice->code }}</span>
                            <span>·</span>
                            <span>Jatuh tempo {{ \App\Support\Format::dateLong($invoice->due_date) }}</span>
                            @if ($invoice->paid_at)
                                <span>·</span>
                                <span>Dibayar {{ \App\Support\Format::dateLong($invoice->paid_at) }}</span>
                            @endif
                        </div>
                    </div>
                    <div class="request-head-side">
                        <strong class="nowrap">{{ \App\Support\Format::rupiah($invoice->amount) }}</strong>
                        <x-status-badge :status="$invoice->effectiveStatus()" group="invoiceStatus" />
                    </div>
                </div>

                @if ($invoice->isPaid())
                    <div class="request-response">
                        Pembayaran tercatat melalui {{ $invoice->method ?: 'Tunai' }}
                        @if ($invoice->paid_via === 'tenant')
                            (konfirmasi mandiri)
                        @endif.
                    </div>
                @else
                    <div class="request-foot">
                        <span class="request-room">Pilih metode pembayaran untuk menandai tagihan ini telah dibayar.</span>
                        <form method="POST" action="{{ route('portal.invoices.payment', $invoice->id) }}" class="inline-form" data-confirm="Tandai tagihan {{ $invoice->code }} sebesar {{ \App\Support\Format::rupiah($invoice->amount) }} sebagai sudah dibayar?">
                            @csrf
                            <select name="method" required>
                                @foreach ($methods as $value => $label)
                                    <option value="{{ $value }}">{{ $label }}</option>
                                @endforeach
                            </select>
                            <button class="btn btn-primary btn-sm" type="submit">Bayar / Konfirmasi</button>
                        </form>
                    </div>
                @endif
            </article>
        @empty
            <div class="card">
                <div class="empty-state">
                    <div class="empty-icon">🧾</div>
                    <p>Tidak ada tagihan</p>
                    <small>Belum ada tagihan pada filter ini.</small>
                </div>
            </div>
        @endforelse
    </div>
@endsection
