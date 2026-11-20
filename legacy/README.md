# 🏠 Kostantinopel — Sistem Manajemen Co-Living

Website + panel login + web aplikasi untuk mengelola **kost, kontrakan, apartemen, dan hotel** dalam satu platform.

Aplikasi ini **statis dan berjalan sepenuhnya di browser** (HTML/CSS/JavaScript murni) — tanpa perlu instalasi, build tool, atau server. Data tersimpan di `localStorage` browser.

> **Tema:** Terinspirasi dari [Sneat — Vuetify Vuejs Admin Template](https://demos.themeselection.com/sneat-vuetify-vuejs-admin-template/demo-1/dashboards/crm) (ThemeSelection) — font *Public Sans*, warna utama `#696CFF`, latar `#F5F5F9`, sidebar vertikal putih 260px yang bisa di-collapse, navbar sticky 64px, dan kartu putih radius 6px. Tersedia **mode terang & gelap** (palet gelap Sneat: latar `#232333`, kartu `#2B2C40`, teks `#E6E6F1`).

---

## 🚀 Cara Menjalankan

**Cara termudah:** klik dua kali file `start.bat`, atau buka `index.html` di browser (Chrome/Edge/Firefox terbaru).

Struktur halaman:

| File | Keterangan |
|---|---|
| `index.html` | Landing page (home) |
| `login.html` | Panel login (admin & penyewa) |
| `register.html` | Registrasi akun admin baru / aktivasi akun penyewa |
| `app.html` | Web aplikasi (dashboard & manajemen) |
| `docs.html` | Dokumentasi API (Swagger UI, statis) |

## 👤 Akun Demo

| Peran | Email | Password |
|---|---|---|
| Admin / pemilik | `admin@kostantinopel.id` | `admin123` |
| Penyewa | `siti@kostantinopel.id` | `siti123` |

Login sebagai **penyewa** akan membuka portal terbatas (Ringkasan, Kamar Saya, Pembayaran, Identitas, Laporan & Permintaan, Pengumuman, Akun). Login sebagai **admin** membuka panel manajemen lengkap.

Data demo otomatis dibuat saat pertama kali aplikasi dibuka (2 properti, 12 kamar, 4 penyewa, booking, 15 tagihan, 3 pengumuman, dan 2 laporan). Basis data lama akan dimigrasikan otomatis tanpa kehilangan data.

## 🔐 Peran & Hak Akses

**Admin / Pemilik Properti**

- Mengelola properti, kamar/unit, penyewa, booking, dan tagihan.
- Menanggapi laporan/permintaan penyewa dan mengubah statusnya.
- Membuat, menyunting, menyematkan, dan menghapus pengumuman.
- Membuat akun login penyewa, mereset password, atau menghapusnya.
- Melihat analitik pendapatan, okupansi, cadangan data, dan reset demo.

**Penyewa**

- Melihat ringkasan portal, detail kamar, fasilitas, dan status sewanya.
- Melihat tagihan pribadi dan mencatat pembayaran (metode & tanggal).
- Melengkapi/memperbarui identitas diri dan kontak darurat.
- Membuat laporan atau permintaan terkait kamar dan memantau tanggapan pengelola.
- Membaca pengumuman dari pengelola (global & properti terkait).
- Mengubah profil, email login, password, dan tema tampilan.

Penyewa **tidak dapat** mengakses properti, kamar, penyewa lain, booking, tagihan penyewa lain, analitik, atau data cadangan. Router aplikasi memfilter menu dan mengalihkan akses ke halaman yang diizinkan.

## ✨ Fitur

- **Dashboard admin** — statistik properti, okupansi kamar, pendapatan bulan ini, tagihan tertunda, grafik pendapatan 6 bulan, aktivitas terbaru.
- **Portal penyewa** — ringkasan tagihan, kamar, laporan aktif, pengumuman terbaru, dan aksi cepat.
- **Navbar mini** — sidebar bisa dikecilkan (ikon saja) seperti Sneat; hover untuk sementara mengembangkannya. Posisi tersimpan otomatis.
- **Properti** — CRUD properti dengan tipe: Kost, Kontrakan, Apartemen, Hotel.
- **Kamar / Unit** — CRUD kamar: nomor, tipe, kapasitas, harga harian & bulanan, fasilitas, status (tersedia/perawatan). Status terisi dihitung otomatis.
- **Penyewa** — data penghuni lengkap (identitas, kontak darurat), tanggal masuk/keluar, kamar yang ditempati (anti kamar ganda huni), akhiri sewa, buat tagihan cepat, dan pengelolaan akun login penyewa.
- **Booking** — reservasi harian/mingguan/bulanan dengan cek ketersediaan kamar otomatis, kalkulasi total realtime, alur status: Menunggu → Terkonfirmasi → Check-in → Check-out / Dibatalkan.
- **Tagihan** — tagihan otomatis dari sewa & booking, pencatatan pembayaran (Tunai/Transfer/QRIS/Kartu Debit), deteksi keterlambatan, tagihan manual.
- **Pembayaran penyewa** — penyewa menandai tagihannya sendiri sebagai dibayar; admin melihat penanda “via penyewa” pada riwayat pembayaran.
- **Laporan & Permintaan** — tiket dari penyewa dengan kategori, prioritas, status, dan tanggapan pengelola.
- **Pengumuman** — broadcast ke semua properti atau properti tertentu, dengan opsi sematkan (pin).
- **Analitik** — rekap pendapatan per periode, per metode, per properti; okupansi; ekspor CSV.
- **Pengaturan / Akun** — profil, ganti password, cadangkan/pulihkan data (JSON, khusus admin), reset data demo (khusus admin), dan pengaturan tema.
- **Mode gelap** — tombol switch terang/gelap di navbar landing, halaman login/daftar, topbar aplikasi, dan menu Pengaturan → Tampilan. Pilihan tersimpan di browser (`localStorage`) dan otomatis mengikuti preferensi sistem bila belum dipilih.

## 📁 Struktur Proyek

```
├── index.html              # Landing page
├── login.html              # Halaman login
├── register.html           # Halaman registrasi
├── app.html                # Shell web aplikasi
├── docs.html               # Dokumentasi API (Swagger UI)
├── openapi/
│   ├── openapi.json        # Spesifikasi OpenAPI 3.0.3 (sumber utama)
│   └── openapi-spec.js     # Salinan tertanam (fallback file://)
├── start.bat               # Pembuka cepat (Windows)
└── assets/
    ├── css/
    │   ├── main.css        # Base, komponen, landing, auth
    │   ├── app.css         # Layout dashboard & komponen app
    │   └── docs.css        # Tampilan halaman dokumentasi API
    ├── vendor/
    │   └── swagger-ui/     # Swagger UI 5.35.0 (di-host lokal, tanpa CDN)
    └── js/
        ├── utils.js        # Helper (format, modal, toast, dsb.)
        ├── theme.js        # Pengendali mode terang/gelap + switch
        ├── db.js           # Lapisan data + logika bisnis
        ├── auth.js         # Login/register/sesi/hash password
        ├── app.js          # Router & shell aplikasi
        └── views/          # Tampilan per modul
            ├── dashboard.js          # Dashboard admin
            ├── tenant-dashboard.js   # Ringkasan portal penyewa
            ├── properties.js
            ├── rooms.js
            ├── tenants.js            # Penyewa + akun login penyewa
            ├── bookings.js
            ├── invoices.js
            ├── my-room.js            # Kamar Saya (penyewa)
            ├── payments.js           # Pembayaran penyewa
            ├── identity.js           # Identitas penyewa
            ├── requests.js           # Laporan & permintaan (admin/penyewa)
            ├── announcements.js      # Pengumuman (admin/penyewa)
            ├── reports.js
            └── settings.js           # Pengaturan admin / Akun penyewa
```

## 🔌 Dokumentasi API (OpenAPI + Swagger UI)

Spesifikasi REST API tersedia statis dan dapat dibaca offline:

- **Halaman dokumentasi:** `docs.html` — Swagger UI dengan tema Sneat, mode gelap, pencarian endpoint, dan statistik jumlah path/operasi/skema. Aset Swagger UI di-host lokal di `assets/vendor/swagger-ui/` sehingga tidak butuh internet.
- **Berkas spesifikasi:** `openapi/openapi.json` (OpenAPI **3.0.3**) — bisa diunduh dari halaman docs atau langsung diimpor ke Postman/Insomnia.
- **Fallback `file://`:** bila dibuka tanpa server, browser memblokir `fetch()` berkas JSON; halaman otomatis memakai salinan tertanam `openapi/openapi-spec.js` dan menampilkan keterangan sumber data.

**Cara membuka:** jalankan `start.bat` (atau `powershell -ExecutionPolicy Bypass -File serve.ps1`), lalu buka <http://localhost:8765/docs.html>.

### Autentikasi

Semua endpoint (kecuali login, register, dan health check) memakai bearer token:

```http
POST /v1/auth/login
Content-Type: application/json

{ "email": "admin@kostantinopel.id", "password": "admin123" }
```

Response berisi `data.token` yang dipakai sebagai header `Authorization: Bearer <token>` (berlaku 7 hari). Token di contoh ini adalah ilustrasi kontrak API — aplikasi demo tetap memakai sesi `localStorage`, bukan token.

### Konvensi response

| Kondisi | Bentuk |
|---|---|
| Objek tunggal | `{ "data": { ... } }` |
| Daftar | `{ "data": [ ... ], "meta": { "page", "perPage", "total", "totalPages" } }` |
| Error | `{ "error": { "code", "message", "details": [ { "field", "message" } ] } }` |

Nominal uang berupa integer Rupiah, tanggal `YYYY-MM-DD`, waktu ISO-8601. Peran endpoint ditandai ekstensi `x-roles` (`admin`, `tenant`).

### Cakupan modul (79 operasi)

| Tag | Endpoint utama |
|---|---|
| Autentikasi | `POST /auth/login`, `/auth/register`, `/auth/logout`, `/auth/change-password`, `GET /auth/me`, `PATCH /auth/profile` |
| Dashboard | `GET /dashboard/stats`, `/dashboard/revenue`, `/dashboard/activity`, `/dashboard/occupancy`, `/dashboard/occupancy/by-property` |
| Properti | `GET/POST /properties`, `GET/PATCH/DELETE /properties/{id}`, `/properties/{id}/rooms`, `/properties/{id}/summary` |
| Kamar | `GET/POST /rooms`, `GET/PATCH/DELETE /rooms/{id}`, `/rooms/{id}/availability`, `/rooms/{id}/tenants` |
| Penyewa | `GET/POST /tenants`, `GET/PATCH/DELETE /tenants/{id}`, `end-tenancy`, `account`, `account/password`, `invoices`, `requests`, `identity` |
| Booking | `GET/POST /bookings`, `POST /bookings/quote`, `GET/PATCH/DELETE /bookings/{id}`, `PATCH /bookings/{id}/status` |
| Tagihan | `GET/POST /invoices`, `GET /invoices/summary`, `GET/PATCH /invoices/{id}`, `POST /invoices/{id}/payment` |
| Laporan & Permintaan | `GET/POST /requests`, `GET/PATCH/DELETE /requests/{id}`, `POST /requests/{id}/response` |
| Pengumuman | `GET/POST /announcements`, `GET/PATCH/DELETE /announcements/{id}`, `PATCH /announcements/{id}/pin` |
| Analitik | `GET /analytics/occupancy`, `/analytics/occupancy/by-property`, `/analytics/revenue`, `/analytics/revenue/export` (CSV) |
| Portal Penyewa | `GET /portal/summary`, `/portal/room`, `/portal/invoices`, `/portal/requests`, `/portal/announcements`, `POST /portal/invoices/{id}/payment`, `/portal/requests`, `PATCH /portal/identity` |
| Sistem | `GET /health`, `/system/info`, `/system/backup`, `POST /system/restore`, `/system/reset` |

> **Catatan:** aplikasi demo tidak menjalankan server HTTP, sehingga tombol **Try it out** di Swagger UI dinonaktifkan. Spesifikasi ini adalah kontrak untuk backend sungguhan; server contoh didefinisikan pada `servers` (`https://api.kostantinopel.id/v1` dan `http://localhost:8765/api/v1`).


## ⚠️ Catatan Keamanan

Ini adalah aplikasi **front-end** untuk keperluan demonstrasi:

- Password di-hash di browser (SHA-256 via Web Crypto API, dengan fallback) — **bukan** pengamanan sisi server.
- Data hanya tersimpan di browser tempat Anda membuka aplikasi (localStorage) dan **hilang jika data browser dihapus**.
- Untuk produksi, sebaiknya hubungkan ke backend/API sungguhan (struktur data di `db.js` sudah dipetakan agar mudah dipindahkan).

---

© 2026 Kostantinopel · Dibuat dengan ❤️ untuk pengelola properti Indonesia.
