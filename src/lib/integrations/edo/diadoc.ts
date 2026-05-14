// ============================================================================
// PULSE EDO — Контур.Диадок Provider (Stub)
// ============================================================================

import type { EDOProvider, EDOProviderConfig, SendDocumentParams, SendResult, ReceivedDocument, DocumentStatusResult, CounterpartyEDOStatus } from './types'

export class DiadocEDOProvider implements EDOProvider {
  readonly name = 'diadoc'
  readonly displayName = 'Контур.Диадок'

  private config: EDOProviderConfig

  constructor(config: EDOProviderConfig) {
    this.config = config
  }

  async sendDocument(params: SendDocumentParams): Promise<SendResult> {
    return {
      id: `dd-edo-${Date.now()}`,
      documentId: params.documentId,
      providerDocumentId: `DD-${Date.now()}`,
      status: 'sent',
      message: 'Документ отправлен через Контур.Диадок',
      sentAt: new Date(),
    }
  }

  async receiveDocuments(_from: Date): Promise<ReceivedDocument[]> {
    return []
  }

  async getDocumentStatus(documentId: string): Promise<DocumentStatusResult> {
    return {
      documentId,
      providerDocumentId: `DD-${documentId}`,
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
      providerName: 'Контур.Диадок',
      edoAddress: `2BF_${inn}`,
    }
  }
}
