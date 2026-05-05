'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Users, UserCheck, Clock, Car, Phone, Smartphone, Globe, UserCircle,
  ArrowUpCircle, XCircle, Megaphone, Search, Download, Filter,
  Zap, Timer, AlertTriangle, UserPlus,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { AnimatedCounter, Sparkline } from '@/lib/animations';

// ── Types ──────────────────────────────────────────────────────────────────

type QueueStatus = 'waiting' | 'called' | 'boarding' | 'boarded' | 'cancelled' | 'expired';
type QueueChannel = 'USSD' | 'SMS' | 'Web' | 'Agent' | 'IVR';
type FilterStatus = 'all' | 'waiting' | 'called' | 'boarding' | 'expired';

interface QueueEntry {
  id: string;
  ticketNumber: string;
  name: string;
  phone: string;
  channel: QueueChannel;
  status: QueueStatus;
  position: number;
  estimatedWait: string;
  joinTime: string;
  joinTimestamp: number;
}

// ── Constants ──────────────────────────────────────────────────────────────

const sampleNames = [
  'Abena Serwaa', 'Kofi Mensah', 'Ama Boateng', 'Kwame Asante', 'Esi Darko',
  'Yaw Owusu', 'Adwoa Poku', 'Kobina Annan', 'Efua Agyeman', 'Nana Osei',
  'Akosua Frimpong', 'Kwabena Yeboah', 'Afia Duku', 'Emmanuel Tetteh', 'Grace Lamptey',
  'Daniel Adu', 'Felicity Obeng', 'Samuel Okai', 'Patience Amoah', 'Isaac Mensah',
];
const samplePhones = [
  '024-XXX-XXXX', '020-XXX-XXXX', '027-XXX-XXXX', '050-XXX-XXXX', '026-XXX-XXXX',
  '054-XXX-XXXX', '023-XXX-XXXX', '028-XXX-XXXX', '029-XXX-XXXX', '055-XXX-XXXX',
];
const channels: QueueChannel[] = ['USSD', 'SMS', 'Web', 'Agent', 'IVR'];
const NO_SHOW_MS = 15 * 60 * 1000;

const filterOptions: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Waiting', value: 'waiting' },
  { label: 'Called', value: 'called' },
  { label: 'Boarding', value: 'boarding' },
  { label: 'Expired', value: 'expired' },
];

// ── Seeded PRNG (mulberry32) for deterministic SSR hydration ───────────────

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const _sr = mulberry32(42);
const sRand = () => _sr();
const sRandInt = (max: number) => Math.floor(sRand() * max);

// ── Helpers ────────────────────────────────────────────────────────────────

function generateEntry(position: number, ageOffsetMs = 0): QueueEntry {
  const statuses: QueueStatus[] = ['waiting', 'waiting', 'waiting', 'called', 'called', 'boarding', 'boarded', 'boarded', 'boarded'];
  const status = statuses[sRandInt(statuses.length)];
  const waitMin = sRandInt(25) + 2;
  const hour = 7 + sRandInt(2);
  const minute = sRandInt(60);
  return {
    id: `entry-${position}-${String(sRandInt(99999)).padStart(5, '0')}`,
    ticketNumber: String(100 + sRandInt(900)),
    name: sampleNames[sRandInt(sampleNames.length)],
    phone: samplePhones[sRandInt(samplePhones.length)],
    channel: channels[sRandInt(channels.length)],
    status,
    position,
    estimatedWait: status === 'boarded' ? '0 min' : `~${waitMin} min`,
    joinTime: `${hour}:${String(minute).padStart(2, '0')} AM`,
    joinTimestamp: 1700000000000 - ageOffsetMs,
  };
}

const statusColorMap: Record<QueueStatus, string> = {
  waiting: 'bg-cashew text-foreground',
  called: 'bg-linen text-foreground',
  boarding: 'bg-warm text-foreground',
  boarded: 'bg-foreground/5 text-soft',
  cancelled: 'bg-destructive/10 text-destructive',
  expired: 'bg-destructive/15 text-destructive',
};

