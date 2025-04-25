'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { getSupabaseClient } from '../../../lib/supabaseClient.ts';
import LogoutButton from '../../../ErrorModal/LogoutButton.tsx';
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
  Bars3Icon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { RealtimeChannel } from '@supabase/supabase-js';
import { formatDistanceToNow } from 'date-fns';
import ErrorDetailModal from '../../../ErrorModal/ErrorDetailModal.tsx';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  level: string; // Add level field
  // Add other fields returned by the API
}

interface ErrorApiResponse {
  data: ApiError[];
  totalCount: number;
  page: number;
  limit: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function fetchWithErrorHandling(url: string, options?: RequestInit, token?: string | null): Promise<any> {
  let response;
  
  const headers = new Headers(options?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const fetchOptions = {
      ...options,
      headers: headers,
  };

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

function truncateString(str: string | null | undefined, maxLength: number): string {
  if (!str) return 'N/A';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

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

const getLevelDetails = (level?: string): { icon: React.ElementType, colorClass: string, filterColorClass: string, filterHoverClass: string } => {
  const lowerLevel = level?.toLowerCase();
  switch (lowerLevel) {
    case 'error':
      return { icon: ExclamationTriangleIcon, colorClass: 'border-l-red-500 hover:bg-red-100 dark:hover:bg-red-900/50', filterColorClass: 'border-red-500 bg-red-500 hover:bg-red-600 text-white', filterHoverClass: 'hover:bg-red-600' };
    case 'warn':
      return { icon: ExclamationCircleIcon, colorClass: 'border-l-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/50', filterColorClass: 'border-yellow-500 bg-yellow-500 hover:bg-yellow-600 text-white', filterHoverClass: 'hover:bg-yellow-600' };
    case 'info':
      return { icon: InformationCircleIcon, colorClass: 'border-l-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50', filterColorClass: 'border-blue-500 bg-blue-500 hover:bg-blue-600 text-white', filterHoverClass: 'hover:bg-blue-600' };
    case 'log':
      return { icon: ChatBubbleBottomCenterTextIcon, colorClass: 'border-l-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900/50', filterColorClass: 'border-purple-500 bg-purple-500 hover:bg-purple-600 text-white', filterHoverClass: 'hover:bg-purple-600' };
    default:
      return { icon: Bars3Icon, colorClass: 'border-l-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50', filterColorClass: 'border-primary bg-primary hover:bg-primary/90 text-primary-foreground', filterHoverClass: 'hover:bg-primary/90' };
  }
};

const getLevelRowClassName = (level?: string): string => {
  return getLevelDetails(level).colorClass;
};

type LevelFilter = 'all' | 'error' | 'warn' | 'info' | 'log';

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
  const [limit, setLimit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedError, setSelectedError] = useState<ApiError | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [sortKey, setSortKey] = useState<'received_at' | 'message'>('received_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');

  useEffect(() => {
    if (!loadingAuth && !authUser) {
      console.log('ProjectErrorsPage: Auth loaded, no user found. Redirecting to login.');
      const redirectPath = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
    }
  }, [loadingAuth, authUser, navigate, location.pathname, location.search]);

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
        if (err.message?.includes('Unauthorized') || err.message?.includes('401')) {
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loadingAuth, session, projectId, currentPage, limit, API_BASE_URL, navigate]); 

  useEffect(() => {
    if (!session || !projectId) return;

    console.log(`[Realtime] Setting up subscription for project: ${projectId}`);

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

      const newError = payload.new as ApiError;
      console.log(`[Realtime] Processing new error with ID: ${newError.id}`);

      setErrors((currentErrors) => {
          console.log(`[Realtime] Current errors count before update attempt: ${currentErrors.length}`);
          if (currentErrors.some(e => e.id === newError.id)) {
              console.log(`[Realtime] Duplicate error received (ID: ${newError.id}), skipping state update.`);
              return currentErrors;
          }
          const updatedErrors = [newError, ...currentErrors];
          console.log(`[Realtime] Prepending new error. New count should be: ${updatedErrors.length}`);
          return updatedErrors;
      });
      
      setTotalCount(currentTotal => {
          console.log(`[Realtime] Updating total count from ${currentTotal} to ${currentTotal + 1}`);
          return currentTotal + 1;
      });
      
    };

    const channel: RealtimeChannel = supabase.channel(`project-errors:${projectId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT',
          schema: 'public',
          table: 'errors',
          filter: `project_id=eq.${projectId}`
        },
        handleNewError
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Successfully subscribed to project ${projectId} errors!`);
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`[Realtime] Subscription error for project ${projectId}:`, status, err);
          setFetchError(`Realtime connection failed: ${status}. Please refresh.`);
        }
        if (status === 'CLOSED'){
             console.log(`[Realtime] Subscription closed for project ${projectId}.`);
        }
      });

    return () => {
      console.log(`[Realtime] Cleaning up subscription for project: ${projectId}`);
      if (channel) {
        supabase.removeChannel(channel).catch(error => {
            console.error('[Realtime] Error removing channel:', error);
        });
      }
    };

  }, [supabase, projectId, session]);

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
          } else {
              return 0;
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
      return <Icon className="ml-2 h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 dark:bg-zinc-900">
       <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 dark:bg-zinc-950 dark:border-zinc-800">
         <Link to="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-primary-foreground mr-4">
            <ArrowLeftIcon className="h-5 w-5 text-muted-foreground" />
            <img src="/lovable-uploads/carbon.svg" alt="Errly Logo" className="h-6 w-6" />
            <span className="sr-only">Errly</span>
         </Link>
         <div className="relative ml-auto flex-1 md:grow-0">
         </div>
         <div className="flex items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
           {authUser && <span className="text-sm text-muted-foreground hidden md:inline-block">{authUser.email}</span>}
           <LogoutButton />
         </div>
       </header>

       <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
         <h1 className="text-2xl font-semibold leading-none tracking-tight mt-4">
            Errors for: {project ? project.name : 'Loading project...'}
          </h1>

         <div className="flex flex-wrap items-center gap-4">
           <div className="relative flex-1 md:grow-0">
             <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input
               type="search"
               placeholder="Filter by message..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px] dark:bg-zinc-900"
             />
           </div>
           <div className="flex flex-wrap items-center gap-2 ml-auto">
              {(['all', 'error', 'warn', 'info', 'log'] as const).map((level) => {
                const details = getLevelDetails(level);
                const isActive = levelFilter === level;
                const Icon = details.icon; 
                return (
                  <Button
                    key={level}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLevelFilter(level)}
                    className={`capitalize ${isActive && level !== 'all' ? details.filterColorClass : ''} ${isActive && level === 'all' ? details.filterColorClass : ''} `}
                  >
                    <Icon className={`mr-2 h-4 w-4 ${isActive ? '' : 'text-muted-foreground'}`} />
                    {level}
                  </Button>
                );
              })}
           </div>
         </div>

         {loading && (
          <div className="flex items-center justify-center py-12"> 
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div> 
             <p className="ml-3 text-muted-foreground">Loading errors...</p>
           </div>
         )}

         {fetchError && (
           <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 bg-destructive/10 border-destructive/50 text-destructive" role="alert"> 
             <h5 className="mb-1 font-medium leading-none tracking-tight">Error</h5>
             <div className="text-sm"> {fetchError}</div>
           </div>
         )}
        
         {/* Table and Pagination Section */}
         {!loading && !fetchError && (
            <Card className="dark:bg-zinc-900"> {/* Use Card component for container */}
                <CardContent className="p-0"> {/* Remove CardContent padding if table handles it */}
                    <div className="overflow-x-auto"> {/* Make table scrollable on small screens */}
                        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700"> 
                            <thead className="bg-zinc-50 dark:bg-zinc-800"> 
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-[30%]">
                                        <Button variant="ghost" size="sm" onClick={() => handleSort('message')} className="-ml-2 h-8 data-[state=open]:bg-accent">
                                            Message {renderSortIcon('message')}
                                        </Button>
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-[30%]">
                                        Stack Trace (Preview)
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-[25%]">
                                        Metadata (Preview)
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 w-[15%]">
                                         <Button variant="ghost" size="sm" onClick={() => handleSort('received_at')} className="-ml-2 h-8 data-[state=open]:bg-accent">
                                            Received {renderSortIcon('received_at')}
                                        </Button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
                                {sortedAndFilteredErrors.length > 0 ? (
                                    sortedAndFilteredErrors.map((error) => (
                                        <tr 
                                            key={error.id} 
                                            onClick={() => handleRowClick(error)} 
                                            className={`cursor-pointer border-l-4 transition-colors ${getLevelRowClassName(error.level)} dark:border-l-4`}
                                        >
                                            <td className="whitespace-normal px-4 py-3 align-top text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                {error.message}
                                            </td>
                                            <td className="whitespace-pre-wrap px-4 py-3 align-top font-mono text-xs text-zinc-500 dark:text-zinc-400">
                                                {truncateString(error.stack_trace, 150)} 
                                            </td>
                                            <td className="whitespace-pre-wrap px-4 py-3 align-top font-mono text-xs text-zinc-500 dark:text-zinc-400">
                                                {formatMetadata(error.metadata, 150)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 align-top text-xs text-zinc-500 dark:text-zinc-400">
                                                {formatDistanceToNow(new Date(error.received_at), { addSuffix: true })}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                                            {searchTerm || levelFilter !== 'all' ? 'No errors match your filter.' : 'No errors found for this project yet.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
                 {/* Pagination Controls - Move inside Card or keep separate? Let's keep separate for now */} 
            </Card>
         )}
         
        {/* Pagination - Refactor using Tailwind and Button */}
        {!loading && !fetchError && totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between px-2">
                <div className="text-xs text-muted-foreground">
                    Page {currentPage} of {totalPages} (Total: {totalCount} errors)
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeftIcon className="mr-1 h-4 w-4" />
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                    >
                        Next
                        <ChevronRightIcon className="ml-1 h-4 w-4" />
                    </Button>
                </div>
            </div>
        )}

       </main>

       <ErrorDetailModal
         isOpen={isModalOpen}
         onClose={handleCloseModal}
         error={selectedError}
       />
     </div>
  );
} 