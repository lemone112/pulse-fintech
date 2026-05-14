import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/counterparties — list with filters & pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const organizationId = searchParams.get('organizationId')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = {
      organizationId,
    }

    if (type) where.type = type
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { inn: { contains: search } },
        { email: { contains: search } },
      ]
    }

    const [counterparties, total] = await Promise.all([
      db.counterparty.findMany({
        where,
        include: {
          _count: {
            select: { transactions: true, invoices: true, documents: true },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      db.counterparty.count({ where }),
    ])

    return NextResponse.json({
      data: counterparties,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[API] GET /counterparties error:', error)
    return NextResponse.json({ error: 'Failed to fetch counterparties' }, { status: 500 })
  }
}

// POST /api/counterparties — create a counterparty
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, name, inn, type, email, phone, address, contactPerson, notes } = body

    if (!organizationId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, name' },
        { status: 400 }
      )
    }

    const counterparty = await db.counterparty.create({
      data: {
        organizationId,
        name,
        inn: inn || null,
        type: type || 'COMPANY',
        email: email || null,
        phone: phone || null,
        address: address || null,
        contactPerson: contactPerson || null,
        notes: notes || null,
      },
    })

    return NextResponse.json({ data: counterparty }, { status: 201 })
  } catch (error) {
    console.error('[API] POST /counterparties error:', error)
    return NextResponse.json({ error: 'Failed to create counterparty' }, { status: 500 })
  }
}
