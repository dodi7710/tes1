-- PRD §5.8 Pesanan WhatsApp + BAYAR-5 pembayaran manual (QRIS / transfer / COD).
-- Pesanan WA memakai tabel orders yang sama (kolom jenis) supaya laporan
-- omzet, produk terlaris, dan metode bayar tetap dari satu sumber.

-- ---------- orders ----------
alter table public.orders
  add column jenis text not null default 'dine_in' check (jenis in ('dine_in', 'wa')),
  add column kode text unique,
  add column no_wa text,
  add column nama_pelanggan text,
  add column waktu_ambil text,
  add column catatan text,
  add column diubah_oleh uuid references public.profiles(id),
  add column diubah_pada timestamptz,
  add column diambil_oleh uuid references public.profiles(id),
  add column diambil_pada timestamptz;

-- Pesanan WA tidak punya meja, dan boleh dibuat di luar shift.
alter table public.orders alter column meja_id drop not null;
alter table public.orders alter column shift_id drop not null;

-- Kode pesanan WA berurutan: P-0001, P-0002, ...
create sequence public.orders_wa_kode_seq;

create or replace function public.set_wa_order_kode()
returns trigger
language plpgsql
as $$
begin
  if new.jenis = 'wa' and new.kode is null then
    new.kode := 'P-' || lpad(nextval('public.orders_wa_kode_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger orders_set_wa_kode
  before insert on public.orders
  for each row execute function public.set_wa_order_kode();

alter table public.orders add constraint orders_jenis_fields check (
  (jenis = 'dine_in' and meja_id is not null and shift_id is not null)
  or (jenis = 'wa' and no_wa is not null and kode is not null)
);

-- ---------- payments ----------
alter table public.payments drop constraint payments_metode_check;
alter table public.payments add constraint payments_metode_check
  check (metode in ('tunai', 'qris', 'transfer'));

-- QRIS/transfer pesanan WA boleh tanpa shift; tunai (termasuk COD) masuk
-- laci kas, jadi wajib tercatat ke shift supaya rekonsiliasi tetap benar.
alter table public.payments alter column shift_id drop not null;
alter table public.payments add constraint payments_tunai_butuh_shift
  check (metode <> 'tunai' or shift_id is not null);

-- Pemilik bisa membatalkan centang "Sudah dibayar" pesanan WA yang salah.
create policy "payments_delete" on public.payments
  for delete using (public.current_role() = 'pemilik');

-- ---------- store settings ----------
alter table public.store_settings
  add column alamat_ambil text,
  add column info_pembayaran_wa text;

update public.store_settings
set nama_warung = 'Susu Moerni'
where id = 1 and nama_warung = 'Warung Susu Murni';
