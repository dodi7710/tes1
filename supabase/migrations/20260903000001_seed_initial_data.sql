
-- 10 meja
insert into public.tables (nomor)
select generate_series(1, 10);

-- kategori menu
insert into public.menu_categories (nama, urutan) values
  ('Minuman Susu', 1),
  ('Snack', 2);

-- item menu contoh (harga bisa diubah pemilik nanti)
insert into public.menu_items (nama, harga, kategori_id, status_aktif)
select v.nama, v.harga, c.id, true
from (values
  ('Susu Murni Coklat Panas', 10000, 'Minuman Susu'),
  ('Susu Murni Coklat Dingin', 12000, 'Minuman Susu'),
  ('Susu Murni Original Panas', 9000, 'Minuman Susu'),
  ('Susu Murni Original Dingin', 11000, 'Minuman Susu'),
  ('Susu Murni Stroberi Dingin', 12000, 'Minuman Susu'),
  ('Roti Bakar Coklat', 13000, 'Snack'),
  ('Pisang Keju', 12000, 'Snack')
) as v(nama, harga, kategori)
join public.menu_categories c on c.nama = v.kategori;
