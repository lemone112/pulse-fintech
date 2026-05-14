// ============================================================================
// PULSE RBAC — Role-Based Access Control
// ============================================================================
//
// Role hierarchy: OWNER > ADMIN > ACCOUNTANT > VIEWER
//
// VIEWER:     Read transactions, reports, categories
// ACCOUNTANT: + Create/edit transactions, invoices, categories
// ADMIN:      + Manage users, rules, approvals, settings
// OWNER:      + Delete organization, manage billing
// ============================================================================

export type Role = 'OWNER' | 'ADMIN' | 'ACCOUNTANT' | 'VIEWER'

export const ROLE_HIERARCHY: Record<Role, number> = {
  VIEWER: 0,
  ACCOUNTANT: 1,
  ADMIN: 2,
  OWNER: 3,
}

export type Permission =
  // Read
  | 'transactions:read'
  | 'reports:read'
  | 'categories:read'
  | 'invoices:read'
  | 'counterparties:read'
  | 'projects:read'
  | 'rules:read'
  | 'approvals:read'
  | 'accounts:read'
  | 'documents:read'
  // Write (ACCOUNTANT+)
  | 'transactions:write'
  | 'invoices:write'
  | 'categories:write'
  | 'counterparties:write'
  | 'projects:write'
  | 'documents:write'
  | 'accounts:write'
  // Manage (ADMIN+)
  | 'users:manage'
  | 'rules:manage'
  | 'approvals:manage'
  | 'settings:manage'
  | 'rules:write'
  // Owner
  | 'organization:delete'
  | 'billing:manage'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  VIEWER: [
    'transactions:read',
    'reports:read',
    'categories:read',
    'invoices:read',
    'counterparties:read',
    'projects:read',
    'rules:read',
    'approvals:read',
    'accounts:read',
    'documents:read',
  ],
  ACCOUNTANT: [
    // Inherits all VIEWER permissions
    'transactions:read',
    'reports:read',
    'categories:read',
    'invoices:read',
    'counterparties:read',
    'projects:read',
    'rules:read',
    'approvals:read',
    'accounts:read',
    'documents:read',
    // Write permissions
    'transactions:write',
    'invoices:write',
    'categories:write',
    'counterparties:write',
    'projects:write',
    'documents:write',
    'accounts:write',
  ],
  ADMIN: [
    // Inherits all ACCOUNTANT permissions
    'transactions:read',
    'reports:read',
    'categories:read',
    'invoices:read',
    'counterparties:read',
    'projects:read',
    'rules:read',
    'approvals:read',
    'accounts:read',
    'documents:read',
    'transactions:write',
    'invoices:write',
    'categories:write',
    'counterparties:write',
    'projects:write',
    'documents:write',
    'accounts:write',
    // Manage permissions
    'users:manage',
    'rules:manage',
    'rules:write',
    'approvals:manage',
    'settings:manage',
  ],
  OWNER: [
    // All permissions
    'transactions:read',
    'reports:read',
    'categories:read',
    'invoices:read',
    'counterparties:read',
    'projects:read',
    'rules:read',
    'approvals:read',
    'accounts:read',
    'documents:read',
    'transactions:write',
    'invoices:write',
    'categories:write',
    'counterparties:write',
    'projects:write',
    'documents:write',
    'accounts:write',
    'users:manage',
    'rules:manage',
    'rules:write',
    'approvals:manage',
    'settings:manage',
    // Owner-only permissions
    'organization:delete',
    'billing:manage',
  ],
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role | string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role as Role]
  if (!permissions) return false
  return permissions.includes(permission)
}

/**
 * Check if a role has at least the specified minimum role level
 */
export function hasMinRole(role: Role | string, minRole: Role): boolean {
  const roleLevel = ROLE_HIERARCHY[role as Role] ?? -1
  const minLevel = ROLE_HIERARCHY[minRole]
  return roleLevel >= minLevel
}

/**
 * Route-based access control
 * Maps URL path patterns to required permissions
 */
const ROUTE_PERMISSIONS: { pattern: RegExp; permission: Permission; method?: string }[] = [
  // Write routes (POST, PUT, PATCH, DELETE)
  { pattern: /^\/api\/transactions/, permission: 'transactions:write', method: 'POST' },
  { pattern: /^\/api\/transactions\/.+/, permission: 'transactions:write', method: 'PUT' },
  { pattern: /^\/api\/transactions\/.+/, permission: 'transactions:write', method: 'DELETE' },
  { pattern: /^\/api\/invoices/, permission: 'invoices:write', method: 'POST' },
  { pattern: /^\/api\/invoices\/.+/, permission: 'invoices:write', method: 'PUT' },
  { pattern: /^\/api\/invoices\/.+/, permission: 'invoices:write', method: 'DELETE' },
  { pattern: /^\/api\/categories/, permission: 'categories:write', method: 'POST' },
  { pattern: /^\/api\/counterparties/, permission: 'counterparties:write', method: 'POST' },
  { pattern: /^\/api\/counterparties\/.+/, permission: 'counterparties:write', method: 'PUT' },
  { pattern: /^\/api\/counterparties\/.+/, permission: 'counterparties:write', method: 'DELETE' },
  { pattern: /^\/api\/projects/, permission: 'projects:write', method: 'POST' },
  { pattern: /^\/api\/rules/, permission: 'rules:write', method: 'POST' },
  { pattern: /^\/api\/approvals/, permission: 'approvals:manage', method: 'POST' },

  // Admin routes
  { pattern: /^\/api\/users/, permission: 'users:manage' },
  { pattern: /^\/api\/settings/, permission: 'settings:manage' },

  // Page routes
  { pattern: /^\/(dashboard\/)?settings/, permission: 'settings:manage' },
  { pattern: /^\/(dashboard\/)?rules/, permission: 'rules:read' },
  { pattern: /^\/(dashboard\/)?approvals/, permission: 'approvals:read' },
]

/**
 * Check if a role can access a specific route
 */
export function canAccessRoute(
  role: Role | string,
  path: string,
  method: string = 'GET'
): boolean {
  for (const route of ROUTE_PERMISSIONS) {
    if (route.pattern.test(path)) {
      // If method is specified and doesn't match, skip this rule
      if (route.method && route.method !== method) continue
      // If no method specified, all methods require permission
      return hasPermission(role, route.permission)
    }
  }

  // Default: allow access for authenticated users
  return true
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: Role | string): Permission[] {
  return ROLE_PERMISSIONS[role as Role] ?? []
}
