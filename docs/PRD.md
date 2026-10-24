# PRD: Aplikasi Kasir Susu Moerni

**Versi:** 1.2 — Draft
**Tanggal:** 24 Oktober 2026 (v1.0: 3 September 2026)
**Disusun untuk:** Pemilik Susu Moerni
**Nama brand:** Susu Moerni

Sistem kasir web (PWA) untuk Susu Moerni, warung susu murni dine-in dengan meja — dari input pesanan di meja, tiket dapur otomatis, pembayaran, sampai laporan harian pemilik. Mulai v1.1 juga menangani **pesanan WhatsApp** (pelanggan pesan lewat WA, ambil sendiri): admin input pesanan, lalu mengirim rincian dan total ke WA pelanggan. Pembayaran pesanan WA dicatat manual oleh admin (QRIS / transfer / COD).

---

## 1. Ringkasan & Tujuan

Warung susu murni saat ini beroperasi dine-in dengan sistem meja: pelanggan duduk lebih dulu, memesan dari meja, menambah pesanan selama duduk, dan membayar di akhir — mirip restoran kecil. Pencatatan pesanan, tiket ke dapur, dan rekap penjualan perlu jadi satu alur digital yang cepat dioperasikan satu kasir di satu tablet, tanpa biaya operasional yang memberatkan warung kecil.

Selain dine-in, sebagian pelanggan memesan lewat WhatsApp (es lilin, susu botol, susu literan) dan mengambil pesanan sesuai janji. Saat ini rincian dan total dihitung manual lalu diketik ulang di chat. Pesanan ini perlu masuk ke sistem yang sama supaya tercatat di laporan.

### Tujuan Produk

- Kasir bisa mencatat pesanan per meja dan memprosesnya menjadi tiket dapur & struk pembayaran tanpa kertas manual.
- Admin bisa mencatat pesanan WhatsApp dan mengirim rincian + total ke pelanggan dengan satu tombol, tanpa menghitung dan mengetik ulang.
- Pemilik bisa melihat omzet, menu terlaris, dan rekap kas — tanpa rekap manual dari nota kertas.
- Kas harian bisa dicocokkan (uang fisik vs sistem) untuk menutup celah selisih/kecurangan.

### Indikator Keberhasilan

- **100% transaksi tercatat** — tidak ada penjualan yang hanya dicatat di kertas/ingatan kasir, termasuk pesanan WA.
- **Selisih kas ≈ Rp 0** — uang fisik saat tutup shift cocok dengan catatan sistem.
- **< 5 detik/pesanan** — waktu kasir menambah 1 item pesanan ke meja, dari buka menu sampai tersimpan.
- **< 1 menit/pesanan WA** — dari mulai input sampai rincian terkirim ke WA pelanggan (pesanan 5 item).
- **Laporan instan** — pemilik lihat omzet hari ini tanpa hitung manual, kapan saja dibutuhkan.

---

## 2. Pengguna & Peran

Dua peran, satu perangkat kasir (tablet), login dengan PIN.

**Kasir / Karyawan** — peran harian
Login pakai PIN 4–6 digit di awal shift. Membuka tab meja, input & ubah pesanan, input pesanan WA dan mengirimnya ke pelanggan, memproses pembayaran (tunai/QRIS), memberi diskon manual, mencetak struk, serta membuka dan menutup shift kasirnya sendiri. Tidak bisa mengubah data menu/harga/foto.

**Pemilik (admin)** — peran penuh
Semua hak Kasir, ditambah: kelola produk (nama, kategori, harga, foto), lihat seluruh laporan (semua kasir/shift, bukan hanya miliknya sendiri), lihat riwayat pembatalan/edit pesanan beserta alasannya, dan atur data toko (nama, alamat, logo untuk struk, alamat ambil pesanan, info pembayaran untuk pesan WA).

> **Catatan:** Login PIN dipilih karena cepat diketik ulang tiap pergantian shift di satu tablet bersama — bukan username/password per orang.

---

## 3. Lingkup Produk

Skala: 1 kasir, 1 lokasi, ±1–10 meja, <50 item produk, <50 transaksi/hari (dine-in + pesanan WA).

