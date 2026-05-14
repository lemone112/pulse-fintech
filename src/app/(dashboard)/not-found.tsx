import Link from 'next/link'
import { Card, Flex, Text, Button, Callout } from '@tremor/react'
import { Home, ArrowLeft, Search } from 'lucide-react'

/**
 * 404 page — "Страница не найдена"
 * Provides a link back to /dashboard.
 */
export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-tremor-background">
      <Card className="max-w-md w-full">
        <Flex flexDirection="col" alignItems="center" className="gap-6 py-8">
          {/* 404 illustration */}
          <div className="text-7xl font-bold text-tremor-content-subtle select-none">404</div>

          <Callout
            title="Страница не найдена"
            icon={Search}
            color="gray"
          >
            Запрашиваемая страница не существует или была перемещена.
          </Callout>

          <Flex className="gap-3">
            <Link href="/dashboard">
              <Button variant="primary" size="sm" icon={Home}>
                На рабочий стол
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              onClick={() => typeof window !== 'undefined' && window.history.back()}
            >
              Назад
            </Button>
          </Flex>
        </Flex>
      </Card>
    </div>
  )
}
