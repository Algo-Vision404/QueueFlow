import { create } from 'zustand';
import type { ActiveSection, QueueEntry, Driver, BoardingSession, DashboardStats } from './types';

interface QueueFlowState {
  // Navigation
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;

  // Queue State
  queueEntries: QueueEntry[];
  setQueueEntries: (entries: QueueEntry[]) => void;
  addQueueEntry: (entry: QueueEntry) => void;
  updateQueueEntry: (id: string, updates: Partial<QueueEntry>) => void;
  removeQueueEntry: (id: string) => void;
  nextTicketNumber: number;

  // Driver State
  drivers: Driver[];
  setDrivers: (drivers: Driver[]) => void;
  updateDriver: (id: string, updates: Partial<Driver>) => void;

  // Boarding State
  activeBoarding: BoardingSession | null;
  setActiveBoarding: (boarding: BoardingSession | null) => void;

  // Dashboard
  stats: DashboardStats;
  setStats: (stats: DashboardStats) => void;

  // Real-time
  isLive: boolean;
  setIsLive: (live: boolean) => void;

  // Location
  selectedLocationId: string;
  setSelectedLocationId: (id: string) => void;
}

export const useQueueFlowStore = create<QueueFlowState>((set) => ({
  // Navigation
  activeSection: 'overview',
  setActiveSection: (section) => set({ activeSection: section }),

  // Queue State
  queueEntries: [],
  setQueueEntries: (entries) => set({ 
    queueEntries: entries,
    nextTicketNumber: entries.length > 0 ? Math.max(...entries.map(e => e.ticketNumber)) + 1 : 1
  }),
  addQueueEntry: (entry) => set((state) => ({
    queueEntries: [...state.queueEntries, entry],
    nextTicketNumber: state.nextTicketNumber + 1
  })),
  updateQueueEntry: (id, updates) => set((state) => ({
    queueEntries: state.queueEntries.map(e => e.id === id ? { ...e, ...updates } : e)
  })),
  removeQueueEntry: (id) => set((state) => ({
    queueEntries: state.queueEntries.filter(e => e.id !== id)
  })),
  nextTicketNumber: 1,

  // Driver State
  drivers: [],
  setDrivers: (drivers) => set({ drivers }),
  updateDriver: (id, updates) => set((state) => ({
    drivers: state.drivers.map(d => d.id === id ? { ...d, ...updates } : d)
  })),

  // Boarding State
  activeBoarding: null,
  setActiveBoarding: (boarding) => set({ activeBoarding: boarding }),

  // Dashboard
  stats: {
    totalInQueue: 0,
    totalServed: 0,
    averageWaitTime: 0,
    activeDrivers: 0,
    boardingSessions: 0,
    revenue: 0,
    queueTrend: [],
    channelBreakdown: [],
    revenueByDay: [],
  },
  setStats: (stats) => set({ stats }),

  // Real-time
  isLive: false,
  setIsLive: (live) => set({ isLive: live }),

  // Location
  selectedLocationId: 'loc-1',
  setSelectedLocationId: (id) => set({ selectedLocationId: id }),
}));
