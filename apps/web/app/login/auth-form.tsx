'use client'

import { Auth } from '@supabase/auth-ui-react'
// import { ThemeSupa } from '@supabase/auth-ui-shared' // Removed ThemeSupa
import { createClient } from '@/lib/supabase/client' // Use the client utility

export default function AuthForm() {
  try {
    const supabase = createClient();

    // Get base URL for redirect
    const getURL = () => {
      let url = process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production
                process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel
                'http://localhost:3000/' // Default to localhost for development
      // Make sure to include `https` in production
      url = url.includes('http') ? url : `https://${url}`
      // Make sure to include a trailing `/`
      url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
      return url
    }

    const redirectUrl = `${getURL()}auth/callback`;
    console.log('[AuthForm] Using redirectTo:', redirectUrl);

    return (
      <Auth
        supabaseClient={supabase}
        view="sign_in"
        // appearance={{ theme: ThemeSupa }} // Removed appearance
        // theme="dark" // Removed theme
        // showLinks={true} // Removed showLinks
        // providers={['github']} // Removed providers
        redirectTo={redirectUrl}
      />
    )
  } catch (error) {
    console.error('[AuthForm] Error during component setup or rendering:', error);
    // Render a fallback or error message
    return <div className="text-red-500">An error occurred setting up the login form.</div>;
  }
} 