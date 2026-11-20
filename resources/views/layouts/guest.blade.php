<!DOCTYPE html>
<html lang="id">
<head>
    @include('partials.head')
</head>
<body class="@yield('body-class', 'landing')">
    @yield('content')

    @include('partials.scripts')
</body>
</html>
