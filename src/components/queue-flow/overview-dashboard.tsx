'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import {
  Users, UserCheck, Clock, Car, TrendingUp, ArrowUpRight, ArrowDownRight,
  Target, Calendar, Award, Timer, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { AnimatedCounter, Sparkline, ProgressRing } from '@/lib/animations';

// ── Data ───────────────────────────────────────────────────────────────
const queueActivityData = [
  { hour: '5 AM', queue: 4 }, { hour: '6 AM', queue: 12 }, { hour: '6:30 AM', queue: 22 },
  { hour: '7 AM', queue: 45 }, { hour: '7:30 AM', queue: 58 }, { hour: '8 AM', queue: 52 },
  { hour: '8:30 AM', queue: 38 }, { hour: '9 AM', queue: 24 }, { hour: '9:30 AM', queue: 15 },
  { hour: '10 AM', queue: 8 },
];

const channelData = [
  { name: 'USSD', value: 42, color: '#0c0b0b' },
  { name: 'Agent', value: 28, color: '#979585' },
  { name: 'SMS', value: 15, color: '#b8a88a' },
  { name: 'Web', value: 10, color: '#dddbca' },
  { name: 'IVR', value: 5, color: '#e9e6d7' },
];

const recentBoardings = [
  { vehicle: 'GC-2847-WX', driver: 'Kwame Asante', passengers: 14, time: '7:32 AM', status: 'Completed' },
  { vehicle: 'AW-9921-XR', driver: 'Ama Mensah', passengers: 12, time: '7:28 AM', status: 'Completed' },
  { vehicle: 'GN-1053-BK', driver: 'Kofi Boateng', passengers: 16, time: '7:25 AM', status: 'In Transit' },
  { vehicle: 'GR-7732-ZD', driver: 'Esi Owusu', passengers: 11, time: '7:21 AM', status: 'Completed' },
  { vehicle: 'GS-4488-NP', driver: 'Yaw Adjei', passengers: 14, time: '7:18 AM', status: 'In Transit' },
];

const locationQueues = [
  { name: 'Kwame Nkrumah Circle', count: 23, max: 50 },
  { name: 'Kaneshie Station', count: 16, max: 40 },
  { name: 'Tema Station', count: 8, max: 30 },
];

const stats = [
  { icon: Users, label: 'In Queue', value: 47, trend: '+12%', trendUp: true, sparkData: [30, 35, 32, 40, 38, 42, 45, 47] },
  { icon: UserCheck, label: 'Served Today', value: 128, trend: '+8%', trendUp: true, sparkData: [80, 90, 95, 100, 110, 115, 120, 128] },
  { icon: Clock, label: 'Avg Wait', value: 12, trend: '-3m', trendUp: false, sparkData: [20, 18, 16, 15, 14, 13, 12, 12], suffix: 'm' },
  { icon: Car, label: 'Drivers', value: 8, trend: '+2', trendUp: true, sparkData: [3, 4, 5, 5, 6, 7, 7, 8] },
];

const dailyGoals = [
  { label: 'Passengers', current: 128, target: 200, icon: Users },
  { label: 'On-time Rate', current: 94, target: 100, icon: Timer, suffix: '%' },
  { label: 'Revenue', current: 72, target: 100, icon: BarChart3, suffix: '%' },
  { label: 'Satisfaction', current: 4.6, target: 5.0, icon: Award, isDecimal: true },
];

// ── Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-md text-sm">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-foreground">{payload[0].value} passengers in queue</p>
      </div>
    );
  }
  return null;
}

