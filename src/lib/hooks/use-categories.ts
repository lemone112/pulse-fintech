import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// === Types ===
export interface CategoryFilters {
  organizationId: string
  type?: string
}

export interface Category {
  id: string
  organizationId: string
  name: string
  type: 'INCOME' | 'EXPENSE'
  icon: string | null
  color: string | null
  parentId: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  parent?: { id: string; name: string } | null
  children?: { id: string; name: string; color: string | null; icon: string | null }[]
  _count?: { transactions: number }
}

export interface CreateCategoryInput {
  organizationId: string
  name: string
  type: string
  icon?: string
  color?: string
  parentId?: string
  sortOrder?: number
}

// === Query Keys ===
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filters: CategoryFilters) => [...categoryKeys.lists(), filters] as const,
}

// === Hooks ===
export function useCategories(filters: CategoryFilters) {
  return useQuery<{ data: Category[] }>({
    queryKey: categoryKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('organizationId', filters.organizationId)
      if (filters.type) params.set('type', filters.type)

      const res = await fetch(`/api/categories?${params}`)
      if (!res.ok) throw new Error('Failed to fetch categories')
      return res.json()
    },
    enabled: !!filters.organizationId,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || 'Failed to create category')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}
