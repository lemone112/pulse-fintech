'use client'

import { Flex, Text } from '@tremor/react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-tremor-background-muted dark:bg-gray-950 p-4">
      <Flex flexDirection="col" className="w-full max-w-md gap-6">
        {/* Pulse branding */}
        <Flex flexDirection="col" className="items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-tremor-brand flex items-center justify-center">
            <Text className="text-white font-bold text-xl">P</Text>
          </div>
          <Text className="text-2xl font-bold text-tremor-content-strong dark:text-white">
            Pulse
          </Text>
          <Text className="text-sm text-tremor-content-subtle">
            Управленческий учёт
          </Text>
        </Flex>

        {/* Auth form */}
        {children}
      </Flex>
    </div>
  )
}
