// ============================================================================
// PULSE Rule Engine — Auto-categorization and auto-routing rules
// ============================================================================
//
// Rules are evaluated in priority order. First match wins.
// Rule structure: { conditions: RuleCondition[], actions: RuleAction[] }
//
// RuleCondition: { field, operator, value }
// RuleAction: { type, value }

// === Types ===

export type RuleOperator = 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'in' | 'startsWith' | 'endsWith' | 'regex'

export interface RuleCondition {
  field: string       // e.g. 'amount', 'description', 'counterparty.inn', 'type'
  operator: RuleOperator
  value: unknown      // value to compare against
}

export type RuleActionType = 'setCategory' | 'setCounterparty' | 'requireApproval' | 'setTag' | 'setProject' | 'setDescription'

export interface RuleAction {
  type: RuleActionType
  value: unknown      // action-specific value
}

export interface Rule {
  id?: string
  name: string
  description?: string
  conditions: RuleCondition[]
  actions: RuleAction[]
  priority: number     // higher = evaluated first
  isActive?: boolean
}

export interface TransactionLike {
  [key: string]: unknown
  amount?: number
  description?: string
  type?: string
  counterpartyId?: string
  categoryId?: string
  projectId?: string
  reference?: string
  status?: string
}

// === Condition Evaluation ===

/**
 * Evaluate a single condition against a transaction object.
 * Supports nested field access via dot notation (e.g. 'counterparty.inn').
 */
function evaluateCondition(condition: RuleCondition, transaction: TransactionLike): boolean {
  // Support nested field access (e.g. 'counterparty.inn')
  const fieldValue = getNestedValue(transaction, condition.field)

  switch (condition.operator) {
    case 'eq':
      return fieldValue === condition.value

    case 'neq':
      return fieldValue !== condition.value

    case 'contains': {
      if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
        return fieldValue.toLowerCase().includes(condition.value.toLowerCase())
      }
      return false
    }

    case 'gt': {
      const numVal = Number(fieldValue)
      const numCond = Number(condition.value)
      if (!isNaN(numVal) && !isNaN(numCond)) return numVal > numCond
      return String(fieldValue) > String(condition.value)
    }

    case 'lt': {
      const numVal = Number(fieldValue)
      const numCond = Number(condition.value)
      if (!isNaN(numVal) && !isNaN(numCond)) return numVal < numCond
      return String(fieldValue) < String(condition.value)
    }

    case 'in': {
      if (Array.isArray(condition.value)) {
        return condition.value.includes(fieldValue)
      }
      return false
    }

    case 'startsWith': {
      if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
        return fieldValue.toLowerCase().startsWith(condition.value.toLowerCase())
      }
      return false
    }

    case 'endsWith': {
      if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
        return fieldValue.toLowerCase().endsWith(condition.value.toLowerCase())
      }
      return false
    }

    case 'regex': {
      if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
        try {
          return new RegExp(condition.value, 'i').test(fieldValue)
        } catch {
          return false
        }
      }
      return false
    }

    default:
      return false
  }
}

/**
 * Get a nested value from an object using dot notation.
 */
function getNestedValue(obj: TransactionLike, path: string): unknown {
  const keys = path.split('.')
  let current: unknown = obj

  for (const key of keys) {
    if (current === null || current === undefined) return undefined
    current = (current as Record<string, unknown>)[key]
  }

  return current
}

/**
 * Evaluate all conditions of a rule against a transaction.
 * All conditions must match (AND logic).
 */
function evaluateAllConditions(conditions: RuleCondition[], transaction: TransactionLike): boolean {
  return conditions.every((condition) => evaluateCondition(condition, transaction))
}

// === Rule Evaluation ===

/**
 * Evaluate rules against a transaction in priority order.
 * Returns the actions from the first matching rule.
 * First match wins — higher priority rules are evaluated first.
 */
export function evaluateRules(
  transaction: TransactionLike,
  rules: Rule[]
): RuleAction[] {
  // Sort by priority descending (higher priority first)
  const sortedRules = [...rules]
    .filter((r) => r.isActive !== false)
    .sort((a, b) => b.priority - a.priority)

  for (const rule of sortedRules) {
    if (evaluateAllConditions(rule.conditions, transaction)) {
      return rule.actions
    }
  }

  return []
}

/**
 * Evaluate all matching rules (not just first match).
 * Useful for collecting tags from multiple rules.
 */
export function evaluateAllRules(
  transaction: TransactionLike,
  rules: Rule[]
): Array<{ rule: Rule; actions: RuleAction[] }> {
  const sortedRules = [...rules]
    .filter((r) => r.isActive !== false)
    .sort((a, b) => b.priority - a.priority)

  const results: Array<{ rule: Rule; actions: RuleAction[] }> = []

  for (const rule of sortedRules) {
    if (evaluateAllConditions(rule.conditions, transaction)) {
      results.push({ rule, actions: rule.actions })
    }
  }

  return results
}

// === Action Application ===

/**
 * Apply rule actions to a transaction, producing a partial update.
 */
export function applyActions(
  transaction: TransactionLike,
  actions: RuleAction[]
): Partial<TransactionLike> {
  const updates: Partial<TransactionLike> = {}

  for (const action of actions) {
    switch (action.type) {
      case 'setCategory':
        updates.categoryId = String(action.value)
        break

      case 'setCounterparty':
        updates.counterpartyId = String(action.value)
        break

      case 'requireApproval':
        // This is a flag, not a direct field update
        // The caller should check this and create an approval workflow
        (updates as Record<string, unknown>)._requiresApproval = true
        break

      case 'setTag':
        // Tags are stored as metadata
        if (!(updates as Record<string, unknown>)._tags) {
          (updates as Record<string, unknown>)._tags = []
        }
        ;((updates as Record<string, unknown>)._tags as unknown[]).push(action.value)
        break

      case 'setProject':
        updates.projectId = String(action.value)
        break

      case 'setDescription':
        updates.description = String(action.value)
        break
    }
  }

  return updates
}

// === Built-in Rule Templates ===

/**
 * Common rule templates for Russian fintech
 */
export const RULE_TEMPLATES: Array<{
  name: string
  description: string
  conditions: RuleCondition[]
  actions: RuleAction[]
}> = [
  {
    name: 'Расходы > 100 000 ₽ — согласование',
    description: 'Требовать согласование для расходов свыше 100 тысяч рублей',
    conditions: [
      { field: 'type', operator: 'eq', value: 'EXPENSE' },
      { field: 'amount', operator: 'gt', value: 100000 },
    ],
    actions: [
      { type: 'requireApproval', value: true },
    ],
  },
  {
    name: 'Автокатегоризация — аренда',
    description: 'Автоматически категоризировать транзакции с описанием аренды',
    conditions: [
      { field: 'description', operator: 'regex', value: 'аренд|lease|rent' },
    ],
    actions: [
      { type: 'setCategory', value: 'category-rent' },
    ],
  },
  {
    name: 'Автокатегоризация — зарплата',
    description: 'Автоматически категоризировать зарплатные выплаты',
    conditions: [
      { field: 'description', operator: 'regex', value: 'зарплат|salary|payroll|оклад' },
    ],
    actions: [
      { type: 'setCategory', value: 'category-salary' },
    ],
  },
  {
    name: 'Транзакции с ИП — особая категория',
    description: 'Выделять транзакции с индивидуальными предпринимателями',
    conditions: [
      { field: 'counterparty.type', operator: 'eq', value: 'INDIVIDUAL' },
    ],
    actions: [
      { type: 'setTag', value: 'ИП' },
    ],
  },
]
