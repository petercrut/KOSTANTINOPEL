@php
    $user = auth()->user();
    $parts = preg_split('/\s+/', trim((string) $user?->name)) ?: [];
    $initials = strtoupper(substr($parts[0] ?? 'U', 0, 1) . substr($parts[1] ?? '', 0, 1));
@endphp

<div class="topbar-right">
    <span class="topbar-date">{{ now()->translatedFormat('l, j F Y') }}</span>
    <div class="topbar-user">
        <span class="user-avatar sm">{{ $initials }}</span>
        <div class="user-meta">
            <strong>{{ $user?->name }}</strong>
            <span>{{ $user?->email }}</span>
        </div>
    </div>
    @include('partials.theme-switch')
    <form method="POST" action="{{ route('logout') }}">
        @csrf
        <button type="submit" class="btn btn-ghost btn-sm">Keluar</button>
    </form>
</div>
