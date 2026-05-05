'use client';

import React, { useState } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  UserPlus, Megaphone, PauseCircle, Phone, ArrowRight, Check, X,
  AlertTriangle, MapPin, Clock, Truck, Users, Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { AnimatedCounter } from '@/lib/animations';

// ── Types ───────────────────────────────────────────────────────────────────
type Channel = 'agent' | 'ussd' | 'sms';
type EntryStatus = 'waiting' | 'called' | 'boarding' | 'boarded' | 'expired' | 'cancelled';
type VehicleStatus = 'available' | 'boarding' | 'departed';

interface Passenger {
  id: string; ticket: string; name: string; phone: string;
  channel: Channel; status: EntryStatus; waitMin: number; destination?: string;
}

interface Vehicle {
  id: string; plate: string; driver: string; capacity: number;
  status: VehicleStatus; loaded: number;
}

interface ActivityEntry {
  id: string; action: string; detail: string; time: string;
  icon: 'call' | 'board' | 'add' | 'cancel';
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const statusColors: Record<EntryStatus, string> = {
  waiting: 'bg-cashew text-foreground', called: 'bg-warm text-foreground',
  boarding: 'bg-linen text-foreground', boarded: 'bg-cashew text-soft',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  cancelled: 'bg-cashew text-soft',
};

const statusDot: Record<EntryStatus, string> = {
  waiting: 'bg-foreground', called: 'bg-linen', boarding: 'bg-warm',
  boarded: 'bg-soft', expired: 'bg-red-500', cancelled: 'bg-soft',
};

const vStatusColors: Record<VehicleStatus, string> = {
  available: 'bg-cashew text-foreground', boarding: 'bg-warm text-foreground',
  departed: 'bg-cashew text-soft',
};

const vStatusDot: Record<VehicleStatus, string> = {
  available: 'bg-green-500', boarding: 'bg-yellow-500', departed: 'bg-muted-foreground',
};

const channelColors: Record<Channel, string> = {
  agent: 'border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300',
  ussd: 'border-green-300 text-green-700 dark:border-green-700 dark:text-green-300',
  sms: 'border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300',
};

// ── Mock Data ───────────────────────────────────────────────────────────────
const mockPassengers: Passenger[] = Array.from({ length: 15 }, (_, i) => ({
  id: `p-${i + 1}`,
  ticket: `#${String(45 + i).padStart(3, '0')}`,
  name: [
    'Kwame Adjei', 'Ama Serwaa', 'Kofi Mensah', 'Abena Darko', 'Yaw Boakye',
    'Afia Osei', 'Emmanuel Tetteh', 'Grace Owusu', 'Daniel Asare', 'Esther Amponsah',
    'Samuel Annan', 'Rebecca Aidoo', 'Joseph Lamptey', 'Felicia Okai', 'Patrick Agyeman',
  ][i],
  phone: `024${String(1000000 + ((i * 600137 + 3) % 8999999)).padStart(7, '0')}`,
  channel: (['agent', 'ussd', 'sms'] as const)[i % 3],
  status: i < 3 ? 'called' : i < 5 ? 'boarding' : 'waiting',
  waitMin: i * 3 + 2,
  destination: ['Accra Central', 'Achimota', 'Tema', 'Kasoa', 'Madina'][i % 5],
}));

const mockVehicles: Vehicle[] = [
  { id: 'v1', plate: 'GW 4521 Y', driver: 'Kofi Asante', capacity: 14, status: 'available', loaded: 0 },
  { id: 'v2', plate: 'AW 7832 X', driver: 'Emmanuel Tetteh', capacity: 18, status: 'available', loaded: 0 },
  { id: 'v3', plate: 'GR 2156 W', driver: 'Kwame Boateng', capacity: 14, status: 'boarding', loaded: 8 },
  { id: 'v4', plate: 'GX 9012 Z', driver: 'Yaw Owusu', capacity: 16, status: 'departed', loaded: 16 },
];

const recentActivity: ActivityEntry[] = [
  { id: 'a1', action: 'Called group', detail: 'Tickets #045-#049', time: '2 min ago', icon: 'call' },
  { id: 'a2', action: 'Boarding started', detail: 'GR 2156 W - 8 pax', time: '5 min ago', icon: 'board' },
  { id: 'a3', action: 'Passenger added', detail: 'Kwame Adjei via Agent', time: '8 min ago', icon: 'add' },
  { id: 'a4', action: 'Vehicle departed', detail: 'GX 9012 Z - 16 pax', time: '12 min ago', icon: 'board' },
  { id: 'a5', action: 'No-show reported', detail: 'Ticket #041 expired', time: '15 min ago', icon: 'cancel' },
];

// ── Component ───────────────────────────────────────────────────────────────
export function AgentPanel() {
  const [queuePaused, setQueuePaused] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [passengers, setPassengers] = useState<Passenger[]>(mockPassengers);
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [activity, setActivity] = useState<ActivityEntry[]>(recentActivity);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formChannel, setFormChannel] = useState<Channel>('agent');
  const [formDestination, setFormDestination] = useState('');

