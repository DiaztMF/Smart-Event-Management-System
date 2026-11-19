# Dokumentasi API Routes & Routing

File ini menjelaskan semua route (endpoint) yang tersedia dalam aplikasi, bagaimana route didefinisikan, dan maksudnya setiap baris dalam `routes/web.php`. Cocok untuk pemula yang ingin memahami bagaimana aplikasi menerima permintaan dari frontend dan browser.

## Daftar Isi

1. [Bagian Pertama: Bagaimana Route Didefinisikan](#bagian-pertama-bagaimana-route-didefinisikan)
2. [Route Publik (Tanpa Login)](#route-publik-tanpa-login)
3. [Route Butuh Login (Dilindungi Session)](#route-butuh-login-dilindungi-session)
4. [Route Halaman Inertia (SPA)](#route-halaman-inertia-spa)
5. [Route Tambahan dari `settings.php`](#route-tambahan-dari-settingsphp)
6. [Middleware & Proteksi Halaman](#middleware-dan-proteksi-halaman)
7. [Cara Membaca Route di Browser/Postman](#cara-membaca-route-di-browserpostman)

---

## Bagian Pertama: Bagaimana Route Didefinisikan

Semua route didefinisikan di file `routes/web.php`. Berikut adalah struktur awal file:

```php
<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RegistrationController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
// ... lebih banyak route di bawahnya
```

### Penjelasan Komponen

| Komponen | Maksudnya |
|----------|-----------|
| `use App\Http\Controllers\...` | Mengimpor class controller yang menangani logika setiap route |
| `Route::inertia('/', 'welcome')` | Membuat route halaman yang dirender oleh Inertia (React SPA) |
| `->name('home')` | Memberi nama pada route agar bisa dipanggil dengan `route('home')` di kode lain |
| `Route::middleware('web')->group(...)` | Mengelompokkan route yang menggunakan middleware web (session, CSRF, dll.) |

---

## Route Publik (Tanpa Login)

Route berikut bisa diakses oleh siapa pun, tanpa perlu login terlebih dahulu:

| Method | Path | Controller | Route Name | Fungsi |
|--------|------|------------|------------|--------|
| GET | `/` | `Inertia::render('welcome')` | `home` | Halaman depan aplikasi |
| GET | `/login` | `AuthController@create` | `login` | Menampilkan halaman login |
| GET | `/api/categories` | `CategoryController@index` | `categories.index` | Daftar semua kategori event |
| GET | `/api/events` | `EventController@index` | `events.index` | Daftar semua event (dengan sisa quota) |
| GET | `/api/events/{id}` | `EventController@show` | `events.show` | Detail satu event |

### Contoh Penggunaan

Mengakses daftar kategori lewat browser atau Postman:

```
GET http://localhost:8001/api/categories
```

Respons yang diterima:
```json
{
  "status": "success",
  "message": "Daftar kategori event",
  "data": [
    {"id": 1, "name": "Seminar", "created_at": "...", "updated_at": "..."},
    {"id": 2, "name": "Workshop", "created_at": "...", "updated_at": "..."}
  ]
}
```

---

## Route Butuh Login (Dilindungi Session)

Route berikut hanya bisa diakses setelah pengguna login. Jika belum login, akan diarahkan ke halaman login atau mendapatkan respons error 401 (untuk API).

### Autentikasi

| Method | Path | Controller | Route Name | Fungsi |
|--------|------|------------|------------|--------|
| POST | `/login` | `AuthController@store` | `login.store` | Proses login, buat session |
| POST | `/logout` | `AuthController@destroy` | `logout` | Keluar, hancurkan session |
| GET | `/api/profile` | `ProfileController@__invoke` | `profile` | Data profil user yang login |

### Data Master (Kategori & Event)

| Method | Path | Controller | Route Name | Fungsi |
|--------|------|------------|------------|--------|
| POST | `/api/categories` | `CategoryController@store` | `categories.store` | Tambah kategori baru |
| PUT | `/api/categories/{id}` | `CategoryController@update` | `categories.update` | Ubah kategori |
| DELETE | `/api/categories/{id}` | `CategoryController@destroy` | `categories.destroy` | Hapus kategori |
| POST | `/api/events` | `EventController@store` | `events.store` | Tambah event baru |
| PUT | `/api/events/{id}` | `EventController@update` | `events.update` | Ubah event |
| DELETE | `/api/events/{id}` | `EventController@destroy` | `events.destroy` | Soft delete event |
| GET | `/api/events/{id}/export` | `EventController@export` | `events.export` | Ekspor peserta ke CSV |

### Transaksi (Pendaftaran Event)

| Method | Path | Controller | Route Name | Fungsi |
|--------|------|------------|------------|--------|
| POST | `/api/events/{id}/register` | `RegistrationController@store` | `registrations.store` | Daftar ke event |
| GET | `/api/my-registrations` | `RegistrationController@index` | `registrations.index` | Riwayat pendaftaran user |
| PUT | `/api/registrations/{id}/cancel` | `RegistrationController@cancel` | `registrations.cancel` | Batalkan pendaftaran |

---

## Route Halaman Inertia (SPA)

Route berikut dirender oleh Inertia (React SPA), bukan respons JSON biasa. Butuh login dan email sudah diverifikasi:

| Method | Path | Halaman | Route Name | Fungsi |
|--------|------|---------|------------|--------|
| GET | `/dashboard` | `dashboard` | `dashboard` | Daftar event + info quota |
| GET | `/events/create` | `event-form` | `events.create` | Form tambah event |
| GET | `/events/{id}/edit` | `event-form` | `events.edit` | Form ubah event |
| GET | `/my-registrations` | `registrations` | `registrations` | Riwayat pendaftaran |

**Perbedaan penting:** Route Inertia mengembalikan halaman React lengkap (HTML yang dirender di sisi klien), bukan JSON. Frontend menggunakan JavaScript untuk menampilkan konten.

---

## Route Tambahan dari `settings.php`

File `routes/settings.php` dimuat di akhir `web.php` dan berisi route untuk pengaturan pengguna (Fortify bawaan):

| Method | Path | Controller | Route Name | Fungsi |
|--------|------|------------|------------|--------|
| GET | `/settings` | Redirect ke `/settings/profile` | (unnamed) | Alias halaman profil |
| GET | `/settings/profile` | `Settings\ProfileController@edit` | `profile.edit` | Halaman edit profil |
| PATCH | `/settings/profile` | `Settings\ProfileController@update` | `profile.update` | Perbarui profil |
| DELETE | `/settings/profile` | `Settings\ProfileController@destroy` | `profile.destroy` | Hapus akun |
| GET | `/settings/security` | `Settings\SecurityController@edit` | `security.edit` | Halaman keamanan (2FA, passkeys) |
| PUT | `/settings/password` | `Settings\SecurityController@update` | `user-password.update` | Ganti kata sandi |
| GET | `/settings/appearance` | Inertia `settings/appearance` | `appearance.edit` | Pengaturan tampilan |
| GET | `/.well-known/passkey-endpoints` | Closure (JSON) | `well-known.passkeys` | Endpoint passkey untuk browser |

---

## Middleware & Proteksi Halaman

Middleware adalah "penengah" yang memeriksa request sebelum sampai ke controller. Route di grupkan dengan middleware berikut:

### `auth`
Memastikan pengguna sudah login. Jika belum, API akan mengembalikan 401, halaman web akan diarahkan ke `/login`.

Digunakan pada:
- Semua route `/api/*` tulis (POST, PUT, DELETE)
- `POST /logout`, `GET /api/profile`
- Semua route halaman Inertia (`/dashboard`, `/events/*`, `/my-registrations`)

### `verified`
Memastikan email pengguna sudah diverifikasi. Digunakan pada route halaman Inertia.

### `web`
Middleware standar Laravel yang mencakup session, cookie enkripsi, dan CSRF protection. Digunakan pada semua route di `web.php`.

### CSRF Exception
Route berikut dikecualikan dari pemeriksaan CSRF (karena dipanggil via `fetch` dari frontend yang sama):

```php
$middleware->validateCsrfTokens(except: [
    '/login',
    '/logout',
    '/api/*',
]);
```

---

## Cara Membaca Route di Browser/Postman

### Untuk Halaman Web (Inertia)
Buka langsung di browser:
- `http://localhost:8001/login`
- `http://localhost:8001/dashboard` (perlu login)
- `http://localhost:8001/events/create` (perlu login)

### Untuk API JSON
Gunakan Postman, Insomnia, atau `curl`:

**Contoh daftar event:**
```bash
curl http://localhost:8001/api/events
```

**Contoh login (membuat session):**
```bash
curl -X POST http://localhost:8001/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

**Contoh tambah event (butuh login):**
```bash
curl -X POST http://localhost:8001/api/events \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title":"Contoh Event","description":"Test","category_id":1,"event_date":"2026-12-01","quota":10}'
```

Catatan: `-b cookies.txt` mengirim cookie session yang didapat dari login sebelumnya, sehingga backend tahu siapa yang login.