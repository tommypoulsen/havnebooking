import { type NextRequest, NextResponse } from 'next/server'

export function GET(request: NextRequest) {
  const tenant = request.nextUrl.searchParams.get('tenant')
  if (!tenant) {
    return new NextResponse('Missing ?tenant= parameter', { status: 400 })
  }

  const home = new URL('/', request.url)
  const response = NextResponse.redirect(home)
  response.cookies.set('tenant-override', tenant, { path: '/', sameSite: 'lax' })
  return response
}
