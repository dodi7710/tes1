# Task List: Kasir Warung Susu Murni

Implementation plan derived from [`docs/PRD.md`](PRD.md). Work phase by phase, in order — each phase builds on data/UI the previous one created. Requirement IDs in parentheses (e.g. `AUTH-1`) map back to PRD §5 for traceability; check them off there too when done.

Stack: Next.js (PWA) + Supabase (auth/DB) + Vercel (hosting) + GitHub (source control / CI-CD), per PRD §8.

---

## Phase 0 — Project Setup

- [x] Init Next.js app (TypeScript, App Router) in this repo
- [x] Connect repo to Vercel for auto-deploy on push to `main` — project `kasir-susu-murni` on team `test11-8db4`, linked to `dodi7710/tes1`, live at kasir-susu-murni.vercel.app
- [x] Create Supabase project; store `SUPABASE_URL` / `SUPABASE_ANON_KEY` in `.env.local` and Vercel env vars — project `kasir-susu-murni` live, `.env.local` set, Vercel env vars set (Config for the two `NEXT_PUBLIC_*`, Secret for `SUPABASE_SERVICE_ROLE_KEY`)
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
- [x] Pemilik screen: add/deactivate kasir accounts, reset a kasir's PIN — built at `/pengaturan`; first `pemilik` account bootstrapped directly (PIN `123456` — change it via the new "PIN saya" form on first login)

## Phase 3 — Menu Management (`MENU-1`, `MENU-2`)

- [x] Pemilik-only CRUD: menu item name, price, category, active/inactive toggle — `/menu`
- [x] Categorized menu picker for the order screen (e.g. Minuman Susu, Snack) — categories built; order-screen picker itself is Phase 4

## Phase 4 — Table & Order Flow (`MEJA-1`–`MEJA-4`)

- [x] Table overview (1–10 tables) showing status: kosong / terisi
- [x] Open a tab on a table → creates an `orders` row (status: terbuka)
- [x] Add items to an open tab any time while it's open → `order_items` rows
- [x] Edit/cancel an item after its kitchen ticket has printed **requires a reason**, saved to `alasan_batal` (`MEJA-3`)
- [x] Closing a tab (after payment, Phase 6) sets the table back to kosong automatically (`MEJA-4`)

Verified live: table grid → open table → add item → total updates → pay → table clears back to kosong. All correct end-to-end.

**Additions from post-launch user feedback:**
- Qty stepper + optional kitchen "catatan" (e.g. "gula sedikit", "tanpa es") on each order item, entered via a small panel when adding from the menu picker instead of the item auto-adding at qty 1 with no way to note anything. Catatan prints on the kitchen ticket. Schema: `order_items.catatan`.
- **New:** "Batalkan meja" — releases an open tab back to `kosong` without payment, with a required reason (mirrors the per-item void pattern). Fixes a real gap found from a user report: a table opened by mistake (or a customer who left without ordering) had no way to be released — it stayed `terisi` forever, since the only path back to `kosong` was through payment, which requires at least one active item. Schema: `orders.status` now also allows `'dibatalkan'`, plus `alasan_batal`/`dibatalkan_oleh`/`dibatalkan_pada` columns mirroring `order_items`. Logged in Laporan under "Log meja dibatalkan".

Verified live: cancelled a real stray open table with zero items, confirmed it returns to kosong; added a 2-qty item with a catatan and confirmed both the quantity and note reflect correctly in the order and would print on the kitchen ticket.

## Phase 5 — Kitchen Ticket Printing (`CETAK-1`)

- [x] Web Bluetooth pairing flow for an ESC/POS thermal printer (Chrome/Android only — see PRD §9 risk) — generic characteristic discovery in `lib/print/bluetooth.ts`, **not yet tested against a real printer**
- [x] Kitchen ticket template: table number, items + qty, timestamp, and per-item catatan when present — `lib/print/templates.ts`
- [x] Auto-print fires the moment new item(s) are saved to an order — no manual "send to kitchen" step
- [x] Visible error state if the printer is unpaired/unreachable, with a manual reprint action — verified live: adding an item with no printer connected correctly shows "belum tercetak" + a "Cetak sekarang" reprint action, and the top-bar printer badge goes red

**Needs real-hardware QA (Phase 10):** the BLE characteristic discovery in `bluetooth.ts` is generic (scans for the first writable characteristic) because cheap ESC/POS printers don't share one GATT UUID — confirm it actually finds the right characteristic on your specific printer model, and check the ESC/POS byte output prints cleanly (paper width, cut command).

## Phase 6 — Payment & Discount (`BAYAR-1`–`BAYAR-3`)

