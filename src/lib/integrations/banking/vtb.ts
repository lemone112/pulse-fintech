// ============================================================================
// PULSE Banking — VTB Provider (Stub)
// ============================================================================
// ВТБ — банк с государственным участием
// API: https://api.vtb.ru/v1/

import type { BankingProvider, BankingProviderConfig, BankAccount, BankTransaction, PaymentParams, PaymentResult, BankStatement, DateRange } from './types'

export class VTBProvider implements BankingProvider {
  readonly name = 'vtb'
  readonly displayName = 'ВТБ'

  private config: BankingProviderConfig

  constructor(config: BankingProviderConfig) {
    this.config = config
  }

  async getAccounts(): Promise<BankAccount[]> {
    return [
      {
        id: 'vtb-1',
        name: 'Расчётный счёт ВТБ',
        number: '40702810900000009012',
        currency: 'RUB',
        balance: 0,
        type: 'checking',
        bankName: 'ПАО ВТБ',
        bankBik: '044525411',
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
      id: `vtb-payment-${Date.now()}`,
      status: 'processing',
      bankPaymentId: `VTB${Date.now()}`,
      message: 'Платёж принят к обработке ВТБ',
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
