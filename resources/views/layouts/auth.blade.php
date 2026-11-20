<!DOCTYPE html>
<html lang="id">
<head>
    @include('partials.head')
</head>
<body class="auth-body">
    <div class="auth-theme">
        @include('partials.theme-switch')
    </div>

    @include('partials.flash')

    @yield('content')

    @include('partials.scripts')
</body>
</html>
