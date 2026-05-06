'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, Users,
  Clock, DollarSign, Activity, Zap, Shield, RefreshCw, Target,
  ChevronDown, ChevronUp, BarChart3, ArrowUpRight, ArrowDownRight,
  Gauge, Timer,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, AreaChart, Area, Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AnimatedCounter, ProgressRing } from '@/lib/animations';

interface MLResponse {
  success: boolean;
  generatedAt: string;
  dataPoints: { todayEntries: number; historicalEntries: number; daysOfHistory: number; completedSessions: number };
  models: {
    demandForecast: {
      forecast: Array<{ hour: number; predicted: number; lower: number; upper: number; confidence: string }>;
      trend: string;
      trendStrength: number;
    };
    hourlyPatterns: {
      patterns: Array<{ hour: number; avgVolume: number; label: string; category: string }>;
      peakHour: number;
      offPeakHours: number[];
      avgVolume: number;
    };
    noShowPredictions: {
      passengers: Array<{
        ticketNumber: number; position: number; channel: string; waitMinutes: number;
        probability: number; level: string; factors: string[];
      }>;
      summary: { averageRisk: number; highRiskCount: number; totalAnalyzed: number };
    };
    throughputOptimization: {
      optimalGroupSize: number;
      recommendedActions: string[];
      estimatedClearTime: number;
      efficiencyScore: number;
    };
    revenueForecast: {
      forecast: Array<{ date: string; predicted: number; lower: number; upper: number }>;
      weeklyTotal: number;
      growthRate: number;
    };
    anomalyDetection: {
      volumeAnomalies: Array<{ day: number; volume: number; zScore: number; severity: string }>;
      dailyScores: number[];
    };
    waitTimeAnalysis: {
      current: { avg: number; min: number; max: number; std: number; count: number };
      predicted: number;
      trend: string;
    };
    modelPerformance: {
      backtest: { mae: number; rmse: number; mape: number };
      r2: number;
      dataQuality: string;
    };
    channelPreferences: Array<{ channel: string; count: number; share: number; trend: string }>;
    boardingEfficiency: {
      avgDuration: number; std: number; min: number; max: number; sessions: number;
    };
  };
}

const confidenceColor: Record<string, string> = {
  high: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  medium: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
  low: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
};

const noShowLevelStyle: Record<string, string> = {
  low: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  medium: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
  high: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
  critical: 'text-red-600 bg-red-50 dark:bg-red-900/20',
};

const categoryColors: Record<string, string> = {
  low: '#979585',
  moderate: '#dddbca',
  high: '#b8a88a',
  peak: '#0c0b0b',
};

