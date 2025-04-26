'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import * as Tabs from '@radix-ui/react-tabs';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus.js';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import styles from './ErrorDetailModal.module.css';
import { useAuth } from '../context/AuthContext.tsx';

// Import the mock data flag
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

// Re-use the ApiError type or define it here if not easily importable
// Assume state and request might be added later
interface ApiError {
  id: string;
  message: string;
  received_at: string;
  stack_trace: string | null;
  metadata: any | null;
  level?: string;
  count?: number;
  trend?: { time: string; count: number }[];
  state?: 'resolved' | 'active';
  request?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  }
}

interface ErrorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: ApiError | null;
  // Functions for optimistic updates from the store
  onResolve?: (id: string) => void;
  onMute?: (id: string, muteUntil: string) => void;
}

// Helper function for copying text
const copyToClipboard = (text: string | null | undefined, successMessage: string) => {
  if (!text) {
    toast.error('Nothing to copy!');
    return;
  }
  navigator.clipboard.writeText(text)
    .then(() => toast.success(successMessage))
    .catch((err: any) => {
        console.error('Failed to copy: ', err);
        toast.error('Failed to copy!');
    });
};

// --- START Fetch Helper --- Add fetchWithErrorHandling or similar
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function fetchWithErrorHandling(url: string, options?: RequestInit, token?: string | null): Promise<any> {
  const headers = new Headers(options?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const fetchOptions = { ...options, headers: headers };

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (networkError: any) { 
    console.error('Network error:', networkError);
    throw new Error(`Network error: ${networkError.message}`); 
  }

  if (!response.ok) {
    let errorPayload: any = { error: `Request failed: ${response.status} ${response.statusText}` };
    try { errorPayload = await response.json(); } catch (e) { }
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
// --- END Fetch Helper ---

const ErrorDetailModal: React.FC<ErrorDetailModalProps> = ({ 
    isOpen, 
    onClose, 
    error,
    onResolve, // Receive optimistic update handler
    onMute,    // Receive optimistic update handler
}) => {
  const { session } = useAuth(); // Get session for auth token
  const [isLoading, setIsLoading] = useState(false);
  // Initialize detailedError state ONLY when the modal opens with a new error
  const [detailedError, setDetailedError] = useState<ApiError | null>(null);

  // Effect to initialize detailedError when the modal opens or the initial error prop changes
  useEffect(() => {
    if (isOpen && error) {
        setDetailedError(error); // Set initial state from prop
        setIsLoading(true); // Assume loading until details confirmed/fetched
    } else if (!isOpen) {
        setDetailedError(null); // Clear state on close
        setIsLoading(false);
    }
  }, [isOpen, error]); // Depend on isOpen and the error prop object itself

  // Effect to fetch full details if needed
  useEffect(() => {
    // --- ADDED: Bail out early if using mock data --- 
    if (USE_MOCK_DATA) {
        setIsLoading(false); // Ensure loading is stopped
        return; 
    }
    // --- End Added Check ---

    // Only run if modal is open, we have an initial error ID, and we are currently loading
    if (isOpen && detailedError?.id && isLoading && session) {
      const fetchDetails = async () => {
        console.log(`[Modal] Fetching details for error ID: ${detailedError.id}`);
        try {
          const fullErrorData: ApiError = await fetchWithErrorHandling(
            `${API_BASE_URL}/api/errors/${detailedError.id}`,
            { method: 'GET' },
            session.access_token // Ensure token is passed
          );
          console.log('[Modal] Fetched details:', fullErrorData);
          // Update state with fully fetched details
          setDetailedError(prev => ({ 
            ...(prev ?? {}), // Keep potential existing fields like count/trend
            ...fullErrorData 
          })); 
        } catch (err) {
          console.error('[Modal] Failed to fetch error details:', err);
          toast.error('Could not load full error details.');
          // Keep the initially set (potentially partial) data if fetch fails
        } finally {
          setIsLoading(false); // Stop loading state regardless of outcome
        }
      };
      
      // Check if we actually need to fetch (if stack or metadata is missing)
      // This prevents re-fetching if the initial `error` prop already had details
      if (detailedError.stack_trace === null || detailedError.metadata === null) {
           fetchDetails();
      } else {
           console.log("[Modal] Details already present, skipping fetch.");
           setIsLoading(false); // Already have details, stop loading
      }

    } else if (isLoading && !session) {
         console.warn("[Modal] Cannot fetch details: No active session.");
         toast.error("Session expired. Cannot load details.");
         setIsLoading(false); // Stop loading if no session
    }
  }, [detailedError, isLoading, session, isOpen]); // Depend on detailedError, isLoading, session, isOpen

  // --- Effects (Moved Up) ---
  // Prevent background scroll
  React.useEffect(() => {
    // Check if window is defined for SSR safety
    if (typeof window !== 'undefined') {
      const originalOverflow = document.body.style.overflow;
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        // Only restore if it was previously set by this effect
        if (document.body.style.overflow === 'hidden') {
             document.body.style.overflow = originalOverflow;
        }
      }
      // Return cleanup function to restore original overflow
      return () => {
         if (typeof window !== 'undefined') { // Check again in cleanup
            document.body.style.overflow = originalOverflow;
         }
      };
    }
  }, [isOpen]); // Dependency is just isOpen

  // Handle Escape key press
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    // Only add listener if modal is open
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      // Return cleanup function to remove listener
      return () => {
        window.removeEventListener('keydown', handleEscape);
      };
    } 
    // No cleanup needed if listener wasn't added
    return undefined; 
  }, [isOpen, onClose]); // Dependencies are isOpen and onClose

  // IMPORTANT: Check if displayError is truly available AFTER all hooks
  if (!isOpen || !detailedError) {
    return null; 
  }

  // Now we can safely use detailedError below this point

  // --- Data Formatting ---
  const formattedDate = new Date(detailedError.received_at).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });

  const formatJsonOrObject = (data: any): string => {
     if (data === null || data === undefined) return 'N/A';
     try {
         if (typeof data === 'string') {
             try { return JSON.stringify(JSON.parse(data), null, 2); } catch { /* Ignore */ }
         }
         return JSON.stringify(data, null, 2);
     } catch (e) {
         console.error("Error stringifying data:", e);
         return "[Could not stringify data]";
     }
  }

  const formattedMetadata = formatJsonOrObject(detailedError.metadata);
  const formattedRequest = formatJsonOrObject(detailedError.metadata?.request);

  // --- Event Handlers ---
  const handleResolve = async () => {
      console.log('Resolving error:', detailedError.id);
      try {
          onResolve?.(detailedError.id);
          toast.success('Error marked as resolved (simulated)');
          onClose();
      } catch (err) {
          console.error('Failed to resolve:', err);
          toast.error('Failed to mark as resolved');
      }
  };

  const handleMute = async () => {
      console.log('Muting error:', detailedError.id);
      const muteUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      try {
          onMute?.(detailedError.id, muteUntil);
          toast.success('Error muted for 24h (simulated)');
          onClose();
      } catch (err) {
          console.error('Failed to mute:', err);
          toast.error('Failed to mute error');
      }
  };

  // Reusable component for code blocks with copy button
  const CodeBlockWithCopy: React.FC<{ content: string | null | undefined, language?: string, title: string }> = 
      ({ content, language = 'json', title }) => {
        const textToCopy = content || 'N/A';
        return (
             <div className="relative">
                 <button
                     onClick={() => copyToClipboard(textToCopy, `${title} copied!`)}
                     className={styles.copyButton}
                     title={`Copy ${title}`}
                     aria-label={`Copy ${title}`}
                 >
                     <ClipboardDocumentIcon className={styles.copyIcon} />
                 </button>
                 <SyntaxHighlighter
                     language={language}
                     style={vscDarkPlus as any}
                     className={styles.codeBlock}
                     wrapLongLines={true}
                 >
                     {textToCopy}
                 </SyntaxHighlighter>
             </div>
         );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.backdrop}
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-labelledby="error-detail-title"
          aria-modal="true"
          role="dialog"
        >
          {/* Toaster for copy confirmations */}
          <Toaster position="top-center" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
          <motion.div
            className={styles.modalContent}
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()} // Added type
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className={styles.modalHeader}>
              <div className="flex flex-col">
                <h2 id="error-detail-title" className={styles.modalTitle}>Error Details</h2>
                <p className="text-xs text-gray-400 mt-1">Received: {formattedDate}</p>
              </div>
              <button
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close error details modal"
              >
                <XMarkIcon className={styles.closeIcon} />
              </button>
            </div>

            {/* Using Radix Tabs */}
            <Tabs.Root className={styles.tabsRoot} defaultValue="tabStack">
              <Tabs.List className={styles.tabsList} aria-label="Error Details">
                <Tabs.Trigger className={styles.tabsTrigger} value="tabStack">Stack Trace</Tabs.Trigger>
                <Tabs.Trigger className={styles.tabsTrigger} value="tabRequest">Request</Tabs.Trigger>
                <Tabs.Trigger className={styles.tabsTrigger} value="tabMetadata">Metadata</Tabs.Trigger>
              </Tabs.List>

              <div className={styles.modalBody}> {/* Tab content container */}
                  <Tabs.Content className={styles.tabsContent} value="tabStack">
                      <h3 className={styles.sectionTitle}>Message</h3>
                      <p className={styles.messageContent}>{detailedError.message}</p>
                      <h3 className={styles.sectionTitle + " mt-4"}>Stack Trace</h3>
                      {isLoading ? (
                          <p className="text-gray-400 italic">Loading stack trace...</p>
                      ) : (
                          <CodeBlockWithCopy content={detailedError.stack_trace} language="javascript" title="Stack Trace" />
                      )}
                  </Tabs.Content>

                  <Tabs.Content className={styles.tabsContent} value="tabRequest">
                      <h3 className={styles.sectionTitle}>Request Details</h3>
                      {isLoading ? (
                           <p className="text-gray-400 italic">Loading request details...</p>
                      ) : (
                          <CodeBlockWithCopy content={formattedRequest} language="json" title="Request Data" />
                      )}
                      {/* Add more specific request rendering if data structure is known */}
                  </Tabs.Content>

                  <Tabs.Content className={styles.tabsContent} value="tabMetadata">
                      <h3 className={styles.sectionTitle}>Metadata</h3>
                      {isLoading ? (
                           <p className="text-gray-400 italic">Loading metadata...</p>
                      ) : (
                          <CodeBlockWithCopy content={formattedMetadata} language="json" title="Metadata" />
                      )}
                  </Tabs.Content>
              </div>
            </Tabs.Root>

            <div className={styles.modalFooter}>
                 {/* Resolve and Mute Buttons */}
                 <div className="flex gap-2">
                     <button onClick={handleMute} className={styles.footerActionButton + " " + styles.muteButton}>
                       Mute 24h
                     </button>
                     <button onClick={handleResolve} className={styles.footerActionButton + " " + styles.resolveButton}>
                       Resolve
                     </button>
                 </div>
                 <button onClick={onClose} className={styles.footerCloseButton}>
                   Close
                 </button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ErrorDetailModal; 