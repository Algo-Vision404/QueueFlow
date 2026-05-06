'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  DollarSign, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight,
  RefreshCw, CheckCircle, XCircle, Clock, Hash,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, LineChart, Line, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AnimatedCounter } from '@/lib/animations';

interface RevenueData {
  success: boolean;
  revenue: {
    total: number;
    byType: Array<{ type: string; total: number; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
    trend: Array<{ date: string; revenue: number; count: number }>;
    recent: Array<{
      id: string; type: string; amount: number; currency: string;
      status: string; description: string; createdAt: string;
    }>;
  };
}

const CHART_COLORS = ['#0c0b0b', '#979585', '#dddbca', '#b8a88a', '#e9e6d7'];
const typeLabels: Record<string, string> = {
  passenger_fee: 'Passenger Fee',
  driver_fee: 'Driver Fee',
  agent_commission: 'Agent Commission',
  premium: 'Premium',
};

const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  completed: { icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-green-600' },
  pending: { icon: <Clock className="w-3.5 h-3.5" />, color: 'text-yellow-600' },
  failed: { icon: <XCircle className="w-3.5 h-3.5" />, color: 'text-destructive' },
  refunded: { icon: <ArrowDownRight className="w-3.5 h-3.5" />, color: 'text-muted-foreground' },
};

export function MonetizationView() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/revenue');
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cashew"><DollarSign className="w-5 h-5" /></div>
          <div><h2 className="text-xl font-bold">Revenue Analytics</h2></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <Card key={i} className="glass-card"><CardContent className="p-4"><div className="shimmer h-16 rounded-lg" /></CardContent></Card>)}
        </div>
      </div>
    );
  }

  if (!data || !data.success) return null;

  const { total, byType, byStatus, trend, recent } = data.revenue;
  const completedCount = byStatus.find(s => s.status === 'completed')?.count || 0;
  const failedCount = byStatus.find(s => s.status === 'failed')?.count || 0;
  const pieData = byType.map(t => ({ name: typeLabels[t.type] || t.type, value: t.total, count: t.count }));
  const trendChart = trend.map(t => ({ ...t, date: new Date(t.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }) }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cashew">
            <DollarSign className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Revenue Analytics</h2>
            <p className="text-sm text-muted-foreground">Transaction data & financial insights</p>
          </div>
        </div>
        <button onClick={fetchData} className="p-2 rounded-xl hover:bg-accent transition-colors active:scale-95">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="glass-card glass-stat">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
              <DollarSign className="w-3.5 h-3.5" /><span className="text-xs">Total Revenue</span>
            </div>
            <p className="text-xl font-bold">
              GHS <AnimatedCounter value={Math.round(total * 100)} duration={800} />.{String(Math.round((total % 1) * 100)).padStart(2, '0')}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card glass-stat">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
              <CheckCircle className="w-3.5 h-3.5" /><span className="text-xs">Completed</span>
            </div>
            <p className="text-xl font-bold"><AnimatedCounter value={completedCount} /></p>
          </CardContent>
        </Card>
        <Card className="glass-card glass-stat">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
              <CreditCard className="w-3.5 h-3.5" /><span className="text-xs">Avg Transaction</span>
            </div>
            <p className="text-xl font-bold">
              GHS {completedCount > 0 ? (total / completedCount).toFixed(2) : '0.00'}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card glass-stat">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
              <XCircle className="w-3.5 h-3.5" /><span className="text-xs">Failed</span>
            </div>
            <p className="text-xl font-bold"><AnimatedCounter value={failedCount} /></p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Trend */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Revenue Trend
            </CardTitle>
            <CardDescription className="text-xs">Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={v => `GHS ${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(value: number) => [`GHS ${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="var(--foreground)" strokeWidth={2} dot={{ fill: 'var(--foreground)', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Type */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Revenue by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }}
                      formatter={(value: number) => [`GHS ${value.toFixed(2)}`, 'Revenue']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground mx-auto">No revenue data</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-[10px]">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-medium">GHS {d.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Volume Chart */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Hash className="w-4 h-4" /> Transaction Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendChart}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="count" fill="var(--foreground)" radius={[4, 4, 0, 0]} maxBarSize={32} name="Transactions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 px-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-[10px]">Type</TableHead>
                  <TableHead className="text-[10px]">Amount</TableHead>
                  <TableHead className="text-[10px]">Status</TableHead>
                  <TableHead className="text-[10px] hidden sm:table-cell">Description</TableHead>
                  <TableHead className="text-[10px] text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map(tx => {
                  const sc = statusConfig[tx.status] || statusConfig.pending;
                  return (
                    <TableRow key={tx.id} className="hover:bg-muted/20">
                      <TableCell className="text-xs capitalize">{typeLabels[tx.type] || tx.type}</TableCell>
                      <TableCell className="text-xs font-mono font-medium">GHS {tx.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${sc.color}`}>
                          {sc.icon}
                          <span className="text-[10px] capitalize">{tx.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell max-w-[150px] truncate">{tx.description}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground text-right">
                        {new Date(tx.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
