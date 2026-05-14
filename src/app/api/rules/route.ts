import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/rules — list with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const organizationId = searchParams.get('organizationId')
    const isActive = searchParams.get('isActive')

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = {
      organizationId,
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const rules = await db.rule.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    })

    // Parse JSON fields
    const data = rules.map((rule) => ({
      ...rule,
      condition: JSON.parse(rule.condition),
      action: JSON.parse(rule.action),
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[API] GET /rules error:', error)
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 })
  }
}

// POST /api/rules — create a rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, name, description, condition, action, isActive, priority } = body

    if (!organizationId || !name || !condition || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, name, condition, action' },
        { status: 400 }
      )
    }

    const rule = await db.rule.create({
      data: {
        organizationId,
        name,
        description: description || null,
        condition: JSON.stringify(condition),
        action: JSON.stringify(action),
        isActive: isActive ?? true,
        priority: priority ?? 0,
      },
    })

    return NextResponse.json({
      data: {
        ...rule,
        condition: JSON.parse(rule.condition),
        action: JSON.parse(rule.action),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[API] POST /rules error:', error)
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 })
  }
}
