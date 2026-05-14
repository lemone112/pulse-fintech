// ============================================================================
// PULSE ECP — Контур.Диадок Provider (Stub)
// ============================================================================
// Контур.Диадок — ЭДО и ЭЦП от СКБ Контур

import type { ECPProvider, ECPProviderConfig, Certificate, SignResult, VerifyResult, ProviderInfo } from '../types'

export class DiadocProvider implements ECPProvider {
  readonly name = 'diadoc'
  readonly displayName = 'Контур.Диадок'

  private config: ECPProviderConfig

  constructor(config: ECPProviderConfig) {
    this.config = config
  }

  async signDocument(documentId: string, certId: string): Promise<SignResult> {
    return {
      id: `dd-sig-${Date.now()}`,
      documentId,
      certificateId: certId,
      signatureHex: `dd_${Date.now()}_${documentId}_signed`,
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
        serialNumber: 'DD0123456789',
        subjectName: 'CN=Тестовый пользователь Диадок',
        issuerName: 'CN=УЦ Контур',
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
        id: 'dd-cert-1',
        serialNumber: 'DD0123456789',
        subjectName: 'CN=Тестовый пользователь, O=ООО Тест',
        issuerName: 'CN=УЦ Контур',
        notBefore: new Date('2025-01-01'),
        notAfter: new Date('2026-12-31'),
        status: 'active',
        type: 'combined',
        organizationName: 'ООО Тест',
        inn: '7700000001',
      },
    ]
  }

  getProviderInfo(): ProviderInfo {
    return {
      name: this.name,
      displayName: this.displayName,
      version: '2.0',
      supportedAlgorithms: ['GOST R 34.10-2012', 'GOST R 34.11-2012'],
      supportedFormats: ['PKCS#7', 'CMS'],
      isQualified: true,
      features: ['Подписание документов', 'ЭДО', 'Шифрование', 'Роуминг подписи'],
    }
  }
}
