# Panduan Pembelajaran Repositori Smart Event Management System

Dokumentasi ini dibuat untuk membantu orang lain memahami setiap baris kode dalam repositori ini tanpa harus mencari-cari melalui commit history. Setiap file dijelaskan secara mendalam: maksudnya, fungsinya, dan bagaimana setiap bagian bekerja.

## Daftar Isi

1. [Ringkasan Arsitektur](#ringkasan-arsitektur)
2. [Database & Model](#database--model)
3. [API Routes & Routing](#api-routes--routing)
4. [Controllers (Logika Bisnis)](#controllers-logika-bisnis)
5. [Form Request (Validasi)](#form-request-validasi)
6. [Frontend (Halaman React + Inertia)](#frontend-halaman-react--inertia)
7. [Alur Autentikasi](#alur-autentikasi)
8. [Referensi API Lengkap](#referensi-api-lengkap)
9. [Cara Belajar dari Repositori Ini](#cara-belajar-dari-repositori-ini)

---

## Ringkasan Arsitektur

Aplikasi ini menggunakan **Laravel 13** sebagai backend dan **Inertia v3 + React** sebagai frontend. Pertukaran data antara frontend dan backend menggunakan **RESTful API** dengan format respons JSON yang konsisten. Autentikasi menggunakan **session-based authentication** (bukan token-based seperti JWT).

| Komponen | Teknologi | Tujuan |
|----------|-----------|--------|
| Backend | PHP 8.3+, Laravel 13 | Logika server, database, autentikasi |
| Frontend | React 19, Inertia v3 | Antarmuka pengguna, halaman SPA |
| UI Library | shadcn-ui, Tailwind CSS v4 | Komponen antarmuka yang rapi |
| Database | SQLite (dev), MySQL/MariaDB (prod) | Penyimpanan data |
| Autentikasi | Laravel Fortify + Session | Login, logout, proteksi halaman |
| Build Tool | Vite (via vite-plus), npm | Pengelolaan asset frontend |

---

## Database & Model

Semua file database berada di folder `database/` dan `app/Models/`.

### Tabel yang Dibuat

Ada 4 tabel inti sesuai spesifikasi soal:

| Tabel | Tujuan | Hubungan |
|-------|--------|----------|
| `users` | Data pengguna yang login | Satu user bisa punya banyak registrasi |
| `event_categories` | Kategori event (Seminar, Workshop, dll.) | Satu kategori bisa punya banyak event |
| `events` | Data event yang dibuat penyelenggara | Satu event milik satu kategori, punya banyak registrasi |
| `registrations` | Data pendaftaran user ke event | Menghubungkan user dengan event |

### File Migration (di `database/migrations/`)

Setiap file migration adalah instruksi PHP untuk membuat atau mengubah struktur tabel di database. File-file yang ada:

1. **`0001_01_01_000000_create_users_table.php`** — Membuat tabel `users` dengan kolom `id`, `name`, `email`, `password`, dan timestamps. Juga membuat tabel `password_reset_tokens` dan `sessions` (keperluan Laravel bawaan).
2. **`2026_11_17_043029_create_event_categories_table.php`** — Membuat tabel `event_categories` dengan kolom `id`, `name` (unique), dan timestamps.
3. **`2026_11_17_043107_create_events_table.php`** — Membuat tabel `events` dengan kolom `id`, `title`, `description`, `category_id` (foreign key ke `event_categories`), `event_date`, `quota`, dan timestamps.
4. **`2026_11_17_043511_create_registrations_table.php`** — Membuat tabel `registrations` dengan kolom `id`, `user_id` (FK ke `users`), `event_id` (FK ke `events`), `status` (ENUM: registered/attended/canceled), dan timestamps.
5. **`2026_11_18_064220_add_soft_deletes_to_events_table.php`** — Menambahkan kolom `deleted_at` ke tabel `events` untuk soft delete (fitur bonus).

### File Model (di `app/Models/`)

Model adalah representasi PHP dari tabel database. Setiap model menentukan relasi antar tabel:

- **`User.php`** — Model pengguna. Relasi: `hasMany(Registration)` (satu user bisa punya banyak pendaftaran) dan `belongsToMany(Event)` melalui tabel `registrations`. Menggunakan trait `HasApiTokens` untuk dukungan Sanctum (walaupun saat ini pakai session).
- **`Event.php`** — Model event. Relasi: `belongsTo(EventCategory)` (satu event milik satu kategori), `hasMany(Registration)` (satu event punya banyak pendaftaran), `belongsToMany(User)` melalui `registrations`. Menggunakan trait `SoftDeletes` untuk soft delete.
- **`EventCategory.php`** — Model kategori. Relasi: `hasMany(Event)` (satu kategori punya banyak event).
- **`Registration.php`** — Model pendaftaran. Relasi: `belongsTo(User)` dan `belongsTo(Event)`.

---

## API Routes & Routing

Semua route didefinisikan di `routes/web.php`. Route dibagi menjadi beberapa kelompok:

### Route Publik (tidak perlu login)

| Method | Path | Fungsi |
|--------|------|--------|
| GET | `/` | Halaman depan (welcome) |
| GET | `/login` | Halaman login |
| GET | `/api/categories` | Daftar semua kategori event |
| GET | `/api/events` | Daftar semua event (dengan sisa quota) |
| GET | `/api/events/{id}` | Detail satu event |

### Route Butuh Login (middleware `auth`)

| Method | Path | Fungsi |
|--------|------|--------|
| POST | `/login` | Proses login (membuat session) |
| POST | `/logout` | Keluar (menghancurkan session) |
| GET | `/api/profile` | Data profil user yang sedang login |
| POST | `/api/categories` | Tambah kategori baru |
| PUT | `/api/categories/{id}` | Ubah kategori |
| DELETE | `/api/categories/{id}` | Hapus kategori |
| POST | `/api/events` | Tambah event baru |
| PUT | `/api/events/{id}` | Ubah event |
| DELETE | `/api/events/{id}` | Soft delete event |
| GET | `/api/events/{id}/export` | Ekspor peserta event ke CSV |
| POST | `/api/events/{id}/register` | Daftar ke event |
| GET | `/api/my-registrations` | Riwayat pendaftaran user |
| PUT | `/api/registrations/{id}/cancel` | Batalkan pendaftaran |

### Route Halaman Inertia (butuh login + verified)

| Method | Path | Halaman |
|--------|------|---------|
| GET | `/dashboard` | Dashboard (daftar event + quota) |
| GET | `/events/create` | Form tambah event |
| GET | `/events/{id}/edit` | Form ubah event |
| GET | `/my-registrations` | Riwayat pendaftaran |

Middleware `auth` memastikan hanya user yang sudah login yang bisa mengakses route tersebut. Jika belum login, akan diarahkan ke halaman login.

---

## Controllers (Logika Bisnis)

Controllers berada di `app/Http/Controllers/` dan menangani logika setiap endpoint.

### `AuthController.php`

Tangani autentikasi pengguna:

- **`create()`** — Menampilkan halaman login via Inertia (`Inertia::render('auth/login')`).
- **`store(LoginRequest $request)`** — Mencoba login dengan `Auth::attempt(email, password)`. Jika berhasil, session diregenerate dan dialihkan ke `/dashboard`. Jika gagal, kembali ke halaman login dengan pesan error.
- **`destroy(Request $request)`** — Melakukan logout: `Auth::logout()`, invalidate session, regenerate token, lalu kembali ke halaman depan.

### `CategoryController.php`

Tangani CRUD kategori event:

- **`index()`** — Mengembalikan semua kategori dalam format JSON.
- **`store(CategoryStoreRequest $request)`** — Membuat kategori baru dengan `EventCategory::create()`. Validasi sudah ditangani oleh Form Request.
- **`update(CategoryUpdateRequest $request, $id)`** — Mencari kategori berdasarkan ID, lalu memperbarui namanya. Jika tidak ditemukan, mengembalikan error 404.
- **`destroy($id)`** — Mencari kategori dan menghapusnya. Jika tidak ditemukan, mengembalikan error 404.

### `EventController.php`

Tangani CRUD event dan ekspor CSV:

- **`index(Request $request)`** — Mengambil semua event yang belum dihapus (`whereNull('deleted_at')`), dengan relasi kategori. Menghitung `remaining_quota` (kuota dikurangi jumlah pendaftaran yang masih "registered"). Mendukung filter berdasarkan `category_id` melalui query parameter.
- **`store(EventStoreRequest $request)`** — Membuat event baru. Validasi memastikan `category_id` valid dan `quota` minimal 1.
- **`show($id)`** — Mengambil detail satu event beserta kategorinya.
- **`update(EventUpdateRequest $request, $id)`** — Memperbarui data event. Validasi sama dengan store.
- **`destroy($id)`** — Melakukan soft delete event (`$event->delete()` yang hanya mengisi `deleted_at`).
- **`export($id)`** — Mengekspor semua pendaftaran event ke file CSV dengan kolom: No, Nama, Email, Status, Tanggal Daftar.

### `RegistrationController.php`

Tangani pendaftaran event:

- **`store(RegistrationStoreRequest $request, $id)`** — Membuat pendaftaran baru. Sebelum membuat, memeriksa apakah user sudah mendaftar event yang sama dan apakah quota masih tersedia. Jika quota penuh atau sudah terdaftar, validasi akan menolak.
- **`index()`** — Mengambil semua pendaftaran milik user yang login, dengan relasi event dan kategori, diurutkan dari terbaru.
- **`cancel($id)`** — Mencari pendaftaran milik user yang login dan mengubah statusnya menjadi `canceled`.

### `ProfileController.php`

- **`__invoke(Request $request)`** — Mengembalikan data user yang sedang login dalam format JSON. Digunakan untuk endpoint `GET /api/profile`.

---

## Form Request (Validasi)

Semua validasi input dipindahkan ke Form Request di `app/Http/Requests/` agar controller tetap bersih.

### `ApiFormRequest.php` (Base Class)

Ini adalah class induk untuk semua Form Request. Fitur utamanya adalah method `failedValidation()` yang di-override:

- Jika request berupa JSON (API), mengembalikan respons error dengan format: `{ status: "error", message: "Validasi gagal", errors: { ... } }` dengan HTTP 422.
- Jika request berupa web form (Inertia), mengembalikan redirect kembali ke halaman sebelumnya dengan error dan input lama.

### Form Request Lainnya

| File | Validasi yang Dilakukan |
|------|------------------------|
| `LoginRequest.php` | email (required, email format), password (required) |
| `CategoryStoreRequest.php` | name (required, string, max 255, unique di event_categories) |
| `CategoryUpdateRequest.php` | Sama dengan store, tapi unique diabaikan untuk ID sendiri |
| `EventStoreRequest.php` | title, description, category_id (harus ada di event_categories), event_date (date), quota (integer, minimal 1) |
| `EventUpdateRequest.php` | Sama dengan store |
| `RegistrationStoreRequest.php` | Validasi bisnis: event harus ditemukan, user belum terdaftar, quota belum penuh (digunakan `withValidator` untuk cek di database) |

---

## Frontend (Halaman React + Inertia)

Semua halaman frontend berada di `resources/js/pages/` dan menggunakan TypeScript, React, dan komponen shadcn-ui. Data diambil dari API menggunakan `fetch` melalui helper di `resources/js/lib/api.ts`.

### `resources/js/lib/api.ts`

Helper untuk melakukan permintaan HTTP ke API:

- **`apiRequest(input, init)`** — Melakukan `fetch` dengan `credentials: 'include'` agar cookie session ikut terkirim, serta header `Accept: application/json` dan `Content-Type: application/json`.
- **`apiJson(input, init)`** — Wrapper di atas `apiRequest` yang otomatis menguraikan respons JSON. Jika respons tidak OK (status 4xx/5xx), akan melempar error dengan pesan dari respons.

### `resources/js/pages/auth/login.tsx`

Halaman login. Pengguna memasukkan email dan kata sandi, lalu dikirim ke `POST /login` via `apiJson`. Jika berhasil, dialihkan ke `/dashboard`. Jika gagal, menampilkan pesan error.

### `resources/js/pages/dashboard.tsx`

Halaman utama setelah login. Menampilkan:

- Daftar event dalam bentuk card (judul, deskripsi, tanggal, kuota tersisa)
- Kartu statistik: total event dan sisa kuota total
- Filter kategori (dropdown)
- Tombol "Daftar" untuk mendaftar ke event (dinonaktifkan jika quota penuh)

Data diambil dari `GET /api/categories` dan `GET /api/events` via `apiJson`.

### `resources/js/pages/event-form.tsx`

Halaman untuk membuat atau mengubah event. Terdapat formulir dengan input: judul, kategori, deskripsi, tanggal event, dan kuota. Data dikirim ke `POST /api/events` (buat baru) atau `PUT /api/events/{id}` (ubah).

### `resources/js/pages/registrations.tsx`

Halaman riwayat pendaftaran. Menampilkan semua event yang telah didaftarkan user dengan statusnya (registered, attended, canceled). Ada tombol "Batalkan" untuk pendaftaran yang masih status `registered`.

### `resources/js/components/app-sidebar.tsx`

Sidebar navigasi yang menampilkan tautan ke: Dashboard, Buat Event, dan Riwayat Pendaftaran.

### `resources/js/lib/api.ts`

Helper `fetch` yang mencakup cookie session (`credentials: 'include'`) sehingga autentikasi session tetap berfungsi saat memanggil API dari frontend.

---

## Alur Autentikasi

1. Pengunjung membuka `/login`
2. Pengguna memasukkan email dan kata sandi
3. Frontend mengirim `POST /login` dengan data email dan password
4. Backend memverifikasi kredensial dengan `Auth::attempt()`
5. Jika cocok, session dibuat dan user dialihkan ke `/dashboard`
6. Untuk setiap request API berikutnya, cookie session dikirim otomatis oleh browser
7. Backend memeriksa apakah user sudah login melalui middleware `auth`
8. Jika belum login, request API akan ditolak dengan status 401
9. `POST /logout` menghancurkan session dan mengarahkan pengguna kembali ke halaman depan

---

## Referensi API Lengkap

Format respons konsisten untuk semua endpoint API:

**Sukses:**
```json
{
  "status": "success",
  "message": "Deskripsi berhasil",
  "data": { ... }
}
```

**Error validasi:**
```json
{
  "status": "error",
  "message": "Validasi gagal",
  "errors": {
    "email": ["Email wajib diisi"],
    "password": ["Kata sandi wajib diisi"]
  }
}
```

**Error 404/401/409:**
```json
{
  "status": "error",
  "message": "Deskripsi error"
}
```

---

## Cara Belajar dari Repositori Ini

Jika Anda baru membuka repositori ini, berikut adalah urutan yang disarankan untuk memahami kode:

1. **Baca `routes/web.php` terlebih dahulu** — Ini adalah peta seluruh endpoint yang tersedia di aplikasi.
2. **Baca `app/Http/Controllers/`** — Lihat bagaimana setiap endpoint memproses request dan mengembalikan response.
3. **Baca `app/Http/Requests/`** — Pahami bagaimana validasi input dilakukan sebelum data diproses controller.
4. **Baca `app/Models/`** — Pahami struktur data dan relasi antar tabel.
5. **Baca `database/migrations/`** — Lihat bagaimana tabel database dibuat dan kolom apa saja yang ada.
6. **Baca `resources/js/pages/` dan `resources/js/lib/api.ts`** — Pahami bagaimana frontend memanggil API dan menampilkan data.
7. **Jalankan aplikasi** dengan `php artisan migrate --seed` lalu `php artisan serve` dan `npm run dev`, kemudian coba fitur secara langsung melalui browser.

Setiap file di repositori ini telah ditulis dengan nama variabel dan method yang deskriptif sehingga Anda dapat menebak fungsinya hanya dengan membaca nama-namanya.

---

## Lisensi

Proyek ini dibuat untuk Lomba Kompetensi Siswa (LKS) Tingkat Kota Surakarta Tahun 2026.