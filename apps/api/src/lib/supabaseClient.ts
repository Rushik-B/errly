import { createClient, SupabaseClient } from '@supabase/supabase-js'
// Optional: If you generated types, import them
// import type { Database } from './database.types'

// Ensure environment variables are loaded
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use the new env variable

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL")
}
if (!supabaseAnonKey) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY")
}
if (!supabaseServiceKey) throw new Error("Missing env.SUPABASE_SERVICE_ROLE_KEY") // Check for service key

// Client for potential client-side operations (using anon key)
// Use Database type if available: createClient<Database>(...)
export const supabaseAnonClient: SupabaseClient = createClient(
    supabaseUrl,
    supabaseAnonKey
)

// Client for server-side operations (using service_role key)
// This client bypasses RLS.
// Use Database type if available: createClient<Database>(...)
export const supabaseServiceClient: SupabaseClient = createClient(
    supabaseUrl,
    supabaseServiceKey, // Use the service key here
    {
      auth: {
        // Important: Prevent saving user sessions server-side
        persistSession: false,
        // Important: Avoid refreshing tokens server-side
        autoRefreshToken: false
      }
    }
)