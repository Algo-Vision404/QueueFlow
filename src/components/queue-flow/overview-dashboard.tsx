'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Clock, Car, TrendingUp, ArrowUpRight, Activity, Flame } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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

const stats = [
  { icon: Users, label: 'Total in Queue', value: '47', trend: '+12%', trendLabel: 'vs yesterday', color: 'text-foreground' },
  { icon: UserCheck, label: 'Total Served Today', value: '128', trend: '+8%', trendLabel: 'vs yesterday', color: 'text-foreground' },
  { icon: Clock, label: 'Avg Wait Time', value: '~12 min', trend: '-3 min', trendLabel: 'vs yesterday', color: 'text-foreground' },
  { icon: Car, label: 'Active Drivers', value: '8', trend: '+2', trendLabel: 'from last hour', color: 'text-foreground' },
];

// Peak hours heatmap data: 7 days x 4 time slots
// Values represent intensity (0-1 scale) for realistic commuting patterns
const peakHoursData = [
  // Morning (5-9AM)
  { day: 'Mon', slot: 'Morning', intensity: 0.95 },
  { day: 'Tue', slot: 'Morning', intensity: 0.90 },
  { day: 'Wed', slot: 'Morning', intensity: 0.85 },
  { day: 'Thu', slot: 'Morning', intensity: 0.88 },
  { day: 'Fri', slot: 'Morning', intensity: 1.0 },
  { day: 'Sat', slot: 'Morning', intensity: 0.30 },
  { day: 'Sun', slot: 'Morning', intensity: 0.15 },
  // Midday (9AM-3PM)
  { day: 'Mon', slot: 'Midday', intensity: 0.35 },
  { day: 'Tue', slot: 'Midday', intensity: 0.30 },
  { day: 'Wed', slot: 'Midday', intensity: 0.40 },
  { day: 'Thu', slot: 'Midday', intensity: 0.32 },
  { day: 'Fri', slot: 'Midday', intensity: 0.45 },
  { day: 'Sat', slot: 'Midday', intensity: 0.55 },
  { day: 'Sun', slot: 'Midday', intensity: 0.25 },
  // Evening (3-7PM)
  { day: 'Mon', slot: 'Evening', intensity: 0.92 },
  { day: 'Tue', slot: 'Evening', intensity: 0.88 },
  { day: 'Wed', slot: 'Evening', intensity: 0.82 },
  { day: 'Thu', slot: 'Evening', intensity: 0.86 },
  { day: 'Fri', slot: 'Evening', intensity: 0.98 },
  { day: 'Sat', slot: 'Evening', intensity: 0.50 },
  { day: 'Sun', slot: 'Evening', intensity: 0.20 },
  // Night (7PM-11PM)
  { day: 'Mon', slot: 'Night', intensity: 0.25 },
  { day: 'Tue', slot: 'Night', intensity: 0.20 },
  { day: 'Wed', slot: 'Night', intensity: 0.28 },
  { day: 'Thu', slot: 'Night', intensity: 0.22 },
  { day: 'Fri', slot: 'Night', intensity: 0.40 },
  { day: 'Sat', slot: 'Night', intensity: 0.60 },
  { day: 'Sun', slot: 'Night', intensity: 0.30 },
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const timeSlots = [
  { label: 'Morning', sub: '5 - 9 AM' },
  { label: 'Midday', sub: '9 AM - 3 PM' },
  { label: 'Evening', sub: '3 - 7 PM' },
  { label: 'Night', sub: '7 - 11 PM' },
];

function getIntensityColor(intensity: number): string {
  // Returns an opacity class for the foreground color
  const opacity = Math.max(0.05, intensity).toFixed(2);
  return `bg-foreground/[${opacity}]`;
}

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

function PieLabel({ name, value }: { name: string; value: number }) {
  return (
    <text x={0} y={0} textAnchor="middle" dominantBaseline="central" className="fill-foreground text-xs font-medium">
      {name}
    </text>
  );
}

export function OverviewDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time queue metrics and performance analytics</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="glass-stat hover:border-border transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl bg-cashew`}>
                  <stat.icon className="w-5 h-5 text-foreground" />
                </div>
                <Badge variant="secondary" className="text-foreground bg-cashew text-[11px] gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  {stat.trend}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">{stat.trendLabel}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Queue Activity Chart */}
        <Card className="glass-card lg:col-span-3">
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
            <div className="h-64">
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
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Channel Breakdown */}
        <Card className="glass-card lg:col-span-2">
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
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
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

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Boarding Sessions */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Boarding Sessions</CardTitle>
            <CardDescription className="text-xs">Last 5 vehicle boarding events</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Vehicle Plate</TableHead>
                  <TableHead className="text-xs">Driver</TableHead>
                  <TableHead className="text-xs text-center">Passengers</TableHead>
                  <TableHead className="text-xs">Time</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBoardings.map((boarding) => (
                  <TableRow key={boarding.vehicle}>
                    <TableCell className="text-sm font-medium font-mono">{boarding.vehicle}</TableCell>
                    <TableCell className="text-sm">{boarding.driver}</TableCell>
                    <TableCell className="text-sm text-center">{boarding.passengers}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{boarding.time}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          boarding.status === 'Completed'
                            ? 'bg-cashew text-foreground text-[11px]'
                            : 'bg-warm text-foreground text-[11px]'
                        }
                      >
                        {boarding.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Queue by Location */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Queue by Location</CardTitle>
            <CardDescription className="text-xs">Current queue distribution</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-5">
            {locationQueues.map((loc) => (
              <div key={loc.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{loc.name}</span>
                  <span className="text-sm font-semibold text-foreground">{loc.count}</span>
                </div>
                <Progress value={(loc.count / loc.max) * 100} className="h-2 [&>[data-slot=progress-indicator]]:bg-foreground" />
                <p className="text-[11px] text-muted-foreground">{loc.count} of {loc.max} capacity</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Peak Hours Analysis */}
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
              {/* Header row with day labels */}
              <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-1.5 mb-1.5">
                <div className="text-xs text-muted-foreground" />
                {days.map((day) => (
                  <div key={day} className="text-xs font-semibold text-foreground text-center py-1">
                    {day}
                  </div>
                ))}
              </div>
              {/* Heatmap rows */}
              {timeSlots.map((slot) => (
                <div key={slot.label} className="grid grid-cols-[100px_repeat(7,1fr)] gap-1.5 mb-1.5">
                  <div className="flex flex-col justify-center pr-2">
                    <span className="text-xs font-medium text-foreground leading-tight">{slot.label}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{slot.sub}</span>
                  </div>
                  {days.map((day) => {
                    const cell = peakHoursData.find(
                      (d) => d.day === day && d.slot === slot.label
                    );
                    const intensity = cell?.intensity ?? 0;
                    const opacity = Math.max(0.05, intensity);
                    const percentage = Math.round(intensity * 100);
                    return (
                      <div
                        key={`${day}-${slot.label}`}
                        className="relative h-12 rounded-lg flex items-center justify-center transition-transform hover:scale-105 cursor-default group"
                        style={{
                          backgroundColor: `rgba(12, 11, 11, ${opacity})`,
                        }}
                      >
                        <span
                          className={`text-[11px] font-semibold ${
                            opacity > 0.5 ? 'text-background' : 'text-foreground'
                          }`}
                        >
                          {percentage}%
                        </span>
                        {/* Tooltip on hover */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-popover border border-border rounded-md px-2 py-1 shadow-lg z-10 whitespace-nowrap">
                          <span className="text-[10px] text-foreground">
                            {day} {slot.label}: {percentage}% load
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center justify-end gap-2 mt-3">
                <span className="text-[10px] text-muted-foreground">Low</span>
                <div className="flex gap-0.5">
                  {[0.05, 0.25, 0.45, 0.65, 0.85, 1.0].map((val) => (
                    <div
                      key={val}
                      className="w-5 h-3 rounded-sm"
                      style={{ backgroundColor: `rgba(12, 11, 11, ${val})` }}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">High</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
