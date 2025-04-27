'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    ClipboardDocumentIcon,
    CheckCircleIcon,
    BellSlashIcon,
    ArrowTopRightOnSquareIcon, // For external links like GitHub
    LinkIcon // For Copy Link/cURL
} from '@heroicons/react/24/outline';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// Correct import for the style
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast, { Toaster } from 'react-hot-toast';
import styles from './ErrorDetailDrawer.module.css';
import { useAuth } from '../context/AuthContext.tsx';
// Assuming this is the correct relative path based on file structure
import { Button } from '../../components/ui/button';

// Import the mock data flag
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

// --- Updated ApiError Interface --- (Matches drawer spec)
interface ApiError {
  id: string;
  message: string;
  received_at: string;
  stack_trace: string | null;
  metadata: any | null;
  level?: string;
  count?: number;
  state?: 'resolved' | 'active';
  trend?: { time: string; count: number }[];
  first_seen?: string; // Optional field for 'First Seen'
  request?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    statusCode?: number; // Optional field for status code
  };
  environment?: string; // Optional field for environment tag
  release?: string; // Optional field for release/commit SHA
  user?: {
    id?: string;
    ip_address?: string;
    // Potentially add browser/os if nested under user in API
  };
  // Optional field for source mapping
  source?: {
    filename?: string;
    lineno?: number;
    absolute_path?: string;
  }
}

interface ErrorDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  error: ApiError | null;
  onResolve?: (id: string) => void;
  onMute?: (id: string, muteUntil: string) => void;
}

// Helper function for copying text (Fixed navigator type & toast calls)
const copyToClipboard = (text: string | null | undefined, successMessage: string) => {
  if (!text) {
    toast.error('Nothing to copy!');
    return;
  }
  // Check if running in a browser environment and clipboard API is available
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => toast.success(successMessage))
        .catch((err) => { // No need for 'any' type if not used
            console.error('Failed to copy: ', err);
            toast.error('Failed to copy!');
        });
  } else {
      // Provide feedback if clipboard is not available
      console.warn('Clipboard API not available.');
      toast.error('Clipboard API not available in this environment.');
  }
};

