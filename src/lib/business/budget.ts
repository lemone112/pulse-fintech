// ============================================================================
// PULSE Budget Module — Planning and variance analysis
// ============================================================================
// - Annual budget by category
// - Monthly breakdown
// - Plan vs Actual comparison
// - Variance analysis
// - Forecast based on historical data

import { db } from '@/lib/db'

// === Types ===

export interface BudgetPlan {
  id: string
  categoryId: string
  categoryName: string
  year: number
  month: number | null    // null = annual, 1-12 = monthly
  planAmount: number
  factAmount: number
  variance: number
  variancePercent: number
}

export interface BudgetSummary {
  year: number
  totalPlan: number
  totalFact: number
  totalVariance: number
  totalVariancePercent: number
  categories: BudgetPlan[]
  monthlyBreakdown: Array<{
    month: number
    monthName: string
    plan: number
    fact: number
    variance: number
  }>
}

export interface ForecastItem {
  month: string     // '2026-01' format
  forecast: number
  confidence: 'low' | 'medium' | 'high'
  basedOnMonths: number  // how many months of data used
}

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

// === Budget CRUD ===

/**
 * Create or update a budget item.
 * Upserts based on the unique constraint (organizationId, categoryId, year, month).
 */
export async function upsertBudgetItem(params: {
  organizationId: string
  categoryId: string
  year: number
  month: number | null
  amount: number
}): Promise<unknown> {
  return db.budgetItem.upsert({
    where: {
      organizationId_categoryId_year_month: {
        organizationId: params.organizationId,
        categoryId: params.categoryId,
        year: params.year,
        month: params.month,
      },
    },
    create: {
      organizationId: params.organizationId,
      categoryId: params.categoryId,
      year: params.year,
      month: params.month,
      amount: params.amount,
    },
    update: {
      amount: params.amount,
    },
  })
}

/**
 * Get budget items for an organization and year.
 */
export async function getBudgetItems(params: {
  organizationId: string
  year: number
  categoryId?: string
  month?: number | null
}): Promise<unknown[]> {
  return db.budgetItem.findMany({
    where: {
      organizationId: params.organizationId,
      year: params.year,
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params.month !== undefined ? { month: params.month } : {}),
    },
    include: {
      category: { select: { id: true, name: true, type: true } },
    },
    orderBy: [{ categoryId: 'asc' }, { month: 'asc' }],
  })
}

// === Plan vs Actual ===

/**
 * Get plan vs actual comparison for a given year.
 * Calculates actuals from transaction data.
 */
export async function getPlanVsActual(params: {
  organizationId: string
  year: number
  categoryId?: string
}): Promise<BudgetSummary> {
  const { organizationId, year, categoryId } = params

  // Get budget items
  const budgetItems = await db.budgetItem.findMany({
    where: {
      organizationId,
      year,
      ...(categoryId ? { categoryId } : {}),
    },
    include: {
      category: { select: { id: true, name: true, type: true } },
    },
  })

  // Get actual transactions for the year
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31, 23, 59, 59)

  const transactions = await db.transaction.findMany({
    where: {
      organizationId,
      transactionDate: { gte: startDate, lte: endDate },
      status: 'COMPLETED',
      ...(categoryId ? { categoryId } : {}),
    },
    include: {
      category: { select: { id: true, name: true, type: true } },
    },
  })

  // Calculate actuals by category and month
  const actualsByCategory = new Map<string, Map<number, number>>()

  for (const t of transactions) {
    const catId = t.categoryId || 'uncategorized'
    const month = t.transactionDate.getMonth() + 1

    if (!actualsByCategory.has(catId)) {
      actualsByCategory.set(catId, new Map())
    }
    const monthMap = actualsByCategory.get(catId)!
    monthMap.set(month, (monthMap.get(month) || 0) + (t.type === 'INCOME' ? t.amount : -t.amount))
  }

  // Build budget plans
  const categories: BudgetPlan[] = budgetItems.map((item) => {
    const catId = item.categoryId
    const month = item.month
    const planAmount = item.amount

    let factAmount = 0
    if (month) {
      factAmount = actualsByCategory.get(catId)?.get(month) || 0
    } else {
      // Annual — sum all months
      const monthMap = actualsByCategory.get(catId)
      if (monthMap) {
        for (const amount of monthMap.values()) {
          factAmount += amount
        }
      }
    }

    const variance = factAmount - planAmount
    const variancePercent = planAmount !== 0 ? (variance / Math.abs(planAmount)) * 100 : 0

    return {
      id: item.id,
      categoryId: catId,
      categoryName: item.category.name,
      year: item.year,
      month,
      planAmount,
      factAmount,
      variance,
      variancePercent,
    }
  })

  // Monthly breakdown
  const monthlyData = new Map<number, { plan: number; fact: number }>()
  for (let m = 1; m <= 12; m++) {
    monthlyData.set(m, { plan: 0, fact: 0 })
  }

  for (const item of budgetItems) {
    if (item.month) {
      const existing = monthlyData.get(item.month)!
      existing.plan += item.amount
    } else {
      // Annual item — distribute evenly
      for (let m = 1; m <= 12; m++) {
        monthlyData.get(m)!.plan += item.amount / 12
      }
    }
  }

  for (const [, monthMap] of actualsByCategory) {
    for (const [month, amount] of monthMap) {
      monthlyData.get(month)!.fact += amount
    }
  }

  const monthlyBreakdown = Array.from(monthlyData.entries()).map(([month, data]) => ({
    month,
    monthName: MONTH_NAMES[month - 1],
    plan: data.plan,
    fact: data.fact,
    variance: data.fact - data.plan,
  }))

  const totalPlan = categories.reduce((sum, c) => sum + c.planAmount, 0)
  const totalFact = categories.reduce((sum, c) => sum + c.factAmount, 0)
  const totalVariance = totalFact - totalPlan

  return {
    year,
    totalPlan,
    totalFact,
    totalVariance,
    totalVariancePercent: totalPlan !== 0 ? (totalVariance / Math.abs(totalPlan)) * 100 : 0,
    categories,
    monthlyBreakdown,
  }
}

