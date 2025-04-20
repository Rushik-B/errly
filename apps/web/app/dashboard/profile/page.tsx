'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import LogoutButton from '@/app/components/LogoutButton'
import styles from '../dashboard.module.css'
import { motion } from 'framer-motion'

// API base URL for the Next.js API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

interface UserProfile {
  id: string
  email: string
  phone_number: string | null
  created_at: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // Format phone number input
  const formatPhoneNumber = (value: string | null | undefined): string => {
    if (!value) return ''
    // Remove all non-digit characters
    let cleaned = value.replace(/\D/g, '')
    
    // Format based on digits only, assuming E.164 input for display formatting
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      cleaned = cleaned.substring(1); // Remove leading '1' for US format
    }
    
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
    } 
    // Return original (potentially non-US) number if not 10 digits after cleaning
    // Or handle other formats as needed
    return value; 
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Formatting is primarily for display; saving uses raw E.164
    const formatted = formatPhoneNumber(e.currentTarget.value)
    setPhoneNumber(formatted)
  }

  useEffect(() => {
    async function getAuthUserAndProfile() {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        console.error('Error fetching user:', authError?.message)
        router.push('/login')
        return
      }
      
      setUser(authUser)
      
      try {
        let { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('id, email, phone_number, created_at')
          .eq('supabase_auth_id', authUser.id)
          .maybeSingle()
        
        if (profileError) {
          throw profileError 
        }
        
        if (!profileData) {
          console.log(`Profile not found for user ${authUser.id}. Creating one.`);
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert({
              supabase_auth_id: authUser.id,
              email: authUser.email, 
              phone_number: authUser.user_metadata?.phone_number || null 
            })
            .select('id, email, phone_number, created_at')
            .single()
            
          if (insertError) {
            console.error('Error creating profile:', insertError.message)
            throw new Error('Failed to create user profile.')
          }
          
          console.log('Profile created successfully:', newProfile);
          profileData = newProfile 
        }
        
        setProfile(profileData as UserProfile)
        
        if (profileData?.phone_number) {
          setPhoneNumber(formatPhoneNumber(profileData.phone_number))
        }
        
      } catch (err: any) {
        console.error('Error fetching or creating profile:', err.message)
        setError('Failed to load or create profile data')
      } finally {
        setIsLoading(false)
      }
    }
    
    getAuthUserAndProfile()
  }, [router, supabase])

  // Handle saving phone number
  const handleSavePhoneNumber = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Use the display phone number state and clean it for validation/saving
      const rawPhoneNumber = phoneNumber.replace(/\D/g, '')
      
      // Basic validation (e.g., 10 digits for US)
      if (rawPhoneNumber.length !== 10) { 
        throw new Error('Please enter a valid 10-digit US phone number')
      }
      
      // Format for storage with country code (assuming US +1)
      const formattedPhoneNumber = `+1${rawPhoneNumber}`
      
      // Update in Supabase users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ phone_number: formattedPhoneNumber })
        .eq('supabase_auth_id', user.id)
      
      if (updateError) throw updateError
      
      // Also update in user metadata
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: { phone_number: formattedPhoneNumber }
      })
      
      if (authUpdateError) throw authUpdateError
      
      setSuccess('Phone number updated successfully')
      
      // Update profile data in state
      if (profile) {
        setProfile({
          ...profile,
          phone_number: formattedPhoneNumber
        })
        // Re-format for display after successful save
        setPhoneNumber(formatPhoneNumber(formattedPhoneNumber))
      }
    } catch (err: any) {
      console.error('Error updating phone number:', err)
      setError(err.message || 'Failed to update phone number')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    )
  }

  return (
    <div className={styles.dashboardWrapper}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/" className={styles.logoLink}>
          <div className={styles.logoCircle}>
            <span>E</span>
          </div>
          <span className={styles.logoText}>Errly</span>
        </Link>
        
        <div className={styles.headerRight}>
          {user && (
            <span className={styles.userEmail}>
              {user.email} 
            </span>
          )}
          {/* Add Profile link here if desired, or keep it in nav below */}
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={styles.mainContent}
      >
        {/* Navigation Links */}
        <div className={`${styles.card} ${styles.navCard}`}>
          <Link href="/dashboard" className={styles.navLink}>
            Projects
          </Link>
          <Link href="/dashboard/profile" className={`${styles.navLink} ${styles.activeNavLink}`}>
            Profile
          </Link>
        </div>

        {/* Profile Form */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Your Profile</h2>
          
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          
          {success && (
            <div className={styles.successMessage}>
              {success}
            </div>
          )}
          
          {/* Ensure profile exists before accessing properties */}
          {profile && (
            <div className={styles.profileInfo}>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Member since:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
            </div>
          )}
          
          {/* Form to update phone number */}          
          <form onSubmit={handleSavePhoneNumber} className={styles.updateForm}>
            <div className={styles.formGroup}>
              <label htmlFor="phoneNumber" className={styles.formLabel}>
                Phone Number (for SMS notifications)
              </label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                placeholder="(123) 456-7890"
                className={styles.formInput}
              />
              <p className={styles.formHelper}>
                US numbers only, format: (XXX) XXX-XXXX
              </p>
            </div>
            
            <button
              type="submit"
              disabled={isSaving}
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              {isSaving ? 'Saving...' : 'Update Phone Number'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
} 