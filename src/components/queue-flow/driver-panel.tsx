'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  MapPin, Users, Clock, DollarSign, Star, CheckCircle, Truck,
  Navigation, AlertTriangle, Receipt, Coffee, WifiOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { AnimatedCounter, ProgressRing } from '@/lib/animations';

// ── Types & Data ──────────────────────────────────────────────────────────
type DriverStatus = 'offline' | 'available' | 'on-break' | 'boarding' | 'departed';

interface TripRecord { id: string; tripNo: number; time: string; passengers: number; duration: string; destination: string; }

const statusCfg: Record<DriverStatus, { label: string; badge: string; dot: string }> = {
  offline:    { label: 'Offline',    badge: 'bg-cashew text-soft',       dot: 'bg-muted-foreground' },
  available:  { label: 'Available',  badge: 'bg-cashew text-foreground', dot: 'bg-green-500' },
  'on-break': { label: 'On Break',   badge: 'bg-warm text-foreground',   dot: 'bg-yellow-500' },
  boarding:   { label: 'Boarding',   badge: 'bg-warm text-foreground',   dot: 'bg-yellow-500' },
  departed:   { label: 'Departed',   badge: 'bg-linen text-foreground',  dot: 'bg-green-500' },
};

const mockTrips: TripRecord[] = [
  { id: 't1', tripNo: 4, time: '07:35 AM', passengers: 14, duration: '45 min', destination: 'Accra Central' },
  { id: 't2', tripNo: 3, time: '06:20 AM', passengers: 12, duration: '40 min', destination: 'Tema' },
  { id: 't3', tripNo: 2, time: '05:45 AM', passengers: 14, duration: '55 min', destination: 'Achimota' },
  { id: 't4', tripNo: 1, time: '05:10 AM', passengers: 12, duration: '35 min', destination: 'Kasoa' },
];

