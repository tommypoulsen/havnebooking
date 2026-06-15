'use client'

import Link from 'next/link'
import { useCallback } from 'react'
import { TenantForm } from '../TenantForm'
import { createTenant } from '../actions'

export default function NewTenantPage() {
  const onSuccess = useCallback(() => {
    window.location.href = '/tenants'
  }, [])

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/tenants" className="text-xs text-charcoal/40 hover:text-charcoal transition-colors">
          ← Tenanter
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-charcoal mb-8">Opret tenant</h1>
      <TenantForm action={createTenant} onSuccess={onSuccess} />
    </div>
  )
}
