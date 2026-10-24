
-- =========================================================
-- Kasir Warung Susu Murni — initial schema (PRD §7)
-- =========================================================

create extension if not exists pgcrypto;

-- ---------- profiles (extends auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null check (role in ('kasir','pemilik')),
  status_aktif boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.current_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------- tables (meja) ----------
create table public.tables (
  id uuid primary key default gen_random_uuid(),
  nomor int not null unique,
  status text not null default 'kosong' check (status in ('kosong','terisi')),
  created_at timestamptz not null default now()
);

-- ---------- menu ----------
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  urutan int not null default 0
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  harga numeric(12,0) not null check (harga >= 0),
  kategori_id uuid references public.menu_categories(id) on delete set null,
  status_aktif boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- shifts ----------
create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  kasir_id uuid not null references public.profiles(id),
  modal_awal numeric(12,0) not null,
  waktu_buka timestamptz not null default now(),
  kas_fisik_akhir numeric(12,0),
  waktu_tutup timestamptz,
  selisih numeric(12,0),
  status text not null default 'buka' check (status in ('buka','tutup'))
);

-- one open shift per kasir at a time
create unique index shifts_one_open_per_kasir
  on public.shifts (kasir_id)
  where (status = 'buka');

-- ---------- orders (tab per meja) ----------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  meja_id uuid not null references public.tables(id),
  shift_id uuid not null references public.shifts(id),
  dibuka_oleh uuid not null references public.profiles(id),
  status text not null default 'terbuka' check (status in ('terbuka','lunas')),
  dibuka_pada timestamptz not null default now(),
  ditutup_pada timestamptz
);

-- only one open order per table at a time
create unique index orders_one_open_per_meja
  on public.orders (meja_id)
  where (status = 'terbuka');

-- ---------- order items ----------
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id),
  nama_item text not null,
  harga_saat_itu numeric(12,0) not null,
  qty int not null default 1 check (qty > 0),
  status text not null default 'aktif' check (status in ('aktif','dibatalkan')),
  alasan_batal text,
  dicetak_dapur boolean not null default false,
  dibuat_pada timestamptz not null default now(),
  dibatalkan_oleh uuid references public.profiles(id),
  dibatalkan_pada timestamptz,
  constraint alasan_wajib_saat_batal check (status <> 'dibatalkan' or alasan_batal is not null)
);

-- ---------- payments ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  metode text not null check (metode in ('tunai','qris')),
  subtotal numeric(12,0) not null,
  diskon numeric(12,0) not null default 0,
  total numeric(12,0) not null,
  jumlah_dibayar numeric(12,0),
  kembalian numeric(12,0),
  kasir_id uuid not null references public.profiles(id),
  shift_id uuid not null references public.shifts(id),
  dibuat_pada timestamptz not null default now()
);

-- ---------- store settings (singleton) ----------
create table public.store_settings (
  id int primary key default 1,
  nama_warung text not null default 'Warung Susu Murni',
  alamat text,
  logo_url text,
  constraint singleton check (id = 1)
);
insert into public.store_settings (id) values (1);

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.profiles enable row level security;
alter table public.tables enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.shifts enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.store_settings enable row level security;

-- profiles: read own row, or all rows if pemilik. Writes go through service role (server actions) only.
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.current_role() = 'pemilik');

-- tables: any authenticated staff can read/write (both roles operate the floor)
create policy "tables_rw" on public.tables
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- menu: everyone authenticated can read; only pemilik can write
create policy "menu_categories_select" on public.menu_categories
  for select using (auth.role() = 'authenticated');
create policy "menu_categories_write" on public.menu_categories
  for all using (public.current_role() = 'pemilik') with check (public.current_role() = 'pemilik');

create policy "menu_items_select" on public.menu_items
  for select using (auth.role() = 'authenticated');
create policy "menu_items_write" on public.menu_items
  for all using (public.current_role() = 'pemilik') with check (public.current_role() = 'pemilik');

-- shifts: kasir sees/opens/closes own shift; pemilik sees all
create policy "shifts_select" on public.shifts
  for select using (public.current_role() = 'pemilik' or kasir_id = auth.uid());
create policy "shifts_insert" on public.shifts
  for insert with check (kasir_id = auth.uid());
create policy "shifts_update" on public.shifts
  for update using (kasir_id = auth.uid()) with check (kasir_id = auth.uid());

-- orders / order_items: any authenticated staff can operate the floor
create policy "orders_rw" on public.orders
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "order_items_rw" on public.order_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- payments: kasir sees own transactions; pemilik sees all
create policy "payments_select" on public.payments
  for select using (public.current_role() = 'pemilik' or kasir_id = auth.uid());
create policy "payments_insert" on public.payments
  for insert with check (kasir_id = auth.uid());

-- store settings: everyone authenticated reads; only pemilik writes
create policy "store_settings_select" on public.store_settings
  for select using (auth.role() = 'authenticated');
create policy "store_settings_update" on public.store_settings
  for update using (public.current_role() = 'pemilik') with check (public.current_role() = 'pemilik');