// --- Fetch Helper (Unchanged) ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
async function fetchWithErrorHandling(url: string, options?: RequestInit, token?: string | null): Promise<any> {
    const headers = new Headers(options?.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    const fetchOptions = { ...options, headers };

    let response;
    try {
        response = await fetch(url, fetchOptions);
    } catch (networkError: any) {
        console.error('Network error:', networkError);
        throw new Error(`Network error: ${networkError.message}`);
    }

    if (!response.ok) {
        let errorPayload: any = { error: `Request failed: ${response.status} ${response.statusText}` };
        try { errorPayload = await response.json(); } catch (e) { /* Ignore parsing error */ }
        console.error('API Error:', errorPayload);
        const errorMessage = errorPayload.error || errorPayload.message || `API Error ${response.status}`;
        throw new Error(errorMessage);
    }

    try {
        return await response.json();
    } catch (e: any) {
        console.error('JSON parse error:', e);
        throw new Error(`Failed to parse response: ${e.message}`);
    }
}

// --- Get Level Badge Helper (Unchanged) ---
const getLevelBadgeDetails = (level?: string): { colorClass: string; text: string } => {
    const lowerLevel = level?.toLowerCase();
    switch (lowerLevel) {
        case 'error': return { colorClass: styles.badgeError, text: 'Error' };
        case 'warn': return { colorClass: styles.badgeWarn, text: 'Warn' };
        case 'info': return { colorClass: styles.badgeInfo, text: 'Info' };
        case 'log': return { colorClass: styles.badgeLog, text: 'Log' };
        default: return { colorClass: styles.badgeDefault, text: level || 'Log' };
    }
};

const ErrorDetailDrawer: React.FC<ErrorDetailDrawerProps> = ({
    isOpen,
    onClose,
    error,
    onResolve,
    onMute,
}) => {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false); // Add state for update operations
  const [detailedError, setDetailedError] = useState<ApiError | null>(null);

  // --- Effects ---
  useEffect(() => {
    if (isOpen && error) {
        setDetailedError(error);
        const needsFetch = !!(!USE_MOCK_DATA && session && (!error.stack_trace || !error.metadata));
        setIsLoading(needsFetch);
    } else if (!isOpen) {
        setDetailedError(null);
        setIsLoading(false);
    }
  }, [isOpen, error, session]);

  useEffect(() => {
    if (USE_MOCK_DATA || !isLoading || !isOpen || !detailedError?.id || !session) {
        if(isLoading) setIsLoading(false);
        return;
    }

    const fetchDetails = async () => {
      console.log(`[Drawer] Fetching details for error ID: ${detailedError.id}`);
      setIsLoading(true);
      try {
        const fullErrorData: ApiError = await fetchWithErrorHandling(
          `${API_BASE_URL}/api/errors/${detailedError.id}`,
          { method: 'GET' },
          session.access_token
        );
        console.log('[Drawer] Fetched details:', fullErrorData);
        setDetailedError(prev => ({
          ...(prev ?? error ?? {}),
          ...fullErrorData
        }));
      } catch (err) {
        console.error('[Drawer] Failed to fetch error details:', err);
        toast.error('Could not load full error details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [detailedError?.id, isLoading, session, isOpen, USE_MOCK_DATA]);

  // Prevent background scroll (Fixed document access)
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const originalOverflow = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      if (document.body.style.overflow === 'hidden') {
           document.body.style.overflow = originalOverflow;
      }
    }
    return () => {
       if (typeof document !== 'undefined' && document.body.style.overflow === 'hidden') {
          document.body.style.overflow = originalOverflow;
       }
    };
  }, [isOpen]);

  // Handle Escape key press (Fixed event.key access & window check)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => {
        window.removeEventListener('keydown', handleEscape);
      };
    }
    return undefined;
  }, [isOpen, onClose]);

  // --- Return null if not open or no valid error object ---
  if (!isOpen || !error) {
    return null;
  }

  // --- Use detailedError if available, otherwise fallback to initial error prop ---
  const displayError = detailedError || error;

  // --- Data Formatting & Extraction ---
  const levelDetails = getLevelBadgeDetails(displayError.level);

  const formatTimestamp = (timestamp: string | undefined): string => {
      if (!timestamp) return 'N/A';
      try {
          // More robust date formatting
          return new Date(timestamp).toLocaleString(undefined, {
              year: 'numeric', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit', hour12: true
          });
      } catch { return 'Invalid Date'; }
  }

  const lastSeen = formatTimestamp(displayError.received_at);
  // Use optional chaining for potentially missing fields
  const firstSeen = formatTimestamp(displayError.first_seen);
  const occurrences = displayError.count ?? 'N/A';

  const stackTraceFull = (() => {
      if (!displayError.stack_trace) return 'N/A';
      const lines = displayError.stack_trace.replace(/\\n/g, '\n').split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) return 'N/A';
      return lines.join('\n');
  })();

  // Safely access nested properties using optional chaining
  const requestMethod = displayError.metadata?.request?.method ?? displayError.request?.method ?? 'N/A';
  const requestUrl = displayError.metadata?.request?.url ?? displayError.request?.url ?? 'N/A';
  const requestStatus = displayError.metadata?.request?.statusCode ?? displayError.request?.statusCode; // No ?? 'N/A' as it can be 0
  const environment = displayError.metadata?.environment ?? displayError.environment ?? 'N/A';
  const release = displayError.metadata?.release ?? displayError.release ?? 'N/A';

  const userId = displayError.metadata?.user?.id ?? displayError.user?.id ?? 'N/A';
  // Assume browser/os are top-level in metadata unless specified otherwise by API
  const browser = displayError.metadata?.browser ?? 'N/A';
  const os = displayError.metadata?.os ?? 'N/A';
  const ipAddress = displayError.metadata?.user?.ip_address ?? displayError.user?.ip_address ?? 'N/A';

  const formattedMetadata = (() => {
      if (displayError.metadata === null || displayError.metadata === undefined) return 'N/A';
      try {
          // Deep clone and filter known keys
          const metaToDisplay = JSON.parse(JSON.stringify(displayError.metadata));
          delete metaToDisplay.request;
          delete metaToDisplay.environment;
          delete metaToDisplay.release;
          delete metaToDisplay.user;
          delete metaToDisplay.browser; // Assuming top-level
          delete metaToDisplay.os;      // Assuming top-level

          if (Object.keys(metaToDisplay).length === 0) return 'N/A';
          return JSON.stringify(metaToDisplay, null, 2); // Pretty print
      } catch { return '[Unserializable Metadata]'; }
  })();

  // Safely create GitHub link
  const githubLink = displayError.source?.absolute_path
     ? `github://file${displayError.source.absolute_path}#L${displayError.source.lineno || 1}`
     : null;
  const githubDisplayPath = displayError.source?.filename
     ? `${displayError.source.filename}:${displayError.source.lineno ?? '?'}`
     : 'View Source';

  // --- Event Handlers (Resolve, Mute - UPDATED) ---
  const handleResolve = async () => {
      if (!displayError.id || isUpdating || !session?.access_token) {
        if(!session?.access_token) toast.error('Authentication session missing.');
        return;
      }
      setIsUpdating(true);
      console.log('Resolving error:', displayError.id);
      try {
         // Call the backend API
         await fetchWithErrorHandling(
            `${API_BASE_URL}/api/errors/${displayError.id}`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state: 'resolved' }),
            },
            session.access_token // Pass the token
         );
         // On success, call optimistic update, notify, and close
         onResolve?.(displayError.id);
         toast.success('Error marked as resolved!');
         onClose();
      } catch (err: any) {
         console.error('Resolve failed:', err);
         toast.error(`Failed to resolve: ${err.message || 'Unknown error'}`);
      } finally {
         setIsUpdating(false);
      }
  };

  const handleMute = async () => {
       if (!displayError.id || isUpdating || !session?.access_token) {
         if(!session?.access_token) toast.error('Authentication session missing.');
         return;
       }
       setIsUpdating(true);
       console.log('Muting error:', displayError.id);
       const muteUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

       try {
          // Call the backend API
          await fetchWithErrorHandling(
            `${API_BASE_URL}/api/errors/${displayError.id}`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state: 'muted', muted_until: muteUntil }),
            },
            session.access_token // Pass the token
          );
          // On success, call optimistic update, notify, and close
          onMute?.(displayError.id, muteUntil);
          toast.success('Error muted for 24 hours!');
          onClose();
       } catch (err: any) {
          console.error('Mute failed:', err);
          toast.error(`Failed to mute: ${err.message || 'Unknown error'}`);
       } finally {
          setIsUpdating(false);
       }
  };

  // --- Reusable Code Block (Fixed return type and styling) ---
  const CodeBlockWithCopy: React.FC<{ content: string | null | undefined, language?: string, title: string, maxHeight?: string }> =
      ({ content, language = 'text', title, maxHeight }) => {
        // Define style object, ensure overflowY is correctly typed
        const style: React.CSSProperties = maxHeight ? { maxHeight, overflowY: 'auto' } : {};
        const textToCopy = content || 'N/A';

        // Check if content exists before rendering
        if (textToCopy === 'N/A') {
            return <div className={styles.codeBlockEmpty}>N/A</div>;
        }

        return (
            // Apply style to the outer div which controls max height and scrolling
            <div className="relative" style={style}>
                <button
                    onClick={() => copyToClipboard(textToCopy, `${title} copied!`)}
                    className={styles.copyButton}
                    title={`Copy ${title}`}
                    aria-label={`Copy ${title}`}
                >
                    <ClipboardDocumentIcon className={styles.copyIcon} />
                </button>
                {/* Apply CSS module class to SyntaxHighlighter */}
                <SyntaxHighlighter
                    language={language}
                    style={vscDarkPlus} // Pass the imported style object
                    className={styles.codeBlock} // Apply styling via CSS Modules
                    wrapLongLines={true}
                    showLineNumbers={false} // Optional: adjust as needed
                    // Remove inline styles conflicting with CSS module
                >
                    {textToCopy}
                </SyntaxHighlighter>
            </div>
        );
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className={styles.backdrop}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-hidden="true"
          />

          {/* Toaster for notifications */}
          <Toaster position="top-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />

          {/* Drawer Content */}
          <motion.div
            className={styles.drawer}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            aria-labelledby="error-drawer-title"
            aria-modal="true"
            role="dialog"
          >
            {/* Header Bar (Add disabled state to buttons) */}
            <div className={styles.header}>
              <div className={styles.headerTitle}>
                <span className={`${styles.badge} ${levelDetails.colorClass}`}>{levelDetails.text}</span>
                <h2 id="error-drawer-title" className={styles.errorMessage} title={displayError.message}>
                  {displayError.message}
                </h2>
              </div>
              <div className={styles.headerActions}>
                <button
                   onClick={handleResolve}
                   className={`${styles.actionButton} ${styles.resolveButton}`}
                   title="Mark Resolved"
                   disabled={isUpdating} // Disable while updating
                >
                  <CheckCircleIcon className="w-5 h-5 mr-1" />
                   {isUpdating ? 'Resolving...' : 'Resolve'}
                </button>
                <button
                   onClick={handleMute}
                   className={`${styles.actionButton} ${styles.muteButton}`}
                   title="Mute for 24 hours"
                   disabled={isUpdating} // Disable while updating
                >
                   <BellSlashIcon className="w-5 h-5 mr-1" />
                   {isUpdating ? 'Muting...' : 'Mute 24h'}
                </button>
                 <button onClick={onClose} className={styles.closeButton} aria-label="Close drawer" disabled={isUpdating}>
                   <XMarkIcon className="w-6 h-6" />
                 </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className={styles.body}>
                {/* Timeline Meta */}
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Timeline</h3>
                    <div className={styles.metaGrid}>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>First Seen</span>
                            <span className={styles.metaValue}>{firstSeen}</span>
                        </div>
                        <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Last Seen</span>
                            <span className={styles.metaValue}>{lastSeen}</span>
                        </div>
                         <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Total Hits</span>
                            <span className={styles.metaValue}>{occurrences}</span>
                        </div>
                        {/* Placeholder for 24h hits if data becomes available */}
                    </div>
                </section>

                {/* Stack Trace (Simplified - No longer collapsible) */}
                <section className={styles.section}>
                     {/* Use a simple h3 for the title */}
                     <h3 className={styles.sectionTitle}>
                         Stack Trace
                     </h3>
                     {/* Always display the full stack trace, no maxHeight limit */}
                     <CodeBlockWithCopy 
                         content={stackTraceFull} 
                         language="javascript" 
                         title="Stack Trace"
                     />
                </section>

                {/* Request / Environment */}
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Environment</h3>
                     <div className={styles.metaGrid}>
                         <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Request</span>
                            <span className={styles.metaValue}>{requestMethod} {requestUrl}</span>
                         </div>
                         <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Status</span>
                            {/* Handle potential 0 status code */}
                            <span className={styles.metaValue}>{requestStatus !== undefined ? requestStatus : 'N/A'}</span>
                         </div>
                         <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Environment</span>
                            <span className={styles.metaValue}>{environment}</span>
                         </div>
                         <div className={styles.metaItem}>
                            <span className={styles.metaLabel}>Release</span>
                            <span className={styles.metaValue} title={release}>{release}</span>
                         </div>
                     </div>
                </section>

                 {/* User / Session (Conditional) */}
                 {(userId !== 'N/A' || browser !== 'N/A' || os !== 'N/A' || ipAddress !== 'N/A') && (
                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>User Session</h3>
                        <div className={styles.metaGrid}>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>User ID</span>
                                <span className={styles.metaValue}>{userId}</span>
                            </div>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>Browser</span>
                                <span className={styles.metaValue}>{browser}</span>
                            </div>
                             <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>OS</span>
                                <span className={styles.metaValue}>{os}</span>
                            </div>
                            <div className={styles.metaItem}>
                                <span className={styles.metaLabel}>IP Address</span>
                                <span className={styles.metaValue}>{ipAddress}</span>
                            </div>
                        </div>
                    </section>
                 )}

                {/* Raw Metadata */}
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Metadata</h3>
                    <CodeBlockWithCopy content={formattedMetadata} language="json" title="Metadata" maxHeight="200px"/>
                </section>
            </div>

            {/* Footer (Fixed toast calls) */}
            <div className={styles.footer}>
                <h4 className={styles.footerTitle}>Quick Links</h4>
                <div className={styles.footerActions}>
                     {githubLink ? (
                         <a href={githubLink} target="_blank" rel="noopener noreferrer" className={styles.footerLink} title="Open in GitHub (placeholder)">
                            <ArrowTopRightOnSquareIcon className="w-4 h-4 mr-1"/> {githubDisplayPath}
                         </a>
                     ) : (
                         <span className={styles.footerLinkDisabled}><ArrowTopRightOnSquareIcon className="w-4 h-4 mr-1"/> View Source (N/A)</span>
                     )}
                     {/* Add checks for request method if cURL is only for server errors */}
                     <button onClick={() => toast.error('Copy cURL: Not implemented')} className={styles.footerLink} title="Copy as cURL (placeholder)">
                        <LinkIcon className="w-4 h-4 mr-1"/> Copy cURL
                     </button>
                     <button onClick={() => toast.error('Create Issue: Not implemented')} className={styles.footerLink} title="Create Issue (placeholder)">
                        <LinkIcon className="w-4 h-4 mr-1"/> Create Issue
                     </button>
                 </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ErrorDetailDrawer;