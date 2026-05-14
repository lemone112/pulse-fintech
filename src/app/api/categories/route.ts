import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/categories — list with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const organizationId = searchParams.get('organizationId')
    const type = searchParams.get('type')

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = {
      organizationId,
    }

    if (type) where.type = type

    const categories = await db.category.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, color: true, icon: true } },
        _count: { select: { transactions: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({ data: categories })
  } catch (error) {
    console.error('[API] GET /categories error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST /api/categories — create a category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, name, type, icon, color, parentId, sortOrder } = body

    if (!organizationId || !name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, name, type' },
        { status: 400 }
      )
    }

    const category = await db.category.create({
      data: {
        organizationId,
        name,
        type,
        icon: icon || null,
        color: color || null,
        parentId: parentId || null,
        sortOrder: sortOrder ?? 0,
      },
      include: {
        parent: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ data: category }, { status: 201 })
  } catch (error) {
    console.error('[API] POST /categories error:', error)
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Category with this name and type already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
