'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Server, Database, Users, Truck, UserCheck, Activity, Clock,
  Wifi, WifiOff, HardDrive, RefreshCw, CheckCircle, AlertTriangle,
  Layers, Zap, Globe, Phone, MessageSquare, Headphones,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AnimatedCounter } from '@/lib/animations';

interface SystemHealth {
  status: string;
  uptime: number;
  uptimeHuman: string;
  dbLatency: number;
  timestamp: string;
}

interface SystemData {
  success: boolean;
  health: SystemHealth;
  database: Record<string, number>;
  live: {
    todayEntries: number;
    todayBoarded: number;
    todayActive: number;
    activeSessions: number;
    availableDrivers: number;
    boardingDrivers: number;
    activeQueues: number;
    channelBreakdown: { channel: string; count: number }[];
    statusBreakdown: { status: string; count: number }[];
    driverBreakdown: { status: string; count: number }[];
  };
  locations: Array<{
    id: string; name: string; isActive: boolean; capacity: number;
    queues: Array<{ id: string; status: string; entries: Array<{ status: string }> }>;
  }>;
  recentActivity: Array<{ id: string; action: string; actorType: string; createdAt: string }>;
}

const statusColors: Record<string, string> = {
  waiting: 'bg-cashew text-foreground',
  called: 'bg-linen text-foreground dark:bg-linen dark:text-foreground',
  boarding: 'bg-warm text-foreground',
  boarded: 'bg-foreground text-primary-foreground',
  expired: 'bg-destructive/10 text-destructive',
  cancelled: 'bg-muted text-muted-foreground',
};

const channelIcons: Record<string, React.ReactNode> = {
  ussd: <Phone className="w-3.5 h-3.5" />,
  sms: <MessageSquare className="w-3.5 h-3.5" />,
  web: <Globe className="w-3.5 h-3.5" />,
  agent: <UserCheck className="w-3.5 h-3.5" />,
  ivr: <Headphones className="w-3.5 h-3.5" />,
};

export function ArchitectureView() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/system');
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cashew">
            <Activity className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">System Monitor</h2>
            <p className="text-sm text-muted-foreground">Live health, metrics & diagnostics</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 rounded-xl hover:bg-accent transition-colors active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!data && !loading && (
        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <WifiOff className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Unable to connect to system</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* Health Banner */}
          <Card className={`glass-card ${data.health.status === 'healthy' ? 'border-green-500/30' : 'border-destructive/30'}`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${data.health.status === 'healthy' ? 'traffic-green bg-green-500' : 'bg-destructive'}`} />
                <span className="text-sm font-semibold">
                  System {data.health.status === 'healthy' ? 'Operational' : 'Degraded'}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">Uptime: {data.health.uptimeHuman}</span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>DB latency: {data.health.dbLatency}ms</span>
                <span>Last refresh: {lastRefresh}</span>
              </div>
            </CardContent>
          </Card>

          {/* Live Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={<Users className="w-4 h-4" />} label="In Queue" value={data.live.todayActive} />
            <StatCard icon={<CheckCircle className="w-4 h-4" />} label="Served Today" value={data.live.todayBoarded} />
            <StatCard icon={<Truck className="w-4 h-4" />} label="Available Drivers" value={data.live.availableDrivers} />
            <StatCard icon={<Activity className="w-4 h-4" />} label="Active Sessions" value={data.live.activeSessions} />
          </div>

          {/* Channel & Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Channel Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.live.channelBreakdown.length > 0 ? data.live.channelBreakdown.map(c => (
                    <div key={c.channel} className="flex items-center gap-2">
                      <span className="text-muted-foreground">{channelIcons[c.channel] || <Layers className="w-3.5 h-3.5" />}</span>
                      <span className="text-sm capitalize flex-1">{c.channel}</span>
                      <span className="text-sm font-mono font-medium">{c.count}</span>
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-foreground transition-all duration-500"
                          style={{ width: `${Math.min(100, (c.count / Math.max(...data.live.channelBreakdown.map(x => x.count))) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground">No data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Entry Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.live.statusBreakdown.length > 0 ? data.live.statusBreakdown.map(s => (
                    <Badge key={s.status} variant="outline" className={`${statusColors[s.status] || 'bg-muted'} text-[11px]`}>
                      {s.status}: {s.count}
                    </Badge>
                  )) : (
                    <p className="text-xs text-muted-foreground">No data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Driver Status */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Truck className="w-4 h-4" /> Driver Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {data.live.driverBreakdown.map(d => (
                  <div key={d.status} className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">{d.count}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{d.status}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Locations */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Server className="w-4 h-4" /> Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.locations.map(loc => {
                  const entries = loc.queues.flatMap(q => q.entries);
                  const active = entries.filter(e => e.status === 'waiting' || e.status === 'called').length;
                  return (
                    <div key={loc.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${loc.isActive ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                        <span className="text-sm font-medium">{loc.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{active}/{loc.capacity}</span>
                        {loc.queues.length > 0 && (
                          <Badge variant="outline" className={`text-[10px] ${loc.queues[0].status === 'active' ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : ''}`}>
                            {loc.queues[0].status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
                {data.locations.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">No locations configured</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Database Records */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="w-4 h-4" /> Database Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 lg:grid-cols-5 gap-2">
                {Object.entries(data.database).map(([key, value]) => (
                  <div key={key} className="p-2 rounded-lg bg-muted/30 text-center">
                    <p className="text-sm font-bold font-mono">{value}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="glass-card glass-stat">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <AnimatedCounter value={value} className="text-2xl font-bold" />
      </CardContent>
    </Card>
  );
}
