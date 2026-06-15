import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { calculateRefundOere } from '@/lib/utils/cancellation'
import type { CancellationPolicy } from '@/lib/utils/cancellation'

const FIXED_NOW = new Date('2024-06-01T12:00:00Z')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

// ---- helpers ----

function daysFromNow(days: number): string {
  return new Date(FIXED_NOW.getTime() + days * 24 * 60 * 60 * 1000).toISOString()
}

const fullRefundAt7Days: CancellationPolicy = { days_before: 7, refund_pct: 100 }

// ---- tests ----

describe('calculateRefundOere', () => {
  it('returns 0 when startsAt is null', () => {
    expect(calculateRefundOere(10000, null, [fullRefundAt7Days])).toBe(0)
  })

  it('returns 0 when no policies defined', () => {
    expect(calculateRefundOere(10000, daysFromNow(14), [])).toBe(0)
  })

  it('returns full refund when well within cancellation window', () => {
    expect(calculateRefundOere(10000, daysFromNow(14), [fullRefundAt7Days])).toBe(10000)
  })

  it('returns full refund on exactly the boundary day', () => {
    expect(calculateRefundOere(10000, daysFromNow(7), [fullRefundAt7Days])).toBe(10000)
  })

  it('returns 0 when cancelling too late (inside minimum notice)', () => {
    expect(calculateRefundOere(10000, daysFromNow(3), [fullRefundAt7Days])).toBe(0)
  })

  it('returns 0 for a past booking', () => {
    expect(calculateRefundOere(10000, daysFromNow(-1), [fullRefundAt7Days])).toBe(0)
  })

  it('applies partial refund percentage correctly', () => {
    const policy: CancellationPolicy = { days_before: 7, refund_pct: 50 }
    expect(calculateRefundOere(10000, daysFromNow(14), [policy])).toBe(5000)
  })

  it('rounds to nearest øre', () => {
    const policy: CancellationPolicy = { days_before: 0, refund_pct: 33 }
    // 10000 * 33 / 100 = 3300 exactly
    expect(calculateRefundOere(10000, daysFromNow(1), [policy])).toBe(3300)
    // 10001 * 33 / 100 = 3300.33 → rounds to 3300
    expect(calculateRefundOere(10001, daysFromNow(1), [policy])).toBe(3300)
  })

  it('with graduated policies, picks the most generous applicable tier', () => {
    // 10 days out → 14-day tier doesn't apply, 7-day tier does
    const policies: CancellationPolicy[] = [
      { days_before: 14, refund_pct: 100 },
      { days_before: 7,  refund_pct: 50 },
      { days_before: 0,  refund_pct: 0 },
    ]
    expect(calculateRefundOere(10000, daysFromNow(10), policies)).toBe(5000)
  })

  it('with graduated policies, picks highest tier when fully in window', () => {
    const policies: CancellationPolicy[] = [
      { days_before: 14, refund_pct: 100 },
      { days_before: 7,  refund_pct: 50 },
    ]
    expect(calculateRefundOere(10000, daysFromNow(20), policies)).toBe(10000)
  })

  it('with graduated policies, zero-refund tier applies on day of', () => {
    const policies: CancellationPolicy[] = [
      { days_before: 7, refund_pct: 100 },
      { days_before: 0, refund_pct: 0 },
    ]
    expect(calculateRefundOere(10000, daysFromNow(0), policies)).toBe(0)
  })
})
