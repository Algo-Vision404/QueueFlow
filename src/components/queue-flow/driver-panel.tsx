'use client';

import React, { useState, useEffect } from 'react';
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
  Receipt,
  Zap,
  Activity,
  Coffee,
  WifiOff,
  Timer,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  AnimatedCounter,
  Sparkline,
  ProgressRing,
  StaggerContainer,
  staggerItem,
} from '@/lib/animations';

// ── Types ───────────────────────────────────────────────────────────────────
type DriverStatus = 'offline' | 'available' | 'on-break' | 'boarding' | 'departed';

interface TripRecord {
  id: string;
  tripNo: number;
  time: string;
  passengers: number;
  duration: string;
  destination: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const statusConfig: Record<DriverStatus, { label: string; className: string; dotClass: string }> = {
  offline: {
    label: 'Offline',
    className: 'bg-cashew text-soft',
    dotClass: 'bg-soft',
  },
  available: {
    label: 'Available',
    className: 'bg-cashew text-foreground',
    dotClass: 'traffic-green bg-green-500',
  },
  'on-break': {
    label: 'On Break',
    className: 'bg-warm text-foreground',
    dotClass: 'traffic-yellow bg-yellow-500',
  },
  boarding: {
    label: 'Boarding',
    className: 'bg-warm text-foreground',
    dotClass: 'traffic-yellow bg-yellow-500',
  },
  departed: {
    label: 'Departed',
    className: 'bg-linen text-foreground',
    dotClass: 'traffic-green bg-green-500',
  },
};

const mockTrips: TripRecord[] = [
  { id: 't1', tripNo: 4, time: '07:35 AM', passengers: 14, duration: '45 min', destination: 'Accra Central' },
  { id: 't2', tripNo: 3, time: '06:20 AM', passengers: 12, duration: '40 min', destination: 'Tema' },
  { id: 't3', tripNo: 2, time: '05:45 AM', passengers: 14, duration: '55 min', destination: 'Achimota' },
  { id: 't4', tripNo: 1, time: '05:10 AM', passengers: 12, duration: '35 min', destination: 'Kasoa' },
];

const tripsPerHourData = [0, 1, 1, 2, 1, 2, 3, 2, 1];
const earningsPerHourData = [0, 18, 18, 36, 18, 36, 54, 36, 18];

// ── Countdown Hook ──────────────────────────────────────────────────────────
function useCountdown(targetMinutes: number) {
  const [seconds, setSeconds] = useState(targetMinutes * 60);

  useEffect(() => {
    if (seconds <= 0) return;
    const interval = setInterval(() => {
      setSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ── Quick Status Toggle Component ───────────────────────────────────────────
function StatusToggle({
  current,
  onChange,
}: {
  current: DriverStatus;
  onChange: (status: DriverStatus) => void;
}) {
  const options: { value: DriverStatus; label: string; icon: React.ReactNode; active: boolean }[] = [
    {
      value: 'available',
      label: 'Available',
      icon: <CheckCircle className="w-4 h-4" />,
      active: current === 'available',
    },
    {
      value: 'on-break',
      label: 'On Break',
      icon: <Coffee className="w-4 h-4" />,
      active: current === 'on-break',
    },
    {
      value: 'offline',
      label: 'Offline',
      icon: <WifiOff className="w-4 h-4" />,
      active: current === 'offline',
    },
  ];

  return (
    <div className="flex rounded-lg border bg-muted/30 p-1 gap-1">
      {options.map((opt) => (
        <motion.button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
            opt.active
              ? 'text-background'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          whileTap={{ scale: 0.96 }}
        >
          <AnimatePresence mode="wait">
            {opt.active && (
              <motion.div
                layoutId="status-toggle-bg"
                className="absolute inset-0 bg-foreground rounded-md"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
              />
            )}
          </AnimatePresence>
          <span className="relative z-10 flex items-center gap-1.5">
            {opt.icon}
            {opt.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────────────────
export function DriverPanel() {
  const [driverStatus, setDriverStatus] = useState<DriverStatus>('offline');
  const [boardingProgress, setBoardingProgress] = useState(0);
  const [trips, setTrips] = useState<TripRecord[]>(mockTrips);
  const [totalPassengers, setTotalPassengers] = useState(52);
  const [todayTrips, setTodayTrips] = useState(4);

  // Ticket range for current boarding
  const boardingTickets = Array.from({ length: 14 }, (_, i) => `#${String(45 + i).padStart(3, '0')}`);

  // Earnings calculations
  const farePerPassenger = 1.50;
  const commissionPerPassenger = 0.15;
  const faresCollected = totalPassengers * farePerPassenger;
  const queueFlowCommission = totalPassengers * commissionPerPassenger;
  const netEarnings = faresCollected - queueFlowCommission;
  const dailyTarget = 50;
  const earningsProgress = Math.min((netEarnings / dailyTarget) * 100, 100);

  // Next assignment countdown (simulated ~4 min when available)
  const countdownTime = useCountdown(4);

  const handleStatusToggle = (newStatus: DriverStatus) => {
    const prev = driverStatus;
    setDriverStatus(newStatus);
    if (newStatus === 'available' && prev !== 'available') {
      toast.success('Status updated', { description: 'You are now available for assignments.' });
    } else if (newStatus === 'on-break') {
      toast.info('Break started', { description: 'You will not receive assignments while on break.' });
    } else if (newStatus === 'offline') {
      toast.info('Status updated', { description: 'You are now offline.' });
    }
  };

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
          duration: '\u2014',
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
          <div className="text-center space-y-4 py-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
              className="w-16 h-16 rounded-full bg-cashew flex items-center justify-center mx-auto"
            >
              <Navigation className="w-8 h-8 text-foreground" />
            </motion.div>
            <div>
              <h3 className="text-lg font-semibold">Ready to Start?</h3>
              <p className="text-sm text-muted-foreground mt-1">Report your arrival to begin accepting passengers</p>
            </div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                size="lg"
                className="h-14 w-full max-w-xs mx-auto text-base bg-foreground text-background hover:bg-foreground/90 shadow-lg rounded-xl ripple-container"
                onClick={handleReportArrival}
              >
                <MapPin className="w-5 h-5 mr-2" />
                Report Arrival
              </Button>
            </motion.div>
          </div>
        );
      case 'available':
        return (
          <div className="text-center space-y-4 py-6">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-full bg-cashew flex items-center justify-center mx-auto relative"
            >
              <Clock className="w-8 h-8 text-foreground" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full traffic-green bg-green-500" />
            </motion.div>
            <div>
              <h3 className="text-lg font-semibold">Waiting for Assignment...</h3>
              <p className="text-sm text-muted-foreground mt-1">The queue agent will assign passengers to your vehicle</p>
            </div>

            {/* Next Assignment Countdown */}
            <div className="flex flex-col items-center gap-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Est. next boarding</p>
              <motion.span
                className="text-2xl font-mono font-bold tabular-nums text-foreground"
                key={countdownTime}
                initial={{ y: -4, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.15 }}
              >
                {countdownTime}
              </motion.span>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full max-w-xs mx-auto text-sm ripple-container"
              onClick={handleStartBoarding}
            >
              <Users className="w-5 h-5 mr-2" />
              Simulate Assignment
            </Button>
          </div>
        );
      case 'on-break':
        return (
          <div className="text-center space-y-4 py-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-full bg-warm flex items-center justify-center mx-auto relative"
            >
              <Coffee className="w-8 h-8 text-foreground" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full traffic-yellow bg-yellow-500" />
            </motion.div>
            <div>
              <h3 className="text-lg font-semibold">On Break</h3>
              <p className="text-sm text-muted-foreground mt-1">Toggle back to Available when ready to receive assignments</p>
            </div>
          </div>
        );
      case 'boarding':
        return (
          <div className="space-y-4 py-3">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-semibold">Boarding in Progress</h3>
              <p className="text-sm text-muted-foreground">Verify passengers as they board</p>
            </div>

            {/* Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Passengers loaded</span>
                <span className="font-bold text-lg">
                  <AnimatedCounter value={boardingProgress} duration={400} />
                  <span className="text-muted-foreground font-normal text-sm">/14</span>
                </span>
              </div>
              <Progress value={(boardingProgress / 14) * 100} className="h-3" />
            </div>

            {/* Ticket List */}
            <div className="rounded-lg border p-3 space-y-1.5 max-h-44 overflow-y-auto">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                Assigned Tickets
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {boardingTickets.map((ticket, idx) => (
                  <motion.div
                    key={ticket}
                    animate={{
                      backgroundColor: idx < boardingProgress ? 'var(--cashew)' : 'var(--muted)',
                    }}
                    transition={{ duration: 0.3 }}
                    className={`
                      text-center py-1.5 px-1 rounded-md text-[11px] font-mono border transition-colors
                      ${idx < boardingProgress
                        ? 'bg-cashew border-border text-foreground'
                        : 'bg-muted/50 border-border text-muted-foreground'
                      }
                    `}
                  >
                    {idx < boardingProgress && <CheckCircle className="w-3 h-3 mx-auto mb-0.5" />}
                    {ticket}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <motion.div
                whileHover={{ scale: boardingProgress >= 14 ? 1 : 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  size="lg"
                  className="h-12 text-sm bg-foreground text-background hover:bg-foreground/90 shadow-md ripple-container"
                  onClick={handleConfirmBoarded}
                  disabled={boardingProgress >= 14}
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  {boardingProgress >= 14 ? 'All Boarded' : 'Board Next'}
                </Button>
              </motion.div>
              <Button
                variant="outline"
                size="lg"
                className="h-12 text-sm ripple-container"
                onClick={handleReportIssue}
              >
                <AlertTriangle className="w-4 h-4 mr-1.5" />
                Report Issue
              </Button>
            </div>
          </div>
        );
      case 'departed':
        return (
          <div className="text-center space-y-4 py-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-full bg-cashew flex items-center justify-center mx-auto"
            >
              <CheckCircle className="w-8 h-8 text-foreground" />
            </motion.div>
            <div>
              <h3 className="text-lg font-semibold">Trip Completed!</h3>
              <p className="text-sm text-muted-foreground mt-1">14 passengers delivered safely</p>
            </div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                size="lg"
                className="h-14 w-full max-w-xs mx-auto text-base bg-foreground text-background hover:bg-foreground/90 shadow-lg rounded-xl ripple-container"
                onClick={handleReportNewArrival}
              >
                <Navigation className="w-5 h-5 mr-2" />
                Report New Arrival
              </Button>
            </motion.div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* ── Driver Status Header ──────────────────────────────────────── */}
      <motion.div
        variants={staggerItem}
        initial="hidden"
        animate="visible"
      >
        <Card className="glass-card hover-lift">
          <CardContent className="p-3 md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center text-background font-bold text-base shadow-md flex-shrink-0">
                  KA
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold truncate">Kofi Asante</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      <span className="font-mono font-medium">GW 4521 Y</span>
                    </span>
                    <Badge variant="outline" className="text-[10px]">Minibus &middot; 14 pax</Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    Kwame Nkrumah Circle
                  </div>
                </div>
              </div>
              {/* Vehicle Status Indicator - Large animated dot */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="relative">
                  <span className={`block w-3 h-3 rounded-full ${statusConfig[driverStatus].dotClass}`} />
                  {driverStatus === 'available' && (
                    <motion.span
                      className="absolute inset-0 w-3 h-3 rounded-full bg-green-500"
                      animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
                <Badge className={`text-[10px] border-0 font-semibold ${statusConfig[driverStatus].className}`}>
                  {statusConfig[driverStatus].label}
                </Badge>
              </div>
            </div>

            {/* Quick Status Toggle */}
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Quick Status
              </p>
              <StatusToggle current={driverStatus} onChange={handleStatusToggle} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Main Action Area ──────────────────────────────────────────── */}
      <motion.div
        variants={staggerItem}
        initial="hidden"
        animate="visible"
      >
        <Card className="glass-card border-2 border-foreground/10 gradient-border">
          <CardContent className="p-3 md:p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={driverStatus}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
              >
                {renderMainAction()}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Performance Metrics ──────────────────────────────────────── */}
      <StaggerContainer className="grid grid-cols-2 gap-2" staggerDelay={0.06}>
        <motion.div variants={staggerItem}>
          <Card className="glass-stat hover-lift">
            <CardContent className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Trips/hr</span>
                </div>
                <Sparkline data={tripsPerHourData} width={48} height={20} color="var(--foreground)" />
              </div>
              <p className="text-xl font-bold">
                <AnimatedCounter value={4} duration={800} />
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="glass-stat hover-lift">
            <CardContent className="p-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Earned/hr</span>
                </div>
                <Sparkline data={earningsPerHourData} width={48} height={20} color="var(--foreground)" />
              </div>
              <p className="text-xl font-bold">
                $<AnimatedCounter value={18} duration={800} />
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </StaggerContainer>

      {/* ── Trip History ──────────────────────────────────────────────── */}
      <Card className="glass-card hover-lift">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Trip History
          </CardTitle>
          <CardDescription className="text-xs">Recent completed trips</CardDescription>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <StaggerContainer className="space-y-0" staggerDelay={0.06}>
            {trips.map((trip) => (
              <motion.div
                key={trip.id}
                variants={staggerItem}
                className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-2.5">
                  <motion.div
                    className="w-7 h-7 rounded-lg bg-cashew flex items-center justify-center flex-shrink-0"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <span className="text-[10px] font-bold text-foreground">#{trip.tripNo}</span>
                  </motion.div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{trip.destination}</p>
                    <p className="text-[11px] text-muted-foreground">{trip.time}</p>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground flex-shrink-0 ml-2">
                  <p>{trip.passengers} pax</p>
                  <p>{trip.duration}</p>
                </div>
              </motion.div>
            ))}
            {trips.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-3">No trips yet today</p>
            )}
          </StaggerContainer>
        </CardContent>
      </Card>

      {/* ── Driver Stats with Animated Counters ──────────────────────── */}
      <StaggerContainer className="grid grid-cols-2 gap-2" staggerDelay={0.06}>
        <motion.div variants={staggerItem}>
          <Card className="glass-card hover-lift text-center">
            <CardContent className="p-3 space-y-0.5">
              <Navigation className="w-4 h-4 mx-auto text-foreground" />
              <p className="text-xl font-bold">
                <AnimatedCounter value={todayTrips} duration={1000} />
              </p>
              <p className="text-[10px] text-muted-foreground">Today&apos;s Trips</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Card className="glass-card hover-lift text-center">
            <CardContent className="p-3 space-y-0.5">
              <Users className="w-4 h-4 mx-auto text-foreground" />
              <p className="text-xl font-bold">
                <AnimatedCounter value={totalPassengers} duration={1200} />
              </p>
              <p className="text-[10px] text-muted-foreground">Total Passengers</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Card className="glass-card hover-lift text-center">
            <CardContent className="p-3 space-y-0.5">
              <DollarSign className="w-4 h-4 mx-auto text-foreground" />
              <p className="text-xl font-bold">
                $<AnimatedCounter value={Math.round(netEarnings * 100) / 100} duration={1000} />
              </p>
              <p className="text-[10px] text-muted-foreground">Earnings</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={staggerItem}>
          <Card className="glass-card hover-lift text-center">
            <CardContent className="p-3 space-y-0.5">
              <Star className="w-4 h-4 mx-auto text-foreground" />
              <p className="text-xl font-bold">
                <AnimatedCounter value={48} duration={800} suffix="/10" />
              </p>
              <p className="text-[10px] text-muted-foreground">Rating (4.8/5)</p>
            </CardContent>
          </Card>
        </motion.div>
      </StaggerContainer>

      {/* ── Today&apos;s Earnings with Progress Ring ────────────────── */}
      <motion.div
        variants={staggerItem}
        initial="hidden"
        animate="visible"
      >
        <Card className="glass-card hover-lift">
          <CardHeader className="pb-2 pt-3 px-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-foreground" />
                  Today&apos;s Earnings
                </CardTitle>
                <CardDescription className="text-xs">Fare breakdown and commission</CardDescription>
              </div>
              {/* Earnings Progress Ring */}
              <ProgressRing
                progress={earningsProgress}
                size={56}
                strokeWidth={4}
                color="var(--foreground)"
              >
                <span className="text-[10px] font-bold text-foreground">
                  {Math.round(earningsProgress)}%
                </span>
              </ProgressRing>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-3 pb-3">
            {/* Earnings Table */}
            <div className="space-y-0">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Navigation className="w-3 h-3" />
                  Trips completed
                </span>
                <span className="text-xs font-semibold">
                  <AnimatedCounter value={todayTrips} duration={800} />
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-3 h-3" />
                  Passengers
                </span>
                <span className="text-xs font-semibold">
                  <AnimatedCounter value={totalPassengers} duration={1000} />
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="w-3 h-3" />
                  Fares collected
                </span>
                <span className="text-xs font-semibold">
                  $<AnimatedCounter value={Math.round(faresCollected * 100) / 100} duration={1000} />
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Receipt className="w-3 h-3" />
                  QueueFlow commission
                </span>
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                  -$<AnimatedCounter value={Math.round(queueFlowCommission * 100) / 100} duration={800} />
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  <DollarSign className="w-3 h-3 text-foreground" />
                  Net earnings
                </span>
                <motion.span
                  className="text-base font-bold text-foreground"
                  key={netEarnings}
                  initial={{ scale: 1.1, color: 'var(--foreground)' }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  $<AnimatedCounter value={Math.round(netEarnings * 100) / 100} duration={1200} />
                </motion.span>
              </div>
            </div>

            {/* Daily Target Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Daily target</span>
                <span className="font-medium">
                  ${Math.round(netEarnings * 100) / 100} / ${dailyTarget.toFixed(2)}
                </span>
              </div>
              <div className="relative">
                <Progress value={earningsProgress} className="h-2.5" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-background mix-blend-normal">
                    {Math.round(earningsProgress)}%
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                ${Math.max(dailyTarget - netEarnings, 0).toFixed(2)} remaining to reach daily goal
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
