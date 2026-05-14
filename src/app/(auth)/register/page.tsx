'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, TextInput, Button, Text, Flex, Callout } from '@tremor/react'
import { Mail, Lock, User, Building2, AlertTriangle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов')
      return
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (!organizationName.trim()) {
      setError('Укажите название организации')
      return
    }

    setLoading(true)

    try {
      // Register user + org
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          organizationName: organizationName.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Ошибка регистрации')
        return
      }

      // Auto sign in after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // Registration succeeded but auto-login failed — redirect to login
        router.push('/login')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Произошла ошибка при регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
        <Flex flexDirection="col" className="gap-4">
          <Text className="text-lg font-semibold text-tremor-content-strong dark:text-white text-center">
            Создать аккаунт
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
            icon={User}
            placeholder="Имя"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />

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
            placeholder="Пароль (минимум 6 символов)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <TextInput
            icon={Lock}
            placeholder="Подтвердите пароль"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />

          <TextInput
            icon={Building2}
            placeholder="Название организации"
            type="text"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            required
            disabled={loading}
          />

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            size="lg"
          >
            Зарегистрироваться
          </Button>

          <Text className="text-center text-sm text-tremor-content-subtle">
            Уже есть аккаунт?{' '}
            <a
              href="/login"
              className="text-tremor-brand hover:underline font-medium"
            >
              Войти
            </a>
          </Text>
        </Flex>
      </form>
    </Card>
  )
}
