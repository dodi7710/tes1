# PRD: Aplikasi Kasir Warung Susu Murni

**Versi:** 1.0 — Draft
**Tanggal:** 3 September 2026
**Disusun untuk:** Pemilik warung susu murni
**Nama brand:** TBD — belum final

Sistem kasir web (PWA) untuk warung susu murni dine-in dengan meja — dari input pesanan di meja, tiket dapur otomatis, pembayaran, sampai laporan harian pemilik.

---

## 1. Ringkasan & Tujuan

Warung susu murni saat ini beroperasi dine-in dengan sistem meja: pelanggan duduk lebih dulu, memesan dari meja, menambah pesanan selama duduk, dan membayar di akhir — mirip restoran kecil. Pencatatan pesanan, tiket ke dapur, dan rekap penjualan perlu jadi satu alur digital yang cepat dioperasikan satu kasir di satu tablet, tanpa biaya operasional yang memberatkan warung kecil.

### Tujuan Produk

- Kasir bisa mencatat pesanan per meja dan memprosesnya menjadi tiket dapur & struk pembayaran tanpa kertas manual.
- Pemilik bisa melihat omzet, menu terlaris, dan rekap kas — tanpa rekap manual dari nota kertas.
- Kas harian bisa dicocokkan (uang fisik vs sistem) untuk menutup celah selisih/kecurangan.

### Indikator Keberhasilan

- **100% transaksi tercatat** — tidak ada penjualan yang hanya dicatat di kertas/ingatan kasir.
- **Selisih kas ≈ Rp 0** — uang fisik saat tutup shift cocok dengan catatan sistem.
- **< 5 detik/pesanan** — waktu kasir menambah 1 item pesanan ke meja, dari buka menu sampai tersimpan.
- **Laporan instan** — pemilik lihat omzet hari ini tanpa hitung manual, kapan saja dibutuhkan.

---

## 2. Pengguna & Peran

Dua peran, satu perangkat kasir (tablet), login dengan PIN.

**Kasir / Karyawan** — peran harian
Login pakai PIN 4–6 digit di awal shift. Membuka tab meja, input & ubah pesanan, memproses pembayaran (tunai/QRIS), memberi diskon manual, mencetak struk, serta membuka dan menutup shift kasirnya sendiri. Tidak bisa mengubah data menu/harga.

**Pemilik** — peran penuh
Semua hak Kasir, ditambah: kelola menu & harga, lihat seluruh laporan (semua kasir/shift, bukan hanya miliknya sendiri), lihat riwayat pembatalan/edit pesanan beserta alasannya, dan atur data toko (nama, alamat, logo untuk struk).

> **Catatan:** Login PIN dipilih karena cepat diketik ulang tiap pergantian shift di satu tablet bersama — bukan username/password per orang.

---

## 3. Lingkup Produk

Skala: 1 kasir, 1 lokasi, ±1–10 meja, <15 item menu, <50 transaksi/hari.

| Termasuk (MVP) | Tidak termasuk (lihat §10 Roadmap) |
|---|---|
| Kasir tunggal, satu lokasi, satu tablet | Multi-cabang / multi-kasir bersamaan |
| Menu sederhana (nama + 1 harga, tanpa varian) | Varian rasa/ukuran, topping, paket bundling |
| Pesanan per meja, bayar belakangan | Split bill / pisah tagihan dalam satu meja |
| Pembayaran tunai + QRIS, diskon manual | Integrasi gateway QRIS otomatis, kartu/EDC, utang pelanggan |
| Cetak struk & tiket dapur via printer thermal Bluetooth | Layar tampilan dapur (kitchen display screen) |
| Buka/tutup shift dengan rekonsiliasi kas | Manajemen stok bahan baku (susu, gula, dll.) |
| Laporan penjualan, kas, meja, dan per-kasir | Member/loyalti pelanggan |

> **Kenapa stok bahan baku di luar lingkup:** dikonfirmasi dengan pemilik — takaran bahan per gelas (mis. gula) sulit distandarkan, sehingga pelacakan stok otomatis tidak akurat untuk model warung ini. Stok tetap dikelola manual di luar sistem.

---

## 4. Alur Penggunaan

### Siklus Satu Meja

1. **Pelanggan duduk di meja** — kasir membuka tab baru untuk nomor meja tersebut.
2. **Kasir input pesanan** — pilih item dari menu, tambahkan ke tab meja. Tab tetap terbuka selama pelanggan duduk.
3. **Tiket dapur tercetak otomatis** — setiap pesanan masuk, tiket langsung tercetak ke printer dapur, tanpa aksi tambahan dari kasir.
4. **Tambah pesanan (opsional)** — pelanggan bisa menambah pesanan kapan saja; tiket dapur baru tercetak untuk tambahan itu saja.
5. **Pelanggan minta bill** — kasir membuka tab meja, sistem menjumlahkan seluruh pesanan pada meja tersebut.
6. **Pembayaran** — kasir pilih tunai (dengan hitung kembalian otomatis) atau QRIS, terapkan diskon bila ada.
7. **Struk tercetak & meja ditutup** — struk lengkap tercetak, tab meja ditutup dan meja berstatus kosong kembali.

