'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, Target, Rocket, Users, TrendingUp, Globe, Circle } from 'lucide-react';

// =============================================
// Phase data
// =============================================

interface RoadmapPhase {
  phase: number;
  title: string;
  timeline: string;
  status: 'completed' | 'in-progress' | 'planned' | 'future';
  deliverable: string;
  items: { text: string; done: boolean }[];
  target?: string;
  metrics?: string[];
  icon: React.ReactNode;
}

const phases: RoadmapPhase[] = [
  {
    phase: 1,
    title: 'Prototype',
    timeline: 'Week 1',
    status: 'completed',
    deliverable: 'Working agent tablet app + printed tickets',
    icon: <Rocket className="w-4 h-4" />,
    items: [
      { text: 'Manual queue management with paper tickets + agent app', done: true },
      { text: 'Basic location setup (1 pickup point)', done: true },
      { text: 'Simple passenger registration (name + phone)', done: true },
      { text: 'Manual boarding call system (agent shouts/calls)', done: true },
      { text: 'Data collection on queue patterns', done: true },
    ],
    target: 'Validate concept with 50+ daily users',
  },
  {
    phase: 2,
    title: 'Pilot',
    timeline: 'Week 2',
    status: 'in-progress',
    deliverable: 'Live USSD + SMS at Kwame Nkrumah Circle',
    icon: <Target className="w-4 h-4" />,
    items: [
      { text: 'Launch at 1 high-traffic location (Kwame Nkrumah Circle)', done: true },
      { text: 'Deploy basic USSD integration (*384*200#)', done: true },
      { text: 'SMS notifications for queue position updates', done: false },
      { text: 'Agent dashboard with real-time queue view', done: false },
      { text: 'Driver arrival notification (USSD-based)', done: false },
      { text: 'Metrics: Daily queue volume, wait times, boarding efficiency', done: false },
    ],
    metrics: ['Daily queue volume', 'Average wait time', 'Boarding efficiency'],
    target: '200+ daily users',
  },
  {
    phase: 3,
    title: 'Automation',
    timeline: 'Week 3-4',
    status: 'planned',
    deliverable: 'Automated boarding + driver app + revenue integration',
    icon: <TrendingUp className="w-4 h-4" />,
    items: [
      { text: 'Automated boarding calls (display board + SMS batch)', done: false },
      { text: 'Driver mobile web app (arrival confirm, passenger list)', done: false },
      { text: 'Anti-duplication enforcement (phone number tracking)', done: false },
      { text: 'Revenue collection integration (mobile money)', done: false },
      { text: 'Performance dashboard with analytics', done: false },
    ],
    target: '500+ daily users, 2 locations',
  },
  {
    phase: 4,
    title: 'Scale',
    timeline: 'Month 2',
    status: 'planned',
    deliverable: '5 locations + web app + IVR + digital displays',
    icon: <Globe className="w-4 h-4" />,
    items: [
      { text: 'Expand to 5 locations across Accra', done: false },
      { text: 'Web app for smartphone users', done: false },
      { text: 'IVR integration for voice-based access', done: false },
      { text: 'Predictive demand forecasting', done: false },
      { text: 'Digital display boards at locations', done: false },
    ],
    target: '2,000+ daily users',
  },
  {
    phase: 5,
    title: 'Growth',
    timeline: 'Month 3-6',
    status: 'future',
    deliverable: 'City-wide network + API partnerships + profitability',
    icon: <Users className="w-4 h-4" />,
    items: [
      { text: '25+ locations across the city', done: false },
      { text: 'API partnerships with ride-hailing apps', done: false },
      { text: 'Premium features (priority queue, seat selection)', done: false },
      { text: 'Agent network expansion & training program', done: false },
      { text: 'Municipality partnership & regulation compliance', done: false },
    ],
    target: '10,000+ daily users, profitability',
  },
];

// =============================================
// Status config
// =============================================

function getStatusConfig(status: RoadmapPhase['status']) {
  switch (status) {
    case 'completed':
      return {
        badge: 'bg-foreground text-primary-foreground',
        dot: 'bg-foreground',
        dotRing: '',
        line: 'bg-border',
        label: 'Completed',
      };
    case 'in-progress':
      return {
        badge: 'bg-linen text-foreground dark:bg-linen dark:text-foreground border-border',
        dot: 'bg-linen animate-pulse',
        dotRing: 'ring-4 ring-linen/30',
        line: 'bg-border',
        label: 'In Progress',
      };
    case 'planned':
      return {
        badge: 'bg-cashew text-soft dark:bg-cashew dark:text-soft border-border',
        dot: 'bg-cashew',
        dotRing: '',
        line: 'bg-border',
        label: 'Planned',
      };
    case 'future':
      return {
        badge: 'bg-background text-soft dark:bg-background dark:text-soft border-dashed border-border',
        dot: 'bg-border',
        dotRing: '',
        line: 'border-l-2 border-dashed border-border',
        label: 'Future',
      };
  }
}

// =============================================
// Phase card
// =============================================

