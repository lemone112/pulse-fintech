'use client'

import { motion } from 'framer-motion'
import { User, Mail, Building2, Phone, Shield } from 'lucide-react'
import { Title, Text, Flex, Grid, TextInput, Button, Switch, Divider } from '@tremor/react'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

export default function ProfilePage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 space-y-6 max-w-2xl">
      <div>
        <Title>Профиль</Title>
        <Text className="text-tremor-content-subtle mt-1">Управление личными данными и настройками</Text>
      </div>

      <Divider />

      {/* Avatar & name */}
      <Flex alignItems="center" className="gap-4">
        <div className="h-16 w-16 rounded-full bg-tremor-brand-subtle flex items-center justify-center text-2xl font-semibold text-tremor-brand">
          АИ
        </div>
        <div>
          <Text className="text-lg font-medium">Алексей Иванов</Text>
          <Text className="text-sm text-tremor-content-subtle">alexey@pulse.ru</Text>
        </div>
      </Flex>

      <Divider />

      {/* Form */}
      <div className="space-y-4">
        <Grid numItems={2} className="gap-4">
          <div className="space-y-2">
            <Text className="text-sm text-tremor-content-subtle">Имя</Text>
            <TextInput defaultValue="Алексей" />
          </div>
          <div className="space-y-2">
            <Text className="text-sm text-tremor-content-subtle">Фамилия</Text>
            <TextInput defaultValue="Иванов" />
          </div>
        </Grid>

        <div className="space-y-2">
          <Text className="text-sm text-tremor-content-subtle">Email</Text>
          <TextInput icon={Mail} defaultValue="alexey@pulse.ru" />
        </div>

        <div className="space-y-2">
          <Text className="text-sm text-tremor-content-subtle">Телефон</Text>
          <TextInput icon={Phone} defaultValue="+7 (999) 123-45-67" />
        </div>

        <div className="space-y-2">
          <Text className="text-sm text-tremor-content-subtle">Компания</Text>
          <TextInput icon={Building2} defaultValue="ООО «Пульс»" />
        </div>
      </div>

      <Divider />

      {/* Notification settings */}
      <div className="space-y-4">
        <Text className="text-sm font-medium text-tremor-content-subtle uppercase tracking-wider">Уведомления</Text>
        <div className="space-y-3">
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text className="text-sm font-medium">Email уведомления</Text>
              <Text className="text-xs text-tremor-content-subtle">Получать уведомления на почту</Text>
            </div>
            <Switch defaultChecked />
          </Flex>
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text className="text-sm font-medium">Новые транзакции</Text>
              <Text className="text-xs text-tremor-content-subtle">Уведомлять о новых операциях</Text>
            </div>
            <Switch defaultChecked />
          </Flex>
          <Flex justifyContent="between" alignItems="center">
            <div>
              <Text className="text-sm font-medium">Согласование документов</Text>
              <Text className="text-xs text-tremor-content-subtle">Уведомлять о новых запросах</Text>
            </div>
            <Switch defaultChecked />
          </Flex>
        </div>
      </div>

      <Flex justifyContent="end" className="gap-3">
        <Button variant="secondary">Отмена</Button>
        <Button variant="primary">Сохранить</Button>
      </Flex>
    </motion.div>
  )
}
