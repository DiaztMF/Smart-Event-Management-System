# Smart Event Management System

Sistem manajemen dan pendaftaran event digital (Smart Event Management System) — aplikasi web untuk mengelola event dan pendaftaran peserta. Dibangun dengan **Laravel 13** (backend), **Inertia v3 + React** (frontend), dan **shadcn-ui**. Aplikasi ini adalah hasil karya untuk Lomba Kompetensi Siswa (LKS) Tingkat Kota Surakarta Tahun 2026, mata lomba Web Technologies.

## Fitur Utama

- **Autentikasi berbasis session** — login, logout, dan halaman profil
- **Manajemen kategori event** — CRUD kategori (Seminar, Workshop, Konferensi, Pelatihan)
- **Manajemen event** — buat, ubah, hapus (soft delete), dan ekspor daftar peserta ke CSV
- **Pendaftaran event** — daftar event, cek sisa quota secara real-time, riwayat pendaftaran, dan batalkan pendaftaran
- **Halaman lindung session** — halaman dashboard, form event, dan riwayat hanya bisa diakses setelah login
- **Frontend modern** — React + Inertia v3 + shadcn-ui, konsumsi API via `fetch`

## Teknologi

|Layer|Teknologi|
|-----|---------|
|Backend|PHP 8.3+, Laravel 13, Fortify, Sanctum|
|Frontend|React 19, Inertia v3, shadcn-ui, Tailwind CSS v4, Lucide React|
|Database|SQLite (development), MySQL/MariaDB (produksi)|
|Build tool|Vite (via vite-plus), npm|
|Pengujian|Pest (PHP), pint (PHP formatter)|

## Persyaratan

- PHP 8.3 atau lebih baru
- Composer
- Node.js dan npm
- SQLite (sudah disertakan, tidak perlu konfigurasi tambahan)

## Instalasi

Clone repositori lalu jalankan perintah berikut:

```bash
# 1. Masuk ke direktori proyek
cd Smart-Event-Management-System

# 2. Install dependensi PHP
composer install

# 3. Install dependensi JavaScript
npm install

# 4. Salin file konfigurasi environment
cp .env.example .env

# 5. Generate application key
php artisan key:generate

# 6. Jalankan migrasi dan seeder
php artisan migrate --seed

# 7. Jalankan server development (dua terminal)
# Terminal A — backend
php artisan serve

# Terminal B — frontend (Vite)
npm run dev
```

Aplikasi akan tersedia di `http://localhost:8000` (backend) dan Vite akan menyediakan asset frontend dengan hot reload.

## Akun Uji

Setelah menjalankan `php artisan migrate --seed`, akun berikut sudah tersedia:

|Email|Sandi|
|-----|-----|
|`test@example.com`|`password`|

## Struktur API

Semua respons API menggunakan format berikut:

**Sukses:**
```json
{
  "status": "success",
  "message": "Operasi berhasil",
  "data": {}
}
```

**Error:**
```json
{
  "status": "error",
  "message": "Terjadi kesalahan",
  "errors": {}
}
```

### Autentikasi

|Method|Endpoint|Deskripsi|
|------|--------|---------|
|`GET`|`/login`|Halaman login (Inertia)|
|`POST`|`/login`|Proses login, buat session|
|`POST`|`/logout`|Keluar dari sesi|
|`GET`|`/api/profile`|Data profil pengguna yang login (dilindungi) |

### Data Master

|Method|Endpoint|Deskripsi|Dilindungi?|
|------|--------|---------|-----------|
|`GET`|`/api/categories`|Daftar kategori event|Tidak|
|`POST`|`/api/categories`|Tambah kategori|Ya|
|`PUT`|`/api/categories/{id}`|Ubah kategori|Ya|
|`DELETE`|`/api/categories/{id}`|Hapus kategori|Ya|
|`GET`|`/api/events`|Daftar event (dengan sisa quota)|Tidak|
|`GET`|`/api/events/{id}`|Detail event|Tidak|
|`POST`|`/api/events`|Tambah event|Ya|
|`PUT`|`/api/events/{id}`|Ubah event|Ya|
|`DELETE`|`/api/events/{id}`|Soft delete event|Ya|
|`GET`|`/api/events/{id}/export`|Ekspor daftar peserta ke CSV|Ya|

### Transaksi (Pendaftaran)

|Method|Endpoint|Deskripsi|Dilindungi?|
|------|--------|---------|-----------|
|`POST`|`/api/events/{id}/register`|Daftar ke event|Ya|
|`GET`|`/api/my-registrations`|Riwayat pendaftaran saya|Ya|
|`PUT`|`/api/registrations/{id}/cancel`|Batalkan pendaftaran|Ya|

