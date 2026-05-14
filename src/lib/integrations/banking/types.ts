// ============================================================================
// PULSE Banking Provider Abstraction — Types and interfaces
// ============================================================================

export interface BankAccount {
  id: string
  name: string
  number: string
  currency: string
  balance: number
  type: 'checking' | 'savings' | 'credit' | 'deposit'
  bankName: string
  bankBik: string
  status: 'active' | 'closed' | 'blocked'
  openedAt?: Date
}

export interface BankTransaction {
  id: string
  accountId: string
  amount: number
  currency: string
  description: string
  counterpartyName: string
  counterpartyInn: string
  counterpartyAccount: string
  counterpartyBankBik: string
  reference: string
  date: Date
  type: 'debit' | 'credit'
  category?: string
}

export interface PaymentParams {
  fromAccountId: string
  toAccountNumber: string
  toBankBik: string
  toCounterpartyName: string
  toInn: string
  amount: number
  currency: string
  description: string
  paymentPurpose: string    // Назначение платежа
  taxInfo?: {
    kbk: string             // КБК
    okato: string           // ОКАТО
    paymentBasis: string    // Основание платежа
    taxPeriod: string       // Налоговый период
    docNumber: string       // Номер документа
    docDate: string         // Дата документа
    payerStatus: string     // Статус плательщика
  }
  urgent?: boolean          // Срочный платёж
}

export interface PaymentResult {
  id: string
  status: 'accepted' | 'rejected' | 'processing' | 'completed'
  bankPaymentId: string
  message?: string
  executedAt?: Date
}

export interface DateRange {
  from: Date
  to: Date
}

export interface BankStatement {
  accountId: string
  period: DateRange
  openingBalance: number
  closingBalance: number
  totalDebit: number
  totalCredit: number
  transactions: BankTransaction[]
}

export interface BankingProvider {
  readonly name: string
  readonly displayName: string
  getAccounts(): Promise<BankAccount[]>
  getTransactions(accountId: string, from: Date, to: Date): Promise<BankTransaction[]>
  getBalance(accountId: string): Promise<number>
  initiatePayment(params: PaymentParams): Promise<PaymentResult>
  getStatement(accountId: string, period: DateRange): Promise<BankStatement>
  healthCheck(): Promise<boolean>
}

export interface BankingProviderConfig {
  apiKey: string
  baseUrl?: string
  clientId?: string
  clientSecret?: string
  [key: string]: string | undefined
}
