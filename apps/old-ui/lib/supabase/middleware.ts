import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// Determine if running in production based on environment variable
const isProduction = process.env.NODE_ENV === 'production'

// Define base cookie options
const baseCookieOptions: Partial<CookieOptions> = {
  path: '/',
  sameSite: 'lax', // Corrected to lowercase
  secure: isProduction, // Use Secure flag in production
  // domain: 'yourdomain.com' // Add your domain in production if needed
  // httpOnly: true // httpOnly is typically handled by Supabase automatically for auth tokens
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Merge base options with options from Supabase
          const mergedOptions = { ...baseCookieOptions, ...options }
          request.cookies.set({
            name,
            value,
            ...mergedOptions,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...mergedOptions,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Merge base options with options from Supabase
          const mergedOptions = { ...baseCookieOptions, ...options }
          request.cookies.set({
            name,
            value: '',
            ...mergedOptions,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...mergedOptions,
          })
        },
      },
    }
  )

  // Refresh session if expired - important!
  await supabase.auth.getUser()

  return response
} 