@extends('layouts.guest')

@section('title', 'Sistem Manajemen Co-Living')

@section('content')
    @php($rupiah = $formatted)

    <nav class="nav-bar" id="nav-bar">
        <a class="brand" href="{{ route('home') }}">
            <span class="brand-logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 11.5 12 6.5l5.5 5"/><path d="M8.5 10.5V18h7v-7.5"/></svg>
            </span>
            Kostantinopel
        </a>
        <div class="nav-links">
            <a href="#fitur">Fitur</a>
            <a href="#kamar">Kamar</a>
            <a href="#tipe">Tipe Properti</a>
            <a href="#cara-kerja">Cara Kerja</a>
        </div>
        <div class="nav-actions">
            @include('partials.theme-switch')
            @auth
                <a class="btn btn-primary" href="{{ auth()->user()->isAdmin() ? route('dashboard') : route('portal.dashboard') }}">Buka Panel</a>
            @else
                <a class="btn btn-ghost" href="{{ route('login') }}">Masuk</a>
                <a class="btn btn-primary" href="{{ route('register') }}">Coba Gratis</a>
            @endauth
            <button class="nav-toggle" type="button" aria-label="Menu">☰</button>
        </div>
    </nav>

    <header class="hero" id="top">
        <div class="hero-inner">
            <span class="hero-badge">🏠 Solusi co-living modern untuk pemilik properti</span>
            <h1>Kelola <span class="grad">Kost, Kontrakan, Apartemen &amp; Hotel</span> dalam Satu Platform</h1>
            <p>Kostantinopel membantu Anda mengelola properti, kamar, penyewa, booking, dan pembayaran secara terpusat — rapi, realtime, dan mudah digunakan dari mana saja.</p>
            <div class="hero-cta">
                <a class="btn btn-primary" href="{{ route('register') }}">Mulai Sekarang — Gratis</a>
                <a class="btn btn-ghost-light" href="{{ route('login') }}">Masuk ke Panel</a>
            </div>
            <div class="hero-stats">
                <div class="hero-stat"><strong>{{ $stats['properties'] }}</strong><span>Properti Terdaftar</span></div>
                <div class="hero-stat"><strong>{{ $stats['rooms'] }}</strong><span>Kamar Dikelola</span></div>
                <div class="hero-stat"><strong>{{ $stats['tenants'] }}</strong><span>Penyewa Aktif</span></div>
            </div>
        </div>
    </header>

    <main>
        <section class="section" id="fitur">
            <div class="container">
                <div class="section-head">
                    <span class="eyebrow">Fitur Lengkap</span>
                    <h2>Semua yang Anda butuhkan untuk mengelola properti</h2>
                    <p>Dari pendataan unit hingga laporan keuangan, semua tersedia dalam satu dasbor yang intuitif.</p>
                </div>
                <div class="feature-grid">
                    <div class="feature-card">
                        <span class="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="12" height="18" rx="1.5"/><path d="M16 9h4a1 1 0 0 1 1 1v11M8 7h4M8 11h4M8 15h4M2 21h20"/></svg></span>
                        <h3>Manajemen Properti</h3>
                        <p>Kelola banyak properti — kost, kontrakan, apartemen, dan hotel — dengan alamat, telepon, dan catatan terpusat.</p>
                    </div>
                    <div class="feature-card">
                        <span class="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M2 17h20"/></svg></span>
                        <h3>Kamar &amp; Unit</h3>
                        <p>Atur nomor kamar, tipe, kapasitas, fasilitas, serta harga harian dan bulanan dengan status ketersediaan otomatis.</p>
                    </div>
                    <div class="feature-card">
                        <span class="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="3.5"/><path d="M21 21v-2a4 4 0 0 0-3-3.87M15.5 3.6a3.5 3.5 0 0 1 0 6.8"/></svg></span>
                        <h3>Penyewa &amp; Penghuni</h3>
                        <p>Catat data penyewa, tanggal masuk, kamar yang ditempati, dan riwayat sewa. Cegah kamar ganda huni.</p>
                    </div>
                    <div class="feature-card">
                        <span class="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span>
                        <h3>Booking &amp; Reservasi</h3>
                        <p>Buat reservasi harian, mingguan, atau bulanan dengan cek ketersediaan kamar otomatis dan total biaya realtime.</p>
                    </div>
                    <div class="feature-card">
                        <span class="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7H4a2 2 0 0 1 0-4h14v4"/><path d="M4 7v12a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1"/><circle cx="16.5" cy="14" r="1.3"/></svg></span>
                        <h3>Pembayaran &amp; Tagihan</h3>
                        <p>Tagihan otomatis untuk sewa dan booking, pengingat jatuh tempo, serta pencatatan pembayaran tunai/transfer/QRIS.</p>
                    </div>
                    <div class="feature-card">
                        <span class="feature-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6" rx="0.5"/><rect x="12" y="8" width="3" height="10" rx="0.5"/><rect x="17" y="5" width="3" height="13" rx="0.5"/></svg></span>
                        <h3>Laporan &amp; Analitik</h3>
                        <p>Pantau okupansi, pendapatan bulanan, dan tagihan tertunda. Ekspor laporan kapan saja.</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="section section-alt" id="kamar">
            <div class="container">
                <div class="section-head">
                    <span class="eyebrow">Kamar Tersedia</span>
                    <h2>Unit pilihan dari properti kami</h2>
                    <p>Harga transparan untuk sewa harian maupun bulanan. Hubungi pengelola untuk ketersediaan terbaru.</p>
                </div>

                <div class="room-grid">
                    @forelse ($rooms as $room)
                        <article class="room-card">
                            <div class="room-card-head">
                                <div>
                                    <h3>{{ $room->number }}</h3>
                                    <span>{{ $room->property?->name ?? '-' }} · {{ $room->type }}</span>
                                </div>
                                <span class="badge badge-indigo">{{ $room->capacity }} orang</span>
                            </div>

                            @php($facilities = array_slice($room->facilities ?? [], 0, 3))
                            @if (count($facilities))
                                <div class="facility-chips">
                                    @foreach ($facilities as $facility)
                                        <span class="facility-chip">{{ $facility }}</span>
                                    @endforeach
                                </div>
                            @endif

                            <div class="room-price">
                                <strong>{{ $rupiah($room->price_monthly) }}</strong>
                                <span>/ bulan</span>
                            </div>
                            <div class="text-muted-sm">{{ $rupiah($room->price_daily) }} per malam</div>

                            <a class="btn btn-ghost btn-block mt-8" href="{{ route('login') }}">Tanya Ketersediaan</a>
                        </article>
                    @empty
                        <div class="card">
                            <div class="empty-state">
                                <div class="empty-icon">🚪</div>
                                <p>Belum ada kamar terdaftar</p>
                                <small>Data kamar akan tampil di sini setelah ditambahkan pengelola.</small>
                            </div>
                        </div>
                    @endforelse
                </div>
            </div>
        </section>

        <section class="section" id="tipe">
            <div class="container">
                <div class="section-head">
                    <span class="eyebrow">Satu Platform, Semua Tipe</span>
                    <h2>Dirancang untuk berbagai model co-living</h2>
                    <p>Alur kerja yang fleksibel mengikuti karakteristik bisnis Anda.</p>
                </div>
                <div class="type-grid">
                    <div class="type-card">
                        <span class="type-emoji">🛏️</span>
                        <h3>Kost</h3>
                        <p>Sewa bulanan untuk penghuni tetap dengan pengelolaan kamar harian.</p>
                        <ul><li>Status kamar otomatis</li><li>Tagihan bulanan</li><li>Data penghuni &amp; KTP</li></ul>
                    </div>
                    <div class="type-card">
                        <span class="type-emoji">🏢</span>
                        <h3>Kontrakan</h3>
                        <p>Bangun kontrak jangka panjang untuk penyewa rumah/unit.</p>
                        <ul><li>Periode sewa fleksibel</li><li>Riwayat penyewa</li><li>Catatan khusus unit</li></ul>
                    </div>
                    <div class="type-card">
                        <span class="type-emoji">🏙️</span>
                        <h3>Apartemen</h3>
                        <p>Kelola unit apartemen per lantai dengan fasilitas modern.</p>
                        <ul><li>Tarif harian &amp; bulanan</li><li>Okupansi realtime</li><li>Laporan per gedung</li></ul>
                    </div>
                    <div class="type-card">
                        <span class="type-emoji">🏨</span>
                        <h3>Hotel</h3>
                        <p>Reservasi harian dengan alur check-in dan check-out lengkap.</p>
                        <ul><li>Booking &amp; ketersediaan</li><li>Check-in / check-out</li><li>Invoice per inap</li></ul>
                    </div>
                </div>
            </div>
        </section>

        <section class="section section-alt" id="cara-kerja">
            <div class="container">
                <div class="section-head">
                    <span class="eyebrow">Cara Kerja</span>
                    <h2>Mulai dalam 3 langkah mudah</h2>
                </div>
                <div class="steps">
                    <div class="step">
                        <div class="step-num">1</div>
                        <h3>Daftarkan Properti</h3>
                        <p>Buat akun gratis, lalu tambahkan properti Anda beserta tipe dan alamatnya.</p>
                    </div>
                    <div class="step">
                        <div class="step-num">2</div>
                        <h3>Tambah Kamar &amp; Penyewa</h3>
                        <p>Atur kamar, harga sewa, dan data penyewa atau tamu yang menginap.</p>
                    </div>
                    <div class="step">
                        <div class="step-num">3</div>
                        <h3>Pantau Pendapatan</h3>
                        <p>Lihat okupansi, tagihan, dan pendapatan terkumpul realtime dalam satu dasbor.</p>
                    </div>
                </div>
            </div>
        </section>

        @if ($announcements->isNotEmpty())
            <section class="section">
                <div class="container">
                    <div class="section-head">
                        <span class="eyebrow">Informasi Terbaru</span>
                        <h2>Pengumuman dari pengelola</h2>
                    </div>
                    <div class="grid-2">
                        @foreach ($announcements as $announcement)
                            <article class="announcement-item {{ $announcement->pinned ? 'is-pinned' : '' }}">
                                <div class="request-head">
                                    <div>
                                        <h3>
                                            @if ($announcement->pinned)<span class="pin-flag">📌</span>@endif
                                            {{ $announcement->title }}
                                        </h3>
                                        <div class="announcement-meta">
                                            <span>{{ $announcement->property?->name ?? 'Semua properti' }}</span>
                                            <span>·</span>
                                            <span>{{ \App\Support\Format::dateLong($announcement->created_at) }}</span>
                                        </div>
                                    </div>
                                </div>
                                <p class="announcement-body">{{ \Illuminate\Support\Str::limit($announcement->body, 180) }}</p>
                            </article>
                        @endforeach
                    </div>
                </div>
            </section>
        @endif

        <section class="section section-alt" id="paket">
            <div class="container">
                <div class="section-head">
                    <span class="eyebrow">Paket Harga</span>
                    <h2>Pilih paket yang sesuai kebutuhan</h2>
                    <p>Mulai gratis, tingkatkan kapan pun Anda siap.</p>
                </div>
                <div class="pricing-grid">
                    <div class="price-card">
                        <h3>Starter</h3>
                        <p class="price-sub">Untuk pemilik kost kecil</p>
                        <div class="price-value"><strong>Rp 0</strong><span> / selamanya</span></div>
                        <ul>
                            <li>1 properti · 20 kamar</li>
                            <li>Manajemen penyewa</li>
                            <li>Tagihan manual</li>
                            <li>Dasbor dasar</li>
                        </ul>
                        <a class="btn btn-ghost btn-block" href="{{ route('register') }}">Mulai Gratis</a>
                    </div>
                    <div class="price-card featured">
                        <span class="price-tag">PALING POPULER</span>
                        <h3>Professional</h3>
                        <p class="price-sub">Untuk bisnis co-living berkembang</p>
                        <div class="price-value"><strong>Rp 99.000</strong><span> / bulan</span></div>
                        <ul>
                            <li>5 properti · kamar tanpa batas</li>
                            <li>Booking &amp; check-in/out</li>
                            <li>Tagihan otomatis &amp; pengingat</li>
                            <li>Laporan &amp; analitik</li>
                            <li>Dukungan prioritas</li>
                        </ul>
                        <a class="btn btn-primary btn-block" href="{{ route('register') }}">Pilih Professional</a>
                    </div>
                    <div class="price-card">
                        <h3>Enterprise</h3>
                        <p class="price-sub">Untuk grup properti &amp; hotel</p>
                        <div class="price-value"><strong>Rp 299.000</strong><span> / bulan</span></div>
                        <ul>
                            <li>Properti tanpa batas</li>
                            <li>Multi-pengguna &amp; peran</li>
                            <li>Integrasi pembayaran</li>
                            <li>API &amp; pelatihan tim</li>
                            <li>Manajer akun khusus</li>
                        </ul>
                        <a class="btn btn-ghost btn-block" href="{{ route('register') }}">Hubungi Kami</a>
                    </div>
                </div>
            </div>
        </section>

        <section class="cta-section">
            <div class="cta-inner container">
                <h2>Siap merapikan pengelolaan properti Anda?</h2>
                <p>Coba gratis sekarang — tanpa kartu kredit, tanpa instalasi.</p>
                <a class="btn btn-primary" href="{{ route('register') }}" style="padding:14px 28px;font-size:15px">Buat Akun Gratis</a>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div>© {{ now()->year }} Kostantinopel · Sistem Manajemen Co-Living</div>
        <div class="footer-links">
            <a href="#fitur">Fitur</a>
            <a href="#paket">Paket</a>
            <a href="{{ route('client') }}">API Client</a>
            <a href="{{ route('docs') }}">Dokumentasi API</a>
            <a href="{{ route('login') }}">Masuk</a>
            <a href="{{ route('register') }}">Daftar</a>
        </div>
    </footer>
@endsection
