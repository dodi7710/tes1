# Design — Kasir Warung Susu

A locked design system for this app. Every page redesign reads this file
first; pages defer to it. Do not regenerate per page — extend or amend this
file when the system needs to grow.

## Genre
modern-minimal

A utilitarian tablet tool for daily commercial use (cashier + owner), not a
marketing surface. Confident sans display, restrained neutral-plus-one-accent
palette, functional two-zone layouts. Editorial / atmospheric / playful are
the wrong register for a POS kiosk used mid-service.

## Page-type families

This app has no marketing pages, so families are app-native rather than the
usual marketing/app/content split:

1. **Auth** — `/login`. Centered, symmetric staff-picker → PIN pad. The one
   deliberate exception to the asymmetry bias: this is a kiosk unlock
   ritual, not a content page.
2. **Dashboard-grid** — `/meja`. A uniform status grid of table tiles; tile
   size/weight may vary to signal state (occupied, order age, total).
3. **Transactional workbench** — `/meja/[id]`, `/meja/[id]/bayar`. Persistent
   split-panel: scrolling content zone (items, menu picker) + an
   always-visible summary/CTA rail. Replaces the old single centered column.
4. **CRUD/admin** — `/menu`, `/pengaturan` (+ its sub-forms), `/shift`'s
   open/close panel. List-first, inline-edit, no hero.
5. **Data/reports** — `/laporan`. Stat tiles lead, tables follow.

The shared TopBar/shell is chrome, not a page — one nav archetype, applied
identically everywhere.

## Theme

- `--color-paper`      oklch(97.5% 0.006 85)   — warm-neutral app background
- `--color-paper-2`    oklch(95.5% 0.008 80)   — recessed / hover surface
- `--color-surface`    oklch(99% 0.003 85)     — card / raised surface
- `--color-ink`        oklch(21% 0.02 55)      — primary text, warm near-black
- `--color-ink-2`      oklch(46% 0.018 55)     — secondary text
- `--color-ink-3`      oklch(62% 0.014 55)     — tertiary / placeholder text
- `--color-rule`       oklch(89% 0.01 70)      — borders, dividers
- `--color-rule-2`     oklch(93% 0.008 70)     — faint dividers
- `--color-accent`     oklch(52% 0.10 175)     — confident teal, brand anchor
- `--color-accent-ink` oklch(99% 0.005 175)    — text on accent fill
- `--color-accent-2`   oklch(93% 0.03 175)     — accent tint (active nav bg)
- `--color-focus`      oklch(60% 0.17 260)     — focus ring, distinct from accent
- `--color-success`    oklch(55% 0.13 148)     — table kosong / berhasil
- `--color-success-bg` oklch(95% 0.03 148)
- `--color-danger`     oklch(54% 0.19 26)      — void / batal / error
- `--color-danger-bg`  oklch(96% 0.03 26)
- `--color-warning`    oklch(64% 0.14 75)      — belum dicetak
- `--color-warning-bg` oklch(95% 0.04 75)

Single accent hue (teal), used at ≤5% of any viewport. Semantic colors share
the palette's warm-neutral chroma lean so they read as one system, not
Tailwind defaults.

## Typography

- Display: **Geist**, weight 650–700, tight tracking (already loaded via
  `next/font` in `src/app/layout.tsx` — previously dead code under a
  hardcoded Arial override, now actually applied).
- Body: **Geist**, weight 400–500.
- Outlier (2+1 rule): **Geist Mono** — reserved strictly for numeric
  readouts: rupiah amounts, PIN dots/digits, table numbers, timestamps,
  receipt/kitchen-ticket previews. Always `font-variant-numeric: tabular-nums`.
- Type scale (1.25 ratio): `--text-xs` 0.75rem · `--text-sm` 0.875rem ·
  `--text-md` 1rem · `--text-lg` 1.25rem · `--text-xl` 1.563rem ·
  `--text-2xl` 1.953rem · `--text-display` 2.441rem.

## Spacing

4pt named scale:
`--space-3xs` 0.25rem · `--space-2xs` 0.5rem · `--space-xs` 0.75rem ·
`--space-sm` 1rem · `--space-md` 1.5rem · `--space-lg` 2rem ·
`--space-xl` 3rem · `--space-2xl` 4rem · `--space-3xl` 6rem.

**48px minimum height** for every button / input / keypad key — above the
44px WCAG floor, deliberate for fast tablet tapping during service.

Radii: `--radius-card` 1rem · `--radius-input` 0.625rem ·
`--radius-pill` 999px.

## Motion

- Easings: `--ease-out: cubic-bezier(0.16,1,0.3,1)` ·
  `--ease-in: cubic-bezier(0.7,0,0.84,0)` ·
  `--ease-in-out: cubic-bezier(0.87,0,0.13,1)`.
- Durations: `--dur-fast` 120ms · `--dur-short` 180ms · `--dur-med` 240ms.
- Reduced-motion: opacity-only, ≤150ms, everywhere.
- No load-in reveals — this is a tool, not a landing page. Two shared
  primitives app-wide only: (1) button press feedback (scale/translate on
  `:active`), (2) one shared disclosure/expand transition
  (`grid-template-rows 0fr → 1fr`) for inline panels.

## Microinteractions stance

- Silent success (inline confirmation, never a toast) for saves/adds where
  the changed row is already on-screen.
- Void item / cancel order / cancel table **keep their typed-reason
  confirm** — money and already-printed kitchen tickets are at stake.
  Restyle the disclosure; never remove the reason requirement.
- Print/payment feedback is inline button-state (idle → loading → success
  check / inline error), never a celebratory toast.
- Hover delay 800ms, focus delay 0ms on any tooltip.

## CTA voice

- Primary: filled accent, `--radius-card`/pill, `--color-accent` fill +
  `--color-accent-ink` text (never hardcoded white). e.g. "Bayar", "Buka
  Shift", "Cetak Pesanan untuk Dapur".
- Secondary: outline/ghost, ink-colored text. e.g. "Batal", "Kembali".
- Destructive: red-outline or red text button, never filled-red-as-primary.
  e.g. "Batalkan".
- Copy stays Indonesian, kept verbatim where it already exists in the app.

## Per-page-type allowances

- All families: no decorative hero enrichment (no CSS-art, no SVG
  illustration, no generated imagery) — function carries every page.
- Auth may use the centered/symmetric exception.
- Dashboard-grid and Transactional-workbench may vary tile/row size or
  density to signal state — their only structural "variety" allowance.
- CRUD/admin and Data/reports: typography + table/list rhythm only.

## What pages MUST share

The OKLCH token set, the Geist/Geist Mono pairing, the CTA voice (radius,
padding rhythm, fill vs. outline pattern), the shared TopBar, the 48px
touch-target floor, the two motion primitives, the semantic color mapping
(green = available/success, red = danger/void, amber = warning-only, never
the brand accent doing double duty).

## What pages MAY differ on

Macrostructure-within-family (e.g. the payment screen is a narrower,
single-focus variant of the order-detail split-panel shape) and grid/table
density per screen's actual data shape.

## Exports

No separate `tokens.css` file — Tailwind v4's CSS-first `@theme inline`
block in `src/app/globals.css` **is** the token source of truth. All colors
above are declared there as CSS custom properties and mapped into Tailwind
utilities.