export function MLInsights() {
  const [data, setData] = useState<MLResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>('demand');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ml');
      const json = await res.json();
      setData(json);
    } catch { setData(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cashew"><Brain className="w-5 h-5" /></div>
          <div><h2 className="text-xl font-bold">ML Insights</h2></div>
        </div>
        {[1,2,3].map(i => <Card key={i} className="glass-card"><CardContent className="p-4"><div className="shimmer h-20 rounded-lg" /></CardContent></Card>)}
      </div>
    );
  }

  if (!data || !data.success) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cashew"><Brain className="w-5 h-5" /></div>
          <div><h2 className="text-xl font-bold">ML Insights</h2></div>
        </div>
        <Card className="glass-card"><CardContent className="p-6 text-center"><p className="text-sm text-muted-foreground">Unable to generate predictions</p></CardContent></Card>
      </div>
    );
  }

  const { models } = data;

  const toggleSection = (id: string) => {
    setExpandedSection(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cashew">
            <Brain className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">ML Insights</h2>
            <p className="text-sm text-muted-foreground">
              {data.dataPoints.todayEntries} entries today | {data.dataPoints.daysOfHistory}d history | R²: {models.modelPerformance.r2.toFixed(2)}
            </p>
          </div>
        </div>
        <button onClick={fetchData} className="p-2 rounded-xl hover:bg-accent transition-colors active:scale-95">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat icon={<TrendingUp className="w-4 h-4" />} label="Demand Trend"
          value={models.demandForecast.trend === 'rising' ? 'Rising' : models.demandForecast.trend === 'falling' ? 'Falling' : 'Stable'}
          color={models.demandForecast.trend === 'rising' ? 'text-green-600' : models.demandForecast.trend === 'falling' ? 'text-red-600' : 'text-muted-foreground'}
        />
        <MiniStat icon={<Shield className="w-4 h-4" />} label="Avg No-Show Risk"
          value={`${models.noShowPredictions.summary.averageRisk}%`}
          color={models.noShowPredictions.summary.averageRisk > 40 ? 'text-red-600' : models.noShowPredictions.summary.averageRisk > 20 ? 'text-yellow-600' : 'text-green-600'}
        />
        <MiniStat icon={<Gauge className="w-4 h-4" />} label="Efficiency"
          value={`${models.throughputOptimization.efficiencyScore}%`}
          color={models.throughputOptimization.efficiencyScore > 70 ? 'text-green-600' : 'text-yellow-600'}
        />
        <MiniStat icon={<Timer className="w-4 h-4" />} label="Predicted Wait"
          value={`${models.waitTimeAnalysis.predicted} min`}
          color={models.waitTimeAnalysis.trend === 'improving' ? 'text-green-600' : models.waitTimeAnalysis.trend === 'worsening' ? 'text-red-600' : 'text-muted-foreground'}
        />
      </div>

      {/* Model Accuracy Badge */}
      <Card className="glass-card bg-cashew/50">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-cashew"><Target className="w-4 h-4" /></div>
          <div className="flex-1">
            <p className="text-xs font-semibold">Model Accuracy</p>
            <p className="text-[10px] text-muted-foreground">
              MAE: {models.modelPerformance.backtest.mae} | RMSE: {models.modelPerformance.backtest.rmse} | MAPE: {models.modelPerformance.backtest.mape}%
              | Data quality: {models.modelPerformance.dataQuality}
            </p>
          </div>
          <ProgressRing progress={Math.round(models.modelPerformance.r2 * 100)} size={40} strokeWidth={3}>
            <span className="text-[9px] font-bold">{Math.round(models.modelPerformance.r2 * 100)}%</span>
          </ProgressRing>
        </CardContent>
      </Card>

      {/* Demand Forecast Section */}
      <CollapsibleSection
        id="demand"
        title="Demand Forecast"
        subtitle={`Next 6h | ${models.demandForecast.trend} trend`}
        expanded={expandedSection === 'demand'}
        onToggle={toggleSection}
        icon={<BarChart3 className="w-4 h-4" />}
      >
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={models.demandForecast.forecast.map(f => ({
              ...f,
              label: `${f.hour.toString().padStart(2, '0')}:00`,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }} />
              <Area type="monotone" dataKey="upper" stroke="transparent" fill="var(--border)" opacity={0.3} />
              <Area type="monotone" dataKey="lower" stroke="transparent" fill="var(--popover)" />
              <Line type="monotone" dataKey="predicted" stroke="var(--foreground)" strokeWidth={2} dot={{ fill: 'var(--foreground)', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {models.demandForecast.forecast.map((f, i) => (
            <div key={i} className="flex items-center gap-1 text-[10px]">
              <span className="font-mono text-muted-foreground">{f.hour.toString().padStart(2, '0')}:00</span>
              <Badge variant="outline" className={`${confidenceColor[f.confidence]} text-[9px] px-1`}>{f.confidence}</Badge>
              <span className="font-mono font-medium">{f.predicted}p</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Hourly Patterns */}
      <CollapsibleSection
        id="patterns"
        title="Hourly Patterns"
        subtitle={`Peak: ${models.hourlyPatterns.peakHour.toString().padStart(2, '0')}:00`}
        expanded={expandedSection === 'patterns'}
        onToggle={toggleSection}
        icon={<Activity className="w-4 h-4" />}
      >
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={models.hourlyPatterns.patterns}>
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }} />
              <Bar dataKey="avgVolume" radius={[3, 3, 0, 0]} maxBarSize={20}>
                {models.hourlyPatterns.patterns.map((entry, i) => (
                  <Cell key={i} fill={categoryColors[entry.category] || '#e9e6d7'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-3 mt-2 text-[10px]">
          {Object.entries(categoryColors).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="capitalize text-muted-foreground">{key}</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* No-Show Risk */}
      <CollapsibleSection
        id="noshow"
        title="No-Show Risk"
        subtitle={`${models.noShowPredictions.summary.highRiskCount} high-risk of ${models.noShowPredictions.summary.totalAnalyzed} scanned`}
        expanded={expandedSection === 'noshow'}
        onToggle={toggleSection}
        icon={<Users className="w-4 h-4" />}
        alert={models.noShowPredictions.summary.highRiskCount > 0}
      >
        <div className="space-y-2">
          {models.noShowPredictions.passengers.map(p => (
            <div key={p.ticketNumber} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30">
              <div className="flex-shrink-0 w-10 text-center">
                <span className="text-sm font-bold font-mono">#{p.ticketNumber}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground uppercase">{p.channel}</span>
                  <span className="text-[10px] text-muted-foreground">Pos {p.position}</span>
                  <span className="text-[10px] text-muted-foreground">{p.waitMinutes}min</span>
                </div>
                {p.factors.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{p.factors[0]}</p>
                )}
              </div>
              <div className="flex-shrink-0">
                <div className="px-2 py-1 rounded-lg text-center">
                  <p className="text-sm font-bold">{Math.round(p.probability * 100)}%</p>
                  <p className="text-[9px] text-muted-foreground capitalize">{p.level}</p>
                </div>
              </div>
            </div>
          ))}
          {models.noShowPredictions.passengers.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No passengers currently waiting</p>
          )}
        </div>
      </CollapsibleSection>

      {/* Throughput Optimization */}
      <CollapsibleSection
        id="throughput"
        title="Throughput Optimization"
        subtitle={`Optimal group: ${models.throughputOptimization.optimalGroupSize} | Efficiency: ${models.throughputOptimization.efficiencyScore}%`}
        expanded={expandedSection === 'throughput'}
        onToggle={toggleSection}
        icon={<Zap className="w-4 h-4" />}
      >
        <div className="grid grid-cols-3 gap-2 mb-3">
          <StatBlock label="Optimal Group" value={String(models.throughputOptimization.optimalGroupSize)} />
          <StatBlock label="Clear Time" value={models.throughputOptimization.estimatedClearTime > 0 ? `${models.throughputOptimization.estimatedClearTime} min` : 'N/A'} />
          <StatBlock label="Sessions" value={String(data.dataPoints.completedSessions)} />
        </div>
        {models.throughputOptimization.recommendedActions.length > 0 && (
          <div className="space-y-1.5">
            {models.throughputOptimization.recommendedActions.map((action, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs">{action}</span>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Revenue Forecast */}
      <CollapsibleSection
        id="revenue"
        title="Revenue Forecast"
        subtitle={`${models.revenueForecast.growthRate >= 0 ? '+' : ''}${models.revenueForecast.growthRate}% daily | GHS ${models.revenueForecast.weeklyTotal.toFixed(0)} forecast`}
        expanded={expandedSection === 'revenue'}
        onToggle={toggleSection}
        icon={<DollarSign className="w-4 h-4" />}
      >
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={models.revenueForecast.forecast.map(f => ({
              ...f,
              label: new Date(f.date).toLocaleDateString('en', { weekday: 'short', day: 'numeric' }),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={v => `GHS ${v}`} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '11px' }} formatter={(v: number) => [`GHS ${v.toFixed(2)}`]} />
              <Area type="monotone" dataKey="upper" stroke="transparent" fill="var(--border)" opacity={0.3} />
              <Area type="monotone" dataKey="lower" stroke="transparent" fill="var(--popover)" />
              <Line type="monotone" dataKey="predicted" stroke="var(--foreground)" strokeWidth={2} dot={{ fill: 'var(--foreground)', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CollapsibleSection>

      {/* Wait Time Analysis */}
      <CollapsibleSection
        id="waittime"
        title="Wait Time Analysis"
        subtitle={`Avg: ${models.waitTimeAnalysis.current.avg} min | Predicted: ${models.waitTimeAnalysis.predicted} min`}
        expanded={expandedSection === 'waittime'}
        onToggle={toggleSection}
        icon={<Clock className="w-4 h-4" />}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <StatBlock label="Average" value={`${models.waitTimeAnalysis.current.avg} min`} />
          <StatBlock label="Min" value={`${models.waitTimeAnalysis.current.min} min`} />
          <StatBlock label="Max" value={`${models.waitTimeAnalysis.current.max} min`} />
          <StatBlock label="Std Dev" value={`${models.waitTimeAnalysis.current.std} min`} />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="outline" className={`text-[10px] ${
            models.waitTimeAnalysis.trend === 'improving' ? 'bg-green-50 text-green-600' :
            models.waitTimeAnalysis.trend === 'worsening' ? 'bg-red-50 text-red-600' : 'bg-muted'
          }`}>
            {models.waitTimeAnalysis.trend === 'improving' ? <ArrowDownRight className="w-3 h-3" /> : models.waitTimeAnalysis.trend === 'worsening' ? <ArrowUpRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {models.waitTimeAnalysis.trend}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            Based on {models.waitTimeAnalysis.current.count} completed boardings
          </span>
        </div>
      </CollapsibleSection>

      {/* Channel Preferences */}
      <CollapsibleSection
        id="channels"
        title="Channel Intelligence"
        subtitle="Passenger channel adoption & trends"
        expanded={expandedSection === 'channels'}
        onToggle={toggleSection}
        icon={<BarChart3 className="w-4 h-4" />}
      >
        <div className="space-y-2">
          {models.channelPreferences.map(ch => (
            <div key={ch.channel} className="flex items-center gap-3">
              <span className="text-xs capitalize w-14 font-medium">{ch.channel}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-foreground transition-all duration-500" style={{ width: `${ch.share * 100}%` }} />
              </div>
              <span className="text-xs font-mono font-medium w-10 text-right">{Math.round(ch.share * 100)}%</span>
              <Badge variant="outline" className={`text-[9px] ${
                ch.trend === 'growing' ? 'bg-green-50 text-green-600' : ch.trend === 'emerging' ? 'bg-blue-50 text-blue-600' : 'bg-muted'
              }`}>
                {ch.trend}
              </Badge>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Boarding Efficiency */}
      <CollapsibleSection
        id="boarding"
        title="Boarding Efficiency"
        subtitle={`Avg session: ${models.boardingEfficiency.avgDuration} min`}
        expanded={expandedSection === 'boarding'}
        onToggle={toggleSection}
        icon={<Timer className="w-4 h-4" />}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <StatBlock label="Avg Duration" value={`${models.boardingEfficiency.avgDuration} min`} />
          <StatBlock label="Consistency" value={`${models.boardingEfficiency.std} min`} />
          <StatBlock label="Fastest" value={`${models.boardingEfficiency.min} min`} />
          <StatBlock label="Slowest" value={`${models.boardingEfficiency.max} min`} />
        </div>
      </CollapsibleSection>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function MiniStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <Card className="glass-card glass-stat">
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">{icon}<span className="text-xs">{label}</span></div>
        <p className={`text-sm font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-muted/40 text-center">
      <p className="text-sm font-bold font-mono">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function CollapsibleSection({ id, title, subtitle, expanded, onToggle, icon, alert, children }: {
  id: string; title: string; subtitle: string; expanded: boolean; onToggle: (id: string) => void;
  icon: React.ReactNode; alert?: boolean; children: React.ReactNode;
}) {
  return (
    <Card className={`glass-card overflow-hidden ${alert ? 'border-yellow-200 dark:border-yellow-800' : ''}`}>
      <button onClick={() => onToggle(id)} className="w-full text-left p-3 hover:bg-accent/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${alert ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-cashew'}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold flex items-center gap-2">{title}
              {alert && <span className="w-2 h-2 rounded-full bg-yellow-500" />}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 border-t border-border/50">
          {children}
        </div>
      )}
    </Card>
  );
}