| Termasuk (MVP) | Tidak termasuk (lihat §10 Roadmap) |
|---|---|
| Kasir tunggal, satu lokasi, satu tablet | Multi-cabang / multi-kasir bersamaan |
| Produk sederhana (nama + 1 harga + foto); tiap rasa/ukuran dibuat sebagai produk sendiri | Varian bertingkat dalam satu produk, topping, paket bundling |
| Pesanan per meja, bayar belakangan | Split bill / pisah tagihan dalam satu meja |
| Pesanan WhatsApp (ambil sendiri) diinput admin, kirim rincian ke WA pelanggan | Pelanggan pesan sendiri lewat katalog online / chatbot WA, pengiriman/ongkir |
| Pembayaran tunai + QRIS + transfer, ditandai lunas manual; diskon manual | QRIS bernominal otomatis, integrasi gateway pembayaran, kartu/EDC, utang pelanggan |
| Cetak struk & tiket dapur via printer thermal Bluetooth | Layar tampilan dapur (kitchen display screen) |
| Buka/tutup shift dengan rekonsiliasi kas | Manajemen stok bahan baku (susu, gula, dll.) |
| Laporan penjualan, kas, meja, kanal (dine-in vs WA), dan per-kasir | Member/loyalti pelanggan |

> **Kenapa stok bahan baku di luar lingkup:** dikonfirmasi dengan pemilik — takaran bahan per gelas (mis. gula) sulit distandarkan, sehingga pelacakan stok otomatis tidak akurat untuk model warung ini. Stok tetap dikelola manual di luar sistem.

> **Kenapa tiap rasa/ukuran jadi produk sendiri:** tetap satu harga per produk, jadi alur input tetap cepat dan model data tidak berubah. Contoh: "Es Lilin Murni Manis", "Es Lilin Thai Tea", "Susu Botol 250 ml Avocado", "Susu Murni Tawar 1 L", "Susu Murni Manis 1 L". Pesanan "susu murni manis 2 liter" diinput sebagai Susu Murni Manis 1 L × 2.

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

### Pesanan WhatsApp (ambil sendiri)

1. **Pelanggan chat pesanan** — mis. "es lilin murni manis 3, es lilin thai tea 5, susu botol 250ml avocado 2, susu murni tawar 1 liter, susu murni manis 2 liter".
2. **Admin buka "Pesanan WA" → Pesanan baru** — input nomor WA pelanggan (nama dan waktu ambil opsional).
3. **Admin pilih produk dari grid berfoto** — ketuk produk untuk menambah, atur qty dengan tombol +/−. Total terhitung otomatis.
4. **Simpan** — pesanan tersimpan dengan kode unik (mis. `P-0012`) dan status *Menunggu bayar*.
5. **Tombol "Kirim ke WA"** — membuka WhatsApp ke nomor pelanggan dengan pesan rincian + total + info pembayaran yang sudah terisi. Admin tinggal tekan kirim.
6. **Pelanggan bayar** — lewat QRIS toko, transfer bank, atau COD (bayar tunai saat ambil).
7. **Admin centang "Sudah dibayar"** — pilih metode: QRIS, Transfer, atau COD. Untuk QRIS/transfer, admin cek dulu dana masuk di aplikasi merchant/mutasi. Status jadi *Lunas*.
8. **Pelanggan ambil pesanan** — admin tandai *Diambil*. Pesanan selesai.

Contoh pesan WA yang dibuat sistem (harga mengikuti daftar produk):

```
Halo Kak, ini rincian pesanannya ya 🙏
Pesanan P-0012 · 24 Okt 2026

Es Lilin Murni Manis x3 = Rp7.500
Es Lilin Thai Tea x5 = Rp12.500
Susu Botol 250 ml Avocado x2 = Rp20.000
Susu Murni Tawar 1 L x1 = Rp23.000
Susu Murni Manis 1 L x2 = Rp50.000
------------------------
Total: Rp113.000

Pembayaran: <info pembayaran dari pengaturan toko, mis. QRIS / rekening / COD>
Ambil di: <alamat ambil dari pengaturan toko>
Terima kasih, Susu Moerni 🥛
```

### Buka / Tutup Kasir (Shift)

1. **Buka shift** — kasir login PIN, input modal kas awal sebelum melayani transaksi pertama.
2. **Transaksi berjalan** — setiap transaksi tunai/QRIS (dine-in maupun pesanan WA) tercatat otomatis ke shift yang sedang aktif.
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

### 5.3 Manajemen Produk

