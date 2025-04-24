import { createClient as createSupabaseClient } from '@supabase/supabase-js' // Import standard client

export function createClient() {
  // Use import.meta.env for Vite environment variables
  // Ensure your .env file uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or Anon Key missing in .env file (must be prefixed with VITE_)");
  }

  // Use the standard browser client
  return createSupabaseClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: { // Configure auth options here
        persistSession: true, // Explicitly enable session persistence (default is true)
        autoRefreshToken: true, // Explicitly enable token refreshing (default is true)
        detectSessionInUrl: true, // Handle session restoration from URL (useful for email magic links etc.)
      },
      // Removing cookieOptions for now, as standard client primarily uses localStorage.
      // We can re-add if specific cookie control is needed later.
      /*
      cookieOptions: {
        domain: '.errly.dev', // Correct domain
        path: '/',
        sameSite: 'Lax', // Change back to Lax
        secure: true
      }
      */
    }
  )
} 