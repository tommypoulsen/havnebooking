import { describe, it, expect } from 'vitest'
import { calculatePrice, formatPrice, daysBetween } from '@/lib/utils/pricing'
import type { PricingRule } from '@/lib/types/domain'

// ---- fixtures ----

const rulePerLift = (sizeCategoryId: string | null, price: number): PricingRule => ({
  id: 'r1', service_id: 's1', size_category_id: sizeCategoryId,
  duration_type: 'per_lift', price_oere: price, valid_from: null, valid_to: null,
})

const rulePerDay = (sizeCategoryId: string | null, price: number): PricingRule => ({
  id: 'r2', service_id: 's1', size_category_id: sizeCategoryId,
  duration_type: 'per_day', price_oere: price, valid_from: null, valid_to: null,
})

const rulePerSeason = (sizeCategoryId: string | null, price: number): PricingRule => ({
  id: 'r3', service_id: 's1', size_category_id: sizeCategoryId,
  duration_type: 'per_season', price_oere: price, valid_from: null, valid_to: null,
})

// ---- calculatePrice ----

describe('calculatePrice', () => {
  it('returns null when no rules match', () => {
    expect(calculatePrice([], 'cat-1', 'per_lift')).toBeNull()
  })

  it('returns null when duration type does not match', () => {
    const rules = [rulePerLift('cat-1', 89300)]
    expect(calculatePrice(rules, 'cat-1', 'per_day')).toBeNull()
  })

  it('returns price for exact size match', () => {
    const rules = [rulePerLift('cat-1', 89300), rulePerLift('cat-2', 120000)]
    expect(calculatePrice(rules, 'cat-1', 'per_lift')).toBe(89300)
    expect(calculatePrice(rules, 'cat-2', 'per_lift')).toBe(120000)
  })

  it('falls back to catch-all rule (null size) when no exact match', () => {
    const rules = [rulePerLift(null, 50000), rulePerLift('cat-2', 120000)]
    expect(calculatePrice(rules, 'cat-99', 'per_lift')).toBe(50000)
  })

  it('prefers exact size match over catch-all', () => {
    const rules = [rulePerLift(null, 50000), rulePerLift('cat-1', 89300)]
    expect(calculatePrice(rules, 'cat-1', 'per_lift')).toBe(89300)
  })

  it('per_lift price is flat regardless of days', () => {
    const rules = [rulePerLift('cat-1', 89300)]
    expect(calculatePrice(rules, 'cat-1', 'per_lift', { days: 7 })).toBe(89300)
  })

  it('per_season price is flat regardless of days', () => {
    const rules = [rulePerSeason('cat-1', 150000)]
    expect(calculatePrice(rules, 'cat-1', 'per_season', { days: 180 })).toBe(150000)
  })

  it('per_day price multiplies by number of days', () => {
    const rules = [rulePerDay('cat-1', 10000)]
    expect(calculatePrice(rules, 'cat-1', 'per_day', { days: 7 })).toBe(70000)
  })

  it('per_day defaults to 1 day when days not provided', () => {
    const rules = [rulePerDay('cat-1', 10000)]
    expect(calculatePrice(rules, 'cat-1', 'per_day')).toBe(10000)
  })

  it('applies quantity multiplier', () => {
    const rules = [rulePerLift('cat-1', 89300)]
    expect(calculatePrice(rules, 'cat-1', 'per_lift', { quantity: 3 })).toBe(89300 * 3)
  })

  it('applies both days and quantity for per_day', () => {
    const rules = [rulePerDay('cat-1', 10000)]
    expect(calculatePrice(rules, 'cat-1', 'per_day', { days: 5, quantity: 2 })).toBe(100000)
  })
})

// ---- formatPrice ----

describe('formatPrice', () => {
  it('formats øre as DKK currency string', () => {
    const result = formatPrice(89300)
    expect(result).toMatch(/893/)
    expect(result.toLowerCase()).toMatch(/kr/)
  })

  it('formats zero correctly', () => {
    expect(formatPrice(0)).toMatch(/0/)
  })

  it('handles large amounts', () => {
    expect(formatPrice(1000000)).toMatch(/10/)  // 10.000 kr
  })

  it('rounds to whole kroner (no decimals)', () => {
    // 89350 øre = 893,5 DKK → rounded to 894 or 893 depending on rounding
    // Either way, no decimal separator should appear
    const result = formatPrice(89350)
    expect(result).not.toMatch(/[,.][\d]{2}/)
  })
})

// ---- daysBetween ----

describe('daysBetween', () => {
  it('consecutive dates → 1 day', () => {
    expect(daysBetween('2024-06-01', '2024-06-02')).toBe(1)
  })

  it('same date → 1 day (floor to minimum)', () => {
    expect(daysBetween('2024-06-01', '2024-06-01')).toBe(1)
  })

  it('one week apart → 7 days', () => {
    expect(daysBetween('2024-06-01', '2024-06-08')).toBe(7)
  })

  it('one month apart → correct day count', () => {
    expect(daysBetween('2024-06-01', '2024-07-01')).toBe(30)
  })

  it('accounts for leap year', () => {
    // 2024 is a leap year: Feb has 29 days
    expect(daysBetween('2024-02-01', '2024-03-01')).toBe(29)
  })
})
