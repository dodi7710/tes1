# Kasir Warung Susu Murni

Aplikasi kasir web (PWA) untuk warung susu murni dine-in dengan sistem meja. Lihat [docs/PRD.md](docs/PRD.md) untuk kebutuhan produk dan [docs/TASKS.md](docs/TASKS.md) untuk status implementasi per fase.

Stack: Next.js (App Router, PWA) + Supabase (Auth/DB) + Vercel (hosting) + GitHub.

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). File `.env.local` (tidak masuk git) sudah berisi kredensial project Supabase `kasir-susu-murni` — lihat `.env.example` untuk daftar variabel yang dibutuhkan.

Login pertama: pilih "Pemilik" di layar login, PIN `123456`. **Ganti PIN ini dari menu Pengaturan setelah login pertama kali.**

## Variabel lingkungan

| Variabel | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable/anon key — aman untuk browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret key — server-only, dipakai untuk fitur kelola akun kasir (AUTH-3). Ambil dari Supabase Dashboard > Project Settings > API Keys > secret key. **Jangan pernah expose ke client.** |

Saat deploy ke Vercel, isi ketiga variabel ini juga di Project Settings > Environment Variables.

## Menghubungkan Vercel

Repo ini belum tersambung ke Vercel untuk auto-deploy (GitHub App Vercel perlu diotorisasi manual). Langkah:

1. Install/otorisasi [Vercel GitHub App](https://github.com/apps/vercel) untuk repo ini.
2. Di [Vercel dashboard](https://vercel.com/new), import repo `dodi7710/tes1`.
3. Tambahkan tiga env var di atas ke project Vercel.
4. Deploy — setiap push ke `main` akan auto-deploy setelahnya.

## Yang masih perlu diuji di perangkat asli

Bagian ini tidak bisa diverifikasi dari lingkungan development biasa:

- **Cetak Bluetooth** (tiket dapur & struk): kode di [src/lib/print/bluetooth.ts](src/lib/print/bluetooth.ts) mencari characteristic GATT yang bisa ditulis secara generik (printer thermal murah tidak punya UUID service yang seragam) — coba sambungkan ke printer asli dan pastikan ketemu, lalu cek hasil cetak (lebar kertas, potong kertas).
- **Install ke home screen** di tablet Android (Chrome) — manifest & service worker sudah disiapkan tapi perlu dicoba di perangkat fisik.
- Ikon PWA di `public/icons/icon.svg` masih placeholder — ganti dengan logo warung yang sebenarnya (idealnya tambahkan versi PNG 192x192 & 512x512 untuk kompatibilitas browser yang lebih luas).

Detail lengkap ada di [docs/TASKS.md](docs/TASKS.md) bagian Phase 10.
