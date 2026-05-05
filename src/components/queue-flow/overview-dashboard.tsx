'use client';

import React, { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import {
  Users, UserCheck, Clock, Car, TrendingUp, ArrowUpRight, Activity, Flame,
  Target, Thermometer, Zap, ArrowDownRight, CheckCircle2, Timer, BarChart3,
  Calendar, Award
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { AnimatedCounter, Sparkline, ProgressRing } from '@/lib/animations';

// ── Data ───────────────────────────────────────────────────────────────
const queueActivityData = [
  { hour: '5 AM', queue: 4 },
  { hour: '6 AM', queue: 12 },
  { hour: '6:30 AM', queue: 22 },
  { hour: '7 AM', queue: 45 },
  { hour: '7:30 AM', queue: 58 },
  { hour: '8 AM', queue: 52 },
  { hour: '8:30 AM', queue: 38 },
  { hour: '9 AM', queue: 24 },
  { hour: '9:30 AM', queue: 15 },
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

const hourlyThroughput = [2, 5, 8, 12, 18, 24, 20, 16, 10, 6, 4, 3];

const stats = [
  { icon: Users, label: 'In Queue', value: 47, trend: '+12%', trendUp: true, color: 'text-foreground', sparkData: [30, 35, 32, 40, 38, 42, 45, 47] },
  { icon: UserCheck, label: 'Served Today', value: 128, trend: '+8%', trendUp: true, color: 'text-foreground', sparkData: [80, 90, 95, 100, 110, 115, 120, 128] },
  { icon: Clock, label: 'Avg Wait', value: 12, trend: '-3m', trendUp: false, color: 'text-foreground', sparkData: [20, 18, 16, 15, 14, 13, 12, 12], suffix: 'm' },
  { icon: Car, label: 'Drivers', value: 8, trend: '+2', trendUp: true, color: 'text-foreground', sparkData: [3, 4, 5, 5, 6, 7, 7, 8] },
];

// Peak hours heatmap
const peakHoursData = [
  { day: 'Mon', slot: 'Morning', intensity: 0.95 }, { day: 'Tue', slot: 'Morning', intensity: 0.90 },
  { day: 'Wed', slot: 'Morning', intensity: 0.85 }, { day: 'Thu', slot: 'Morning', intensity: 0.88 },
  { day: 'Fri', slot: 'Morning', intensity: 1.0 }, { day: 'Sat', slot: 'Morning', intensity: 0.30 },
  { day: 'Sun', slot: 'Morning', intensity: 0.15 },
  { day: 'Mon', slot: 'Midday', intensity: 0.35 }, { day: 'Tue', slot: 'Midday', intensity: 0.30 },
  { day: 'Wed', slot: 'Midday', intensity: 0.40 }, { day: 'Thu', slot: 'Midday', intensity: 0.32 },
  { day: 'Fri', slot: 'Midday', intensity: 0.45 }, { day: 'Sat', slot: 'Midday', intensity: 0.55 },
  { day: 'Sun', slot: 'Midday', intensity: 0.25 },
  { day: 'Mon', slot: 'Evening', intensity: 0.92 }, { day: 'Tue', slot: 'Evening', intensity: 0.88 },
  { day: 'Wed', slot: 'Evening', intensity: 0.82 }, { day: 'Thu', slot: 'Evening', intensity: 0.86 },
  { day: 'Fri', slot: 'Evening', intensity: 0.98 }, { day: 'Sat', slot: 'Evening', intensity: 0.50 },
  { day: 'Sun', slot: 'Evening', intensity: 0.20 },
  { day: 'Mon', slot: 'Night', intensity: 0.25 }, { day: 'Tue', slot: 'Night', intensity: 0.20 },
  { day: 'Wed', slot: 'Night', intensity: 0.28 }, { day: 'Thu', slot: 'Night', intensity: 0.22 },
  { day: 'Fri', slot: 'Night', intensity: 0.40 }, { day: 'Sat', slot: 'Night', intensity: 0.60 },
  { day: 'Sun', slot: 'Night', intensity: 0.30 },
];
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const timeSlots = [
  { label: 'Morning', sub: '5-9 AM' },
  { label: 'Midday', sub: '9 AM-3 PM' },
  { label: 'Evening', sub: '3-7 PM' },
  { label: 'Night', sub: '7-11 PM' },
];

// Daily goals
const dailyGoals = [
  { label: 'Passengers', current: 128, target: 200, icon: Users },
  { label: 'On-time Rate', current: 94, target: 100, icon: Timer, suffix: '%' },
  { label: 'Revenue', current: 72, target: 100, icon: BarChart3, suffix: '%' },
  { label: 'Satisfaction', current: 4.6, target: 5.0, icon: Award, isDecimal: true },
];

// Weather / conditions
const conditions = [
  { label: 'Weather', value: 'Sunny 32C', icon: Thermometer, color: 'text-amber-500' },
  { label: 'Traffic', value: 'Heavy', icon: Car, color: 'text-red-400' },
  { label: 'Peak Mode', value: 'Morning Rush', icon: Zap, color: 'text-green-500' },
];

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

// ── Stat Card with Animation ───────────────────────────────────────────
function AnimatedStatCard({ stat, index }: { stat: typeof stats[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
    >
      <Card className="glass-stat hover-lift ripple-container cursor-default">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-cashew">
              <stat.icon className="w-4 h-4 text-foreground" />
            </div>
            <div className="flex items-center gap-1.5">
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
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold tracking-tight text-foreground leading-none">
                <AnimatedCounter value={stat.value} duration={1500} prefix={stat.suffix === 'm' ? '~' : ''} suffix={stat.suffix === 'm' ? 'm' : ''} />
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{stat.label}</p>
            </div>
            <Sparkline data={stat.sparkData} width={56} height={24} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Live Activity Feed Item ────────────────────────────────────────────
function ActivityFeedItem({ boarding, index }: { boarding: typeof recentBoardings[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
      className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/60 bg-card hover:bg-accent/30 transition-colors hover-lift"
    >
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
    </motion.div>
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

export function OverviewDashboard() {
  const { currentDate, greeting } = useGreeting();

  return (
    <div className="space-y-4">
      {/* Page Header with Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{greeting || <span className="inline-block w-28 h-4 rounded bg-muted animate-pulse" />}</p>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-3 h-3 text-soft" />
              <p className="text-xs text-muted-foreground">{currentDate || <span className="inline-block w-40 h-3 rounded bg-muted animate-pulse" />}</p>
            </div>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-stat"
          >
            <Activity className="w-3.5 h-3.5 text-green-500" />
            <span className="text-xs font-medium text-foreground">All systems normal</span>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Conditions Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1"
      >
        {conditions.map((c, idx) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + idx * 0.05 }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-stat flex-shrink-0"
          >
            <c.icon className={`w-3.5 h-3.5 ${c.color}`} />
            <div>
              <p className="text-[10px] text-muted-foreground">{c.label}</p>
              <p className="text-[11px] font-semibold text-foreground">{c.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Top Stats Grid with Animated Counters ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat, idx) => (
          <AnimatedStatCard key={stat.label} stat={stat} index={idx} />
        ))}
      </div>

      {/* ── Daily Goals ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
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
              {dailyGoals.map((goal, idx) => {
                const progress = goal.isDecimal
                  ? (goal.current / goal.target) * 100
                  : (goal.current / goal.target) * 100;
                return (
                  <motion.div
                    key={goal.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + idx * 0.08 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <ProgressRing
                      progress={Math.min(progress, 100)}
                      size={56}
                      strokeWidth={4}
                      color={progress >= 80 ? '#22c55e' : progress >= 50 ? '#eab308' : '#ef4444'}
                    >
                      <span className="text-[11px] font-bold text-foreground tabular-nums">
                        {goal.isDecimal ? goal.current.toFixed(1) : Math.round((goal.current / goal.target) * 100)}
                        {goal.suffix || '%'}
                      </span>
                    </ProgressRing>
                    <div className="text-center">
                      <p className="text-[11px] font-medium text-foreground">{goal.label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {goal.isDecimal ? `${goal.current}/${goal.target}` : `${goal.current}/${goal.target}`}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Queue Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-3"
        >
          <Card className="glass-card h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Queue Activity</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Morning commuter queue size (today)</CardDescription>
                </div>
                <Activity className="w-4 h-4 text-foreground" />
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
        </motion.div>

        {/* Channel Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2"
        >
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
        </motion.div>
      </div>

      {/* ── Throughput Sparkline Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-foreground" />
                  Hourly Throughput
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">Passengers processed per hour (today)</CardDescription>
              </div>
              <Badge variant="secondary" className="text-[11px] bg-green-500/10 text-green-600 dark:text-green-400">
                <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" />
                +18% vs avg
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyThroughput.map((v, i) => ({ hour: `${6 + i}AM`, throughput: v }))} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0c0b0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0c0b0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="throughput"
                    stroke="#0c0b0b"
                    strokeWidth={2}
                    fill="url(#throughputGrad)"
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Boarding Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="lg:col-span-2"
        >
          <Card className="glass-card h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Recent Boardings</CardTitle>
                  <CardDescription className="text-xs">Last 5 vehicle boarding events</CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-foreground"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {recentBoardings.map((boarding, idx) => (
                  <ActivityFeedItem key={boarding.vehicle} boarding={boarding} index={idx} />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Queue by Location */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="glass-card h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Queue by Location</CardTitle>
              <CardDescription className="text-xs">Current queue distribution</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-5">
              {locationQueues.map((loc, idx) => {
                const pct = (loc.count / loc.max) * 100;
                return (
                  <motion.div
                    key={loc.name}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.95 + idx * 0.08 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{loc.name}</span>
                      <span className="text-sm font-semibold text-foreground">{loc.count}</span>
                    </div>
                    <div className="relative">
                      <Progress
                        value={pct}
                        className="h-2 [&>[data-slot=progress-indicator]]:bg-foreground"
                      />
                      <motion.div
                        className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-foreground border-2 border-background"
                        style={{ left: `${pct}%`, marginLeft: '-5px' }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.2 + idx * 0.1, type: 'spring', stiffness: 400 }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{loc.count} of {loc.max} capacity</p>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Peak Hours Heatmap ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Flame className="w-4 h-4 text-foreground" />
                  Peak Hours Analysis
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">Queue intensity by day and time slot (weekly average)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <div className="min-w-[560px]">
                {/* Header */}
                <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-1.5 mb-1.5">
                  <div className="text-xs text-muted-foreground" />
                  {days.map((day) => (
                    <div key={day} className="text-xs font-semibold text-foreground text-center py-1">{day}</div>
                  ))}
                </div>
                {/* Rows */}
                {timeSlots.map((slot) => (
                  <div key={slot.label} className="grid grid-cols-[100px_repeat(7,1fr)] gap-1.5 mb-1.5">
                    <div className="flex flex-col justify-center pr-2">
                      <span className="text-xs font-medium text-foreground leading-tight">{slot.label}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">{slot.sub}</span>
                    </div>
                    {days.map((day, dayIdx) => {
                      const cell = peakHoursData.find((d) => d.day === day && d.slot === slot.label);
                      const intensity = cell?.intensity ?? 0;
                      const opacity = Math.max(0.05, intensity);
                      const percentage = Math.round(intensity * 100);
                      return (
                        <motion.div
                          key={`${day}-${slot.label}`}
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.1 + (dayIdx + timeSlots.indexOf(slot)) * 0.02, duration: 0.3 }}
                          whileHover={{ scale: 1.1 }}
                          className="relative min-h-[32px] h-10 rounded-lg flex items-center justify-center cursor-default group transition-transform"
                          style={{ backgroundColor: `rgba(12, 11, 11, ${opacity})` }}
                        >
                          <span className={`text-[11px] font-semibold ${opacity > 0.5 ? 'text-background' : 'text-foreground'}`}>
                            {percentage}%
                          </span>
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover border border-border rounded-md px-2 py-1 shadow-lg z-10 whitespace-nowrap">
                            <span className="text-[10px] text-foreground">{day} {slot.label}: {percentage}% load</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
                {/* Legend */}
                <div className="flex items-center justify-end gap-2 mt-3">
                  <span className="text-[10px] text-muted-foreground">Low</span>
                  <div className="flex gap-0.5">
                    {[0.05, 0.25, 0.45, 0.65, 0.85, 1.0].map((val) => (
                      <div key={val} className="w-5 h-3 rounded-sm" style={{ backgroundColor: `rgba(12, 11, 11, ${val})` }} />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">High</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
