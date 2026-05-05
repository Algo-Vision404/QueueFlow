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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  UserPlus,
  Megaphone,
  PauseCircle,
  Phone,
  ArrowRight,
  Check,
  X,
  AlertTriangle,
  Shield,
  MapPin,
  Clock,
  Truck,
  Users,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  UserX,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ───────────────────────────────────────────────────────────────────
type Channel = 'agent' | 'ussd' | 'sms';
type EntryStatus = 'waiting' | 'called' | 'boarding' | 'boarded' | 'expired' | 'cancelled';
type VehicleStatus = 'available' | 'boarding' | 'departed';

interface Passenger {
  id: string;
  ticket: string;
  name: string;
  phone: string;
  channel: Channel;
  status: EntryStatus;
  waitMin: number;
  destination?: string;
}

interface Vehicle {
  id: string;
  plate: string;
  driver: string;
  capacity: number;
  status: VehicleStatus;
  loaded: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const statusColors: Record<EntryStatus, string> = {
  waiting: 'bg-cashew text-foreground',
  called: 'bg-warm text-foreground',
  boarding: 'bg-linen text-foreground',
  boarded: 'bg-cashew text-soft',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  cancelled: 'bg-cashew text-soft',
};

const statusDot: Record<EntryStatus, string> = {
  waiting: 'bg-foreground',
  called: 'bg-linen',
  boarding: 'bg-warm',
  boarded: 'bg-soft',
  expired: 'bg-red-500',
  cancelled: 'bg-soft',
};

const vehicleStatusColors: Record<VehicleStatus, string> = {
  available: 'bg-cashew text-foreground',
  boarding: 'bg-warm text-foreground',
  departed: 'bg-cashew text-soft',
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
  phone: `024${String(1000000 + Math.random() * 8999999 | 0)}`,
  channel: (['agent', 'ussd', 'sms'] as const)[i % 3],
  status: i < 3 ? 'called' : i < 5 ? 'boarding' : 'waiting',
  waitMin: i * 3 + 2,
  destination: ['Accra Central', 'Achimota', 'Tema', 'Kasoa', 'Madina'][i % 5],
}));

const mockVehicles: Vehicle[] = [
  { id: 'v1', plate: 'GW 4521 Y', driver: 'Kofi Asante', capacity: 14, status: 'available', loaded: 0 },
  { id: 'v2', plate: 'AW 7832 X', driver: 'Emmanuel Tetteh', capacity: 18, status: 'available', loaded: 0 },
  { id: 'v3', plate: 'GR 2156 W', driver: 'Kwame Boateng', capacity: 14, status: 'available', loaded: 0 },
];

const recentBoardings = [
  { id: 'b1', plate: 'GX 9012 Z', passengers: 14, time: '07:42 AM' },
  { id: 'b2', plate: 'AW 3345 T', passengers: 18, time: '07:15 AM' },
  { id: 'b3', plate: 'GR 7781 V', passengers: 14, time: '06:50 AM' },
];

// ── Sparkline Data ──────────────────────────────────────────────────────────
const sparklineHeights = [40, 65, 45, 80, 55, 70, 90, 60, 75, 50];

