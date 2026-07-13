# PTMS Dev — Panduan Penggunaan Aplikasi

> **Personal Trainer Management System** · Progressive Web App  
> Sistem absensi & manajemen sesi latihan personal trainer berbasis QR Code.

🔗 **Demo:** [https://ptms-pwa.vercel.app](https://ptms-pwa.vercel.app)

---

## Daftar Isi

1. [Tentang Aplikasi](#tentang-aplikasi)
2. [Cara Mendaftar & Login](#cara-mendaftar--login)
3. [Struktur Role & Hak Akses](#struktur-role--hak-akses)
4. [Panduan Role: Admin](#-panduan-role-admin)
5. [Panduan Role: Trainer](#-panduan-role-trainer)
6. [Panduan Role: Member](#-panduan-role-member)
7. [Fitur Multi-Role & Role Switching](#fitur-multi-role--role-switching)
8. [Alur QR Absensi (End-to-End)](#alur-qr-absensi-end-to-end)
9. [Install PWA di HP](#install-pwa-di-hp)
10. [FAQ](#faq)

---

## Tentang Aplikasi

PTMS Dev adalah platform untuk mengelola operasional personal training di gym/studio fitness. Fitur utama:

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

## Cara Mendaftar & Login

### Registrasi

1. Buka [https://ptms-pwa.vercel.app/register](https://ptms-pwa.vercel.app/register).
2. Isi formulir:
   - **Nama Lengkap** — Nama yang akan ditampilkan di sistem.
   - **Email** — Alamat email aktif Anda.
   - **Password** — Minimal 8 karakter.
   - **Konfirmasi Password** — Ketik ulang password yang sama.
3. Klik **Daftar**.
4. Akun berhasil dibuat dan Anda akan langsung diarahkan ke Dashboard.

### Login

1. Buka [https://ptms-pwa.vercel.app/login](https://ptms-pwa.vercel.app/login).
2. Masukkan **Email** dan **Password** yang sudah terdaftar.
3. Klik **Masuk**.

> 💡 Saat pertama kali membuka URL utama, Anda akan otomatis diarahkan ke halaman Login.

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

---

## 🔴 Panduan Role: Admin

Admin memiliki akses penuh ke seluruh sistem. Berikut adalah panduan operasional lengkap.

### Menu Navigasi Admin

| Menu | Fungsi |
|---|---|
| Overview | Statistik: total user, trainer aktif, absensi hari ini, sesi bulan ini |
| Manajemen User | Kelola role user, master paket, dan langganan member |
| Sesi Latihan | Lihat semua riwayat absensi seluruh member & trainer |
| Audit Log | Riwayat aktivitas: perubahan role, verifikasi QR |

---

### A1. Dashboard Overview

Saat login sebagai Admin, dashboard menampilkan 4 kartu statistik:

| Kartu | Data |
|---|---|
| Total Pengguna | Jumlah seluruh akun terdaftar di sistem |
| Trainer Aktif | Jumlah user yang memiliki role TRAINER |
| Absensi Hari Ini | Jumlah check-in yang terjadi hari ini |
| Sesi Bulan Ini | Total sesi latihan dari awal bulan berjalan |

---

### A2. Manajemen User — Tab "User & Role"

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

**Fungsi:** Mengaktifkan paket latihan untuk member dan mengelola kuota sesi mereka.

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

Admin melihat **seluruh** data kehadiran di sistem:

| Kolom | Isi |
|---|---|
| Tanggal & Waktu | Kapan check-in dilakukan |
| Member | Nama dan email member |
| Trainer | Nama trainer yang memverifikasi |
| Metode | `QR_SCAN` atau `MANUAL` |
| Status | `PRESENT` (Hadir) |

---

### A6. Audit Log

Menampilkan 100 log terbaru dari aktivitas sistem:

| Kolom | Isi |
|---|---|
| Waktu | Timestamp aktivitas |
| Pelaku (Actor) | Siapa yang melakukan aksi |
| Aktivitas | `ADD_ROLE`, `REMOVE_ROLE`, atau `VERIFY_QR` |
| Detail Metadata | Informasi tambahan (nama member, sisa sesi, role yang diubah) |

---

## 🟣 Panduan Role: Trainer

Trainer bertanggung jawab untuk memverifikasi kehadiran member melalui QR scan.

### Menu Navigasi Trainer

| Menu | Fungsi |
|---|---|
| Overview | Statistik: member dibimbing, sesi bulan ini, total sesi |
| QR Absensi | Scanner QR untuk verifikasi kehadiran member |
| Sesi Latihan | Riwayat sesi yang diverifikasi oleh Trainer ini |

---

### T1. Dashboard Overview

Dashboard Trainer menampilkan 3 kartu statistik:

| Kartu | Data |
|---|---|
| Member Dibimbing | Jumlah member yang di-assign ke Trainer ini |
| Sesi Scan Bulan Ini | Jumlah verifikasi QR bulan ini |
| Total Sesi Sukses | Total keseluruhan verifikasi |

Di bawahnya:
- **Aktivitas Check-in Terbaru**: 5 riwayat scan terakhir.
- **Pemberitahuan Trainer**: Panduan singkat penggunaan scanner.

---

### T2. QR Absensi — Scanner

**Fungsi:** Memindai QR Code member untuk mencatat kehadiran dan memotong kuota sesi.

#### Mode Kamera Scanner:
1. Buka menu **QR Absensi** di sidebar.
2. Tab **Kamera Scanner** akan aktif secara default.
3. Klik **Aktifkan Kamera** jika kamera belum menyala.
4. Arahkan kamera ke QR Code yang ditampilkan di layar HP member.
5. Sistem akan otomatis:
   - Membaca token QR.
   - Memvalidasi token (belum expired, belum dipakai, member punya kuota).
   - Mencatat kehadiran dan mengurangi 1 sesi dari kuota member.
6. Jika **berhasil**: Muncul layar hijau ✅ "Verifikasi Sukses" + info member dan sisa sesi.
7. Klik **Scan Kembali** untuk memindai member berikutnya.
8. Jika **gagal**: Muncul layar merah ⚠️ dengan pesan error. Klik **Coba Lagi**.

> 💡 Setelah scan berhasil, Trainer **tetap di halaman scanner** agar bisa langsung lanjut scan member lain.

#### Mode Input Manual:
1. Klik tab **Input Manual**.
2. Minta member untuk menyebutkan/menyalin token QR mereka.
3. Tempel token di field input, lalu klik tombol kirim (→).

**Kemungkinan Error Saat Scan:**

| Error | Penyebab |
|---|---|
| Token tidak ditemukan | QR sudah expired atau salah ketik |
| Token sudah digunakan | QR sudah pernah di-scan sebelumnya |
| Token kadaluarsa | QR sudah melewati batas waktu 30 detik |
| Member tidak memiliki kuota | Sisa sesi = 0, perlu perpanjangan oleh Admin |

---

### T3. Sesi Latihan (Trainer View)

Menampilkan riwayat kehadiran **hanya untuk member yang di-scan oleh Trainer ini**.

---

## 🟢 Panduan Role: Member

Member menggunakan sistem untuk menampilkan QR Code saat datang latihan.

### Menu Navigasi Member

| Menu | Fungsi |
|---|---|
| Overview | Statistik: sisa kuota, latihan bulan ini, total kehadiran |
| QR Absensi | Generate dan tampilkan QR Code untuk di-scan Trainer |
| Sesi Latihan | Riwayat kehadiran pribadi |

---

### M1. Dashboard Overview

Dashboard Member menampilkan 3 kartu statistik:

| Kartu | Data |
|---|---|
| Sisa Kuota Sesi | Jumlah sesi latihan yang tersisa |
| Latihan Bulan Ini | Berapa kali sudah latihan bulan ini |
| Total Kehadiran | Akumulasi kehadiran sepanjang waktu |

Di bawahnya:
- **Paket Aktif Anda**: Nama paket, tanggal kadaluarsa, dan progress bar kuota.
- **Riwayat Kehadiran Anda**: 5 kehadiran terakhir (tanggal, hari, nama trainer).

---

### M2. QR Absensi — Generate QR

**Fungsi:** Menampilkan QR Code dinamis yang harus di-scan oleh Trainer.

**Cara Menggunakan:**

1. Buka menu **QR Absensi** di sidebar.
2. QR Code akan **otomatis ter-generate** saat halaman dibuka.
3. Tunjukkan layar HP Anda ke Trainer.
4. Trainer akan men-scan QR Code tersebut.

**Fitur Keamanan QR:**

| Aspek | Detail |
|---|---|
| TTL (Time To Live) | 30 detik — QR otomatis expired dan diganti baru |
| Single-Use | Setiap QR hanya bisa di-scan 1 kali |
| Auto-Refresh | QR baru otomatis muncul setiap 30 detik |
| Manual Refresh | Tombol "Perbarui Manual" tersedia di bawah countdown |

**Feedback Real-time Setelah Di-scan:**

Setelah Trainer berhasil men-scan QR Anda:
1. Halaman QR akan **otomatis berubah** menjadi layar sukses ✅.
2. Muncul pesan: *"Absensi Berhasil! Sisa sesi latihan Anda telah divalidasi oleh Trainer."*
3. Setelah **3 detik**, Anda otomatis diarahkan kembali ke **Dashboard**.

---

### M3. Sesi Latihan (Member View)

Menampilkan riwayat kehadiran **milik Anda sendiri**: tanggal, waktu, nama trainer, metode, dan status.

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

### Aturan

| Aturan | Detail |
|---|---|
| Menu terbatas per role | Hanya menu sesuai role aktif yang muncul |
| Self check-in dilarang | Jika Anda Trainer + Member, Anda tidak bisa scan QR sendiri |
| Penambahan role ADMIN | Hanya bisa dilakukan oleh ADMIN lain |

---

## Alur QR Absensi (End-to-End)

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
│                    HASIL                                         │
│                                                                 │
│  9.  Trainer: Layar hijau "Verifikasi Sukses" + info member     │
│      → Klik "Scan Kembali" untuk lanjut scan member lain        │
│  10. Member: Layar otomatis berubah "Absensi Berhasil!"         │
│      → Auto-redirect ke Dashboard setelah 3 detik               │
│  11. Kuota sesi member berkurang 1 secara otomatis              │
│  12. Admin bisa melihat catatan di Audit Log                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Install PWA di HP

PTMS Dev bisa di-install di HP layaknya aplikasi native:

### Android (Chrome)
1. Buka [https://ptms-pwa.vercel.app](https://ptms-pwa.vercel.app) di Chrome.
2. Ketuk menu **⋮** (titik tiga) di pojok kanan atas.
3. Pilih **"Add to Home Screen"** atau **"Install App"**.
4. Aplikasi akan muncul di home screen.

### iPhone (Safari)
1. Buka [https://ptms-pwa.vercel.app](https://ptms-pwa.vercel.app) di Safari.
2. Ketuk ikon **Share** (kotak dengan panah ke atas).
3. Scroll dan pilih **"Add to Home Screen"**.
4. Ketuk **"Add"**.

---

## FAQ

**Q: Member tidak bisa generate QR, muncul error "tidak memiliki paket aktif"?**  
A: Admin harus mengaktifkan paket latihan untuk member tersebut melalui tab **Langganan Member** di halaman Manajemen User.

**Q: QR Code expired terus?**  
A: QR berlaku 30 detik dan auto-refresh. Pastikan koneksi internet stabil. Klik "Perbarui Manual" jika perlu.

**Q: Kamera tidak muncul saat Trainer ingin scan?**  
A: Fitur kamera membutuhkan HTTPS. Pastikan membuka via link demo resmi, bukan HTTP biasa.

**Q: Saya punya role Trainer + Member, bisa scan QR sendiri?**  
A: Tidak. Sistem memblokir self check-in untuk menjaga integritas data.

**Q: Sesi member salah terpotong, bagaimana cara koreksi?**  
A: Admin bisa menambah sesi secara manual melalui tab **Langganan Member** → klik tombol **`+`** di kolom Kuota Sesi.

**Q: Bagaimana cara install di HP?**  
A: Lihat bagian [Install PWA di HP](#install-pwa-di-hp) di atas.

---

*© 2026 Perpahmian.ltd — PTMS Dev v1.0*
