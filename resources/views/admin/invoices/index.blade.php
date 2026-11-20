@extends('layouts.app')

@section('title', 'Tagihan')

@section('content')
    <div class="page-head">
        <div>
            <h2>Tagihan</h2>
            <p class="page-sub">Pantau pembayaran sewa dan booking. Status terlambat dihitung dari jatuh tempo.</p>
        </div>
        <a class="btn btn-primary" href="{{ route('invoices.create') }}">+ Buat Tagihan</a>
    </div>

    <div class="stat-grid cols-4">
        <div class="mini-stat">
            <span>Total Lunas</span>
            <strong>{{ \App\Support\Format::rupiah($totals['paidTotal']) }}</strong>
            <small>Seluruh tagihan terbayar</small>
        </div>
        <div class="mini-stat">
            <span>Belum Dibayar</span>
            <strong>{{ \App\Support\Format::rupiah($totals['unpaidTotal']) }}</strong>
            <small>Termasuk yang terlambat</small>
        </div>
        <div class="mini-stat">
            <span>Terlambat</span>
            <strong>{{ \App\Support\Format::rupiah($totals['lateTotal']) }}</strong>
            <small>Lewat tanggal jatuh tempo</small>
        </div>
        <div class="mini-stat">
            <span>Lunas Bulan Ini</span>
            <strong>{{ \App\Support\Format::rupiah($totals['paidThisMonth']) }}</strong>
            <small>{{ now()->translatedFormat('F Y') }}</small>
        </div>
    </div>

    <form class="filter-bar" method="GET" action="{{ route('invoices.index') }}">
        <input type="text" name="search" value="{{ request('search') }}" placeholder="Cari kode atau deskripsi…">
        <select name="status">
            <option value="">Semua status</option>
            @foreach ($statuses as $value => $label)
                <option value="{{ $value }}" @selected(request('status') === $value)>{{ $label }}</option>
            @endforeach
        </select>
        <select name="tenant_id">
            <option value="">Semua penyewa</option>
            @foreach ($tenants as $tenant)
                <option value="{{ $tenant->id }}" @selected((string) request('tenant_id') === (string) $tenant->id)>{{ $tenant->name }}</option>
            @endforeach
        </select>
        <button class="btn btn-ghost btn-sm" type="submit">Filter</button>
        @if (request()->hasAny(['search', 'status', 'tenant_id']))
            <a class="btn btn-ghost btn-sm" href="{{ route('invoices.index') }}">Reset</a>
        @endif
        <span class="filter-count">{{ $invoices->total() }} tagihan</span>
    </form>

    <section class="card">
        <div class="card-body no-pad table-wrap">
            <table class="table">
                <thead>
                    <tr>
                        <th>Kode</th>
                        <th>Deskripsi</th>
                        <th>Untuk</th>
                        <th>Jatuh Tempo</th>
                        <th class="num">Nominal</th>
                        <th>Status</th>
                        <th class="right">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($invoices as $invoice)
                        <tr>
                            <td><a href="{{ route('invoices.show', $invoice) }}" class="mono">{{ $invoice->code }}</a></td>
                            <td>{{ $invoice->description }}</td>
                            <td class="cell-main">
                                <strong>{{ $invoice->tenant?->name ?? $invoice->booking?->guest_name ?? 'Umum' }}</strong>
                                <span>{{ $invoice->room?->number ?? '-' }} · {{ $invoice->property?->name ?? '-' }}</span>
                            </td>
                            <td class="nowrap">{{ \App\Support\Format::date($invoice->due_date?->toDateString()) }}</td>
                            <td class="num">{{ \App\Support\Format::rupiah($invoice->amount) }}</td>
                            <td><x-status-badge :status="$invoice->effectiveStatus()" group="invoiceStatus" /></td>
                            <td class="actions">
                                <a class="btn btn-ghost btn-sm" href="{{ route('invoices.show', $invoice) }}">Lihat</a>
                                <a class="btn btn-ghost btn-sm" href="{{ route('invoices.edit', $invoice) }}">Edit</a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7">
                                <div class="empty-state">
                                    <div class="empty-icon">🧾</div>
                                    <p>Belum ada tagihan</p>
                                    <small>Tagihan otomatis dibuat dari booking dan penyewa baru.</small>
                                </div>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        {{ $invoices->links('partials.pagination') }}
    </section>
@endsection