Aturan pendaftaran:
- Satu user hanya bisa mendaftar satu kali per event.
- Pendaftaran ditolak jika quota event sudah penuh.
- Status default pendaftaran adalah `"registered"`.

## Struktur Folder

```
resources/js/
├── pages/              # Halaman Inertia (React)
│   ├── auth/           # Halaman autentikasi (login, register, dll.)
│   ├── dashboard.tsx   # Daftar event + info quota
│   ├── event-form.tsx  # Form tambah/edit event
│   ├── registrations.tsx  # Riwayat pendaftaran
│   └── welcome.tsx     # Halaman depan
├── components/ui/      # Komponen shadcn-ui (button, input, card, dll.)
├── lib/
│   └── api.ts          # Helper fetch dengan session cookie
├── layouts/            # Layout Inertia (app, auth, settings)
├── hooks/              # Custom React hooks
├── routes/             # Route helper dari Wayfinder
└── app.tsx             # Entry point Inertia

app/
├── Http/
│   ├── Controllers/    # Controller API dan halaman
│   │   ├── AuthController.php
│   │   ├── CategoryController.php
│   │   ├── EventController.php
│   │   ├── RegistrationController.php
│   │   └── ProfileController.php
│   └── Requests/       # Form Request untuk validasi
│       ├── ApiFormRequest.php
│       ├── LoginRequest.php
│       ├── CategoryStoreRequest.php
│       ├── CategoryUpdateRequest.php
│       ├── EventStoreRequest.php
│       ├── EventUpdateRequest.php
│       └── RegistrationStoreRequest.php
├── Models/             # Eloquent model
│   ├── User.php
│   ├── Event.php
│   ├── EventCategory.php
│   └── Registration.php
└── Providers/
    └── AppServiceProvider.php

database/
├── migrations/         # Tabel users, event_categories, events, registrations
├── seeders/            # Seeder kategori default
└── factories/          # UserFactory

routes/
├── web.php             # Semua route web dan API
└── settings.php        # Route settings (Fortify)
```

## Fitur Bonus (Tugas Pembeda)

Fitur berikut telah diimplementasi untuk mendapatkan nilai tambah:

1. **Filter event berdasarkan kategori** — di halaman dashboard
2. **Sisa quota secara real-time** — dihitung saat daftar dan ditampilkan di kartu event
3. **Pembatasan akses halaman** — halaman dashboard, form event, dan riwayat hanya bisa diakses setelah login
4. **Soft delete event** — event yang dihapus tidak benar-benar terhapus dari database
5. **Export daftar peserta ke CSV** — endpoint `GET /api/events/{id}/export`

## Pengujian

Proyek menggunakan **Pest** untuk pengujian fitur. Jalankan seluruh tes:

```bash
php artisan test
```

Atau jalankan tes tertentu:

```bash
php artisan test --filter=AuthenticationTest
```

Contoh pola pengujian yang digunakan di proyek ini:

```php
// Mengakses endpoint sebagai pengguna yang login
$user = User::factory()->create();
$this->actingAs($user)->get(route('dashboard'))->assertOk();

// Mengirim data formulir
$this->post(route('login'), [
    'email' => 'test@example.com',
    'password' => 'password',
]);

// Memeriksa komponen Inertia
$response->assertInertia(fn ($page) => $page->component('dashboard'));
```

## Format Kode

Proyek menggunakan **Laravel Pint** untuk pemformatan PHP. Jalankan sebelum commit:

```bash
vendor/bin/pint --format agent
```

## Pengembangan

- Route Laravel ditulis di `routes/web.php` dan dapat dilihat dengan `php artisan route:list`.
- Route helper untuk frontend di-generate oleh **Wayfinder** dan tersimpan di `resources/js/routes/`.
- Untuk perubahan frontend yang tidak tampil, jalankan `npm run build` atau pastikan `npm run dev` sedang berjalan.
- Jika terjadi kesalahan "Unable to locate file in Vite manifest", jalankan `npm run build`.

## Panduan Kontribusi

Proyek ini mengikuti pedoman dari [AGENTS.md](AGENTS.md) yang mencakup konvensi kode Laravel, aturan Pint, Pest, dan Inertia. Sebelum mengubah kode, baca file tersebut untuk memahami standar yang digunakan.

## Lisensi

Proyek ini dibuat untuk Lomba Kompetensi Siswa (LKS) Tingkat Kota Surakarta Tahun 2026.