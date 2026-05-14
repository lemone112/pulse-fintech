// ============================================================================
// PULSE EDO — Provider Factory
// ============================================================================

import type { EDOProvider, EDOProviderConfig } from './types'
import { DiadocEDOProvider } from './diadoc'
import { SBISEDOProvider } from './sbis'

const PROVIDERS: Record<string, new (config: EDOProviderConfig) => EDOProvider> = {
  diadoc: DiadocEDOProvider,
  'диадок': DiadocEDOProvider,
  sbis: SBISEDOProvider,
  'сбис': SBISEDOProvider,
  tensor: SBISEDOProvider,
}

/**
 * Create an EDO provider instance based on the provider name.
 */
export function createEDOProvider(
  providerName: string,
  config: EDOProviderConfig
): EDOProvider {
  const ProviderClass = PROVIDERS[providerName.toLowerCase()]

  if (!ProviderClass) {
    throw new Error(
      `Неподдерживаемый провайдер ЭДО: ${providerName}. Доступные: diadoc, sbis`
    )
  }

  return new ProviderClass(config)
}

/**
 * Get list of available EDO providers.
 */
export function getAvailableEDOProviders(): Array<{ name: string; displayName: string }> {
  const seen = new Set<string>()
  const result: Array<{ name: string; displayName: string }> = []

  const providers: Array<{ name: string; providerClass: new (config: EDOProviderConfig) => EDOProvider }> = [
    { name: 'diadoc', providerClass: DiadocEDOProvider },
    { name: 'sbis', providerClass: SBISEDOProvider },
  ]

  for (const { name, providerClass } of providers) {
    if (!seen.has(name)) {
      seen.add(name)
      const instance = new providerClass({ apiKey: '' })
      result.push({ name, displayName: instance.displayName })
    }
  }

  return result
}

// Re-export types
export type { EDOProvider, EDOProviderConfig, SendDocumentParams, SendResult, ReceivedDocument, DocumentStatusResult, CounterpartyEDOStatus } from './types'
