@extends('layouts.app')

@section('title', 'Laporan & Analitik')

@section('content')
    @php
        $compact = function (int $value): string {
            if ($value >= 1000000000) return number_format($value / 1000000000, 1, ',', '.') . ' M';
            if ($value >= 1000000) return number_format($value / 1000000, 1, ',', '.') . ' jt';
            if ($value >= 1000) return number_format($value / 1000, 0, ',', '.') . ' rb';
            return (string) $value;
        };
    @endphp

    <div class="page-head">
        <div>
            <h2>Laporan & Analitik</h2>
            <p class="page-sub">Rekap pendapatan pembayaran dan tingkat hunian dalam periode tertentu.</p>
        </div>
    </div>

    <form class="filter-bar" method="GET" action="{{ route('analytics.index') }}">
        <label class="form-field mb-0">
            <span class="form-label">Dari</span>
            <input type="date" name="from" value="{{ $from }}">
        </label>
        <label class="form-field mb-0">
            <span class="form-label">Sampai</span>
            <input type="date" name="to" value="{{ $to }}">
        </label>
        <label class="form-field mb-0">
            <span class="form-label">Kelompokkan</span>
            <select name="groupBy">
                <option value="month" @selected($groupBy === 'month')>Bulan</option>
                <option value="property" @selected($groupBy === 'property')>Properti</option>
                <option value="method" @selected($groupBy === 'method')>Metode Bayar</option>
            </select>
        </label>
        <button class="btn btn-primary btn-sm" type="submit">Terapkan</button>
    </form>

    <div class="stat-grid cols-4">
        <div class="mini-stat">
            <span>Total Pendapatan</span>
            <strong>{{ \App\Support\Format::rupiah($total) }}</strong>
            <small>{{ \App\Support\Format::date($from) }} – {{ \App\Support\Format::date($to) }}</small>
        </div>
        <div class="mini-stat">
            <span>Okupansi Saat Ini</span>
            <strong>{{ $occupancy['occupancyRate'] }}%</strong>
            <small>{{ $occupancy['occupied'] }} dari {{ $occupancy['rooms'] }} kamar</small>
        </div>
        <div class="mini-stat">
            <span>Penyewa Aktif</span>
            <strong>{{ $occupancy['tenants'] }}</strong>
            <small>{{ $occupancy['properties'] }} properti</small>
        </div>
        <div class="mini-stat">
            <span>Kamar Perawatan</span>
            <strong>{{ $occupancy['maintenance'] }}</strong>
            <small>{{ $occupancy['available'] }} kamar tersedia</small>
        </div>
    </div>

    <div class="grid-2 wide-left">
        <section class="card">
            <div class="card-head"><h3>Grafik Pendapatan</h3></div>
            <div class="card-body">
                @if (count($points))
                    <div class="bar-chart">
                        @foreach ($points as $point)
                            <div class="bar-col">
                                <span class="bar-value">{{ $compact($point['total']) }}</span>
                                <div class="bar" style="height: {{ max(2, $point['height']) }}%" title="{{ \App\Support\Format::rupiah($point['total']) }}"></div>
                                <span class="bar-label">{{ \Illuminate\Support\Str::limit($point['label'], 12) }}</span>
                            </div>
                        @endforeach
                    </div>
                @else
                    <div class="empty-state">
                        <div class="empty-icon">📊</div>
                        <p>Belum ada pembayaran</p>
                        <small>Tidak ada tagihan lunas pada periode ini.</small>
                    </div>
                @endif
            </div>
        </section>

        <section class="card">
            <div class="card-head"><h3>Rincian Pendapatan</h3></div>
            <div class="card-body no-pad table-wrap">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Kelompok</th>
                            <th class="num">Pendapatan</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($points as $point)
                            <tr>
                                <td>{{ $point['label'] }}</td>
                                <td class="num">{{ \App\Support\Format::rupiah($point['total']) }}</td>
                            </tr>
                        @empty
                            <tr><td colspan="2"><div class="empty-state"><p>Belum ada data</p></div></td></tr>
                        @endforelse
                        @if (count($points))
                            <tr>
                                <td><strong>Total</strong></td>
                                <td class="num"><strong>{{ \App\Support\Format::rupiah($total) }}</strong></td>
                            </tr>
                        @endif
                    </tbody>
                </table>
            </div>
        </section>
    </div>

    <section class="card">
        <div class="card-head"><h3>Okupansi per Properti</h3></div>
        <div class="card-body no-pad table-wrap">
            <table class="table">
                <thead>
                    <tr>
                        <th>Properti</th>
                        <th>Tipe</th>
                        <th class="num">Kamar</th>
                        <th class="num">Terisi</th>
                        <th class="num">Tersedia</th>
                        <th class="num">Perawatan</th>
                        <th style="width: 180px">Okupansi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($byProperty as $property)
                        <tr>
                            <td><a href="{{ route('properties.index') }}"><strong>{{ $property['name'] }}</strong></a></td>
                            <td>{{ \App\Support\Labels::label('propertyType', $property['type']) }}</td>
                            <td class="num">{{ $property['total'] }}</td>
                            <td class="num">{{ $property['occupied'] }}</td>
                            <td class="num">{{ $property['available'] }}</td>
                            <td class="num">{{ $property['maintenance'] }}</td>
                            <td>
                                <div class="row-between">
                                    <div class="occ-bar"><span style="width: {{ $property['rate'] }}%"></span></div>
                                    <strong>{{ $property['rate'] }}%</strong>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr><td colspan="7"><div class="empty-state"><p>Belum ada properti</p></div></td></tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </section>
@endsection
