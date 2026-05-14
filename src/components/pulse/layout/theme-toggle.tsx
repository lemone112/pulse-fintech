'use client'

import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { Button, Icon } from '@tremor/react'
import { Sun, Moon } from 'lucide-react'

const emptySubscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot)

  if (!mounted) {
    return (
      <Button
        variant="secondary"
        size="xl"
        className="h-8 w-8 p-0"
        aria-label="Переключить тему"
      >
        <span className="sr-only">Переключить тему</span>
      </Button>
    )
  }

  const isDark = theme === 'dark'

  return (
    <Button
      variant="secondary"
      size="xl"
      className="h-8 w-8 p-0"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Светлая тема' : 'Тёмная тема'}
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
    >
      <Icon icon={isDark ? Sun : Moon} className="h-4 w-4" />
    </Button>
  )
}