| ID | Kebutuhan | Status |
|---|---|---|
| MENU-1 | Pemilik menambah/mengubah/menonaktifkan produk: nama + satu harga tetap | MVP |
| MENU-2 | Pengelompokan produk jadi kategori sederhana (mis. Es Lilin, Susu Botol, Susu Literan, Minuman Susu) | MVP |
| MENU-4 | Pemilik mengunggah satu foto per produk (dari kamera atau galeri tablet). Foto dikompres otomatis di perangkat (maks. ±800 px, WebP/JPEG ±200 KB) sebelum diunggah. Foto bisa diganti/dihapus; produk tanpa foto tampil dengan placeholder | MVP |
| MENU-5 | Foto tampil di grid pilih produk (meja & pesanan WA) dan di halaman kelola produk | MVP |
| MENU-3 | Varian bertingkat dalam satu produk, topping/add-on, paket bundling | Di luar lingkup |

### 5.4 Pembayaran & Diskon

| ID | Kebutuhan | Status |
|---|---|---|
| BAYAR-1 | Pembayaran tunai: input jumlah dibayar, sistem hitung kembalian otomatis | MVP |
| BAYAR-2 | Pembayaran QRIS: kasir tandai transaksi lunas via QRIS (bukan gateway otomatis) | MVP |
| BAYAR-3 | Diskon manual per transaksi (nominal atau persen) | MVP |
| BAYAR-5 | Pesanan WA: centang **Sudah dibayar** dengan pilihan metode QRIS / Transfer / COD (tunai saat ambil). Semua dicatat manual oleh admin; centang bisa dibatalkan selama pesanan belum diambil (tercatat di log) | MVP |
| BAYAR-4 | QRIS bernominal otomatis, integrasi gateway pembayaran, kartu debit/kredit (EDC), utang/bon pelanggan | Di luar lingkup (ditunda, lihat §10) |

### 5.5 Cetak Struk & Tiket Dapur

| ID | Kebutuhan | Status |
|---|---|---|
| CETAK-1 | Tiket dapur tercetak otomatis ke printer thermal Bluetooth setiap pesanan baru | MVP |
| CETAK-2 | Struk pembayaran ringkas: nama & alamat warung, logo, nomor meja, nama kasir, item, total, kembalian | MVP |
| CETAK-3 | Struk digital dine-in (kirim via WhatsApp) sebagai alternatif cetak fisik — memakai mekanisme yang sama dengan WA-3 | Fase 2 |
| CETAK-4 | Cetak manual tiket/struk untuk pesanan WA (opsional, tidak otomatis) | MVP |

### 5.6 Buka/Tutup Kasir (Rekonsiliasi Kas)

| ID | Kebutuhan | Status |
|---|---|---|
| SHIFT-1 | Kasir wajib input modal kas awal sebelum transaksi pertama pada shift | MVP |
| SHIFT-2 | Saat tutup shift, kasir input hasil hitung uang fisik; sistem tampilkan selisih | MVP |
| SHIFT-3 | Riwayat semua shift (siapa, kapan, selisih) dapat dilihat pemilik | MVP |
| SHIFT-4 | Pelunasan pesanan WA tercatat ke shift aktif. COD (tunai) wajib ada shift aktif karena masuk laci kas; QRIS/transfer boleh tanpa shift dan tercatat tanpa shift | MVP |

### 5.7 Laporan

| ID | Kebutuhan | Status |
|---|---|---|
| LAP-1 | Total omzet per hari, minggu, dan bulan | MVP |
| LAP-2 | Peringkat produk terlaris berdasarkan jumlah terjual dan pendapatan | MVP |
| LAP-3 | Rekap total per metode pembayaran (tunai/COD, QRIS, transfer) per periode | MVP |
| LAP-4 | Riwayat transaksi per kasir/shift, termasuk log pembatalan/edit beserta alasannya | MVP |
| LAP-5 | Total transaksi & omzet per meja per hari | MVP |
| LAP-7 | Rekap per kanal (dine-in vs pesanan WA) dan daftar pesanan WA belum lunas / belum diambil | MVP |
| LAP-6 | Ekspor laporan ke Excel/PDF | Fase 2 |

### 5.8 Pesanan WhatsApp

