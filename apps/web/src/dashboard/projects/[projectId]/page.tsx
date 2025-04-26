// Enhanced UI: glassmorphism, dark theme, level icons in rows – functionality untouched.
// File: ProjectErrorsPage.tsx

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { getSupabaseClient } from '../../../lib/supabaseClient.ts';
import { useAuth } from '../../../context/AuthContext.tsx';
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  ChatBubbleBottomCenterTextIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { RealtimeChannel } from '@supabase/supabase-js';
import { formatDistanceToNow } from 'date-fns';
import ErrorDetailModal from '../../../ErrorModal/ErrorDetailModal.tsx';
import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

// --- START Re-inserting missing code --- 

// --- Interfaces --- 
interface Project {
  id: string;
  name: string;
}

interface ApiError {
  id: string;
  message: string;
  received_at: string;
  stack_trace: string | null;
  metadata: any | null;
  level: string;
}

interface ErrorApiResponse {
  data: ApiError[];
  totalCount: number;
  page: number;
  limit: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// --- Helper Functions --- 

// Fetch function (as defined previously)
async function fetchWithErrorHandling(url: string, options?: RequestInit, token?: string | null): Promise<any> {
  let response;
  const headers = new Headers(options?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const fetchOptions = { ...options, headers: headers };

  try {
    response = await fetch(url, fetchOptions);
  } catch (networkError: any) { console.error('Network error:', networkError); throw new Error(`Network error: ${networkError.message}`); }

  if (!response.ok) {
    let errorPayload: any = { error: `Request failed: ${response.status} ${response.statusText}` };
    try { errorPayload = await response.json(); } catch (e) { }
    console.error('API Error:', errorPayload);
    const errorMessage = errorPayload.error || errorPayload.message || errorPayload.details || `API Error ${response.status}`;
    throw new Error(errorMessage);
  }
  try { return await response.json(); } catch (e: any) { console.error('JSON parse error:', e); throw new Error(`Failed to parse response: ${e.message}`); }
}

// Truncate string function
function truncateString(str: string | null | undefined, maxLength: number): string {
  if (!str) return 'N/A';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

// Format metadata function
function formatMetadata(metadata: any | null, maxLength: number): string {
    if (metadata === null || metadata === undefined) return 'N/A';
    let displayString;
    try {
        displayString = JSON.stringify(metadata);
    } catch (e) {
        displayString = '[Unserializable Metadata]';
    }
    return truncateString(displayString, maxLength);
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// Get level details function (already present, ensure it's not duplicated)
const getLevelDetails = (level?: string): { icon: React.ElementType, colorClass: string, filterColorClass: string, filterHoverClass: string } => {
  const lowerLevel = level?.toLowerCase();
  switch (lowerLevel) {
    case 'error':
      return { icon: ExclamationTriangleIcon, colorClass: 'border-l-red-500 hover:bg-red-100 dark:hover:bg-red-900/50', filterColorClass: 'border-red-500 bg-red-500 hover:bg-red-600 text-white', filterHoverClass: 'hover:bg-red-600' };
    case 'warn':
      return { icon: ExclamationCircleIcon, colorClass: 'border-l-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-700/50', filterColorClass: 'border-yellow-500 bg-yellow-500 hover:bg-yellow-600 text-white', filterHoverClass: 'hover:bg-yellow-600' };
    case 'info':
      return { icon: InformationCircleIcon, colorClass: 'border-l-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50', filterColorClass: 'border-blue-500 bg-blue-500 hover:bg-blue-600 text-white', filterHoverClass: 'hover:bg-blue-600' };
    case 'log':
      return { icon: ChatBubbleBottomCenterTextIcon, colorClass: 'border-l-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900/50', filterColorClass: 'border-purple-500 bg-purple-500 hover:bg-purple-600 text-white', filterHoverClass: 'hover:bg-purple-600' };
    default: // Includes 'all' for filter and default for rows
      return { icon: Bars3Icon, colorClass: 'border-l-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50', filterColorClass: 'border-primary bg-primary hover:bg-primary/90 text-primary-foreground', filterHoverClass: 'hover:bg-primary/90' }; // Use a generic icon like Bars3Icon for default/all
  }
};

// Get level row class name helper
const getLevelRowClassName = (level?: string): string => {
  return getLevelDetails(level).colorClass;
};

// Get level icon helper
const getLevelIcon = (level?: string) => getLevelDetails(level).icon;

// --- Filter Type --- 
type LevelFilter = 'all' | 'error' | 'warn' | 'info' | 'log';

// --- END Re-inserting missing code ---


export default function ProjectErrorsPage() {
  // --- State & Hooks ---
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
  const [limit] = useState(20); // Keep limit state if used by API fetch
  const [totalCount, setTotalCount] = useState(0);

  const [selectedError, setSelectedError] = useState<ApiError | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // Now defined

  const [sortKey, setSortKey] = useState<'received_at' | 'message'>('received_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');

  // --- Effects (Authentication, Data Fetch, Realtime) --- 
  // Redirect if auth finished loading and there's no user
  useEffect(() => {
    if (!loadingAuth && !authUser) {
      console.log('ProjectErrorsPage: Auth loaded, no user found. Redirecting to login.');
      const redirectPath = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
    }
  }, [loadingAuth, authUser, navigate, location.pathname, location.search]);

  // Fetch project details and errors
  useEffect(() => {
    if (loadingAuth || !session || !projectId) {
      setLoading(loadingAuth);
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
        const projectDetails = await fetchWithErrorHandling(
            `${API_BASE_URL}/api/projects/${projectId}`, 
            { }, 
            session.access_token
        );
        setProject(projectDetails);

        const errorsResponse: ErrorApiResponse = await fetchWithErrorHandling(
            `${API_BASE_URL}/api/errors?projectId=${projectId}&page=${currentPage}&limit=${limit}`, 
            { }, 
            session.access_token
        );
        setErrors(errorsResponse.data);
        setTotalCount(errorsResponse.totalCount);

      } catch (err: any) {
        console.error('Error fetching project data or errors:', err);
        setFetchError(err.message || 'Failed to load data.');
        if (err.message?.includes('Unauthorized') || err.message?.includes('401')) { /* Handle 401 if needed */ }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loadingAuth, session, projectId, currentPage, limit, API_BASE_URL, navigate]); 

  // Realtime Subscription Setup
  useEffect(() => {
    if (!session || !projectId) return;
    console.log(`[Realtime] Setting up subscription for project: ${projectId}`);
    const handleNewError = (payload: any) => {
      if (payload.eventType !== 'INSERT' || !payload.new || typeof payload.new !== 'object') return;
      const newError = payload.new as ApiError;
      setErrors((currentErrors) => {
          if (currentErrors.some(e => e.id === newError.id)) return currentErrors;
          return [newError, ...currentErrors];
      });
      setTotalCount(currentTotal => currentTotal + 1);
    };
    const channel: RealtimeChannel = supabase.channel(`project-errors:${projectId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'errors', filter: `project_id=eq.${projectId}` }, handleNewError)
      .subscribe((status, err) => { 
        if (status === 'SUBSCRIBED') console.log(`[Realtime] Subscribed: ${projectId}`);
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setFetchError(`Realtime connection failed: ${status}`);
      });
    return () => {
      if (channel) supabase.removeChannel(channel).catch(console.error);
    };
  }, [supabase, projectId, session]);

  // --- Memoized Derived State --- 
  const filteredErrors = useMemo(() => {
    let tempErrors = errors;
    if (levelFilter !== 'all') {
        tempErrors = tempErrors.filter(error => error.level?.toLowerCase() === levelFilter);
    }
    if (debouncedSearchTerm) {
        const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();
        tempErrors = tempErrors.filter(error => 
            error.message.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }
    return tempErrors;
  }, [errors, debouncedSearchTerm, levelFilter]); 

  const sortedAndFilteredErrors = useMemo(() => {
      let items = [...filteredErrors]; 
      items.sort((a, b) => {
          let valA, valB;
          if (sortKey === 'received_at') {
              valA = new Date(a.received_at).getTime();
              valB = new Date(b.received_at).getTime();
          } else if (sortKey === 'message') {
              valA = a.message.toLowerCase();
              valB = b.message.toLowerCase();
          } else { return 0; }
          if (valA < valB) { return sortDirection === 'asc' ? -1 : 1; }
          if (valA > valB) { return sortDirection === 'asc' ? 1 : -1; }
          return 0;
      });
      return items;
  }, [filteredErrors, sortKey, sortDirection]);

  const totalPages = useMemo(() => Math.ceil(totalCount / limit), [totalCount, limit]);

  // --- Event Handlers --- 
  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleRowClick = (error: ApiError) => {
    setSelectedError(error);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedError(null);
  };

  const handleSort = (key: 'received_at' | 'message') => {
      if (key === sortKey) {
          setSortDirection(prevDirection => (prevDirection === 'asc' ? 'desc' : 'asc'));
      } else {
          setSortKey(key);
          setSortDirection(key === 'received_at' ? 'desc' : 'asc'); 
      }
  };

  const renderSortIcon = (key: 'received_at' | 'message') => {
      if (sortKey !== key) return null;
      const Icon = sortDirection === 'asc' ? ArrowUpIcon : ArrowDownIcon;
      return <Icon className="ml-1 h-4 w-4 text-gray-500" />; // Adjusted class
  };


  // --- Render Logic --- 
  return (
    <div className="flex min-h-screen w-full flex-col bg-black text-gray-200">
       {/* HEADER (as defined before) */}
       <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-white/10 bg-black/70 backdrop-blur-md px-4 sm:px-6">
         <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-blue-400 hover:text-blue-300">
            <ArrowLeftIcon className="h-5 w-5" /> 
            <img 
                src="/lovable-uploads/carbon.svg" 
                alt="Errly Logo" 
                className="h-6 w-6 rounded-full object-cover"
            /> 
            <span className="sr-only">Errly</span> 
         </Link>
         <div className="ml-auto flex items-center gap-4">
           {authUser && <span className="hidden text-sm text-gray-400 md:inline-block">{authUser.email}</span>}
           <button
             onClick={signOut} 
             title="Logout"
             className="flex h-8 w-8 items-center justify-center rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-gray-200"
           >
             <LogOut className="h-4 w-4" />
           </button>
         </div>
       </header>

       {/* MAIN CONTENT (as defined before) */}
       <main className="flex flex-1 flex-col gap-6 p-4 sm:px-6">
         {/* Title */}
         <h1 className="mt-2 text-2xl font-semibold text-gray-100">Errors for: {project ? project.name : 'Loading project...'}</h1>

         {/* Search + Level Filters */} 
         <div className="flex flex-wrap items-center gap-4">
           <div className="relative flex-1 md:grow-0">
             <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
             <Input
               type="search"
               placeholder="Filter by message…"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)} // Now typed
               className="w-full rounded-lg border border-white/10 bg-white/5 px-10 text-gray-200 placeholder-gray-500 backdrop-blur-md md:w-[240px] lg:w-[320px]"
             />
           </div>
           <div className="ml-auto flex flex-wrap items-center gap-2">
              {(['all', 'error', 'warn', 'info', 'log'] as const).map((level) => {
                const details = getLevelDetails(level);
                const isActive = levelFilter === level;
                const Icon = details.icon; 
                return (
                  <Button
                    key={level}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLevelFilter(level)}
                    className={`flex items-center gap-1 rounded-full border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide backdrop-blur-md transition ${isActive ? details.filterColorClass : 'hover:bg-white/10'} `}
                  >
                    <Icon className="h-4 w-4" /> 
                    {level}
                  </Button>
                );
              })}
           </div>
         </div>

         {/* Loading & Error States (as defined before) */}
         {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
            <p className="ml-3 text-gray-400">Loading errors…</p>
          </div>
         )}
         {fetchError && (
           <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300 backdrop-blur-md">
             <h5 className="mb-1 font-medium">Error</h5>
             <p className="text-sm">{fetchError}</p>
           </div>
         )}

         {/* Errors Table (as defined before) */}
         {!loading && !fetchError && (
          <Card className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                  <thead className="bg-white/5">
                    <tr>
                      <th scope="col" className="w-[32%] px-4 py-3 text-left font-semibold tracking-wider text-gray-400">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('message')} className="-ml-2 h-8 text-gray-400 hover:text-gray-200">
                          Message {renderSortIcon('message')}
                        </Button>
                      </th>
                      <th scope="col" className="w-[28%] px-4 py-3 text-left font-semibold tracking-wider text-gray-400">
                        Stack Trace
                      </th>
                      <th scope="col" className="w-[25%] px-4 py-3 text-left font-semibold tracking-wider text-gray-400">
                        Metadata
                      </th>
                      <th scope="col" className="w-[15%] px-4 py-3 text-left font-semibold tracking-wider text-gray-400">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('received_at')} className="-ml-2 h-8 text-gray-400 hover:text-gray-200">
                          Received {renderSortIcon('received_at')}
                        </Button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sortedAndFilteredErrors.length > 0 ? (
                      sortedAndFilteredErrors.map((error) => {
                        const Icon = getLevelIcon(error.level);
                        return (
                          <tr
                            key={error.id}
                            onClick={() => handleRowClick(error)}
                            className={`cursor-pointer border-l-4 ${getLevelRowClassName(error.level)} transition-colors hover:bg-white/5`}
                          >
                            <td className="flex items-start gap-2 whitespace-normal px-4 py-3 align-top text-gray-100">
                              <Icon className="mt-0.5 h-4 w-4 shrink-0" /> 
                              {error.message}
                            </td>
                            <td className="whitespace-pre-wrap px-4 py-3 align-top font-mono text-gray-400">
                              {truncateString(error.stack_trace, 120)}
                            </td>
                            <td className="whitespace-pre-wrap px-4 py-3 align-top font-mono text-gray-400">
                              {formatMetadata(error.metadata, 120)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 align-top text-gray-400">
                              {formatDistanceToNow(new Date(error.received_at), { addSuffix: true })}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                          {searchTerm || levelFilter !== 'all' ? 'No errors match your filter.' : 'No errors found for this project yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
         )}

         {/* Pagination (as defined before) */}
         {!loading && !fetchError && totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Page {currentPage} of {totalPages} (Total: {totalCount})
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1} className="rounded-full bg-white/5 backdrop-blur-md disabled:opacity-40">
                <ChevronLeftIcon className="mr-1 h-4 w-4" /> Prev
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages} className="rounded-full bg-white/5 backdrop-blur-md disabled:opacity-40">
                Next <ChevronRightIcon className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
         )}
       </main>

       {/* Error Detail Modal */}
       <ErrorDetailModal isOpen={isModalOpen} onClose={handleCloseModal} error={selectedError} />
    </div>
  );
}
