// ============================================================================
// PULSE ECP — 1С-ЭДО Provider (Stub)
// ============================================================================

import type { ECPProvider, ECPProviderConfig, Certificate, SignResult, VerifyResult, ProviderInfo } from '../types'

export class OneCEdoProvider implements ECPProvider {
  readonly name = '1c-edo'
  readonly displayName = '1С-ЭДО'

  private config: ECPProviderConfig

  constructor(config: ECPProviderConfig) {
    this.config = config
  }

  async signDocument(documentId: string, certId: string): Promise<SignResult> {
    return {
      id: `1c-sig-${Date.now()}`,
      documentId,
      certificateId: certId,
      signatureHex: `1c_${Date.now()}_${documentId}_signed`,
      signedAt: new Date(),
      status: 'valid',
      providerId: this.name,
    }
  }

  async verifySignature(documentId: string): Promise<VerifyResult> {
    return {
      isValid: true,
      signerCertificate: {
        id: 'cert-stub',
        serialNumber: '1C0123456789',
        subjectName: 'CN=Тестовый пользователь 1С-ЭДО',
        issuerName: 'CN=УЦ 1С',
        notBefore: new Date('2025-01-01'),
        notAfter: new Date('2026-12-31'),
        status: 'active',
        type: 'signature',
      },
      signingTime: new Date(),
      certificateChain: [],
      errors: [],
      warnings: [],
    }
  }

  async getCertificates(_userId: string): Promise<Certificate[]> {
    return [
      {
        id: '1c-cert-1',
        serialNumber: '1C0123456789',
        subjectName: 'CN=Тестовый пользователь, O=ООО Тест',
        issuerName: 'CN=УЦ 1С',
        notBefore: new Date('2025-01-01'),
        notAfter: new Date('2026-12-31'),
        status: 'active',
        type: 'combined',
        organizationName: 'ООО Тест',
        inn: '7700000005',
      },
    ]
  }

  getProviderInfo(): ProviderInfo {
    return {
      name: this.name,
      displayName: this.displayName,
      version: '3.0',
      supportedAlgorithms: ['GOST R 34.10-2012', 'GOST R 34.11-2012'],
      supportedFormats: ['PKCS#7', 'CMS'],
      isQualified: true,
      features: ['Подписание документов', 'ЭДО', '1С:Бухгалтерия интеграция'],
    }
  }
}