| ID | Kebutuhan | Status |
|---|---|---|
| WA-1 | Buat pesanan WA: nomor WA pelanggan (wajib), nama pelanggan dan waktu ambil (opsional), catatan (opsional). Nomor dinormalkan otomatis: `0851…` / `+62 851…` / `62851…` → `62851…`; nomor tidak valid ditolak | MVP |
| WA-2 | Pilih produk dari grid berfoto dengan pencarian nama; qty diatur dengan +/−; subtotal per baris dan total tampil langsung. Diskon manual (BAYAR-3) berlaku juga | MVP |
| WA-3 | Tombol **Kirim ke WA**: membuka `https://wa.me/<nomor>?text=<pesan>` (aplikasi WhatsApp di tablet, atau WhatsApp Web) dengan pesan rincian item, qty, subtotal, total, info pembayaran, dan alamat ambil. Admin tetap menekan kirim sendiri di WhatsApp | MVP |
| WA-5 | Status pesanan: *Menunggu bayar* → *Lunas* → *Diambil*, atau *Batal* (wajib alasan). Lunas lewat centang Sudah dibayar (BAYAR-5) | MVP |
| WA-6 | Daftar pesanan WA dengan filter status dan tanggal; ketuk pesanan untuk lihat, ubah (selama belum lunas), kirim ulang ke WA, atau tandai lunas/diambil | MVP |
| WA-7 | Edit pesanan setelah dikirim ke pelanggan memperbarui total; perubahan tercatat di log (siapa, kapan). Admin kirim ulang rincian baru lewat Kirim ke WA | MVP |
| WA-8 | Pelanggan menyusun pesanan sendiri lewat katalog online, atau pesanan WA masuk otomatis (WhatsApp Business API / chatbot) | Di luar lingkup |

---

## 6. Kebutuhan Non-Fungsional

| Aspek | Ketentuan |
|---|---|
| Platform | Web app, dapat di-install sebagai PWA ke home screen tablet |
| Perangkat target | Tablet (disarankan Android — lihat §9), layar 8–11", landscape |
| Konektivitas | Internet warung stabil → aplikasi online-only diterima; tidak perlu mode offline/sinkronisasi |
| Bahasa & mata uang | Bahasa Indonesia, Rupiah (format ribuan titik, tanpa desimal) |
| Biaya operasional | Prioritas layanan cloud tier gratis — lihat §8 |
| Kecepatan | Aksi kasir merespons < 1 detik pada koneksi normal; grid produk berfoto tetap < 1 detik (foto kecil, lazy-load) |
| Keamanan data | PIN tidak disimpan sebagai teks polos; setiap aksi hapus/edit tercatat dengan nama kasir & waktu; nomor WA pelanggan hanya terlihat oleh pengguna yang login |

---

## 7. Model Data (Ringkas)

Entitas inti untuk memandu desain database — bukan skema final.

| Entitas | Field kunci |
|---|---|
| `users` | id, nama, pin_hash, peran (kasir/pemilik), status_aktif |
| `tables` | id, nomor_meja, status (kosong/terisi) |
| `menu_items` | id, nama, kategori, harga, **foto_url**, status_aktif |
| `orders` | id, **jenis (dine_in/wa)**, meja_id (null untuk WA), **kode, no_wa, nama_pelanggan, waktu_ambil, catatan**, dibuka_oleh, dibuka_pada, status (terbuka/menunggu_bayar/lunas/diambil/batal), ditutup_pada |
| `order_items` | id, order_id, menu_item_id, qty, harga_saat_itu, status (aktif/dibatalkan), alasan_batal |
| `payments` | id, order_id, metode (tunai/qris/transfer; COD dicatat sebagai tunai), jumlah_dibayar, diskon, kembalian, kasir_id, shift_id (boleh null untuk QRIS/transfer pesanan WA), waktu |
| `shifts` | id, kasir_id, modal_awal, waktu_buka, kas_fisik_akhir, waktu_tutup, selisih |
| `store_settings` | nama, alamat, logo_url, **alamat_ambil, info_pembayaran_wa** |

> Pesanan WA memakai tabel `orders` yang sama (dibedakan kolom `jenis`) supaya laporan omzet, produk terlaris, dan metode bayar tidak perlu dihitung dari dua sumber.

---

## 8. Rekomendasi Teknis

Stack yang sudah diputuskan: **GitHub, Supabase, Vercel** — semua di tier gratis, selaras dengan skala 1 tablet/1 lokasi.

- **Source control — GitHub:** menyimpan kode aplikasi; setiap push ke branch utama memicu deploy otomatis ke Vercel (CI/CD tanpa langkah manual).
- **Frontend — Web app PWA** (mis. Next.js): installable ke home screen, satu codebase untuk browser tablet manapun. Tanpa perlu publish ke Play Store/App Store.
- **Backend + DB — Supabase (tier gratis):** cukup untuk skala <50 transaksi/hari; menyediakan autentikasi, database Postgres, dan API tanpa server terpisah.
- **Foto produk — Supabase Storage (tier gratis, 1 GB):** bucket publik-baca untuk foto produk; unggah hanya oleh pemilik. Dengan foto ±200 KB, 50 produk ≈ 10 MB.
- **Hosting — Vercel (tier gratis):** untuk frontend, terhubung langsung ke repo GitHub.
- **Kirim WA — link `wa.me`:** gratis, tanpa API/akun bisnis. Konsekuensinya admin tetap menekan kirim manual, dan hanya teks yang bisa diisi otomatis (gambar QRIS toko, kalau perlu, dikirim admin sendiri di chat).
- **Cetak thermal:** koneksi ke printer thermal Bluetooth dari browser via Web Bluetooth API (didukung Chrome di Android). Ini menentukan pilihan tablet — lihat risiko di §9.

