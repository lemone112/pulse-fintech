import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// === Types ===
export interface CounterpartyFilters {
  organizationId: string
  type?: string
  search?: string
  page?: number
  limit?: number
}

export interface Counterparty {
  id: string
  organizationId: string
  name: string
  inn: string | null
  type: 'COMPANY' | 'INDIVIDUAL' | 'PERSON'
  email: string | null
  phone: string | null
  address: string | null
  contactPerson: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  _count?: { transactions: number; invoices: number; documents: number }
  totalIncome?: number
  totalExpense?: number
}

export interface CounterpartyListResponse {
  data: Counterparty[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateCounterpartyInput {
  organizationId: string
  name: string
  inn?: string
  type?: string
  email?: string
  phone?: string
  address?: string
  contactPerson?: string
  notes?: string
}

export type UpdateCounterpartyInput = Partial<CreateCounterpartyInput> & { id: string }

// === Query Keys ===
export const counterpartyKeys = {
  all: ['counterparties'] as const,
  lists: () => [...counterpartyKeys.all, 'list'] as const,
  list: (filters: CounterpartyFilters) => [...counterpartyKeys.lists(), filters] as const,
  details: () => [...counterpartyKeys.all, 'detail'] as const,
  detail: (id: string) => [...counterpartyKeys.details(), id] as const,
}

// === Hooks ===
export function useCounterparties(filters: CounterpartyFilters) {
  return useQuery<CounterpartyListResponse>({
    queryKey: counterpartyKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('organizationId', filters.organizationId)
      if (filters.type) params.set('type', filters.type)
      if (filters.search) params.set('search', filters.search)
      if (filters.page) params.set('page', String(filters.page))
      if (filters.limit) params.set('limit', String(filters.limit))

      const res = await fetch(`/api/counterparties?${params}`)
      if (!res.ok) throw new Error('Failed to fetch counterparties')
      return res.json()
    },
    enabled: !!filters.organizationId,
  })
}

export function useCounterparty(id: string) {
  return useQuery<{ data: Counterparty }>({
    queryKey: counterpartyKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/counterparties/${id}`)
      if (!res.ok) throw new Error('Failed to fetch counterparty')
      return res.json()
    },
    enabled: !!id,
  })
}

export function useCreateCounterparty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateCounterpartyInput) => {
      const res = await fetch('/api/counterparties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || 'Failed to create counterparty')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: counterpartyKeys.all })
    },
  })
}

export function useUpdateCounterparty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateCounterpartyInput & { id: string }) => {
      const res = await fetch(`/api/counterparties/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || 'Failed to update counterparty')
      }
      return res.json()
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: counterpartyKeys.all })
      queryClient.invalidateQueries({ queryKey: counterpartyKeys.detail(variables.id) })
    },
  })
}

export function useDeleteCounterparty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/counterparties/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || 'Failed to delete counterparty')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: counterpartyKeys.all })
    },
  })
}
