@extends('layouts.portal')

@section('title', 'Laporan & Kendala')

@section('content')
    <div class="page-head">
        <div>
            <h2>Laporan &amp; Kendala</h2>
            <p class="page-sub">Kirim keluhan atau permintaan perbaikan. Pengelola akan menanggapi laporan Anda.</p>
        </div>
    </div>

    <div class="grid-2 wide-left">
        <div>
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
                                <strong>Tanggapan pengelola:</strong> {{ $requestModel->response }}
                            </div>
                        @endif

                        <div class="request-foot">
                            <span class="request-room">
                                Kamar {{ $requestModel->room?->number ?? '-' }} · {{ $requestModel->property?->name ?? '-' }}
                                @if ($requestModel->resolved_at)
                                    · selesai {{ \App\Support\Format::dateLong($requestModel->resolved_at) }}
                                @endif
                            </span>
                        </div>
                    </article>
                @empty
                    <div class="card">
                        <div class="empty-state">
                            <div class="empty-icon">🛠️</div>
                            <p>Belum ada laporan</p>
                            <small>Gunakan formulir di samping untuk mengirim laporan pertama Anda.</small>
                        </div>
                    </div>
                @endforelse
            </div>
        </div>

        <section class="card">
            <div class="card-head"><h3>Buat Laporan Baru</h3></div>
            <div class="card-body">
                @include('partials.form-errors')
                <form method="POST" action="{{ route('portal.requests.store') }}">
                    @csrf
                    <label class="form-field">
                        <span class="form-label">Kategori *</span>
                        <select name="category" required>
                            @foreach ($categories as $value => $label)
                                <option value="{{ $value }}" @selected(old('category') === $value)>{{ $label }}</option>
                            @endforeach
                        </select>
                        @error('category')<span class="field-error">{{ $message }}</span>@enderror
                    </label>

                    <label class="form-field">
                        <span class="form-label">Prioritas *</span>
                        <select name="priority" required>
                            @foreach ($priorities as $value => $label)
                                <option value="{{ $value }}" @selected(old('priority', 'normal') === $value)>{{ $label }}</option>
                            @endforeach
                        </select>
                        @error('priority')<span class="field-error">{{ $message }}</span>@enderror
                    </label>

                    <label class="form-field">
                        <span class="form-label">Judul laporan *</span>
                        <input type="text" name="title" value="{{ old('title') }}" required maxlength="150" placeholder="Contoh: AC kamar tidak dingin">
                        @error('title')<span class="field-error">{{ $message }}</span>@enderror
                    </label>

                    <label class="form-field">
                        <span class="form-label">Deskripsi *</span>
                        <textarea name="description" rows="5" required placeholder="Jelaskan kendala secara detail…">{{ old('description') }}</textarea>
                        @error('description')<span class="field-error">{{ $message }}</span>@enderror
                    </label>

                    <button class="btn btn-primary btn-block" type="submit">Kirim Laporan</button>
                </form>
            </div>
        </section>
    </div>
@endsection
