import { create } from 'zustand';

// Define the updated ApiError type (consider moving to a shared types file)
export interface ApiError {
  id: string;
  message: string;
  received_at: string;
  stack_trace: string | null;
  metadata: any | null;
  level: string;
  count?: number; // Added: Count for aggregated errors
  trend?: { time: string; count: number }[]; // Added: Trend data for sparkline
  state?: 'resolved' | 'active'; // Added: error state
  mute_until?: string | null; // Added: ISO string or null
  // Add other fields like request if needed
  request?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  }
}

// Define state and actions for the error store
interface ErrorState {
  errors: ApiError[];
  totalCount: number;
  setErrors: (errors: ApiError[], totalCount: number) => void;
  addError: (error: ApiError) => void;
  resolveErrorOptimistic: (id: string) => void;
  muteErrorOptimistic: (id: string, muteUntil: string) => void;
  // Add other actions as needed (e.g., fetchErrors)
}

export const useErrorStore = create<ErrorState>((set, get) => ({
  errors: [],
  totalCount: 0,

  setErrors: (errors, totalCount) => set({ errors, totalCount }),

  addError: (newError) => {
    // Prevent adding duplicates from realtime events
    if (!get().errors.some(e => e.id === newError.id)) {
        set((state) => ({
            errors: [newError, ...state.errors],
            totalCount: state.totalCount + 1,
        }));
    }
  },

  resolveErrorOptimistic: (id) => {
    set((state) => ({
      errors: state.errors.map((error) =>
        error.id === id ? { ...error, state: 'resolved', mute_until: null } : error
      ),
    }));
    // TODO: Add actual API call here (e.g., in a separate async action)
    // Example: api.patch(`/errors/${id}`, { state: 'resolved' })
    // Handle potential API errors and rollback optimistic update if needed
  },

  muteErrorOptimistic: (id, muteUntil) => {
    set((state) => ({
      errors: state.errors.map((error) =>
        error.id === id ? { ...error, mute_until: muteUntil } : error
      ),
    }));
    // TODO: Add actual API call here
    // Example: api.patch(`/errors/${id}`, { mute_until: muteUntil })
    // Handle potential API errors and rollback optimistic update if needed
  },
})); 