// ============================================================================
// PULSE Banking — Sberbank Provider (Stub)
// ============================================================================
// Сбербанк — крупнейший банк РФ
// API: https://api.sberbank.ru/v1/

import type { BankingProvider, BankingProviderConfig, BankAccount, BankTransaction, PaymentParams, PaymentResult, BankStatement, DateRange } from './types'

export class SberbankProvider implements BankingProvider {
  readonly name = 'sberbank'
  readonly displayName = 'Сбербанк'

  private config: BankingProviderConfig

  constructor(config: BankingProviderConfig) {
    this.config = config
  }

  async getAccounts(): Promise<BankAccount[]> {
    // Stub: return mock accounts
    return [
      {
        id: 'sber-1',
        name: 'Расчётный счёт Сбербанк',
        number: '40702810400000001234',
        currency: 'RUB',
        balance: 0,
        type: 'checking',
        bankName: 'ПАО Сбербанк',
        bankBik: '044525225',
        status: 'active',
      },
    ]
  }

  async getTransactions(_accountId: string, _from: Date, _to: Date): Promise<BankTransaction[]> {
    return []
  }

  async getBalance(_accountId: string): Promise<number> {
    return 0
  }

  async initiatePayment(_params: PaymentParams): Promise<PaymentResult> {
    return {
      id: `sber-payment-${Date.now()}`,
      status: 'processing',
      bankPaymentId: `SB${Date.now()}`,
      message: 'Платёж принят к обработке Сбербанком',
    }
  }

  async getStatement(accountId: string, period: DateRange): Promise<BankStatement> {
    return {
      accountId,
      period,
      openingBalance: 0,
      closingBalance: 0,
      totalDebit: 0,
      totalCredit: 0,
      transactions: [],
    }
  }

  async healthCheck(): Promise<boolean> {
    // Stub: always returns true
    return true
  }
}
