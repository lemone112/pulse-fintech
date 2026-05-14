// ============================================================================
// PULSE EDO — СБИС Provider (Stub)
// ============================================================================

import type { EDOProvider, EDOProviderConfig, SendDocumentParams, SendResult, ReceivedDocument, DocumentStatusResult, CounterpartyEDOStatus } from './types'

export class SBISEDOProvider implements EDOProvider {
  readonly name = 'sbis'
  readonly displayName = 'СБИС (Тензор)'

  private config: EDOProviderConfig

  constructor(config: EDOProviderConfig) {
    this.config = config
  }

  async sendDocument(params: SendDocumentParams): Promise<SendResult> {
    return {
      id: `sbis-edo-${Date.now()}`,
      documentId: params.documentId,
      providerDocumentId: `SBIS-${Date.now()}`,
      status: 'sent',
      message: 'Документ отправлен через СБИС',
      sentAt: new Date(),
    }
  }

  async receiveDocuments(_from: Date): Promise<ReceivedDocument[]> {
    return []
  }

  async getDocumentStatus(documentId: string): Promise<DocumentStatusResult> {
    return {
      documentId,
      providerDocumentId: `SBIS-${documentId}`,
      status: 'delivered',
      statusHistory: [
        { status: 'sent', timestamp: new Date(), comment: 'Документ отправлен' },
        { status: 'delivered', timestamp: new Date(), comment: 'Документ доставлен' },
      ],
    }
  }

  async getCounterpartyStatus(inn: string): Promise<CounterpartyEDOStatus> {
    return {
      inn,
      isConnected: true,
      providerName: 'СБИС',
      edoAddress: `2BM_${inn}`,
    }
  }
}
