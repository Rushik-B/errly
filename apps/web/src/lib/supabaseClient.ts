import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Use import.meta.env for Vite environment variables
  // Ensure your .env file uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or Anon Key missing in .env file (must be prefixed with VITE_)");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
} 