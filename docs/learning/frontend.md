# Dokumentasi Frontend (Halaman React + Inertia)

File ini menjelaskan setiap halaman frontend di `resources/js/pages/`, helper API di `resources/js/lib/api.ts`, komponen shadcn-ui yang digunakan, dan bagaimana alur kerja antara frontend dan backend. Cocok untuk pemula yang ingin memahami bagaimana antarmuka pengguna berinteraksi dengan API backend.

## Daftar Isi

1. [Struktur Folder Frontend](#struktur-folder-frontend)
2. [Helper API (`api.ts`)](#helper-api-apitts)
3. [Halaman Login (`auth/login.tsx`)](#halaman-login-authlogintsx)
4. [Halaman Dashboard (`dashboard.tsx`)](#halaman-dashboard-dashboardtsx)
5. [Halaman Form Event (`event-form.tsx`)](#halaman-form-event-eventformtsx)
6. [Halaman Riwayat Pendaftaran (`registrations.tsx`)](#halaman-riwayat-pendaftaran-registrationstsx)
7. [Komponen shadcn-ui yang Digunakan](#komponen-shadcn-ui-yang-digunakan)
8. [Alur Data Dari Frontend ke Backend](#alur-data-dari-frontend-ke-backend)
9. [Cara Menambah Halaman Baru](#cara-menambah-halaman-baru)

---

## Struktur Folder Frontend

Semua file frontend berada di `resources/js/`. Berikut struktur utamanya:

```
resources/js/
├── app.tsx                 # Entry point Inertia (menginisialisasi aplikasi React)
├── pages/                  # Halaman Inertia (React components)
│   ├── auth/
│   │   ├── login.tsx       # Halaman login
│   │   ├── confirm-password.tsx
│   │   ├── forgot-password.tsx
│   │   ├── register.tsx
│   │   ├── reset-password.tsx
│   │   ├── two-factor-challenge.tsx
│   │   └── verify-email.tsx
│   ├── dashboard.tsx       # Dashboard: daftar event + info quota
│   ├── event-form.tsx      # Form tambah/edit event
│   ├── registrations.tsx   # Riwayat pendaftaran
│   └── welcome.tsx         # Halaman depan (landing page)
├── components/             # Komponen React yang digunakan kembali
│   ├── ui/                 # Komponen shadcn-ui (button, input, card, dll.)
│   ├── app-sidebar.tsx     # Sidebar navigasi
│   └── ...
├── lib/
│   └── api.ts              # Helper fetch untuk memanggil API backend
├── hooks/                  # Custom React hooks
├── layouts/                # Layout Inertia (app, auth, settings)
└── routes/                 # Route helper yang di-generate oleh Wayfinder
```

---

## Helper API (`resources/js/lib/api.ts`)

Sebelum memahami halaman-halaman, penting untuk memahami bagaimana frontend memanggil API backend. File `api.ts` berisi dua fungsi utama:

### `apiRequest(input, init)`

```typescript
export async function apiRequest(
    input: RequestInfo | URL,
    init?: RequestInit,
): Promise<Response> {
    return fetch(input, {
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(init?.headers || {}),
        },
        ...init,
    });
}
```

**Fungsi ini:**
- Memanggil `fetch` dengan `credentials: 'include'` — ini sangat penting agar cookie session (yang dibuat saat login) ikut terkirim ke backend dengan setiap request. Tanpa ini, backend tidak akan tahu siapa yang login.
- Menetapkan header `Accept: application/json` dan `Content-Type: application/json` secara default.
- Menggabungkan header tambahan dari parameter `init` jika ada.

### `apiJson(input, init)`

```typescript
export async function apiJson<T = unknown>(
    input: RequestInfo | URL,
    init?: RequestInit,
): Promise<T> {
    const res = await apiRequest(input, init);

    if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
            message?: string;
            errors?: Record<string, string[]>;
        };
        const error = new Error(err?.message ?? 'Terjadi kesalahan') as Error & {
            status?: number;
            errors?: Record<string, string[]>;
        };
        error.status = res.status;
        error.errors = err?.errors;
        throw error;
    }

    return res.json();
}
```

**Fungsi ini:**
- Memanggil `apiRequest` dan menunggu respons.
- Jika respons tidak OK (status 4xx atau 5xx), akan melempar error dengan pesan dan detail error dari respons JSON.
- Jika respons OK, akan mengembalikan data JSON yang sudah diuraikan.

---

## Halaman Login (`resources/js/pages/auth/login.tsx`)

Ini adalah halaman utama untuk masuk ke aplikasi. Digunakan sebagai ganti halaman login bawaan Fortify agar UI lebih rapi dengan shadcn-ui.

### Komponen dan State

```typescript
const [error, setError] = useState<string | null>(null);
const [processing, setProcessing] = useState(false);
```

- `error` — menyimpan pesan error jika login gagal (misalnya email atau password salah).
- `processing` — menyimpan status apakah request login sedang diproses (digunakan untuk men-disable tombol saat memproses).

### Fungsi `handleSubmit`

```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProcessing(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
        await apiJson('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        router.visit('/dashboard');
    } catch (err: unknown) {
        const errorObj = err as Error & { status?: number; message?: string };
        setError(
            errorObj.status === 401
                ? 'Email atau password salah'
                : errorObj?.message ?? 'Login gagal',
        );
        toast.error(errorObj?.message ?? 'Login gagal');
    } finally {
        setProcessing(false);
    }
}
```

**Alur kerja:**
1. Mencegah form melakukan submit standar (`e.preventDefault()`).
2. Mengambil data email dan kata sandi dari form.
3. Mengirim `POST /login` via `apiJson` dengan data JSON.
4. Jika berhasil, dialihkan ke halaman dashboard (`router.visit('/dashboard')`).
5. Jika gagal (misalnya 401), menampilkan pesan error "Email atau password salah" atau pesan lain dari server.
6. Selalu mengatur `processing` menjadi `false` di akhirnya (baik sukses maupun gagal).

### Tampilan

Halaman terdiri dari:
- Judul "Masuk ke Akun" dan deskripsi singkat
- Input Email (type email, required)
- Input Kata Sandi (type password, required)
- Tombol "Masuk" yang berubah menjadi "Memproses..." saat request sedang berjalan
- Pesan error di atas form jika login gagal

---

## Halaman Dashboard (`resources/js/pages/dashboard.tsx`)

Halaman utama yang muncul setelah login berhasil. Menampilkan daftar event, informasi quota, dan tombol untuk mendaftar.

### State

```typescript
const [events, setEvents] = useState<Event[]>([]);
const [categories, setCategories] = useState<Category[]>([]);
const [filterCategory, setFilterCategory] = useState<string>('');
const [loading, setLoading] = useState(false);
```

- `events` — daftar event yang diterima dari API.
- `categories` — daftar kategori untuk dropdown filter.
- `filterCategory` — kategori yang dipilih untuk filter (kosong = semua).
- `loading` — status apakah data sedang dimuat.

### Fungsi `fetchCategories` dan `fetchEvents`

```typescript
const fetchCategories = async () => {
    try {
        const data = await apiJson<{ data: unknown[] }>('/api/categories');
        setCategories(data.data.filter(isCategory));
    } catch (err) {
        toast.error('Gagal memuat kategori');
    }
};

const fetchEvents = async () => {
    setLoading(true);
    try {
        const params = new URLSearchParams();
        if (filterCategory) params.set('category_id', filterCategory);
        const data = await apiJson<{ data: unknown[] }>('/api/events?' + params.toString());
        setEvents(data.data.filter(isEvent));
    } catch (err) {
        toast.error('Gagal memuat daftar event');
    } finally {
        setLoading(false);
    }
};
```

- `fetchCategories` — mengambil daftar kategori dari `GET /api/categories` untuk diisi ke dropdown filter.
- `fetchEvents` — mengambil daftar event dari `GET /api/events` dengan parameter `category_id` jika filter sedang dipilih.

### Fungsi `handleRegister`

```typescript
const handleRegister = async (eventId: number) => {
    try {
        await apiJson(`/api/events/${eventId}/register`, { method: 'POST' });
        toast.success('Pendaftaran berhasil');
        await fetchEvents();
    } catch (err: any) {
        toast.error(err?.message ?? 'Pendaftaran gagal');
    }
};
```

**Maksudnya:** Mengirim `POST /api/events/{id}/register` untuk mendaftar ke event. Jika berhasil, menampilkan notifikasi sukses dan memuat ulang daftar event agar sisa quota terbaru ditampilkan.

### Tampilan

Halaman terdiri dari:
1. **Kartu statistik** — menampilkan total event dan total sisa kuota.
2. **Filter kategori** — dropdown untuk memilih kategori tertentu.
3. **Tombol Muat Ulang** — untuk memuat ulang data event.
4. **Grid kartu event** — setiap event ditampilkan dalam kartu dengan:
   - Nama kategori (badge)
   - Judul event
   - Deskripsi
   - Tanggal event
   - Kuota tersisa (dengan warna hijau jika masih tersisa, merah jika penuh)
   - Tombol "Daftar" atau "Kuota Penuh" (dinonaktifkan jika quota 0)

Type helper `remaining(event)` menghitung sisa quota:
```typescript
const remaining = (e: Event) =>
    typeof e.remaining_quota === 'number' ? e.remaining_quota : e.quota;
```

---

## Halaman Form Event (`resources/js/pages/event-form.tsx`)

Halaman untuk membuat event baru atau mengubah event yang sudah ada. Digunakan baik untuk create maupun edit.

### Deteksi Create atau Edit

```typescript
const isEdit = window.location.pathname.includes('/edit');
```

Jika URL mengandung `/edit`, maka ini adalah mode edit. Jika tidak, mode tambah baru.

### State Form

```typescript
const [form, setForm] = useState<FormValues>({
    title: '',
    description: '',
    category_id: '',
    event_date: '',
    quota: '',
});
```

### Fungsi `useEffect`

```typescript
useEffect(() => {
    // 1. Ambil daftar kategori
    (async () => {
        try {
            const data = await apiJson<{ data: unknown[] }>('/api/categories');
            setCategories(data.data.filter(isCategory));
        } catch (err) {
            toast.error('Gagal memuat kategori');
        }
    })();

    // 2. Jika mode edit, ambil data event dari API
    const match = window.location.pathname.match(/\/events\/(\d+)\/edit/);
    if (match) {
        (async () => {
            try {
                const data = await apiJson<{ data: EventData }>(
                    `/api/events/${match[1]}`,
                );
                setForm({
                    title: data.data.title,
                    description: data.data.description,
                    category_id: String(data.data.category_id),
                    event_date: data.data.event_date,
                    quota: String(data.data.quota),
                });
            } catch (err) {
                toast.error('Gagal memuat data event');
            }
        })();
    }
}, []);
```

**Maksudnya:**
1. Pertama, selalu mengambil daftar kategori dari API untuk diisi di dropdown.
2. Kedua, jika URL menunjukkan mode edit (`/events/{id}/edit`), mengambil data event dari `GET /api/events/{id}` dan mengisi formulir dengan data yang ada.

### Fungsi `handleSubmit`

```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
        title: form.title,
        description: form.description,
        category_id: Number(form.category_id),
        event_date: form.event_date,
        quota: Number(form.quota),
    };

    try {
        if (isEdit) {
            const match = window.location.pathname.match(/\/events\/(\d+)\/edit/);
            if (match) {
                await apiJson(`/api/events/${match[1]}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
                toast.success('Event berhasil diperbarui');
            }
        } else {
            await apiJson('/api/events', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            toast.success('Event berhasil ditambahkan');
        }
        router.visit('/dashboard');
    } catch (err: any) {
        toast.error(err?.message ?? 'Gagal menyimpan event');
    } finally {
        setLoading(false);
    }
};
```

**Maksudnya:**
1. Mengumpulkan data dari form menjadi objek `payload`.
2. Jika mode edit, mengirim `PUT /api/events/{id}`. Jika mode baru, mengirim `POST /api/events`.
3. Jika berhasil, menampilkan notifikasi dan dialihkan ke dashboard.
4. Jika gagal (misalnya validasi gagal), menampilkan pesan error dari server.

### Tampilan Form

Form berisi input:
- **Judul Event** — text input
- **Kategori** — dropdown (select) yang diisi dari daftar kategori
- **Deskripsi** — textarea (4 baris)
- **Tanggal Event** — date input
- **Kuota Peserta** — number input (minimal 1)
- Tombol "Simpan Event" / "Perbarui Event" dan "Batal"

---

## Halaman Riwayat Pendaftaran (`resources/js/pages/registrations.tsx`)

Halaman untuk melihat semua event yang telah didaftarkan pengguna yang login, dengan opsi untuk membatalkan pendaftaran.

### State

```typescript
const [registrations, setRegistrations] = useState<Registration[]>([]);
const [loading, setLoading] = useState(false);
```

### Fungsi `fetchRegistrations`

```typescript
const fetchRegistrations = async () => {
    setLoading(true);
    try {
        const data = await apiJson<{ data: unknown[] }>('/api/my-registrations');
        setRegistrations(data.data.filter(isRegistration));
    } catch (err: any) {
        toast.error(err?.message ?? 'Gagal memuat riwayat pendaftaran');
    } finally {
        setLoading(false);
    }
};
```

Mengambil daftar pendaftaran dari `GET /api/my-registrations` yang hanya mengembalikan pendaftaran milik user yang login.

### Fungsi `handleCancel`

```typescript
const handleCancel = async (id: number) => {
    if (!window.confirm('Yakin ingin membatalkan pendaftaran ini?')) return;
    setLoading(true);
    try {
        await apiJson(`/api/registrations/${id}/cancel`, { method: 'PUT' });
        toast.success('Pendaftaran berhasil dibatalkan');
        await fetchRegistrations();
    } catch (err: any) {
        toast.error(err?.message ?? 'Gagal membatalkan pendaftaran');
    } finally {
        setLoading(false);
    }
};
```

**Maksudnya:**
1. Meminta konfirmasi dari pengguna sebelum membatalkan.
2. Mengirim `PUT /api/registrations/{id}/cancel` untuk mengubah status menjadi `canceled`.
3. Jika berhasil, memuat ulang daftar pendaftaran.

### Tampilan

Setiap pendaftaran ditampilkan dalam kartu dengan:
- Nama kategori (badge)
- Judul event
- Tanggal event
- Status (dengan warna berbeda: biru untuk registered, hijau untuk attended, abu-abu untuk canceled)
- Tombol "Batalkan" (hanya muncul jika status masih `registered`)

---

## Komponen shadcn-ui yang Digunakan

Berikut adalah komponen UI dari shadcn-ui yang digunakan di halaman-halaman di atas:

| Komponen | File | Digunakan Di |
|----------|------|--------------|
| `Button` | `button.tsx` | Semua halaman (tombol submit, batal, daftar, batalkan) |
| `Input` | `input.tsx` | Login (email, password), EventForm (judul, tanggal, kuota) |
| `Label` | `label.tsx` | Semua input (label teks di atas input) |
| `Card` | `card.tsx` | Login, Dashboard, Registrations (kontainer utama) |
| `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, `CardDescription` | `card.tsx` | Bagian-bagian kartu |
| `Select` | `select.tsx` | EventForm (pilih kategori), Dashboard (filter kategori) |
| `Textarea` | `textarea.tsx` | EventForm (input deskripsi) |
| `Badge` | `badge.tsx` | Dashboard (kategori), Registrations (status) |
| `Spinner` | `spinner.tsx | Loading state (opsional) |
| `Sonner` / `toast` | `sonner.tsx` | Notifikasi sukses/error di layar |

---

## Alur Data Dari Frontend ke Backend

Berikut adalah alur lengkap ketika pengguna klik tombol "Daftar" di dashboard:

1. **Frontend** (`dashboard.tsx`) memanggil `apiJson('/api/events/1/register', { method: 'POST' })`
2. **`apiRequest`** dalam `api.ts` melakukan `fetch` dengan:
   - `credentials: 'include'` — agar cookie session ikut terkirim
   - Header `Accept: application/json` dan `Content-Type: application/json`
3. **Browser** mengirim request POST ke `http://localhost:8001/api/events/1/register` dengan cookie session
4. **Laravel** menerima request dan melalui middleware:
   - `web` — memulai session, enkripsi cookie
   - `auth` — memeriksa apakah user sudah login (melalui cookie session)
5. **Route** cocok dengan `POST /api/events/{id}/register` → `RegistrationController@store`
6. **Controller** memanggil `RegistrationStoreRequest` untuk validasi bisnis:
   - Event harus ditemukan
   - User belum terdaftar di event tersebut
   - Quota event belum penuh
7. Jika validasi lolos, controller membuat pendaftaran baru di tabel `registrations`
8. **Respons JSON** dikembalikan ke frontend:
   ```json
   {
     "status": "success",
     "message": "Pendaftaran berhasil",
     "data": { ... }
   }
   ```
9. **Frontend** menampilkan notifikasi sukses (`toast.success`) dan memuat ulang daftar event (`fetchEvents()`) agar sisa quota terbaru ditampilkan.

---

## Cara Menambah Halaman Baru

Jika ingin menambah halaman baru di aplikasi ini, ikuti langkah berikut:

1. **Buat file page baru** di `resources/js/pages/`, misalnya `contoh.tsx`:
   ```typescript
   import { Head } from '@inertiajs/react';
   
   export default function Contoh() {
       return (
           <>
               <Head title="Contoh" />
               <div>Ini halaman contoh</div>
           </>
       );
   }
   ```

2. **Tambahkan route di `routes/web.php`**:
   ```php
   Route::inertia('contoh', 'contoh')->name('contoh')->middleware('auth');
   ```

3. **Tambahkan navigasi di sidebar** (`resources/js/components/app-sidebar.tsx`) jika perlu.

4. **Restart Vite dev server** (`npm run dev`) agar perubahan terlihat di browser.

---

## Catatan Penting

1. **Semua permintaan API harus menggunakan `apiJson` dari `@/lib/api`** — jangan gunakan `fetch` secara langsung agar cookie session dan penanganan error konsisten.
2. **Cookie session harus dikirim** — `apiRequest` sudah menyertakan `credentials: 'include'` sehingga backend tahu siapa yang login.
3. **Validasi error ditangani secara otomatis** — jika validasi di backend gagal, `apiJson` akan melempar error yang dapat ditangkap dengan `try/catch` dan ditampilkan melalui `toast.error`.
4. **TypeScript interface** — semua data dari API harus memiliki interface/type sendiri (seperti `Event`, `Category`, `Registration`) agar kode lebih aman dan mudah dipelihara.
5. **Inertia handle navigasi** — gunakan `router.visit('/dashboard')` untuk pindah halaman tanpa reload halaman penuh.