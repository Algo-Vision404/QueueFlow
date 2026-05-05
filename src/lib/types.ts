// ============================================
// QueueFlow - Type Definitions
// ============================================

export type Channel = 'ussd' | 'sms' | 'web' | 'agent' | 'ivr';
export type QueueStatus = 'active' | 'paused' | 'closed';
export type EntryStatus = 'waiting' | 'called' | 'boarding' | 'boarded' | 'expired' | 'cancelled';
export type DriverStatus = 'offline' | 'available' | 'boarding' | 'departed';
export type BoardingStatus = 'loading' | 'completed' | 'cancelled';
export type TransactionType = 'passenger_fee' | 'driver_fee' | 'premium' | 'agent_commission';

export interface Location {
  id: string;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  capacity: number;
  createdAt: string;
}

export interface Queue {
  id: string;
  locationId: string;
  date: string;
  status: QueueStatus;
  totalServed: number;
  location?: Location;
  entries: QueueEntry[];
  boardings: BoardingSession[];
}

export interface QueueEntry {
  id: string;
  queueId: string;
  ticketNumber: number;
  channel: Channel;
  passengerPhone?: string;
  passengerName?: string;
  status: EntryStatus;
  position: number;
  estimatedWait?: number;
  calledAt?: string;
  boardedAt?: string;
  expiresAt?: string;
  createdAt: string;
  boardingSessionId?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehiclePlate: string;
  vehicleType: string;
  capacity: number;
  isActive: boolean;
  currentLocationId?: string;
  status: DriverStatus;
  currentLocation?: Location;
}

export interface BoardingSession {
  id: string;
  queueId: string;
  driverId: string;
  vehicleCapacity: number;
  passengersLoaded: number;
  status: BoardingStatus;
  startedAt: string;
  completedAt?: string;
  driver?: Driver;
  entries: QueueEntry[];
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  locationId: string;
  isActive: boolean;
  pin: string;
  location?: Location;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: string;
  referenceId?: string;
  description: string;
  createdAt: string;
}

export interface DashboardStats {
  totalInQueue: number;
  totalServed: number;
  averageWaitTime: number;
  activeDrivers: number;
  boardingSessions: number;
  revenue: number;
  queueTrend: { time: string; count: number }[];
  channelBreakdown: { channel: string; count: number }[];
  revenueByDay: { date: string; revenue: number }[];
}

export type ActiveSection = 
  | 'overview' 
  | 'queue' 
  | 'agent' 
  | 'driver' 
  | 'ussd' 
  | 'architecture' 
  | 'api-docs' 
  | 'monetization' 
  | 'edge-cases'
  | 'roadmap';

export interface USSDStep {
  prompt: string;
  options?: { key: string; label: string }[];
  inputType?: 'number' | 'text' | 'none';
  action?: string;
  nextStep?: string;
  message?: string;
}
