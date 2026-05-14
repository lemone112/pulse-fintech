// ============================================================================
// PULSE ECP — КриптоПро Provider (Stub)
// ============================================================================
// КриптоПро — лидер рынка ЭЦП в России
// Поддержка ГОСТ Р 34.10-2012, ГОСТ Р 34.11-2012

import type { ECPProvider, ECPProviderConfig, Certificate, SignResult, VerifyResult, ProviderInfo } from '../types'

export class CryptoProProvider implements ECPProvider {
  readonly name = 'cryptopro'
  readonly displayName = 'КриптоПро'

  private config: ECPProviderConfig

  constructor(config: ECPProviderConfig) {
    this.config = config
  }

  async signDocument(documentId: string, certId: string): Promise<SignResult> {
    return {
      id: `cp-sig-${Date.now()}`,
      documentId,
      certificateId: certId,
      signatureHex: `cp_${Date.now()}_${documentId}_signed`,
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
        serialNumber: '0123456789ABCDEF',
        subjectName: 'CN=Тестовый пользователь',
        issuerName: 'CN=Тестовый Удостоверяющий Центр КриптоПро',
        notBefore: new Date('2025-01-01'),
        notAfter: new Date('2026-12-31'),
        status: 'active',
        type: 'signature',
      },
      signingTime: new Date(),
      certificateChain: [
        {
          subjectName: 'CN=Тестовый пользователь',
          issuerName: 'CN=Тестовый Удостоверяющий Центр КриптоПро',
          isValid: true,
        },
      ],
      errors: [],
      warnings: [],
    }
  }

  async getCertificates(_userId: string): Promise<Certificate[]> {
    return [
      {
        id: 'cp-cert-1',
        serialNumber: '0123456789ABCDEF',
        subjectName: 'CN=Тестовый пользователь, O=ООО Тест',
        issuerName: 'CN=УЦ КриптоПро',
        notBefore: new Date('2025-01-01'),
        notAfter: new Date('2026-12-31'),
        status: 'active',
        type: 'combined',
        organizationName: 'ООО Тест',
        inn: '7700000000',
      },
    ]
  }

  getProviderInfo(): ProviderInfo {
    return {
      name: this.name,
      displayName: this.displayName,
      version: '5.0.12000',
      supportedAlgorithms: ['GOST R 34.10-2012', 'GOST R 34.11-2012', 'GOST R 34.10-2001'],
      supportedFormats: ['PKCS#7', 'CMS', 'XML-DSig', 'PADES'],
      isQualified: true,
      features: ['Подписание документов', 'Проверка подписи', 'Управление сертификатами', 'Шифрование'],
    }
  }
}