// ── Component ───────────────────────────────────────────────────────────────
export function AgentPanel() {
  const [queuePaused, setQueuePaused] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [passengers, setPassengers] = useState<Passenger[]>(mockPassengers);
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formChannel, setFormChannel] = useState<Channel>('agent');
  const [formDestination, setFormDestination] = useState('');

  const handleAddPassenger = () => {
    if (!formName.trim()) {
      toast.error('Passenger name is required');
      return;
    }
    const newTicket = `#${String(60 + passengers.length).padStart(3, '0')}`;
    const newPassenger: Passenger = {
      id: `p-new-${Date.now()}`,
      ticket: newTicket,
      name: formName.trim(),
      phone: formPhone.trim() || 'N/A',
      channel: formChannel,
      status: 'waiting',
      waitMin: 0,
      destination: formDestination.trim() || undefined,
    };
    setPassengers((prev) => [...prev, newPassenger]);
    setFormName('');
    setFormPhone('');
    setFormChannel('agent');
    setFormDestination('');
    setShowForm(false);
    toast.success(`${newPassenger.name} added to queue`, {
      description: `Ticket ${newTicket} issued`,
    });
  };

  const handleCallNextGroup = () => {
    const waiting = passengers.filter((p) => p.status === 'waiting');
    if (waiting.length === 0) {
      toast.info('No waiting passengers in queue');
      return;
    }
    const toCall = waiting.slice(0, 5);
    setPassengers((prev) =>
      prev.map((p) => (toCall.some((c) => c.id === p.id) ? { ...p, status: 'called' as EntryStatus } : p))
    );
    toast.success(`Called next ${toCall.length} passengers`, {
      description: toCall.map((p) => p.ticket).join(', '),
    });
  };

  const handleEmergencyPause = () => {
    setQueuePaused(true);
    toast.warning('Queue paused', {
      description: 'No new passengers will be called until resumed.',
    });
  };

  const handleResume = () => {
    setQueuePaused(false);
    toast.success('Queue resumed', {
      description: 'Normal operations have resumed.',
    });
  };

  const handleCall = (id: string) => {
    setPassengers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'called' as EntryStatus } : p))
    );
  };

  const handleSkip = (id: string) => {
    setPassengers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'expired' as EntryStatus } : p))
    );
    toast.info('Passenger marked as no-show');
  };

  const handleRemove = (id: string) => {
    setPassengers((prev) => prev.filter((p) => p.id !== id));
    toast.success('Passenger removed from queue');
  };

  const handleStartBoarding = (vehicleId: string) => {
    const assigned = passengers.filter((p) => p.status === 'called').slice(0, 5);
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? { ...v, status: 'boarding' as VehicleStatus, loaded: assigned.length }
          : v
      )
    );
    if (assigned.length > 0) {
      setPassengers((prev) =>
        prev.map((p) =>
          assigned.some((a) => a.id === p.id)
            ? { ...p, status: 'boarding' as EntryStatus }
            : p
        )
      );
    }
    toast.success('Boarding started', {
      description: `Loading ${assigned.length} passengers onto vehicle`,
    });
  };

  const handleCompleteBoarding = (vehicleId: string) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? { ...v, status: 'departed' as VehicleStatus, loaded: v.capacity }
          : v
      )
    );
    const boarding = passengers.filter((p) => p.status === 'boarding');
    setPassengers((prev) =>
      prev.map((p) =>
        boarding.some((b) => b.id === p.id)
          ? { ...p, status: 'boarded' as EntryStatus }
          : p
      )
    );
    toast.success('Boarding completed', {
      description: 'Vehicle departed successfully.',
    });
  };

  const handleNoShow = () => toast.info('No-show report logged for passenger');
  const handleQueueJump = () => toast.warning('Queue jump report submitted');
  const handleLostItem = () => toast.info('Lost item report logged');

  const visibleQueue = passengers.slice(0, 15);

  return (
    <div className="space-y-4">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Card className="glass-card">
        <CardContent className="p-3 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center text-background font-bold text-sm shadow-md flex-shrink-0">
                AM
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold truncate">Ama Mensah</h2>
                  <Badge className="bg-cashew text-foreground border-0 text-[10px] flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground mr-1 inline-block animate-pulse" />
                    Online
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Kwame Nkrumah Circle</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 5AM-12PM</span>
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-bold text-foreground">{passengers.filter(p => p.status === 'waiting').length}</p>
              <p className="text-[10px] text-muted-foreground">Waiting</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Quick Actions ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          onClick={() => setShowForm(!showForm)}
          className="h-auto py-3 px-2 flex flex-col items-center gap-1.5 bg-foreground text-background hover:bg-foreground/90 shadow-md rounded-xl"
        >
          <UserPlus className="w-5 h-5" />
          <span className="font-semibold text-xs leading-tight">Add Passenger</span>
          <span className="text-[10px] text-background/70 hidden sm:block">Register new passenger</span>
        </Button>

        <Button
          onClick={handleCallNextGroup}
          disabled={queuePaused}
          className="h-auto py-3 px-2 flex flex-col items-center gap-1.5 bg-cashew text-foreground border border-border hover:bg-linen shadow-md rounded-xl"
        >
          <Megaphone className="w-5 h-5" />
          <span className="font-semibold text-xs leading-tight">Call Next</span>
          <span className="text-[10px] text-soft hidden sm:block">Next 5 passengers</span>
        </Button>

        {queuePaused ? (
          <Button
            onClick={handleResume}
            className="h-auto py-3 px-2 flex flex-col items-center gap-1.5 bg-foreground text-background hover:bg-foreground/90 shadow-md rounded-xl"
          >
            <Check className="w-5 h-5" />
            <span className="font-semibold text-xs leading-tight">Resume Queue</span>
            <span className="text-[10px] text-background/70 hidden sm:block">Restore operations</span>
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="h-auto py-3 px-2 flex flex-col items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white shadow-md rounded-xl">
                <PauseCircle className="w-5 h-5" />
                <span className="font-semibold text-xs leading-tight">E-Stop</span>
                <span className="text-[10px] text-red-100 hidden sm:block">Pause queue ops</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Emergency Pause Queue?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will halt all queue operations. No new passengers will be called until the queue is manually resumed. This action is logged for audit purposes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleEmergencyPause} className="bg-red-600 hover:bg-red-700">
                  Yes, Pause Queue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {queuePaused && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-700 dark:text-red-300 font-medium">Queue is paused. No passengers being called.</p>
        </div>
      )}

      {/* ── Add Passenger Form ─────────────────────────────────────────── */}
      {showForm && (
        <Card className="glass-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-foreground" />
              Add New Passenger
            </CardTitle>
            <CardDescription className="text-xs">Register a new passenger into the queue system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-name" className="text-xs">Passenger Name *</Label>
                <Input
                  id="p-name"
                  placeholder="e.g. Kwame Adjei"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-phone" className="text-xs">Phone Number</Label>
                <Input
                  id="p-phone"
                  placeholder="e.g. 0241234567"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-channel" className="text-xs">Channel</Label>
                <Select value={formChannel} onValueChange={(v) => setFormChannel(v as Channel)}>
                  <SelectTrigger className="w-full h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="ussd">USSD</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-dest" className="text-xs">Destination (optional)</Label>
                <Input
                  id="p-dest"
                  placeholder="e.g. Accra Central"
                  value={formDestination}
                  onChange={(e) => setFormDestination(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="outline" onClick={() => setShowForm(false)} className="h-11">
                Cancel
              </Button>
              <Button onClick={handleAddPassenger} className="h-11 bg-foreground text-background hover:bg-foreground/90">
                <UserPlus className="w-4 h-4 mr-1.5" />
                Add to Queue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Mobile Queue Card List ─────────────────────────────────────── */}
      <div className="xl:hidden">
        <Card className="glass-card">
          <CardHeader className="pb-2 pt-3 px-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Current Queue</CardTitle>
                <CardDescription className="text-xs">Showing next 15</CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {passengers.length} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {visibleQueue.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 p-2.5 rounded-lg border bg-card"
                >
                  {/* Ticket */}
                  <span className="font-mono text-xs text-muted-foreground flex-shrink-0 w-10">
                    {p.ticket}
                  </span>

                  {/* Name & Status */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot[p.status]}`} />
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize ${statusColors[p.status]}`}>
                          {p.status}
                        </span>
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize px-1.5 py-0 ${channelColors[p.channel]}`}
                      >
                        {p.channel}
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 text-foreground hover:text-foreground/80 hover:bg-cashew"
                      onClick={() => handleCall(p.id)}
                      aria-label="Call passenger"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 text-foreground hover:text-foreground/80 hover:bg-cashew"
                      onClick={() => handleSkip(p.id)}
                      aria-label="Skip passenger"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => handleRemove(p.id)}
                      aria-label="Remove passenger"
                    >
                      <X className="w-4 h-4" />
                    </Button>
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
      </div>

      {/* ── Main Content Grid (desktop) ────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* ── Current Queue Table (desktop only, takes 2 cols) ─────────── */}
        <Card className="glass-card xl:col-span-2 hidden xl:block">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Current Queue</CardTitle>
                <CardDescription>Showing next 15 passengers</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {passengers.length} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name / Phone</TableHead>
                    <TableHead className="hidden sm:table-cell">Channel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Wait</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleQueue.map((p) => (
                    <TableRow key={p.id} className="group">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {p.ticket}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.phone}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="text-[11px] capitalize">
                          {p.channel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${statusDot[p.status]}`} />
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[p.status]}`}>
                            {p.status}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {p.waitMin}m
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-foreground hover:text-foreground/80 hover:bg-cashew"
                            onClick={() => handleCall(p.id)}
                            title="Call passenger"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-foreground hover:text-foreground/80 hover:bg-cashew"
                            onClick={() => handleSkip(p.id)}
                            title="Skip / No-show"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            onClick={() => handleRemove(p.id)}
                            title="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {visibleQueue.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No passengers in queue</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Right Sidebar ────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Boarding Control Panel */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-foreground" />
                Boarding Control
              </CardTitle>
              <CardDescription className="text-xs">Manage vehicle boarding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Available Vehicles */}
              <div className="space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Available Vehicles
                </p>
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-lg border p-2.5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold">{v.plate}</span>
                      <Badge className={`text-[10px] border-0 capitalize ${vehicleStatusColors[v.status]}`}>
                        {v.status}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground space-y-0.5">
                      <p>Driver: {v.driver}</p>
                      <p>Capacity: {v.capacity} pax</p>
                    </div>

                    {v.status === 'boarding' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Loading...</span>
                          <span className="font-semibold text-foreground">{v.loaded}/{v.capacity}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-foreground transition-all duration-500"
                            style={{ width: `${Math.min((v.loaded / v.capacity) * 100, 100)}%` }}
                          />
                        </div>
                        <Button
                          size="sm"
                          className="w-full h-11 bg-cashew text-foreground border border-border hover:bg-linen"
                          onClick={() => handleCompleteBoarding(v.id)}
                        >
                          <Check className="w-3.5 h-3.5 mr-1.5" />
                          Complete Boarding
                        </Button>
                      </div>
                    )}

                    {v.status === 'available' && (
                      <Button
                        size="sm"
                        className="w-full h-11 bg-foreground text-background hover:bg-foreground/90"
                        onClick={() => handleStartBoarding(v.id)}
                      >
                        <Users className="w-3.5 h-3.5 mr-1.5" />
                        Start Boarding
                      </Button>
                    )}

                    {v.status === 'departed' && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-foreground" />
                        Trip completed
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <Separator />

              {/* Recent Boardings */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Recent Boardings
                </p>
                {recentBoardings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono text-[11px]">{b.plate}</span>
                    </div>
                    <div className="text-right text-[11px] text-muted-foreground">
                      <span>{b.passengers} pax</span>
                      <span className="ml-2">{b.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Exception Handling */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-foreground" />
                Exception Handling
              </CardTitle>
              <CardDescription className="text-xs">Report queue incidents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-sm h-12"
                onClick={handleNoShow}
              >
                <X className="w-4 h-4 text-red-500" />
                No-show Passenger
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-sm h-12"
                onClick={handleQueueJump}
              >
                <AlertTriangle className="w-4 h-4 text-soft" />
                Queue Jump Report
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-sm h-12"
                onClick={handleLostItem}
              >
                <MapPin className="w-4 h-4 text-soft" />
                Lost Item Report
              </Button>
            </CardContent>
          </Card>

          {/* Queue Analytics */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-foreground" />
                Queue Analytics
              </CardTitle>
              <CardDescription className="text-xs">Real-time queue performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Mini Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Avg. wait time
                  </span>
                  <span className="font-semibold">12 min</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <TrendingUp className="w-3 h-3" />
                    Throughput
                  </span>
                  <span className="font-semibold">8 pax/min</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <UserX className="w-3 h-3" />
                    No-show rate
                  </span>
                  <span className="font-semibold">5.2%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Star className="w-3 h-3" />
                    Satisfaction
                  </span>
                  <span className="font-semibold">4.6/5</span>
                </div>
              </div>

              <Separator />

              {/* Sparkline-style bar visualization */}
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                  Hourly Throughput
                </p>
                <div className="flex items-end gap-1 h-8">
                  {sparklineHeights.map((height, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 rounded-sm transition-all duration-300 ${
                        idx === sparklineHeights.length - 2
                          ? 'bg-foreground'
                          : 'bg-foreground/20'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">5AM</span>
                  <span className="text-[10px] text-muted-foreground">Now</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
