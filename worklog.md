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

## Phase 2: Tremor-first Layout & Templates (Task 6-a)

**Date**: 2026-05-14
**Commit**: `4eaf86e`

### Changes Made

| Step | Description | Status |
|------|-------------|--------|
| 26 | Replace dashboard layout with Tremor Flex structure + DashboardHeader with breadcrumbs and theme toggle | ✅ Done |
| 27 | Rebuild sidebar with Tremor Button, Icon, collapsible, user avatar section, theme toggle | ✅ Done |
| 35 | Create PulseLayout wrapper template with breadcrumbs, tabs, title/subtitle/actions | ✅ Done |
| 36 | Create PulsePage template + PageHeader + ThemeToggle components | ✅ Done |

### Key Decisions

1. **Collapsible sidebar** — Added `collapsed`/`onToggleCollapse` props controlled from the dashboard layout. Width transitions from 256px to 68px with Tremor `Button` + `Icon` (ChevronsLeft/ChevronsRight). Collapsed state shows only icons with `title` tooltips.

2. **ThemeToggle using `useSyncExternalStore`** — Avoids the `useEffect(() => setMounted(true))` pattern that triggers ESLint's `react-hooks/set-state-in-effect` rule. Uses `useSyncExternalStore` with `getServerSnapshot() => false` for SSR-safe hydration.

3. **DashboardHeader** — Sticky header with breadcrumbs auto-built from pathname via `breadcrumbMap`, command palette trigger, and ThemeToggle. Uses `bg-tremor-background/95 backdrop-blur-sm` for frosted glass effect.

4. **PulseLayout vs PulsePage** — Two distinct templates:
   - `PulseLayout`: Full-featured with breadcrumbs, tab navigation (Tremor `TabGroup`), and optional Card wrapper
   - `PulsePage`: Simpler page template with PageHeader, Card content, and optional footer (pagination)

5. **User avatar section** — Sidebar bottom section with avatar initials ("АД"), name, email, ThemeToggle, and logout button. Hidden when collapsed.

6. **Tremor-first enhancements** — KPI cards use `Bold`/`BadgeDelta` properly, dashboard page uses `Subtitle` instead of `Text` for descriptions, analytics uses `Badge` for presets.

### Files Created (6)

- `src/components/pulse/layout/index.ts` — barrel exports
- `src/components/pulse/layout/theme-toggle.tsx` — ThemeToggle component
- `src/components/pulse/layout/dashboard-header.tsx` — header with breadcrumbs
- `src/components/pulse/layout/pulse-layout.tsx` — PulseLayout template
- `src/components/pulse/layout/pulse-page.tsx` — PulsePage template
- `src/components/pulse/layout/page-header.tsx` — PageHeader component

### Files Modified (5)

- `src/app/(dashboard)/layout.tsx` — Tremor Flex layout with collapsed state
- `src/components/pulse/sidebar.tsx` — collapsible, Tremor Button/Icon, avatar
- `src/app/(dashboard)/dashboard/page.tsx` — Tremor-first improvements
- `src/app/(dashboard)/analytics/page.tsx` — Tremor Badge, Subtitle
- `src/components/pulse/overview/kpi-card.tsx` — Bold, BadgeDelta repositioning

## Phase 2b: Migrate All Pages to Tremor-first Components (Task 6-b)

**Date**: 2026-05-14
**Commit**: `364c1ab`

### Changes Made

| Step | Description | Status |
|------|-------------|--------|
| 28 | Dashboard page: Replace `<div>` headers with Tremor Flex, chart wrapper `<div className="p-5">` with Tremor Title, transaction direction icons with Tremor Badge, text with Bold | ✅ Done |
| 29 | KPI cards: Move BadgeDelta to header row, wrap Metric value with Bold, increase Metric size via `text-2xl` | ✅ Done |
| 30 | Replace inline badges: Analytics `<span>` presets → Tremor Badge, Calendar event icon `<div>` → Tremor Badge, approvals `rub()` → shared `formatMoney`, counterparty detail `Intl.NumberFormat` → `formatMoney`/`formatSigned` | ✅ Done |
| 31 | Tables: All report/transaction pages already use Tremor Table — verified | ✅ Verified |
| 32 | Tabs: Projects page filter buttons → Tremor TabGroup + TabList + TabPanels | ✅ Done |
| 33 | TextInput: All pages already use Tremor TextInput — verified (no `@/components/ui/input` imports) | ✅ Verified |
| 34 | Custom flex/grid: Replace `<div className="space-y-*">` with `Flex flexDirection="col"`, replace `<div className="flex items-center gap-2">` with Tremor Flex, replace `grid grid-cols-2` with Tremor Grid, replace `<div>` headers with `Flex flexDirection="col"`, replace chart-grid CSS grid with Tremor Grid | ✅ Done |

