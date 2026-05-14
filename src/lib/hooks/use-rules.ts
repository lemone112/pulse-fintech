import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// === Types ===
export interface RuleFilters {
  organizationId: string
  isActive?: boolean
}

export interface Rule {
  id: string
  organizationId: string
  name: string
  description: string | null
  condition: unknown // JSON
  action: unknown // JSON
  isActive: boolean
  priority: number
  createdAt: string
  updatedAt: string
}

export interface CreateRuleInput {
  organizationId: string
  name: string
  description?: string
  condition: unknown
  action: unknown
  isActive?: boolean
  priority?: number
}

// === Query Keys ===
export const ruleKeys = {
  all: ['rules'] as const,
  lists: () => [...ruleKeys.all, 'list'] as const,
  list: (filters: RuleFilters) => [...ruleKeys.lists(), filters] as const,
}

// === Hooks ===
export function useRules(filters: RuleFilters) {
  return useQuery<{ data: Rule[] }>({
    queryKey: ruleKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('organizationId', filters.organizationId)
      if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive))

      const res = await fetch(`/api/rules?${params}`)
      if (!res.ok) throw new Error('Failed to fetch rules')
      return res.json()
    },
    enabled: !!filters.organizationId,
  })
}

export function useCreateRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateRuleInput) => {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || 'Failed to create rule')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ruleKeys.all })
    },
  })
}