// ── Countdown Hook ────────────────────────────────────────────────────────
function useCountdown(targetMin: number) {
  const [s, setS] = useState(targetMin * 60);
  useEffect(() => { if (s <= 0) return; const t = setInterval(() => setS(v => Math.max(v - 1, 0)), 1000); return () => clearInterval(t); }, [s]);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// ── Component ─────────────────────────────────────────────────────────────
export function DriverPanel() {
  const [status, setStatus] = useState<DriverStatus>('offline');
  const [boarding, setBoarding] = useState(0);
  const [trips, setTrips] = useState<TripRecord[]>(mockTrips);
  const [pax, setPax] = useState(52);
  const [tripCount, setTripCount] = useState(4);

  const tickets = Array.from({ length: 14 }, (_, i) => `#${String(45 + i).padStart(3, '0')}`);
  const fare = pax * 1.5;
  const commission = pax * 0.15;
  const net = fare - commission;
  const target = 50;
  const pct = Math.min((net / target) * 100, 100);
  const countdown = useCountdown(4);

  const toggle = (s: DriverStatus) => {
    setStatus(s);
    if (s === 'available') toast.success('Status updated', { description: 'You are now available for assignments.' });
    else if (s === 'on-break') toast.info('Break started', { description: 'You will not receive assignments while on break.' });
    else if (s === 'offline') toast.info('Status updated', { description: 'You are now offline.' });
  };

  const reportArrival = () => { setStatus('available'); toast.success('Arrival reported', { description: 'You are now marked as available for boarding assignments.' }); };

  const confirmBoarded = () => {
    const next = Math.min(boarding + 1, 14);
    setBoarding(next);
    if (next >= 14) setTimeout(() => {
      setStatus('departed');
      setTrips(p => [{ id: `t-${Date.now()}`, tripNo: tripCount + 1, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), passengers: 14, duration: '\u2014', destination: 'Accra Central' }, ...p].slice(0, 5));
      setTripCount(p => p + 1);
      setPax(p => p + 14);
      setBoarding(0);
      toast.success('All passengers boarded!', { description: 'Trip has been marked as departed.' });
    }, 500);
  };

  const startBoarding = () => { setStatus('boarding'); setBoarding(3); toast.info('Boarding assigned', { description: 'Please begin boarding 14 passengers.' }); };
  const reportIssue = () => toast.info('Issue reported', { description: 'An operator has been notified about your issue.' });
  const newArrival = () => { setStatus('available'); setBoarding(0); toast.success('New arrival reported', { description: 'You are now available for assignments.' }); };

  const iconCircle = (icon: React.ReactNode, bg = 'bg-cashew', dotColor?: string) => (
    <div className="w-16 h-16 rounded-full bg-cashew flex items-center justify-center mx-auto relative" style={bg !== 'bg-cashew' ? undefined : undefined}>
      <div className={`w-16 h-16 rounded-full ${bg} flex items-center justify-center`}>{icon}</div>
      {dotColor && <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${dotColor}`} />}
    </div>
  );

  const primaryBtn = (label: string, icon: React.ReactNode, onClick: () => void) => (
    <Button size="lg" className="h-14 w-full max-w-xs mx-auto text-base bg-foreground text-background hover:bg-foreground/90" onClick={onClick}>
      {icon} {label}
    </Button>
  );

  const renderAction = () => {
    switch (status) {
      case 'offline': return (
        <div className="text-center space-y-4 py-6">
          {iconCircle(<Navigation className="w-8 h-8 text-foreground" />)}
          <div><h3 className="text-lg font-semibold">Ready to Start?</h3><p className="text-sm text-muted-foreground mt-1">Report your arrival to begin accepting passengers</p></div>
          {primaryBtn('Report Arrival', <MapPin className="w-5 h-5 mr-2" />, reportArrival)}
        </div>);
      case 'available': return (
        <div className="text-center space-y-4 py-6">
          {iconCircle(<Clock className="w-8 h-8 text-foreground" />, 'bg-cashew', 'bg-green-500')}
          <div><h3 className="text-lg font-semibold">Waiting for Assignment...</h3><p className="text-sm text-muted-foreground mt-1">The queue agent will assign passengers to your vehicle</p></div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Est. next boarding</p>
            <span className="text-2xl font-mono font-bold tabular-nums">{countdown}</span>
          </div>
          <Button variant="outline" size="lg" className="h-12 w-full max-w-xs mx-auto text-sm" onClick={startBoarding}><Users className="w-5 h-5 mr-2" />Simulate Assignment</Button>
        </div>);
      case 'on-break': return (
        <div className="text-center space-y-4 py-6">
          {iconCircle(<Coffee className="w-8 h-8 text-foreground" />, 'bg-warm', 'bg-yellow-500')}
          <div><h3 className="text-lg font-semibold">On Break</h3><p className="text-sm text-muted-foreground mt-1">Toggle back to Available when ready to receive assignments</p></div>
        </div>);
      case 'boarding': return (
        <div className="space-y-4 py-3">
          <div className="text-center space-y-1"><h3 className="text-lg font-semibold">Boarding in Progress</h3><p className="text-sm text-muted-foreground">Verify passengers as they board</p></div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Passengers loaded</span>
              <span className="font-bold text-lg"><AnimatedCounter value={boarding} duration={400} /><span className="text-muted-foreground font-normal text-sm">/14</span></span>
            </div>
            <Progress value={(boarding / 14) * 100} className="h-3" />
          </div>
          <div className="rounded-lg border p-3 max-h-44 overflow-y-auto">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Assigned Tickets</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {tickets.map((t, i) => (
                <div key={t} className={`text-center py-1.5 px-1 rounded-md text-[11px] font-mono border transition-colors ${i < boarding ? 'bg-cashew border-border text-foreground' : 'bg-muted/50 border-border text-muted-foreground'}`}>
                  {i < boarding && <CheckCircle className="w-3 h-3 mx-auto mb-0.5" />}{t}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button size="lg" className="h-12 text-sm bg-foreground text-background hover:bg-foreground/90" onClick={confirmBoarded} disabled={boarding >= 14}><CheckCircle className="w-4 h-4 mr-1.5" />{boarding >= 14 ? 'All Boarded' : 'Board Next'}</Button>
            <Button variant="outline" size="lg" className="h-12 text-sm" onClick={reportIssue}><AlertTriangle className="w-4 h-4 mr-1.5" />Report Issue</Button>
          </div>
        </div>);
      case 'departed': return (
        <div className="text-center space-y-4 py-6">
          {iconCircle(<CheckCircle className="w-8 h-8 text-foreground" />)}
          <div><h3 className="text-lg font-semibold">Trip Completed!</h3><p className="text-sm text-muted-foreground mt-1">14 passengers delivered safely</p></div>
          {primaryBtn('Report New Arrival', <Navigation className="w-5 h-5 mr-2" />, newArrival)}
        </div>);
    }
  };

  const cfg = statusCfg[status];
  const r = (v: number) => Math.round(v * 100) / 100;

  return (
    <motion.div className="space-y-4 max-w-2xl mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      {/* Driver Card */}
      <Card className="glass-card">
        <CardContent className="p-3 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center text-background font-bold text-base shadow-md shrink-0">KA</div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold truncate">Kofi Asante</h2>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Truck className="w-3 h-3" /><span className="font-mono font-medium">GW 4521 Y</span></span>
                  <Badge variant="outline" className="text-[10px]">Minibus &middot; 14 pax</Badge>
                </div>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />Kwame Nkrumah Circle</div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`block w-3 h-3 rounded-full ${cfg.dot}`} />
              <Badge className={`text-[10px] border-0 font-semibold ${cfg.badge}`}>{cfg.label}</Badge>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Quick Status</p>
            <div className="flex rounded-lg border bg-muted/30 p-1 gap-1">
              {[
                { val: 'available', label: 'Available', icon: <CheckCircle className="w-4 h-4" /> },
                { val: 'on-break', label: 'On Break', icon: <Coffee className="w-4 h-4" /> },
                { val: 'offline', label: 'Offline', icon: <WifiOff className="w-4 h-4" /> },
              ].map((opt) => (
                <button key={opt.val} onClick={() => toggle(opt.val as DriverStatus)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors ${status === opt.val ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
                  {opt.icon}{opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Action */}
      <Card className="glass-card">
        <CardContent className="p-3 md:p-5">
          <AnimatePresence mode="wait">
            <motion.div key={status} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              {renderAction()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: <Navigation className="w-4 h-4 mx-auto" />, value: tripCount, label: "Today's Trips", dur: 1000 },
          { icon: <Users className="w-4 h-4 mx-auto" />, value: pax, label: 'Total Passengers', dur: 1200 },
          { icon: <DollarSign className="w-4 h-4 mx-auto" />, value: r(net), label: 'Earnings', dur: 1000, pre: '$' },
          { icon: <Star className="w-4 h-4 mx-auto" />, value: 48, label: 'Rating (4.8/5)', dur: 800, suf: '/10' },
        ].map(s => (
          <Card key={s.label} className="glass-stat text-center">
            <CardContent className="p-3 space-y-0.5">
              {s.icon}
              <p className="text-xl font-bold">{s.pre || ''}<AnimatedCounter value={s.value} duration={s.dur} />{s.suf || ''}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trip History */}
      <Card className="glass-card">
        <CardHeader className="pb-2 pt-3 px-3">
          <CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" />Trip History</CardTitle>
          <CardDescription className="text-xs">Recent completed trips</CardDescription>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          {!trips.length ? <p className="text-sm text-muted-foreground text-center py-3">No trips yet today</p> : trips.map(t => (
            <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cashew flex items-center justify-center shrink-0"><span className="text-[10px] font-bold">#{t.tripNo}</span></div>
                <div className="min-w-0"><p className="text-sm font-medium truncate">{t.destination}</p><p className="text-[11px] text-muted-foreground">{t.time}</p></div>
              </div>
              <div className="text-right text-xs text-muted-foreground shrink-0 ml-2"><p>{t.passengers} pax</p><p>{t.duration}</p></div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Earnings Breakdown */}
      <Card className="glass-card">
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2"><Receipt className="w-4 h-4" />Today&apos;s Earnings</CardTitle>
              <CardDescription className="text-xs">Fare breakdown and commission</CardDescription>
            </div>
            <ProgressRing progress={pct} size={56} strokeWidth={4} color="var(--foreground)"><span className="text-[10px] font-bold">{Math.round(pct)}%</span></ProgressRing>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-3 pb-3">
          {[
            { icon: <Navigation className="w-3 h-3" />, label: 'Trips completed', val: tripCount, dur: 800, cls: '' },
            { icon: <Users className="w-3 h-3" />, label: 'Passengers', val: pax, dur: 1000, cls: '' },
            { icon: <DollarSign className="w-3 h-3" />, label: 'Fares collected', val: r(fare), dur: 1000, cls: '', pre: '$' },
            { icon: <Receipt className="w-3 h-3" />, label: 'QueueFlow commission', val: r(commission), dur: 800, cls: 'text-red-600 dark:text-red-400', pre: '-$' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">{row.icon} {row.label}</span>
              <span className={`text-xs font-semibold ${row.cls}`}>{row.pre || ''}<AnimatedCounter value={row.val} duration={row.dur} /></span>
            </div>
          ))}
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-semibold flex items-center gap-1.5"><DollarSign className="w-3 h-3" />Net earnings</span>
            <span className="text-base font-bold">$<AnimatedCounter value={r(net)} duration={1200} /></span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Daily target</span>
              <span className="font-medium">${r(net)} / ${target.toFixed(2)}</span>
            </div>
            <Progress value={pct} className="h-2.5" />
            <p className="text-[11px] text-muted-foreground">${Math.max(target - net, 0).toFixed(2)} remaining to reach daily goal</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
