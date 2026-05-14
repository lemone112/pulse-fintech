# PULSE Fintech — Worklog

## Phase 1: Code Quality (Task 5-b)

**Date**: 2026-05-14
**Commit**: `1e2bc0c`

### Changes Made

| Step | Description | Status |
|------|-------------|--------|
| 15 | Replace 9+ duplicate `rub()`/`moneyFormatter()` with unified `formatMoney`/`formatCompact`/`formatNumber` from `@/lib/utils` | ✅ Done |
| 16 | Replace 16 hardcoded hex colors in `categories/page.tsx` with `bg-chart-palette-N` Tailwind classes | ✅ Done |
| 17 | Consolidate `statusToTremorColor()` into `documents/constants.ts` | ✅ Done |
| 18 | Remove `ignoreBuildErrors` from `next.config.ts` | ✅ Done |
| 24 | Wire command palette items to actual navigation via `router.push()` | ✅ Done |
| 25 | Dark mode subtle color overrides — already present in `globals.css` | ✅ Verified |

### Key Decisions

1. **Added `formatNumber()`** to `currency.ts` — the trial-balance and balance-sheet pages need plain number formatting (no ₽ symbol), so a new formatter was required beyond the existing `formatMoney` and `formatCompact`.

2. **`formatSigned()`** used for counterparties — the inline `Intl.NumberFormat` with manual "+" prefix maps perfectly to `formatSigned()`.

3. **Chart-palette CSS variable classes** (`bg-chart-palette-1` through `bg-chart-palette-12`) for category colors instead of hardcoded hex — provides automatic dark mode support and design system consistency.

4. **Command palette routes** use query params for action items (`?new=1`) since there are no dedicated creation pages yet.

### Files Modified (13 total)

- `src/lib/format/currency.ts` — added `formatNumber()`
- `src/lib/utils.ts` — re-export `formatNumber`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/transactions/page.tsx`
- `src/app/(dashboard)/invoices/page.tsx`
- `src/app/(dashboard)/projects/page.tsx`
- `src/app/(dashboard)/categories/page.tsx`
- `src/app/(dashboard)/counterparties/page.tsx`
- `src/app/(dashboard)/rules/page.tsx`
- `src/app/(dashboard)/planning/calendar/page.tsx`
- `src/app/(dashboard)/reports/pnl/page.tsx`
- `src/app/(dashboard)/reports/cashflow/page.tsx`
- `src/app/(dashboard)/reports/trial-balance/page.tsx`
- `src/app/(dashboard)/reports/balance-sheet/page.tsx`
- `src/components/pulse/documents/constants.ts`
- `src/components/pulse/documents/document-card.tsx`
- `src/components/pulse/command-palette.tsx`
- `next.config.ts`
