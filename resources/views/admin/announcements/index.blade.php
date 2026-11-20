@extends('layouts.app')

@section('title', 'Pengumuman')

@section('content')
    <div class="page-head">
        <div>
            <h2>Pengumuman</h2>
            <p class="page-sub">Terbitkan informasi untuk penyewa. Pengumuman tersemat tampil paling atas di portal.</p>
        </div>
    </div>

    <div class="grid-2 wide-left">
        <div>
            <form class="filter-bar" method="GET" action="{{ route('announcements.index') }}">
                <input type="text" name="search" value="{{ request('search') }}" placeholder="Cari judul atau isi pengumuman…">
                <select name="property_id">
                    <option value="">Semua properti</option>
                    @foreach ($properties as $property)
                        <option value="{{ $property->id }}" @selected((string) request('property_id') === (string) $property->id)>{{ $property->name }}</option>
                    @endforeach
                </select>
                <button class="btn btn-ghost btn-sm" type="submit">Filter</button>
                <span class="filter-count">{{ $announcements->total() }} pengumuman</span>
            </form>

            <div class="announcement-list">
                @forelse ($announcements as $announcement)
                    <article class="announcement-item {{ $announcement->pinned ? 'is-pinned' : '' }}">
                        <div class="request-head">
                            <div>
                                <h3>
                                    @if ($announcement->pinned)<span class="pin-flag" title="Disematkan">📌</span>@endif
                                    {{ $announcement->title }}
                                </h3>
                                <div class="announcement-meta">
                                    <span>{{ $announcement->property?->name ?? 'Semua properti' }}</span>
                                    <span>·</span>
                                    <span>{{ $announcement->author ?: 'Admin' }}</span>
                                    <span>·</span>
                                    <span>{{ \App\Support\Format::dateLong($announcement->created_at) }}</span>
                                    @if ($announcement->pinned)
                                        <span class="badge badge-indigo">Disematkan</span>
                                    @endif
                                </div>
                            </div>
                        </div>
                        <p class="announcement-body">{{ $announcement->body }}</p>

                        <div class="request-foot">
                            <details>
                                <summary class="card-link" style="cursor:pointer">Edit pengumuman</summary>
                                <form class="mt-12" method="POST" action="{{ route('announcements.update', $announcement) }}">
                                    @csrf
                                    @method('PATCH')
                                    <label class="form-field">
                                        <span class="form-label">Judul</span>
                                        <input type="text" name="title" value="{{ $announcement->title }}" required maxlength="150">
                                    </label>
                                    <label class="form-field">
                                        <span class="form-label">Isi</span>
                                        <textarea name="body" rows="3" required>{{ $announcement->body }}</textarea>
                                    </label>
                                    <label class="form-field">
                                        <span class="form-label">Properti</span>
                                        <select name="property_id">
                                            <option value="">Semua properti</option>
                                            @foreach ($properties as $property)
                                                <option value="{{ $property->id }}" @selected($announcement->property_id === $property->id)>{{ $property->name }}</option>
                                            @endforeach
                                        </select>
                                    </label>
                                    <button class="btn btn-primary btn-sm" type="submit">Simpan Perubahan</button>
                                </form>
                            </details>

                            <div class="request-actions">
                                <form method="POST" action="{{ route('announcements.pin', $announcement) }}">
                                    @csrf
                                    @method('PATCH')
                                    <button class="btn btn-ghost btn-sm" type="submit">{{ $announcement->pinned ? 'Lepas Sematan' : 'Sematkan' }}</button>
                                </form>
                                <form method="POST" action="{{ route('announcements.destroy', $announcement) }}" data-confirm="Hapus pengumuman “{{ $announcement->title }}”?">
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
                            <div class="empty-icon">📣</div>
                            <p>Belum ada pengumuman</p>
                            <small>Gunakan formulir di samping untuk menerbitkan pengumuman pertama.</small>
                        </div>
                    </div>
                @endforelse
            </div>

            @if ($announcements->hasPages())
                <section class="card">
                    {{ $announcements->links('partials.pagination') }}
                </section>
            @endif
        </div>

        <section class="card">
            <div class="card-head"><h3>Pengumuman Baru</h3></div>
            <div class="card-body">
                @include('partials.form-errors')
                <form method="POST" action="{{ route('announcements.store') }}">
                    @csrf
                    <label class="form-field">
                        <span class="form-label">Judul *</span>
                        <input type="text" name="title" value="{{ old('title') }}" required maxlength="150" placeholder="Contoh: Pemeliharaan air lantai 2">
                        @error('title')<span class="field-error">{{ $message }}</span>@enderror
                    </label>
                    <label class="form-field">
                        <span class="form-label">Isi pengumuman *</span>
                        <textarea name="body" rows="5" required placeholder="Tulis informasi lengkap untuk penyewa…">{{ old('body') }}</textarea>
                        @error('body')<span class="field-error">{{ $message }}</span>@enderror
                    </label>
                    <label class="form-field">
                        <span class="form-label">Properti</span>
                        <select name="property_id">
                            <option value="">Semua properti</option>
                            @foreach ($properties as $property)
                                <option value="{{ $property->id }}" @selected((string) old('property_id') === (string) $property->id)>{{ $property->name }}</option>
                            @endforeach
                        </select>
                        @error('property_id')<span class="field-error">{{ $message }}</span>@enderror
                    </label>
                    <label class="check-line">
                        <input type="checkbox" name="pinned" value="1" @checked(old('pinned'))>
                        Sematkan di bagian atas
                    </label>
                    <button class="btn btn-primary btn-block mt-12" type="submit">Terbitkan Pengumuman</button>
                </form>
            </div>
        </section>
    </div>
@endsection
