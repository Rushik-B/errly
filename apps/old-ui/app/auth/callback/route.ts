import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server' // Use the server utility we defined

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  // if "next" is in param, use it as the redirect URL
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    // Awaiting cookies() based on persistent linter feedback
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore) // Pass the resolved cookieStore
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // URL to redirect to after sign in process completes
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('Auth Callback Error - Exchange failed:', error.message);
  } else {
    console.error('Auth Callback Error: No code received in search params');
  }

  // URL to redirect to/route if errors occurred
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
} 