// === Forecast ===

/**
 * Generate a forecast based on historical data.
 * Uses simple moving average for forecasting.
 */
export async function getForecast(params: {
  organizationId: string
  categoryId?: string
  monthsAhead?: number
  baseMonths?: number
}): Promise<ForecastItem[]> {
  const { organizationId, categoryId, monthsAhead = 3, baseMonths = 6 } = params

  // Get recent transactions
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - baseMonths)

  const transactions = await db.transaction.findMany({
    where: {
      organizationId,
      transactionDate: { gte: startDate },
      status: 'COMPLETED',
      ...(categoryId ? { categoryId } : {}),
    },
  })

  // Calculate monthly totals
  const monthlyTotals = new Map<string, number>()
  for (const t of transactions) {
    const monthKey = t.transactionDate.toISOString().slice(0, 7)
    monthlyTotals.set(
      monthKey,
      (monthlyTotals.get(monthKey) || 0) + (t.type === 'INCOME' ? t.amount : -t.amount)
    )
  }

  // Calculate average
  const totals = Array.from(monthlyTotals.values())
  const avg = totals.length > 0 ? totals.reduce((a, b) => a + b, 0) / totals.length : 0

  // Generate forecast
  const forecast: ForecastItem[] = []
  const now = new Date()

  for (let i = 1; i <= monthsAhead; i++) {
    const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const monthKey = forecastDate.toISOString().slice(0, 7)

    // Confidence based on amount of historical data
    const dataPoints = totals.length
    const confidence: 'low' | 'medium' | 'high' =
      dataPoints >= 4 ? 'high' : dataPoints >= 2 ? 'medium' : 'low'

    forecast.push({
      month: monthKey,
      forecast: Math.round(avg),
      confidence,
      basedOnMonths: dataPoints,
    })
  }

  return forecast
}

// === Variance Analysis ===

/**
 * Analyze budget variances and identify significant deviations.
 */
export async function analyzeVariances(params: {
  organizationId: string
  year: number
  thresholdPercent?: number
}): Promise<Array<{
  categoryId: string
  categoryName: string
  month: number | null
  planAmount: number
  factAmount: number
  variance: number
  variancePercent: number
  severity: 'low' | 'medium' | 'high'
}>> {
  const summary = await getPlanVsActual(params)
  const threshold = params.thresholdPercent || 10

  return summary.categories
    .filter((c) => Math.abs(c.variancePercent) >= threshold)
    .map((c) => ({
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      month: c.month,
      planAmount: c.planAmount,
      factAmount: c.factAmount,
      variance: c.variance,
      variancePercent: c.variancePercent,
      severity: Math.abs(c.variancePercent) >= 50
        ? 'high' as const
        : Math.abs(c.variancePercent) >= 25
          ? 'medium' as const
          : 'low' as const,
    }))
    .sort((a, b) => Math.abs(b.variancePercent) - Math.abs(a.variancePercent))
}
