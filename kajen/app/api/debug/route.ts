import { type NextRequest, NextResponse } from 'next/server'

export function GET(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const cookies = Object.fromEntries(
    request.cookies.getAll().map(({ name, value }) => [name, value])
  )
  return NextResponse.json({ host, cookies })
}
