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
  ChartBarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { RealtimeChannel } from '@supabase/supabase-js';
import { formatDistanceToNow, subHours, subDays, startOfMinute, endOfMinute, startOfHour, endOfHour, startOfDay, endOfDay, format, addHours } from 'date-fns';
import ErrorDetailDrawer from '../../../ErrorModal/ErrorDetailDrawer.tsx';
import { LogOut } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { useDateRangeStore, DateRangePreset } from '../../../store/dateRangeStore.ts';
import { useErrorStore, ApiError } from '../../../store/errorStore.ts';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Sparkline from '../../../components/ui/Sparkline.tsx';
import LogVolumeChart from '../../../components/ui/LogVolumeChart.tsx';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

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

// Define the shape for the log volume data
interface LogVolumeDataPoint {
    timestamp: string;
    error: number;
    warn: number;
    info: number;
    log: number;
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
        borderClassName: 'border-l-yellow-500', // Kept yellow for consistency, but orange in chart
        filterColorClass: 'border-yellow-500 bg-yellow-500 hover:bg-yellow-600 text-white', // Consider orange-500?
        filterHoverClass: 'hover:bg-yellow-600' // Consider hover:bg-orange-600?
      };
    case 'info': // Changed to Green
      return { 
        icon: InformationCircleIcon, 
        borderClassName: 'border-l-green-500', 
        filterColorClass: 'border-green-500 bg-green-500 hover:bg-green-600 text-white', 
        filterHoverClass: 'hover:bg-green-600' 
      };
    case 'log': // Changed to Blue
      return { 
        icon: ChatBubbleBottomCenterTextIcon, 
        borderClassName: 'border-l-blue-500', 
        filterColorClass: 'border-blue-500 bg-blue-500 hover:bg-blue-600 text-white', 
        filterHoverClass: 'hover:bg-blue-600' 
      };
    default: // Includes 'all' for filter and default for rows
      return { 
        icon: Bars3Icon, 
        borderClassName: 'border-l-gray-500', // Use gray for default/unknown 
        filterColorClass: 'border-primary bg-primary hover:bg-primary/90 text-primary-foreground', // 'all' filter uses primary theme color
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

// --- START Mock Data --- 
const MOCK_PROJECT: Project = {
  id: 'mock-project-123',
  name: 'Local Mock Project',
};

// --- Generate Mock Data (Revised Strategy) ---
const mockDataStartDate = subDays(new Date(), 30);
const totalHours = 30 * 24;
const mockDataPoints: { timestamp: string; errorCount: number; warnCount: number; infoCount: number; logCount: number }[] = [];
const generatedMockErrors: ApiError[] = [];

// 1. Generate hourly volume data points first
for (let i = 0; i < totalHours; i++) {
  const timestampDate = addHours(mockDataStartDate, i);
  const timestamp = timestampDate.toISOString();
  const errorCount = Math.random() < 0.1 ? Math.floor(Math.random() * 3) + 1 : 0; // ~10% chance of errors
  const warnCount = Math.random() < 0.2 ? Math.floor(Math.random() * 5) + 1 : 0; // ~20% chance of warnings
  const infoCount = Math.floor(Math.random() * 20);
  const logCount = Math.floor(Math.random() * 40);

  mockDataPoints.push({
    timestamp,
    error: errorCount,
    warn: warnCount,
    info: infoCount,
    log: logCount
  });

  // 2. Generate corresponding mock errors based on the counts for this hour
  const createMockError = (level: 'error' | 'warn' | 'info' | 'log', index: number) => {
    // Select a random template message based on level
    let message = `Generic ${level} message ${index}`;
    let metadata: any = { generatedHour: timestampDate.getHours() };
    let stackTrace: string | null = null;
    switch (level) {
        case 'error': 
            message = ['TypeError: x is undefined', 'Database timeout', 'NullReferenceException'][Math.floor(Math.random() * 3)];
            metadata = { userId: `usr_${index}`, path: '/mock/path' };
            stackTrace = `at mockFunction (mockFile.js:${Math.floor(10 + Math.random() * 90)})\nat main (server.js:42)`;
            break;
        case 'warn':
            message = ['Deprecated API used', 'Rate limit approaching', 'High memory usage'][Math.floor(Math.random() * 3)];
            metadata = { api: 'mockApi', usage: Math.random() };
            break;
        case 'info':
            message = ['User logged in', 'Configuration loaded', 'Cache cleared'][Math.floor(Math.random() * 3)];
            metadata = { user: `user_${index}`, action: 'login' };
            break;
        case 'log':
             message = ['Processing job', 'Request received', 'Data synced'][Math.floor(Math.random() * 3)];
            metadata = { jobId: `job_${index}` };
            break;
    }
    return {
        id: `mock-${level}-${i}-${index}`,
        message: `${message} (${index + 1})`,
        received_at: new Date(timestampDate.getTime() + Math.random() * 3600000).toISOString(), // Add random offset within the hour
        level,
        metadata,
        stack_trace: stackTrace,
        // Generate simple fake trend data for visual testing
        count: Math.floor(1 + Math.random() * 20), // Give it a random count > 0
        trend: Array.from({ length: 24 }, (_, k) => ({ 
            time: `T${k}`, // Mock time bucket label
            count: Math.floor(Math.random() * (level === 'error' || level === 'warn' ? 5 : 3)) // Generate random counts
        })) 
    };
  };

  for (let j = 0; j < errorCount; j++) generatedMockErrors.push(createMockError('error', j));
  for (let j = 0; j < warnCount; j++) generatedMockErrors.push(createMockError('warn', j));
  for (let j = 0; j < infoCount; j++) generatedMockErrors.push(createMockError('info', j));
  for (let j = 0; j < logCount; j++) generatedMockErrors.push(createMockError('log', j));

}

// Assign the generated data to the constants used by the component
const MOCK_LOG_VOLUME_DATA: ChartDataPoint[] = mockDataPoints; 
const MOCK_ERRORS: ApiError[] = generatedMockErrors.sort((a, b) => 
    new Date(b.received_at).getTime() - new Date(a.received_at).getTime()
); // Sort errors newest first for initial display

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

  // Add state for log volume data
  const [logVolumeData, setLogVolumeData] = useState<LogVolumeDataPoint[]>([]);
  const [loadingLogVolume, setLoadingLogVolume] = useState(true);
  const [logVolumeError, setLogVolumeError] = useState<string | null>(null);

  // Get date range state from Zustand store
  const { preset, customStartDate, customEndDate, setPreset, setCustomRange } = useDateRangeStore();

  // Add state for chart visibility
  const [isChartVisible, setIsChartVisible] = useState(true);

  // Add state for chart click filtering
  const [selectedTimestamp, setSelectedTimestamp] = useState<string | null>(null);
  const [chartBucketInterval, setChartBucketInterval] = useState<string | null>(null);

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

  // Fetch project details, errors, AND log volume (or use mock data)
  useEffect(() => {
    // --- Calculate Date Range --- 
    // Moved date calculation outside the if/else block
    let startDate: Date | undefined;
    let endDate: Date | undefined = new Date(); // Default end date is now
    const now = new Date();

    switch (preset) {
      case '1h':
        startDate = subHours(now, 1);
        break;
      case '7d':
        startDate = subDays(now, 7);
        break;
      case 'custom':
        startDate = customStartDate ?? undefined; 
        endDate = customEndDate ?? new Date(); 
        break;
      case '24h':
      default:
        startDate = subDays(now, 1);
        break;
    }

    // Exit early if the date range is invalid
    if (!startDate) {
        console.warn("Start date is undefined, cannot fetch or filter data.");
        setLoading(false);
        setLoadingLogVolume(false);
        setFetchError("Invalid date range specified.");
        setLogVolumeError("Invalid date range specified.");
        setErrors([], 0); // Clear data if range is invalid
        setLogVolumeData([]);
        return; 
    }
    // --- End Date Calculation ---

    // --- Handle Mock Data --- 
    if (USE_MOCK_DATA) {
        console.log('[Mock Data] Applying filters to mock data for range:', startDate, endDate);
        const startMs = startDate.getTime();
        const endMs = endDate.getTime(); // Use exclusive end for filtering now

        // Filter mock errors
        const filteredMockErrors = MOCK_ERRORS.filter(error => {
            const errorTime = new Date(error.received_at).getTime();
            return errorTime >= startMs && errorTime < endMs; // Use < endMs
        });

        // Filter mock volume data
        const filteredMockVolume = MOCK_LOG_VOLUME_DATA.filter(point => {
            const pointTime = new Date(point.timestamp).getTime();
            return pointTime >= startMs && pointTime < endMs; // Use < endMs
        });
        
        console.log(`[Mock Data] Filtered Errors: ${filteredMockErrors.length}, Filtered Volume: ${filteredMockVolume.length}`);

        // Set state with filtered mock data
        setProject(MOCK_PROJECT);
        setErrors(filteredMockErrors, filteredMockErrors.length);
        setLogVolumeData(filteredMockVolume);
        setChartBucketInterval('hour'); // Keep mock interval as hour for simplicity
        setLoading(false);
        setLoadingLogVolume(false);
        setFetchError(null);
        setLogVolumeError(null);
        setCurrentPage(1); // Reset page
        setSelectedTimestamp(null); // Reset time selection
    }
    // --- Handle Real API Fetching --- 
    else {
    // Original fetch logic (only runs if USE_MOCK_DATA is false)
    if (loadingAuth || !session || !projectId) {
      setLoading(loadingAuth);
          setLoadingLogVolume(loadingAuth);
      if (!loadingAuth && !session) {
          setProject(null);
          setErrors([], 0);
              setLogVolumeData([]);
          setFetchError('No active session found.');
              setLogVolumeError('No active session found.');
          setLoading(false);
              setLoadingLogVolume(false);
              setChartBucketInterval(null);
      }
      return; 
    }

    const fetchData = async () => {
          // Convert dates to ISO strings for API calls
          const startDateISO = startDate!.toISOString(); // Use non-null assertion as we checked above
          const endDateISO = endDate!.toISOString();

      setLoading(true);
          setLoadingLogVolume(true);
      setFetchError(null);
          setLogVolumeError(null);

      try {
              console.log(`Fetching data for range: ${startDateISO} to ${endDateISO}`);
              const [projectDetails, errorsResponse, volumeApiResponse] = await Promise.all([
                  // Fetch Project Details
                  fetchWithErrorHandling(
            `${API_BASE_URL}/api/projects/${projectId}`, 
            { }, 
            session.access_token
                  ),
                  // Fetch Errors
                  fetchWithErrorHandling(
            `${API_BASE_URL}/api/errors?projectId=${projectId}&page=${currentPage}&limit=${limit}` +
                      `&startDate=${encodeURIComponent(startDateISO)}` +
                      `&endDate=${encodeURIComponent(endDateISO)}`, 
            { }, 
            session.access_token
                  ),
                  // Fetch Log Volume
                  fetchWithErrorHandling(
                      `${API_BASE_URL}/api/logs/volume?projectId=${projectId}` +
                      `&startDate=${encodeURIComponent(startDateISO)}` +
                      `&endDate=${encodeURIComponent(endDateISO)}`, 
                      { }, 
                      session.access_token
                  )
              ]);

              // Process results
              setProject(projectDetails);
              setErrors(errorsResponse.data, errorsResponse.totalCount);
              if (volumeApiResponse && typeof volumeApiResponse === 'object' && Array.isArray(volumeApiResponse.data) && typeof volumeApiResponse.interval === 'string') {
                  setLogVolumeData(volumeApiResponse.data as LogVolumeDataPoint[]);
                  setChartBucketInterval(volumeApiResponse.interval);
                  console.log(`Fetched log volume data points: ${volumeApiResponse.data.length}, Interval: ${volumeApiResponse.interval}`);
              } else {
                  console.warn("Log volume API response format unexpected:", volumeApiResponse);
                  setLogVolumeData([]);
                  setChartBucketInterval(null);
                  setLogVolumeError("Received unexpected data format for chart.");
              }
              setSelectedTimestamp(null);
      } catch (err: any) {
              console.error('Error fetching data:', err);
              const errorMsg = err.message || 'Failed to load data.';
              setFetchError(errorMsg);
              setLogVolumeError(errorMsg);
              setChartBucketInterval(null);
              setSelectedTimestamp(null);
              if (err.message?.includes('Unauthorized') || err.message?.includes('401')) { /* Handle 401 */ }
      } finally {
        setLoading(false);
              setLoadingLogVolume(false);
      }
    };

    fetchData();
    }
  }, [
      // Keep all dependencies that affect date calculation or trigger fetches
      loadingAuth, 
      session, 
      projectId, 
      currentPage, 
      limit, 
      API_BASE_URL, 
      navigate, 
      USE_MOCK_DATA, 
      preset, 
      customStartDate, 
      customEndDate, 
      setErrors // Keep dependencies used inside the hook
  ]);

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
    // Apply Level Filter FIRST (before time bucket potentially reduces the set)
    if (levelFilter !== 'all') {
        tempErrors = tempErrors.filter(error => error.level?.toLowerCase() === levelFilter);
    }
    // Apply Search Filter SECOND
    if (debouncedSearchTerm) {
        const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase();
        tempErrors = tempErrors.filter(error => 
            error.message.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }
    return tempErrors;
  }, [errors, debouncedSearchTerm, levelFilter]); 

  const sortedAndFilteredErrors = useMemo(() => {
      console.log('[useMemo] Recalculating sortedAndFilteredErrors...', { selectedTimestamp, chartBucketInterval, filteredErrorsLength: filteredErrors.length });
      let items = filteredErrors; // Start with level/search filtered errors

      // --- Apply Time Bucket Filter (if timestamp is selected) --- 
      if (selectedTimestamp && chartBucketInterval) {
          console.log(`[useMemo] Applying time filter for ${selectedTimestamp} (${chartBucketInterval})`);
          try {
              const clickedDate = new Date(selectedTimestamp);
              let bucketStart: Date;
              let bucketEnd: Date;

              // Calculate bucket start/end based on interval
              if (chartBucketInterval === 'minute') {
                  bucketStart = startOfMinute(clickedDate);
                  bucketEnd = endOfMinute(clickedDate);
              } else if (chartBucketInterval === 'hour') {
                  bucketStart = startOfHour(clickedDate);
                  bucketEnd = endOfHour(clickedDate);
              } else if (chartBucketInterval === 'day') {
                  bucketStart = startOfDay(clickedDate);
                  bucketEnd = endOfDay(clickedDate);
              } else {
                  console.warn("[useMemo] Unknown chart bucket interval:", chartBucketInterval);
                  bucketStart = clickedDate; 
                  bucketEnd = clickedDate;
              }

              const bucketStartMs = bucketStart.getTime();
              const bucketEndMs = bucketEnd.getTime() + 1; 

              console.log(`[useMemo] Filtering errors for bucket: ${bucketStart.toISOString()} (${bucketStartMs}) to ${new Date(bucketEndMs).toISOString()} (${bucketEndMs})`);

              const initialLength = items.length;
              items = items.filter(error => {
                  const errorTime = new Date(error.received_at).getTime();
                  const isInBucket = errorTime >= bucketStartMs && errorTime < bucketEndMs;
                  // Add detailed log for the first few items to check comparison
                  // if (items.indexOf(error) < 5) { 
                  //    console.log(`  Checking error ${error.id} (${error.received_at}): time=${errorTime}, inBucket=${isInBucket}`);
                  // }
                  return isInBucket;
              });
              console.log(`[useMemo] Items after time filter: ${items.length} (from ${initialLength})`);

          } catch (e) {
              console.error("[useMemo] Error filtering by selected timestamp:", e);
          }
      }
      // --- End Time Bucket Filter --- 

      // --- Apply Sorting --- 
      console.log(`[useMemo] Sorting ${items.length} items by ${sortKey} ${sortDirection}...`);
      // Make a copy before sorting if the original array reference is needed elsewhere, but here it should be fine.
      // let sortedItems = [...items]; 
      items.sort((a, b) => {
          let valA: number | string, valB: number | string;
          if (sortKey === 'received_at') {
              valA = new Date(a.received_at).getTime();
              valB = new Date(b.received_at).getTime();
          } else if (sortKey === 'message') {
              valA = a.message.toLowerCase();
              valB = b.message.toLowerCase();
          } else if (sortKey === 'count') {
              valA = a.count ?? 0;
              valB = b.count ?? 0;
          } else { return 0; }

          if (valA < valB) { return sortDirection === 'asc' ? -1 : 1; }
          if (valA > valB) { return sortDirection === 'asc' ? 1 : -1; }
          return 0;
      });
      console.log('[useMemo] Finished recalculating.');
      return items;
  }, [filteredErrors, sortKey, sortDirection, selectedTimestamp, chartBucketInterval]); // Depend on pre-filtered errors

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

  // Handler to toggle chart visibility
  const toggleChartVisibility = () => {
    setIsChartVisible(prev => !prev);
  };

  // Handler for clicking a bar on the chart
  const handleBarClick = (timestamp: string | null) => {
    console.log('[ProjectErrorsPage] handleBarClick called with timestamp:', timestamp);
    // If clicking the already selected timestamp, clear it
    if (selectedTimestamp === timestamp) {
        console.log('[ProjectErrorsPage] Clearing selected timestamp.');
        setSelectedTimestamp(null); 
    } else {
        console.log('[ProjectErrorsPage] Setting selected timestamp:', timestamp);
        setSelectedTimestamp(timestamp);
    }
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
           {/* Left Side: Search + Chart Toggle */}
           <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
              {/* Search Input */}
              <div className="relative md:grow-0 min-w-[200px]"> 
                 <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                 <Input
                   type="search"
                   placeholder="Filter by message…"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
                   className="w-full rounded-full border border-white/10 bg-white/5 pl-10 pr-3 py-1.5 text-gray-200 placeholder-gray-500 backdrop-blur-md md:w-[240px] lg:w-[320px]"
                 />
              </div>
              {/* --- Re-added Chart Toggle Button --- */} 
              <Button
                 variant="outline"
                 size="sm"
                 onClick={toggleChartVisibility}
                 title={isChartVisible ? "Hide Volume Chart" : "Show Volume Chart"}
                 className={`flex items-center gap-1 rounded-full border-white/10 px-3 py-1 text-xs uppercase tracking-wide backdrop-blur-md transition hover:bg-white/10 ${isChartVisible ? 'bg-white/10 text-gray-100' : 'bg-white/5 text-gray-300'}`}
              >
                 <EyeIcon className="h-4 w-4" /> {/* Use EyeIcon */} 
                 <span>Chart</span>
              </Button>
              {/* --- End Chart Toggle Button --- */} 
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

         {/* --- Log Volume Chart (Conditionally Rendered) --- */} 
         {isChartVisible && (
             <div className="mt-0 mb-0"> 
                <LogVolumeChart 
                   data={logVolumeData}
                   isLoading={loadingLogVolume}
                   error={logVolumeError}
                   onBarClick={handleBarClick} // Pass the handler
                />
             </div>
         )}
         {/* --- End Log Volume Chart --- */} 

          {/* --- Filtering Indicator --- */} 
         {selectedTimestamp && chartBucketInterval && (
             <div className="my-2 flex items-center justify-between rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-200 backdrop-blur-sm">
                 <span className="font-medium">
                     Showing events for time bucket: {format(new Date(selectedTimestamp), 'MMM d, HH:mm')} ({chartBucketInterval})
                 </span>
                 <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTimestamp(null)} // Clear selection
                    className="-mr-1 h-6 px-2 text-blue-200 hover:bg-blue-500/20 hover:text-blue-100"
                    title="Clear time selection"
                 >
                    <XMarkIcon className="h-4 w-4" />
                 </Button>
             </div>
         )}
         {/* --- End Filtering Indicator --- */} 

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
                  {/* Adjusted colgroup for new column order and widths */}
                  <colgroup>
                    <col className="w-[40px]" /> {/* Level Icon */} 
                    <col className="w-[130px]" /> {/* Received */} 
                    <col className="w-[35%]" /> {/* Message */} 
                    <col className="w-[90px]" /> {/* Sparkline */} 
                    <col className="w-[90px]" /> {/* Hits (Increased) */} 
                    <col className="w-[18%]" /> {/* Metadata (Decreased) */} 
                    <col className="w-[70px]" /> {/* Actions */} 
                  </colgroup>
                  <thead className="bg-white/5">
                    <tr>
                      {/* Level Icon - No Header Text */}
                      <th scope="col" className="px-2 py-3 text-left font-semibold tracking-wider text-gray-400">
                        <span className="sr-only">Level</span>
                      </th>
                      {/* Received (Moved Here) */}
                      <th scope="col" className="px-3 py-3 text-left font-semibold tracking-wider text-gray-400">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('received_at')} className="-ml-2 h-8 rounded-md px-2 text-gray-400 hover:bg-gray-500/20">
                          Received {renderSortIcon('received_at')}
                        </Button>
                      </th>
                      {/* Message */}
                      <th scope="col" className="px-3 py-3 text-left font-semibold tracking-wider text-gray-400">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('message')} className="-ml-2 h-8 rounded-md px-2 text-gray-400 hover:bg-gray-500/20">
                          Message {renderSortIcon('message')}
                        </Button>
                      </th>
                      {/* Sparkline - Balanced padding */}
                      <th scope="col" className="px-3 py-3 text-left font-semibold tracking-wider text-gray-400">
                        Trend
                      </th>
                      {/* Hits - Balanced padding, centered */}
                      <th scope="col" className="px-3 py-3 text-center font-semibold tracking-wider text-gray-400">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('count')} className="h-8 rounded-md px-2 text-gray-400 hover:bg-gray-500/20">
                          Hits {renderSortIcon('count')}
                        </Button>
                      </th>
                      {/* Metadata - Balanced padding */}
                      <th scope="col" className="px-3 py-3 text-left font-semibold tracking-wider text-gray-400">
                        Metadata
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
                        const levelBorderClass = getLevelRowBorderClassName(error.level);
                        const hasMeaningfulTrend = error.trend && error.trend.filter(t => t.count > 0).length > 1;

                        // Format timestamp as requested
                        let formattedReceivedAt = "Invalid Date";
                        try {
                            formattedReceivedAt = format(new Date(error.received_at), 'd MMM HH:mm:ss');
                        } catch (e) { 
                            console.error("Failed to format date:", error.received_at, e);
                        }

                        return (
                          <tr
                            key={error.id}
                            onClick={() => handleRowClick(error)}
                            className={`group relative cursor-pointer border-l-4 ${levelBorderClass} hover:bg-white/5 border-b border-white/5 transition-all duration-150 ${error.state === 'resolved' ? 'opacity-40 pointer-events-none' : ''}`}
                          >
                            {/* Level Icon */}
                            <td className="px-2 py-3 align-top">
                              <LevelIcon className="mt-0.5 h-4 w-4 shrink-0" title={error.level} />
                            </td>
                            {/* Received (Moved Here, Formatted) */}
                            <td className="whitespace-nowrap px-3 py-3 align-top text-gray-400 font-mono text-xs" title={new Date(error.received_at).toISOString()}>
                              {formattedReceivedAt}
                            </td>
                            {/* Message (Truncate) */}
                            <td className="px-3 py-3 align-top text-gray-100">
                              <div className="truncate" title={error.message}>
                                {error.message}
                              </div>
                            </td>
                            {/* Sparkline - Balanced padding */}
                            <td className="px-3 py-3 align-middle">
                              {hasMeaningfulTrend ? (
                                <Sparkline 
                                  data={error.trend?.map(t => t.count) ?? []} 
                                  height={24} 
                                  width={90} 
                                />
                              ) : (
                                <div className="h-[24px] w-[90px]"></div>
                              )}
                            </td>
                            {/* Hits - Balanced padding, centered */}
                            <td className="px-3 py-3 text-center align-top font-medium text-gray-200">
                              {error.count ?? '-'}
                            </td>
                            {/* Metadata - Balanced padding */}
                            <td className="px-3 py-3 align-top font-mono text-gray-400">
                              <div className="truncate" title={typeof error.metadata === 'string' ? error.metadata : JSON.stringify(error.metadata)}> 
                                {formatMetadata(error.metadata, 50)}
                              </div>
                            </td>
                             {/* Quick Actions */}
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
                        {/* Updated colSpan to match new column count (still 7) */}
                        <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                          {searchTerm || levelFilter !== 'all' || preset !== '24h' 
                            ? 'No errors match your current filters or time range.' 
                            : 'No errors found for this project in the last 24 hours.'}
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
           {/* Use bg-black for the modal background */}
           <div className="rounded-lg bg-black p-6 shadow-xl border border-gray-700/50 w-full max-w-md text-gray-200"> 
             <h3 className="text-lg font-medium mb-4">Select Custom Date Range</h3>
             <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                   {/* Re-enabled DatePicker with dark theme styling */}
                   <DatePicker
                     selected={tempStartDate}
                     onChange={(date: Date | null) => setTempStartDate(date)}
                     selectsStart
                     startDate={tempStartDate}
                     endDate={tempEndDate}
                     dateFormat="MMM d, yyyy"
                     className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                     popperPlacement="bottom-start"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                   {/* Re-enabled DatePicker with dark theme styling */}
                   <DatePicker
                     selected={tempEndDate}
                     onChange={(date: Date | null) => setTempEndDate(date)}
                     selectsEnd
                     startDate={tempStartDate}
                     endDate={tempEndDate}
                     minDate={tempStartDate}
                     dateFormat="MMM d, yyyy"
                     className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-gray-200 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                     popperPlacement="bottom-start"
                   />
                 </div>
             </div>
             <div className="mt-6 flex justify-end gap-3">
               {/* Updated Cancel button style (Matches Hero Secondary) */}
               <Button 
                 variant="outline" // Keep variant for structure, override styles below
                 size="sm" 
                 onClick={() => setIsDatePickerOpen(false)} 
                 className="rounded-full bg-white/10 hover:bg-white/25 px-5 py-1.5 transition-colors duration-150 backdrop-blur border-none text-sm"
               >
                 <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-t from-gray-300/70 to-white">
                 Cancel
                 </span>
               </Button>
               {/* Updated Apply Range button style (Matches Hero Primary) */}
               <Button 
                 variant="default" // Keep variant for structure, override styles below
                 size="sm" 
                 onClick={() => {
                   if (tempStartDate && tempEndDate) {
                       setCustomRange(tempStartDate, tempEndDate);
                   }
                   setIsDatePickerOpen(false);
                 }}
                 className="rounded-full ring-2 ring-white/15 bg-gradient-to-t from-gray-300/70 to-white hover:bg-white text-black px-5 py-1.5 transition-colors duration-150 font-semibold text-sm"
               >
                 Apply Range
               </Button>
             </div>
           </div>
         </div>
       )}

       {/* Error Detail Drawer (Replaced Modal) */}
       <ErrorDetailDrawer 
         isOpen={isModalOpen} // Keep state variable name for simplicity, or rename if preferred
         onClose={handleCloseModal} 
         error={selectedError}
         onResolve={resolveErrorOptimistic}
         onMute={muteErrorOptimistic}
       />
    </div>
  );
}
