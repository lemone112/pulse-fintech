'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, TextInput, Button, Text, Flex, Callout } from '@tremor/react'
import { Mail, Lock, AlertTriangle } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
  const errorParam = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(errorParam ? 'Ошибка авторизации' : null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError('Произошла ошибка при входе')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
        <Flex flexDirection="col" className="gap-4">
          <Text className="text-lg font-semibold text-tremor-content-strong dark:text-white text-center">
            Вход в аккаунт
          </Text>

          {error && (
            <Callout
              title="Ошибка"
              icon={AlertTriangle}
              color="rose"
            >
              {error}
            </Callout>
          )}

          <TextInput
            icon={Mail}
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <TextInput
            icon={Lock}
            placeholder="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            size="lg"
          >
            Войти
          </Button>

          <Text className="text-center text-sm text-tremor-content-subtle">
            Нет аккаунта?{' '}
            <a
              href="/register"
              className="text-tremor-brand hover:underline font-medium"
            >
              Зарегистрироваться
            </a>
          </Text>
        </Flex>
      </form>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Card className="w-full"><Text>Загрузка...</Text></Card>}>
      <LoginForm />
    </Suspense>
  )
}
