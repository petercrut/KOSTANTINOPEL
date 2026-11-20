@extends('layouts.app')

@section('title', 'Laporan Masuk')

@section('content')
    <div class="page-head">
        <div>
            <h2>Laporan Masuk</h2>
            <p class="page-sub">Tanggapi keluhan dan permintaan perbaikan dari penyewa.</p>
        </div>
    </div>

    <form class="filter-bar" method="GET" action="{{ route('requests.index') }}">
        <input type="text" name="search" value="{{ request('search') }}" placeholder="Cari kode, judul, atau isi laporan…">
        <select name="status">
            <option value="">Semua status</option>
            @foreach ($statuses as $value => $label)
                <option value="{{ $value }}" @selected(request('status') === $value)>{{ $label }}</option>
            @endforeach
        </select>
        <select name="category">
            <option value="">Semua kategori</option>
            @foreach ($categories as $value => $label)
                <option value="{{ $value }}" @selected(request('category') === $value)>{{ $label }}</option>
            @endforeach
        </select>
        <select name="priority">
            <option value="">Semua prioritas</option>
            @foreach ($priorities as $value => $label)
                <option value="{{ $value }}" @selected(request('priority') === $value)>{{ $label }}</option>
            @endforeach
        </select>
        <select name="tenant_id">
            <option value="">Semua penyewa</option>
            @foreach ($tenants as $tenant)
                <option value="{{ $tenant->id }}" @selected((string) request('tenant_id') === (string) $tenant->id)>{{ $tenant->name }}</option>
            @endforeach
        </select>
        <button class="btn btn-ghost btn-sm" type="submit">Filter</button>
        @if (request()->hasAny(['search', 'status', 'category', 'priority', 'tenant_id']))
            <a class="btn btn-ghost btn-sm" href="{{ route('requests.index') }}">Reset</a>
        @endif
        <span class="filter-count">{{ $requests->total() }} laporan</span>
    </form>

    <div class="request-list">
        @forelse ($requests as $requestModel)
            <article class="request-card">
                <div class="request-head">
                    <div>
                        <span class="request-title">{{ $requestModel->title }}</span>
                        <div class="request-meta">
                            <span class="mono">{{ $requestModel->code }}</span>
                            <span>·</span>
                            <span>{{ \App\Support\Labels::label('requestCategory', $requestModel->category) }}</span>
                            <span>·</span>
                            <span>{{ $requestModel->tenant?->name ?? 'Penyewa' }}</span>
                            <span>·</span>
                            <span>{{ \App\Support\Format::dateLong($requestModel->created_at) }}</span>
                        </div>
                    </div>
                    <div class="request-head-side">
                        <x-status-badge :status="$requestModel->status" group="requestStatus" />
                        <span class="badge badge-{{ $requestModel->priority === 'high' ? 'red' : ($requestModel->priority === 'low' ? 'slate' : 'amber') }}">
                            {{ \App\Support\Labels::label('requestPriority', $requestModel->priority) }}
                        </span>
                    </div>
                </div>

                <p class="request-desc">{{ $requestModel->description }}</p>

                @if ($requestModel->response)
                    <div class="request-response">
                        <strong>Tanggapan:</strong> {{ $requestModel->response }}
                    </div>
                @endif

                <div class="request-foot">
                    <span class="request-room">
                        {{ $requestModel->room?->number ?? '-' }} · {{ $requestModel->property?->name ?? '-' }}
                        @if ($requestModel->resolved_at)
                            · selesai {{ \App\Support\Format::dateLong($requestModel->resolved_at) }}
                        @endif
                    </span>
                    <div class="request-actions">
                        <form method="POST" action="{{ route('requests.respond', $requestModel) }}" class="inline-form">
                            @csrf
                            <select name="status" class="btn btn-ghost btn-sm">
                                @foreach ($statuses as $value => $label)
                                    <option value="{{ $value }}" @selected($requestModel->status === $value)>{{ $label }}</option>
                                @endforeach
                            </select>
                            <input type="text" name="response" value="{{ $requestModel->response }}" placeholder="Tulis tanggapan…" required
                                   style="padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--card);color:var(--ink);font:inherit;font-size:13px;min-width:220px;">
                            <button class="btn btn-primary btn-sm" type="submit">Kirim</button>
                        </form>
                        <form method="POST" action="{{ route('requests.destroy', $requestModel) }}" data-confirm="Hapus laporan {{ $requestModel->code }}?">
                            @csrf
                            @method('DELETE')
                            <button class="btn btn-danger-ghost btn-sm" type="submit">Hapus</button>
                        </form>
                    </div>
                </div>
            </article>
        @empty
            <div class="card">
                <div class="empty-state">
                    <div class="empty-icon">🛠️</div>
                    <p>Belum ada laporan</p>
                    <small>Laporan dari portal penyewa akan tampil di sini.</small>
                </div>
            </div>
        @endforelse
    </div>

    @if ($requests->hasPages())
        <section class="card">
            {{ $requests->links('partials.pagination') }}
        </section>
    @endif
@endsection
