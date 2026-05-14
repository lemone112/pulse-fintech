import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { db } from '@/lib/db'
import { hasPermission as checkPermission, type Role } from '@/lib/auth/rbac'

/**
 * Get the current session (can be null)
 */
export async function getSession() {
  return getServerSession(authOptions)
}

/**
 * Get the current authenticated user with role and organization
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  // Fetch fresh user data from DB including membership
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      memberships: {
        include: { organization: true },
        orderBy: { joinedAt: 'asc' },
        take: 1,
      },
    },
  })

  if (!user) return null

  const membership = user.memberships[0]

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: (membership?.role ?? user.role) as Role,
    organizationId: membership?.organizationId ?? null,
    organizationName: membership?.organization?.name ?? null,
  }
}

/**
 * Require authentication — throws if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new AuthError('Необходима авторизация', 401)
  }

  return user
}

/**
 * Require a specific permission — throws if not authorized
 */
export async function requirePermission(permission: Parameters<typeof checkPermission>[1]) {
  const user = await requireAuth()

  if (!checkPermission(user.role, permission)) {
    throw new AuthError('Недостаточно прав', 403)
  }

  return user
}

/**
 * Custom authentication error class
 */
export class AuthError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number = 401) {
    super(message)
    this.name = 'AuthError'
    this.statusCode = statusCode
  }
}

/**
 * Helper to create an auth error response
 */
export function authErrorResponse(error: AuthError) {
  return Response.json(
    { error: error.message },
    { status: error.statusCode }
  )
}
