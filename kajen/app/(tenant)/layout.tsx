import { notFound } from 'next/navigation'
import { getTenant } from '@/lib/utils/tenant'

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenant()
  if (!tenant) notFound()

  return <>{children}</>
}
