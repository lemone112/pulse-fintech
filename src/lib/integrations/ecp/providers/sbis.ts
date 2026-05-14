// ============================================================================
// PULSE ECP — СБИС (Тензор) Provider (Stub)
// ============================================================================

import type { ECPProvider, ECPProviderConfig, Certificate, SignResult, VerifyResult, ProviderInfo } from '../types'

export class SBISProvider implements ECPProvider {
  readonly name = 'sbis'
  readonly displayName = 'СБИС (Тензор)'

  private config: ECPProviderConfig

  constructor(config: ECPProviderConfig) {
    this.config = config
  }

  async signDocument(documentId: string, certId: string): Promise<SignResult> {
    return {
      id: `sbis-sig-${Date.now()}`,
      documentId,
      certificateId: certId,
      signatureHex: `sbis_${Date.now()}_${documentId}_signed`,
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
        serialNumber: 'SBIS0123456789',
        subjectName: 'CN=Тестовый пользователь СБИС',
        issuerName: 'CN=УЦ Тензор',
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
        id: 'sbis-cert-1',
        serialNumber: 'SBIS0123456789',
        subjectName: 'CN=Тестовый пользователь, O=ООО Тест',
        issuerName: 'CN=УЦ Тензор',
        notBefore: new Date('2025-01-01'),
        notAfter: new Date('2026-12-31'),
        status: 'active',
        type: 'combined',
        organizationName: 'ООО Тест',
        inn: '7700000003',
      },
    ]
  }

  getProviderInfo(): ProviderInfo {
    return {
      name: this.name,
      displayName: this.displayName,
      version: '4.0',
      supportedAlgorithms: ['GOST R 34.10-2012', 'GOST R 34.11-2012'],
      supportedFormats: ['PKCS#7', 'CMS', 'XML-DSig'],
      isQualified: true,
      features: ['Подписание документов', 'ЭДО', 'Управление задачами', 'Отчётность', 'Бухгалтерия'],
    }
  }
}
