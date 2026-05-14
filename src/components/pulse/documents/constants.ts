export const STATUS_MAP: Record<string, { label: string; color: string }> = {
  signed: { label: 'Подписан', color: 'text-success bg-success-subtle' },
  pending: { label: 'Ожидает', color: 'text-warning bg-warning-subtle' },
  paid: { label: 'Оплачен', color: 'text-success bg-success-subtle' },
  draft: { label: 'Черновик', color: 'text-muted-foreground bg-muted' },
}

export type TremorBadgeColor = 'emerald' | 'amber' | 'red' | 'gray' | 'blue' | 'violet' | 'pink' | 'cyan' | 'orange' | 'indigo' | 'teal' | 'fuchsia' | 'purple' | 'lime' | 'yellow' | 'rose'

export function statusToTremorColor(status: string): TremorBadgeColor {
  switch (status) {
    case 'signed':
      return 'emerald'
    case 'pending':
      return 'amber'
    case 'paid':
      return 'emerald'
    case 'draft':
      return 'gray'
    default:
      return 'gray'
  }
}

export const TYPE_MAP: Record<string, string> = {
  contract: 'Договор',
  invoice: 'Счёт',
  act: 'Акт',
}

export const TYPE_ICON_MAP: Record<string, string> = {
  contract: '📄',
  invoice: '💰',
  act: '✅',
}
