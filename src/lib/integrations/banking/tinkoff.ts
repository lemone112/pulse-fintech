// ============================================================================
// PULSE Banking — Tinkoff Provider (Stub)
// ============================================================================
// Тинькофф (Т-Банк) — цифровой банк для бизнеса
// API: https://business.tinkoff.ru/api/v1/

import type { BankingProvider, BankingProviderConfig, BankAccount, BankTransaction, PaymentParams, PaymentResult, BankStatement, DateRange } from './types'

export class TinkoffProvider implements BankingProvider {
  readonly name = 'tinkoff'
  readonly displayName = 'Т-Банк (Тинькофф)'

  private config: BankingProviderConfig

  constructor(config: BankingProviderConfig) {
    this.config = config
  }

  async getAccounts(): Promise<BankAccount[]> {
    return [
      {
        id: 'tink-1',
        name: 'Расчётный счёт Т-Банк',
        number: '40702810800000005678',
        currency: 'RUB',
        balance: 0,
        type: 'checking',
        bankName: 'АО Тинькофф Банк',
        bankBik: '044525974',
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
      id: `tink-payment-${Date.now()}`,
      status: 'processing',
      bankPaymentId: `TK${Date.now()}`,
      message: 'Платёж принят к обработке Т-Банком',
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
    return true
  }
}
