// ============================================================================
// PULSE EDO (ЭДО) — Electronic Document Flow Types and Interfaces
// ============================================================================
// ЭДО — Электронный документооборот

export interface SendDocumentParams {
  documentId: string
  documentType: string        // 'invoice' | 'act' | 'waybill' | 'contract'
  fileName: string
  content: string | Buffer    // Base64 or binary content
  recipientInn: string        // ИНН получателя
  recipientKpp?: string       // КПП получателя
  recipientName: string       // Название организации получателя
  signDocument?: boolean      // Подписать документ перед отправкой
  certificateId?: string      // ID сертификата для подписи
}

export interface SendResult {
  id: string
  documentId: string
  providerDocumentId: string
  status: 'sent' | 'delivered' | 'signed' | 'rejected' | 'error'
  message?: string
  sentAt: Date
  deliveredAt?: Date
}

export interface ReceivedDocument {
  id: string
  providerDocumentId: string
  documentType: string
  fileName: string
  senderInn: string
  senderName: string
  receivedAt: Date
  status: 'new' | 'read' | 'signed' | 'rejected' | 'archived'
  content?: string            // Base64 encoded content
}

export interface DocumentStatusResult {
  documentId: string
  providerDocumentId: string
  status: 'sent' | 'delivered' | 'signed' | 'rejected' | 'error' | 'awaiting_signature'
  statusHistory: Array<{
    status: string
    timestamp: Date
    comment?: string
  }>
}

export interface CounterpartyEDOStatus {
  inn: string
  isConnected: boolean       // Подключён ли контрагент к ЭДО
  providerName?: string      // Через какого провайдера ЭДО
  edoAddress?: string        // Адрес ЭДО контрагента
}

export interface EDOProvider {
  readonly name: string
  readonly displayName: string

  /** Отправить документ контрагенту */
  sendDocument(params: SendDocumentParams): Promise<SendResult>

  /** Получить входящие документы */
  receiveDocuments(from: Date): Promise<ReceivedDocument[]>

  /** Получить статус документа */
  getDocumentStatus(documentId: string): Promise<DocumentStatusResult>

  /** Проверить подключение контрагента к ЭДО */
  getCounterpartyStatus(inn: string): Promise<CounterpartyEDOStatus>
}

export interface EDOProviderConfig {
  apiKey: string
  baseUrl?: string
  clientId?: string
  clientSecret?: string
  [key: string]: string | undefined
}
