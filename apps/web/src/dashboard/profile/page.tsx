import React, { useState, useEffect, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getSupabaseClient } from '../../lib/supabaseClient.ts'
import { useAuth } from '../../context/AuthContext.tsx'
import { LogOut, PlusCircle, X, Trash2, AlertTriangle, Edit } from 'lucide-react'
import { Settings, User as UserIcon, Phone, Save } from 'lucide-react'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// Define interface for profile data from 'users' table
interface UserProfile {
  id: string // This is the PK of the users table
  email: string
  phone_number: string | null // Represents the single column in users table (may be deprecated)
  created_at: string
}

// Define interface for data from 'phone_numbers' table
interface PhoneNumber {
  id: number;
  user_id: string;
  phone_number: string;
  is_primary: boolean;
  label: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const { user, signOut, loading: loadingAuth } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
  const [showAddPhoneForm, setShowAddPhoneForm] = useState(false)
  const [newPhoneNumber, setNewPhoneNumber] = useState<string | undefined>(undefined)
  const [newPhoneLabel, setNewPhoneLabel] = useState('')

  // State for Delete Confirmation Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [phoneToDeleteId, setPhoneToDeleteId] = useState<number | null>(null)

  // State for Edit Label Dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [phoneToEdit, setPhoneToEdit] = useState<PhoneNumber | null>(null)
  const [editingLabelValue, setEditingLabelValue] = useState('')

  const navigate = useNavigate()
  const supabase = getSupabaseClient()

  // Helper function to format phone numbers for display
  const formatPhoneNumberForDisplay = (value: string | null | undefined): string => {
    if (!value) return ''
    // Basic E.164 formatting display (+1 (XXX) XXX-XXXX)
    const phoneNumber = value.replace(/\D/g, '')
    const match = phoneNumber.match(/^1?(\d{3})(\d{3})(\d{4})$/)
    if (match) {
      return `+1 (${match[1]}) ${match[2]}-${match[3]}`
    }
    return value // Return original if formatting fails
  }

  // Function to fetch phone numbers - extracted for reusability
  const fetchPhoneNumbers = async (userId: string) => {
    if (!userId) return; 
    console.log('Fetching phone numbers for user ID:', userId);
    try {
      const { data: numbersData, error: numbersError } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('user_id', userId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (numbersError) {
        throw numbersError; // Throw error to be caught by caller
      }
      console.log('Fetched phone numbers:', numbersData);
      setPhoneNumbers(numbersData as PhoneNumber[]);
    } catch (err: any) {
        console.error('Error fetching phone numbers:', err);
        setError('Could not load phone numbers.');
        setPhoneNumbers([]); // Reset on error
    }
  }

  // useEffect to fetch data on component mount or when auth state changes
  useEffect(() => {
    async function getAuthUserAndProfile() {
      if (loadingAuth) return;
      if (!user) {
        console.error('No authenticated user found, redirecting to login.');
        navigate('/login');
        return;
      }

      console.log('Authenticated user found:', user.id); // This is auth.users.id
      setIsLoading(true);
      setError(null); 
      setPhoneNumbers([]); 
      setProfile(null); // Reset profile state initially

      let fetchedProfileData: UserProfile | null = null;

      try {
        // --- Fetch or Create User Profile in public.users ---
        console.log('Querying for user profile with supabase_auth_id:', user.id);
        let { data: profileData, error: profileError } = await supabase
          .from('users') 
          .select('*')
          .eq('supabase_auth_id', user.id) 
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError; // Throw actual errors
        }

        if (!profileData) {
          // Profile doesn't exist (PGRST116), create it
          console.log('Profile not found, creating...');
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert({ supabase_auth_id: user.id, email: user.email || '' })
            .select('*')
            .single();

          if (insertError) throw new Error(`Failed to create user profile: ${insertError.message}`);
          
          fetchedProfileData = newProfile as UserProfile;
          console.log('Profile created successfully:', fetchedProfileData);
        } else {
          fetchedProfileData = profileData as UserProfile;
          console.log('Profile data found:', fetchedProfileData);
        }

        setProfile(fetchedProfileData); // Set profile state

        // --- Fetch Phone Numbers (If Profile Exists) ---
        if (fetchedProfileData?.id) { // Ensure we have the profile ID
          console.log('Fetching phone numbers for user ID:', fetchedProfileData.id);
          await fetchPhoneNumbers(fetchedProfileData.id); // Call the extracted function
        }

      } catch (err: any) {
        console.error('Error loading profile page data:', err);
        setError(`Failed to load profile data: ${err.message || 'Unknown error'}`);
        setProfile(null); 
        setPhoneNumbers([]);
      } finally {
        setIsLoading(false);
      }
    }

    getAuthUserAndProfile();
  }, [user, loadingAuth, navigate, supabase]);

