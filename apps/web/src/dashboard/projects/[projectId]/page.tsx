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
  EyeIcon,
  CheckCircleIcon,
  BellSlashIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { RealtimeChannel } from '@supabase/supabase-js';
import { formatDistanceToNow, subHours, subDays } from 'date-fns';
import ErrorDetailModal from '../../../ErrorModal/ErrorDetailModal.tsx';
import { LogOut } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { useDateRangeStore, DateRangePreset } from '../../../store/dateRangeStore';
import { useErrorStore, ApiError } from '../../../store/errorStore.ts';
import { default as DatePicker } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Sparkline from '../../../components/ui/Sparkline.tsx';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

// --- START Re-inserting missing code --- 

// --- Interfaces --- 
interface Project {
  id: string;
  name: string;
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
        // Attempt to pretty-print if it's a JSON string
        if (typeof metadata === 'string') {
             try {
                 displayString = JSON.stringify(JSON.parse(metadata), null, 2);
             } catch { displayString = metadata; /* Not JSON, use as is */}
        } else {
             displayString = JSON.stringify(metadata, null, 2); // Pretty-print object
        }
    } catch (e) {
        displayString = '[Unserializable Metadata]';
    }
    return truncateString(displayString, maxLength); // Use the passed maxLength
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
// Modified to return border class separately
const getLevelDetails = (level?: string): { 
  icon: React.ElementType, 
  borderClassName: string, // Added for specific border color 
  filterColorClass: string, 
  filterHoverClass: string 
} => {
  const lowerLevel = level?.toLowerCase();
  switch (lowerLevel) {
    case 'error':
      return { 
        icon: ExclamationTriangleIcon, 
        borderClassName: 'border-l-red-500', 
        filterColorClass: 'border-red-500 bg-red-500 hover:bg-red-600 text-white', 
        filterHoverClass: 'hover:bg-red-600' 
      };
    case 'warn':
      return { 
        icon: ExclamationCircleIcon, 
        borderClassName: 'border-l-yellow-500', 
        filterColorClass: 'border-yellow-500 bg-yellow-500 hover:bg-yellow-600 text-white', 
        filterHoverClass: 'hover:bg-yellow-600' 
      };
    case 'info':
      return { 
        icon: InformationCircleIcon, 
        borderClassName: 'border-l-blue-500', 
        filterColorClass: 'border-blue-500 bg-blue-500 hover:bg-blue-600 text-white', 
        filterHoverClass: 'hover:bg-blue-600' 
      };
    case 'log':
      return { 
        icon: ChatBubbleBottomCenterTextIcon, 
        borderClassName: 'border-l-purple-500', 
        filterColorClass: 'border-purple-500 bg-purple-500 hover:bg-purple-600 text-white', 
        filterHoverClass: 'hover:bg-purple-600' 
      };
    default: // Includes 'all' for filter and default for rows
      return { 
        icon: Bars3Icon, 
        borderClassName: 'border-l-gray-500', // Use gray for default/unknown 
        filterColorClass: 'border-primary bg-primary hover:bg-primary/90 text-primary-foreground', 
        filterHoverClass: 'hover:bg-primary/90' 
      }; 
  }
};

// Get level row border class name helper
const getLevelRowBorderClassName = (level?: string): string => {
  return getLevelDetails(level).borderClassName;
};

// Get level icon helper
const getLevelIcon = (level?: string) => getLevelDetails(level).icon;

// --- Filter Type --- 
type LevelFilter = 'all' | 'error' | 'warn' | 'info' | 'log';

// --- END Re-inserting missing code ---

// --- START Mock Data --- 
const MOCK_PROJECT: Project = {
  id: 'mock-project-123',
  name: 'Local Mock Project',
};

const MOCK_ERRORS: ApiError[] = [
  {
    id: 'err-1', message: 'TypeError: Cannot read property \'name\' of undefined', 
    received_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    stack_trace: 'at getUser (userUtils.js:15)\nat processUser (main.js:42)\nat handleRequest (server.js:110)',
    metadata: { userId: 'abc', path: '/users/profile' }, level: 'error'
  },
  {
    id: 'err-2', message: 'Failed to fetch resource: Network error', 
    received_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    stack_trace: null,
    metadata: { url: '/api/data', attempt: 3 }, level: 'warn'
  },
  {
    id: 'err-3', message: 'User logged in successfully', 
    received_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    stack_trace: null,
    metadata: { userId: 'xyz', source: 'loginPage' }, level: 'info'
  },
   {
    id: 'err-4', message: 'Processing batch job #567', 
    received_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    stack_trace: null,
    metadata: { jobId: 567, items: 100 }, level: 'log'
  },
   {
    id: 'err-5', message: 'Another undefined property access', 
    received_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
    stack_trace: 'at getSettings (settings.js:22)\nat applyTheme (ui.js:95)',
    metadata: { component: 'ThemeSwitcher' }, level: 'error'
  },
];
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';
// --- END Mock Data ---

