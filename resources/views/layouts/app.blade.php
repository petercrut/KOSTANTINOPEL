<!DOCTYPE html>
<html lang="id">
<head>
    @include('partials.head')
</head>
<body class="app-body">
    @include('partials.admin-sidebar')

    <div class="main">
        <header class="topbar">
            <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Menu">☰</button>
            <h1>@yield('title', 'Dashboard')</h1>
            @include('partials.topbar-right')
        </header>
        <main class="view">
            @include('partials.flash')
            @yield('content')
        </main>
    </div>

    @include('partials.scripts')
</body>
</html>
