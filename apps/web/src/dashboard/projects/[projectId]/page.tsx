'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import LogoutButton from '../../../ErrorModal/LogoutButton';
import { useAuth } from '../../../context/AuthContext';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import styles from './projectErrors.module.css';
import { RealtimeChannel } from '@supabase/supabase-js';
import { formatDistanceToNow } from 'date-fns';
import ErrorDetailModal from '../../../ErrorModal/ErrorDetailModal';

// Define types based on API responses
interface Project {
  id: string;
  name: string;
  // Add other fields if needed
}

interface ApiError {
  id: string;
  message: string;
  received_at: string;
  stack_trace: string | null;
  metadata: any | null;
  // Add other fields returned by the API
}

interface ErrorApiResponse {
  data: ApiError[];
  totalCount: number;
  page: number;
  limit: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Update fetchWithErrorHandling to accept and use an auth token
async function fetchWithErrorHandling(url: string, options?: RequestInit, token?: string | null): Promise<any> {
  let response;
  
  // Prepare headers, adding Authorization if token is provided
  const headers = new Headers(options?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  // Ensure credentials: 'include' is not conflicting if you mainly use tokens
  // If your API relies solely on Bearer tokens, you might not need credentials: 'include'
  const fetchOptions = {
      ...options,
      headers: headers,
      // credentials: 'include' // Keep or remove based on whether API ALSO needs cookies
  };

  try {
    response = await fetch(url, fetchOptions);
  } catch (networkError: any) { console.error('Network error:', networkError); throw new Error(`Network error: ${networkError.message}`); }

  if (!response.ok) {
    let errorPayload: any = { error: `Request failed: ${response.status} ${response.statusText}` }; // Include statusText
    try { errorPayload = await response.json(); } catch (e) { }
    console.error('API Error:', errorPayload);
    // Use a more specific error message if available from payload
    const errorMessage = errorPayload.error || errorPayload.message || errorPayload.details || `API Error ${response.status}`;
    throw new Error(errorMessage);
  }
  try { return await response.json(); } catch (e: any) { console.error('JSON parse error:', e); throw new Error(`Failed to parse response: ${e.message}`); }
}

// Helper function to truncate strings
function truncateString(str: string | null | undefined, maxLength: number): string {
  if (!str) return 'N/A';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

// Helper function to format metadata for display
function formatMetadata(metadata: any | null, maxLength: number): string {
    if (metadata === null || metadata === undefined) return 'N/A';
    let displayString;
    try {
        // Attempt to stringify, handling potential circular references gracefully is hard here
        // A simple JSON.stringify is often enough for basic display
        displayString = JSON.stringify(metadata);
    } catch (e) {
        displayString = '[Unserializable Metadata]';
    }
    return truncateString(displayString, maxLength);
}

// --- Helper Hook for Debouncing --- (Could be moved to a utils file)
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set debouncedValue to value (passed in) after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Return a cleanup function that will be called every time ...
    // ... useEffect executes, except the first time.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-call effect if value or delay changes

  return debouncedValue;
}
// --- End Debounce Hook ---

export default function ProjectErrorsPage() {
  const params = useParams();
  const navigate = useNavigate();
  const supabase = getSupabaseClient();
  const { user: authUser, session, loading: loadingAuth, signOut } = useAuth();
  const location = useLocation();

  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [errors, setErrors] = useState<ApiError[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20); // Items per page
  const [totalCount, setTotalCount] = useState(0);

  // State for the modal
  const [selectedError, setSelectedError] = useState<ApiError | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for Search Filter
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // State for Sorting
  const [sortKey, setSortKey] = useState<'received_at' | 'message'>('received_at'); // Default sort by received_at
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // Default newest first

  // Redirect if auth finished loading and there's no user
  useEffect(() => {
    if (!loadingAuth && !authUser) {
      console.log('ProjectErrorsPage: Auth loaded, no user found. Redirecting to login.');
      // Optionally pass current path for redirect back
      const redirectPath = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
    }
  }, [loadingAuth, authUser, navigate, location.pathname, location.search]);

  // Fetch project details and errors
  useEffect(() => {
    // Wait for auth to load and ensure we have a session and projectId
    if (loadingAuth || !session || !projectId) {
      // If auth is loading, reflect that in local loading state
      setLoading(loadingAuth);
      // If not loading auth but no session, clear errors/project and stop loading
      if (!loadingAuth && !session) {
          setProject(null);
          setErrors([]);
          setTotalCount(0);
          setFetchError('No active session found.');
          setLoading(false);
      }
      return; 
    }

    const fetchData = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        // Fetch project details, passing the access token
        const projectDetails = await fetchWithErrorHandling(
            `${API_BASE_URL}/api/projects/${projectId}`, 
            { /* options if needed */ }, 
            session.access_token // Pass token
        );
        setProject(projectDetails);

        // Fetch errors for the current page, passing the access token
        const errorsResponse: ErrorApiResponse = await fetchWithErrorHandling(
            `${API_BASE_URL}/api/errors?projectId=${projectId}&page=${currentPage}&limit=${limit}`, 
            { /* options if needed */ }, 
            session.access_token // Pass token
        );
        setErrors(errorsResponse.data);
        setTotalCount(errorsResponse.totalCount);

      } catch (err: any) {
        console.error('Error fetching project data or errors:', err);
        setFetchError(err.message || 'Failed to load data.');
        // Handle 401 specifically if needed
        if (err.message?.includes('Unauthorized') || err.message?.includes('401')) {
            // Maybe trigger sign out or show specific message?
            // signOut(); // Example: Force sign out on persistent 401
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Add loadingAuth and session to dependency array
  }, [loadingAuth, session, projectId, currentPage, limit, API_BASE_URL, navigate]); 

  // --- Realtime Subscription Setup ---
  useEffect(() => {
    // Depend on session instead of local user state
    if (!session || !projectId) return;

    console.log(`[Realtime] Setting up subscription for project: ${projectId}`);

    // Define the function to handle incoming new errors
    const handleNewError = (payload: any) => {
      console.log(`[Realtime] handleNewError CALLED. Payload:`, payload);
      
      if (payload.eventType !== 'INSERT') {
        console.log(`[Realtime] Received non-INSERT event type: ${payload.eventType}. Skipping.`);
        return;
      }
      
      if (!payload.new || typeof payload.new !== 'object') {
           console.error('[Realtime] Received INSERT event, but payload.new is missing or not an object.', payload);
           return;
      }

      const newError = payload.new as ApiError; // Cast the payload to our ApiError type
      console.log(`[Realtime] Processing new error with ID: ${newError.id}`);

      // Check if the error (by ID) is already in the list
      setErrors((currentErrors) => {
          console.log(`[Realtime] Current errors count before update attempt: ${currentErrors.length}`);
          if (currentErrors.some(e => e.id === newError.id)) {
              console.log(`[Realtime] Duplicate error received (ID: ${newError.id}), skipping state update.`);
              return currentErrors; // Return the list unchanged
          }
          // Prepend the new error to the list
          const updatedErrors = [newError, ...currentErrors];
          console.log(`[Realtime] Prepending new error. New count should be: ${updatedErrors.length}`);
          return updatedErrors;
      });
      
      // Increment total count
      setTotalCount(currentTotal => {
          console.log(`[Realtime] Updating total count from ${currentTotal} to ${currentTotal + 1}`);
          return currentTotal + 1;
      });
      
    };

    // Create a Supabase channel instance
    // Channel names should be unique, project ID is good for this
    const channel: RealtimeChannel = supabase.channel(`project-errors:${projectId}`)
      .on(
        'postgres_changes', // Listen to database changes
        { 
          event: 'INSERT', // Specifically listen for INSERT events
          schema: 'public', // On the public schema
          table: 'errors', // In the 'errors' table
          filter: `project_id=eq.${projectId}` // *Only* for rows matching this projectId
        },
        handleNewError // Call our handler function when an event occurs
      )
      .subscribe((status, err) => { // Optional: Log subscription status/errors
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Successfully subscribed to project ${projectId} errors!`);
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`[Realtime] Subscription error for project ${projectId}:`, status, err);
          // Optionally set an error state here to inform the user
          setFetchError(`Realtime connection failed: ${status}. Please refresh.`);
        }
        if (status === 'CLOSED'){
             console.log(`[Realtime] Subscription closed for project ${projectId}.`);
        }
      });

    // --- Cleanup Function ---
    // This runs when the component unmounts or projectId changes
    return () => {
      console.log(`[Realtime] Cleaning up subscription for project: ${projectId}`);
      if (channel) {
        supabase.removeChannel(channel).catch(error => {
            console.error('[Realtime] Error removing channel:', error);
        });
      }
    };

  }, [supabase, projectId, session]); // Dependencies: Re-run if supabase client, projectId, or session changes
  // --- End Realtime Subscription Setup ---

  // --- Filtered Errors --- 
  const filteredErrors = useMemo(() => {
      if (!debouncedSearchTerm) {
          return errors; // No filter applied
      }
      const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();
      return errors.filter(error => 
          error.message.toLowerCase().includes(lowerCaseSearchTerm)
          // Optionally filter by stack trace or metadata as well:
          // || (error.stack_trace && error.stack_trace.toLowerCase().includes(lowerCaseSearchTerm))
          // || (error.metadata && JSON.stringify(error.metadata).toLowerCase().includes(lowerCaseSearchTerm))
      );
  }, [errors, debouncedSearchTerm]);
  // --- End Filtered Errors ---

  // --- Sorted Errors ---
  const sortedAndFilteredErrors = useMemo(() => {
      let items = [...filteredErrors]; // Create a mutable copy

      items.sort((a, b) => {
          let valA, valB;

          if (sortKey === 'received_at') {
              valA = new Date(a.received_at).getTime();
              valB = new Date(b.received_at).getTime();
          } else if (sortKey === 'message') {
              valA = a.message.toLowerCase();
              valB = b.message.toLowerCase();
          } else {
              return 0; // Should not happen with current types
          }

          if (valA < valB) {
              return sortDirection === 'asc' ? -1 : 1;
          }
          if (valA > valB) {
              return sortDirection === 'asc' ? 1 : -1;
          }
          return 0;
      });

      return items;
  }, [filteredErrors, sortKey, sortDirection]);
  // --- End Sorted Errors ---

  const totalPages = Math.ceil(totalCount / limit);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Function to open the modal with the selected error
  const handleRowClick = (error: ApiError) => {
    setSelectedError(error);
    setIsModalOpen(true);
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedError(null); // Clear selected error when closing
  };

  // --- Sort Handler ---
  const handleSort = (key: 'received_at' | 'message') => {
      if (key === sortKey) {
          // If clicking the same key, just reverse the direction
          setSortDirection(prevDirection => (prevDirection === 'asc' ? 'desc' : 'asc'));
      } else {
          // If clicking a new key, set the new key and the default direction
          setSortKey(key);
          setSortDirection(key === 'received_at' ? 'desc' : 'asc');
      }
  };
  // --- End Sort Handler ---

  // Helper to render sort icon
  const renderSortIcon = (key: 'received_at' | 'message') => {
      if (sortKey !== key) return null;
      return sortDirection === 'asc' ? 
          <ArrowUpIcon className={styles.sortIcon} /> : 
          <ArrowDownIcon className={styles.sortIcon} />;
  };

  return (
    <div className={styles.pageWrapper}>
       {/* Header - Consistent with Dashboard */}
       <header className={styles.header}>
         <Link to="/dashboard" className={styles.logoLink}>
           <ArrowLeftIcon className={styles.backIcon} />
           <div className={styles.logoCircle}><span>E</span></div>
           <span className={styles.logoText}>Errly</span>
         </Link>
         <div className={styles.headerRight}>
           {authUser && <span className={styles.userEmail}>{authUser.email}</span>}
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
         <h1 className={styles.pageTitle}>Errors for: {project ? project.name : 'Loading project...'}</h1>

        {/* Add Filter Section */} 
        <div className={styles.filterControls}>
           <div className={styles.searchContainer}>
             <MagnifyingGlassIcon className={styles.searchIcon} />
             <input
               type="text"
               placeholder="Filter by message..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className={styles.searchInput}
             />
           </div>
           {/* Add Sort controls here later if needed */}
         </div>

        {loading && (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading errors...</p>
          </div>
        )}

        {fetchError && (
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>Error: {fetchError}</p>
            {/* Optional: Add a retry button */}
          </div>
        )}

        {!loading && !fetchError && (
          <>
            {/* Table Container */}
            <div className={styles.errorsTableContainer}>
              {/* Conditionally render table only if there are errors to show (after filtering) */}
              {sortedAndFilteredErrors.length > 0 ? (
                <table className={styles.errorsTable}>
                  <thead>
                    <tr>
                      {/* Table Header Row */}
                      <th>
                        <button onClick={() => handleSort('message')} className={styles.sortButton}>
                          Message
                          {renderSortIcon('message')}
                        </button>
                      </th>
                      <th>
                        <div className={styles.tableHeader}>Stack Trace (Preview)</div>
                      </th>
                      <th>
                        <div className={styles.tableHeader}>Metadata (Preview)</div>
                      </th>
                      <th>
                        <button onClick={() => handleSort('received_at')} className={styles.sortButton}>
                          Received
                          {renderSortIcon('received_at')}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Map over FILTERED errors */} 
                    {sortedAndFilteredErrors.map((error) => (
                      <tr key={error.id} onClick={() => handleRowClick(error)} className={styles.errorRow}>
                        <td className={styles.messageCell}>{error.message}</td>
                        <td className={styles.stackTraceCell}>
                          <pre>{truncateString(error.stack_trace, 100)}</pre>
                        </td>
                        <td className={styles.metadataCell}>
                          <pre>{formatMetadata(error.metadata, 100)}</pre>
                        </td>
                        <td className={styles.dateCell}>
                          {formatDistanceToNow(new Date(error.received_at), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                 // Show message if filters result in no errors
                 <p className={styles.noErrorsMessage}>
                     {searchTerm ? 'No errors match your filter.' : 'No errors found for this project yet.'}
                 </p>
              )}
            </div>

            {/* Pagination Controls - Keep based on totalCount from API for simplicity */}
            {totalPages > 1 && (
              <div className={styles.paginationControls}>
                <button onClick={handlePreviousPage} disabled={currentPage === 1} className={styles.paginationButton}>
                  <ChevronLeftIcon /> Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {currentPage} of {totalPages} (Total: {totalCount})
                </span>
                <button onClick={handleNextPage} disabled={currentPage === totalPages} className={styles.paginationButton}>
                  Next <ChevronRightIcon />
                </button>
              </div>
            )}
          </>
        )}
       </motion.div>

      {/* Render the Modal */} 
      <ErrorDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        error={selectedError}
      />
    </div>
  );
} 