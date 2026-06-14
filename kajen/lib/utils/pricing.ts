import type { PricingRule, DurationType } from '@/lib/types/domain'

export function calculatePrice(
  rules: PricingRule[],
  sizeCategoryId: string | null,
  durationType: DurationType,
  { days = 1, quantity = 1 }: { days?: number; quantity?: number } = {}
): number | null {
  // Prefer exact size match; fall back to rule with no size restriction
  const rule =
    rules.find(r => r.duration_type === durationType && r.size_category_id === sizeCategoryId) ??
    rules.find(r => r.duration_type === durationType && r.size_category_id === null)

  if (!rule) return null

  return durationType === 'per_day'
    ? rule.price_oere * days * quantity
    : rule.price_oere * quantity
}

export function formatPrice(oere: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(oere / 100)
}

export function daysBetween(startDate: string, endDate: string): number {
  const ms = new Date(endDate).getTime() - new Date(startDate).getTime()
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}
