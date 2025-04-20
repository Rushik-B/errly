'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client' // Use the client utility

export default function AuthForm() {
  const supabase = createClient()

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

  return (
    <Auth
      supabaseClient={supabase}
      view="sign_in" // Or "sign_up" or others based on needs
      appearance={{ theme: ThemeSupa }}
      theme="dark" // Or "light"
      showLinks={true}
      providers={['github']} // Example: Add GitHub provider
      redirectTo={`${getURL()}auth/callback`} // Redirect to our callback route
    />
  )
} 