function PhaseCard({ phase, isLast }: { phase: RoadmapPhase; isLast: boolean }) {
  const config = getStatusConfig(phase.status);
  const completedCount = phase.items.filter(i => i.done).length;
  const progress = Math.round((completedCount / phase.items.length) * 100);

  return (
    <div className="flex gap-3 sm:gap-6">
      {/* Timeline column */}
      <div className="flex flex-col items-center flex-shrink-0">
        {/* Phase dot */}
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${config.dot} ${config.dotRing} flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm`}>
          {phase.status === 'completed' ? (
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <span>{phase.phase}</span>
          )}
        </div>

        {/* Connecting line */}
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[40px] sm:min-h-[60px] ${phase.status === 'future' ? 'border-l-2 border-dashed border-border' : config.line}`} />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 pb-6 sm:pb-8 ${isLast ? 'pb-0' : ''}`}>
        <Card className={`glass-card overflow-hidden transition-shadow hover:shadow-md ${
          phase.status === 'in-progress' 
            ? 'border-border shadow-sm' 
            : phase.status === 'future'
              ? 'border-dashed border-border opacity-75'
              : ''
        }`}>
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base">{phase.icon}</span>
                <div>
                  <CardTitle className="text-sm">
                    Phase {phase.phase}: {phase.title}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">{phase.timeline}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[9px] sm:text-[10px] font-medium ${config.badge}`}>
                  {config.label}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {/* Progress bar */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    phase.status === 'completed' ? 'bg-foreground' : 
                    phase.status === 'in-progress' ? 'bg-foreground' : 'bg-soft'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground w-14 sm:w-16 text-right">
                {completedCount}/{phase.items.length}
              </span>
            </div>

            {/* Items checklist */}
            <ul className="space-y-1.5 sm:space-y-2">
              {phase.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 sm:gap-2.5 text-sm">
                  {item.done ? (
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-soft mt-0.5 flex-shrink-0" />
                  )}
                  <span className={item.done ? 'text-foreground/70 line-through' : 'text-foreground/90'}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>

            {/* Target & Metrics */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1">
              {phase.target && (
                <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md bg-muted text-[11px] sm:text-xs font-medium">
                  <Target className="w-3 h-3 text-muted-foreground" />
                  <span>{phase.target}</span>
                </div>
              )}
              {phase.metrics && phase.metrics.map((m) => (
                <Badge key={m} variant="outline" className="text-[9px] sm:text-[10px]">
                  {m}
                </Badge>
              ))}
            </div>

            {/* Deliverable */}
            {phase.deliverable && (
              <div className="flex items-start gap-2 p-2 sm:p-2.5 rounded-md bg-muted/50 border border-border">
                <Rocket className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground/70">Deliverable:</span> {phase.deliverable}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// =============================================
// Summary stats
// =============================================

function RoadmapSummary() {
  const completed = phases.filter(p => p.status === 'completed').length;
  const inProgress = phases.filter(p => p.status === 'in-progress').length;
  const planned = phases.filter(p => p.status === 'planned').length;
  const future = phases.filter(p => p.status === 'future').length;
  const totalItems = phases.reduce((sum, p) => sum + p.items.length, 0);
  const doneItems = phases.reduce((sum, p) => sum + p.items.filter(i => i.done).length, 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <Card className="glass-card glass-stat border-border bg-cashew">
        <CardContent className="p-2.5 sm:p-3 text-center">
          <p className="text-xl sm:text-2xl font-bold text-foreground">{completed}</p>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">Completed</p>
        </CardContent>
      </Card>
      <Card className="glass-card glass-stat border-border bg-linen/50">
        <CardContent className="p-2.5 sm:p-3 text-center">
          <p className="text-xl sm:text-2xl font-bold text-foreground">{inProgress}</p>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">In Progress</p>
        </CardContent>
      </Card>
      <Card className="glass-card glass-stat border-border bg-cashew/50">
        <CardContent className="p-2.5 sm:p-3 text-center">
          <p className="text-xl sm:text-2xl font-bold text-soft">{planned}</p>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">Planned</p>
        </CardContent>
      </Card>
      <Card className="glass-card glass-stat border-border">
        <CardContent className="p-2.5 sm:p-3 text-center">
          <p className="text-xl sm:text-2xl font-bold text-soft">{future}</p>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">Future</p>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================
// Overall progress
// =============================================

function OverallProgress() {
  const totalItems = phases.reduce((sum, p) => sum + p.items.length, 0);
  const doneItems = phases.reduce((sum, p) => sum + p.items.filter(i => i.done).length, 0);
  const progress = Math.round((doneItems / totalItems) * 100);

  return (
    <Card className="glass-card">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-semibold">Overall Progress</span>
          <span className="text-xs sm:text-sm font-bold text-foreground">{progress}%</span>
        </div>
        <div className="h-2.5 sm:h-3 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[11px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2">
          {doneItems} of {totalItems} milestones completed across {phases.length} phases
        </p>
      </CardContent>
    </Card>
  );
}

// =============================================
// Main Component
// =============================================
export function RoadmapView() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-cashew">
            <Clock className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">MVP Roadmap</h2>
            <p className="text-sm text-muted-foreground">6-month development timeline from prototype to city-wide deployment</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <RoadmapSummary />

      {/* Overall progress */}
      <OverallProgress />

      <Separator />

      {/* Timeline */}
      <div className="relative">
        <div className="space-y-0">
          {phases.map((phase, idx) => (
            <PhaseCard 
              key={phase.phase} 
              phase={phase} 
              isLast={idx === phases.length - 1} 
            />
          ))}
        </div>
      </div>

      {/* Bottom note */}
      <Card className="glass-card border-dashed border-2 border-border bg-cashew/50">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-cashew mt-0.5">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-xs sm:text-sm mb-1">Agile & Iterative Approach</h4>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                This roadmap follows a lean startup methodology — each phase builds on validated learnings from the previous one. 
                Phase gates require meeting minimum usage targets before progressing. The timeline is ambitious but 
                achievable, with buffer built into each phase for iteration based on real user feedback.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
