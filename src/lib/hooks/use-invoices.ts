import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// === Types ===
export interface InvoiceFilters {
  organizationId: string
  status?: string
  type?: string
  counterpartyId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export interface Invoice {
  id: string
  organizationId: string
  counterpartyId: string
  number: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED'
  type: 'SALES' | 'PURCHASE'
  amount: number
  taxAmount: number | null
  dueDate: string | null
  issuedDate: string | null
  description: string | null
  createdAt: string
  updatedAt: string
  counterparty?: { id: string; name: string; inn?: string }
  transactions?: { id: string; amount: number; status: string }[]
  documents?: { id: string; title: string; type: string; status: string }[]
  paidAmount?: number
}

export interface InvoiceListResponse {
  data: Invoice[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateInvoiceInput {
  organizationId: string
  counterpartyId: string
  number: string
  type?: string
  amount: number | string
  taxAmount?: number | string | null
  dueDate?: string
  issuedDate?: string
  description?: string
  status?: string
}

export type UpdateInvoiceInput = Partial<CreateInvoiceInput> & { id: string }

// === Query Keys ===
export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters: InvoiceFilters) => [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
}

// === Hooks ===
export function useInvoices(filters: InvoiceFilters) {
  return useQuery<InvoiceListResponse>({
    queryKey: invoiceKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('organizationId', filters.organizationId)
      if (filters.status) params.set('status', filters.status)
      if (filters.type) params.set('type', filters.type)
      if (filters.counterpartyId) params.set('counterpartyId', filters.counterpartyId)
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.set('dateTo', filters.dateTo)
      if (filters.page) params.set('page', String(filters.page))
      if (filters.limit) params.set('limit', String(filters.limit))

      const res = await fetch(`/api/invoices?${params}`)
      if (!res.ok) throw new Error('Failed to fetch invoices')
      return res.json()
    },
    enabled: !!filters.organizationId,
  })
}

export function useInvoice(id: string) {
  return useQuery<{ data: Invoice & { paidAmount: number } }>({
    queryKey: invoiceKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/invoices/${id}`)
      if (!res.ok) throw new Error('Failed to fetch invoice')
      return res.json()
    },
    enabled: !!id,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateInvoiceInput) => {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || 'Failed to create invoice')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
    },
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateInvoiceInput & { id: string }) => {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || 'Failed to update invoice')
      }
      return res.json()
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.id) })
    },
  })
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || 'Failed to delete invoice')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
    },
  })
}
