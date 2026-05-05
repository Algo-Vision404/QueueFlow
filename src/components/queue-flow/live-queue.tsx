'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Users, UserCheck, Clock, Car, Phone, Smartphone, Globe, UserCircle,
  ArrowUpCircle, XCircle, Megaphone, Search, Download, Filter,
  Zap, Timer, AlertTriangle, TrendingUp, Activity, Flame, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  AnimatedCounter,
  Sparkline,
  ConfettiBurst,
  ProgressRing,
  SpotlightCard, GlowingLine, ParallaxTilt, SoundWave,
  CountdownRing, LivePulseDot, ElasticButton, MarqueeTicker
} from '@/lib/animations';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/* ══════════════════════════════════════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════════════════════════════════════ */

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
  joinTimestamp: number; // ms since epoch — for no-show detection
}

/* ══════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════════════════════════════════ */

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

const filterOptions: { label: string; value: FilterStatus }[] = [
  { label: 'All', value: 'all' },
  { label: 'Waiting', value: 'waiting' },
  { label: 'Called', value: 'called' },
  { label: 'Boarding', value: 'boarding' },
  { label: 'Expired', value: 'expired' },
];

const NO_SHOW_MS = 15 * 60 * 1000; // 15 minutes

/* ── Seeded PRNG (mulberry32) for deterministic SSR hydration ──────────── */
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
function sRand() { return _sr(); }
function sRandInt(max: number) { return Math.floor(sRand() * max); }

/* ══════════════════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════════════════ */

function generateEntry(position: number, ageOffsetMs: number = 0): QueueEntry {
  const name = sampleNames[sRandInt(sampleNames.length)];
  const phone = samplePhones[sRandInt(samplePhones.length)];
  const channel = channels[sRandInt(channels.length)];
  const statuses: QueueStatus[] = ['waiting', 'waiting', 'waiting', 'called', 'called', 'boarding', 'boarded', 'boarded', 'boarded'];
  const status = statuses[sRandInt(statuses.length)];
  const ticketNum = String(100 + sRandInt(900));
  const waitMin = sRandInt(25) + 2;
  const hour = 7 + sRandInt(2);
  const minute = sRandInt(60);

  return {
    id: `entry-${position}-${String(sRandInt(99999)).padStart(5, '0')}`,
    ticketNumber: ticketNum,
    name,
    phone,
    channel,
    status,
    position,
    estimatedWait: status === 'boarded' ? '0 min' : `~${waitMin} min`,
    joinTime: `${hour}:${String(minute).padStart(2, '0')} AM`,
    joinTimestamp: 1700000000000 - ageOffsetMs, // fixed base timestamp
  };
}

function getStatusColor(status: QueueStatus): string {
  switch (status) {
    case 'waiting':
      return 'bg-cashew text-foreground';
    case 'called':
      return 'bg-linen text-foreground';
    case 'boarding':
      return 'bg-warm text-foreground';
    case 'boarded':
      return 'bg-foreground/5 text-soft';
    case 'cancelled':
      return 'bg-destructive/10 text-destructive';
    case 'expired':
      return 'bg-destructive/15 text-destructive';
    default:
      return '';
  }
}

function getTicketCircleColor(status: QueueStatus): string {
  switch (status) {
    case 'waiting':
      return 'bg-foreground text-background';
    case 'called':
      return 'bg-foreground/70 text-background';
    case 'boarding':
      return 'bg-foreground/50 text-background';
    case 'boarded':
      return 'bg-foreground/20 text-background';
    case 'cancelled':
      return 'bg-destructive text-destructive-foreground';
    case 'expired':
      return 'bg-destructive/80 text-destructive-foreground';
    default:
      return '';
  }
}

function getChannelIcon(channel: QueueChannel) {
  switch (channel) {
    case 'USSD':
      return <Phone className="w-3 h-3" />;
    case 'SMS':
      return <Smartphone className="w-3 h-3" />;
    case 'Web':
      return <Globe className="w-3 h-3" />;
    case 'Agent':
      return <UserCircle className="w-3 h-3" />;
    case 'IVR':
      return <Megaphone className="w-3 h-3" />;
    default:
      return null;
  }
}

