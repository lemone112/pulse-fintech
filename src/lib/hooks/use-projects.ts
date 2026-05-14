import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// === Types ===
export interface ProjectFilters {
  organizationId: string
  status?: string
  page?: number
  limit?: number
}

export interface Project {
  id: string
  organizationId: string
  name: string
  description: string | null
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
  budget: number | null
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
  _count?: { transactions: number }
  spent?: number
}

export interface ProjectListResponse {
  data: Project[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateProjectInput {
  organizationId: string
  name: string
  description?: string
  status?: string
  budget?: number | string | null
  startDate?: string
  endDate?: string
}

// === Query Keys ===
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: ProjectFilters) => [...projectKeys.lists(), filters] as const,
}

// === Hooks ===
export function useProjects(filters: ProjectFilters) {
  return useQuery<ProjectListResponse>({
    queryKey: projectKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('organizationId', filters.organizationId)
      if (filters.status) params.set('status', filters.status)
      if (filters.page) params.set('page', String(filters.page))
      if (filters.limit) params.set('limit', String(filters.limit))

      const res = await fetch(`/api/projects?${params}`)
      if (!res.ok) throw new Error('Failed to fetch projects')
      return res.json()
    },
    enabled: !!filters.organizationId,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || 'Failed to create project')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}
