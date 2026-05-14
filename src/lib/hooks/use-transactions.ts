import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// === Types ===
export interface TransactionFilters {
  organizationId: string
  accountId?: string
  type?: string
  status?: string
  counterpartyId?: string
  categoryId?: string
  projectId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface Transaction {
  id: string
  organizationId: string
  accountId: string
  counterpartyId: string | null
  categoryId: string | null
  projectId: string | null
  invoiceId: string | null
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  amount: number
  description: string | null
  reference: string | null
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  transactionDate: string
  createdAt: string
  updatedAt: string
  account?: { id: string; name: string; currency: string }
  counterparty?: { id: string; name: string } | null
  category?: { id: string; name: string; color: string | null; icon: string | null } | null
  project?: { id: string; name: string } | null
  invoice?: { id: string; number: string } | null
}

export interface TransactionListResponse {
  data: Transaction[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateTransactionInput {
  organizationId: string
  accountId: string
  counterpartyId?: string | null
  categoryId?: string | null
  projectId?: string | null
  invoiceId?: string | null
  type: string
  amount: number | string
  description?: string
  reference?: string
  status?: string
  transactionDate: string
}

export type UpdateTransactionInput = Partial<CreateTransactionInput> & { id: string }

// === Query Keys ===
export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters: TransactionFilters) => [...transactionKeys.lists(), filters] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
}

// === Hooks ===
export function useTransactions(filters: TransactionFilters) {
  return useQuery<TransactionListResponse>({
    queryKey: transactionKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('organizationId', filters.organizationId)
      if (filters.accountId) params.set('accountId', filters.accountId)
      if (filters.type) params.set('type', filters.type)
      if (filters.status) params.set('status', filters.status)
      if (filters.counterpartyId) params.set('counterpartyId', filters.counterpartyId)
      if (filters.categoryId) params.set('categoryId', filters.categoryId)
      if (filters.projectId) params.set('projectId', filters.projectId)
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.set('dateTo', filters.dateTo)
      if (filters.page) params.set('page', String(filters.page))
      if (filters.limit) params.set('limit', String(filters.limit))

      const res = await fetch(`/api/transactions?${params}`)
      if (!res.ok) throw new Error('Failed to fetch transactions')
      return res.json()
    },
    enabled: !!filters.organizationId,
  })
}

export function useTransaction(id: string) {
  return useQuery<{ data: Transaction }>({
    queryKey: transactionKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/transactions/${id}`)
      if (!res.ok) throw new Error('Failed to fetch transaction')
      return res.json()
    },
    enabled: !!id,
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || 'Failed to create transaction')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateTransactionInput & { id: string }) => {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || 'Failed to update transaction')
      }
      return res.json()
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(variables.id) })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || 'Failed to delete transaction')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    },
  })
}
