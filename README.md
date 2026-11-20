# Kostantinopel

Sistem manajemen co-living untuk kost, kontrakan, apartemen, dan hotel. Aplikasi ini dibangun ulang sebagai proyek **Laravel 12** lengkap: panel web (Blade) untuk admin dan penyewa, REST API di `/api/v1`, serta dokumentasi OpenAPI interaktif.

> Aplikasi statis versi lama (HTML/CSS/JS + localStorage) diarsipkan di folder [`legacy/`](legacy/) dan tidak dipakai lagi oleh aplikasi utama.

---

## Teknologi

| Lapisan | Teknologi |
| --- | --- |
| Framework | Laravel 12 (PHP 8.4) |
| Basis data | SQLite (default) |
| Autentikasi web | Sesi Laravel |
| Autentikasi API | Laravel Sanctum (Bearer token) |
| Tampilan | Blade + CSS/JS Sneat theme (tanpa Vite/npm) |
| Dokumentasi API | Swagger UI + `public/openapi/openapi.json` (OpenAPI 3.0.3) |
| Pengujian | PHPUnit / `php artisan test` |

---

## Menjalankan Aplikasi

Prasyarat: PHP 8.2+ dengan ekstensi `pdo_sqlite`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `fileinfo`, dan Composer.

```bash
# 1. Dependensi
composer install

# 2. Konfigurasi lingkungan
copy .env.example .env          # Windows
php artisan key:generate

# 3. Basis data + data demo
#    (buat berkas SQLite lebih dulu bila belum ada)
php -r "file_exists('database/database.sqlite') || touch('database/database.sqlite');"
php artisan migrate:fresh --seed

# 4. Jalankan server
php artisan serve
```

Alternatif sekali jalan: `composer setup` (menyalin `.env`, membuat key, membuat SQLite, migrasi, dan seeding).

Buka <http://127.0.0.1:8000>.

Web client CRUD terpisah tersedia di <http://127.0.0.1:8000/client>.

Jika memakai PHP/Composer portable yang disertakan di repo ini (Windows PowerShell):

```powershell
.\.tools\php\php.exe artisan migrate:fresh --seed
.\.tools\php\php.exe artisan serve
```

### Akun Demo

| Peran | Email | Password |
| --- | --- | --- |
| Admin / pemilik | `admin@kostantinopel.id` | `admin123` |
| Penyewa | `siti@kostantinopel.id` | `siti123` |

Data demo mencakup 2 properti, 12 kamar, 4 penyewa, 3 booking, 14 tagihan, 2 laporan, dan 3 pengumuman.

---

## Fitur

### Panel Admin

- **Dashboard** — ringkasan okupansi, pendapatan bulan ini, tagihan tertunda, aktivitas terbaru.
- **Properti** — CRUD properti (kost, kontrakan, apartemen, hotel) beserta ringkasan kamar.
- **Kamar** — CRUD kamar, fasilitas, harga harian/bulanan, status efektif (maintenance → terisi → tersedia).
- **Penyewa** — CRUD penyewa, data identitas, akun portal, akhir masa sewa.
- **Booking** — reservasi harian/mingguan/bulanan dengan cek ketersediaan dan kalkulasi tarif realtime.
- **Tagihan** — pembuatan tagihan, ringkasan piutang, pencatatan pembayaran (Tunai, Transfer, QRIS, Kartu Debit).
- **Laporan masuk** — kelola keluhan/permintaan perbaikan dari penyewa.
- **Pengumuman** — publikasi dan sematkan pengumuman per properti.
- **Analitik** — okupansi dan pendapatan per properti/bulan, ekspor CSV.
- **Pengaturan** — informasi aplikasi, backup/restore JSON, reset data demo.

### Portal Penyewa

- Dashboard hunian, tagihan, dan laporan.
- Daftar & pembayaran tagihan (konfirmasi mandiri).
- Kirim laporan/kendala ke pengelola.
- Lihat pengumuman properti.
- Perbarui data diri, akun, dan password.

### Lainnya

- Tema terang/gelap dengan preferensi tersimpan di `localStorage`.
- Halaman landing dinamis dan halaman dokumentasi API.
- Halaman error 403/404/419/429/500/503 bergaya aplikasi.

---

## Web Client CRUD (API Client)

Aplikasi terpisah untuk operasi CRUD yang seluruhnya memakai REST API `/api/v1` — tanpa render Blade dan tanpa build step (vanilla JS ES modules).

- URL: `/client` (disajikan Laravel dari `public/client/`, same-origin sehingga tidak perlu CORS)
- Login memakai `POST /auth/login`; token Sanctum disimpan di `localStorage` dan dikirim sebagai `Authorization: Bearer`.
- Halaman: Dashboard, Properti, Kamar, Penyewa, Booking, Tagihan, Laporan, Pengumuman, dan **API Explorer**.
- Setiap permintaan tercatat di drawer **log API** (metode, status, durasi, body request/response).
- Tema terang/gelap, router berbasis hash (`#/bookings`), dan form validasi yang menampilkan detail error API.
- Akun demo: `admin@kostantinopel.id` / `admin123`. Akun penyewa tidak dapat memakai client admin.