### Buka / Tutup Kasir (Shift)

1. **Buka shift** — kasir login PIN, input modal kas awal sebelum melayani transaksi pertama.
2. **Transaksi berjalan** — setiap transaksi tunai/QRIS tercatat otomatis ke shift yang sedang aktif.
3. **Tutup shift** — kasir hitung uang fisik di laci, input ke sistem. Sistem tampilkan selisih vs (modal awal + total tunai tercatat).

---

## 5. Kebutuhan Fungsional

Status: **MVP** (wajib rilis pertama) · **Fase 2** · **Di luar lingkup**

### 5.1 Autentikasi & Peran

| ID | Kebutuhan | Status |
|---|---|---|
| AUTH-1 | Login dengan PIN 4–6 digit per pengguna (kasir/pemilik) | MVP |
| AUTH-2 | Dua peran dengan hak akses berbeda: Kasir dan Pemilik | MVP |
| AUTH-3 | Pemilik bisa menambah/menonaktifkan akun kasir dan mengatur ulang PIN | MVP |

### 5.2 Manajemen Meja & Pesanan

| ID | Kebutuhan | Status |
|---|---|---|
| MEJA-1 | Tampilan denah/daftar meja (1–10 meja) dengan status: kosong / terisi | MVP |
| MEJA-2 | Buka tab pesanan per meja; tambah item kapan saja selama tab terbuka | MVP |
| MEJA-3 | Edit/batalkan item pesanan setelah tiket dapur tercetak wajib disertai alasan/catatan (audit) | MVP |
| MEJA-4 | Tutup tab meja otomatis setelah pembayaran selesai; meja kembali kosong | MVP |
| MEJA-5 | Gabung meja / pisah tagihan (split bill) | Di luar lingkup |

### 5.3 Manajemen Menu

| ID | Kebutuhan | Status |
|---|---|---|
| MENU-1 | Pemilik menambah/mengubah/menonaktifkan item menu: nama + satu harga tetap | MVP |
| MENU-2 | Pengelompokan menu jadi kategori sederhana (mis. Minuman Susu, Snack) | MVP |
| MENU-3 | Varian rasa/ukuran, topping/add-on, paket bundling | Di luar lingkup |

### 5.4 Pembayaran & Diskon

| ID | Kebutuhan | Status |
|---|---|---|
| BAYAR-1 | Pembayaran tunai: input jumlah dibayar, sistem hitung kembalian otomatis | MVP |
| BAYAR-2 | Pembayaran QRIS: kasir tandai transaksi lunas via QRIS (bukan gateway otomatis) | MVP |
| BAYAR-3 | Diskon manual per transaksi (nominal atau persen) | MVP |
| BAYAR-4 | Integrasi gateway QRIS otomatis, kartu debit/kredit (EDC), utang/bon pelanggan | Di luar lingkup |

### 5.5 Cetak Struk & Tiket Dapur

| ID | Kebutuhan | Status |
|---|---|---|
| CETAK-1 | Tiket dapur tercetak otomatis ke printer thermal Bluetooth setiap pesanan baru | MVP |
| CETAK-2 | Struk pembayaran ringkas: nama & alamat warung, logo, nomor meja, nama kasir, item, total, kembalian | MVP |
| CETAK-3 | Struk digital (kirim via WhatsApp) sebagai alternatif cetak fisik | Fase 2 |

### 5.6 Buka/Tutup Kasir (Rekonsiliasi Kas)

| ID | Kebutuhan | Status |
|---|---|---|
| SHIFT-1 | Kasir wajib input modal kas awal sebelum transaksi pertama pada shift | MVP |
| SHIFT-2 | Saat tutup shift, kasir input hasil hitung uang fisik; sistem tampilkan selisih | MVP |
| SHIFT-3 | Riwayat semua shift (siapa, kapan, selisih) dapat dilihat pemilik | MVP |

### 5.7 Laporan

| ID | Kebutuhan | Status |
|---|---|---|
| LAP-1 | Total omzet per hari, minggu, dan bulan | MVP |
| LAP-2 | Peringkat menu terlaris berdasarkan jumlah terjual dan pendapatan | MVP |
| LAP-3 | Rekap total per metode pembayaran (tunai vs QRIS) per periode | MVP |
| LAP-4 | Riwayat transaksi per kasir/shift, termasuk log pembatalan/edit beserta alasannya | MVP |
| LAP-5 | Total transaksi & omzet per meja per hari | MVP |
| LAP-6 | Ekspor laporan ke Excel/PDF | Fase 2 |

---

## 6. Kebutuhan Non-Fungsional