  // ADD Phone Number Logic
  const handleAddPhoneNumber = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile?.id || !newPhoneNumber) {
        setError('Please enter a phone number.');
        return;
    }

    // Use the library's validator
    if (!isValidPhoneNumber(newPhoneNumber)) {
      setError('Please enter a valid phone number.');
      return;
    }

    // The state `newPhoneNumber` should already be in E.164 format
    const numberToSave = newPhoneNumber; 

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: insertError } = await supabase
        .from('phone_numbers')
        .insert({
          user_id: profile.id,
          phone_number: numberToSave, // Already E.164
          label: newPhoneLabel || null, 
          is_primary: phoneNumbers.length === 0 
        });

      if (insertError) {
        // Check for unique constraint violation (user_phone_number_unique)
        if (insertError.code === '23505') { // PostgreSQL unique violation code
           setError('This phone number has already been added.');
        } else {
           throw insertError;
        }
      } else {
          setSuccess('Phone number added successfully!');
          // Reset form and hide
          setNewPhoneNumber(undefined); // Reset state
          setNewPhoneLabel('');
          setShowAddPhoneForm(false);
          // Re-fetch numbers to update the list
          await fetchPhoneNumbers(profile.id);
      }

    } catch (err: any) {
      if (!error) { // Avoid overwriting specific errors like unique violation
          console.error('Error adding phone number:', err);
          setError(`Failed to add phone number: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsSaving(false);
    }
  }

  // --- Edit Label --- 
  // Function to open the edit dialog
  const openEditLabelDialog = (phoneNumber: PhoneNumber) => {
    setPhoneToEdit(phoneNumber);
    setEditingLabelValue(phoneNumber.label || ''); // Initialize input with current label
    setIsEditDialogOpen(true);
  };

  // Function to handle the label update
  const handleLabelUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
     event.preventDefault();
     if (!profile?.id || !phoneToEdit) return;

     const newLabel = editingLabelValue.trim() || null; // Trim whitespace, use null if empty
     // Optional: Check if label actually changed? 
     // if (newLabel === (phoneToEdit.label || null)) {
     //    setIsEditDialogOpen(false); // Just close if no change
     //    setPhoneToEdit(null);
     //    return;
     // }

     setIsSaving(true);
     setError(null);
     setSuccess(null);
     
     try {
        const { error: updateError } = await supabase
            .from('phone_numbers')
            .update({ label: newLabel })
            .match({ id: phoneToEdit.id, user_id: profile.id });

        if (updateError) throw updateError;

        setSuccess('Label updated successfully.');
        setIsEditDialogOpen(false); // Close dialog on success
        setPhoneToEdit(null);
        await fetchPhoneNumbers(profile.id); // Refresh list

     } catch (err: any) {
        console.error('Error updating label:', err);
        setError(`Failed to update label: ${err.message || 'Unknown error'}`);
        // Keep dialog open on error?
     } finally {
        setIsSaving(false);
     }
  }

  // Function to *initiate* deletion (opens the dialog)
  const handleDeletePhoneNumber = async (phoneNumberId: number) => {
    const numberToDelete = phoneNumbers.find(num => num.id === phoneNumberId);
    if (!numberToDelete || numberToDelete.is_primary) {
      // Show error if trying to delete primary (or not found)
      setError("Primary phone numbers cannot be deleted.");
      return;
    }
    
    // Set state to open the dialog and store the ID
    setPhoneToDeleteId(phoneNumberId);
    setIsDeleteDialogOpen(true);
  }

  // Function to *execute* the deletion after confirmation
  const executeDelete = async () => {
    if (!profile?.id || phoneToDeleteId === null) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);
    setIsDeleteDialogOpen(false); // Close dialog immediately

    try {
        const { error: deleteError } = await supabase
            .from('phone_numbers')
            .delete()
            .match({ 
                id: phoneToDeleteId,
                user_id: profile.id, 
                is_primary: false 
            });

        if (deleteError) throw deleteError;

        setSuccess('Phone number deleted successfully.');
        await fetchPhoneNumbers(profile.id); // Re-fetch to update list

    } catch (err: any) {
        console.error('Error deleting phone number:', err);
        setError(`Failed to delete phone number: ${err.message || 'Unknown error'}`);
    } finally {
        setIsSaving(false);
        setPhoneToDeleteId(null); // Clear the stored ID
    }
  }
  
  // SET PRIMARY Phone Number Logic
  const handleSetPrimaryPhoneNumber = async (phoneNumberId: number) => {
      if (!profile?.id) return;
      
      // Find the number being set as primary
      const numberToSet = phoneNumbers.find(num => num.id === phoneNumberId);
      if (!numberToSet || numberToSet.is_primary) return; // Already primary or not found

      console.log('Attempting to set primary phone number:', { userId: profile.id, phoneId: phoneNumberId });

      setIsSaving(true);
      setError(null);
      setSuccess(null);

      try {
          const { error: rpcError } = await supabase.rpc('set_primary_phone', {
              target_user_id: profile.id,
              target_phone_id: phoneNumberId
          });

          if (rpcError) {
              // Handle specific errors raised in the function if needed
              if (rpcError.message.includes('User does not have permission')) {
                 setError("Permission denied.");
              } else if (rpcError.message.includes('Target phone number not found')) {
                 setError("Phone number not found.");
              } else {
                 throw rpcError; // Throw unexpected errors
              }
          } else {
              setSuccess('Primary phone number updated successfully.');
              // Re-fetch numbers to update the list (which will reflect the new primary)
              await fetchPhoneNumbers(profile.id);
          }

      } catch (err: any) {
          if (!error) { // Avoid overwriting specific RPC errors
             console.error('Error setting primary phone number:', err);
             setError(`Failed to set primary phone number: ${err.message || 'Unknown error'}`);
          }
      } finally {
          setIsSaving(false);
      }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  // Loading State UI
  if (loadingAuth || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-white"></div>
      </div>
    );
  }

  // Render Profile Page UI
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

        {/* Profile Form Area */}
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
          
          {profile && (
            <div className="mb-6 space-y-2">
              <p><span className="text-white/60">Email:</span> {profile.email}</p>
              <p><span className="text-white/60">Member since:</span> {new Date(profile.created_at).toLocaleDateString()}</p>
            </div>
          )}
          
          {/* List Existing Numbers */} 
          {phoneNumbers.length > 0 && (
            <ul className="space-y-3 mb-6">
              {phoneNumbers.map((num) => (
                <li key={num.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-800/50 p-4 rounded-md border border-gray-700/50">
                   {/* Phone number display */}
                   <div>
                     <span className="font-medium text-gray-100">{formatPhoneNumberForDisplay(num.phone_number)}</span>
                     {num.label && <span className="text-sm text-gray-400 ml-2">({num.label})</span>}
                   </div>
                   {/* Action Buttons Container */}
                   <div className="flex items-center space-x-2 flex-wrap mt-2 sm:mt-0">
                     {/* Primary Badge */}
                     {num.is_primary && (
                       <span className="text-xs bg-blue-800/70 text-blue-200 px-2.5 py-1 rounded-full font-medium">Primary</span>
                     )}
                     {/* --- Set Primary Button --- */}
                     {!num.is_primary && (
                       <button 
                         onClick={() => handleSetPrimaryPhoneNumber(num.id)}
                         className="text-xs text-blue-400 hover:text-blue-300 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                         title="Make Primary"
                         disabled={isSaving}
                       >
                         Make Primary
                       </button>
                     )}
                     {/* --- Edit Button --- */} 
                     <button 
                       onClick={() => openEditLabelDialog(num)} // Open edit dialog
                       className="text-xs text-gray-400 hover:text-gray-200 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                       title="Edit Label"
                       disabled={isSaving}
                     >
                       <Edit size={14} /> {/* Use icon */}
                     </button>
                     {/* --- Delete Button --- */}
                     {!num.is_primary && (
                       <button 
                         onClick={() => handleDeletePhoneNumber(num.id)}
                         className="text-xs text-red-500 hover:text-red-400 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                         title="Delete Number"
                         disabled={isSaving}
                       >
                         <Trash2 size={14} />
                       </button>
                     )}
                   </div>
                </li>
              ))}
            </ul>
          )}

          {/* Add New Number Button / Form */} 
          {!showAddPhoneForm ? (
            <button 
              onClick={() => setShowAddPhoneForm(true)}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center"
              disabled={isLoading || !profile || isSaving}
            >
              <PlusCircle size={16} className="mr-2"/>
              Add New Phone Number
            </button>
          ) : (
            <form onSubmit={handleAddPhoneNumber} className="mt-4 pt-4 border-t border-gray-700/50">
              <h3 className="text-lg font-medium mb-3 text-gray-300">Add a new phone number</h3>
              <div className="space-y-4">
                 <div>
                   <label htmlFor="newPhoneNumber" className="block text-sm font-medium text-gray-400 mb-1">
                     Phone Number*
                   </label>
                   <PhoneInput
                     id="newPhoneNumber"
                     international
                     withCountryCallingCode
                     value={newPhoneNumber}
                     onChange={setNewPhoneNumber}
                     defaultCountry="US"
                     placeholder="Enter phone number"
                     required
                     className="phone-input-container"
                     inputClassName="w-full bg-gray-800/60 border border-gray-700 rounded-md px-4 py-2 text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     disabled={isSaving}
                   />
                 </div>
                 <div>
                   <label htmlFor="newPhoneLabel" className="block text-sm font-medium text-gray-400 mb-1">
                     Label (Optional)
                   </label>
                   <input
                     type="text"
                     id="newPhoneLabel"
                     value={newPhoneLabel}
                     onChange={(e) => setNewPhoneLabel((e.target as HTMLInputElement).value)}
                     placeholder="e.g., Mobile, Work" 
                     className="w-full bg-gray-800/60 border border-gray-700 rounded-md px-4 py-2 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     disabled={isSaving}
                   />
                 </div>
                 <div className="flex items-center gap-3 pt-2">
                   <button
                     type="submit"
                     disabled={isSaving}
                     className="px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                   >
                     {isSaving ? (
                       <>
                         <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                         Adding...
                       </>
                     ) : (
                       <><Save size={16} className="mr-1"/> Add Number</>
                     )}
                   </button>
                   <button
                     type="button" // Important: type=button prevents form submission
                     onClick={() => setShowAddPhoneForm(false)} 
                     className="px-4 py-2 rounded-md bg-gray-700/50 text-gray-300 font-medium hover:bg-gray-600/50 transition-colors disabled:opacity-50"
                     disabled={isSaving}
                   >
                      Cancel
                   </button>
                 </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */} 
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-700 text-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="text-red-500 mr-2" size={20} />
              Are you absolutely sure?
             </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 pt-2">
              This action cannot be undone. This will permanently delete the phone number 
              <strong className="text-gray-100 mx-1">
                {/* Find number details to display */} 
                {formatPhoneNumberForDisplay(phoneNumbers.find(p => p.id === phoneToDeleteId)?.phone_number)}
              </strong> 
              from your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel 
              className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300"
              onClick={() => setPhoneToDeleteId(null)} // Clear ID on cancel
              disabled={isSaving} // Disable while saving
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={executeDelete} // Call the actual delete function
              disabled={isSaving} // Disable while saving
            >
              {isSaving ? 'Deleting...' : 'Yes, delete number'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Label Dialog */} 
      <Dialog open={isEditDialogOpen} onOpenChange={(open: boolean) => { // Add boolean type for open
          if (!open) setPhoneToEdit(null); 
          setIsEditDialogOpen(open); 
        }}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-700 text-gray-200">
          <form onSubmit={handleLabelUpdate}> 
            <DialogHeader>
              <DialogTitle className="text-gray-100">Edit Label</DialogTitle>
              <DialogDescription className="text-gray-400 pt-1">
                Update the label for the phone number 
                <strong className="text-gray-100 mx-1">
                  {formatPhoneNumberForDisplay(phoneToEdit?.phone_number)}
                </strong>.
                 Leave blank to remove the label.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="edit-label" className="text-right text-sm text-gray-400">
                  Label
                </label>
                <Input 
                  id="edit-label"
                  value={editingLabelValue} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingLabelValue(e.target.value)} 
                  className="col-span-3 bg-gray-800 border-gray-600 text-gray-100 focus:ring-blue-500"
                  placeholder="e.g., Mobile, Work"
                  disabled={isSaving}
                />
              </div>
            </div>
            <DialogFooter className="mt-2">
              <Button 
                 type="button" // Prevent implicit submission if needed
                 variant="outline" 
                 className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300"
                 onClick={() => setIsEditDialogOpen(false)} 
                 disabled={isSaving}
              >
                 Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
} 