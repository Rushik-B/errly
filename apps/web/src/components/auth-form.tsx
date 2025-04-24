'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getSupabaseClient } from '../lib/supabaseClient'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import type { Value } from 'react-phone-number-input'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Globe,
  Github,
  Check,
  Sparkles
} from 'lucide-react'
import 'react-phone-number-input/style.css'

/* -------------------------------------------------- */
// Define Field component outside AuthForm and memoize it
const Field = React.memo(({
  id,
  label,
  type = 'text',
  value,
  onChange,
  icon: Icon
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  icon: React.ElementType
}) => (
  <div className="form-field">
    <label htmlFor={id} className="field-label">
      {label}
    </label>
    <div className="input-wrapper">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        className="input-field"
        required
      />
      <div className="input-icon">
        <Icon size={18} />
      </div>
    </div>
  </div>
))
// Add display name for better debugging
Field.displayName = 'Field'; 
/* -------------------------------------------------- */

/**
 * A simpler, single‑file auth component that supports:
 * • Email/password sign‑in
 * • Email/password + phone sign‑up
 * • Google / GitHub social auth
 * Keeps all Supabase logic intact while adopting the visual style of the reference React snippet.
 */

const AuthForm: React.FC = () => {
  type View = 'sign_in' | 'sign_up'
  const [view, setView] = useState<View>('sign_in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState<Value>()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const location = useLocation()
  const supabase = getSupabaseClient()

  // State to hold the redirect path
  const [redirectPath, setRedirectPath] = useState<string | null>(null)

  // Extract redirect path from URL query params on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const redirect = params.get('redirect')
    if (redirect) {
      console.log('Login page found redirect param:', redirect) // Debugging
      setRedirectPath(redirect)
    }
  }, [location.search])

  // Memoize the phone change handler
  const handlePhoneChange = useCallback((value: Value | undefined) => {
    setPhone(value)
  }, [])

  /* -------------------------------------------------- */
  // const oauthRedirectTo = window.location.origin; // Keep this if needed for OAuth
  // Or, if OAuth should also redirect back to the original page:
  const oauthRedirectTo = redirectPath ? `${window.location.origin}${redirectPath}` : window.location.origin

  /* -------------------------------------------------- */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agree) return setError('Please agree to the terms.')
    if (!phone || typeof phone !== 'string' || !isValidPhoneNumber(phone))
      return setError('Enter a valid phone number.')

    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { phone_number: phone }
      }
    })

    if (error) setError(error.message)
    else {
      alert('Signup successful! Please check your email for verification.')
      setEmail('')
      setPassword('')
      setPhone(undefined)
      setAgree(false)
      setView('sign_in')
    }
    setLoading(false)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      const targetPath = redirectPath || '/dashboard'
      console.log('Sign-in successful, navigating to:', targetPath) // Debugging
      navigate(targetPath, { replace: true }) // Use replace to avoid login page in history
    }

    setLoading(false)
  }

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: oauthRedirectTo } })
    if (error) {
      setError(error.message)
      setLoading(false) // Stop loading on immediate error
    }
  }

  /* -------------------------------------------------- */
  return (
    <div className="auth-form-container">
      {/* Header */}
      <div className="form-header">
        <div className="logo-circle">
          <span>E</span>
        </div>
        <h2 className="form-title">
          {view === 'sign_in' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="form-subtitle">
          {view === 'sign_in' ? 'Sign in to continue to Errly dashboard' : 'Join thousands of developers using Errly'}
        </p>
      </div>

      {error && (
        <div className="error-message">
          <div className="error-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon-error" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={view === 'sign_in' ? handleSignIn : handleSignUp} className="auth-form">
        <Field id="email" label="Email address" value={email} onChange={setEmail} icon={Mail} type="email" />

        <div className="form-field">
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <div className="input-wrapper">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field"
              required
            />
            <div className="input-icon">
              <Lock size={18} />
            </div>
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {view === 'sign_up' && (
          <div className="form-field">
            <label className="field-label" htmlFor="phone">
              Phone number
            </label>
            <div className="input-wrapper phone-input-container">
              <PhoneInput
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                defaultCountry="US"
                placeholder="+1 234 567 8900"
                international
                withCountryCallingCode
                className="phone-input-field"
                required
              />
            </div>
          </div>
        )}

        <div className="form-options">
          {view === 'sign_up' ? (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agree}
                onChange={() => setAgree((v) => !v)}
                className="checkbox"
              />
              I agree to the <a href="#" className="link">Terms of Service</a>
            </label>
          ) : (
            <div className="signin-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe((v) => !v)}
                  className="checkbox"
                />
                Remember me
              </label>
              <a href="#" className="link">Forgot password?</a>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || (view === 'sign_up' && !agree)}
          className="submit-button"
        >
          {loading ? (
            <>
              <svg className="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              {view === 'sign_in' ? 'Sign in to account' : 'Create account'}
              <ArrowRight size={18} className="button-icon" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="divider">
        <div className="divider-line"></div>
        <span className="divider-text">or continue with</span>
        <div className="divider-line"></div>
      </div>

      {/* Social */}
      <div className="social-buttons">
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          disabled={loading}
          className="social-button"
        >
          <Globe size={18} className="google-icon" /> Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuth('github')}
          disabled={loading}
          className="social-button"
        >
          <Github size={18} className="github-icon" /> GitHub
        </button>
      </div>

      {/* Pro Tip */}
      <div className="pro-tip">
        <div className="pro-tip-content">
          <Sparkles size={18} className="sparkle-icon" />
          <div>
            <p className="pro-tip-text">
              <span className="pro-tip-highlight">Pro tip:</span> Track errors across your entire stack with Errly's powerful dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="form-footer">
        {view === 'sign_in' ? (
          <>
            New to Errly?{' '}
            <button
              onClick={() => setView('sign_up')}
              className="switch-view"
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              onClick={() => setView('sign_in')}
              className="switch-view"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  )
}

export default AuthForm
