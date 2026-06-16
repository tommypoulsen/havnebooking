import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const TENANT_ADMIN_PATHS = ['/admin']
const SUPER_ADMIN_PATHS = ['/tenants', '/services-config']

export async function proxy(request: NextRequest) {
  // ?tenant= override: redirect to the same URL without the param, but set a cookie on
  // the response. The redirect causes a new request that carries the cookie, so
  // getTenant() can read it via cookies() on the second request.
  const tenantOverride = request.nextUrl.searchParams.get('tenant')
  if (tenantOverride) {
    const dest = request.nextUrl.clone()
    dest.searchParams.delete('tenant')
    const redirectResponse = NextResponse.redirect(dest)
    redirectResponse.cookies.set('tenant-override', tenantOverride, {
      path: '/',
      sameSite: 'lax',
    })
    return redirectResponse
  }

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
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
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

  // On the root domain (no tenant subdomain), redirect unauthenticated users to login
  // instead of falling through to the tenant layout which would call notFound().
  if (!isOnTenantSubdomain && !user && pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Super-admin landing on the root domain goes straight to their dashboard.
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
