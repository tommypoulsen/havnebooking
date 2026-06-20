import type { FormField } from '@/lib/types/domain'

export function filterVisibleFormAnswers(
  fields: FormField[],
  answers: Record<string, string>
): Record<string, string> {
  const visibleIds = new Set(
    fields
      .filter(f => !f.dependsOn || answers[f.dependsOn.field] === f.dependsOn.value)
      .map(f => f.id)
  )
  return Object.fromEntries(Object.entries(answers).filter(([k]) => visibleIds.has(k)))
}
