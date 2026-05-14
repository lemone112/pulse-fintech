// ============================================================================
// PULSE ECP — Provider Factory
// ============================================================================

import type { ECPProvider, ECPProviderConfig } from './types'
import { CryptoProProvider } from './providers/cryptopro'
import { DiadocProvider } from './providers/diadoc'
import { TaxcomProvider } from './providers/taxcom'
import { SBISProvider } from './providers/sbis'
import { KalugaAstralProvider } from './providers/kaluga-astral'
import { OneCEdoProvider } from './providers/1c-edo'

const PROVIDERS: Record<string, new (config: ECPProviderConfig) => ECPProvider> = {
  cryptopro: CryptoProProvider,
  'криптопро': CryptoProProvider,
  diadoc: DiadocProvider,
  'диадок': DiadocProvider,
  taxcom: TaxcomProvider,
  'такском': TaxcomProvider,
  sbis: SBISProvider,
  'сбис': SBISProvider,
  tensor: SBISProvider,
  'тензор': SBISProvider,
  'kaluga-astral': KalugaAstralProvider,
  'калуга-астрал': KalugaAstralProvider,
  '1c-edo': OneCEdoProvider,
  '1с-эдо': OneCEdoProvider,
}

/**
 * Create an ECP provider instance based on the provider name.
 *
 * @param providerName - Name of the ECP provider
 * @param config - Provider configuration
 * @returns ECPProvider instance
 *
 * @throws Error if the provider is not supported
 */
export function createECPProvider(
  providerName: string,
  config: ECPProviderConfig
): ECPProvider {
  const ProviderClass = PROVIDERS[providerName.toLowerCase()]

  if (!ProviderClass) {
    const available = [...new Set(
      Object.entries(PROVIDERS)
        .filter(([k]) => k === k.toLowerCase() && !['криптопро', 'диадок', 'такском', 'сбис', 'тензор', 'калуга-астрал', '1с-эдо'].includes(k))
        .map(([, v]) => v)
        .map((P) => new P({ apiKey: '' }).displayName)
    )]
    throw new Error(
      `Неподдерживаемый провайдер ЭЦП: ${providerName}. Доступные: ${available.join(', ')}`
    )
  }

  return new ProviderClass(config)
}

/**
 * Get list of available ECP providers.
 */
export function getAvailableECPProviders(): Array<{ name: string; displayName: string; isQualified: boolean }> {
  const uniqueProviders: Array<{ name: string; displayName: string; isQualified: boolean }> = []
  const seenNames = new Set<string>()

  const configs: Array<{ name: string; providerClass: new (config: ECPProviderConfig) => ECPProvider }> = [
    { name: 'cryptopro', providerClass: CryptoProProvider },
    { name: 'diadoc', providerClass: DiadocProvider },
    { name: 'taxcom', providerClass: TaxcomProvider },
    { name: 'sbis', providerClass: SBISProvider },
    { name: 'kaluga-astral', providerClass: KalugaAstralProvider },
    { name: '1c-edo', providerClass: OneCEdoProvider },
  ]

  for (const { name, providerClass } of configs) {
    const instance = new providerClass({ apiKey: '' })
    if (!seenNames.has(name)) {
      seenNames.add(name)
      uniqueProviders.push({
        name,
        displayName: instance.displayName,
        isQualified: instance.getProviderInfo().isQualified,
      })
    }
  }

  return uniqueProviders
}

// Re-export types
export type { ECPProvider, ECPProviderConfig, Certificate, SignResult, VerifyResult, ProviderInfo } from './types'