/* ── Sparkline trend data (stable seed per stat) ──────────────────────── */
function makeTrend(seed: number, len: number = 8): number[] {
  const arr: number[] = [];
  let v = seed;
  for (let i = 0; i < len; i++) {
    v += ((i * 7 + seed * 3) % 5) - 2; // deterministic pseudo-variation
    arr.push(Math.max(0, v));
  }
  return arr;
}

/* ── Throughput data generator ─────────────────────────────────────────── */
function makeThroughputHistory(): { time: string; value: number }[] {
  const baseHours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2];
  return baseHours.map((h) => ({
    time: `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`,
    value: ((h * 3 + 7) % 6) + 1, // deterministic values 1-6
  }));
}

/* ══════════════════════════════════════════════════════════════════════════
   PASSENGER FLOW DOTS (CSS-keyframe animated)
   ══════════════════════════════════════════════════════════════════════════ */

const DOT_COUNT = 8;
const FLOW_DURATION_BASE = 2.8; // seconds

function PassengerFlowDots() {
  return (
    <div className="relative h-6 w-full overflow-hidden select-none">
      <style>{`
        @keyframes qflow-dot {
          0%   { transform: translateX(0); opacity: 0; }
          8%   { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateX(calc(100cqw - 8px)); opacity: 0; }
        }
        .qflow-track { container-type: inline-size; display: flex; align-items: center; gap: 14px; width: 100%; height: 100%; }
      `}</style>
      <div className="qflow-track">
        {Array.from({ length: DOT_COUNT }, (_, i) => (
          <motion.span
            key={i}
            className="inline-block w-2 h-2 rounded-full bg-foreground/25 flex-shrink-0"
            animate={{
              x: ['0%', '100%'],
              opacity: [0, 0.6, 0.6, 0],
            }}
            transition={{
              x: {
                duration: FLOW_DURATION_BASE + i * 0.15,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 0.35,
              },
              opacity: {
                duration: FLOW_DURATION_BASE + i * 0.15,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 0.35,
                times: [0, 0.08, 0.85, 1],
              },
            }}
          />
        ))}
      </div>
      {/* Left/right labels */}
      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium pointer-events-none">Queue</span>
      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium pointer-events-none">Board</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   STAT CARD (with Sparkline + AnimatedCounter)
   ══════════════════════════════════════════════════════════════════════════ */

function StatCard({
  label,
  count,
  icon,
  bgColor,
  iconBg,
  trendSeed,
  sparkColor,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  bgColor: string;
  iconBg: string;
  trendSeed: number;
  sparkColor: string;
}) {
  const trend = useMemo(() => makeTrend(trendSeed), [trendSeed]);

  return (
    <Card className={`glass-stat ${bgColor}`}>
      <CardContent className="p-2.5 flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <AnimatedCounter
            value={count}
            className="text-xl font-bold text-foreground leading-none"
          />
          <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
        <Sparkline
          data={trend}
          width={56}
          height={24}
          color={sparkColor}
          fillColor={sparkColor}
        />
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   THROUGHPUT METER
   ══════════════════════════════════════════════════════════════════════════ */

function ThroughputMeter({ history }: { history: { time: string; value: number }[] }) {
  const latest = history[history.length - 1]?.value ?? 0;
  const avg = Math.round(history.reduce((s, d) => s + d.value, 0) / history.length);
  const peak = Math.max(...history.map((d) => d.value));

  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-foreground" />
          Real-Time Throughput
          <Badge variant="secondary" className="text-[10px] ml-auto">
            passengers/min
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Chart */}
        <div className="h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--foreground)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="var(--foreground)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                domain={[0, 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: 'var(--foreground)',
                }}
                labelStyle={{ color: 'var(--muted-foreground)' }}
                formatter={(v: number) => [`${v} pax/min`, 'Throughput']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--foreground)"
                strokeWidth={2}
                fill="url(#throughputGrad)"
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0, fill: 'var(--foreground)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary row */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-foreground" />
            <span className="text-muted-foreground">Current:</span>
            <span className="font-semibold text-foreground">{latest}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-soft" />
            <span className="text-muted-foreground">Avg:</span>
            <span className="font-semibold text-foreground">{avg}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-linen" />
            <span className="text-muted-foreground">Peak:</span>
            <span className="font-semibold text-foreground">{peak}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */

export function LiveQueue() {
  /* ── State ────────────────────────────────────────────────────────────── */
  const [entries, setEntries] = useState<QueueEntry[]>(() => {
    const initial: QueueEntry[] = [];
    // Make a few entries old enough to test no-show detection
    for (let i = 0; i < 18; i++) {
      const ageOffset = i === 0 ? NO_SHOW_MS + 60_000 : i === 5 ? NO_SHOW_MS + 120_000 : 0;
      initial.push(generateEntry(i + 1, ageOffset));
    }
    return initial;
  });

  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [confettiPos, setConfettiPos] = useState({ x: 0, y: 0 });
  const [quickBoarding, setQuickBoarding] = useState(false);

  const [throughputHistory, setThroughputHistory] = useState(() => makeThroughputHistory());
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Hydration-safe nowMs for countdown timer ────────────────────────── */
  const [nowMs, setNowMs] = useState(1700000000000);
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ── No-show detection timer ─────────────────────────────────────────── */
  useEffect(() => {
    const interval = setInterval(() => {
      setEntries((prev) =>
        prev.map((e) => {
          if (
            (e.status === 'waiting' || e.status === 'called') &&
            Date.now() - e.joinTimestamp >= NO_SHOW_MS
          ) {
            return { ...e, status: 'expired' as QueueStatus, estimatedWait: '—' };
          }
          return e;
        })
      );
    }, 5000); // check every 5s
    return () => clearInterval(interval);
  }, []);

  /* ── Throughput simulation timer ─────────────────────────────────────── */
  useEffect(() => {
    const interval = setInterval(() => {
      setThroughputHistory((prev) => {
        const now = new Date();
        const newPoint = {
          time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          value: Math.floor(Math.random() * 6) + 1,
        };
        const next = [...prev.slice(1), newPoint];
        return next;
      });
    }, 15_000); // update every 15s
    return () => clearInterval(interval);
  }, []);

  /* ── Computed ────────────────────────────────────────────────────────── */
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        searchText === '' ||
        entry.name.toLowerCase().includes(searchText.toLowerCase()) ||
        entry.ticketNumber.includes(searchText);

      const matchesFilter =
        activeFilter === 'all' || entry.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [entries, searchText, activeFilter]);

  const waitingCount = entries.filter((e) => e.status === 'waiting').length;
  const calledCount = entries.filter((e) => e.status === 'called').length;
  const boardingCount = entries.filter((e) => e.status === 'boarding').length;
  const servedCount = entries.filter((e) => e.status === 'boarded').length;
  const expiredCount = entries.filter((e) => e.status === 'expired').length;
  const activeQueueCount = entries.filter(
    (e) => e.status !== 'boarded' && e.status !== 'cancelled' && e.status !== 'expired'
  ).length;

  /* ── Status banner computed values ───────────────────────────────────── */
  const activeCount = waitingCount;
  const boardedCount = servedCount;

  /* ── Handlers ────────────────────────────────────────────────────────── */
  const handleSimulate = useCallback(() => {
    const newEntry: QueueEntry = {
      id: crypto.randomUUID(),
      ticketNumber: String(100 + Math.floor(Math.random() * 900)),
      name: sampleNames[Math.floor(Math.random() * sampleNames.length)],
      phone: samplePhones[Math.floor(Math.random() * samplePhones.length)],
      channel: channels[Math.floor(Math.random() * channels.length)],
      status: 'waiting',
      position: 1,
      estimatedWait: '~25 min',
      joinTime: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      joinTimestamp: Date.now(),
    };
    setEntries((prev) =>
      [newEntry, ...prev.map((e) => ({ ...e, position: e.position + 1 }))]
    );
    toast.success(`${newEntry.name} joined the queue`);
  }, []);

  const fireConfetti = useCallback((event?: React.MouseEvent) => {
    if (event) {
      setConfettiPos({ x: event.clientX, y: event.clientY });
    } else {
      // center of screen
      setConfettiPos({ x: window.innerWidth / 2, y: window.innerHeight / 3 });
    }
    setConfettiTrigger((p) => p + 1);
  }, []);

  const handleCall = useCallback((id: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: 'called' as QueueStatus, estimatedWait: '~5 min' } : e
      )
    );
  }, []);

  const handleBoard = useCallback(
    (id: string, event?: React.MouseEvent) => {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, status: 'boarding' as QueueStatus, estimatedWait: '~2 min' } : e
        )
      );
      fireConfetti(event);
      const entry = entries.find((e) => e.id === id);
      if (entry) {
        toast.success(`${entry.name} is boarding!`);
      }
    },
    [entries, fireConfetti]
  );

  const handleCancel = useCallback((id: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: 'cancelled' as QueueStatus, estimatedWait: '—' } : e
      )
    );
  }, []);

  const handleRequeue = useCallback((id: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, status: 'waiting' as QueueStatus, estimatedWait: '~20 min', joinTimestamp: Date.now() }
          : e
      )
    );
    toast.info('Passenger re-queued');
  }, []);

  const handleQuickBoard = useCallback(() => {
    setQuickBoarding(true);

    // Find next 5 eligible entries (called or waiting)
    setEntries((prev) => {
      const eligible = prev.filter(
        (e) => e.status === 'called' || e.status === 'waiting'
      );
      const toBoard = eligible.slice(0, 5);
      const ids = new Set(toBoard.map((e) => e.id));

      const updated = prev.map((e) =>
        ids.has(e.id)
          ? { ...e, status: 'boarding' as QueueStatus, estimatedWait: '~2 min' }
          : e
      );

      return updated;
    });

    fireConfetti();
    toast.success(`Quick Board: boarding ${Math.min(5, entries.filter((e) => e.status === 'called' || e.status === 'waiting').length)} passengers`);

    setTimeout(() => setQuickBoarding(false), 1200);
  }, [entries, fireConfetti]);

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

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Confetti Burst overlay */}
      <ConfettiBurst trigger={confettiTrigger} x={confettiPos.x} y={confettiPos.y} />

      {/* ── Live Queue Status Banner ── */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl glass-stat mb-4">
        <LivePulseDot color="bg-green-500" size={8} />
        <span className="text-xs font-semibold text-foreground flex-1">Live Queue Active</span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-muted-foreground">{activeCount} waiting</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">{calledCount} called</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
            <span className="text-muted-foreground">{boardedCount} boarded</span>
          </span>
        </div>
      </div>

      {/* ── GlowingLine: after status banner, before main content ── */}
      <GlowingLine className="my-3" />

      {/* ── Passenger Flow Visualization ────────────────────────────────── */}
      <Card className="glass-stat overflow-hidden">
        <CardContent className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
            </motion.div>
            <span className="text-xs font-medium text-muted-foreground">Passenger Flow</span>
          </div>
          <PassengerFlowDots />
        </CardContent>
      </Card>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">Live Queue</h1>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-foreground" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-foreground bg-cashew px-2 py-0.5 rounded-md">
                Live
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5 text-sm">Real-time queue monitoring and management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Users className="w-3.5 h-3.5 mr-1.5 text-foreground" />
            {activeQueueCount} in queue
          </Badge>

          {/* SoundWave visualizer for boarding */}
          <SoundWave isPlaying={quickBoarding} barCount={16} />

          {/* Quick Board button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}>
            <Button
              onClick={handleQuickBoard}
              variant="outline"
              disabled={quickBoarding}
              className="gap-2 border-border text-foreground hover:bg-warm disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${quickBoarding ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">Quick Board</span>
              <span className="sm:hidden">QB</span>
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}>
            <Button
              onClick={handleExport}
              variant="outline"
              className="gap-2 border-border text-foreground hover:bg-cashew"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </motion.div>

          {/* ElasticButton: Add Passenger */}
          <ElasticButton onClick={handleSimulate} variant="accent" className="text-xs">
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Passenger</span>
            <span className="sm:hidden">+ Entry</span>
          </ElasticButton>
        </div>
      </div>

      {/* ── Search and Filter Row ───────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="glass-stat rounded-xl p-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or ticket number..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9 h-9 bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:border-0"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <div className="flex gap-1.5 flex-wrap">
            {filterOptions.map((opt) => (
              <motion.div key={opt.value} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}>
                <Button
                  variant={activeFilter === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className={
                    activeFilter === opt.value
                      ? 'h-7 text-xs bg-foreground text-background hover:bg-foreground/90'
                      : 'h-7 text-xs border-border text-foreground hover:bg-cashew'
                  }
                  onClick={() => setActiveFilter(opt.value)}
                >
                  {opt.label}
                  {opt.value === 'expired' && expiredCount > 0 && (
                    <Badge className="ml-1.5 bg-destructive text-destructive-foreground text-[9px] px-1 py-0 min-w-[16px] badge-bounce">
                      {expiredCount}
                    </Badge>
                  )}
                </Button>
              </motion.div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-auto">
            {filteredEntries.length} of {entries.length} entries
          </span>
        </div>
      </div>

      {/* ── GlowingLine: before enhanced stat cards ── */}
      <GlowingLine className="my-3" />

      {/* ── Enhanced Stat Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ParallaxTilt intensity={3}>
          <SpotlightCard className="glass-stat p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-cashew flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-foreground" />
              </div>
              <span className="text-[11px] text-muted-foreground">Total Entries</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{filteredEntries.length}</p>
            <Sparkline data={entries.slice(-8).map((_, i) => 30 + i * 3 + ((i * 7) % 5) - 2)} width={60} height={20} />
          </SpotlightCard>
        </ParallaxTilt>

        <ParallaxTilt intensity={3}>
          <SpotlightCard className="glass-stat p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-cashew flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-foreground" />
              </div>
              <span className="text-[11px] text-muted-foreground">Throughput</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{throughputHistory.length > 0 ? throughputHistory[throughputHistory.length - 1].value : 0}<span className="text-sm font-normal text-muted-foreground">/min</span></p>
            <Sparkline data={throughputHistory.slice(-8).map(t => t.value)} width={60} height={20} />
          </SpotlightCard>
        </ParallaxTilt>

        <ParallaxTilt intensity={3}>
          <SpotlightCard className="glass-stat p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-cashew flex items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-foreground" />
              </div>
              <span className="text-[11px] text-muted-foreground">Peak Hour</span>
            </div>
            <p className="text-2xl font-bold text-foreground">8:30<span className="text-sm font-normal text-muted-foreground"> AM</span></p>
            <div className="flex gap-0.5 mt-1">
              {[0.3, 0.5, 0.8, 1.0, 0.9, 0.7, 0.4, 0.2].map((intensity, i) => (
                <div key={i} className="w-2 h-4 rounded-sm" style={{ backgroundColor: `rgba(12,11,11,${intensity})` }} />
              ))}
            </div>
          </SpotlightCard>
        </ParallaxTilt>

        <ParallaxTilt intensity={3}>
          <SpotlightCard className="glass-stat p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-cashew flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-foreground" />
              </div>
              <span className="text-[11px] text-muted-foreground">Avg Wait</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">~12<span className="text-sm font-normal text-muted-foreground"> min</span></p>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1.5">
              <motion.div
                className="h-full bg-foreground/30 rounded-full"
                animate={{ width: '40%' }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
              />
            </div>
          </SpotlightCard>
        </ParallaxTilt>
      </div>

      {/* ── GlowingLine: after stat cards, before throughput ── */}
      <GlowingLine className="my-3" />

      {/* ── Throughput Meter ────────────────────────────────────────────── */}
      <ThroughputMeter history={throughputHistory} />

      {/* ── GlowingLine: after throughput, before passenger list ── */}
      <GlowingLine className="my-3" />

      {/* ── Main Queue Display ──────────────────────────────────────────── */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            Queue Entries
            <Badge variant="secondary" className="text-[11px]">
              {filteredEntries.length} shown
            </Badge>
            {expiredCount > 0 && (
              <Badge variant="destructive" className="text-[11px] gap-1 badge-bounce">
                <AlertTriangle className="w-3 h-3" />
                {expiredCount} expired
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
              <AnimatePresence mode="popLayout">
                {filteredEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12, scale: 0.95 }}
                    transition={{
                      duration: 0.35,
                      delay: index * 0.04,
                      ease: [0.16, 1, 0.3, 1] as const,
                    }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border border-border/60 bg-card transition-colors hover-lift ${
                      entry.status === 'expired' ? 'ring-1 ring-destructive/30' : ''
                    }`}
                  >
                    {/* Ticket Number Circle */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${getTicketCircleColor(
                        entry.status
                      )}`}
                    >
                      #{entry.ticketNumber}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground truncate">
                          {entry.name}
                        </span>
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {entry.phone}
                        </span>
                        {/* Expired pulse indicator */}
                        {entry.status === 'expired' && (
                          <motion.span
                            className="relative flex h-2 w-2"
                            animate={{ scale: [1, 1.4, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <span className="absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive traffic-red" />
                          </motion.span>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="secondary" className="text-[11px] gap-1">
                            {getChannelIcon(entry.channel)}
                            {entry.channel}
                          </Badge>
                          <Badge
                            className={`text-[11px] ${getStatusColor(entry.status)} ${
                              entry.status === 'expired' ? 'badge-bounce' : ''
                            }`}
                          >
                            {entry.status === 'expired' && (
                              <Timer className="w-3 h-3 mr-0.5" />
                            )}
                            {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          Pos #{entry.position} &middot; {entry.estimatedWait}
                          {entry.status === 'expired' && (
                            <span className="text-destructive ml-1"> — No-show (15 min)</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* CountdownRing for called entries */}
                    {entry.status === 'called' && (
                      <CountdownRing
                        seconds={30 - Math.floor((nowMs - entry.joinTimestamp) / 1000) % 60}
                        maxSeconds={30}
                        size={32}
                        strokeWidth={2}
                        color="#eab308"
                      />
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {entry.status === 'waiting' && (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 min-w-[44px] text-xs gap-1 border-border text-foreground hover:bg-cashew"
                            onClick={() => handleCall(entry.id)}
                          >
                            <Megaphone className="w-3 h-3" />
                            <span className="hidden sm:inline">Call</span>
                          </Button>
                        </motion.div>
                      )}
                      {entry.status === 'called' && (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 min-w-[44px] text-xs gap-1 border-border text-foreground hover:bg-linen"
                            onClick={(e) => handleBoard(entry.id, e)}
                          >
                            <Car className="w-3 h-3" />
                            <span className="hidden sm:inline">Board</span>
                          </Button>
                        </motion.div>
                      )}
                      {(entry.status === 'waiting' || entry.status === 'called') && (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 min-w-[44px] text-xs gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => handleCancel(entry.id)}
                          >
                            <XCircle className="w-3 h-3" />
                            <span className="hidden sm:inline">Cancel</span>
                          </Button>
                        </motion.div>
                      )}
                      {entry.status === 'expired' && (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 min-w-[44px] text-xs gap-1 border-destructive/50 text-destructive hover:bg-destructive/10"
                            onClick={() => handleRequeue(entry.id)}
                          >
                            <ArrowUpCircle className="w-3 h-3" />
                            <span className="hidden sm:inline">Re-queue</span>
                          </Button>
                        </motion.div>
                      )}
                      {(entry.status === 'boarded' || entry.status === 'cancelled') && (
                        <span className="text-xs text-muted-foreground italic px-2">
                          {entry.status === 'boarded' ? 'Done' : 'Removed'}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
