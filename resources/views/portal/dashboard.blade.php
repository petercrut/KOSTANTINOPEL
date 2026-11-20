@extends('layouts.portal')

@section('title', 'Dashboard')

@section('content')
    @php
        $room = $tenant->room;
        $property = $tenant->property ?? $room?->property;
        $initials = strtoupper(substr($tenant->name, 0, 1));
    @endphp

    <section class="welcome-banner">
        <div>
            <h2>Halo, {{ $tenant->name }}</h2>
            <p>
                {{ \App\Support\Labels::label('tenantStatus', $tenant->status) }} ·
                Kamar {{ $room?->number ?? '-' }} · {{ $property?->name ?? '-' }}
            </p>
        </div>
        <div class="welcome-actions">
            <a class="btn btn-light" href="{{ route('portal.invoices') }}">Lihat Tagihan</a>
            <a class="btn btn-ghost-light" href="{{ route('portal.requests') }}">Kirim Laporan</a>
        </div>
    </section>

    <div class="stat-grid cols-4">
        <div class="mini-stat">
            <span>Tagihan Belum Lunas</span>
            <strong>{{ \App\Support\Format::rupiah($outstanding) }}</strong>
            <small>{{ $unpaidCount }} tagihan menunggu</small>
        </div>
        <div class="mini-stat">
            <span>Jatuh Tempo Berikutnya</span>
            <strong>{{ $nextDue ? \App\Support\Format::date($nextDue->due_date?->toDateString()) : '-' }}</strong>
            <small>{{ $nextDue ? \App\Support\Format::rupiah($nextDue->amount) : 'Tidak ada tagihan' }}</small>
        </div>
        <div class="mini-stat">
            <span>Kamar Saya</span>
            <strong>{{ $room?->number ?? '-' }}</strong>
            <small>{{ $room?->type ?? '-' }} · {{ $room?->capacity ?? 1 }} orang</small>
        </div>
        <div class="mini-stat">
            <span>Laporan Aktif</span>
            <strong>{{ $requests->where('status', '!=', 'done')->where('status', '!=', 'rejected')->count() }}</strong>
            <small>{{ $requests->count() }} laporan tercatat</small>
        </div>
    </div>

    <div class="grid-2 wide-left">
        <section class="card">
            <div class="card-head">
                <h3>Kamar &amp; Hunian</h3>
                <a class="card-link" href="{{ route('portal.profile') }}">Data diri</a>
            </div>
            <div class="card-body">
                <div class="room-summary mb-16">
                    <div class="room-badge">{{ $initials }}</div>
                    <div class="room-summary-main">
                        <strong>Kamar {{ $room?->number ?? '-' }}</strong>
                        <span>{{ $property?->name ?? '-' }} · {{ $room?->type ?? '-' }}</span>
                    </div>
                    <x-status-badge :status="$tenant->status" group="tenantStatus" />
                </div>

                <div class="info-grid">
                    <div class="info-item"><span>Mulai sewa</span><strong>{{ \App\Support\Format::dateLong($tenant->start_date) }}</strong></div>
                    <div class="info-item"><span>Akhir sewa</span><strong>{{ $tenant->end_date ? \App\Support\Format::dateLong($tenant->end_date) : 'Belum ditentukan' }}</strong></div>
                    <div class="info-item"><span>Harga bulanan</span><strong>{{ \App\Support\Format::rupiah($room?->price_monthly) }}</strong></div>
                    <div class="info-item"><span>Harga harian</span><strong>{{ \App\Support\Format::rupiah($room?->price_daily) }}</strong></div>
                </div>

                @php($facilities = $room?->facilities ?? [])
                @if (count($facilities))
                    <div class="facility-chips mt-16">
                        @foreach ($facilities as $facility)
                            <span class="facility-chip">{{ $facility }}</span>
                        @endforeach
                    </div>
                @endif
            </div>
        </section>

        <section class="card">
            <div class="card-head">
                <h3>Tagihan Terbaru</h3>
                <a class="card-link" href="{{ route('portal.invoices') }}">Semua tagihan</a>
            </div>
            <div class="card-body no-pad">
                <ul class="mini-list">
                    @forelse ($invoices as $invoice)
                        <li>
                            <div class="mini-main">
                                <strong class="mono">{{ $invoice->code }}</strong>
                                <span>{{ $invoice->description }}</span>
                                <small>Jatuh tempo {{ \App\Support\Format::date($invoice->due_date?->toDateString()) }}</small>
                            </div>
                            <div class="mini-side">
                                <strong>{{ \App\Support\Format::rupiah($invoice->amount) }}</strong>
                                <x-status-badge :status="$invoice->effectiveStatus()" group="invoiceStatus" />
                            </div>
                        </li>
                    @empty
                        <li><div class="empty-state"><p>Belum ada tagihan</p></div></li>
                    @endforelse
                </ul>
            </div>
        </section>
    </div>

    <div class="grid-2">
        <section class="card">
            <div class="card-head">
                <h3>Laporan Saya</h3>
                <a class="card-link" href="{{ route('portal.requests') }}">Buat laporan</a>
            </div>
            <div class="card-body no-pad">
                <ul class="mini-list">
                    @forelse ($requests as $requestModel)
                        <li>
                            <div class="mini-main">
                                <strong>{{ $requestModel->title }}</strong>
                                <span class="mono">{{ $requestModel->code }}</span>
                                <small>{{ \App\Support\Labels::label('requestCategory', $requestModel->category) }} · {{ \App\Support\Format::dateLong($requestModel->created_at) }}</small>
                            </div>
                            <div class="mini-side">
                                <x-status-badge :status="$requestModel->status" group="requestStatus" />
                            </div>
                        </li>
                    @empty
                        <li><div class="empty-state"><p>Belum ada laporan</p></div></li>
                    @endforelse
                </ul>
            </div>
        </section>

        <section class="card">
            <div class="card-head">
                <h3>Pengumuman</h3>
                <a class="card-link" href="{{ route('portal.announcements') }}">Lihat semua</a>
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
                                <span>{{ \Illuminate\Support\Str::limit($announcement->body, 90) }}</span>
                                <small>{{ \App\Support\Format::dateLong($announcement->created_at) }}</small>
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
