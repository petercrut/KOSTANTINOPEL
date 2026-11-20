@php
    $navItems = [
        ['route' => 'dashboard', 'pattern' => 'dashboard', 'label' => 'Dashboard', 'icon' => 'dashboard'],
        ['route' => 'properties.index', 'pattern' => 'properties.*', 'label' => 'Properti', 'icon' => 'property'],
        ['route' => 'rooms.index', 'pattern' => 'rooms.*', 'label' => 'Kamar', 'icon' => 'room'],
        ['route' => 'tenants.index', 'pattern' => 'tenants.*', 'label' => 'Penyewa', 'icon' => 'tenant'],
        ['route' => 'bookings.index', 'pattern' => 'bookings.*', 'label' => 'Booking', 'icon' => 'booking'],
        ['route' => 'invoices.index', 'pattern' => 'invoices.*', 'label' => 'Tagihan', 'icon' => 'invoice'],
        ['route' => 'requests.index', 'pattern' => 'requests.*', 'label' => 'Laporan Masuk', 'icon' => 'request'],
        ['route' => 'announcements.index', 'pattern' => 'announcements.*', 'label' => 'Pengumuman', 'icon' => 'announcement'],
        ['route' => 'analytics.index', 'pattern' => 'analytics.*', 'label' => 'Laporan & Analitik', 'icon' => 'chart'],
        ['route' => 'settings.index', 'pattern' => 'settings.*', 'label' => 'Pengaturan', 'icon' => 'settings'],
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