### Key Decisions

1. **BadgeDelta repositioned in KPI card** — Moved from the delta row (bottom) to the card header row (top-right) alongside the title. This makes the delta indicator more scannable and the Metric value more prominent with `text-2xl Bold`.

2. **Projects page: Button filters → TabGroup** — Replaced the custom button-based filter (`variant={filter === f ? 'primary' : 'secondary'}`) with Tremor `TabGroup`/`TabList`/`Tab`/`TabPanels`/`TabPanel`. The entire project grid is now wrapped in a `Card` containing the TabGroup for better visual cohesion.

3. **Analytics presets: `<span>` → Tremor Badge** — The inline `<span className="inline-flex items-center gap-1.5 rounded-full border...">` replaced with `<Badge size="sm" color="gray" icon={BarChart3}>`. Cleaner API, consistent styling, automatic dark mode support.

4. **Calendar event icons: Hardcoded color divs → Tremor Badge** — The `<div className={cn('bg-blue-50 text-blue-600', ...)}` replaced with `<Badge size="md" color={config.color}>`. Eliminates 5 hardcoded color combinations and provides automatic dark mode support via Tremor tokens.

5. **`rub()` formatter removed from approvals** — Replaced the duplicate `rub()` function with shared `formatMoney()` from `@/lib/utils`. Same for counterparty detail page's inline `Intl.NumberFormat` calls.

6. **Chart card wrappers simplified** — Removed inner `<div className="p-5">` wrappers from dashboard and cashflow chart Cards. Tremor Card already provides padding; chart titles now use `<Title className="text-tremor-content-subtle text-sm font-medium">` with `<BarChart className="mt-4">` for spacing.

7. **Universal `<div>` → `Flex flexDirection="col"`** — Every page header previously used `<div>` wrapping `<Title>` + `<Text>`. All now use `<Flex flexDirection="col">` for semantic consistency.

### Files Modified (17 total)

- `src/app/(dashboard)/dashboard/page.tsx` — Tremor Flex/Badge/Bold, chart Title
- `src/app/(dashboard)/transactions/page.tsx` — Flex flexDirection="col", wrapper div→Flex
- `src/app/(dashboard)/invoices/page.tsx` — Flex flexDirection="col" header
- `src/app/(dashboard)/projects/page.tsx` — TabGroup replaces filter buttons
- `src/app/(dashboard)/categories/page.tsx` — Grid replaces Flex+flex-1 KPI, Flex header
- `src/app/(dashboard)/counterparties/page.tsx` — Flex header, Flex col detail, Flex text-right→alignItems="end"
- `src/app/(dashboard)/counterparties/[id]/page.tsx` — formatMoney/formatSigned, Grid responsive, Flex flexDirection="col"
- `src/app/(dashboard)/rules/page.tsx` — Flex header, Flex col rules list
- `src/app/(dashboard)/approvals/page.tsx` — formatMoney replaces rub(), Flex header
- `src/app/(dashboard)/analytics/page.tsx` — Badge replaces span, Subtitle, Flex header
- `src/app/(dashboard)/planning/calendar/page.tsx` — Badge replaces colored divs, Flex header/list
- `src/app/(dashboard)/reports/pnl/page.tsx` — Flex header
- `src/app/(dashboard)/reports/cashflow/page.tsx` — Flex header, Title replaces inner div
- `src/app/(dashboard)/reports/trial-balance/page.tsx` — Flex header
- `src/app/(dashboard)/reports/balance-sheet/page.tsx` — Flex header
- `src/app/(dashboard)/settings/profile/page.tsx` — Flex col form/notification sections, Grid responsive
- `src/app/(dashboard)/settings/connections/page.tsx` — Flex col sections, Grid replaces CSS grid
- `src/components/pulse/overview/kpi-card.tsx` — BadgeDelta in header, Bold Metric
- `src/components/pulse/analytics/chart-grid.tsx` — Tremor Grid replaces CSS grid, Tremor tokens
