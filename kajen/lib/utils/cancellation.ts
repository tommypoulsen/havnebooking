export type CancellationPolicy = {
  days_before: number
  refund_pct: number
}

export function calculateRefundOere(
  totalOere: number,
  startsAt: string | null,
  policies: CancellationPolicy[],
): number {
  if (!startsAt || policies.length === 0) return 0
  const msPerDay = 1000 * 60 * 60 * 24
  const daysUntil = Math.floor((new Date(startsAt).getTime() - Date.now()) / msPerDay)
  // Find the most generous applicable policy: highest days_before that is still <= daysUntil
  const sorted = [...policies].sort((a, b) => b.days_before - a.days_before)
  const applicable = sorted.find(p => daysUntil >= p.days_before)
  if (!applicable) return 0
  return Math.round(totalOere * applicable.refund_pct / 100)
}
