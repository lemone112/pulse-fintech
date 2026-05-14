import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
      organizationId: string | null
      organizationName: string | null
    }
  }

  interface User {
    role: string
    organizationId: string | null
    organizationName: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    organizationId: string | null
    organizationName: string | null
  }
}
