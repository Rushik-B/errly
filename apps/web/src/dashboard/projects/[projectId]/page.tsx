// Enhanced UI: glassmorphism, dark theme, level icons in rows – functionality untouched.
// File: ProjectErrorsPage.tsx

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
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { RealtimeChannel } from '@supabase/supabase-js';
import { formatDistanceToNow } from 'date-fns';
import ErrorDetailModal from '../../../ErrorModal/ErrorDetailModal.tsx';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

// ... (interfaces and helper functions remain unchanged) //
// --- interfaces, fetchWithErrorHandling, truncateString, formatMetadata, useDebounce, getLevelDetails, getLevelRowClassName, etc.
// Paste the untouched helper code here ---------------------------------------

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

// fetchWithErrorHandling, truncateString, formatMetadata, useDebounce, getLevelDetails, getLevelRowClassName – copy unchanged from original

// --------------------------------------------------------------------------------

const getLevelIcon = (level?: string) => getLevelDetails(level).icon;

type LevelFilter = 'all' | 'error' | 'warn' | 'info' | 'log';

export default function ProjectErrorsPage() {
  // --- state & hooks (unchanged) -------------------------------------------------
  const params = useParams();
  const navigate = useNavigate();
  const supabase = getSupabaseClient();
  const { user: authUser, session, loading: loadingAuth } = useAuth();
  const location = useLocation();

  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [errors, setErrors] = useState<ApiError[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedError, setSelectedError] = useState<ApiError | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [sortKey, setSortKey] = useState<'received_at' | 'message'>('received_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');

  // --- effects (authentication, data fetch, realtime) kept exactly as before ----
  // (copy code unchanged) --------------------------------------------------------

  // filteredErrors, sortedAndFilteredErrors, pagination helpers – unchanged

  // --------------------------------------------------------------------------------

  return (
    <div className="flex min-h-screen w-full flex-col bg-black text-gray-200">
      {/* HEADER */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-white/10 bg-black/70 backdrop-blur-md px-4 sm:px-6">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-blue-400 hover:text-blue-300">
          <ArrowLeftIcon className="h-5 w-5" />
          <img src="/lovable-uploads/carbon.svg" alt="Errly Logo" className="h-6 w-6" />
          <span className="sr-only">Errly</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          {authUser && <span className="hidden text-sm text-gray-400 md:inline-block">{authUser.email}</span>}
          <LogoutButton />
        </div>
      </header>

      {/* MAIN CONTENT */}
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
              onChange={(e) => setSearchTerm(e.target.value)}
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

        {/* Loading & Error States */}
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

        {/* Errors Table */}
        {!loading && !fetchError && (
          <Card className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                  <thead className="bg-white/5">
                    <tr>
                      <th scope="col" className="w-[32%] px-4 py-3 text-left font-semibold tracking-wider text-gray-400">
                        <Button variant="ghost" size="sm" onClick={() => handleSort('message')} className="-ml-2 h-8">
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
                        <Button variant="ghost" size="sm" onClick={() => handleSort('received_at')} className="-ml-2 h-8">
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

        {/* Pagination */}
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
