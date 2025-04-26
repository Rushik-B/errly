import { create } from 'zustand';

export type DateRangePreset = '1h' | '24h' | '7d' | 'custom';

interface DateRangeState {
  preset: DateRangePreset;
  customStartDate: Date | null;
  customEndDate: Date | null;
  setPreset: (preset: DateRangePreset) => void;
  setCustomRange: (start: Date, end: Date) => void;
}

export const useDateRangeStore = create<DateRangeState>((set) => ({
  preset: '24h', // Default to 24 hours
  customStartDate: null,
  customEndDate: null,
  setPreset: (preset) => set({ preset, customStartDate: null, customEndDate: null }), // Reset custom dates when preset changes
  setCustomRange: (start, end) => set({ preset: 'custom', customStartDate: start, customEndDate: end }),
})); 