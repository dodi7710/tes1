
-- Kitchen instructions per line item (e.g. "susu hangat", "gula sedikit")
alter table public.order_items add column catatan text;

-- Allow cancelling a whole open tab without payment (e.g. opened by mistake,
-- or the customer left without ordering) — mirrors the per-item void pattern:
-- a reason is required, and who/when is recorded for audit.
alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('terbuka', 'lunas', 'dibatalkan'));
alter table public.orders add column alasan_batal text;
alter table public.orders add column dibatalkan_oleh uuid references public.profiles(id);
alter table public.orders add column dibatalkan_pada timestamptz;
