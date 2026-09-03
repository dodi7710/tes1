# Task List: Kasir Warung Susu Murni

Implementation plan derived from [`docs/PRD.md`](PRD.md). Work phase by phase, in order — each phase builds on data/UI the previous one created. Requirement IDs in parentheses (e.g. `AUTH-1`) map back to PRD §5 for traceability; check them off there too when done.

Stack: Next.js (PWA) + Supabase (auth/DB) + Vercel (hosting) + GitHub (source control / CI-CD), per PRD §8.

---

## Phase 0 — Project Setup

- [x] Init Next.js app (TypeScript, App Router) in this repo
- [ ] Connect repo to Vercel for auto-deploy on push to `main`
- [x] Create Supabase project; store `SUPABASE_URL` / `SUPABASE_ANON_KEY` in `.env.local` and Vercel env vars — project `kasir-susu-murni` live, `.env.local` set; Vercel env vars pending Vercel connection
- [x] Add PWA manifest + service worker + icons so the app is installable on a tablet home screen (NFR: Platform) — icon is a placeholder SVG, swap for a designed PNG before launch
- [x] Base layout: landscape-first responsive shell sized for 8–11" tablets, Bahasa Indonesia strings, Rupiah formatter (thousands separator, no decimals)

## Phase 1 — Database Schema (Supabase)

- [x] Create tables per PRD §7: `users`, `tables`, `menu_items`, `orders`, `order_items`, `payments`, `shifts` — implemented as `profiles` (extends `auth.users`), `tables`, `menu_categories`, `menu_items`, `orders`, `order_items`, `payments`, `shifts`, `store_settings`
- [x] `order_items` includes `status` (aktif/dibatalkan) and `alasan_batal` for the mandatory void reason (`MEJA-3`) — enforced with a check constraint
- [x] Row-level security: `kasir` role vs `pemilik` role (pemilik-only tables: `menu_items` writes, cross-cashier reports)
- [x] Seed script: sample menu items (a few categories), sample tables numbered 1–10

## Phase 2 — Auth & Roles (`AUTH-1`, `AUTH-2`, `AUTH-3`)

- [x] PIN entry screen (4–6 digit numeric keypad UI, no username field) — staff picker + PIN pad at `/login`
- [x] PIN stored hashed, never plain text (NFR: Keamanan data) — delegated to Supabase Auth (bcrypt), synthetic per-profile email so no username is needed
- [x] Session/role context distinguishing Kasir vs Pemilik; route guards on pemilik-only screens — `middleware.ts` + `lib/auth/session.ts`
- [ ] Pemilik screen: add/deactivate kasir accounts, reset a kasir's PIN — first `pemilik` account bootstrapped directly (PIN `123456`, change on first login); in-app management screen still to build

## Phase 3 — Menu Management (`MENU-1`, `MENU-2`)

- [ ] Pemilik-only CRUD: menu item name, price, category, active/inactive toggle
- [ ] Categorized menu picker for the order screen (e.g. Minuman Susu, Snack)

## Phase 4 — Table & Order Flow (`MEJA-1`–`MEJA-4`)

- [ ] Table overview (1–10 tables) showing status: kosong / terisi
- [ ] Open a tab on a table → creates an `orders` row (status: terbuka)
- [ ] Add items to an open tab any time while it's open → `order_items` rows
- [ ] Edit/cancel an item after its kitchen ticket has printed **requires a reason**, saved to `alasan_batal` (`MEJA-3`)
- [ ] Closing a tab (after payment, Phase 6) sets the table back to kosong automatically (`MEJA-4`)

## Phase 5 — Kitchen Ticket Printing (`CETAK-1`)

- [ ] Web Bluetooth pairing flow for an ESC/POS thermal printer (Chrome/Android only — see PRD §9 risk)
- [ ] Kitchen ticket template: table number, items + qty, timestamp
- [ ] Auto-print fires the moment new item(s) are saved to an order — no manual "send to kitchen" step
- [ ] Visible error state if the printer is unpaired/unreachable, with a manual reprint action

## Phase 6 — Payment & Discount (`BAYAR-1`–`BAYAR-3`)

- [ ] Bill screen: sums all active items on a table's open tab
- [ ] Manual discount entry (nominal or percent) applied before finalizing
- [ ] Cash flow: input amount tendered → auto-computed change
- [ ] QRIS flow: kasir marks the order paid via QRIS (no gateway — manual confirmation, PRD §9 risk #2)
- [ ] On payment success: create `payments` row, set `orders.status = lunas`

## Phase 7 — Receipt Printing (`CETAK-2`)

- [ ] Store settings screen (pemilik): warung name, address, logo upload
- [ ] Receipt template: name/address/logo, table number, cashier name, item list, total, change — concise layout
- [ ] Auto-print triggers immediately after payment is recorded

## Phase 8 — Shift Management (`SHIFT-1`–`SHIFT-3`)

- [ ] Open-shift flow: kasir enters starting cash before the first transaction; block transactions until a shift is open
- [ ] All cash transactions attribute to the currently open shift
- [ ] Close-shift flow: kasir enters counted physical cash; system shows discrepancy vs (starting cash + recorded cash sales)
- [ ] Pemilik view: full shift history (who, when, discrepancy) across all kasir

## Phase 9 — Reports (`LAP-1`–`LAP-5`)

- [ ] Revenue totals: daily / weekly / monthly (`LAP-1`)
- [ ] Best-selling menu items by quantity and revenue (`LAP-2`)
- [ ] Payment-method breakdown, tunai vs QRIS, by period (`LAP-3`)
- [ ] Per-kasir/per-shift transaction history, including the void/edit audit log (`LAP-4`)
- [ ] Per-table revenue and transaction count per day (`LAP-5`)

## Phase 10 — PWA Polish & QA

- [ ] Verify install-to-home-screen works on an actual Android tablet in Chrome
- [ ] End-to-end manual test: open table → order → kitchen ticket prints → pay → receipt prints → table clears
- [ ] Manual test: shift open → transactions → close → discrepancy math is correct
- [ ] Manual test: kasir role cannot reach menu management or cross-cashier reports
- [ ] Production deploy on Vercel; confirm env vars are set there too

---

## Explicitly out of scope — do not build

Per PRD §3/§10: raw-material stock tracking, split bill / merged tables, multi-branch support, member/loyalty program, automatic QRIS payment-gateway integration, card/EDC payment, customer debt (utang) tracking, WhatsApp digital receipts, Excel/PDF export. If any of these seem necessary while implementing, stop and check with the product owner before adding scope.
