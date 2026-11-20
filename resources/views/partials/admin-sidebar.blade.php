@php
    $user = auth()->user();
    $parts = preg_split('/\s+/', trim((string) $user?->name)) ?: [];
    $initials = strtoupper(substr($parts[0] ?? 'U', 0, 1) . substr($parts[1] ?? '', 0, 1));
@endphp

<aside class="sidebar">
    <div class="sidebar-brand">
        <a class="brand-logo" href="{{ route('dashboard') }}" aria-label="Kostantinopel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 11.5 12 6.5l5.5 5"/><path d="M8.5 10.5V18h7v-7.5"/></svg>
        </a>
        <div>
            <strong>Kostantinopel</strong>
            <small>Manajemen Co-Living</small>
        </div>
        <button class="nav-collapse" id="nav-collapse" title="Kecilkan / besar navbar" aria-label="Kecilkan navbar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17l-5-5 5-5"/><path d="M18 17l-5-5 5-5"/></svg>
        </button>
    </div>

    @include('partials.admin-nav')

    <div class="sidebar-footer">
        <div class="sidebar-user">
            <span class="user-avatar">{{ $initials }}</span>
            <div class="user-meta">
                <strong>{{ $user?->name }}</strong>
                <span>{{ \App\Support\Labels::label('role', $user?->role) }}</span>
            </div>
        </div>
    </div>
</aside>
