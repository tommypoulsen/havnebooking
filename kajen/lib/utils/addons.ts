import { calculatePrice } from './pricing'
import type { AddOnRule, DurationType, PricingRule } from '@/lib/types/domain'

export type ResolvedLine = {
  ruleId: string
  label: string
  serviceId?: string
  sizeCategoryId?: string | null
  durationType?: DurationType
  amountOere: number
  quantity: number
}

export function resolveAddOns(
  rules: AddOnRule[],
  formAnswers: Record<string, string>,
  sizeCategoryId: string | null,
  pricingRulesByServiceId: Record<string, PricingRule[]>
): ResolvedLine[] {
  const results: ResolvedLine[] = []

  for (const rule of rules) {
    const conditionsMatch = rule.conditions.every(c => formAnswers[c.field] === c.value)
    if (!conditionsMatch) continue

    let amountOere: number | null = null

    if (rule.fixedPriceOere !== undefined) {
      amountOere = rule.fixedPriceOere
    } else if (rule.sizeTableOere) {
      if (!sizeCategoryId) continue
      amountOere = rule.sizeTableOere[sizeCategoryId] ?? null
      if (amountOere === null) continue
    } else if (rule.serviceId && rule.durationType) {
      const serviceRules = pricingRulesByServiceId[rule.serviceId] ?? []
      amountOere = calculatePrice(serviceRules, sizeCategoryId, rule.durationType)
      if (amountOere === null) continue
    } else {
      continue
    }

    results.push({
      ruleId: rule.id,
      label: rule.label,
      serviceId: rule.serviceId,
      sizeCategoryId: rule.serviceId ? sizeCategoryId : undefined,
      durationType: rule.durationType,
      amountOere,
      quantity: rule.quantity ?? 1,
    })
  }

  return results
}
