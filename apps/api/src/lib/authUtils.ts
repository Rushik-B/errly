import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Session } from '@supabase/supabase-js';

// CORS Headers object removed as headers are now handled per-route
/*
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:8080', 
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};
*/

// Helper function to get user session from server components/API routes
export async function getUserSession(): Promise<Session | null> {
  console.log('[API AuthUtil] getUserSession started');
  const cookieStore = await cookies();

  // Log cookie names for debugging
  // const cookieNames = Array.from(cookieStore.getAll()).map(c => c.name);
  // console.log('[API AuthUtil] Available cookies:', cookieNames);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value;
          // console.log(`[API AuthUtil] Cookie accessed - ${name}: ${value ? 'has value' : 'undefined'}`);
          return value;
        },
        // Note: Set and Remove are usually not needed in read-only scenarios like API routes
        // but provided here for completeness if this util is used elsewhere.
        set(name: string, value: string, options: CookieOptions) {
            try {
                // console.log(`[API AuthUtil] Setting cookie: ${name}`);
                cookieStore.set({ name, value, ...options });
            } catch (error) {
                // The `set` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
                console.warn(`[API AuthUtil] Failed to set cookie '${name}' from Server Component/Route. This might be okay if middleware handles session refresh.`);
            }
        },
        remove(name: string, options: CookieOptions) {
            try {
                // console.log(`[API AuthUtil] Removing cookie: ${name}`);
                cookieStore.set({ name, value: '', ...options });
            } catch (error) {
                // The `delete` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
                 console.warn(`[API AuthUtil] Failed to remove cookie '${name}' from Server Component/Route. This might be okay if middleware handles session refresh.`);
            }
        },
      },
    }
  );

  try {
    // console.log('[API AuthUtil] Calling supabase.auth.getSession()');
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[API AuthUtil] Error getting session:', error.message);
      return null;
    }

    // console.log('[API AuthUtil] Session result:', {
    //   hasSession: !!session,
    //   userId: session?.user?.id || 'no user id',
    //   email: session?.user?.email || 'no email'
    // });

    return session;
  } catch (err) {
    console.error('[API AuthUtil] Unexpected error getting session:', err);
    return null;
  }
} 