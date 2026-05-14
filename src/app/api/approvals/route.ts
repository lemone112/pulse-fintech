import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/approvals — list with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const organizationId = searchParams.get('organizationId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = {
      organizationId,
    }

    if (status) where.status = status
    if (type) where.type = type

    const [approvals, total] = await Promise.all([
      db.approval.findMany({
        where,
        include: {
          steps: {
            include: {
              approver: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
            orderBy: { actedAt: { sort: 'asc', nulls: 'last' } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.approval.count({ where }),
    ])

    return NextResponse.json({
      data: approvals,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[API] GET /approvals error:', error)
    return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 })
  }
}

// POST /api/approvals — create an approval workflow
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, type, entityType, entityId, steps } = body

    if (!organizationId || !type || !entityType || !entityId) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, type, entityType, entityId' },
        { status: 400 }
      )
    }

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { error: 'At least one approval step is required' },
        { status: 400 }
      )
    }

    const approval = await db.approval.create({
      data: {
        organizationId,
        type,
        entityType,
        entityId,
        status: 'PENDING',
        steps: {
          create: steps.map((step: { approverId: string; comment?: string }) => ({
            approverId: step.approverId,
            comment: step.comment || null,
            status: 'PENDING',
          })),
        },
      },
      include: {
        steps: {
          include: {
            approver: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    return NextResponse.json({ data: approval }, { status: 201 })
  } catch (error) {
    console.error('[API] POST /approvals error:', error)
    return NextResponse.json({ error: 'Failed to create approval' }, { status: 500 })
  }
}
