import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const TENANT_ADMIN_PATHS = ['/admin']
const SUPER_ADMIN_PATHS = ['/tenants', '/services-config']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const isTenantAdmin = TENANT_ADMIN_PATHS.some(p => pathname.startsWith(p))
  const isSuperAdmin = SUPER_ADMIN_PATHS.some(p => pathname.startsWith(p))

  const role = user?.app_metadata?.role

  if (isTenantAdmin || isSuperAdmin) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (isSuperAdmin && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (isTenantAdmin && role !== 'admin' && role !== 'staff' && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Redirect super admins from root to their dashboard — but only when they are NOT
  // on a tenant subdomain, so they can still browse tenant sites for preview/support.
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost'
  const hostWithoutPort = (request.headers.get('host') ?? '').split(':')[0]
  const isOnTenantSubdomain =
    hostWithoutPort !== appDomain && hostWithoutPort.endsWith(`.${appDomain}`)

  if (pathname === '/' && role === 'super_admin' && !isOnTenantSubdomain) {
    return NextResponse.redirect(new URL('/tenants', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
