<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script>
  (function () {
    try {
      var m = localStorage.getItem('kol-theme');
      if (m !== 'dark' && m !== 'light') {
        m = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', m);
      document.documentElement.style.colorScheme = m;
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  })();
</script>
<title>@yield('title', 'Dashboard') — {{ config('app.name') }}</title>
<meta name="description" content="Panel manajemen co-living: properti, kamar, penyewa, booking, tagihan, dan laporan.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%234F46E5'/%3E%3Cpath d='M6.5 11.5 12 6.5l5.5 5M8.5 10.5V18h7v-7.5' stroke='white' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{ asset('assets/css/main.css') }}">
<link rel="stylesheet" href="{{ asset('assets/css/app.css') }}">
<link rel="stylesheet" href="{{ asset('assets/css/ui.css') }}">
@stack('styles')