  const waitingCount = passengers.filter((p) => p.status === 'waiting').length;
  const calledCount = passengers.filter((p) => p.status === 'called').length;
  const boardingCount = passengers.filter((p) => p.status === 'boarding').length;
  const totalInQueue = passengers.length;
  const availableVehicles = vehicles.filter((v) => v.status === 'available').length;

  const addActivity = (a: Omit<ActivityEntry, 'id'>) =>
    setActivity((prev) => [{ ...a, id: `a-${Date.now()}` }, ...prev.slice(0, 4)]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAddPassenger = () => {
    if (!formName.trim()) { toast.error('Passenger name is required'); return; }
    const ticket = `#${String(60 + passengers.length).padStart(3, '0')}`;
    const p: Passenger = {
      id: `p-new-${Date.now()}`, ticket, name: formName.trim(),
      phone: formPhone.trim() || 'N/A', channel: formChannel,
      status: 'waiting', waitMin: 0,
      destination: formDestination.trim() || undefined,
    };
    setPassengers((prev) => [...prev, p]);
    addActivity({ action: 'Passenger added', detail: `${p.name} via ${p.channel}`, time: 'Just now', icon: 'add' });
    setFormName(''); setFormPhone(''); setFormChannel('agent'); setFormDestination('');
    setShowForm(false);
    toast.success(`${p.name} added to queue`, { description: `Ticket ${ticket} issued` });
  };

  const handleCallNextGroup = () => {
    const waiting = passengers.filter((p) => p.status === 'waiting');
    if (!waiting.length) { toast.info('No waiting passengers in queue'); return; }
    const toCall = waiting.slice(0, 5);
    setPassengers((prev) => prev.map((p) => toCall.some((c) => c.id === p.id) ? { ...p, status: 'called' as EntryStatus } : p));
    addActivity({ action: 'Called group', detail: `${toCall.length} passengers (${toCall[0]?.ticket}–${toCall.at(-1)?.ticket})`, time: 'Just now', icon: 'call' });
    toast.success(`Called next ${toCall.length} passengers`, { description: toCall.map((p) => p.ticket).join(', ') });
  };

  const handleEmergencyPause = () => {
    setQueuePaused(true);
    addActivity({ action: 'Emergency pause', detail: 'Queue operations halted', time: 'Just now', icon: 'cancel' });
    toast.warning('Queue paused', { description: 'No new passengers will be called until resumed.' });
  };

  const handleResume = () => {
    setQueuePaused(false);
    addActivity({ action: 'Queue resumed', detail: 'Normal operations restored', time: 'Just now', icon: 'add' });
    toast.success('Queue resumed', { description: 'Normal operations have resumed.' });
  };

  const handleCall = (id: string) =>
    setPassengers((prev) => prev.map((p) => p.id === id ? { ...p, status: 'called' as EntryStatus } : p));

  const handleSkip = (id: string) => {
    setPassengers((prev) => prev.map((p) => p.id === id ? { ...p, status: 'expired' as EntryStatus } : p));
    toast.info('Passenger marked as no-show');
  };

  const handleRemove = (id: string) => {
    setPassengers((prev) => prev.filter((p) => p.id !== id));
    toast.success('Passenger removed from queue');
  };

  const handleStartBoarding = (vehicleId: string) => {
    const assigned = passengers.filter((p) => p.status === 'called').slice(0, 5);
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    setVehicles((prev) => prev.map((v) => v.id === vehicleId ? { ...v, status: 'boarding' as VehicleStatus, loaded: assigned.length } : v));
    if (assigned.length) {
      setPassengers((prev) => prev.map((p) => assigned.some((a) => a.id === p.id) ? { ...p, status: 'boarding' as EntryStatus } : p));
    }
    addActivity({ action: 'Boarding started', detail: `${vehicle?.plate} - ${assigned.length} passengers`, time: 'Just now', icon: 'board' });
    toast.success('Boarding started', { description: `Loading ${assigned.length} passengers onto vehicle` });
  };

  const handleCompleteBoarding = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    setVehicles((prev) => prev.map((v) => v.id === vehicleId ? { ...v, status: 'departed' as VehicleStatus, loaded: v.capacity } : v));
    const boarding = passengers.filter((p) => p.status === 'boarding');
    setPassengers((prev) => prev.map((p) => boarding.some((b) => b.id === p.id) ? { ...p, status: 'boarded' as EntryStatus } : p));
    addActivity({ action: 'Vehicle departed', detail: `${vehicle?.plate} - ${boarding.length} pax`, time: 'Just now', icon: 'board' });
    toast.success('Boarding completed', { description: 'Vehicle departed successfully.' });
  };

