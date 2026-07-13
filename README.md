# PTMS Dev — Panduan Operasional

> **Personal Trainer Management System** · Progressive Web App  
> Sistem absensi & manajemen sesi latihan personal trainer berbasis QR Code.

---

## Daftar Isi

1. [Tentang Aplikasi](#tentang-aplikasi)
2. [Arsitektur & Tech Stack](#arsitektur--tech-stack)
3. [Instalasi & Setup Lokal](#instalasi--setup-lokal)
4. [Struktur Role & Hak Akses](#struktur-role--hak-akses)
5. [Panduan Role: Admin](#-panduan-role-admin)
6. [Panduan Role: Trainer](#-panduan-role-trainer)
7. [Panduan Role: Member](#-panduan-role-member)
8. [Fitur Multi-Role & Role Switching](#fitur-multi-role--role-switching)
9. [Alur QR Absensi (End-to-End)](#alur-qr-absensi-end-to-end)
10. [Deployment ke Vercel](#deployment-ke-vercel)
11. [Environment Variables](#environment-variables)
12. [FAQ & Troubleshooting](#faq--troubleshooting)

---

## Tentang Aplikasi

PTMS Dev adalah platform SaaS untuk mengelola operasional personal training di gym/studio fitness. Fitur utama:

| Fitur | Deskripsi |
|---|---|
| **QR Absensi** | Member generate QR → Trainer scan → Sesi terpotong otomatis |
| **Manajemen Paket** | Admin membuat master paket latihan (nama, harga, jumlah sesi, durasi) |
| **Kuota Sesi** | Admin mengaktifkan paket untuk member, kuota berkurang tiap check-in |
| **Role Management** | Admin mengatur siapa yang menjadi Admin / Trainer / Member |
| **Multi-Role** | Satu akun bisa merangkap beberapa role sekaligus (misal: Trainer + Admin) |
| **Audit Log** | Semua aktivitas penting tercatat untuk transparansi |
| **Sesi Latihan** | Riwayat lengkap kehadiran per role |
| **PWA** | Bisa di-install di HP layaknya aplikasi native |

---

## Arsitektur & Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Database | PostgreSQL (Supabase-managed) |
| ORM | Prisma 7 |
| Auth | Supabase Auth (JWT + httpOnly cookie) |
| QR Engine | html5-qrcode (scan) + qrcode (generate) |
| Styling | Vanilla CSS (dark theme, glassmorphism) |
| Deploy | Vercel (Serverless) |

---

## Instalasi & Setup Lokal

### Prasyarat

- Node.js 18+
- PostgreSQL (atau akun Supabase gratis)
- Git

### Langkah

```bash
# 1. Clone repository
git clone https://github.com/fahmibastari/ptms-pwa.git
cd ptms-pwa/web

# 2. Install dependencies
npm install

# 3. Konfigurasi environment
cp .env.example .env
# Edit .env dan isi variabel (lihat bagian Environment Variables)

# 4. Generate Prisma Client & migrasi database
npx prisma generate
npx prisma db push

# 5. Jalankan development server
npm run dev
```

Buka `http://localhost:3000` di browser. Anda akan otomatis diarahkan ke `/login`.

---

## Struktur Role & Hak Akses

Sistem PTMS memiliki **3 role utama** dengan hak akses yang berbeda:

| Fitur / Menu | Admin | Trainer | Member |
|---|:---:|:---:|:---:|
| Dashboard Overview | ✅ (statistik global) | ✅ (statistik pribadi) | ✅ (statistik pribadi) |
| Manajemen User & Role | ✅ | ❌ | ❌ |
| Master Paket Latihan | ✅ | ❌ | ❌ |
| Langganan & Kuota Member | ✅ | ❌ | ❌ |
| QR Absensi — Scanner | ❌ | ✅ | ❌ |
| QR Absensi — Generate QR | ❌ | ❌ | ✅ |
| Sesi Latihan (Riwayat) | ✅ (semua data) | ✅ (data sendiri) | ✅ (data sendiri) |
| Audit Log | ✅ | ❌ | ❌ |
| Role Switcher | ✅ (jika multi-role) | ✅ (jika multi-role) | ✅ (jika multi-role) |
| Logout | ✅ | ✅ | ✅ |

---

## 🔴 Panduan Role: Admin

Admin memiliki akses penuh ke seluruh sistem. Berikut adalah panduan operasional lengkap.

### Menu Navigasi Admin

| Menu | Path | Fungsi |
|---|---|---|
| Overview | `/dashboard` | Statistik: total user, trainer aktif, absensi hari ini, sesi bulan ini |
| Manajemen User | `/dashboard/users` | Kelola role user, master paket, dan langganan member |
| Sesi Latihan | `/dashboard/sessions` | Lihat semua riwayat absensi seluruh member & trainer |
| Audit Log | `/dashboard/logs` | Riwayat aktivitas: perubahan role, verifikasi QR |

---

### A1. Dashboard Overview (Admin)

**Path:** `/dashboard`

Saat login sebagai Admin, dashboard menampilkan 4 kartu statistik:

| Kartu | Data |
|---|---|
| Total Pengguna | Jumlah seluruh akun terdaftar di sistem |
| Trainer Aktif | Jumlah user yang memiliki role TRAINER |
| Absensi Hari Ini | Jumlah record attendance untuk tanggal hari ini |
| Sesi Bulan Ini | Total sesi latihan tercatat dari awal bulan berjalan |

Di bawah statistik terdapat **Panduan Administrator** yang menjelaskan alur kerja Admin.

---

### A2. Manajemen User — Tab "User & Role"

**Path:** `/dashboard/users` → Tab **User & Role**

**Fungsi:** Mengatur role setiap pengguna terdaftar.

**Cara Menggunakan:**

1. Buka menu **Manajemen User** di sidebar.
2. Pastikan Anda berada di tab **User & Role** (tab pertama).
3. Anda akan melihat tabel seluruh pengguna beserta role mereka.
4. Gunakan kolom **Cari nama atau email** untuk memfilter pengguna.
5. Di kolom **Aksi**, terdapat 3 tombol per pengguna: `MEMBER`, `TRAINER`, `ADMIN`.
   - **Tombol berwarna** = user sudah memiliki role tersebut. Klik untuk **mencabut**.
   - **Tombol abu-abu** = user belum memiliki role tersebut. Klik untuk **memberikan**.
6. Perubahan role akan langsung tersimpan dan tercatat di Audit Log.

**Contoh Skenario:**
> Trainer bernama "Rigen" perlu merangkap sebagai Admin.
> 1. Cari "Rigen" di search bar.
> 2. Klik tombol `+ ADMIN` di baris Rigen.
> 3. Selesai. Rigen sekarang memiliki role TRAINER + ADMIN.

---

### A3. Manajemen User — Tab "Master Paket"

**Path:** `/dashboard/users` → Tab **Master Paket**

**Fungsi:** Membuat dan mengelola katalog paket latihan yang tersedia di gym.

**Cara Menggunakan:**

1. Klik tab **Master Paket** (tab kedua).
2. Di sisi kiri, isi formulir **Tambah Master Paket**:
   - **Nama Paket**: Nama deskriptif (contoh: "Paket 12 Sesi PT Premium")
   - **Harga (Rp)**: Harga paket dalam Rupiah (contoh: 1500000)
   - **Jumlah Sesi**: Berapa kali latihan yang didapat (contoh: 12)
   - **Masa Aktif (Bulan)**: Durasi berlaku paket (contoh: 2)
3. Klik **Simpan Master Paket**.
4. Paket akan muncul di tabel sebelah kanan.
5. Untuk menghapus paket, klik ikon 🗑️ di kolom Aksi.

> ⚠️ **Catatan:** Paket yang sedang digunakan oleh member tidak bisa dihapus.

---

### A4. Manajemen User — Tab "Langganan Member"

**Path:** `/dashboard/users` → Tab **Langganan Member**

**Fungsi:** Mengaktifkan paket latihan untuk member dan mengelola kuota sesi mereka.

**Cara Menggunakan:**

#### Mengaktifkan Paket untuk Member:
1. Klik tab **Langganan Member** (tab ketiga).
2. Di sisi kiri, isi formulir **Aktifkan Paket Member**:
   - **Pilih Member**: Dropdown berisi semua user ber-role MEMBER.
   - **Pilih Paket Master**: Dropdown berisi paket yang sudah dibuat di tab Master Paket.
3. Klik **Aktifkan Langganan**.
4. Sistem akan:
   - Menonaktifkan langganan aktif sebelumnya (jika ada).
   - Membuat langganan baru dengan kuota sesi sesuai paket.
   - Menghitung tanggal kadaluarsa otomatis.

#### Mengelola Kuota Sesi:
- Di tabel sebelah kanan, setiap member menampilkan:
  - **Paket Aktif**: Nama paket yang sedang berjalan.
  - **Kuota Sesi**: Sisa sesi latihan dengan tombol **`-`** dan **`+`**.
  - **Masa Berlaku**: Tanggal kadaluarsa paket.
- Klik **`+`** untuk menambah sesi (misal: bonus sesi, koreksi data).
- Klik **`-`** untuk mengurangi sesi secara manual.
- Jika kuota mencapai **0**, status langganan otomatis menjadi `EXPIRED`.

---

### A5. Sesi Latihan (Admin View)

**Path:** `/dashboard/sessions`

Admin melihat **seluruh** data kehadiran di sistem, meliputi:

| Kolom | Isi |
|---|---|
| Tanggal & Waktu | Kapan check-in dilakukan |
| Member | Nama dan email member |
| Trainer | Nama trainer yang memverifikasi |
| Metode | `QR_SCAN` atau `MANUAL` |
| Status | `PRESENT` (Hadir) |

---

### A6. Audit Log

**Path:** `/dashboard/logs`

Menampilkan 100 log terbaru dari aktivitas sistem. Setiap log mencatat:

| Kolom | Isi |
|---|---|
| Waktu | Timestamp aktivitas (format: dd MMM yyyy, HH:mm:ss) |
| Pelaku (Actor) | Siapa yang melakukan aksi |
| Aktivitas | Jenis aksi: `ADD_ROLE`, `REMOVE_ROLE`, `VERIFY_QR` |
| Detail Metadata | Informasi tambahan (nama member, sisa sesi, role yang diubah) |

**Aktivitas yang dicatat:**
- `ADD_ROLE` — Saat Admin memberikan role baru ke user.
- `REMOVE_ROLE` — Saat Admin mencabut role dari user.
- `VERIFY_QR` — Saat Trainer berhasil memverifikasi QR absensi member.

---

## 🟣 Panduan Role: Trainer

Trainer bertanggung jawab untuk memverifikasi kehadiran member melalui QR scan.

### Menu Navigasi Trainer

| Menu | Path | Fungsi |
|---|---|---|
| Overview | `/dashboard` | Statistik: member dibimbing, sesi bulan ini, total sesi |
| QR Absensi | `/dashboard/attendance` | Scanner QR untuk verifikasi kehadiran member |
| Sesi Latihan | `/dashboard/sessions` | Riwayat sesi yang diverifikasi oleh Trainer ini |

---

### T1. Dashboard Overview (Trainer)

**Path:** `/dashboard`

Dashboard Trainer menampilkan 3 kartu statistik:

| Kartu | Data |
|---|---|
| Member Dibimbing | Jumlah member yang di-assign ke Trainer ini |
| Sesi Scan Bulan Ini | Jumlah verifikasi QR yang dilakukan bulan ini |
| Total Sesi Sukses | Total keseluruhan verifikasi yang pernah dilakukan |

Di bawahnya terdapat:
- **Aktivitas Check-in Terbaru**: 5 riwayat scan terakhir (nama member, email, waktu).
- **Pemberitahuan Trainer**: Panduan singkat cara menggunakan QR scanner.

---

### T2. QR Absensi — Scanner (Trainer)

**Path:** `/dashboard/attendance`

**Fungsi:** Memindai QR Code member untuk mencatat kehadiran dan memotong kuota sesi.

**Cara Menggunakan:**

#### Mode Kamera Scanner:
1. Buka menu **QR Absensi** di sidebar.
2. Tab **Kamera Scanner** akan aktif secara default.
3. Klik **Aktifkan Kamera** jika kamera belum menyala.
4. Arahkan kamera ke QR Code yang ditampilkan di layar HP member.
5. Sistem akan otomatis:
   - Mendeteksi dan membaca token QR.
   - Memvalidasi token (belum expired, belum dipakai, member punya kuota).
   - Mencatat kehadiran di database.
   - Mengurangi 1 sesi dari kuota member.
   - Mencatat aksi di Audit Log.
6. Jika **berhasil**: Muncul layar hijau ✅ "Verifikasi Sukses" dengan info nama member dan sisa sesi.
7. Klik **Scan Kembali** untuk memindai member berikutnya.
8. Jika **gagal**: Muncul layar merah ⚠️ dengan pesan error spesifik. Klik **Coba Lagi**.

> 💡 **Penting:** Setelah scan berhasil, Trainer **tetap di halaman scanner** agar bisa langsung melanjutkan scan member lain tanpa harus navigasi ulang.

#### Mode Input Manual:
1. Klik tab **Input Manual**.
2. Minta member untuk menyebutkan/menyalin token QR mereka.
3. Tempel token di field input.
4. Klik tombol kirim (→).
5. Proses validasi sama seperti mode kamera.

**Kemungkinan Error Saat Scan:**

| Error | Penyebab |
|---|---|
| Token tidak ditemukan | QR sudah expired atau salah ketik |
| Token sudah digunakan | QR sudah pernah di-scan sebelumnya |
| Token kadaluarsa | QR sudah melewati batas waktu 30 detik |
| Member tidak memiliki kuota | Sisa sesi = 0, perlu perpanjangan oleh Admin |

---

### T3. Sesi Latihan (Trainer View)

**Path:** `/dashboard/sessions`

Menampilkan riwayat kehadiran **hanya untuk member yang di-scan oleh Trainer ini**. Kolom yang ditampilkan sama dengan Admin view.

---

## 🟢 Panduan Role: Member

Member menggunakan sistem untuk menampilkan QR Code saat datang latihan.

### Menu Navigasi Member

| Menu | Path | Fungsi |
|---|---|---|
| Overview | `/dashboard` | Statistik: sisa kuota, latihan bulan ini, total kehadiran |
| QR Absensi | `/dashboard/attendance` | Generate dan tampilkan QR Code untuk di-scan Trainer |
| Sesi Latihan | `/dashboard/sessions` | Riwayat kehadiran pribadi |

---

### M1. Dashboard Overview (Member)

**Path:** `/dashboard`

Dashboard Member menampilkan 3 kartu statistik:

| Kartu | Data |
|---|---|
| Sisa Kuota Sesi | Jumlah sesi latihan yang tersisa di paket aktif |
| Latihan Bulan Ini | Berapa kali sudah latihan di bulan berjalan |
| Total Kehadiran | Akumulasi kehadiran sepanjang waktu |

Di bawahnya terdapat:
- **Paket Aktif Anda**: Nama paket, tanggal kadaluarsa, dan progress bar kuota.
- **Riwayat Kehadiran Anda**: 5 kehadiran terakhir (tanggal, hari, nama trainer).

---

### M2. QR Absensi — Generate QR (Member)

**Path:** `/dashboard/attendance`

**Fungsi:** Menampilkan QR Code dinamis yang harus di-scan oleh Trainer untuk mencatat kehadiran.

**Cara Menggunakan:**

1. Buka menu **QR Absensi** di sidebar.
2. QR Code akan **otomatis ter-generate** saat halaman dibuka.
3. Tunjukkan layar HP Anda ke Trainer.
4. Trainer akan men-scan QR Code tersebut.

**Mekanisme Keamanan QR:**

| Aspek | Detail |
|---|---|
| Token | Dibuat secara kriptografis (CSPRNG 256-bit), bukan ID statis |
| TTL (Time To Live) | 30 detik — QR otomatis expired |
| Auto-Refresh | Setiap 30 detik, QR baru otomatis di-generate |
| Single-Use | Setiap QR hanya bisa di-scan 1 kali |
| Manual Refresh | Tombol "Perbarui Manual" tersedia di bawah countdown |

**Feedback Real-time Setelah Di-scan:**

Setelah Trainer berhasil men-scan QR Anda:
1. Halaman QR akan **otomatis berubah** menjadi layar sukses ✅.
2. Muncul pesan: *"Absensi Berhasil! Sisa sesi latihan Anda telah divalidasi oleh Trainer."*
3. Setelah **3 detik**, Anda otomatis diarahkan kembali ke halaman **Dashboard**.

> 💡 Mekanisme ini menggunakan *short-polling* setiap 2 detik untuk mendeteksi apakah QR Anda sudah di-scan.

---

### M3. Sesi Latihan (Member View)

**Path:** `/dashboard/sessions`

Menampilkan riwayat kehadiran **milik Anda sendiri**. Kolom: tanggal, waktu, nama trainer, metode check-in, dan status.

---

## Fitur Multi-Role & Role Switching

### Konsep

Satu akun bisa memiliki **lebih dari satu role** secara bersamaan. Contoh:
- Rigen: **TRAINER** + **MEMBER**
- Admin Gym: **ADMIN** + **TRAINER**
- Super User: **ADMIN** + **TRAINER** + **MEMBER**

### Cara Beralih Role

1. Jika akun Anda memiliki lebih dari 1 role, di **header bar** (pojok kanan atas) akan muncul tombol-tombol role.
2. Klik role yang ingin Anda aktifkan.
3. Dashboard dan menu sidebar akan **langsung berubah** sesuai role yang dipilih.
4. Role aktif menentukan:
   - Menu apa saja yang muncul di sidebar.
   - Data apa yang ditampilkan di dashboard.
   - Fitur apa yang bisa diakses.

### Aturan Multi-Role

| Aturan | Detail |
|---|---|
| Akses menu terbatas | Hanya menu sesuai role aktif yang muncul |
| Self check-in dilarang | Jika Anda Trainer + Member, Anda tidak bisa scan QR sendiri |
| Penambahan role ADMIN | Hanya bisa dilakukan oleh ADMIN lain |

---

## Alur QR Absensi (End-to-End)

Berikut alur lengkap proses absensi dari awal hingga selesai:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERSIAPAN (ADMIN)                             │
│                                                                 │
│  1. Admin membuat Master Paket (Tab Master Paket)               │
│  2. Admin mengaktifkan paket untuk member (Tab Langganan)       │
│  3. Member sekarang punya kuota sesi                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SAAT LATIHAN                                  │
│                                                                 │
│  4. Member buka app → Menu QR Absensi                           │
│  5. QR Code otomatis ter-generate (berlaku 30 detik)            │
│  6. Member tunjukkan layar ke Trainer                           │
│  7. Trainer buka app → Menu QR Absensi → Kamera Scanner         │
│  8. Trainer arahkan kamera ke QR Code member                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PROSES BACKEND (OTOMATIS)                    │
│                                                                 │
│  9.  Validasi token QR (tidak expired, belum dipakai)           │
│  10. Validasi member punya kuota sesi aktif                     │
│  11. BEGIN TRANSACTION:                                         │
│      a. Tandai token QR sebagai "used"                          │
│      b. Buat record Attendance baru                             │
│      c. Kurangi remainingSessions member sebanyak 1             │
│      d. Catat di AuditLog                                       │
│  12. COMMIT TRANSACTION                                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HASIL                                         │
│                                                                 │
│  13. Trainer: Layar hijau "Verifikasi Sukses" + info member     │
│      → Klik "Scan Kembali" untuk lanjut scan member lain        │
│  14. Member: Layar otomatis berubah "Absensi Berhasil!"         │
│      → Auto-redirect ke Dashboard setelah 3 detik               │
│  15. Dashboard member terupdate (sisa kuota berkurang 1)        │
│  16. Admin bisa melihat log di Audit Log                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deployment ke Vercel

### Konfigurasi Wajib

| Setting | Value |
|---|---|
| Framework Preset | **Next.js** |
| Root Directory | **web** |
| Build Command | `prisma generate && next build` (otomatis dari package.json) |
| Node.js Version | 18.x atau 20.x |

### Langkah Deploy

1. Push code ke GitHub repository.
2. Buka [vercel.com](https://vercel.com) → Import repository.
3. Set **Root Directory** ke `web`.
4. Set **Framework Preset** ke `Next.js`.
5. Tambahkan semua environment variables (lihat bagian berikutnya).
6. Klik **Deploy**.

---

## Environment Variables

Buat file `.env` di folder `web/` dengan variabel berikut:

```env
# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Database (gunakan pooled connection untuk Vercel)
DATABASE_URL="postgresql://user:pass@db.xxx.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@db.xxx.supabase.co:5432/postgres"
```

> ⚠️ **Penting:** Untuk deployment Vercel, gunakan port `6543` (pgBouncer) pada `DATABASE_URL`, bukan port `5432` langsung. Ini mencegah exhaustion connection pool pada environment serverless.

---

## FAQ & Troubleshooting

### Q: Halaman menampilkan 404 setelah deploy di Vercel?
**A:** Pastikan **Root Directory** diset ke `web` dan **Framework Preset** diset ke `Next.js` di dashboard Vercel.

### Q: Member tidak bisa generate QR, muncul error "tidak memiliki paket aktif"?
**A:** Admin harus mengaktifkan paket latihan untuk member tersebut melalui tab **Langganan Member** di halaman Manajemen User.

### Q: QR Code expired terus?
**A:** QR berlaku 30 detik dan auto-refresh. Pastikan koneksi internet stabil. Member juga bisa klik "Perbarui Manual" untuk generate QR baru.

### Q: Trainer tidak bisa scan — kamera tidak muncul?
**A:** Fitur kamera membutuhkan HTTPS. Di localhost, kamera berjalan normal. Di production, pastikan domain menggunakan HTTPS (Vercel otomatis menyediakan ini).

### Q: Saya punya role Trainer + Member, bisa scan QR sendiri?
**A:** Tidak. Sistem memblokir self check-in untuk menjaga integritas data absensi.

### Q: Bagaimana cara menambah sesi member yang salah terpotong?
**A:** Admin bisa menambah sesi secara manual melalui tab **Langganan Member** → klik tombol **`+`** di kolom Kuota Sesi member yang bersangkutan.

### Q: Build error: "Cannot find module @prisma/client"?
**A:** Pastikan script build di `package.json` adalah `prisma generate && next build`. Ini memastikan Prisma Client ter-generate sebelum Next.js melakukan kompilasi.

### Q: Bagaimana cara install PWA di HP?
**A:** Buka URL aplikasi di browser HP → Ketuk menu (⋮) → Pilih "Add to Home Screen" atau "Install App". Aplikasi akan muncul di home screen layaknya app native.

---

## Struktur Folder Proyek

```
ptms-pwa/
├── SD_PTMS.md              # System Design Document (teknis)
├── README.md               # Panduan operasional ini
└── web/                    # Next.js application
    ├── prisma/
    │   └── schema.prisma   # Database schema
    ├── src/
    │   ├── app/
    │   │   ├── login/      # Halaman login
    │   │   ├── register/   # Halaman registrasi
    │   │   ├── dashboard/  # Dashboard utama
    │   │   │   ├── attendance/  # QR absensi (MemberQr + TrainerScanner)
    │   │   │   ├── users/       # Manajemen user (Admin only)
    │   │   │   ├── sessions/    # Riwayat sesi latihan
    │   │   │   └── logs/        # Audit log (Admin only)
    │   │   └── manifest.ts # PWA manifest
    │   └── lib/
    │       ├── actions/    # Server Actions (auth, qr, packages)
    │       ├── prisma.ts   # Prisma client singleton
    │       └── supabase/   # Supabase client helpers
    └── package.json
```

---

*Dokumen ini menjelaskan flow operasional PTMS Dev v1.0. Untuk dokumentasi teknis arsitektur dan database schema, lihat [SD_PTMS.md](./SD_PTMS.md).*
