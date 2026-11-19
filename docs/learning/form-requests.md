# Dokumentasi Form Request (Validasi)

File ini menjelaskan semua Form Request yang ada di `app/Http/Requests/`, maksudnya setiap aturan validasi, dan mengapa validasi dipindahkan ke Form Request daripada ditulis langsung di controller. Cocok untuk pemula yang ingin memahami bagaimana data divalidasi sebelum diproses oleh aplikasi.

## Daftar Isi

1. [Mengapa Menggunakan Form Request?](#mengapa-menggunakan-form-request)
2. [ApiFormRequest (Class Induk)](#apiformrequest-class-induk)
3. [LoginRequest](#loginrequest)
4. [CategoryStoreRequest](#categorystorerequest)
5. [CategoryUpdateRequest](#categoryupdaterequest)
6. [EventStoreRequest](#eventstorerequest)
7. [EventUpdateRequest](#eventupdaterequest)
8. [RegistrationStoreRequest](#registrationstorerequest)
9. [Format Respons Error Validasi](#format-respons-error-validasi)
10. [Alur Validasi Dari Request ke Controller](#alur-validasi-dari-request-ke-controller)

---

## Mengapa Menggunakan Form Request?

Di Laravel, validasi input biasanya bisa ditulis langsung di controller menggunakan `Validator::make()`. Namun, dalam proyek ini, validasi dipindahkan ke **Form Request** karena beberapa alasan:

1. **Controller tetap bersih** — Controller hanya berisi logika bisnis, tidak dipenuhi kode validasi yang panjang.
2. **Dapat digunakan kembali** — Sama aturan validasi bisa digunakan untuk store dan update tanpa menuliskan dua kali.
3. **Pemisahan tanggung jawab** — Controller hanya menangani "apa yang dilakukan", Form Request menangani "apa yang diizinkan".
4. **Format error konsisten** — Semua respons error validasi menggunakan format yang sama di seluruh aplikasi.

---

## ApiFormRequest (Class Induk)

**File:** `app/Http/Requests/ApiFormRequest.php`

Ini adalah class abstraksi yang menjadi induk bagi semua Form Request di aplikasi. Class ini tidak dipakai secara langsung, tetapi diturunkan oleh Form Request lain.

### Method `authorize()`

```php
public function authorize(): bool
{
    return true;
}
```

**Maksudnya:** Menentukan apakah user diizinkan melakukan request ini. Mengembalikan `true` berarti semua user diizinkan (otentikasi ditangani terpisah oleh middleware `auth`).

### Method `failedValidation(Validator $validator)`

Ini adalah method paling penting. Ketika validasi gagal, method ini akan dipanggil:

```php
protected function failedValidation(Validator $validator): void
{
    $errors = $validator->errors()->toArray();

    // Jika request mengharapkan JSON (API), balas dengan format JSON standar
    if ($this->expectsJson() || $this->ajax()) {
        throw new HttpResponseException(
            response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal',
                'errors' => $errors,
            ], JsonResponse::HTTP_UNPROCESSABLE_ENTITY)
        );
    }

    // Jika request web/Inertia, redirect kembali dengan error dan input lama
    throw new HttpResponseException(
        redirect()->back()->withErrors($errors)->withInput()
    );
}
```

**Maksudnya:**
- Jika request datang dari frontend yang mengirim `Accept: application/json` (via `fetch` dengan `apiJson`), respons error akan dalam format JSON yang konsisten: `{ status: "error", message: "Validasi gagal", errors: { ... } }` dengan HTTP 422.
- Jika request datang dari halaman web biasa (Inertia form), akan di-redirect kembali ke halaman sebelumnya dengan error dan input yang sudah diisi tetap tersimpan.

---

## LoginRequest

**File:** `app/Http/Requests/LoginRequest.php`

Digunakan untuk memvalidasi data login pengguna.

### Aturan Validasi

```php
public function rules(): array
{
    return [
        'email' => 'required|email',
        'password' => 'required',
    ];
}
```

| Field | Aturan | Maksudnya |
|-------|--------|-----------|
| `email` | `required` | Wajib diisi, tidak boleh kosong |
| `email` | `email` | Harus berupa format email yang valid (contoh: nama@contoh.com) |
| `password` | `required` | Wajib diisi, tidak boleh kosong |

### Atribut Kustom

```php
public function attributes(): array
{
    return [
        'email' => 'email',
        'password' => 'kata sandi',
    ];
}
```

**Maksudnya:** Jika validasi gagal, pesan error akan menampilkan "email" dan "kata sandi" alih-alih nama field asli. Misalnya: "Kata sandi wajib diisi" alih-alih "Password wajib diisi".

---

## CategoryStoreRequest

**File:** `app/Http/Requests/CategoryStoreRequest.php`

Digunakan untuk memvalidasi data saat menambah kategori event baru.

### Aturan Validasi

```php
public function rules(): array
{
    return [
        'name' => 'required|string|max:255|unique:event_categories,name',
    ];
}
```

| Field | Aturan | Maksudnya |
|-------|--------|-----------|
| `name` | `required` | Nama kategori wajib diisi |
| `name` | `string` | Harus berupa teks |
| `name` | `max:255` | Maksimal 255 karakter |
| `name` | `unique:event_categories,name` | Nama kategori tidak boleh sama dengan yang sudah ada di tabel `event_categories` |

---

## CategoryUpdateRequest

**File:** `app/Http/Requests/CategoryUpdateRequest.php`

Digunakan untuk memvalidasi data saat mengubah kategori event. Mirip dengan store, tetapi dengan pengecualian untuk ID kategori itu sendiri.

### Aturan Validasi

```php
public function rules(): array
{
    return [
        'name' => [
            'required',
            'string',
            'max:255',
            Rule::unique('event_categories', 'name')->ignore($this->route('id')),
        ],
    ];
}
```

| Field | Aturan | Maksudnya |
|-------|--------|-----------|
| `name` | `required` | Nama kategori wajib diisi |
| `name` | `string` | Harus berupa teks |
| `name` | `max:255` | Maksimal 255 karakter |
| `name` | `unique:event_categories,name` (diabaikan ID sendiri) | Nama tidak boleh sama dengan kategori lain, kecuali kategori itu sendiri |

**Mengapa perlu `ignore($this->route('id'))`?** Ketika mengubah kategori dengan ID 1 misalnya, sistem tidak boleh menolak hanya karena nama kategori tersebut sama dengan nama yang sudah ada (karena itu adalah kategori itu sendiri). `ignore()` memastikan validasi unique tidak menolak kategori yang sedang diedit.

---

## EventStoreRequest

**File:** `app/Http/Requests/EventStoreRequest.php`

Digunakan untuk memvalidasi data saat menambah event baru.

### Aturan Validasi

```php
public function rules(): array
{
    return [
        'title' => 'required|string|max:255',
        'description' => 'required|string',
        'category_id' => 'required|exists:event_categories,id',
        'event_date' => 'required|date',
        'quota' => 'required|integer|min:1',
    ];
}
```

| Field | Aturan | Maksudnya |
|-------|--------|-----------|
| `title` | `required|string|max:255` | Judul event wajib diisi, teks, maksimal 255 karakter |
| `description` | `required|string` | Deskripsi event wajib diisi, teks |
| `category_id` | `required|exists:event_categories,id` | Kategori wajib diisi dan harus ada di tabel `event_categories` |
| `event_date` | `required|date` | Tanggal event wajib diisi dan harus berupa format tanggal yang valid |
| `quota` | `required|integer|min:1` | Kuota wajib diisi, bilangan bulat, dan minimal 1 |

**Penting:** Aturan `min:1` pada quota memastikan tidak bisa membuat event dengan kuota 0 atau negatif, sesuai spesifikasi soal.

---

## EventUpdateRequest

**File:** `app/Http/Requests/EventUpdateRequest.php`

Digunakan untuk memvalidasi data saat mengubah event. Aturannya sama persis dengan `EventStoreRequest`.

### Aturan Validasi

```php
public function rules(): array
{
    return [
        'title' => 'required|string|max:255',
        'description' => 'required|string',
        'category_id' => 'required|exists:event_categories,id',
        'event_date' => 'required|date',
        'quota' => 'required|integer|min:1',
    ];
}
```

---

## RegistrationStoreRequest

**File:** `app/Http/Requests/RegistrationStoreRequest.php`

Digunakan untuk memvalidasi data saat mendaftar ke event. Validasi ini lebih kompleks karena melibatkan pengecekan ke database (bukan hanya format input).

### Aturan Validasi Dasar

```php
public function rules(): array
{
    return [];
}
```

Tidak ada aturan validasi input biasa karena semua data yang diperlukan (user_id dan event_id) sudah diketahui dari session dan URL, bukan dari input form.

### Validasi Bisnis dengan `withValidator()`

```php
public function withValidator(Validator $validator): void
{
    $validator->after(function ($validator) {
        $user = auth()->user();
        $eventId = (int) $this->route('id');

        $event = Event::whereNull('deleted_at')->find($eventId);

        if (!$event) {
            $validator->errors()->add('event', 'Event tidak ditemukan');
            return;
        }

        $exists = Registration::where('user_id', $user->id)
            ->where('event_id', $eventId)
            ->exists();

        if ($exists) {
            $validator->errors()->add('event', 'Anda telah terdaftar pada event ini');
            return;
        }

        $registeredCount = Registration::where('event_id', $eventId)
            ->where('status', 'registered')
            ->count();

        if ($registeredCount >= $event->quota) {
            $validator->errors()->add('quota', 'Quota event sudah penuh');
        }
    });
}
```

**Alur validasi bisnis:**

1. **Event harus ditemukan** — Mencari event berdasarkan ID di URL. Jika tidak ditemukan atau sudah di-soft-delete, validasi gagal dengan pesan "Event tidak ditemukan".
2. **Tidak boleh duplikat** — Memeriksa apakah user yang login sudah terdaftar di event yang sama. Jika sudah, validasi gagal dengan pesan "Anda telah terdaftar pada event ini".
3. **Quota tidak boleh penuh** — Menghitung jumlah pendaftaran dengan status `registered` untuk event tersebut. Jika jumlah sudah mencapai atau melebihi kuota, validasi gagal dengan pesan "Quota event sudah penuh".

**Mengapa pakai `withValidator()`?** Karena validasi ini membutuhkan query ke database (tidak hanya memeriksa format input), tidak bisa ditulis dalam array `rules()` biasa. `withValidator()` memungkinkan menambahkan logika kustom setelah validasi standar dijalankan.

---

## Format Respons Error Validasi

Jika validasi gagal, respons yang diterima frontend akan berbentuk:

**Untuk API (JSON):**
```json
{
  "status": "error",
  "message": "Validasi gagal",
  "errors": {
    "email": ["Email wajib diisi"],
    "password": ["Kata sandi wajib diisi"],
    "quota": ["Quota event sudah penuh"]
  }
}
```

**Untuk Web (Inertia):**
Halaman akan di-refresh dengan error ditampilkan di setiap field input yang salah, dan input yang sudah diisi tetap tersimpan.

---

## Alur Validasi Dari Request ke Controller

Berikut adalah alur lengkap saat frontend mengirim request untuk menambah event:

1. **Frontend** mengirim `POST /api/events` dengan data JSON (judul, deskripsi, kategori, tanggal, kuota)
2. **Laravel** memetakan request ke `EventController@store`
3. **Laravel** memeriksa apakah `EventStoreRequest` perlu diinisialisasi
4. **Form Request** menjalankan `authorize()` — jika `false`, request ditolak dengan 403
5. **Form Request** menjalankan validasi sesuai array `rules()`
6. **Jika validasi gagal**, `failedValidation()` dipanggil dan mengembalikan respons error 422 (JSON) atau redirect dengan error (web)
7. **Jika validasi lolos**, controller `EventController@store` dieksekusi dengan data yang sudah divalidasi
8. **Controller** memproses data dan mengembalikan respons sukses

Karena validasi sudah selesai sebelum sampai ke controller, kode controller menjadi lebih pendek dan fokus hanya pada logika bisnis, bukan pemeriksaan input.

---

## Contoh Penggunaan Melalui API

**Request yang valid:**
```bash
curl -X POST http://localhost:8001/api/events \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title":"Seminar Web","description":"Belajar web","category_id":1,"event_date":"2026-12-01","quota":10}'
```

**Respons sukses:**
```json
{
  "status": "success",
  "message": "Event berhasil ditambahkan",
  "data": { ... }
}
```

**Request yang tidak valid (kuota 0):**
```bash
curl -X POST http://localhost:8001/api/events \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"title":"Test","description":"Test","category_id":1,"event_date":"2026-12-01","quota":0}'
```

**Respons error:**
```json
{
  "status": "error",
  "message": "Validasi gagal",
  "errors": {
    "quota": ["The kuota peserta field must be at least 1."]
  }
}
```

---

## Catatan Penting

1. **Form Request otomatis di-inject oleh Laravel** berdasarkan type-hint di method controller (misalnya `store(EventStoreRequest $request)`).
2. **Validasi dijalankan sebelum controller dieksekusi**, sehingga controller tidak perlu menulis kode `if` untuk memeriksa input yang tidak valid.
3. **Semua Form Request mewarisi `ApiFormRequest`**, sehingga format error konsisten di seluruh aplikasi.
4. **Untuk validasi yang membutuhkan database** (seperti cek quota atau duplikasi pendaftaran), gunakan `withValidator()` bukan `rules()`.