Struktur:

```
public/client/
  index.html             Shell SPA
  assets/client.css      Design system terang/gelap
  js/api.js              Klien fetch + sesi + log
  js/ui.js               Ikon, format, tabel, modal, toast
  js/app.js              Router, shell, login, log drawer
  js/views/*.js          Satu modul per resource + explorer
```

Rute Laravel `/client/{path?}` menyajikan berkas dari `public/client` dengan proteksi path traversal (diuji di `tests/Feature/WebClientTest.php`).

---

## REST API

- Base URL: `/api/v1` — membuka alamat ini mengembalikan informasi API (versi, tautan docs, health, login).
- Slash ganda seperti `//api/v1/health` otomatis dialihkan ke `/api/v1/health` (HTTP 308).
- Dokumentasi interaktif: `/docs`
- Spesifikasi mentah: `/openapi.json` (OpenAPI 3.0.3, 57 path, 79 operasi)

### Autentikasi

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "admin@kostantinopel.id", "password": "admin123" }
```

Response berisi `token`. Sertakan pada request berikutnya:

```http
Authorization: Bearer <token>
```

### Konvensi Response

- Objek tunggal: `{ "data": { ... } }`
- Daftar: `{ "data": [ ... ], "meta": { "page", "perPage", "total", "totalPages" } }`
- Error: `{ "error": { "code", "message", "details": [{ "field", "message" }] } }`
- Nominal uang berupa integer Rupiah; ID dikirim sebagai string; field memakai camelCase.

### Query Daftar

`page` (default 1), `perPage` (1–100, default 20), `search`, `sort` (contoh `-createdAt` untuk menurun).

### Kode Error

| Status | Kode |
| --- | --- |
| 400 | `VALIDATION_ERROR` |
| 401 | `UNAUTHORIZED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` |
| 500 | `SERVER_ERROR` |

---

## Aturan Bisnis Utama

- Status booking yang menempati kamar: `pending`, `confirmed`, `checkin`.
- Status efektif kamar: `maintenance` lebih dulu, lalu terisi bila ada penyewa aktif atau booking yang tumpang tindih hari ini, selain itu `available`.
- Tarif harian: `hari × price_daily`.
- Tarif mingguan: `ceil(hari / 7) × price_daily × 7 × 0.9`.
- Tarif bulanan: `ceil(hari / 30) × price_monthly`.
- Status efektif tagihan: `paid`, atau `late` bila `due_date` sudah lewat.
- Kode otomatis: `INV-0001`, `BK-0001`, `REQ-0001`.

---

## Struktur Proyek

```
app/
  Exceptions/            BusinessRuleException
  Http/Controllers/Api/  Kontroler REST API
  Http/Controllers/Web/  Kontroler panel web
  Http/Resources/        Resource API (camelCase)
  Models/                User, Property, Room, Tenant, Booking, Invoice,
                         MaintenanceRequest, Announcement
  Services/              Occupancy, Booking, Invoice, Tenant, Backup
  Support/               Labels, Format, Codes
database/
  migrations/            Skema tabel
  seeders/               DemoDataSeeder
resources/views/
  admin/                 Halaman panel admin
  portal/                Halaman portal penyewa
  auth/                  Login & daftar
  layouts/ partials/ components/ errors/
routes/
  web.php                Rute panel, portal, landing, docs
  api.php                Rute REST API /api/v1
public/
  assets/                CSS/JS tema, ui.css, ui.js, Swagger UI
  client/                Web client CRUD terpisah (vanilla JS, tanpa build)
  openapi/openapi.json   Kontrak API
legacy/                  Aplikasi statis versi lama (arsip)
tests/Feature/           Pengujian API, web, dan landing
```

---

## Pengujian

```bash
php artisan test
```

Test menggunakan SQLite in-memory, menjalankan migrasi dan seeder demo, lalu memeriksa:

- kontrak response API (envelope, validasi, 401/403/404/409),
- perhitungan tarif booking harian/mingguan/bulanan,
- akses peran admin vs penyewa,
- render halaman landing, dokumentasi, dan seluruh halaman panel/portal.

---

## Catatan

- Aset frontend disajikan langsung dari `public/assets`; tidak ada build npm/Vite.
- Backup dan restore memakai JSON yang dihasilkan `BackupService`.
- Jangan gunakan kredensial demo di produksi. Setel `APP_ENV=production`, `APP_DEBUG=false`, dan `APP_KEY` yang baru sebelum deploy.
