-- MENU-4: foto produk. Jalankan sekali di Supabase Dashboard > SQL Editor.
alter table public.menu_items add column if not exists foto_url text;

-- Bucket publik-baca untuk foto produk. Unggah/hapus dilakukan server action
-- dengan service role (setelah cek peran pemilik), jadi tidak perlu policy tulis.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produk', 'produk', true, 1048576, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;
