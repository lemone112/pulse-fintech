// ============================================================================
// PULSE Banking — Provider Factory
// ============================================================================
// Creates the appropriate banking provider based on the provider name.

import type { BankingProvider, BankingProviderConfig } from './types'
import { SberbankProvider } from './sberbank'
import { TinkoffProvider } from './tinkoff'
import { VTBProvider } from './vtb'

const PROVIDERS: Record<string, new (config: BankingProviderConfig) => BankingProvider> = {
  sberbank: SberbankProvider,
  sber: SberbankProvider,
  tinkoff: TinkoffProvider,
  tink: TinkoffProvider,
  tbank: TinkoffProvider,
  vtb: VTBProvider,
}

/**
 * Create a banking provider instance based on the provider name.
 *
 * @param providerName - Name of the bank provider (sberbank, tinkoff, vtb)
 * @param config - Provider configuration (apiKey, baseUrl, etc.)
 * @returns BankingProvider instance
 *
 * @throws Error if the provider is not supported
 */
export function createBankingProvider(
  providerName: string,
  config: BankingProviderConfig
): BankingProvider {
  const ProviderClass = PROVIDERS[providerName.toLowerCase()]

  if (!ProviderClass) {
    throw new Error(
      `Неподдерживаемый банковский провайдер: ${providerName}. ` +
      `Доступные: ${Object.keys(PROVIDERS).filter(k => !['sber', 'tink', 'tbank'].includes(k)).join(', ')}`
    )
  }

  return new ProviderClass(config)
}

/**
 * Get list of available banking providers.
 */
export function getAvailableProviders(): Array<{ name: string; displayName: string }> {
  // Use unique providers only
  const seen = new Set<string>()
  const result: Array<{ name: string; displayName: string }> = []

  const providerInstances: Array<{ key: string; name: string; displayName: string }> = [
    { key: 'sberbank', name: 'sberbank', displayName: 'Сбербанк' },
    { key: 'tinkoff', name: 'tinkoff', displayName: 'Т-Банк (Тинькофф)' },
    { key: 'vtb', name: 'vtb', displayName: 'ВТБ' },
  ]

  for (const p of providerInstances) {
    if (!seen.has(p.name)) {
      seen.add(p.name)
      result.push({ name: p.name, displayName: p.displayName })
    }
  }

  return result
}

// Re-export types
export type { BankingProvider, BankingProviderConfig, BankAccount, BankTransaction, PaymentParams, PaymentResult, BankStatement, DateRange } from './types'
