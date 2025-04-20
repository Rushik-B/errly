'use client'

import { useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
// import { ThemeSupa } from '@supabase/auth-ui-shared' // Removed ThemeSupa
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import React from 'react'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import type { Value } from 'react-phone-number-input' // Import Value type for state
// Removed import 'react-phone-number-input/style.css' 
// Removed import './phone-input-custom.css' 

export default function AuthForm() {
  const [view, setView] = useState<'sign_in' | 'sign_up'>('sign_in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState<Value | undefined>(undefined) // Use Value type
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCustomForm, setShowCustomForm] = useState(false)
  
  const router = useRouter()
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

  const redirectUrl = `${getURL()}auth/callback`

  // Custom sign up with phone number
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate phone number using the library
      // Ensure phoneNumber is a string before validation
      if (!phoneNumber || typeof phoneNumber !== 'string' || !isValidPhoneNumber(phoneNumber)) {
        throw new Error('Please enter a valid phone number including country code.')
      }

      // Phone number is already in E.164 format (e.g., +11234567890)
      const formattedPhoneNumber = phoneNumber 

      // 1. Sign up user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            phone_number: formattedPhoneNumber // Store in auth.users.user_metadata
          }
        }
      })

      if (signUpError) throw signUpError

      // 2. Update the public.users record with phone_number
      // Note: This runs automatically if you've set up the trigger properly
      // The trigger should now pull the phone_number from user_metadata

      // Display success or redirect
      setEmail('')
      setPassword('')
      setPhoneNumber(undefined) // Reset phone number state
      setView('sign_in')
      setShowCustomForm(false)
      // You can show a success message here or redirect
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'An error occurred during sign up')
    } finally {
      setLoading(false)
    }
  }

  // Toggle between sign in and sign up views
  const toggleView = () => {
    if (view === 'sign_in') {
      setView('sign_up')
      setShowCustomForm(true)
    } else {
      setView('sign_in')
      setShowCustomForm(false)
    }
    setError(null)
  }

  if (showCustomForm) {
    return (
      <div>
        <h2>Sign Up for Errly</h2>
        
        {error && <div>{error}</div>}
        
        <form onSubmit={handleSignUp}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.currentTarget.value)} // Use currentTarget
              required
            />
          </div>
          
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.currentTarget.value)} // Use currentTarget
              required
            />
          </div>
          
          <div>
            <label htmlFor="phoneNumber">Phone Number</label>
            <PhoneInput
              id="phoneNumber"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={setPhoneNumber} // Directly set the state (Value type handles E.164 string)
              defaultCountry="US" // Optional: set a default country
              international
              withCountryCallingCode
              required
            />
            <p>
              For SMS notifications about errors.
            </p>
          </div>
          
          <button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        
        <div>
          <button 
            onClick={toggleView}
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    )
  }

  // Default Auth UI for sign in
  return (
    <div>
      <Auth
        supabaseClient={supabase}
        view="sign_in"
        redirectTo={redirectUrl}
        showLinks={false}
      />
      
      <div>
        <button 
          onClick={toggleView}
        >
          Don't have an account? Sign up
        </button>
      </div>
      
      {error && <div>{error}</div>}
    </div>
  )
} 