export default function ProjectErrorsPage() {
  // --- State & Hooks ---
  const params = useParams();
  const navigate = useNavigate();
  const supabase = getSupabaseClient();
  const { user: authUser, session, loading: loadingAuth, signOut } = useAuth();
  const location = useLocation();

  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  const { errors, totalCount, setErrors, addError, resolveErrorOptimistic, muteErrorOptimistic } = useErrorStore();

  const [selectedError, setSelectedError] = useState<ApiError | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [sortKey, setSortKey] = useState<'received_at' | 'message' | 'count'>('received_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');

  // Get date range state from Zustand store
  const { preset, customStartDate, customEndDate, setPreset, setCustomRange } = useDateRangeStore();

  // --- Effects (Authentication, Data Fetch, Realtime) --- 
  // Redirect if auth finished loading and there's no user (Bypass if mocking)
  useEffect(() => {
    if (USE_MOCK_DATA) return; // Don't redirect if using mock data
    
    if (!loadingAuth && !authUser) {
      console.log('ProjectErrorsPage: Auth loaded, no user found. Redirecting to login.');
      const redirectPath = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
    }
  }, [loadingAuth, authUser, navigate, location.pathname, location.search]); // Removed USE_MOCK_DATA from deps

  // Fetch project details and errors (or use mock data)
  useEffect(() => {
    if (USE_MOCK_DATA) {
        console.log('[Mock Data] Using mock data for project and errors.');
        setProject(MOCK_PROJECT);
        setErrors(MOCK_ERRORS, MOCK_ERRORS.length);
        setLoading(false);
        setFetchError(null);
        setCurrentPage(1); // Reset page for mock data
        return; // Skip real fetch
    }
      
    // Original fetch logic (only runs if USE_MOCK_DATA is false)
    if (loadingAuth || !session || !projectId) {
      setLoading(loadingAuth);
      if (!loadingAuth && !session) {
          setProject(null);
          setErrors([], 0);
          setFetchError('No active session found.');
          setLoading(false);
      }
      return; 
    }

    const fetchData = async () => {
      // Calculate start and end dates based on the preset
      let startDate: string | undefined;
      let endDate: string | undefined;

      const now = new Date();
      switch (preset) {
        case '1h':
          startDate = subHours(now, 1).toISOString();
          break;
        case '7d':
          startDate = subDays(now, 7).toISOString();
          break;
        case 'custom':
          startDate = customStartDate?.toISOString();
          endDate = customEndDate?.toISOString();
          break;
        case '24h': // Default included here
        default:
          startDate = subDays(now, 1).toISOString();
          break;
      }

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
            `${API_BASE_URL}/api/errors?projectId=${projectId}&page=${currentPage}&limit=${limit}` +
            `${startDate ? `&startDate=${encodeURIComponent(startDate)}` : ''}` +
            `${endDate ? `&endDate=${encodeURIComponent(endDate)}` : ''}`,
            { }, 
            session.access_token
        );
        setErrors(errorsResponse.data, errorsResponse.totalCount);

      } catch (err: any) {
        console.error('Error fetching project data or errors:', err);
        setFetchError(err.message || 'Failed to load data.');
        if (err.message?.includes('Unauthorized') || err.message?.includes('401')) { /* Handle 401 if needed */ }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [loadingAuth, session, projectId, currentPage, limit, API_BASE_URL, navigate, USE_MOCK_DATA, preset, customStartDate, customEndDate]); // Added USE_MOCK_DATA, preset, customStartDate, customEndDate to deps

  // Update temporary dates if global custom range changes
  useEffect(() => {
    setTempStartDate(customStartDate ?? new Date());
    setTempEndDate(customEndDate ?? new Date());
  }, [customStartDate, customEndDate]);

  // Realtime Subscription Setup (Bypass if mocking)
  useEffect(() => {
    if (USE_MOCK_DATA) {
        console.log('[Mock Data] Skipping realtime subscription setup.')
        return; // Don't subscribe if using mock data
    } 
      
    // Original realtime logic (only runs if USE_MOCK_DATA is false)
    if (!session || !projectId) return;
    console.log(`[Realtime] Setting up subscription for project: ${projectId}`);
    const handleNewError = (payload: any) => {
      if (payload.eventType !== 'INSERT' || !payload.new || typeof payload.new !== 'object') return;
      addError(payload.new as ApiError);
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
  }, [supabase, projectId, session, USE_MOCK_DATA]); // Added USE_MOCK_DATA to deps

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
          let valA: number | string, valB: number | string;
          if (sortKey === 'received_at') {
              valA = new Date(a.received_at).getTime();
              valB = new Date(b.received_at).getTime();
          } else if (sortKey === 'message') {
              valA = a.message.toLowerCase();
              valB = b.message.toLowerCase();
          } else if (sortKey === 'count') {
              // Handle potential undefined counts, treating them as 0 for sorting
              valA = a.count ?? 0;
              valB = b.count ?? 0;
          } else { return 0; }

          // Comparison logic (handles both numbers and strings)
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

  const handleSort = (key: 'received_at' | 'message' | 'count') => {
      if (key === sortKey) {
          setSortDirection(prevDirection => (prevDirection === 'asc' ? 'desc' : 'asc'));
      } else {
          setSortKey(key);
          // Default sort direction: desc for received_at and count, asc for message
          setSortDirection(key === 'message' ? 'asc' : 'desc'); 
      }
  };

  const renderSortIcon = (key: 'received_at' | 'message' | 'count') => {
      if (sortKey !== key) return null;
      const Icon = sortDirection === 'asc' ? ArrowUpIcon : ArrowDownIcon;
      return <Icon className="ml-1 h-4 w-4 text-gray-500" />; // Adjusted class
  };

  // --- Helper for Stack Preview ---
  const getStackPreview = (stackTrace: string | null | undefined): string => {
    if (!stackTrace) return 'N/A';
    // Normalize line endings before splitting
    const lines = stackTrace.replace(/\\n/g, '\n').split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) return 'N/A';
    // Attempt to get the last meaningful line (often starts with 'at ')
    const lastFrame = lines.reverse().find(line => line.startsWith('at '));
    // Reduce maxLength for preview
    return lastFrame ? truncateString(lastFrame, 60) : truncateString(lines[0], 60);
  };

  // --- Render Logic ---
  return (
    <div className="flex min-h-screen w-full flex-col bg-black text-gray-200">
       {/* HEADER (as defined before) */}
       <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-white/10 bg-black/70 backdrop-blur-md px-4 sm:px-6">
         <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-blue-400 hover:text-blue-300">
            <ArrowLeftIcon className="h-5 w-5" /> 
            <img 
                src="/lovable-uploads/errly-logo.png" 
                alt="Errly Logo" 
                className="h-8 w-8 rounded-full object-cover"
            /> 
            <span className="sr-only">Errly</span> 
         </Link>
         <div className="ml-auto flex items-center gap-4">
           {/* User Email and Logout restored to original position */} 
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

         {/* Filters Row */}
         <div className="flex flex-wrap items-center gap-4 justify-between"> 
           {/* Left Side: Search ONLY */}
           <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
              {/* Search Input */}
              <div className="relative flex-1 md:grow-0 min-w-[200px]"> 
                 <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                 <Input
                   type="search"
                   placeholder="Filter by message…"
                   value={searchTerm}
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm((e.target as HTMLInputElement).value)}
                   className="w-full rounded-full border border-white/10 bg-white/5 pl-10 pr-3 py-1.5 text-gray-200 placeholder-gray-500 backdrop-blur-md md:w-[240px] lg:w-[320px]"
                 />
              </div>
              {/* Date Range Dropdown - MOVED TO RIGHT SIDE */}
            </div>

           {/* Right Side: Level Filters + Date Range */}
           <div className="flex flex-wrap items-center gap-2"> 
             {/* Date Range Dropdown - ADDED HERE */} 
             <Menu as="div" className="relative inline-block text-left">
               <Menu.Button as={React.Fragment}>
                 <Button
                   variant="outline"
                   size="sm"
                   className="flex items-center gap-1 rounded-full border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-gray-300 backdrop-blur-md transition hover:bg-white/10"
                  >
                   <CalendarDaysIcon className="-ml-0.5 mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
                   <span>{preset === 'custom' ? 'Custom Range' : `Last ${preset}`}</span> {/* Wrap text in span */} 
                   <ChevronDownIcon className="ml-auto h-5 w-5 text-gray-400" aria-hidden="true" /> {/* Move icon right */} 
                  </Button>
               </Menu.Button>
               <Transition
                 as={React.Fragment}
                 enter="transition ease-out duration-100"
                 enterFrom="transform opacity-0 scale-95"
                 enterTo="transform opacity-100 scale-100"
                 leave="transition ease-in duration-75"
                 leaveFrom="transform opacity-100 scale-100"
                 leaveTo="transform opacity-0 scale-95"
               >
                 <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-gray-900/80 backdrop-blur-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-white/10"> {/* Changed origin-top-left to origin-top-right */}
                   <div className="py-1">
                     {(['1h', '24h', '7d'] as const).map((p) => (
                       <Menu.Item key={p}>
                         {({ active }) => (
                           <button
                             onClick={() => setPreset(p)}
                             className={`${ active ? 'bg-white/10 text-gray-100' : 'text-gray-300' } ${ preset === p ? 'font-bold' : '' } block w-full px-4 py-2 text-left text-sm`}
                           >
                             Last {p}
                           </button>
                         )}
                       </Menu.Item>
                     ))}
                     <Menu.Item>
                         {({ active }) => (
                           <button
                             onClick={() => setIsDatePickerOpen(true)}
                             className={`${ active ? 'bg-white/10 text-gray-100' : 'text-gray-300' } ${ preset === 'custom' ? 'font-bold' : '' } block w-full px-4 py-2 text-left text-sm`}
                           >
                             Custom Range...
                           </button>
                         )}
                       </Menu.Item>
                   </div>
                 </Menu.Items>
               </Transition>
             </Menu>
             
             {/* Level Filters */}
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

         {/* Errors Table (Refactored) */}
         {!loading && !fetchError && (
          <Card className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {/* Use table-auto for flexible columns, min-w-full still useful */}
                <table className="min-w-full table-auto divide-y divide-white/10 text-sm">
                  <colgroup><col className="w-[40px]" /><col className="w-[35%]" /><col className="w-[90px]" /><col className="w-[80px]" /><col className="w-[20%]" /><col className="w-[20%]" /><col className="w-[110px]" /><col className="w-[70px]" /></colgroup>
                  <thead className="bg-white/5">
                    <tr>
                      {/* Level Icon - No Header Text */}
                      <th scope="col" className="px-2 py-3 text-left font-semibold tracking-wider text-gray-400">
                        <span className="sr-only">Level</span>
                      </th>
                      {/* Message */}
                      <th scope="col" className="px-3 py-3 text-left font-semibold tracking-wider text-gray-400">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('message')} className="-ml-2 h-8 text-gray-400 hover:text-gray-200 p-1">
                          Message {renderSortIcon('message')}
                        </Button>
                      </th>
                      {/* Sparkline */}
                      <th scope="col" className="px-3 py-3 text-left font-semibold tracking-wider text-gray-400">
                        Trend (24h)
                      </th>
                      {/* Hits */}
                      <th scope="col" className="px-3 py-3 text-left font-semibold tracking-wider text-gray-400">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('count')} className="-ml-2 h-8 text-gray-400 hover:text-gray-200 p-1">
                          Hits {renderSortIcon('count')}
                        </Button>
                      </th>
                      {/* Stack Preview */}
                      <th scope="col" className="px-3 py-3 text-left font-semibold tracking-wider text-gray-400">
                        Stack Preview
                      </th>
                      {/* Metadata */}
                      <th scope="col" className="px-3 py-3 text-left font-semibold tracking-wider text-gray-400">
                        Metadata
                      </th>
                      {/* Received */}
                      <th scope="col" className="px-3 py-3 text-left font-semibold tracking-wider text-gray-400">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('received_at')} className="-ml-2 h-8 text-gray-400 hover:text-gray-200">
                          Received {renderSortIcon('received_at')}
                        </Button>
                      </th>
                      {/* Actions - No Header Text */}
                       <th scope="col" className="px-3 py-3 text-left font-semibold tracking-wider text-gray-400">
                         <span className="sr-only">Actions</span>
                       </th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {sortedAndFilteredErrors.length > 0 ? (
                      sortedAndFilteredErrors.map((error, index) => {
                        const LevelIcon = getLevelIcon(error.level);
                        const levelBorderClass = getLevelRowBorderClassName(error.level); // Get specific border class
 
                        // TODO: Replace with actual aggregated data from API/Store
                        const mockSparklineData = Array.from({ length: 24 }, () => Math.random() * 10 + 1);

                        return (
                          <tr
                            key={error.id}
                            onClick={() => handleRowClick(error)} // Restore row click to open modal
                            // Apply specific border class and add generic hover class
                            className={`group relative cursor-pointer border-l-4 ${levelBorderClass} hover:bg-white/5 border-b border-white/5 transition-all duration-150 ${error.state === 'resolved' ? 'opacity-40 pointer-events-none' : ''}`}
                          >
                            {/* Level Icon */}
                            <td className="px-2 py-3 align-top">
                              <LevelIcon className="mt-0.5 h-4 w-4 shrink-0" title={error.level} />
                            </td>
                            {/* Message (flex=3, truncate, tooltip) */}
                            <td className="px-3 py-3 align-top text-gray-100">
                              <div className="truncate" title={error.message}>
                                {error.message}
                              </div>
                            </td>
                            {/* Sparkline (Placeholder) */}
                            <td className="px-3 py-3 align-middle"> {/* Use align-middle */} 
                                {/* <Sparkline data={mockSparklineData} height={24} width={90} /> */}
                                <div>Sparkline Commented Out</div>
                            </td>
                            {/* Hits (Display aggregated count) */}
                            <td className="px-3 py-3 text-center align-top font-medium text-gray-200">
                              {error.count ?? '-'}
                            </td>
                            {/* Stack Preview (flex=2, last frame, tooltip) */}
                            <td className="px-3 py-3 align-top font-mono text-gray-400">
                               <div className="truncate" title={error.stack_trace ?? undefined}>
                                {getStackPreview(error.stack_trace)}
                               </div>
                            </td>
                            {/* Metadata (flex=2, truncate, tooltip) */}
                            <td className="px-3 py-3 align-top font-mono text-gray-400">
                              <div className="truncate" title={typeof error.metadata === 'string' ? error.metadata : JSON.stringify(error.metadata)}> 
                                {formatMetadata(error.metadata, 50)} {/* Reduced maxLength */} 
                              </div>
                            </td>
                            {/* Received (120px, relative, tooltip) */}
                            <td className="whitespace-nowrap px-3 py-3 align-top text-gray-400" title={new Date(error.received_at).toISOString()}>
                              {formatDistanceToNow(new Date(error.received_at), { addSuffix: true })}
                            </td>
                             {/* Quick Actions (Appears on hover) */}
                            <td className="px-3 py-3 align-top">
                               <div className="absolute right-2 top-1/2 flex -translate-y-1/2 transform items-center space-x-1 rounded-full bg-black/50 p-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                                 <button
                                    onClick={(e) => { e.stopPropagation(); console.log('Resolve clicked:', error.id); }} // Placeholder
                                    title="Mark Resolved"
                                    className="rounded-full p-1 text-gray-300 hover:bg-white/20 hover:text-white"
                                 >
                                     <CheckCircleIcon className="h-4 w-4" />
                                 </button>
                                 <button
                                     onClick={(e) => { e.stopPropagation(); console.log('Mute clicked:', error.id); }} // Placeholder
                                     title="Mute Error"
                                     className="rounded-full p-1 text-gray-300 hover:bg-white/20 hover:text-white"
                                 >
                                     <BellSlashIcon className="h-4 w-4" />
                                 </button>
                               </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        {/* Updated colSpan to match new column count */}
                        <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
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

       {/* Custom Date Range Picker Modal */}
       {isDatePickerOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
           <div className="rounded-lg bg-gray-800 p-6 shadow-xl border border-white/10 w-full max-w-md text-gray-200">
             <h3 className="text-lg font-medium mb-4">Select Custom Date Range</h3>
             <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                   <div className="w-full rounded-md border border-dashed border-white/20 bg-white/5 px-3 py-1.5 text-gray-400 h-[38px] flex items-center">DatePicker commented out</div>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                   <div className="w-full rounded-md border border-dashed border-white/20 bg-white/5 px-3 py-1.5 text-gray-400 h-[38px] flex items-center">DatePicker commented out</div>
                 </div>
             </div>
             <div className="mt-6 flex justify-end gap-3">
               <Button variant="outline" size="sm" onClick={() => setIsDatePickerOpen(false)} className="bg-gray-600 hover:bg-gray-500 border-gray-500 text-gray-200">
                 Cancel
               </Button>
               <Button variant="default" size="sm" onClick={() => {
                   if (tempStartDate && tempEndDate) {
                       setCustomRange(tempStartDate, tempEndDate);
                   }
                   setIsDatePickerOpen(false);
                 }}
                 className="bg-blue-600 hover:bg-blue-700 text-white"
               >
                 Apply Range
               </Button>
             </div>
           </div>
         </div>
       )}

       {/* Error Detail Modal */}
       <ErrorDetailModal 
         isOpen={isModalOpen} 
         onClose={handleCloseModal} 
         error={selectedError}
         onResolve={resolveErrorOptimistic}
         onMute={muteErrorOptimistic}
       />
    </div>
  );
}
