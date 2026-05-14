// ============================================================================
// PULSE ECP (ЭЦП) — Digital Signature Provider Types and Interfaces
// ============================================================================
// ЭЦП — Электронная цифровая подпись (Russian digital signature)
//
// Top 10 Russian ECP providers:
// 1. КриптоПро — market leader, GOST crypto
// 2. Контур.Диадок — Diadoc (SKB Kontur)
// 3. Такском — Taxcom
// 4. СБИС (Тензор) — SBIS
// 5. Калуга Астрал — Kaluga Astral
// 6. 1С-ЭДО — 1C EDO
// 7. Тензор — Tensor
// 8. Бухсофт — Bukhsoft
// 9. РуСКОНТ — RusConT
// 10. Сфера (Голубой баллон) — Sfera

export interface Certificate {
  id: string
  serialNumber: string
  subjectName: string      // CN=Иванов Иван Иванович
  issuerName: string       // CN=УЦ КриптоПро
  notBefore: Date
  notAfter: Date
  status: 'active' | 'expired' | 'revoked' | 'pending'
  type: 'signature' | 'encryption' | 'combined'
  organizationName?: string
  inn?: string             // ИНН владельца
  ogrn?: string            // ОГРН владельца
  email?: string
}

export interface SignResult {
  id: string
  documentId: string
  certificateId: string
  signatureHex: string
  signedAt: Date
  status: 'valid' | 'invalid' | 'pending'
  providerId: string
}

export interface VerifyResult {
  isValid: boolean
  signerCertificate: Certificate
  signingTime: Date
  certificateChain: Array<{
    subjectName: string
    issuerName: string
    isValid: boolean
  }>
  errors: string[]
  warnings: string[]
}

export interface ProviderInfo {
  name: string
  displayName: string
  version: string
  supportedAlgorithms: string[]  // e.g. ['GOST R 34.10-2012', 'GOST R 34.11-2012']
  supportedFormats: string[]     // e.g. ['PKCS#7', 'CMS', 'XML-DSig']
  isQualified: boolean           // Квалифицированная ЭЦП
  features: string[]
}

export interface ECPProvider {
  readonly name: string
  readonly displayName: string

  /** Подписать документ */
  signDocument(documentId: string, certId: string): Promise<SignResult>

  /** Проверить подпись */
  verifySignature(documentId: string): Promise<VerifyResult>

  /** Получить список сертификатов пользователя */
  getCertificates(userId: string): Promise<Certificate[]>

  /** Информация о провайдере */
  getProviderInfo(): ProviderInfo
}

export interface ECPProviderConfig {
  apiKey: string
  baseUrl?: string
  clientId?: string
  clientSecret?: string
  [key: string]: string | undefined
}
