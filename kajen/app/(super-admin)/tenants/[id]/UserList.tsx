'use client'

import { useState, useTransition } from 'react'
import { updateTenantUser, deleteTenantUser, resetTenantUserPassword } from '../actions'

type TenantUser = {
  id: string
  full_name: string | null
  email: string
  role: string
}

type ActiveAction = { type: 'edit' | 'reset' | 'delete'; userId: string }

export function UserList({ users, tenantId }: { users: TenantUser[]; tenantId: string }) {
  const [active, setActive] = useState<ActiveAction | null>(null)
  const close = () => setActive(null)

  if (users.length === 0) {
    return <p className="text-sm text-charcoal/40 mb-4">Ingen brugere endnu.</p>
  }

  return (
    <div className="divide-y divide-warm-gray mb-4">
      {users.map(user => {
        const mode = active?.userId === user.id ? active.type : null
        if (mode === 'edit')
          return <EditUserRow key={user.id} user={user} tenantId={tenantId} onDone={close} />
        if (mode === 'reset')
          return <ResetPasswordRow key={user.id} user={user} tenantId={tenantId} onDone={close} />
        if (mode === 'delete')
          return <DeleteConfirmRow key={user.id} user={user} tenantId={tenantId} onCancel={close} />
        return (
          <UserRow
            key={user.id}
            user={user}
            onEdit={() => setActive({ type: 'edit', userId: user.id })}
            onReset={() => setActive({ type: 'reset', userId: user.id })}
            onDelete={() => setActive({ type: 'delete', userId: user.id })}
          />
        )
      })}
    </div>
  )
}

function UserRow({
  user,
  onEdit,
  onReset,
  onDelete,
}: {
  user: TenantUser
  onEdit: () => void
  onReset: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-charcoal truncate">{user.full_name ?? '—'}</p>
        <p className="text-xs text-charcoal/50 truncate">{user.email}</p>
      </div>
      <span className="text-xs font-medium bg-offwhite text-charcoal/60 px-2 py-0.5 rounded-full shrink-0">
        {user.role}
      </span>
      <div className="flex items-center gap-3 shrink-0 text-xs">
        <button onClick={onEdit} className="text-charcoal/50 hover:text-charcoal transition-colors">
          Rediger
        </button>
        <button onClick={onReset} className="text-charcoal/50 hover:text-charcoal transition-colors">
          Nyt kodeord
        </button>
        <button onClick={onDelete} className="text-danger/70 hover:text-danger transition-colors">
          Slet
        </button>
      </div>
    </div>
  )
}

function EditUserRow({
  user,
  tenantId,
  onDone,
}: {
  user: TenantUser
  tenantId: string
  onDone: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await updateTenantUser(undefined, formData)
      if (result === null) {
        onDone()
      } else {
        setError(result)
      }
    })
  }

  return (
    <div className="py-3">
      <p className="text-xs font-medium text-charcoal/50 mb-2">Rediger bruger</p>
      <form action={handleSubmit} className="grid grid-cols-2 gap-2">
        <input type="hidden" name="user_id" value={user.id} />
        <input type="hidden" name="tenant_id" value={tenantId} />

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-charcoal/60">Navn</span>
          <input
            name="full_name"
            required
            defaultValue={user.full_name ?? ''}
            className="border border-warm-gray rounded-lg px-3 py-1.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-charcoal/60">E-mail</span>
          <input
            name="email"
            type="email"
            required
            defaultValue={user.email}
            className="border border-warm-gray rounded-lg px-3 py-1.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-charcoal/60">Rolle</span>
          <select
            name="role"
            defaultValue={user.role}
            className="border border-warm-gray rounded-lg px-3 py-1.5 text-sm text-charcoal focus:outline-none focus:border-charcoal bg-white"
          >
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>
        </label>

        <div className="col-span-2 flex items-center gap-2 pt-1">
          {error && <p className="text-xs text-danger flex-1">{error}</p>}
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={onDone}
              className="text-xs text-charcoal/50 hover:text-charcoal transition-colors px-3 py-1.5"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="text-xs bg-charcoal hover:bg-charcoal-mid disabled:opacity-40 text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              {isPending ? 'Gemmer…' : 'Gem'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function ResetPasswordRow({
  user,
  tenantId,
  onDone,
}: {
  user: TenantUser
  tenantId: string
  onDone: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await resetTenantUserPassword(undefined, formData)
      if (result === null) {
        onDone()
      } else {
        setError(result)
      }
    })
  }

  return (
    <div className="py-3">
      <p className="text-xs font-medium text-charcoal/50 mb-2">
        Nyt kodeord til <span className="text-charcoal">{user.full_name ?? user.email}</span>
      </p>
      <form action={handleSubmit} className="flex items-end gap-2">
        <input type="hidden" name="user_id" value={user.id} />
        <input type="hidden" name="tenant_id" value={tenantId} />

        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs font-medium text-charcoal/60">Nyt kodeord</span>
          <input
            name="new_password"
            type="password"
            required
            minLength={8}
            placeholder="Min. 8 tegn"
            className="border border-warm-gray rounded-lg px-3 py-1.5 text-sm text-charcoal focus:outline-none focus:border-charcoal"
          />
        </label>

        <div className="flex items-center gap-2 pb-0.5">
          <button
            type="button"
            onClick={onDone}
            className="text-xs text-charcoal/50 hover:text-charcoal transition-colors px-3 py-1.5"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="text-xs bg-charcoal hover:bg-charcoal-mid disabled:opacity-40 text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
          >
            {isPending ? 'Gemmer…' : 'Gem'}
          </button>
        </div>
      </form>
      {error && <p className="text-xs text-danger mt-2">{error}</p>}
    </div>
  )
}

function DeleteConfirmRow({
  user,
  tenantId,
  onCancel,
}: {
  user: TenantUser
  tenantId: string
  onCancel: () => void
}) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    const formData = new FormData()
    formData.set('user_id', user.id)
    formData.set('tenant_id', tenantId)
    startTransition(async () => {
      await deleteTenantUser(formData)
    })
  }

  return (
    <div className="py-3 flex items-center gap-4">
      <p className="text-sm text-charcoal flex-1">
        Slet <span className="font-medium">{user.full_name ?? user.email}</span>?
        <span className="block text-xs text-charcoal/50 mt-0.5">Handlingen kan ikke fortrydes.</span>
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onCancel}
          disabled={isPending}
          className="text-xs text-charcoal/50 hover:text-charcoal transition-colors px-3 py-1.5"
        >
          Annuler
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs bg-danger hover:bg-danger/80 disabled:opacity-40 text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
        >
          {isPending ? 'Sletter…' : 'Slet bruger'}
        </button>
      </div>
    </div>
  )
}
