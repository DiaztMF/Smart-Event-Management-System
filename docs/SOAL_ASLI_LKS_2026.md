## Informasi Umum Lomba

* **Nama Kegiatan:** Lomba Kompetensi Siswa (LKS) Tingkat Kota Surakarta Tahun 2026


* **Mata Lomba:** Web Technologies / Web Technology


* **Hari/Tanggal:** Rabu, 11 Februari 2026


* **Tema Lomba:** Smart Event Management System (Sistem Manajemen dan Pendaftaran Event Digital)



### Deskripsi Umum

Peserta diminta untuk mengembangkan sebuah aplikasi berbasis web yang digunakan untuk mengelola event (kegiatan) secara digital, yang digunakan oleh penyelenggara untuk membuat event dan oleh pengguna untuk melakukan pendaftaran serta melihat status keikutsertaan. Peserta diharapkan mampu membangun sistem yang fungsional, terstruktur, dan mudah digunakan dalam waktu yang ditentukan.

Aplikasi dibangun dengan pendekatan *balanced fullstack*:

* Backend berbasis PHP (native atau framework)


* Frontend menggunakan HTML, CSS, dan JavaScript


* Menggunakan konsep RESTful API sederhana


* Autentikasi menggunakan *session-based authentication*



### Waktu & Ketentuan Umum

* **Durasi lomba:** 6 Jam


* **Database:** Peserta membuat database sendiri (tidak disediakan SQL dump)


* **Dokumentasi API:** Peserta membuat Postman collection sendiri


* **Bahasa pemrograman backend:** PHP


* **Sistem Database:** MySQL / MariaDB


* **Teknologi Frontend:** HTML, CSS, JavaScript (framework opsional)



---

## Spesifikasi Sistem

### 1. Database & Tabel

Peserta diminta merancang database dengan ketentuan minimal 4 tabel berikut:

**a. Tabel `users**` (Digunakan untuk autentikasi pengguna)

| Kolom | Tipe Data & Keterangan | Sumber |
| --- | --- | --- |
| `id` | `INT`, Primary Key (`PK`), Auto Increment (`AI`) | 

 |
| `name` | `VARCHAR` | 

 |
| `email` | `VARCHAR`, `UNIQUE` | 

 |
| `password` | `VARCHAR`, hashed | 

 |
| `created_at` | Timestamp pembuatan data | 

 |
| `updated_at` | Timestamp pembaruan data | 

 |

**b. Tabel `event_categories**`

| Kolom | Tipe Data & Keterangan | Sumber |
| --- | --- | --- |
| `id` | `INT`, Primary Key (`PK`), Auto Increment (`AI`) | 

 |
| `name` | `VARCHAR`, `UNIQUE` | 

 |
| `created_at` | Timestamp pembuatan data | 

 |
| `updated_at` | Timestamp pembaruan data | 

 |

**c. Tabel `events**`

| Kolom | Tipe Data & Keterangan | Sumber |
| --- | --- | --- |
| `id` | `INT`, Primary Key (`PK`), Auto Increment (`AI`) | 

 |
| `title` | `VARCHAR` | 

 |
| `description` | `TEXT` | 

 |
| `category_id` | Foreign Key (`FK`) ke `event_categories` | 

 |
| `event_date` | `DATE` | 

 |
| `quota` | `INT` | 

 |
| `created_at` | Timestamp pembuatan data | 

 |
| `updated_at` | Timestamp pembaruan data | 

 |

**d. Tabel `registrations**`

| Kolom | Tipe Data & Keterangan | Sumber |
| --- | --- | --- |
| `id` | `INT`, Primary Key (`PK`), Auto Increment (`AI`) | 

 |
| `user_id` | Foreign Key (`FK`) ke `users` | 

 |
| `event_id` | Foreign Key (`FK`) ke `events` | 

 |
| `status` | `ENUM`: `registered`, `attended`, `canceled` | 

 |
| `created_at` | Timestamp pembuatan data | 

 |
| `updated_at` | Timestamp pembaruan data | 

 |

---

### 2. Modul Autentikasi (Session)

Peserta wajib membuat sistem login dan logout menggunakan session.

* **Endpoint yang harus dibuat:**
* `POST /login`


* `POST /logout`


* `GET /profile`




* **Ketentuan:**
* Password harus di-hash


* User yang belum login tidak boleh mengakses endpoint protected





---

### 3. Modul Data Master

**a. Kategori Event**

* **Endpoint:**
* `GET /api/categories`


* `POST /api/categories`


* `PUT /api/categories/{id}`


* `DELETE /api/categories/{id}`





**b. Event**

* **Endpoint:**
* `GET /api/events`


* `POST /api/events`


* `PUT /api/events/{id}`


* `DELETE /api/events/{id}`




* **Validasi:**
* Event harus memiliki kategori


* Quota harus berupa angka `> 0`





---

### 4. Modul Transaksi (Pendaftaran Event)

* **Endpoint:**
* `POST /api/events/{id}/register`


* `GET /api/my-registrations`


* `PUT /api/registrations/{id}/cancel`




* **Ketentuan:**
* User tidak boleh mendaftar event yang sama lebih dari satu kali


* Pendaftaran ditolak jika quota sudah penuh


* Status default pendaftaran adalah `"registered"`





---

### 5. Format Response API

**Response Sukses**:

```json
{
  "status": "success",
  "message": "Operasi berhasil",
  "data": {}
}

```

**Response Error**:

```json
{
  "status": "error",
  "message": "Terjadi kesalahan",
  "errors": {}
}

```

---

### 6. Frontend (Wajib)

Peserta diminta membuat tampilan frontend minimal dengan fitur:

1. Halaman Login


2. Dashboard:


* Daftar event


* Informasi quota




3. Form tambah/edit event


4. Form pendaftaran event


5. Halaman riwayat pendaftaran



**Ketentuan frontend:**

* Menggunakan `fetch` / AJAX untuk konsumsi API


* Validasi input sederhana di sisi frontend


* Tampilan rapi dan mudah dipahami



---

## Fitur Tambahan & Penilaian

### 7. Tugas Pembeda (Bonus Nilai)

Peserta yang menyelesaikan fitur berikut akan mendapatkan nilai tambahan:

* Filter event berdasarkan kategori


* Menampilkan jumlah sisa quota secara real-time


* Pembatasan akses halaman menggunakan session


* Soft delete event


* Export daftar peserta event ke CSV



### 8. Kriteria Penilaian Umum

* Fungsionalitas sistem


* Struktur database dan relasi


* Kerapihan kode


* Konsistensi API


* Kemampuan problem solving


* Implementasi fitur pembeda



> *"Selamat mengerjakan dan semoga sukses."*
> 
>