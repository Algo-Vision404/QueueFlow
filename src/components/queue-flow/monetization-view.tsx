'use client';

import React from 'react';
import {
  DollarSign, TrendingUp, Target, Calendar, Zap, Star, Crown,
  ChevronRight, CheckCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const costBreakdownData = [
  { category: 'USSD/SMS Telecom', cost: 180, color: '#059669' },
  { category: 'Agent Salaries', cost: 300, color: '#10b981' },
  { category: 'Cloud Infrastructure', cost: 50, color: '#34d399' },
  { category: 'Display/Signage', cost: 20, color: '#6ee7b7' },
  { category: 'Maintenance', cost: 30, color: '#a7f3d0' },
];

const revenueProjectionsData = [
  { month: 'Month 1', locations: 1, revenue: 405 },
  { month: 'Month 2', locations: 2, revenue: 810 },
  { month: 'Month 3', locations: 3, revenue: 1350 },
  { month: 'Month 4', locations: 5, revenue: 2250 },
  { month: 'Month 5', locations: 8, revenue: 3600 },
  { month: 'Month 6', locations: 10, revenue: 4500 },
];

const scalingData = [
  { locations: 1, dailyPassengers: 300, dailyRevenue: 27, monthlyRevenue: 810, monthlyCosts: 580, profit: 230 },
  { locations: 5, dailyPassengers: 1500, dailyRevenue: 135, monthlyRevenue: 4050, monthlyCosts: 1800, profit: 2250 },
  { locations: 10, dailyPassengers: 3000, dailyRevenue: 270, monthlyRevenue: 8100, monthlyCosts: 3200, profit: 4900 },
  { locations: 25, dailyPassengers: 7500, dailyRevenue: 675, monthlyRevenue: 20250, monthlyCosts: 7500, profit: 12750 },
];

const revenueCards = [
  { icon: DollarSign, label: 'Daily Revenue', value: '$45', subtext: 'Per location', color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/40' },
  { icon: TrendingUp, label: 'Monthly Revenue', value: '$1,350', subtext: 'At 1 location', color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/40' },
  { icon: Target, label: 'Profit Margin', value: '62%', subtext: 'Net after costs', color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/40' },
  { icon: Calendar, label: 'Break-even', value: '3 months', subtext: 'At 1 location', color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/40' },
];

const unitEconomics = [
  { item: 'Revenue per passenger', value: '$0.15', note: 'Embedded in fare', type: 'revenue' },
  { item: 'USSD session cost', value: '$0.02', note: 'Per USSD interaction', type: 'cost' },
  { item: 'SMS notification cost', value: '$0.01', note: 'Per SMS sent', type: 'cost' },
  { item: 'Agent commission per boarding', value: '$0.03', note: 'Per passenger boarded', type: 'cost' },
  { item: 'Driver fee per trip', value: '$0.50', note: 'Per completed trip', type: 'cost' },
  { item: 'Net revenue per passenger', value: '$0.09', note: 'After direct costs', type: 'profit' },
  { item: 'Daily passengers (1 location)', value: '~300', note: 'Based on current volume', type: 'metric' },
  { item: 'Daily net revenue', value: '~$27', note: 'Per location', type: 'profit' },
];

const pricingTiers = [
  {
    name: 'Basic',
    icon: Zap,
    channel: 'USSD',
    price: 'Free for passengers',
    revenue: '$0.15 embedded in fare',
    features: ['USSD queue join', 'Position updates via USSD', 'Basic queue info', 'No smartphone needed'],
    color: 'border-emerald-200 dark:border-emerald-900',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
  {
    name: 'Standard',
    icon: Star,
    channel: 'SMS + Notifications',
    price: '$0.05/passenger',
    revenue: '$0.20 total per passenger',
    features: ['SMS notifications', 'Queue position alerts', 'Estimated wait time', 'Boarding confirmation', 'Multi-channel support'],
    color: 'border-emerald-300 dark:border-emerald-800',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    recommended: true,
  },
  {
    name: 'Premium',
    icon: Crown,
    channel: 'Web App + Priority',
    price: '$0.15/passenger',
    revenue: '$0.30 total per passenger',
    features: ['Web/mobile app', 'Priority queue placement', 'Real-time tracking', 'Trip history', 'Digital receipts', 'Priority boarding'],
    color: 'border-emerald-400 dark:border-emerald-700',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string; color?: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-md text-sm">
        <p className="font-medium text-foreground">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="text-xs mt-0.5">
            {p.name}: ${p.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function MonetizationView() {
  const totalMonthlyCost = costBreakdownData.reduce((sum, d) => sum + d.cost, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Monetization & Financial Model</h1>
        <p className="text-muted-foreground mt-1">Revenue streams, cost structure, and scaling economics</p>
      </div>

      {/* Revenue Model Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {revenueCards.map((card) => (
          <Card key={card.label} className="border-border/60 hover:border-emerald-200 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${card.bgColor}`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">{card.subtext}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Unit Economics + Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unit Economics Table */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Unit Economics</CardTitle>
            <CardDescription className="text-xs">Per-passenger financial breakdown</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Item</TableHead>
                  <TableHead className="text-xs text-right">Value</TableHead>
                  <TableHead className="text-xs">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unitEconomics.map((row) => (
                  <TableRow key={row.item}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        {row.type === 'revenue' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                        {row.type === 'cost' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        )}
                        {row.type === 'profit' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        )}
                        {row.type === 'metric' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        )}
                        <span className={
                          row.item === 'Net revenue per passenger' || row.item === 'Daily net revenue'
                            ? 'font-semibold text-foreground'
                            : 'text-muted-foreground'
                        }>
                          {row.item}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-right font-medium font-mono">
                      <span className={
                        row.type === 'profit'
                          ? 'text-emerald-600'
                          : row.type === 'cost'
                            ? 'text-red-500'
                            : 'text-foreground'
                      }>
                        {row.value}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.note}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Cost Breakdown Chart */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Monthly Cost Breakdown</CardTitle>
                <CardDescription className="text-xs mt-0.5">Total: ${totalMonthlyCost}/month (1 location)</CardDescription>
              </div>
              <Badge variant="secondary" className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 text-[11px]">
                ${totalMonthlyCost}/mo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costBreakdownData} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    width={115}
                  />
                  <Tooltip
                    formatter={(value: number) => [`$${value}`, 'Cost']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="cost" radius={[0, 4, 4, 0]} maxBarSize={28}>
                    {costBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Projections */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Revenue Projections</CardTitle>
              <CardDescription className="text-xs mt-0.5">Monthly revenue as locations scale from 1 to 10</CardDescription>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueProjectionsData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Monthly Revenue"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ fill: '#059669', r: 4 }}
                  activeDot={{ r: 6, fill: '#059669' }}
                />
                <Line
                  type="stepAfter"
                  dataKey="locations"
                  name="Locations"
                  stroke="#6ee7b7"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#6ee7b7', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Strategy */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Pricing Strategy</h2>
        <p className="text-sm text-muted-foreground mb-4">Three service tiers for different passenger segments</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pricingTiers.map((tier) => (
            <Card key={tier.name} className={`relative border ${tier.color} ${tier.recommended ? 'ring-1 ring-emerald-500 shadow-sm' : ''}`}>
              {tier.recommended && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-emerald-600 text-white text-[10px] px-2.5 py-0.5">
                    Recommended
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-3 pt-5">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${tier.iconBg}`}>
                    <tier.icon className={`w-4 h-4 ${tier.iconColor}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">{tier.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{tier.channel}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xl font-bold text-foreground">{tier.price}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{tier.revenue}</p>
                </div>
                <Separator />
                <ul className="space-y-2">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Scaling Economics */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Scaling Economics</CardTitle>
          <CardDescription className="text-xs">Revenue and cost projections at scale</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Locations</TableHead>
                  <TableHead className="text-xs text-center">Daily Passengers</TableHead>
                  <TableHead className="text-xs text-center">Daily Revenue</TableHead>
                  <TableHead className="text-xs text-center">Monthly Revenue</TableHead>
                  <TableHead className="text-xs text-center">Monthly Costs</TableHead>
                  <TableHead className="text-xs text-center">Monthly Profit</TableHead>
                  <TableHead className="text-xs text-center">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scalingData.map((row) => {
                  const margin = Math.round((row.profit / row.monthlyRevenue) * 100);
                  return (
                    <TableRow key={row.locations}>
                      <TableCell className="text-sm font-medium">
                        <Badge variant="secondary" className="font-mono">
                          {row.locations} {row.locations === 1 ? 'location' : 'locations'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-center font-mono">
                        {row.dailyPassengers.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-center font-mono text-emerald-600">
                        ${row.dailyRevenue}
                      </TableCell>
                      <TableCell className="text-sm text-center font-mono text-emerald-600 font-medium">
                        ${row.monthlyRevenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-center font-mono text-red-500">
                        ${row.monthlyCosts.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-center font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                        ${row.profit.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[11px]"
                        >
                          {margin}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/50">
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              <strong>Key Insight:</strong> Profit margins increase from 28% at 1 location to 63% at 25 locations due to economies of scale. Fixed costs (cloud, maintenance) are distributed across more locations while variable costs grow linearly.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
