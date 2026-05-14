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

## Phase 3: Prisma Schema & API Routes (Task 7-a)

**Date**: 2026-05-14

### Changes Made

| Step | Description | Status |
|------|-------------|--------|
| 41-47 | Rewrite Prisma schema with all fintech models (15 models, 10 enums) | ✅ Done |
| 48 | Create transactions API routes (list + CRUD) | ✅ Done |
| 49 | Create invoices API routes (list + CRUD + status transitions) | ✅ Done |
| 50 | Create counterparties API routes (list + CRUD + computed totals) | ✅ Done |
| 51 | Create categories API routes (list + create, hierarchical) | ✅ Done |
| 52 | Create reports API routes (P&L, cashflow, balance sheet, trial balance) | ✅ Done |
| 52b | Create projects, approvals, rules API routes | ✅ Done |
| 53 | Create AI chat proxy route (SSE streaming, server-side key) | ✅ Done |
| 54 | Create React Query hooks (8 hook files + barrel export) | ✅ Done |
| 54b | Create QueryProvider and update layout.tsx | ✅ Done |

### Prisma Schema (15 Models)

**Auth**: User, Session, Organization, OrganizationMember
**Financial Core**: Account, Transaction, Counterparty, Category
**Invoices & Documents**: Invoice, Document
**Projects**: Project
**Rules & Approvals**: Rule, Approval, ApprovalStep
**Audit**: AuditLog

**Enums (10)**: UserRole, AccountType, TransactionType, TransactionStatus, CounterpartyType, CategoryType, InvoiceStatus, InvoiceType, ProjectStatus, ApprovalType, ApprovalStatus, DocumentType, DocumentStatus

### API Routes (15 route files)

1. `src/app/api/transactions/route.ts` — GET (list with filters) + POST (create)
2. `src/app/api/transactions/[id]/route.ts` — GET, PUT, DELETE
3. `src/app/api/invoices/route.ts` — GET (list) + POST (create)
4. `src/app/api/invoices/[id]/route.ts` — GET, PUT, DELETE + status transition validation
5. `src/app/api/counterparties/route.ts` — GET + POST
6. `src/app/api/counterparties/[id]/route.ts` — GET (with computed totals), PUT, DELETE
7. `src/app/api/categories/route.ts` — GET + POST (hierarchical)
8. `src/app/api/reports/pnl/route.ts` — GET (computed P&L by category)
9. `src/app/api/reports/cashflow/route.ts` — GET (computed cashflow by period with cumulative balance)
10. `src/app/api/reports/balance/route.ts` — GET (computed balance sheet)
11. `src/app/api/reports/trial-balance/route.ts` — GET (computed trial balance)
12. `src/app/api/projects/route.ts` — GET + POST (with spent calculation)
13. `src/app/api/approvals/route.ts` — GET + POST (with steps creation)
14. `src/app/api/rules/route.ts` — GET + POST (JSON condition/action parsed)
15. `src/app/api/ai/chat/route.ts` — POST (SSE streaming proxy, server-side API key)

### React Query Hooks (8 files)

1. `src/lib/hooks/use-transactions.ts` — useTransactions, useTransaction, useCreate/Update/Delete
2. `src/lib/hooks/use-invoices.ts` — useInvoices, useInvoice, useCreate/Update/Delete
3. `src/lib/hooks/use-counterparties.ts` — useCounterparties, useCounterparty, useCreate/Update/Delete
4. `src/lib/hooks/use-categories.ts` — useCategories, useCreateCategory
5. `src/lib/hooks/use-reports.ts` — usePnLReport, useCashflowReport, useBalanceSheetReport, useTrialBalanceReport
6. `src/lib/hooks/use-projects.ts` — useProjects, useCreateProject
7. `src/lib/hooks/use-approvals.ts` — useApprovals, useCreateApproval
8. `src/lib/hooks/use-rules.ts` — useRules, useCreateRule
9. `src/lib/hooks/index.ts` — barrel exports for all hooks + types

### Key Decisions

1. **SQLite with PostgreSQL migration plan** — Schema uses `Float` instead of `Decimal @db.Decimal(18, 2)` since SQLite doesn't support `@db.Decimal`. A migration comment at the top of `schema.prisma` documents the exact steps to convert when moving to PostgreSQL. Similarly, `Json` fields use `String` (storing serialized JSON) in SQLite.

2. **Invoice status transition validation** — The invoices `[id]` route includes a `STATUS_TRANSITIONS` map that validates allowed status changes (e.g., DRAFT → SENT, SENT → PAID). Only DRAFT invoices can be deleted.

3. **Counterparty delete protection** — Cannot delete a counterparty that has existing transactions or invoices. Returns 400 with a clear error message.

4. **Report routes compute on-the-fly** — All four report routes (P&L, cashflow, balance sheet, trial balance) compute their results from raw transaction data at query time. No materialized views or pre-computed tables needed for the current scale.

5. **AI chat proxy is server-side only** — The `/api/ai/chat` route reads `AI_API_KEY` from server-only env vars (not `NEXT_PUBLIC_*`). It streams SSE responses back to the client, forwarding the AbortController signal for cancellation support.

6. **QueryProvider defaults** — 1-minute stale time, 5-minute garbage collection, no refetch on window focus, single retry on queries. These defaults balance freshness with performance for a fintech dashboard.

7. **Rules store condition/action as JSON strings** — In SQLite, `Json` type maps to `String`. The rules API route automatically `JSON.parse()` on read and `JSON.stringify()` on write, so consumers always see proper objects.

### Files Created (26 total)

- `prisma/schema.prisma` — complete rewrite (15 models, 10 enums)
- `src/app/api/transactions/route.ts`
- `src/app/api/transactions/[id]/route.ts`
- `src/app/api/invoices/route.ts`
- `src/app/api/invoices/[id]/route.ts`
- `src/app/api/counterparties/route.ts`
- `src/app/api/counterparties/[id]/route.ts`
- `src/app/api/categories/route.ts`
- `src/app/api/projects/route.ts`
- `src/app/api/approvals/route.ts`
- `src/app/api/rules/route.ts`
- `src/app/api/reports/pnl/route.ts`
- `src/app/api/reports/cashflow/route.ts`
- `src/app/api/reports/balance/route.ts`
- `src/app/api/reports/trial-balance/route.ts`
- `src/app/api/ai/chat/route.ts`
- `src/lib/hooks/use-transactions.ts`
- `src/lib/hooks/use-invoices.ts`
- `src/lib/hooks/use-counterparties.ts`
- `src/lib/hooks/use-categories.ts`
- `src/lib/hooks/use-reports.ts`
- `src/lib/hooks/use-projects.ts`
- `src/lib/hooks/use-approvals.ts`
- `src/lib/hooks/use-rules.ts`
- `src/lib/hooks/index.ts`
- `src/lib/providers/query-provider.tsx`

### Files Modified (2 total)

- `src/app/layout.tsx` — wrapped with QueryProvider
- `src/lib/hooks/index.ts` — barrel export for all hooks
