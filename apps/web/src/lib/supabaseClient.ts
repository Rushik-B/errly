import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js' // Import SupabaseClient type

// Variable to hold the singleton instance
let supabaseInstance: SupabaseClient | null = null;

// Function to get the singleton instance
export function getSupabaseClient(): SupabaseClient {
  // Return existing instance if available
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Create new instance if it doesn't exist
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or Anon Key missing in .env file (must be prefixed with VITE_)");
  }

  // Create and store the instance
  supabaseInstance = createSupabaseClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: { 
        persistSession: true, 
        autoRefreshToken: true, 
        detectSessionInUrl: true, 
      },
      // Removing cookieOptions for now, as standard client primarily uses localStorage.
      // We can re-add if specific cookie control is needed later.
      /*
      cookieOptions: {
        domain: '.errly.dev', 
        path: '/',
        sameSite: 'Lax', 
        secure: true
      }
      */
    }
  )
  
  return supabaseInstance;
}

// Optional: Export the instance directly for convenience if preferred,
// but the getter function ensures initialization happens correctly.
// export const supabase = getSupabaseClient(); 