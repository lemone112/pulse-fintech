'use client'

import { motion } from 'framer-motion'
import {
  Link2,
  Unlink,
  Bot,
  Globe,
  Key,
  CheckCircle2,
  XCircle,
  Plus,
  Shield,
} from 'lucide-react'
import { Text, Flex, Button, TextInput, Switch, Divider, Card } from '@tremor/react'
import { cn } from '@/lib/utils'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const BANK_CONNECTIONS = [
  { id: '1', name: 'Точка Банк', status: 'connected', lastSync: '5 мин назад', accounts: 2 },
  { id: '2', name: 'Альфа-Банк', status: 'connected', lastSync: '1 час назад', accounts: 1 },
  { id: '3', name: 'Сбербанк', status: 'disconnected', lastSync: null, accounts: 0 },
]

const AI_GATEWAY_STATUS = {
  configured: true,
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o',
  mcpEndpoints: 2,
}

export default function ConnectionsPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6 max-w-2xl">
      <div>
        <Text className="text-2xl font-semibold tracking-tight">Подключения</Text>
        <Text className="text-tremor-content-subtle mt-1">Банковские подключения и AI-шлюз</Text>
      </div>

      <Divider />

      {/* Bank connections */}
      <div className="space-y-4">
        <Flex justifyContent="between" alignItems="center">
          <Text className="text-sm font-medium text-tremor-content-subtle uppercase tracking-wider flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Банковские подключения
          </Text>
          <Button variant="secondary" size="sm" icon={Plus}>
            Добавить банк
          </Button>
        </Flex>

        <div className="space-y-3">
          {BANK_CONNECTIONS.map((bank) => (
            <Card key={bank.id} className="hover:bg-tremor-background-muted transition-colors">
              <Flex justifyContent="between" alignItems="center">
                <Flex alignItems="center" className="space-x-3">
                  <div className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center text-lg',
                    bank.status === 'connected' ? 'bg-success-subtle' : 'bg-tremor-background-muted'
                  )}>
                    🏦
                  </div>
                  <div>
                    <Text className="text-sm font-medium">{bank.name}</Text>
                    <Text className="text-xs text-tremor-content-subtle">
                      {bank.status === 'connected'
                        ? `${bank.accounts} счёт(ов) · Синхр. ${bank.lastSync}`
                        : 'Не подключено'}
                    </Text>
                  </div>
                </Flex>
                <Flex alignItems="center" className="gap-2">
                  {bank.status === 'connected' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <Button variant="light" size="sm" icon={Unlink} className="text-tremor-content-subtle">
                        Отключить
                      </Button>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-tremor-content-subtle" />
                      <Button variant="secondary" size="sm" icon={Link2}>
                        Подключить
                      </Button>
                    </>
                  )}
                </Flex>
              </Flex>
            </Card>
          ))}
        </div>
      </div>

      <Divider />

      {/* AI Gateway */}
      <div className="space-y-4">
        <Text className="text-sm font-medium text-tremor-content-subtle uppercase tracking-wider flex items-center gap-2">
          <Bot className="h-4 w-4" />
          AI Шлюз
        </Text>

        <Card>
          <div className="space-y-4">
            <Flex justifyContent="between" alignItems="center">
              <Flex alignItems="center" className="gap-2">
                <div className={cn(
                  'h-2 w-2 rounded-full',
                  AI_GATEWAY_STATUS.configured ? 'bg-success' : 'bg-tremor-content-subtle'
                )} />
                <Text className="text-sm font-medium">
                  {AI_GATEWAY_STATUS.configured ? 'Настроено' : 'Не настроено'}
                </Text>
              </Flex>
              <Switch defaultChecked={AI_GATEWAY_STATUS.configured} />
            </Flex>

            <div className="space-y-3">
              <div className="space-y-2">
                <Text className="text-sm text-tremor-content-subtle flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  Base URL
                </Text>
                <TextInput
                  defaultValue={AI_GATEWAY_STATUS.baseUrl}
                  placeholder="https://api.openai.com/v1"
                />
              </div>

              <div className="space-y-2">
                <Text className="text-sm text-tremor-content-subtle flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5" />
                  API Ключ
                </Text>
                <TextInput
                  defaultValue="sk-xxx...xxx"
                  placeholder="sk-..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Text className="text-sm text-tremor-content-subtle">Базовая модель</Text>
                  <TextInput defaultValue={AI_GATEWAY_STATUS.model} />
                </div>
                <div className="space-y-2">
                  <Text className="text-sm text-tremor-content-subtle">MCP эндпоинты</Text>
                  <TextInput defaultValue={String(AI_GATEWAY_STATUS.mcpEndpoints)} disabled />
                </div>
              </div>
            </div>

            <Flex justifyContent="end">
              <Button variant="primary" size="sm">Сохранить</Button>
            </Flex>
          </div>
        </Card>
      </div>

      <Divider />

      {/* Security */}
      <div className="space-y-4">
        <Text className="text-sm font-medium text-tremor-content-subtle uppercase tracking-wider flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Безопасность
        </Text>

        <Card>
          <div className="space-y-3">
            <Flex justifyContent="between" alignItems="center">
              <div>
                <Text className="text-sm font-medium">Двухфакторная аутентификация</Text>
                <Text className="text-xs text-tremor-content-subtle">Дополнительный уровень защиты</Text>
              </div>
              <Switch />
            </Flex>
            <Divider />
            <Flex justifyContent="between" alignItems="center">
              <div>
                <Text className="text-sm font-medium">Аудит действий</Text>
                <Text className="text-xs text-tremor-content-subtle">Логирование всех действий в системе</Text>
              </div>
              <Switch defaultChecked />
            </Flex>
          </div>
        </Card>
      </div>
    </motion.div>
  )
}
