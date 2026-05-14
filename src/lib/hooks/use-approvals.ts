import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// === Types ===
export interface ApprovalFilters {
  organizationId: string
  status?: string
  type?: string
  page?: number
  limit?: number
}

export interface ApprovalStep {
  id: string
  approvalId: string
  approverId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  comment: string | null
  actedAt: string | null
  approver: { id: string; name: string; email: string; avatarUrl?: string | null }
}

export interface Approval {
  id: string
  organizationId: string
  type: 'INVOICE' | 'EXPENSE' | 'TRANSFER' | 'BUDGET'
  entityType: string
  entityId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
  steps: ApprovalStep[]
}

export interface ApprovalListResponse {
  data: Approval[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateApprovalInput {
  organizationId: string
  type: string
  entityType: string
  entityId: string
  steps: Array<{ approverId: string; comment?: string }>
}

// === Query Keys ===
export const approvalKeys = {
  all: ['approvals'] as const,
  lists: () => [...approvalKeys.all, 'list'] as const,
  list: (filters: ApprovalFilters) => [...approvalKeys.lists(), filters] as const,
}

// === Hooks ===
export function useApprovals(filters: ApprovalFilters) {
  return useQuery<ApprovalListResponse>({
    queryKey: approvalKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('organizationId', filters.organizationId)
      if (filters.status) params.set('status', filters.status)
      if (filters.type) params.set('type', filters.type)
      if (filters.page) params.set('page', String(filters.page))
      if (filters.limit) params.set('limit', String(filters.limit))

      const res = await fetch(`/api/approvals?${params}`)
      if (!res.ok) throw new Error('Failed to fetch approvals')
      return res.json()
    },
    enabled: !!filters.organizationId,
  })
}

export function useCreateApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateApprovalInput) => {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || 'Failed to create approval')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: approvalKeys.all })
    },
  })
}