- [x] Bill screen: sums all active items on a table's open tab
- [x] Manual discount entry (nominal or percent) applied before finalizing — nominal only for now; percent can be added if wanted
- [x] Cash flow: input amount tendered → auto-computed change
- [x] QRIS flow: kasir marks the order paid via QRIS (no gateway — manual confirmation, PRD §9 risk #2)
- [x] On payment success: create `payments` row, set `orders.status = lunas`

Verified live with both tunai (change calc correct) and QRIS payments.

**Bug found & fixed post-launch (reported by the user on the live site):** on their device, "Modal awal" only ever saved as a tiny value (e.g. `Rp 22`) no matter what they typed — the native numeric keyboard's own "done"/checkmark key was submitting the form mid-entry, before all digits landed. All free-text Rupiah amount fields (modal awal, tutup shift, diskon, uang diterima) were replaced with an on-screen keypad component ([rupiah-keypad-input.tsx](../src/components/rupiah-keypad-input.tsx)) that never hands off to the device's own keyboard, so there's no native "submit" action to hit accidentally. Re-verified live: multi-digit entry now accumulates correctly on both the shift and payment forms. Also fixed a related stale-state bug found in the process — closing a shift then immediately opening a new one would flash the old "shift ditutup" summary instead of the new "shift sedang berjalan" panel.

**Bug found & fixed during QA:** Next.js auto-revalidates the current route after any Server Action call. The `/bayar` page originally hard-404'd once the order it was querying flipped to `lunas` mid-flow (racing the client's post-payment receipt-print step). Fixed by making the page branch on order status instead of 404ing, and moving the print-failure notice to a blocking `alert()` so it can't be wiped by the race. See [payment-form.tsx](../src/components/payment-form.tsx) and [bayar/page.tsx](../src/app/(app)/meja/[id]/bayar/page.tsx).

## Phase 7 — Receipt Printing (`CETAK-2`)

- [x] Store settings screen (pemilik): warung name, address — logo upload not built (would need file storage; deferred, receipt template supports a name/address header without it for now)
- [x] Receipt template: name/address, table number, cashier name, item list, total, change — concise layout — `lib/print/templates.ts`; logo omitted, see above
- [x] Auto-print triggers immediately after payment is recorded

## Phase 8 — Shift Management (`SHIFT-1`–`SHIFT-3`)

- [x] Open-shift flow: kasir enters starting cash before the first transaction; block transactions until a shift is open
- [x] All cash transactions attribute to the currently open shift
- [x] Close-shift flow: kasir enters counted physical cash; system shows discrepancy vs (starting cash + recorded cash sales)
- [x] Pemilik view: full shift history (who, when, discrepancy) across all kasir

Verified live: opened shift with Rp100.000 modal, ran a Rp12.000 cash sale, closed with Rp112.000 counted — selisih correctly computed as Rp0.

## Phase 9 — Reports (`LAP-1`–`LAP-5`)

- [x] Revenue totals: daily / weekly / monthly (`LAP-1`)
- [x] Best-selling menu items by quantity and revenue (`LAP-2`)
- [x] Payment-method breakdown, tunai vs QRIS, by period (`LAP-3`)
- [x] Per-kasir/per-shift transaction history, including the void/edit audit log (`LAP-4`) — per-kasir totals + a separate void log list; a literal per-shift-id breakdown can be added if wanted
- [x] Per-table revenue and transaction count per day (`LAP-5`)

Verified live against real test transactions — a tunai sale on meja 1 and a QRIS sale on meja 2 rolled up correctly into every total, the best-seller count, and the per-meja breakdown once viewed in a period range that covered both (they landed on opposite sides of a midnight boundary, which is what a "Hari ini" filter is supposed to do).

## Phase 10 — PWA Polish & QA

- [ ] Verify install-to-home-screen works on an actual Android tablet in Chrome — **cannot be verified from this environment; needs a real device**
- [x] End-to-end manual test: open table → order → pay → table clears — verified live (kitchen ticket + receipt *printing* itself still needs a real Bluetooth printer, see Phase 5 note)
- [x] Manual test: shift open → transactions → close → discrepancy math is correct — verified live
- [ ] Manual test: kasir role cannot reach menu management or cross-cashier reports — proxy.ts enforces this by role, but not re-verified live under an actual kasir-role login in this session
- [x] Production deploy on Vercel; confirm env vars are set there too — live at kasir-susu-murni.vercel.app, env vars set. Not yet re-verified live in production (only locally) that login/orders work against the deployed build — worth a quick click-through after this commit's redeploy lands.

---

## Explicitly out of scope — do not build

Per PRD §3/§10: raw-material stock tracking, split bill / merged tables, multi-branch support, member/loyalty program, automatic QRIS payment-gateway integration, card/EDC payment, customer debt (utang) tracking, WhatsApp digital receipts, Excel/PDF export. If any of these seem necessary while implementing, stop and check with the product owner before adding scope.
