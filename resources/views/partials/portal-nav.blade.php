@php
    $navItems = [
        ['route' => 'portal.dashboard', 'pattern' => 'portal.dashboard', 'label' => 'Dashboard', 'icon' => 'dashboard'],
        ['route' => 'portal.invoices', 'pattern' => 'portal.invoices*', 'label' => 'Tagihan Saya', 'icon' => 'invoice'],
        ['route' => 'portal.requests', 'pattern' => 'portal.requests*', 'label' => 'Laporan & Kendala', 'icon' => 'request'],
        ['route' => 'portal.announcements', 'pattern' => 'portal.announcements*', 'label' => 'Pengumuman', 'icon' => 'announcement'],
        ['route' => 'portal.profile', 'pattern' => 'portal.profile*', 'label' => 'Profil & Data Diri', 'icon' => 'tenant'],
    ];
@endphp

<nav class="nav" id="nav">
    @foreach ($navItems as $item)
        <a class="nav-item {{ request()->routeIs($item['pattern']) ? 'active' : '' }}" href="{{ route($item['route']) }}">
            <span class="nav-icon">@include('partials.icon', ['name' => $item['icon']])</span>
            <span class="nav-label">{{ $item['label'] }}</span>
        </a>
    @endforeach
</nav>
