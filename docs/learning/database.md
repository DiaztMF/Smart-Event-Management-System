# Dokumentasi Database & Model

File ini menjelaskan secara mendalam setiap tabel, migrasi, model, dan relasi di repositori Smart Event Management System. Cocok untuk pemula yang ingin memahami bagaimana data disimpan dan saling terhubung.

## Daftar Isi

1. [Ringkasan Tabel](#ringkasan-tabel)
2. [Migrasi (Migrasi File)](#migrasi-migrasi-file)
3. [Model (Eloquent Model)](#model-eloquent-model)
4. [Relasi Antar Tabel](#relasi-antar-tabel)
5. [Contoh Penggunaan Melalui Tinker](#contoh-penggunaan-melalui-tinker)
6. [Catatan Penting](#catatan-penting)

---

## Ringkasan Tabel

Aplikasi ini menggunakan 4 tabel inti beserta tabel bawaan Laravel untuk autentikasi dan session:

| Tabel | Tujuan | Baris Utama |
|-------|--------|-------------|
| `users` | Data pengguna yang dapat login | id, name, email, password, timestamps |
| `event_categories` | Kategori event (Seminar, Workshop, dll.) | id, name, timestamps |
| `events` | Data event yang dibuat penyelenggara | id, title, description, category_id, event_date, quota, timestamps |
| `registrations` | Data pendaftaran user ke event | id, user_id, event_id, status, timestamps |
| `password_reset_tokens` | Token reset sandi (Laravel bawaan) | email, token, created_at |
| `sessions` | Data sesi pengguna (Laravel bawaan) | id, user_id, payload, last_activity |

---

## Migrasi (File-file di `database/migrations/`)

Setiap file migration adalah instruksi PHP yang memberitahu Laravel bagaimana membuat atau mengubah struktur tabel di database. File dijalankan secara berurutan berdasarkan tanggal dalam nama file.

### 1. `0001_01_01_000000_create_users_table.php`

Migrasi pertama yang membuat tabel pengguna dan tabel pendukung Laravel:

```php
Schema::create('users', function (Blueprint $table) {
    $table->id();                    // id (INT, PK, AI)
    $table->string('name');          // nama lengkap pengguna
    $table->string('email')->unique(); // email, harus unik
    $table->string('password');      // kata sandi yang sudah di-hash
    $table->timestamp('email_verified_at')->nullable(); // waktu verifikasi email
    $table->rememberToken();         // kolom untuk fitur "ingat saya"
    $table->timestamps();            // created_at dan updated_at
});
```

Selain `users`, migration ini juga membuat:
- `password_reset_tokens` — untuk fitur lupa kata sandi
- `sessions` — untuk menyimpan data sesi pengguna (karena `SESSION_DRIVER=database`)

### 2. `2026_11_17_043029_create_event_categories_table.php`

Membuat tabel kategori event:

```php
Schema::create('event_categories', function (Blueprint $table) {
    $table->id();
    $table->string('name')->unique(); // nama kategori, harus unik
    $table->timestamps();
});
```

Kategori contoh yang di-seed: Seminar, Workshop, Konferensi, Pelatihan.

### 3. `2026_11_17_043107_create_events_table.php`

Membuat tabel event dengan foreign key ke kategori:

```php
Schema::create('events', function (Blueprint $table) {
    $table->id();
    $table->string('title');           // judul event
    $table->text('description');       // deskripsi panjang
    $table->foreignId('category_id')->constrained('event_categories')->cascadeOnDelete();
                                       // FK ke event_categories, hapus jika kategori dihapus
    $table->date('event_date');        // tanggal pelaksanaan event
    $table->integer('quota');          // kapasitas maksimal peserta
    $table->timestamps();
});
```

`cascadeOnDelete()` berarti jika kategori dihapus, semua event yang terkait juga akan ikut dihapus.

### 4. `2026_11_17_043511_create_registrations_table.php`

Membuat tabel pendaftaran yang menghubungkan user dengan event:

```php
Schema::create('registrations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users');      // FK ke users
    $table->foreignId('event_id')->constrained('events');    // FK ke events
    $table->enum('status', ['registered', 'attended', 'canceled']); // status pendaftaran
    $table->timestamps();
});
```

Kolom `status` menggunakan tipe `ENUM` dengan tiga nilai yang diizinkan:
- `registered` — terdaftar (default saat membuat pendaftaran baru)
- `attended` — sudah hadir
- `canceled` — telah dibatalkan

### 5. `2026_11_18_064220_add_soft_deletes_to_events_table.php`

Migration tambahan untuk menambahkan kolom `deleted_at` pada tabel `events`:

```php
Schema::table('events', function (Blueprint $table) {
    $table->softDeletes(); // menambahkan kolom deleted_at (nullable)
});
```

Ini adalah fitur **soft delete**. Ketika event "dihapus", data tidak benar-benar hilang dari tabel, tetapi kolom `deleted_at` diisi dengan waktu penghapusan. Event yang sudah di-soft-delete akan disembunyikan dari daftar event (karena query menggunakan `whereNull('deleted_at')`), tetapi masih dapat dipulihkan jika diperlukan.

---

## Model (Eloquent Model di `app/Models/`)

Model adalah representasi PHP dari tabel database. Di Laravel, model memungkinkan kita berinteraksi dengan database menggunakan sintaks PHP yang mudah dibaca, bukan menulis SQL secara manual.

### `app/Models/User.php`

```php
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;
    // ...
    
    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }
    
    public function events(): BelongsToMany
    {
        return $this->belongsToMany(Event::class, 'registrations')
            ->withPivot('status')
            ->withTimestamps();
    }
}
```

**Penjelasan:**
- `HasFactory` — memungkinkan pembuatan data dummy menggunakan factory untuk pengujian.
- `HasApiTokens` — dukungan Sanctum untuk API token (diinstal meski saat ini pakai session).
- `registrations()` — satu user bisa memiliki banyak pendaftaran (`hasMany`).
- `events()` — satu user bisa terdaftar di banyak event melalui tabel pivot `registrations`. `withPivot('status')` memungkinkan mengakses status pendaftaran dari relasi ini.

### `app/Models/Event.php`

```php
class Event extends Model
{
    use SoftDeletes;
    
    public function category(): BelongsTo
    {
        return $this->belongsTo(EventCategory::class, 'category_id');
    }
    
    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }
    
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'registrations')
            ->withPivot('status')
            ->withTimestamps();
    }
}
```

**Penjelasan:**
- `SoftDeletes` — mengaktifkan soft delete pada tabel events.
- `category()` — satu event milik satu kategori (`belongsTo`).
- `registrations()` — satu event punya banyak pendaftaran (`hasMany`).
- `users()` — satu event diikuti oleh banyak user melalui tabel `registrations`.

### `app/Models/EventCategory.php`

```php
class EventCategory extends Model
{
    public function events(): HasMany
    {
        return $this->hasMany(Event::class, 'category_id');
    }
}
```

Satu kategori punya banyak event (`hasMany`).

### `app/Models/Registration.php`

```php
class Registration extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
}
```

Satu pendaftaran terkait dengan satu user dan satu event (keduanya `belongsTo`).

---

## Relasi Antar Tabel

Berikut adalah diagram alur relasi:

```
users (1) ──┬─< registrations (N) ──┬─< events (N) ──┬─ (1) event_categories
            │                          │
            │                          └─ (1) users (via user_id)
            │
            └─ (1) events (via event_id)
```

Artinya:
- Satu **user** bisa punya banyak **registrations**.
- Satu **event** bisa punya banyak **registrations**.
- Satu **registration** terkait dengan satu **user** dan satu **event**.
- Satu **event** milik satu **event_category**.
- Satu **event_category** bisa punya banyak **events**.

---

## Contoh Penggunaan Melalui Tinker

Anda dapat mencoba query database secara langsung menggunakan `php artisan tinker`:

```bash
# Lihat semua pengguna
php artisan tinker --execute 'App\Models\User::all()'

# Lihat semua event dengan kategorinya
php artisan tinker --execute 'App\Models\Event::with("category")->get()'

# Buat event baru
php artisan tinker --execute 'App\Models\Event::create(["title"=>"Contoh","description"=>"Test","category_id"=>1,"event_date"=>"2026-12-01","quota"=>50])'

# Hitung sisa quota event id=1
php artisan tinker --execute '
$event = App\Models\Event::find(1);
echo $event->quota - $event->registrations()->where("status","registered")->count();
'
```

---

## Catatan Penting

1. **Semua model menggunakan `timestamps()`** — kolom `created_at` dan `updated_at` otomatis diisi oleh Laravel saat data dibuat atau diperbarui.
2. **Foreign key menggunakan `foreignId()->constrained()`** — memastikan referensi tabel lainnya benar dan secara otomatis menghapus data terkait jika data induk dihapus (cascade).
3. **Soft delete hanya pada tabel `events`** — tabel lain (`users`, `event_categories`, `registrations`) tidak menggunakan soft delete.
4. **Status pendaftaran menggunakan ENUM** — hanya menerima nilai `registered`, `attended`, atau `canceled`. Nilai lain akan ditolak oleh database.
5. **Seeder hanya membuat kategori** — tabel `users`, `events`, dan `registrations` kosong setelah `db:seed` kecuali 4 kategori default. Anda perlu menambahkan data secara manual atau melalui aplikasi.