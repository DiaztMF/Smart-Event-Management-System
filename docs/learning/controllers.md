# Dokumentasi Controllers (Logika Bisnis)

File ini menjelaskan setiap controller di `app/Http/Controllers/`, maksudnya setiap method, dan bagaimana alur kerja di dalamnya. Cocok untuk pemula yang ingin memahami bagaimana aplikasi memproses request dari frontend atau browser.

## Daftar Isi

1. [AuthController (Autentikasi)](#authcontroller-autentikasi)
2. [CategoryController (Kategori Event)](#categorycontroller-kategori-event)
3. [EventController (Event)](#eventcontroller-event)
4. [RegistrationController (Pendaftaran)](#registrationcontroller-pendaftaran)
5. [ProfileController (Profil)](#profilecontroller-profil)
6. [Alur Permintaan Dari Frontend ke Controller](#alur-permintaan-dari-frontend-ke-controller)

---

## AuthController (Autentikasi)

**File:** `app/Http/Controllers/AuthController.php`

Controller ini menangani halaman login, proses masuk, dan keluar dari aplikasi.

### Method `create()`

```php
public function create()
{
    return Inertia::render('auth/login', [
        'status' => session('status'),
    ]);
}
```

**Maksudnya:** Menampilkan halaman login ke pengguna. Menggunakan Inertia untuk merender halaman React (`auth/login`) dan membawa pesan status jika ada (misalnya pesan sukses setelah registrasi).

### Method `store(LoginRequest $request)`

```php
public function store(LoginRequest $request)
{
    if (!Auth::attempt($request->only('email', 'password'))) {
        return back()->withErrors([
            'email' => 'Email atau password salah',
        ])->onlyInput('email');
    }

    $request->session()->regenerate();

    return redirect()->route('dashboard');
}
```

**Alur kerja:**
1. Mencoba login dengan `Auth::attempt(email, password)`. Jika email dan kata sandi cocok dengan data di tabel `users`, login berhasil.
2. Jika gagal, kembali ke halaman login dengan pesan error "Email atau password salah" dan tetap mempertahankan input email yang sudah diketik.
3. Jika berhasil, session diregenerate untuk keamanan (mencegah session fixation attack).
4. Pengguna diarahkan ke halaman dashboard.

### Method `destroy(Request $request)`

```php
public function destroy(Request $request)
{
    Auth::logout();

    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect('/');
}
```

**Maksudnya:** Melakukan logout dengan:
1. `Auth::logout()` — menghapus data user dari session.
2. `session()->invalidate()` — menghancurkan session lama sepenuhnya.
3. `session()->regenerateToken()` — membuat session baru kosong.
4. Mengarahkan pengguna kembali ke halaman depan (`/`).

---

## CategoryController (Kategori Event)

**File:** `app/Http/Controllers/CategoryController.php`

Controller ini menangani CRUD (Create, Read, Update, Delete) untuk kategori event.

### Method `index()`

```php
public function index()
{
    return response()->json([
        'status' => 'success',
        'message' => 'Daftar kategori event',
        'data' => EventCategory::all(),
    ]);
}
```

**Maksudnya:** Mengambil semua kategori dari tabel `event_categories` dan mengembalikannya dalam format JSON. Digunakan oleh frontend untuk menampilkan daftar kategori di form event dan filter dashboard.

### Method `store(CategoryStoreRequest $request)`

```php
public function store(CategoryStoreRequest $request)
{
    $category = EventCategory::create($request->only('name'));

    return response()->json([
        'status' => 'success',
        'message' => 'Kategori berhasil ditambahkan',
        'data' => $category,
    ], 201);
}
```

**Maksudnya:** Membuat kategori baru. Data yang digunakan hanya kolom `name` dari request. Validasi (nama wajib diisi, maksimal 255 karakter, harus unik) sudah ditangani oleh `CategoryStoreRequest` sebelum kode ini dieksekusi. HTTP 201 berarti "Created" (data berhasil dibuat).

### Method `update(CategoryUpdateRequest $request, $id)`

```php
public function update(CategoryUpdateRequest $request, $id)
{
    $category = EventCategory::find($id);

    if (!$category) {
        return response()->json([
            'status' => 'error',
            'message' => 'Kategori tidak ditemukan',
        ], 404);
    }

    $category->update($request->only('name'));

    return response()->json([
        'status' => 'success',
        'message' => 'Kategori berhasil diperbarui',
        'data' => $category,
    ]);
}
```

**Maksudnya:**
1. Mencari kategori berdasarkan ID yang diberikan di URL.
2. Jika tidak ditemukan, mengembalikan error 404.
3. Jika ditemukan, memperbarui nama kategorinya.
4. Mengembalikan data kategori yang sudah diperbarui.

### Method `destroy($id)`

```php
public function destroy($id)
{
    $category = EventCategory::find($id);

    if (!$category) {
        return response()->json([
            'status' => 'error',
            'message' => 'Kategori tidak ditemukan',
        ], 404);
    }

    $category->delete();

    return response()->json([
        'status' => 'success',
        'message' => 'Kategori berhasil dihapus',
    ]);
}
```

**Maksudnya:** Mencari kategori dan menghapusnya dari database. Jika tidak ditemukan, mengembalikan error 404.

---

## EventController (Event)

**File:** `app/Http/Controllers/EventController.php`

Controller ini menangani CRUD event dan ekspor daftar peserta ke CSV.

### Method `index(Request $request)`

```php
public function index(Request $request)
{
    $query = Event::with('category')->whereNull('deleted_at');

    if ($request->filled('category_id')) {
        $query->where('category_id', $request->category_id);
    }

    $events = $query->get()->map(function ($event) {
        return [
            'id' => $event->id,
            'title' => $event->title,
            'description' => $event->description,
            'category' => $event->category,
            'event_date' => $event->event_date,
            'quota' => $event->quota,
            'remaining_quota' => $event->quota - $event->registrations()->where('status', 'registered')->count(),
        ];
    });

    return response()->json([
        'status' => 'success',
        'message' => 'Daftar event',
        'data' => $events,
    ]);
}
```

**Maksudnya:**
1. Mengambil semua event yang belum di-soft-delete (`whereNull('deleted_at')`) beserta kategorinya (`with('category')`).
2. Jika ada parameter `category_id` di URL (misalnya `?category_id=1`), memfilter event berdasarkan kategori tersebut.
3. Untuk setiap event, menghitung `remaining_quota` (kuota dikurangi jumlah pendaftaran yang masih status `registered`).
4. Mengembalikan daftar event dalam format JSON.

### Method `store(EventStoreRequest $request)`

```php
public function store(EventStoreRequest $request)
{
    $event = Event::create($request->only([
        'title', 'description', 'category_id', 'event_date', 'quota',
    ]));

    return response()->json([
        'status' => 'success',
        'message' => 'Event berhasil ditambahkan',
        'data' => $event->load('category'),
    ], 201);
}
```

**Maksudnya:** Membuat event baru dengan data yang sudah divalidasi. `load('category')` memastikan data kategori juga ikut disertakan dalam respons. HTTP 201 berarti data berhasil dibuat.

### Method `show($id)`

```php
public function show($id)
{
    $event = Event::with('category')->whereNull('deleted_at')->find($id);

    if (!$event) {
        return response()->json([
            'status' => 'error',
            'message' => 'Event tidak ditemukan',
        ], 404);
    }

    return response()->json([
        'status' => 'success',
        'message' => 'Detail event',
        'data' => $event,
    ]);
}
```

**Maksudnya:** Mengambil detail satu event berdasarkan ID, termasuk kategorinya. Jika event tidak ditemukan atau sudah di-soft-delete, mengembalikan error 404.

### Method `update(EventUpdateRequest $request, $id)`

```php
public function update(EventUpdateRequest $request, $id)
{
    $event = Event::find($id);

    if (!$event) {
        return response()->json([
            'status' => 'error',
            'message' => 'Event tidak ditemukan',
        ], 404);
    }

    $event->update($request->only([
        'title', 'description', 'category_id', 'event_date', 'quota',
    ]));

    return response()->json([
        'status' => 'success',
        'message' => 'Event berhasil diperbarui',
        'data' => $event->load('category'),
    ]);
}
```

**Maksudnya:** Mencari event berdasarkan ID, lalu memperbarui field yang diizinkan. Validasi sudah ditangani oleh `EventUpdateRequest`.

### Method `destroy($id)`

```php
public function destroy($id)
{
    $event = Event::find($id);

    if (!$event) {
        return response()->json([
            'status' => 'error',
            'message' => 'Event tidak ditemukan',
        ], 404);
    }

    $event->delete();

    return response()->json([
        'status' => 'success',
        'message' => 'Event berhasil dihapus (soft delete)',
    ]);
}
```

**Maksudnya:** Melakukan soft delete event. Data tidak benar-benar hilang, tetapi kolom `deleted_at` diisi. Event ini tidak akan muncul lagi di daftar (karena query menggunakan `whereNull('deleted_at')`).

### Method `export($id)`

```php
public function export($id)
{
    $event = Event::find($id);

    if (!$event) {
        return response()->json([
            'status' => 'error',
            'message' => 'Event tidak ditemukan',
        ], 404);
    }

    $registrations = $event->registrations()->with('user')->get();

    $headers = [
        'Content-Type' => 'text/csv',
        'Content-Disposition' => 'attachment; filename="peserta-event-'.$id.'.csv"',
    ];

    $callback = function () use ($registrations) {
        $handle = fopen('php://output', 'w');
        fputcsv($handle, ['No', 'Nama', 'Email', 'Status', 'Tanggal Daftar']);

        $no = 1;
        foreach ($registrations as $registration) {
            fputcsv($handle, [
                $no++,
                $registration->user->name ?? '-',
                $registration->user->email ?? '-',
                $registration->status,
                $registration->created_at,
            ]);
        }

        fclose($handle);
    };

    return response()->stream($callback, 200, $headers);
}
```

**Maksudnya:**
1. Mencari event berdasarkan ID.
2. Mengambil semua pendaftaran event beserta data user-nya.
3. Membuat file CSV dengan kolom: No, Nama, Email, Status, Tanggal Daftar.
4. Mengirimkan file CSV sebagai respons dengan header yang memberitahu browser untuk mendownload file (`attachment`).

---

## RegistrationController (Pendaftaran)

**File:** `app/Http/Controllers/RegistrationController.php`

Controller ini menangani pendaftaran event, riwayat pendaftaran, dan pembatalan.

### Method `store(RegistrationStoreRequest $request, $id)`

```php
public function store(RegistrationStoreRequest $request, $id)
{
    if (!Auth::check()) {
        return response()->json([
            'status' => 'error',
            'message' => 'Silakan login terlebih dahulu',
        ], 401);
    }

    $event = Event::whereNull('deleted_at')->find($id);

    if (!$event) {
        return response()->json([
            'status' => 'error',
            'message' => 'Event tidak ditemukan',
        ], 404);
    }

    $registration = Registration::create([
        'user_id' => Auth::id(),
        'event_id' => $id,
        'status' => 'registered',
    ]);

    return response()->json([
        'status' => 'success',
        'message' => 'Pendaftaran berhasil',
        'data' => $registration->load('event'),
    ], 201);
}
```

**Maksudnya:**
1. Memeriksa apakah user sudah login. Jika belum, mengembalikan error 401.
2. Mencari event berdasarkan ID dan memastikan belum di-soft-delete.
3. Membuat pendaftaran baru dengan `user_id` dari user yang login, `event_id` dari URL, dan status default `registered`.
4. Validasi bisnis (tidak boleh duplikat, quota tidak boleh penuh) sudah ditangani oleh `RegistrationStoreRequest` sebelum kode ini dieksekusi.

### Method `index()`

```php
public function index()
{
    if (!Auth::check()) {
        return response()->json([
            'status' => 'error',
            'message' => 'Silakan login terlebih dahulu',
        ], 401);
    }

    $registrations = Registration::where('user_id', Auth::id())
        ->with('event.category')
        ->latest()
        ->get();

    return response()->json([
        'status' => 'success',
        'message' => 'Riwayat pendaftaran',
        'data' => $registrations,
    ]);
}
```

**Maksudnya:** Mengambil semua pendaftaran milik user yang login, beserta detail event dan kategorinya, diurutkan dari yang terbaru.

### Method `cancel($id)`

```php
public function cancel($id)
{
    if (!Auth::check()) {
        return response()->json([
            'status' => 'error',
            'message' => 'Silakan login terlebih dahulu',
        ], 401);
    }

    $registration = Registration::where('id', $id)
        ->where('user_id', Auth::id())
        ->first();

    if (!$registration) {
        return response()->json([
            'status' => 'error',
            'message' => 'Pendaftaran tidak ditemukan',
        ], 404);
    }

    $registration->update(['status' => 'canceled']);

    return response()->json([
        'status' => 'success',
        'message' => 'Pendaftaran berhasil dibatalkan',
        'data' => $registration,
    ]);
}
```

**Maksudnya:** Mencari pendaftaran yang dimiliki oleh user yang login berdasarkan ID, lalu mengubah statusnya menjadi `canceled`. Jika pendaftaran tidak ditemukan atau bukan milik user yang login, mengembalikan error 404.

---

## ProfileController (Profil)

**File:** `app/Http/Controllers/ProfileController.php`

```php
class ProfileController extends Controller
{
    public function __invoke(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'message' => 'Profil pengguna',
            'data' => $request->user(),
        ]);
    }
}
```

**Maksudnya:** Controller ini hanya memiliki satu method `__invoke` (memungkinkan class dipanggil langsung seperti fungsi). Mengembalikan data user yang sedang login dalam format JSON. Digunakan untuk endpoint `GET /api/profile`.

---

## Alur Permintaan Dari Frontend ke Controller

Berikut adalah alur lengkap ketika pengguna klik tombol "Daftar" di dashboard:

1. **Frontend** (`dashboard.tsx`) memanggil `apiJson('/api/events/1/register', { method: 'POST' })`
2. **Browser** mengirim request POST ke `http://localhost:8001/api/events/1/register` dengan cookie session
3. **Laravel** menerima request dan melalui middleware:
   - `web` — memulai session, enkripsi cookie
   - `auth` — memeriksa apakah user sudah login (melalui cookie session)
4. **Route** cocok dengan `POST /api/events/{id}/register` → `RegistrationController@store`
5. **Controller** memanggil `RegistrationStoreRequest` untuk validasi bisnis:
   - Event harus ditemukan
   - User belum terdaftar di event tersebut
   - Quota event belum penuh
6. Jika validasi lolos, controller membuat pendaftaran baru di tabel `registrations`
7. **Respons JSON** dikembalikan ke frontend:
   ```json
   {
     "status": "success",
     "message": "Pendaftaran berhasil",
     "data": { ... }
   }
   ```
8. **Frontend** menampilkan notifikasi sukses dan memperbarui tampilan daftar event

---

## Catatan Penting

1. **Semua controller API mengembalikan JSON** dengan format konsisten: `{ status, message, data }` atau `{ status, message, errors }`.
2. **Validasi dipindahkan ke Form Request** (`app/Http/Requests/`) agar controller tidak terlalu ramai dengan kode validasi.
3. **Soft delete** digunakan pada tabel `events`, sehingga data event yang "dihapus" masih bisa dipulihkan.
4. **Autentikasi menggunakan session** (bukan token), sehingga cookie harus dikirim bersama setiap request API dari frontend.