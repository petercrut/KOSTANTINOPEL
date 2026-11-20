@extends('layouts.app')

@section('title', 'Dashboard')

@section('content')
    @php
        $rupiah = fn ($value) => \App\Support\Format::rupiah($value);
        $compact = function (int $value): string {
            if ($value >= 1000000000) return number_format($value / 1000000000, 1, ',', '.') . ' M';
            if ($value >= 1000000) return number_format($value / 1000000, 1, ',', '.') . ' jt';
            if ($value >= 1000) return number_format($value / 1000, 0, ',', '.') . ' rb';
            return (string) $value;
        };
    @endphp

    <section class="welcome-banner">
        <div>
            <h2>Selamat datang, {{ auth()->user()->name }}</h2>
            <p>
                Hari ini {{ \App\Support\Format::dateLong(now()) }} ·
                {{ $counts['arrivals'] }} kedatangan, {{ $counts['departures'] }} keberangkatan,
                {{ $counts['inHouse'] }} tamu menginap.
            </p>
        </div>
        <div class="welcome-actions">
            <a class="btn btn-light" href="{{ route('bookings.create') }}">+ Booking</a>
            <a class="btn btn-ghost-light" href="{{ route('tenants.create') }}">+ Penyewa</a>
            <a class="btn btn-ghost-light" href="{{ route('invoices.create') }}">+ Tagihan</a>
        </div>
    </section>

    <div class="stat-grid cols-4">
        <div class="stat-card">
            <span class="stat-icon">@include('partials.icon', ['name' => 'chart'])</span>
            <div>
                <span class="stat-label">Tingkat Hunian</span>
                <span class="stat-value">{{ $stats['occupancyRate'] }}<small>%</small></span>
                <span class="stat-sub">{{ $stats['occupied'] }} dari {{ $stats['rooms'] }} kamar terisi</span>
            </div>
        </div>
        <div class="stat-card">
            <span class="stat-icon">@include('partials.icon', ['name' => 'room'])</span>
            <div>
                <span class="stat-label">Kamar Tersedia</span>
                <span class="stat-value">{{ $stats['available'] }}</span>
                <span class="stat-sub">{{ $stats['maintenance'] }} kamar dalam perawatan</span>
            </div>
        </div>
        <div class="stat-card">
            <span class="stat-icon">@include('partials.icon', ['name' => 'tenant'])</span>
            <div>
                <span class="stat-label">Penyewa Aktif</span>
                <span class="stat-value">{{ $stats['tenants'] }}</span>
                <span class="stat-sub">{{ $stats['properties'] }} properti dikelola</span>
            </div>
        </div>
        <div class="stat-card">
            <span class="stat-icon">@include('partials.icon', ['name' => 'booking'])</span>
            <div>
                <span class="stat-label">Booking Menunggu</span>
                <span class="stat-value">{{ $counts['pendingBookings'] }}</span>
                <span class="stat-sub">{{ $counts['rooms'] }} kamar terdaftar</span>
            </div>
        </div>
    </div>

    <div class="stat-grid cols-4">
        <div class="mini-stat">
            <span>Total Lunas</span>
            <strong>{{ $rupiah($totals['paidTotal']) }}</strong>
            <small>{{ $rupiah($totals['paidThisMonth']) }} bulan ini</small>
        </div>
        <div class="mini-stat">
            <span>Belum Dibayar</span>
            <strong>{{ $rupiah($totals['unpaidTotal']) }}</strong>
            <small>Termasuk tagihan jatuh tempo</small>
        </div>
        <div class="mini-stat">
            <span>Terlambat</span>
            <strong>{{ $rupiah($totals['lateTotal']) }}</strong>
            <small>Perlu tindak lanjut</small>
        </div>
        <div class="mini-stat">
            <span>Okupansi</span>
            <strong>{{ $stats['occupied'] }} / {{ $stats['rooms'] }}</strong>
            <small>{{ $stats['occupancyRate'] }}% tingkat hunian</small>
        </div>
    </div>

    <div class="grid-2">
        <section class="card">
            <div class="card-head">
                <h3>Okupansi per Properti</h3>
                <a class="card-link" href="{{ route('properties.index') }}">Lihat semua</a>
            </div>
            <div class="card-body">
                @forelse ($properties as $property)
                    <div class="occ-row">
                        <div class="occ-info">
                            <strong>{{ $property['name'] }}</strong>
                            <span>{{ \App\Support\Labels::label('propertyType', $property['type']) }} · {{ $property['occupied'] }}/{{ $property['total'] }} kamar terisi</span>
                        </div>
                        <div class="occ-bar"><span style="width: {{ $property['rate'] }}%"></span></div>
                        <span class="occ-rate">{{ $property['rate'] }}%</span>
                    </div>
                @empty
                    <div class="empty-state">
                        <div class="empty-icon">🏠</div>
                        <p>Belum ada properti</p>
                        <small>Tambahkan properti pertama Anda.</small>
                    </div>
                @endforelse
            </div>
        </section>

        <section class="card">
            <div class="card-head">
                <h3>Pendapatan 6 Bulan</h3>
                <a class="card-link" href="{{ route('analytics.index') }}">Analitik</a>
            </div>
            <div class="card-body">
                <div class="bar-chart">
                    @foreach ($revenue as $point)
                        <div class="bar-col">
                            <span class="bar-value">{{ $compact($point['total']) }}</span>
                            <div class="bar" style="height: {{ max(2, $point['height']) }}%" title="{{ $rupiah($point['total']) }}"></div>
                            <span class="bar-label">{{ $point['label'] }}</span>
                        </div>
                    @endforeach
                </div>
            </div>
        </section>
    </div>

    <div class="grid-2">
        <section class="card">
            <div class="card-head">
                <h3>Booking Terbaru</h3>
                <a class="card-link" href="{{ route('bookings.index') }}">Lihat semua</a>
            </div>
            <div class="card-body no-pad table-wrap">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Kode</th>
                            <th>Tamu</th>
                            <th>Kamar</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($bookings as $booking)
                            <tr>
                                <td><a href="{{ route('bookings.show', $booking) }}" class="mono">{{ $booking->code }}</a></td>
                                <td class="cell-main">
                                    <strong>{{ $booking->guest_name }}</strong>
                                    <span>{{ \App\Support\Format::dateLong($booking->check_in) }} → {{ \App\Support\Format::dateLong($booking->check_out) }}</span>
                                </td>
                                <td>{{ $booking->room?->number }}<span class="cell-muted"> · {{ $booking->room?->property?->name }}</span></td>
                                <td><x-status-badge :status="$booking->status" group="bookingStatus" /></td>
                            </tr>
                        @empty
                            <tr><td colspan="4"><div class="empty-state"><p>Belum ada booking</p></div></td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </section>

        <section class="card">
            <div class="card-head">
                <h3>Tagihan Terbaru</h3>
                <a class="card-link" href="{{ route('invoices.index') }}">Lihat semua</a>
            </div>
            <div class="card-body no-pad table-wrap">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Kode</th>
                            <th>Untuk</th>
                            <th class="num">Nominal</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($invoices as $invoice)
                            <tr>
                                <td><a href="{{ route('invoices.show', $invoice) }}" class="mono">{{ $invoice->code }}</a></td>
                                <td class="cell-main">
                                    <strong>{{ $invoice->tenant?->name ?? $invoice->booking?->guest_name ?? 'Umum' }}</strong>
                                    <span>{{ $invoice->room?->number ?? '-' }}</span>
                                </td>
                                <td class="num">{{ $rupiah($invoice->amount) }}</td>
                                <td><x-status-badge :status="$invoice->effectiveStatus()" group="invoiceStatus" /></td>
                            </tr>
                        @empty
                            <tr><td colspan="4"><div class="empty-state"><p>Belum ada tagihan</p></div></td></tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </section>
    </div>

    <div class="grid-2">
        <section class="card">
            <div class="card-head">
                <h3>Laporan Masuk</h3>
                <a class="card-link" href="{{ route('requests.index') }}">Kelola</a>
            </div>
            <div class="card-body no-pad">
                <ul class="mini-list">
                    @forelse ($requests as $requestModel)
                        <li>
                            <div class="mini-main">
                                <strong>{{ $requestModel->title }}</strong>
                                <span>{{ $requestModel->tenant?->name ?? 'Penyewa' }} · {{ $requestModel->code }}</span>
                                <small>{{ \App\Support\Format::dateLong($requestModel->created_at) }}</small>
                            </div>
                            <div class="mini-side">
                                <x-status-badge :status="$requestModel->status" group="requestStatus" />
                                <span class="badge badge-{{ $requestModel->priority === 'high' ? 'red' : ($requestModel->priority === 'low' ? 'slate' : 'amber') }}">
                                    {{ \App\Support\Labels::label('requestPriority', $requestModel->priority) }}
                                </span>
                            </div>
                        </li>
                    @empty
                        <li><div class="empty-state"><p>Tidak ada laporan terbuka</p></div></li>
                    @endforelse
                </ul>
            </div>
        </section>

        <section class="card">
            <div class="card-head">
                <h3>Pengumuman</h3>
                <a class="card-link" href="{{ route('announcements.index') }}">Kelola</a>
            </div>
            <div class="card-body no-pad">
                <ul class="mini-list">
                    @forelse ($announcements as $announcement)
                        <li>
                            <div class="mini-main">
                                <strong>
                                    @if ($announcement->pinned)<span class="pin-flag">📌</span>@endif
                                    {{ $announcement->title }}
                                </strong>
                                <span>{{ \Illuminate\Support\Str::limit($announcement->body, 80) }}</span>
                                <small>{{ $announcement->property?->name ?? 'Semua properti' }} · {{ \App\Support\Format::dateLong($announcement->created_at) }}</small>
                            </div>
                        </li>
                    @empty
                        <li><div class="empty-state"><p>Belum ada pengumuman</p></div></li>
                    @endforelse
                </ul>
            </div>
        </section>
    </div>
@endsection
