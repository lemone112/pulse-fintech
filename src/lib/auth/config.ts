import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { db } from '@/lib/db'

// Simple password hashing using Web Crypto API (works in Edge/Node)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Введите email и пароль')
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: {
            memberships: {
              include: { organization: true },
              orderBy: { joinedAt: 'asc' },
              take: 1,
            },
          },
        })

        if (!user) {
          throw new Error('Пользователь не найден')
        }

        if (!user.passwordHash) {
          throw new Error('Войдите через OAuth провайдер')
        }

        const isValid = await verifyPassword(credentials.password, user.passwordHash)
        if (!isValid) {
          throw new Error('Неверный пароль')
        }

        const membership = user.memberships[0]

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: membership?.role ?? user.role,
          organizationId: membership?.organizationId ?? null,
          organizationName: membership?.organization?.name ?? null,
        }
      },
    }),
    // Google OAuth — only enabled if env vars are set
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    newUser: '/register',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in — add user data to token
      if (user) {
        token.id = user.id as string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any
        token.role = String(u.role ?? 'VIEWER')
        token.organizationId = u.organizationId ?? null
        token.organizationName = u.organizationName ?? null
      }
      return token
    },
    async session({ session, token }) {
      // Forward token data to session
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as Record<string, unknown>).role = token.role
        ;(session.user as Record<string, unknown>).organizationId = token.organizationId
        ;(session.user as Record<string, unknown>).organizationName = token.organizationName
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}