> **Batas tier gratis:** Supabase free tier menjeda project otomatis setelah ~1 minggu tanpa aktivitas (perlu dibuka ulang manual dari dashboard) dan membatasi penyimpanan/koneksi — cukup longgar untuk skala warung ini, tapi pantau kalau transaksi tumbuh jauh lebih besar dari perkiraan §3.

---

## 9. Risiko & Asumsi

**Risiko #1 — Tablet iPad tidak kompatibel cetak Bluetooth**
Safari/iPadOS tidak mendukung Web Bluetooth API, sehingga cetak struk & tiket dapur otomatis tidak akan berfungsi di iPad. **Rekomendasi: gunakan tablet Android.** Jika iPad tetap dipakai, cetak butuh aplikasi pendamping tambahan (di luar lingkup MVP).

**Risiko #2 — QRIS/transfer dicatat manual**
Karena tidak ada integrasi gateway pembayaran otomatis (§5.4), status "lunas QRIS/transfer" bergantung pada kejujuran input kasir. Mitigasi: laporan rekap per metode bayar (LAP-3) membantu pemilik melakukan spot-check dengan mutasi rekening/aplikasi merchant.

**Risiko #3 — Nomor WA salah ketik**
Rincian bisa terkirim ke orang lain. Mitigasi: validasi format nomor (WA-1) dan tampilkan nomor tujuan di layar sebelum tombol Kirim ke WA.

### Asumsi

- Nama brand: Susu Moerni. Alamat dan file logo akan diberikan pemilik sebelum rilis.
- Tablet kasir terpasang WhatsApp (atau WhatsApp Business) dengan nomor toko, atau memakai WhatsApp Web.
- Satu tablet fisik digunakan bergantian oleh kasir dalam satu lokasi — tidak ada dua tablet aktif bersamaan.
- Printer thermal Bluetooth kompatibel ESC/POS akan disediakan pemilik sebelum go-live.
- Harga produk dianggap tetap sepanjang hari (tidak ada perbedaan harga jam tertentu/happy hour) untuk versi MVP.

---

## 10. Roadmap

MVP mencakup seluruh alur inti di §5. Fitur berikut disengaja ditunda.

- **Fase 2** — Struk digital dine-in via WhatsApp: alternatif/pelengkap cetak fisik (memakai mekanisme WA-3).
- **Fase 2** — Ekspor laporan Excel/PDF: untuk pembukuan atau pelaporan pajak.
- **Ditunda** — QRIS bernominal otomatis (konversi QRIS statis, atau gateway resmi seperti Midtrans/Xendit dengan status lunas otomatis lewat webhook). Untuk sekarang pembayaran dicatat manual (BAYAR-5).
- **Belum direncanakan** — Katalog online / pelanggan pesan sendiri, WhatsApp Business API: input tetap oleh admin selama volume pesanan WA masih kecil.
- **Belum direncanakan** — Manajemen stok bahan baku: ditunda tanpa tenggat, sulit distandarkan per gelas.
- **Belum direncanakan** — Multi-cabang, split bill, member/loyalti: tidak relevan pada skala usaha saat ini.

---

## Riwayat Perubahan

- **v1.2 (24 Okt 2026)** — Brand ditetapkan: Susu Moerni. QRIS bernominal dan halaman bayar publik ditunda; pembayaran pesanan WA dicatat manual dengan centang Sudah dibayar (QRIS / Transfer / COD).
- **v1.1 (24 Okt 2026)** — Tambah foto produk (MENU-4, MENU-5); tambah pesanan WhatsApp dengan tombol kirim rincian + total ke WA pelanggan (§4, §5.8); QRIS bernominal otomatis (BAYAR-5, §8, Risiko #3); laporan per kanal (LAP-7); model data `orders` dan `store_settings` diperluas.
- **v1.0 (3 Sep 2026)** — Draft awal.

---

*PRD v1.2 — Draft untuk didiskusikan dengan pemilik warung sebelum masuk tahap desain teknis.*
