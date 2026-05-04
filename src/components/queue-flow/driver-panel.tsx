'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  MapPin,
  Users,
  Clock,
  DollarSign,
  Star,
  CheckCircle,
  Truck,
  Navigation,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ───────────────────────────────────────────────────────────────────
type DriverStatus = 'offline' | 'available' | 'boarding' | 'departed';

interface TripRecord {
  id: string;
  tripNo: number;
  time: string;
  passengers: number;
  duration: string;
  destination: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const statusConfig: Record<DriverStatus, { label: string; className: string }> = {
  offline: {
    label: 'Offline',
    className: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  },
  available: {
    label: 'Available',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  boarding: {
    label: 'Boarding',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  },
  departed: {
    label: 'Departed',
    className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  },
};

const mockTrips: TripRecord[] = [
  { id: 't1', tripNo: 4, time: '07:35 AM', passengers: 14, duration: '45 min', destination: 'Accra Central' },
  { id: 't2', tripNo: 3, time: '06:20 AM', passengers: 12, duration: '40 min', destination: 'Tema' },
  { id: 't3', tripNo: 2, time: '05:45 AM', passengers: 14, duration: '55 min', destination: 'Achimota' },
  { id: 't4', tripNo: 1, time: '05:10 AM', passengers: 12, duration: '35 min', destination: 'Kasoa' },
];

// ── Component ───────────────────────────────────────────────────────────────
export function DriverPanel() {
  const [driverStatus, setDriverStatus] = useState<DriverStatus>('offline');
  const [boardingProgress, setBoardingProgress] = useState(0);
  const [trips, setTrips] = useState<TripRecord[]>(mockTrips);
  const [totalPassengers, setTotalPassengers] = useState(52);
  const [todayTrips, setTodayTrips] = useState(4);

  // Ticket range for current boarding
  const boardingTickets = Array.from({ length: 14 }, (_, i) => `#${String(45 + i).padStart(3, '0')}`);

  const handleReportArrival = () => {
    setDriverStatus('available');
    toast.success('Arrival reported', {
      description: 'You are now marked as available for boarding assignments.',
    });
  };

  const handleConfirmBoarded = () => {
    setBoardingProgress((prev) => {
      const next = Math.min(prev + 1, 14);
      return next;
    });
    if (boardingProgress + 1 >= 14) {
      setTimeout(() => {
        setDriverStatus('departed');
        const newTrip: TripRecord = {
          id: `t-${Date.now()}`,
          tripNo: todayTrips + 1,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          passengers: 14,
          duration: '—',
          destination: 'Accra Central',
        };
        setTrips((prev) => [newTrip, ...prev].slice(0, 5));
        setTodayTrips((prev) => prev + 1);
        setTotalPassengers((prev) => prev + 14);
        setBoardingProgress(0);
        toast.success('All passengers boarded!', {
          description: 'Trip has been marked as departed.',
        });
      }, 500);
    }
  };

  const handleReportIssue = () => {
    toast.info('Issue reported', {
      description: 'An operator has been notified about your issue.',
    });
  };

  const handleReportNewArrival = () => {
    setDriverStatus('available');
    setBoardingProgress(0);
    toast.success('New arrival reported', {
      description: 'You are now available for assignments.',
    });
  };

  const handleStartBoarding = () => {
    setDriverStatus('boarding');
    setBoardingProgress(3);
    toast.info('Boarding assigned', {
      description: 'Please begin boarding 14 passengers.',
    });
  };

  // ── Main Status Action ────────────────────────────────────────────────
  const renderMainAction = () => {
    switch (driverStatus) {
      case 'offline':
        return (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
              <Navigation className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Ready to Start?</h3>
              <p className="text-muted-foreground mt-1">Report your arrival to begin accepting passengers</p>
            </div>
            <Button
              size="lg"
              className="h-16 w-full max-w-xs mx-auto text-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg rounded-xl"
              onClick={handleReportArrival}
            >
              <MapPin className="w-6 h-6 mr-2" />
              Report Arrival
            </Button>
          </div>
        );
      case 'available':
        return (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10 text-amber-600 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Waiting for Assignment...</h3>
              <p className="text-muted-foreground mt-1">The queue agent will assign passengers to your vehicle</p>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="h-14 w-full max-w-xs mx-auto text-base"
              onClick={handleStartBoarding}
            >
              <Users className="w-5 h-5 mr-2" />
              Simulate Assignment
            </Button>
          </div>
        );
      case 'boarding':
        return (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Boarding in Progress</h3>
              <p className="text-muted-foreground">Verify passengers as they board</p>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Passengers loaded</span>
                <span className="font-bold text-lg">
                  {boardingProgress}<span className="text-muted-foreground font-normal text-sm">/14</span>
                </span>
              </div>
              <Progress value={(boardingProgress / 14) * 100} className="h-3" />
            </div>

            {/* Ticket List */}
            <div className="rounded-lg border p-4 space-y-2 max-h-48 overflow-y-auto">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Assigned Tickets
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {boardingTickets.map((ticket, idx) => (
                  <div
                    key={ticket}
                    className={`
                      text-center py-1.5 px-1 rounded-md text-xs font-mono border transition-colors
                      ${idx < boardingProgress
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                        : 'bg-muted/50 border-border text-muted-foreground'
                      }
                    `}
                  >
                    {idx < boardingProgress && <CheckCircle className="w-3 h-3 mx-auto mb-0.5" />}
                    {ticket}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg"
                className="h-14 text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                onClick={handleConfirmBoarded}
                disabled={boardingProgress >= 14}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                {boardingProgress >= 14 ? 'All Boarded' : 'Board Next'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-14 text-base"
                onClick={handleReportIssue}
              >
                <AlertTriangle className="w-5 h-5 mr-2" />
                Report Issue
              </Button>
            </div>
          </div>
        );
      case 'departed':
        return (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Trip Completed!</h3>
              <p className="text-muted-foreground mt-1">14 passengers delivered safely</p>
            </div>
            <Button
              size="lg"
              className="h-16 w-full max-w-xs mx-auto text-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg rounded-xl"
              onClick={handleReportNewArrival}
            >
              <Navigation className="w-6 h-6 mr-2" />
              Report New Arrival
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* ── Driver Status Header ──────────────────────────────────────── */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                KA
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold truncate">Kofi Asante</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    <span className="font-mono font-medium">GW 4521 Y</span>
                  </span>
                  <Badge variant="outline" className="text-[11px]">Minibus &middot; 14 pax</Badge>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  Kwame Nkrumah Circle
                </div>
              </div>
            </div>
            <Badge className={`text-xs border-0 font-semibold ${statusConfig[driverStatus].className}`}>
              {statusConfig[driverStatus].label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* ── Main Action Area ──────────────────────────────────────────── */}
      <Card className="border-2">
        <CardContent className="p-4 md:p-6">
          {renderMainAction()}
        </CardContent>
      </Card>

      {/* ── Trip History ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Trip History
          </CardTitle>
          <CardDescription>Recent completed trips</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trips.map((trip) => (
              <div key={trip.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                    <span className="text-xs font-bold text-emerald-600">#{trip.tripNo}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{trip.destination}</p>
                    <p className="text-xs text-muted-foreground">{trip.time}</p>
                  </div>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{trip.passengers} pax</p>
                  <p>{trip.duration}</p>
                </div>
              </div>
            ))}
            {trips.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No trips yet today</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Driver Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="text-center">
          <CardContent className="p-4 space-y-1">
            <Navigation className="w-5 h-5 mx-auto text-emerald-600" />
            <p className="text-2xl font-bold">{todayTrips}</p>
            <p className="text-xs text-muted-foreground">Today&apos;s Trips</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4 space-y-1">
            <Users className="w-5 h-5 mx-auto text-amber-600" />
            <p className="text-2xl font-bold">{totalPassengers}</p>
            <p className="text-xs text-muted-foreground">Total Passengers</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4 space-y-1">
            <DollarSign className="w-5 h-5 mx-auto text-emerald-600" />
            <p className="text-2xl font-bold">$12.00</p>
            <p className="text-xs text-muted-foreground">Earnings</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4 space-y-1">
            <Star className="w-5 h-5 mx-auto text-amber-500" />
            <p className="text-2xl font-bold">4.8</p>
            <p className="text-xs text-muted-foreground">Rating</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
