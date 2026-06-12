import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(cookieName: string) {
          return request.cookies.get(cookieName)?.value
        },
        set(cookieName: string, cookieValue: string, cookieOptions: CookieOptions) {
          request.cookies.set({ name: cookieName, value: cookieValue, ...cookieOptions })
          supabaseResponse = NextResponse.next({ request })
          supabaseResponse.cookies.set({ name: cookieName, value: cookieValue, ...cookieOptions })
        },
        remove(cookieName: string, _cookieValue: string, cookieOptions: CookieOptions) {
          request.cookies.set({ name: cookieName, value: '', ...cookieOptions })
          supabaseResponse = NextResponse.next({ request })
          supabaseResponse.cookies.set({ name: cookieName, value: '', ...cookieOptions })
        },
      },
    }
  )

  // Refresh the session — keeps Supabase cookies in sync on each request
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2)).*)',
  ],
}