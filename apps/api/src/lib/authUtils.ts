import { type NextRequest } from 'next/server';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// CORS Headers object removed as headers are now handled per-route
/*
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'http://localhost:8080', 
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};
*/

// Lazily initialize Supabase client to avoid initializing on every request if module is cached
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdminClient(): SupabaseClient {
  if (!supabaseAdmin) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables for admin client.');
    }
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          // Required for service role client
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }
  return supabaseAdmin;
}

// Helper function to get user from Authorization header JWT
export async function getUserFromToken(request: NextRequest): Promise<User | null> {
  console.log('[API AuthUtil] getUserFromToken started');
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[API AuthUtil] No or invalid Authorization header found');
    return null;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('[API AuthUtil] Token missing after Bearer');
    return null;
  }

  try {
    const supabase = getSupabaseAdminClient();
    console.log('[API AuthUtil] Calling supabase.auth.getUser(token)');
    // This verifies the token using the JWT secret configured implicitly or explicitly
    // and fetches the user details from Supabase.
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('[API AuthUtil] Error validating token or getting user:', error.message);
      // Log specific errors like invalid signature, expired token etc.
      if (error.message.includes('invalid signature') || error.message.includes('JWT expired')) {
          console.warn('[API AuthUtil] Token validation failed:', error.message);
      }
      return null;
    }

    if (!user) {
      console.log('[API AuthUtil] No user found for valid token');
      return null;
    }

    console.log(`[API AuthUtil] User found: ${user.id}, email: ${user.email}`);
    return user;

  } catch (err: unknown) {
    let errorMessage = 'An unexpected error occurred during token validation';
    if (err instanceof Error) {
        errorMessage = err.message;
    }
    console.error('[API AuthUtil] Unexpected error:', errorMessage);
    return null;
  }
} 