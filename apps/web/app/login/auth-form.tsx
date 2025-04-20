'use client'

import { useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
// import { ThemeSupa } from '@supabase/auth-ui-shared' // Removed ThemeSupa
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import React from 'react'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import type { Value } from 'react-phone-number-input' // Import Value type for state
import 'react-phone-number-input/style.css' // Import default styles
import './phone-input-custom.css' // Import custom styles (we'll create this)

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
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-center">Sign Up for Errly</h2>
        
        {error && <div className="p-3 bg-red-800 rounded text-white text-sm">{error}</div>}
        
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.currentTarget.value)} // Use currentTarget
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.currentTarget.value)} // Use currentTarget
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300">Phone Number</label>
            <PhoneInput
              id="phoneNumber"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={setPhoneNumber} // Directly set the state (Value type handles E.164 string)
              defaultCountry="US" // Optional: set a default country
              international
              withCountryCallingCode
              className="phone-input-container" // Class for custom styling wrapper
              required
            />
            <p className="mt-1 text-sm text-gray-400">
              For SMS notifications about errors.
            </p>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="text-center">
          <button 
            onClick={toggleView}
            className="text-sm text-indigo-400 hover:text-indigo-300"
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
      
      <div className="mt-4 text-center">
        <button 
          onClick={toggleView}
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          Don't have an account? Sign up
        </button>
      </div>
      
      {error && <div className="mt-4 p-3 bg-red-800 rounded text-white text-sm">{error}</div>}
    </div>
  )
} 