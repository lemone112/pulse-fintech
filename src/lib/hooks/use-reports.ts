import { useQuery } from '@tanstack/react-query'

// === Types ===
export interface ReportFilters {
  organizationId: string
  dateFrom?: string
  dateTo?: string
  projectId?: string
  accountId?: string
  groupBy?: 'day' | 'week' | 'month'
}

export interface PnLData {
  period: { from: string | null; to: string | null }
  totalIncome: number
  totalExpense: number
  netProfit: number
  margin: number
  income: Array<{ category: { id: string; name: string; color: string | null; icon: string | null }; total: number }>
  expense: Array<{ category: { id: string; name: string; color: string | null; icon: string | null }; total: number }>
}

export interface CashflowData {
  period: { from: string | null; to: string | null }
  groupBy: string
  totalBalance: number
  totalInflow: number
  totalOutflow: number
  netCashflow: number
  accounts: Array<{ id: string; name: string; balance: number; currency: string; type: string }>
  cashflow: Array<{ period: string; inflow: number; outflow: number; net: number; cumulativeBalance: number }>
}

export interface BalanceSheetData {
  asOf: string
  assets: {
    total: number
    accounts: Array<{ type: string; accounts: Array<{ id: string; name: string; type: string; balance: number; currency: string }>; total: number }>
    receivables: number
    cashAndBank: number
  }
  liabilities: {
    total: number
    payables: number
  }
  equity: {
    total: number
    retainedEarnings: number
  }
  totalLiabilitiesAndEquity: number
  check: boolean
}

export interface TrialBalanceData {
  period: { from: string | null; to: string | null }
  rows: Array<{
    id: string
    name: string
    type: string
    icon: string | null
    color: string | null
    parent: { id: string; name: string } | null
    debit: number
    credit: number
    balance: number
    transactionCount: number
  }>
  totals: {
    debit: number
    credit: number
    difference: number
    isBalanced: boolean
  }
}

// === Query Keys ===
export const reportKeys = {
  all: ['reports'] as const,
  pnl: (filters: ReportFilters) => [...reportKeys.all, 'pnl', filters] as const,
  cashflow: (filters: ReportFilters) => [...reportKeys.all, 'cashflow', filters] as const,
  balance: (filters: ReportFilters) => [...reportKeys.all, 'balance', filters] as const,
  trialBalance: (filters: ReportFilters) => [...reportKeys.all, 'trial-balance', filters] as const,
}

// === Hooks ===
export function usePnLReport(filters: ReportFilters) {
  return useQuery<{ data: PnLData }>({
    queryKey: reportKeys.pnl(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('organizationId', filters.organizationId)
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.set('dateTo', filters.dateTo)
      if (filters.projectId) params.set('projectId', filters.projectId)

      const res = await fetch(`/api/reports/pnl?${params}`)
      if (!res.ok) throw new Error('Failed to generate P&L report')
      return res.json()
    },
    enabled: !!filters.organizationId,
  })
}

export function useCashflowReport(filters: ReportFilters) {
  return useQuery<{ data: CashflowData }>({
    queryKey: reportKeys.cashflow(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('organizationId', filters.organizationId)
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.set('dateTo', filters.dateTo)
      if (filters.accountId) params.set('accountId', filters.accountId)
      if (filters.groupBy) params.set('groupBy', filters.groupBy)

      const res = await fetch(`/api/reports/cashflow?${params}`)
      if (!res.ok) throw new Error('Failed to generate cashflow report')
      return res.json()
    },
    enabled: !!filters.organizationId,
  })
}

export function useBalanceSheetReport(filters: ReportFilters) {
  return useQuery<{ data: BalanceSheetData }>({
    queryKey: reportKeys.balance(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('organizationId', filters.organizationId)
      if (filters.dateTo) params.set('dateTo', filters.dateTo)

      const res = await fetch(`/api/reports/balance?${params}`)
      if (!res.ok) throw new Error('Failed to generate balance sheet')
      return res.json()
    },
    enabled: !!filters.organizationId,
  })
}

export function useTrialBalanceReport(filters: ReportFilters) {
  return useQuery<{ data: TrialBalanceData }>({
    queryKey: reportKeys.trialBalance(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('organizationId', filters.organizationId)
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.set('dateTo', filters.dateTo)

      const res = await fetch(`/api/reports/trial-balance?${params}`)
      if (!res.ok) throw new Error('Failed to generate trial balance')
      return res.json()
    },
    enabled: !!filters.organizationId,
  })
}
