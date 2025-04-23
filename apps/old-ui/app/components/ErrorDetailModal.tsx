'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/solid';
import styles from './ErrorDetailModal.module.css';

// Re-use the ApiError type or define it here if not easily importable
// For simplicity, defining inline. Consider sharing types from a central location.
interface ApiError {
  id: string;
  message: string;
  received_at: string;
  stack_trace: string | null;
  metadata: any | null;
}

interface ErrorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: ApiError | null;
}

const ErrorDetailModal: React.FC<ErrorDetailModalProps> = ({ isOpen, onClose, error }) => {

  // Handle potential null error if modal is open without data (shouldn't happen with proper logic)
  if (!error) {
    return null;
  }

  const formattedDate = new Date(error.received_at).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });

  let formattedMetadata = "N/A";
  if (error.metadata !== null && error.metadata !== undefined) {
      try {
          formattedMetadata = JSON.stringify(error.metadata, null, 2); // Pretty print JSON
      } catch (e) {
          formattedMetadata = "[Could not stringify metadata]";
          console.error("Error stringifying metadata:", e);
      }
  }

  // Prevent background scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle Escape key press to close modal
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.backdrop}
          onClick={onClose} // Close modal on backdrop click
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-labelledby="error-detail-title"
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className={styles.modalHeader}>
              <h2 id="error-detail-title" className={styles.modalTitle}>Error Details</h2>
              <button
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close error details modal"
              >
                <XMarkIcon className={styles.closeIcon} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailSection}>
                <h3 className={styles.sectionTitle}>Message</h3>
                <p className={styles.messageContent}>{error.message}</p>
              </div>

              <div className={styles.detailSection}>
                 <h3 className={styles.sectionTitle}>Received At</h3>
                 <p>{formattedDate}</p>
               </div>

              <div className={styles.detailSection}>
                <h3 className={styles.sectionTitle}>Stack Trace</h3>
                <pre className={styles.codeBlock}>{error.stack_trace || 'N/A'}</pre>
              </div>

              <div className={styles.detailSection}>
                <h3 className={styles.sectionTitle}>Metadata</h3>
                <pre className={styles.codeBlock}>{formattedMetadata}</pre>
              </div>
            </div>

            <div className={styles.modalFooter}>
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