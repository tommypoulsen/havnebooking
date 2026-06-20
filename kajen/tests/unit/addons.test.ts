import { describe, it, expect } from 'vitest'
import { resolveAddOns } from '@/lib/utils/addons'
import type { AddOnRule, PricingRule } from '@/lib/types/domain'

const SIZE_A = '00000000-0000-0000-0000-000000000001'
const SIZE_B = '00000000-0000-0000-0000-000000000002'
const SVC_X  = '00000000-0000-0000-0000-000000000010'

const rule = (overrides: Partial<AddOnRule>): AddOnRule => ({
  id: 'r1',
  label: 'Testtillæg',
  conditions: [],
  ...overrides,
})

const pricingRule = (serviceId: string, sizeCategoryId: string | null, price: number): PricingRule => ({
  id: 'pr1',
  service_id: serviceId,
  size_category_id: sizeCategoryId,
  duration_type: 'per_season',
  price_oere: price,
  valid_from: null,
  valid_to: null,
})

describe('resolveAddOns', () => {
  it('returns [] when no rules', () => {
    expect(resolveAddOns([], {}, SIZE_A, {})).toEqual([])
  })

  it('returns [] when no conditions match', () => {
    const r = rule({ conditions: [{ field: 'type', value: 'a' }], fixedPriceOere: 100 })
    expect(resolveAddOns([r], { type: 'b' }, SIZE_A, {})).toEqual([])
  })

  it('flat price rule matches → correct amount', () => {
    const r = rule({ conditions: [{ field: 'type', value: 'a' }], fixedPriceOere: 47300 })
    const lines = resolveAddOns([r], { type: 'a' }, SIZE_A, {})
    expect(lines).toHaveLength(1)
    expect(lines[0].amountOere).toBe(47300)
    expect(lines[0].ruleId).toBe('r1')
    expect(lines[0].quantity).toBe(1)
  })

  it('sizeTableOere matches with sizeCategoryId → correct amount', () => {
    const r = rule({
      conditions: [],
      sizeTableOere: { [SIZE_A]: 15800, [SIZE_B]: 21000 },
    })
    const lines = resolveAddOns([r], {}, SIZE_A, {})
    expect(lines).toHaveLength(1)
    expect(lines[0].amountOere).toBe(15800)
  })

  it('sizeTableOere matches but sizeCategoryId is null → line omitted', () => {
    const r = rule({
      conditions: [],
      sizeTableOere: { [SIZE_A]: 15800 },
    })
    expect(resolveAddOns([r], {}, null, {})).toEqual([])
  })

  it('sizeTableOere with unknown sizeCategoryId → line omitted', () => {
    const r = rule({
      conditions: [],
      sizeTableOere: { [SIZE_A]: 15800 },
    })
    expect(resolveAddOns([r], {}, SIZE_B, {})).toEqual([])
  })

  it('serviceId rule matches → correct amount from calculatePrice', () => {
    const r = rule({
      conditions: [],
      serviceId: SVC_X,
      durationType: 'per_season',
    })
    const pricing = { [SVC_X]: [pricingRule(SVC_X, SIZE_A, 29900)] }
    const lines = resolveAddOns([r], {}, SIZE_A, pricing)
    expect(lines).toHaveLength(1)
    expect(lines[0].amountOere).toBe(29900)
    expect(lines[0].serviceId).toBe(SVC_X)
    expect(lines[0].sizeCategoryId).toBe(SIZE_A)
  })

  it('serviceId with no matching pricing rule → line omitted', () => {
    const r = rule({ conditions: [], serviceId: SVC_X, durationType: 'per_season' })
    expect(resolveAddOns([r], {}, SIZE_A, {})).toEqual([])
  })

  it('ALL conditions must match — one failing = no match', () => {
    const r = rule({
      conditions: [
        { field: 'type', value: 'sejl' },
        { field: 'mast', value: 'med' },
      ],
      fixedPriceOere: 100,
    })
    expect(resolveAddOns([r], { type: 'sejl', mast: 'uden' }, SIZE_A, {})).toEqual([])
    expect(resolveAddOns([r], { type: 'motor', mast: 'med' }, SIZE_A, {})).toEqual([])
    expect(resolveAddOns([r], { type: 'sejl', mast: 'med' }, SIZE_A, {})).toHaveLength(1)
  })

  it('multiple rules — multiple matches → all returned', () => {
    const r1 = rule({ id: 'r1', label: 'A', fixedPriceOere: 100, conditions: [] })
    const r2 = rule({ id: 'r2', label: 'B', fixedPriceOere: 200, conditions: [] })
    const r3 = rule({ id: 'r3', label: 'C', fixedPriceOere: 300, conditions: [{ field: 'x', value: 'y' }] })
    const lines = resolveAddOns([r1, r2, r3], {}, SIZE_A, {})
    expect(lines).toHaveLength(2)
    expect(lines.map(l => l.ruleId)).toEqual(['r1', 'r2'])
  })

  it('quantity is applied correctly', () => {
    const r = rule({ conditions: [], fixedPriceOere: 100, quantity: 3 })
    const lines = resolveAddOns([r], {}, SIZE_A, {})
    expect(lines[0].quantity).toBe(3)
    expect(lines[0].amountOere).toBe(100) // amountOere is unit price; caller multiplies by quantity
  })
})