  const visibleQueue = passengers.slice(0, 15);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

      {/* 1. Agent Header Card */}
      <Card className="glass-card">
        <CardContent className="p-3 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-background font-bold text-sm shadow-md flex-shrink-0">AM</div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold truncate">Ama Mensah</h2>
                  <Badge className="bg-cashew text-foreground border-0 text-[10px] flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground mr-1 inline-block animate-pulse" />Online
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />Kwame Nkrumah Circle</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />5AM–12PM</span>
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-bold"><AnimatedCounter value={waitingCount} duration={800} /></p>
              <p className="text-[10px] text-muted-foreground">Waiting</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Quick Actions Row */}
      <div className="grid grid-cols-3 gap-2">
        <Button onClick={() => setShowForm(!showForm)}
          className="h-auto py-3 px-2 flex flex-col items-center gap-1.5 bg-foreground text-background hover:bg-foreground/90 shadow-md rounded-xl w-full">
          <UserPlus className="w-5 h-5" />
          <span className="font-semibold text-xs">Add Passenger</span>
          <span className="text-[10px] text-background/70 hidden sm:block">Register new passenger</span>
        </Button>

        <Button onClick={handleCallNextGroup} disabled={queuePaused}
          className="h-auto py-3 px-2 flex flex-col items-center gap-1.5 bg-cashew text-foreground border border-border hover:bg-linen shadow-md rounded-xl w-full">
          <Megaphone className="w-5 h-5" />
          <span className="font-semibold text-xs">Call Next</span>
          <span className="text-[10px] text-soft hidden sm:block">Next 5 passengers</span>
        </Button>

        {queuePaused ? (
          <Button onClick={handleResume}
            className="h-auto py-3 px-2 flex flex-col items-center gap-1.5 bg-foreground text-background hover:bg-foreground/90 shadow-md rounded-xl w-full">
            <Check className="w-5 h-5" />
            <span className="font-semibold text-xs">Resume Queue</span>
            <span className="text-[10px] text-background/70 hidden sm:block">Restore operations</span>
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="h-auto py-3 px-2 flex flex-col items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white shadow-md rounded-xl w-full">
                <div className="relative"><PauseCircle className="w-5 h-5" /><span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-300" /></div>
                <span className="font-semibold text-xs">E-Stop</span>
                <span className="text-[10px] text-red-100 hidden sm:block">Pause queue ops</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />Emergency Pause Queue?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will halt all queue operations. No new passengers will be called until the queue is manually resumed. This action is logged for audit purposes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleEmergencyPause} className="bg-red-600 hover:bg-red-700">Yes, Pause Queue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Queue Paused Banner */}
      <AnimatePresence>
        {queuePaused && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-300 font-medium">Queue is paused. No passengers being called.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { icon: <Users className="w-3.5 h-3.5 text-muted-foreground" />, label: 'Waiting', value: waitingCount, dur: 1000 },
          { icon: <Megaphone className="w-3.5 h-3.5 text-muted-foreground" />, label: 'Called', value: calledCount, dur: 1000 },
          { icon: <Truck className="w-3.5 h-3.5 text-muted-foreground" />, label: 'Boarding', value: boardingCount, dur: 1000 },
          { icon: <Activity className="w-3.5 h-3.5 text-muted-foreground" />, label: 'Total', value: totalInQueue, dur: 1200 },
        ].map((s) => (
          <Card key={s.label} className="glass-stat">
            <CardContent className="p-3 space-y-1">
              <div className="flex items-center gap-1.5">{s.icon}<span className="text-[10px] text-muted-foreground">{s.label}</span></div>
              <p className="text-xl font-bold"><AnimatedCounter value={s.value} duration={s.dur} /></p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 4. Collapsible Add Passenger Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0, y: -8 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -8 }} transition={{ duration: 0.35 }} className="overflow-hidden">
            <Card className="glass-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><UserPlus className="w-4 h-4" />Add New Passenger</CardTitle>
                <CardDescription className="text-xs">Register a new passenger into the queue system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="p-name" className="text-xs">Passenger Name *</Label>
                    <Input id="p-name" placeholder="e.g. Kwame Adjei" value={formName} onChange={(e) => setFormName(e.target.value)} className="h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-phone" className="text-xs">Phone Number</Label>
                    <Input id="p-phone" placeholder="e.g. 0241234567" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-channel" className="text-xs">Channel</Label>
                    <Select value={formChannel} onValueChange={(v) => setFormChannel(v as Channel)}>
                      <SelectTrigger className="w-full h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="ussd">USSD</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-dest" className="text-xs">Destination (optional)</Label>
                    <Input id="p-dest" placeholder="e.g. Accra Central" value={formDestination} onChange={(e) => setFormDestination(e.target.value)} className="h-11" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <Button variant="outline" onClick={() => setShowForm(false)} className="h-11">Cancel</Button>
                  <Button onClick={handleAddPassenger} className="h-11 bg-foreground text-background hover:bg-foreground/90">
                    <UserPlus className="w-4 h-4 mr-1.5" />Add to Queue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Queue List (card-based, all screen sizes) */}
      <Card className="glass-card">
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Current Queue</CardTitle>
              <CardDescription className="text-xs">Showing next 15</CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px]"><AnimatedCounter value={passengers.length} duration={800} /> total</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {visibleQueue.map((p) => (
              <div key={p.id} className="flex items-center gap-2 p-2.5 rounded-lg border bg-card">
                <span className="font-mono text-xs text-muted-foreground flex-shrink-0 w-10">{p.ticket}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot[p.status]}`} />
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${statusColors[p.status]}`}>{p.status}</span>
                    </span>
                    <Badge variant="outline" className={`text-[10px] capitalize px-1.5 py-0 ${channelColors[p.channel]}`}>{p.channel}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" className="w-8 h-8 p-0 text-foreground hover:text-foreground/80 hover:bg-cashew" onClick={() => handleCall(p.id)} aria-label="Call"><Phone className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="w-8 h-8 p-0 text-foreground hover:text-foreground/80 hover:bg-cashew" onClick={() => handleSkip(p.id)} aria-label="Skip"><ArrowRight className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="w-8 h-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => handleRemove(p.id)} aria-label="Remove"><X className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
            {visibleQueue.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No passengers in queue</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 6. Vehicle Assignment Card */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Truck className="w-4 h-4" />Vehicle Assignment</CardTitle>
          <CardDescription className="text-xs"><AnimatedCounter value={availableVehicles} duration={600} /> vehicles available</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {vehicles.map((v) => (
            <div key={v.id} className="rounded-lg border p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${vStatusDot[v.status]}`} />
                  <span className="font-mono text-xs font-semibold">{v.plate}</span>
                </div>
                <Badge className={`text-[10px] border-0 capitalize ${vStatusColors[v.status]}`}>{v.status}</Badge>
              </div>
              <div className="text-[11px] text-muted-foreground space-y-0.5">
                <p>Driver: {v.driver}</p><p>Capacity: {v.capacity} pax</p>
              </div>

              {v.status === 'boarding' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Loading...</span>
                    <span className="font-semibold"><AnimatedCounter value={v.loaded} duration={600} />/{v.capacity}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-foreground transition-all duration-700" style={{ width: `${Math.min((v.loaded / v.capacity) * 100, 100)}%` }} />
                  </div>
                  <Button size="sm" className="w-full h-11 bg-cashew text-foreground border border-border hover:bg-linen" onClick={() => handleCompleteBoarding(v.id)}>
                    <Check className="w-3.5 h-3.5 mr-1.5" />Complete Boarding
                  </Button>
                </div>
              )}

              {v.status === 'available' && (
                <Button size="sm" className="w-full h-11 bg-foreground text-background hover:bg-foreground/90" onClick={() => handleStartBoarding(v.id)}>
                  <Users className="w-3.5 h-3.5 mr-1.5" />Start Boarding
                </Button>
              )}

              {v.status === 'departed' && (
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Check className="w-3.5 h-3.5" />Trip completed</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
