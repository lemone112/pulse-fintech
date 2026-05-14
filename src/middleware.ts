import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Routes that don't require authentication
const publicRoutes = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Skip NextAuth internal routes
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Check for JWT token
  let token: Awaited<ReturnType<typeof getToken>> = null
  try {
    token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })
  } catch {
    // Token verification failed — treat as unauthenticated
  }

  // Unauthenticated user
  if (!token) {
    // For API routes, return 401
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    // For page routes, redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated — add organization context to request headers
  const requestHeaders = new Headers(request.headers)
  if (token.organizationId) {
    requestHeaders.set('x-organization-id', token.organizationId as string)
  }
  requestHeaders.set('x-user-id', token.id as string)
  requestHeaders.set('x-user-role', token.role as string)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*', '/'],
}
