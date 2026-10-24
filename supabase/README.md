# Database (Supabase)

Struktur database aplikasi. Untuk project Supabase baru, jalankan file di `migrations/` **berurutan** di Supabase Dashboard → SQL Editor:

1. `20260903000000_init_schema.sql` — tabel, fungsi `current_role()`, dan RLS
2. `20260903000001_seed_initial_data.sql` — 10 meja, 2 kategori, menu contoh
3. `20260904000000_add_item_notes_and_order_cancel.sql` — catatan item, batal pesanan
4. `20261024000000_foto_produk.sql` — kolom `foto_url` dan bucket foto `produk`
5. `20261024010000_pesanan_wa.sql` — pesanan WhatsApp, metode transfer, info pembayaran WA

File 1–3 dipulihkan dari riwayat sesi saat project lama (`surftxeqwktwdutuwgbb`) dibuat, dan cocok dengan `src/types/database.ts`.

Setelah itu:

- Isi `.env.local` (dan env Vercel) dengan URL, anon key, dan service role key project baru.
- Supabase Dashboard → Authentication → Providers → Email: ubah minimum panjang password ke 4 kalau PIN 4–5 digit mau dipakai (bawaan Supabase 6).
- Buat akun pemilik pertama:

  ```bash
  node --env-file=.env.local scripts/create-owner.mjs "Nama Pemilik" 123456
  ```

Perubahan skema berikutnya ditambahkan sebagai file baru di `migrations/`, jangan hanya dijalankan di SQL Editor.
