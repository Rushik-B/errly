import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Use import.meta.env for Vite environment variables
  // Ensure your .env file uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or Anon Key missing in .env file (must be prefixed with VITE_)");
  }

  // Add cookieOptions for cross-subdomain authentication
  return createBrowserClient(
    supabaseUrl, 
    supabaseAnonKey,
    {
      cookieOptions: {
        domain: '.vercel.app', // Set cookie accessible for all vercel.app subdomains
        path: '/',
        sameSite: 'none', // Change from 'lax' to 'none' for potentially better cross-site/incognito handling
        secure: true      // Required for SameSite=None, recommended for Lax/Strict too
      }
    }
  )
} 