| Aspek | Ketentuan |
|---|---|
| Platform | Web app, dapat di-install sebagai PWA ke home screen tablet |
| Perangkat target | Tablet (disarankan Android — lihat §9), layar 8–11", landscape |
| Konektivitas | Internet warung stabil → aplikasi online-only diterima; tidak perlu mode offline/sinkronisasi |
| Bahasa & mata uang | Bahasa Indonesia, Rupiah (format ribuan titik, tanpa desimal) |
| Biaya operasional | Prioritas layanan cloud tier gratis — lihat §8 |
| Kecepatan | Aksi kasir merespons < 1 detik pada koneksi normal |
| Keamanan data | PIN tidak disimpan sebagai teks polos; setiap aksi hapus/edit tercatat dengan nama kasir & waktu |

---

## 7. Model Data (Ringkas)

Entitas inti untuk memandu desain database — bukan skema final.

| Entitas | Field kunci |
|---|---|
| `users` | id, nama, pin_hash, peran (kasir/pemilik), status_aktif |
| `tables` | id, nomor_meja, status (kosong/terisi) |
| `menu_items` | id, nama, kategori, harga, status_aktif |
| `orders` | id, meja_id, dibuka_oleh, dibuka_pada, status (terbuka/lunas), ditutup_pada |
| `order_items` | id, order_id, menu_item_id, qty, harga_saat_itu, status (aktif/dibatalkan), alasan_batal |
| `payments` | id, order_id, metode (tunai/qris), jumlah_dibayar, diskon, kembalian, kasir_id, waktu |
| `shifts` | id, kasir_id, modal_awal, waktu_buka, kas_fisik_akhir, waktu_tutup, selisih |

---

## 8. Rekomendasi Teknis

Stack yang sudah diputuskan: **GitHub, Supabase, Vercel** — semua di tier gratis, selaras dengan skala 1 tablet/1 lokasi.

- **Source control — GitHub:** menyimpan kode aplikasi; setiap push ke branch utama memicu deploy otomatis ke Vercel (CI/CD tanpa langkah manual).
- **Frontend — Web app PWA** (mis. Next.js): installable ke home screen, satu codebase untuk browser tablet manapun. Tanpa perlu publish ke Play Store/App Store.
- **Backend + DB — Supabase (tier gratis):** cukup untuk skala <50 transaksi/hari; menyediakan autentikasi, database Postgres, dan API tanpa server terpisah.
- **Hosting — Vercel (tier gratis):** untuk frontend, terhubung langsung ke repo GitHub.
- **Cetak thermal:** koneksi ke printer thermal Bluetooth dari browser via Web Bluetooth API (didukung Chrome di Android). Ini menentukan pilihan tablet — lihat risiko di §9.

> **Batas tier gratis:** Supabase free tier menjeda project otomatis setelah ~1 minggu tanpa aktivitas (perlu dibuka ulang manual dari dashboard) dan membatasi penyimpanan/koneksi — cukup longgar untuk skala warung ini, tapi pantau kalau transaksi tumbuh jauh lebih besar dari perkiraan §3.

---

## 9. Risiko & Asumsi

**Risiko #1 — Tablet iPad tidak kompatibel cetak Bluetooth**
Safari/iPadOS tidak mendukung Web Bluetooth API, sehingga cetak struk & tiket dapur otomatis tidak akan berfungsi di iPad. **Rekomendasi: gunakan tablet Android.** Jika iPad tetap dipakai, cetak butuh aplikasi pendamping tambahan (di luar lingkup MVP).

**Risiko #2 — QRIS dicatat manual**
Karena tidak ada integrasi gateway pembayaran otomatis (§5.4), status "lunas QRIS" bergantung pada kejujuran input kasir. Mitigasi: laporan rekap per metode bayar (LAP-3) membantu pemilik melakukan spot-check.

### Asumsi

- Nama & alamat warung, serta file logo, akan diberikan pemilik sebelum rilis (saat ini brand belum final).
- Satu tablet fisik digunakan bergantian oleh kasir dalam satu lokasi — tidak ada dua tablet aktif bersamaan.
- Printer thermal Bluetooth kompatibel ESC/POS akan disediakan pemilik sebelum go-live.
- Harga menu dianggap tetap sepanjang hari (tidak ada perbedaan harga jam tertentu/happy hour) untuk versi MVP.

---

## 10. Roadmap

MVP mencakup seluruh alur inti di §5. Fitur berikut disengaja ditunda.

- **Fase 2** — Struk digital via WhatsApp: alternatif/pelengkap cetak fisik.
- **Fase 2** — Ekspor laporan Excel/PDF: untuk pembukuan atau pelaporan pajak.
- **Belum direncanakan** — Manajemen stok bahan baku: ditunda tanpa tenggat, sulit distandarkan per gelas.
- **Belum direncanakan** — Multi-cabang, split bill, member/loyalti: tidak relevan pada skala usaha saat ini.

---

*PRD v1.0 — Draft untuk didiskusikan dengan pemilik warung sebelum masuk tahap desain teknis.*
