import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/projects — list with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const organizationId = searchParams.get('organizationId')
    const status = searchParams.get('status')
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

    const [projects, total] = await Promise.all([
      db.project.findMany({
        where,
        include: {
          _count: { select: { transactions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.project.count({ where }),
    ])

    // Compute spent amount per project
    const projectsWithSpent = await Promise.all(
      projects.map(async (project) => {
        const result = await db.transaction.aggregate({
          where: {
            projectId: project.id,
            status: 'COMPLETED',
            type: 'EXPENSE',
          },
          _sum: { amount: true },
        })
        return {
          ...project,
          spent: result._sum.amount || 0,
        }
      })
    )

    return NextResponse.json({
      data: projectsWithSpent,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[API] GET /projects error:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

// POST /api/projects — create a project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, name, description, status, budget, startDate, endDate } = body

    if (!organizationId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, name' },
        { status: 400 }
      )
    }

    const project = await db.project.create({
      data: {
        organizationId,
        name,
        description: description || null,
        status: status || 'ACTIVE',
        budget: budget != null ? parseFloat(budget) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    return NextResponse.json({ data: project }, { status: 201 })
  } catch (error) {
    console.error('[API] POST /projects error:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
