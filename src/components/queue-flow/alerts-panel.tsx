'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  AlertTriangle, WifiOff, Users, Clock, Shield, Truck,
  RefreshCw, CheckCircle, XCircle, Zap, Activity, AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Alert {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedId?: string;
  affectedName?: string;
  detectedAt: string;
  actionable: boolean;
  actionLabel?: string;
}

interface AlertsResponse {
  success: boolean;
  alerts: Alert[];
  summary: { critical: number; high: number; medium: number; low: number; total: number };
  scannedAt: string;
}

const severityConfig: Record<string, { bg: string; border: string; dot: string; label: string }> = {
  critical: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', dot: 'bg-red-500', label: 'Critical' },
  high: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', dot: 'bg-orange-500', label: 'High' },
  medium: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', dot: 'bg-yellow-500', label: 'Medium' },
  low: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500', label: 'Low' },
};

const typeIcons: Record<string, React.ReactNode> = {
  expired_ticket: <Clock className="w-4 h-4" />,
  no_show: <Users className="w-4 h-4" />,
  stalled_boarding: <Truck className="w-4 h-4" />,
  offline_driver: <WifiOff className="w-4 h-4" />,
  capacity_warning: <Activity className="w-4 h-4" />,
  failed_payments: <AlertCircle className="w-4 h-4" />,
  no_drivers: <Truck className="w-4 h-4" />,
};

export function EdgeCasesView() {
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/alerts');
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleResolve = async (alert: Alert) => {
    if (!alert.actionLabel || !alert.actionable) return;
    setResolving(alert.id);
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: alert.id, action: alert.actionLabel }),
      });
      await fetchAlerts();
    } catch {
      // keep current state
    } finally {
      setResolving(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cashew"><AlertTriangle className="w-5 h-5" /></div>
          <div><h2 className="text-xl font-bold">Alerts & Diagnostics</h2></div>
        </div>
        {[1,2,3].map(i => <Card key={i} className="glass-card"><CardContent className="p-4"><div className="shimmer h-20 rounded-lg" /></CardContent></Card>)}
      </div>
    );
  }

  if (!data || !data.success) return null;

  const { alerts, summary, scannedAt } = data;
  const isHealthy = summary.total === 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isHealthy ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            {isHealthy ? <Shield className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {isHealthy ? 'All Clear' : `${summary.total} Alert${summary.total > 1 ? 's' : ''}`}
            </h2>
            <p className="text-sm text-muted-foreground">Live diagnostics scan</p>
          </div>
        </div>
        <button onClick={fetchAlerts} className="p-2 rounded-xl hover:bg-accent transition-colors active:scale-95">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-2">
        {summary.critical > 0 && (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 text-xs">
            {summary.critical} Critical
          </Badge>
        )}
        {summary.high > 0 && (
          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 text-xs">
            {summary.high} High
          </Badge>
        )}
        {summary.medium > 0 && (
          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 text-xs">
            {summary.medium} Medium
          </Badge>
        )}
        {isHealthy && (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-xs">
            No Issues Detected
          </Badge>
        )}
        <span className="text-[10px] text-muted-foreground self-center ml-auto">
          Scanned: {new Date(scannedAt).toLocaleTimeString()}
        </span>
      </div>

      {/* Healthy State */}
      {isHealthy && (
        <Card className="glass-card border-green-200 dark:border-green-800">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-base mb-1">System is Healthy</h3>
            <p className="text-sm text-muted-foreground">No active alerts. All systems operating normally.</p>
          </CardContent>
        </Card>
      )}

      {/* Alert Cards */}
      {!isHealthy && (
        <div className="space-y-3">
          {alerts.map(alert => {
            const config = severityConfig[alert.severity];
            return (
              <Card key={alert.id} className={`glass-card border ${config.border}`}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0 mt-0.5`}>
                      {typeIcons[alert.type] || <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-semibold">{alert.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.description}</p>
                        </div>
                        <Badge className={`text-[9px] flex-shrink-0 ${config.bg} ${config.border} text-foreground`}>
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(alert.detectedAt).toLocaleString()}
                          {alert.affectedName && ` | ${alert.affectedName}`}
                        </span>
                        {alert.actionable && alert.actionLabel && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-[10px] h-7 px-2"
                            onClick={() => handleResolve(alert)}
                            disabled={resolving === alert.id}
                          >
                            {resolving === alert.id ? 'Resolving...' : alert.actionLabel}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Diagnostics Info */}
      <Card className="glass-card bg-cashew/50 border-dashed border-2 border-border">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-semibold mb-0.5">Automatic Scanning</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                This panel scans for: expired tickets, no-show passengers, stalled boarding sessions,
                offline drivers, capacity warnings, failed transactions, and queues without drivers.
                Click refresh to run a fresh scan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