// ── Stat Card ──────────────────────────────────────────────────────────
function StatCard({ stat }: { stat: typeof stats[0] }) {
  return (
    <Card className="glass-stat">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-lg bg-cashew">
            <stat.icon className="w-4 h-4 text-foreground" />
          </div>
          <Badge
            variant="secondary"
            className={`text-[10px] gap-0 px-1.5 py-0 ${
              stat.trendUp
                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
            }`}
          >
            {stat.trendUp ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
            {stat.trend}
          </Badge>
        </div>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold tracking-tight text-foreground leading-none">
              <AnimatedCounter
                value={stat.value}
                duration={1500}
                prefix={stat.suffix === 'm' ? '~' : ''}
                suffix={stat.suffix === 'm' ? 'm' : ''}
              />
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{stat.label}</p>
          </div>
          <Sparkline data={stat.sparkData} width={56} height={24} />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Activity Feed Item ─────────────────────────────────────────────────
function ActivityFeedItem({ boarding }: { boarding: typeof recentBoardings[0] }) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-accent/30 transition-colors">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
        boarding.status === 'Completed' ? 'bg-green-500 traffic-green' : 'bg-amber-500 traffic-yellow'
      }`} />
      <span className="font-bold font-mono text-sm text-foreground whitespace-nowrap">
        {boarding.vehicle}
      </span>
      <span className="text-sm text-foreground truncate min-w-0 flex-1">
        {boarding.driver}
      </span>
      <Badge variant="secondary" className="text-[11px] bg-cashew text-foreground flex-shrink-0">
        {boarding.passengers} pax
      </Badge>
      <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:inline">
        {boarding.time}
      </span>
      <Badge
        variant="secondary"
        className={
          boarding.status === 'Completed'
            ? 'bg-cashew text-foreground text-[11px] flex-shrink-0'
            : 'bg-warm text-foreground text-[11px] flex-shrink-0'
        }
      >
        {boarding.status}
      </Badge>
    </div>
  );
}

/* ── useSyncExternalStore-based greeting (no hydration mismatch) ── */
let _greetMinute = -1;
let _greetSnap = { greeting: '', currentDate: '' };

function _getGreetingSnapshot() {
  const now = new Date();
  const minute = now.getHours() * 60 + now.getMinutes();
  if (minute !== _greetMinute) {
    _greetMinute = minute;
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const currentDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    _greetSnap = { greeting, currentDate };
  }
  return _greetSnap;
}

const _emptyGreeting = { greeting: '', currentDate: '' };
function _getServerGreetingSnapshot() { return _emptyGreeting; }

function _subscribeGreeting(cb: () => void) {
  const id = setInterval(cb, 60000);
  return () => clearInterval(id);
}

function useGreeting() {
  return useSyncExternalStore(_subscribeGreeting, _getGreetingSnapshot, _getServerGreetingSnapshot);
}

// ── Main Dashboard ─────────────────────────────────────────────────────
export function OverviewDashboard() {
  const { currentDate, greeting } = useGreeting();

  // Simulate live queue count changes
  const [liveQueueCount, setLiveQueueCount] = useState(47);
  const [liveServedCount, setLiveServedCount] = useState(128);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveQueueCount((prev) => {
        const delta = Math.random() > 0.6 ? -1 : 1;
        return Math.max(20, Math.min(80, prev + delta));
      });
      setLiveServedCount((prev) => prev + (Math.random() > 0.7 ? 1 : 0));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const liveStats = stats.map((stat, idx) => {
    if (idx === 0) return { ...stat, value: liveQueueCount };
    if (idx === 1) return { ...stat, value: liveServedCount };
    return stat;
  });

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Page Header */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {greeting || <span className="inline-block w-28 h-4 rounded bg-muted animate-pulse" />}
            </p>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-3 h-3 text-soft" />
              <p className="text-xs text-muted-foreground">
                {currentDate || <span className="inline-block w-40 h-3 rounded bg-muted animate-pulse" />}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {liveStats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      {/* Daily Goals */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-foreground" />
                Daily Goals
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">Track your daily performance targets</CardDescription>
            </div>
            <Badge variant="secondary" className="text-[11px] bg-cashew text-foreground">
              3 of 4 on track
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {dailyGoals.map((goal) => {
              const progress = (goal.current / goal.target) * 100;
              return (
                <div key={goal.label} className="flex flex-col items-center gap-2">
                  <ProgressRing
                    progress={Math.min(progress, 100)}
                    size={56}
                    strokeWidth={4}
                    color={progress >= 80 ? '#22c55e' : progress >= 50 ? '#eab308' : '#ef4444'}
                  >
                    <span className="text-[11px] font-bold text-foreground tabular-nums">
                      {goal.isDecimal ? goal.current.toFixed(1) : Math.round(progress)}
                      {goal.suffix || '%'}
                    </span>
                  </ProgressRing>
                  <div className="text-center">
                    <p className="text-[11px] font-medium text-foreground">{goal.label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {goal.isDecimal ? `${goal.current}/${goal.target}` : `${goal.current}/${goal.target}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Queue Activity */}
        <div className="lg:col-span-3">
          <Card className="glass-card h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Queue Activity</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Morning commuter queue size (today)</CardDescription>
                </div>
                <TrendingUp className="w-4 h-4 text-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={queueActivityData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="queue"
                      fill="#0c0b0b"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Channel Breakdown */}
        <div className="lg:col-span-2">
          <Card className="glass-card h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Channel Breakdown</CardTitle>
                  <CardDescription className="text-xs mt-0.5">How passengers join the queue</CardDescription>
                </div>
                <TrendingUp className="w-4 h-4 text-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-40 sm:h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      animationDuration={1200}
                      animationEasing="ease-out"
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, '']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                {channelData.map((channel) => (
                  <div key={channel.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: channel.color }} />
                    <span className="text-xs text-muted-foreground">{channel.name}</span>
                    <span className="text-xs font-medium text-foreground ml-auto">{channel.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Boardings */}
        <div className="lg:col-span-2">
          <Card className="glass-card h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Recent Boardings</CardTitle>
                  <CardDescription className="text-xs">Last 5 vehicle boarding events</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {recentBoardings.map((boarding) => (
                  <ActivityFeedItem key={boarding.vehicle} boarding={boarding} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue by Location */}
        <div>
          <Card className="glass-card h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Queue by Location</CardTitle>
              <CardDescription className="text-xs">Current queue distribution</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-5">
              {locationQueues.map((loc) => {
                const pct = (loc.count / loc.max) * 100;
                return (
                  <div key={loc.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{loc.name}</span>
                      <span className="text-sm font-semibold text-foreground">{loc.count}</span>
                    </div>
                    <div className="relative">
                      <Progress
                        value={pct}
                        className="h-2 [&>[data-slot=progress-indicator]]:bg-foreground"
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-foreground border-2 border-background"
                        style={{ left: `${pct}%`, marginLeft: '-5px' }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{loc.count} of {loc.max} capacity</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
