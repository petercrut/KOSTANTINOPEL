@extends('layouts.portal')

@section('title', 'Pengumuman')

@section('content')
    <div class="page-head">
        <div>
            <h2>Pengumuman</h2>
            <p class="page-sub">Informasi terbaru dari pengelola properti Anda.</p>
        </div>
    </div>

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
            </article>
        @empty
            <div class="card">
                <div class="empty-state">
                    <div class="empty-icon">📣</div>
                    <p>Belum ada pengumuman</p>
                    <small>Pengumuman dari pengelola akan tampil di sini.</small>
                </div>
            </div>
        @endforelse
    </div>
@endsection
