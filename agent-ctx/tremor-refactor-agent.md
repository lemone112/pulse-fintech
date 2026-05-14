# Task: Replace Raw Recharts with Tremor Charts

## Summary
Replaced all raw Recharts usage in the PULSE fintech platform with Tremor Chart components from `@tremor/react` (v3.18.7, already installed).

## Files Modified

### 1. `src/components/pulse/analytics/chart-card.tsx`
**Changes:**
- **Imports**: Replaced raw Recharts `BarChart`, `LineChart`, `AreaChart`, `PieChart`, `Pie`, `Cell` with Tremor `BarChart`, `LineChart`, `AreaChart`, `DonutChart`, `Card` from `@tremor/react`. Kept only `RadarChart`, `ScatterChart` and supporting Recharts components for chart types Tremor doesn't support.
- **Removed**: The hardcoded `COLORS` array (17 hex colors) and `tooltipStyle` object — Tremor handles these internally.
- **Added**: `getTremorColors()` function — maps semantic data keys (Доходы→emerald, Расходы→red, План→blue, Факт→amber, etc.) to Tremor color names. Falls back to a 10-color default palette.
- **Added**: `formatChartValue()` — smart number formatter that handles millions (1.5M), thousands (1.2K), and small numbers with ru-RU locale.
- **ChartRenderer**: Completely rewritten to use Tremor components:
  - `bar` → Tremor `BarChart` with dynamic `categories`/`colors` derived from data keys
  - `line` → Tremor `LineChart`
  - `area` → Tremor `AreaChart`
  - `donut` → Tremor `DonutChart` with `category="amount"` and 10-color palette
  - `scatter` → Kept raw Recharts with `var(--color-primary-9)`, `var(--color-tremor-border)`, `var(--color-tremor-background)` CSS variable references
  - `radar` → Kept raw Recharts with same CSS variable references
- **Card wrapper**: Replaced `rounded-lg border border-border bg-card shadow-sm` with Tremor `Card` component. Updated internal class names to use Tremor token classes (`border-tremor-border`, `text-tremor-content`, `text-tremor-content-subtle`, `bg-tremor-background-subtle`).

### 2. `src/app/(dashboard)/dashboard/page.tsx`
**Changes:**
- **Imports**: Removed all raw Recharts imports (`BarChart`, `Bar`, `AreaChart`, `Area`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer`). Added Tremor `BarChart`, `AreaChart`, `Card` from `@tremor/react`.
- **Bar chart**: Income vs Expense now uses Tremor `BarChart` with `index="month"`, `categories={['income', 'expense']}`, `colors={['emerald', 'red']}`
- **Area chart**: Balance trend now uses Tremor `AreaChart` with `index="month"`, `categories={['balance']}`, `colors={['blue']}`
- **Card wrappers**: Both chart cards now use Tremor `Card` instead of manual `rounded-lg border border-border bg-card shadow-sm`
- **Added**: `moneyFormatter` function for chart value formatting (1.5M ₽, 1K ₽)
- **Transactions section**: Left unchanged (no charts, uses shadcn-compatible classes)

## Verification
- ESLint passed for both modified files (no errors)
- TypeScript compilation passes (project has `skipLibCheck: true`)
- No hardcoded hex colors remain — Tremor charts use named colors, scatter/radar use CSS variable references