const ticketColorMap: Record<QueueStatus, string> = {
  waiting: 'bg-foreground text-background',
  called: 'bg-foreground/70 text-background',
  boarding: 'bg-foreground/50 text-background',
  boarded: 'bg-foreground/20 text-background',
  cancelled: 'bg-destructive text-destructive-foreground',
  expired: 'bg-destructive/80 text-destructive-foreground',
};

function getChannelIcon(channel: QueueChannel) {
  const icons: Record<QueueChannel, React.ReactNode> = {
    USSD: <Phone className="w-3 h-3" />,
    SMS: <Smartphone className="w-3 h-3" />,
    Web: <Globe className="w-3 h-3" />,
    Agent: <UserCircle className="w-3 h-3" />,
    IVR: <Megaphone className="w-3 h-3" />,
  };
  return icons[channel] ?? null;
}

function makeTrend(seed: number, len = 8): number[] {
  const arr: number[] = [];
  let v = seed;
  for (let i = 0; i < len; i++) { v += ((i * 7 + seed * 3) % 5) - 2; arr.push(Math.max(0, v)); }
  return arr;
}

// ── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({ label, count, icon, trendSeed, sparkColor }: {
  label: string; count: number; icon: React.ReactNode; trendSeed: number; sparkColor: string;
}) {
  const trend = useMemo(() => makeTrend(trendSeed), [trendSeed]);
  return (
    <Card className="glass-stat">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-cashew flex items-center justify-center shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <AnimatedCounter value={count} className="text-xl font-bold text-foreground leading-none" />
          <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
        </div>
        <Sparkline data={trend} width={52} height={24} color={sparkColor} fillColor={sparkColor} />
      </CardContent>
    </Card>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function LiveQueue() {
  const [entries, setEntries] = useState<QueueEntry[]>(() => {
    const initial: QueueEntry[] = [];
    for (let i = 0; i < 18; i++) {
      const ageOffset = i === 0 ? NO_SHOW_MS + 60_000 : i === 5 ? NO_SHOW_MS + 120_000 : 0;
      initial.push(generateEntry(i + 1, ageOffset));
    }
    return initial;
  });

  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [quickBoarding, setQuickBoarding] = useState(false);

  // No-show detection (15 min timer, check every 5s)
  useEffect(() => {
    const interval = setInterval(() => {
      setEntries((prev) =>
        prev.map((e) =>
          (e.status === 'waiting' || e.status === 'called') && Date.now() - e.joinTimestamp >= NO_SHOW_MS
            ? { ...e, status: 'expired' as QueueStatus, estimatedWait: '—' }
            : e
        )
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Computed
  const filteredEntries = useMemo(() => entries.filter((entry) => {
    const matchesSearch = !searchText ||
      entry.name.toLowerCase().includes(searchText.toLowerCase()) ||
      entry.ticketNumber.includes(searchText);
    return matchesSearch && (activeFilter === 'all' || entry.status === activeFilter);
  }), [entries, searchText, activeFilter]);

  const waitingCount = entries.filter((e) => e.status === 'waiting').length;
  const calledCount = entries.filter((e) => e.status === 'called').length;
  const boardedCount = entries.filter((e) => e.status === 'boarded').length;
  const expiredCount = entries.filter((e) => e.status === 'expired').length;
  const activeQueueCount = entries.filter(
    (e) => e.status !== 'boarded' && e.status !== 'cancelled' && e.status !== 'expired'
  ).length;

  // Handlers
  const handleSimulate = useCallback(() => {
    const newEntry: QueueEntry = {
      id: crypto.randomUUID(),
      ticketNumber: String(100 + Math.floor(Math.random() * 900)),
      name: sampleNames[Math.floor(Math.random() * sampleNames.length)],
      phone: samplePhones[Math.floor(Math.random() * samplePhones.length)],
      channel: channels[Math.floor(Math.random() * channels.length)],
      status: 'waiting', position: 1, estimatedWait: '~25 min',
      joinTime: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      joinTimestamp: Date.now(),
    };
    setEntries((prev) => [newEntry, ...prev.map((e) => ({ ...e, position: e.position + 1 }))]);
    toast.success(`${newEntry.name} joined the queue`);
  }, []);

  const handleCall = useCallback((id: string) => {
    setEntries((prev) => prev.map((e) =>
      e.id === id ? { ...e, status: 'called' as QueueStatus, estimatedWait: '~5 min' } : e
    ));
  }, []);

  const handleBoard = useCallback((id: string) => {
    setEntries((prev) => prev.map((e) =>
      e.id === id ? { ...e, status: 'boarding' as QueueStatus, estimatedWait: '~2 min' } : e
    ));
    const entry = entries.find((e) => e.id === id);
    if (entry) toast.success(`${entry.name} is boarding!`);
  }, [entries]);

  const handleCancel = useCallback((id: string) => {
    setEntries((prev) => prev.map((e) =>
      e.id === id ? { ...e, status: 'cancelled' as QueueStatus, estimatedWait: '—' } : e
    ));
  }, []);

  const handleRequeue = useCallback((id: string) => {
    setEntries((prev) => prev.map((e) =>
      e.id === id
        ? { ...e, status: 'waiting' as QueueStatus, estimatedWait: '~20 min', joinTimestamp: Date.now() }
        : e
    ));
    toast.info('Passenger re-queued');
  }, []);

  const handleQuickBoard = useCallback(() => {
    setQuickBoarding(true);
    setEntries((prev) => {
      const ids = new Set(
        prev.filter((e) => e.status === 'called' || e.status === 'waiting').slice(0, 5).map((e) => e.id)
      );
      return prev.map((e) =>
        ids.has(e.id) ? { ...e, status: 'boarding' as QueueStatus, estimatedWait: '~2 min' } : e
      );
    });
    toast.success('Quick Board: boarding up to 5 passengers');
    setTimeout(() => setQuickBoarding(false), 1200);
  }, []);

  const handleExport = useCallback(() => {
    const headers = ['Ticket #', 'Name', 'Phone', 'Channel', 'Status', 'Position', 'Est. Wait', 'Join Time'];
    const rows = entries.map((e) =>
      [e.ticketNumber, e.name, e.phone, e.channel, e.status, e.position, e.estimatedWait, e.joinTime].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `queue-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Queue data exported as CSV');
  }, [entries]);

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Live Queue</h1>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-foreground" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-foreground bg-cashew px-2 py-0.5 rounded-md">Live</span>
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              <Users className="w-3 h-3 mr-1 text-foreground" />
              {activeQueueCount} in queue
            </Badge>
          </div>
          <p className="text-muted-foreground mt-0.5 text-sm">Real-time queue monitoring and management</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={handleSimulate} className="gap-1.5 text-sm">
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Passenger</span>
            <span className="sm:hidden">+ Entry</span>
          </Button>
          <Button onClick={handleQuickBoard} variant="outline" disabled={quickBoarding}
            className="gap-1.5 border-border text-foreground hover:bg-warm disabled:opacity-50 text-sm">
            <Zap className={`w-4 h-4 ${quickBoarding ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">Quick Board</span>
            <span className="sm:hidden">QB</span>
          </Button>
          <Button onClick={handleExport} variant="outline"
            className="gap-1.5 border-border text-foreground hover:bg-cashew text-sm">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="glass-stat rounded-xl p-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or ticket number..." value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9 h-9 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:border-0" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <div className="flex gap-1.5 flex-wrap">
            {filterOptions.map((opt) => (
              <Button key={opt.value}
                variant={activeFilter === opt.value ? 'default' : 'outline'} size="sm"
                className={`h-7 text-xs ${activeFilter === opt.value
                  ? 'bg-foreground text-background hover:bg-foreground/90'
                  : 'border-border text-foreground hover:bg-cashew'}`}
                onClick={() => setActiveFilter(opt.value)}>
                {opt.label}
                {opt.value === 'expired' && expiredCount > 0 && (
                  <Badge className="ml-1.5 bg-destructive text-destructive-foreground text-[9px] px-1 py-0 min-w-[16px]">{expiredCount}</Badge>
                )}
              </Button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-auto">
            {filteredEntries.length} of {entries.length} entries
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Entries" count={entries.length}
          icon={<Users className="w-4 h-4 text-foreground" />} trendSeed={30} sparkColor="var(--foreground)" />
        <StatCard label="Waiting" count={waitingCount}
          icon={<Clock className="w-4 h-4 text-foreground" />} trendSeed={10} sparkColor="#22c55e" />
        <StatCard label="Called" count={calledCount}
          icon={<Megaphone className="w-4 h-4 text-foreground" />} trendSeed={5} sparkColor="#eab308" />
        <StatCard label="Boarded" count={boardedCount}
          icon={<UserCheck className="w-4 h-4 text-foreground" />} trendSeed={15} sparkColor="#3b82f6" />
      </div>

      {/* Queue Entries List */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            Queue Entries
            <Badge variant="secondary" className="text-[11px]">{filteredEntries.length} shown</Badge>
            {expiredCount > 0 && (
              <Badge variant="destructive" className="text-[11px] gap-1">
                <AlertTriangle className="w-3 h-3" />{expiredCount} expired
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-8 h-8 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No entries match your search or filter</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your search terms or filters</p>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              {filteredEntries.map((entry) => (
                <div key={entry.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border border-border/60 bg-card transition-colors ${entry.status === 'expired' ? 'ring-1 ring-destructive/30' : ''}`}>
                  {/* Ticket */}
                  <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${ticketColorMap[entry.status]}`}>
                    #{entry.ticketNumber}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground truncate">{entry.name}</span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">{entry.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <Badge variant="secondary" className="text-[11px] gap-1">
                        {getChannelIcon(entry.channel)} {entry.channel}
                      </Badge>
                      <Badge className={`text-[11px] ${statusColorMap[entry.status]}`}>
                        {entry.status === 'expired' && <Timer className="w-3 h-3 mr-0.5" />}
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Pos #{entry.position} &middot; {entry.estimatedWait}
                      {entry.status === 'expired' && <span className="text-destructive ml-1"> — No-show (15 min)</span>}
                    </span>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {entry.status === 'waiting' && (
                      <Button size="sm" variant="outline"
                        className="h-8 text-xs gap-1 border-border text-foreground hover:bg-cashew"
                        onClick={() => handleCall(entry.id)}>
                        <Megaphone className="w-3 h-3" /><span className="hidden sm:inline">Call</span>
                      </Button>
                    )}
                    {entry.status === 'called' && (
                      <Button size="sm" variant="outline"
                        className="h-8 text-xs gap-1 border-border text-foreground hover:bg-linen"
                        onClick={() => handleBoard(entry.id)}>
                        <Car className="w-3 h-3" /><span className="hidden sm:inline">Board</span>
                      </Button>
                    )}
                    {(entry.status === 'waiting' || entry.status === 'called') && (
                      <Button size="sm" variant="ghost"
                        className="h-8 text-xs gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => handleCancel(entry.id)}>
                        <XCircle className="w-3 h-3" /><span className="hidden sm:inline">Cancel</span>
                      </Button>
                    )}
                    {entry.status === 'expired' && (
                      <Button size="sm" variant="outline"
                        className="h-8 text-xs gap-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                        onClick={() => handleRequeue(entry.id)}>
                        <ArrowUpCircle className="w-3 h-3" /><span className="hidden sm:inline">Re-queue</span>
                      </Button>
                    )}
                    {(entry.status === 'boarded' || entry.status === 'cancelled') && (
                      <span className="text-xs text-muted-foreground italic px-2">
                        {entry.status === 'boarded' ? 'Done' : 'Removed'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
