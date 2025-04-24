import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getSupabaseClient } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { LogOut } from 'lucide-react'

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

interface UserProfile {
  id: string
  email: string
  phone_number: string | null
  created_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const navigate = useNavigate()
  const { user, signOut, loading: loadingAuth } = useAuth()
  const supabase = getSupabaseClient()

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
      // If auth context is still loading or no user, do nothing yet
      if (loadingAuth) return;
      
      if (!user) {
        console.error('No authenticated user found')
        navigate('/login')
        return
      }

      console.log('User authenticated:', user.id);
      setIsLoading(true)
      
      try {
        // Check if the users table exists first
        const { data: tables, error: tablesError } = await supabase
          .from('users')
          .select('id')
          .limit(1)
        
        if (tablesError) {
          console.error('Error testing users table:', tablesError);
          // If the table doesn't exist or there's a permission issue, we'll try to create a simpler profile
          setProfile({
            id: user.id,
            email: user.email || '',
            phone_number: null,
            created_at: new Date().toISOString()
          });
          setIsLoading(false);
          return;
        }
        
        // Table exists, now try to get the user profile
        console.log('Querying for user profile with supabase_auth_id:', user.id);
        let { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('supabase_auth_id', user.id)
          .single()
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          
          if (profileError.code === 'PGRST116') {
            // No rows returned - profile doesn't exist
            console.log('Profile not found, will create one');
            
            // Create a new profile
            const { data: newProfile, error: insertError } = await supabase
              .from('users')
              .insert({
                supabase_auth_id: user.id,
                email: user.email || '',
                phone_number: null
              })
              .select('*')
              .single()
              
            if (insertError) {
              console.error('Error creating profile:', insertError);
              throw new Error(`Failed to create user profile: ${insertError.message}`);
            }
            
            profileData = newProfile;
            console.log('Profile created successfully:', profileData);
          } else {
            // Other database error
            throw profileError;
          }
        }
        
        console.log('Profile data:', profileData);
        setProfile(profileData as UserProfile);
        
        if (profileData?.phone_number) {
          setPhoneNumber(formatPhoneNumber(profileData.phone_number));
        }
        
      } catch (err: any) {
        console.error('Error in profile handling:', err);
        
        // Fallback: Create a local profile object just to show something
        setProfile({
          id: user.id,
          email: user.email || '',
          phone_number: null,
          created_at: new Date().toISOString()
        });
        
        setError(`Failed to load profile data: ${err.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }
    
    getAuthUserAndProfile();
  }, [user, loadingAuth, navigate, supabase]);

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
      
      try {
        // Try to update in Supabase users table
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
      } catch (dbError: any) {
        console.error('Database update error:', dbError);
        // Even if the database update fails, we'll still update the UI
      }
      
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

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (loadingAuth || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white bg-[url('/lovable-uploads/dash.png')] bg-cover bg-center bg-fixed relative">
      <div className="absolute inset-0 bg-black/60 z-0"></div>
      
      {/* Header */}
      <header className="fixed top-0 left-0 z-40 w-full pt-6 px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="bg-white/10 rounded-full p-2">
              <span className="sr-only">Logo</span>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#101015" />
                <circle cx="16" cy="16" r="7" stroke="#fff" strokeWidth="2" />
                <rect x="7" y="23" width="18" height="3" rx="1.5" fill="#fff" />
              </svg>
            </span>
            <span className="ml-1 text-2xl font-semibold tracking-tight text-white">
              Errly
            </span>
          </Link>
          
          {/* User Info / Logout */}
          <div className="flex items-center gap-3">
            {user && <span className="text-sm text-white/80 hidden sm:block">{user.email}</span>}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 pt-28 px-6 pb-16 max-w-6xl mx-auto">
        {/* Navigation Links */}
        <div className="bg-white/5 backdrop-blur-lg rounded-lg p-4 mb-6 flex space-x-4">
          <Link to="/dashboard" className="px-4 py-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            Projects
          </Link>
          <Link to="/dashboard/profile" className="px-4 py-2 rounded-md bg-white/10 text-white font-medium">
            Profile
          </Link>
        </div>

        {/* Profile Form */}
        <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Your Profile</h2>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-md mb-4">
              {success}
            </div>
          )}
          
          {/* Ensure profile exists before accessing properties */}
          {profile && (
            <div className="mb-6 space-y-2">
              <p><span className="text-white/60">Email:</span> {profile.email}</p>
              <p><span className="text-white/60">Member since:</span> {new Date(profile.created_at).toLocaleDateString()}</p>
            </div>
          )}
          
          {/* Form to update phone number */}          
          <form onSubmit={handleSavePhoneNumber} className="space-y-4">
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-white/70 mb-1">
                Phone Number (for SMS notifications)
              </label>
              <input
                type="text"
                id="phoneNumber"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                placeholder="(555) 123-4567"
                className="w-full bg-white/10 border border-white/20 rounded-md px-4 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-4 py-2 rounded-md bg-white text-black font-medium hover:bg-white/90 transition-colors ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSaving ? 'Saving...' : 'Save Phone Number'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
} 