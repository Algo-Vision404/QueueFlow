'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { WifiOff, Smartphone, AlertTriangle, Users, Zap, Battery, Globe, Shield, CheckCircle, XCircle } from 'lucide-react';

// =============================================
// Edge case card component
// =============================================

interface EdgeCaseItem {
  icon: React.ReactNode;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  scenario: string;
  mitigations: string[];
  recovery?: string[];
  accentColor: string;
  accentBg: string;
  accentBorder: string;
}

function EdgeCaseCard({ item }: { item: EdgeCaseItem }) {
  const severityMap: Record<string, { label: string; className: string }> = {
    critical: { label: 'Critical', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800' },
    high: { label: 'High', className: 'bg-linen text-foreground dark:bg-linen dark:text-foreground border-border' },
    medium: { label: 'Medium', className: 'bg-cashew text-soft dark:bg-cashew dark:text-soft border-border' },
    low: { label: 'Low', className: 'bg-background text-soft dark:bg-background dark:text-soft border-border' },
  };

  const sev = severityMap[item.severity];

  return (
    <Card className={`border ${item.accentBorder} hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${item.accentBg}`}>
              {item.icon}
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base">{item.title}</CardTitle>
            </div>
          </div>
          <Badge variant="outline" className={`text-[10px] font-medium flex-shrink-0 ${sev.className}`}>
            {sev.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scenario */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scenario</span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{item.scenario}</p>
        </div>

        <Separator />

        {/* Mitigations */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Shield className="w-3.5 h-3.5 text-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mitigations</span>
          </div>
          <ul className="space-y-1.5">
            {item.mitigations.map((mit, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-foreground/80">
                <CheckCircle className="w-3.5 h-3.5 text-foreground mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">{mit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recovery */}
        {item.recovery && item.recovery.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-soft" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recovery</span>
              </div>
              <ul className="space-y-1.5">
                {item.recovery.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-foreground/80">
                    <Zap className="w-3.5 h-3.5 text-soft mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================
// Main Component
// =============================================
export function EdgeCasesView() {
  const edgeCases: EdgeCaseItem[] = [
    {
      icon: <WifiOff className="w-5 h-5 text-red-600 dark:text-red-400" />,
      title: 'Network Failure',
      severity: 'critical',
      scenario: 'USSD gateway timeout or SMS delivery failure leaves passengers without confirmation of their queue position. Telecom infrastructure in developing regions can be unreliable.',
      mitigations: [
        'Auto-retry up to 3 times with exponential backoff for failed SMS/USSD requests',
        'SMS fallback queue — undelivered messages stored and retried when connectivity returns',
        'Agent manual override — agents can look up and verbally confirm passenger positions',
        'Local USSD session state caching at gateway level',
      ],
      recovery: [
        'Periodic reconciliation job comparing system state with telecom delivery receipts',
        'Agent resync feature — one-click to pull latest queue data on agent tablet',
        'Passenger can re-dial USSD to check status without rejoining',
      ],
      accentColor: 'text-red-600 dark:text-red-400',
      accentBg: 'bg-red-100 dark:bg-red-900/30',
      accentBorder: 'border-border',
    },
    {
      icon: <Smartphone className="w-5 h-5 text-foreground" />,
      title: 'Users Without Phones',
      severity: 'high',
      scenario: 'Some passengers may not own a phone at all — elderly, children, or extremely low-income individuals. They cannot join via USSD or receive SMS notifications.',
      mitigations: [
        'Agent-assisted enrollment — agent creates queue entry on their tablet',
        'Printed paper tickets with unique ticket number (and optional QR code)',
        'Passenger shows physical ticket when their number is called at boarding',
        'Digital display board shows current boarding numbers visually',
      ],
      recovery: [
        'Lost paper tickets can be reissued by agent with identity verification',
        'Agent maintains a manual logbook as ultimate backup',
      ],
      accentColor: 'text-foreground',
      accentBg: 'bg-cashew dark:bg-cashew',
      accentBorder: 'border-border',
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />,
      title: 'Drivers Ignoring System',
      severity: 'high',
      scenario: 'Drivers may pick up passengers outside the queue system, loading their vehicles directly and bypassing the organized queue. This undermines the system and frustrates compliant users.',
      mitigations: [
        'Location manager oversight with real-time compliance dashboard',
        'Driver rating system — passengers rate drivers, low-rated drivers flagged',
        'Potential ban from high-demand locations for repeat offenders',
        'Vehicle GPS tracking to detect unauthorized pickups',
      ],
      recovery: [
        'Incentive structure — reduced queue wait and priority loading for compliant drivers',
        'Municipality partnership for regulatory enforcement',
        'Regular compliance audits with driver performance reports',
      ],
      accentColor: 'text-red-600 dark:text-red-400',
      accentBg: 'bg-red-100 dark:bg-red-900/30',
      accentBorder: 'border-border',
    },
    {
      icon: <Users className="w-5 h-5 text-foreground" />,
      title: 'Queue Abuse',
      severity: 'high',
      scenario: 'Multiple queue entries per person, queue jumping, or selling positions. One person joining on behalf of a group and distributing positions for money.',
      mitigations: [
        'Phone number deduplication — 1 active entry per phone number per location per day',
        'Agent verification at boarding — check ticket against ID or phone',
        'Facial recognition pilot at high-volume locations (Phase 4+)',
        'Timestamp and GPS proximity check on boarding confirmation',
      ],
      recovery: [
        'Anomaly detection on join patterns — flag unusual bursts of registrations',
        'One-tap report abuse feature for agents and passengers',
        'Banned numbers list for repeat offenders',
      ],
      accentColor: 'text-foreground',
      accentBg: 'bg-cashew dark:bg-cashew',
      accentBorder: 'border-border',
    },
    {
      icon: <Zap className="w-5 h-5 text-foreground" />,
      title: 'Peak Overload',
      severity: 'critical',
      scenario: 'During rush hours (morning/evening), 500+ people may attempt to join simultaneously. USSD gateway rate limits, API latency spikes, and agent dashboards lag.',
      mitigations: [
        'Pre-queue feature — passengers can join before physically arriving at the location',
        'Batch processing — boarding calls sent in optimized batches, not individual requests',
        'Auto-scaling infrastructure — horizontal scaling based on queue volume metrics',
        'Redis-backed rate limiting and request prioritization',
      ],
      recovery: [
        'Graceful degradation to agent-only mode — agents manage locally, sync later',
        'Simplified USSD menus during peak — fewer navigation steps to reduce gateway load',
        'CDN-cached static content to reduce server load',
      ],
      accentColor: 'text-foreground',
      accentBg: 'bg-cashew dark:bg-cashew',
      accentBorder: 'border-border',
    },
    {
      icon: <Battery className="w-5 h-5 text-soft" />,
      title: 'Power / Infrastructure Failure',
      severity: 'medium',
      scenario: 'Locations may experience power outages or internet downtime. Agent tablets run out of battery. Display boards go dark.',
      mitigations: [
        'Offline mode for agents — local SQLite storage on tablet, sync when online',
        'Battery-powered display boards (e-ink or low-power LED)',
        'USSD/SMS channels unaffected by local power outages (runs on telecom infra)',
        'Solar charging stations at high-volume locations',
      ],
      recovery: [
        'Automatic data sync when connectivity is restored — conflict resolution via timestamps',
        'Agent receives summary of missed operations after reconnection',
        'Fallback to manual paper-based system with structured logbooks',
      ],
      accentColor: 'text-soft',
      accentBg: 'bg-cashew dark:bg-cashew',
      accentBorder: 'border-border',
    },
    {
      icon: <Globe className="w-5 h-5 text-foreground" />,
      title: 'Multilingual Support',
      severity: 'medium',
      scenario: 'Ghana has multiple official languages (English, Twi, Ga, Hausa, Ewe). USSD sessions and SMS must be comprehensible to users who may not read English well.',
      mitigations: [
        'USSD language selection on first use — stored in user profile for future sessions',
        'Agent multilingual support — app displays queue info in agent\'s preferred language',
        'SMS notifications localized based on user language preference',
        'Display board supports multiple languages simultaneously',
      ],
      accentColor: 'text-foreground',
      accentBg: 'bg-cashew dark:bg-cashew',
      accentBorder: 'border-border',
    },
    {
      icon: <Shield className="w-5 h-5 text-foreground" />,
      title: 'Data Privacy & Security',
      severity: 'high',
      scenario: 'Phone numbers displayed publicly on queue boards could expose user data. Data breaches could leak passenger information. Regulatory compliance (GDPR, Ghana DPA) required.',
      mitigations: [
        'Phone number masking in all public displays — show only last 4 digits (e.g., ***4567)',
        'End-to-end encrypted storage for sensitive data',
        'Minimal data retention policy — automatically purge records after 30 days',
        'Role-based access control — agents see only their location\'s data',
        'GDPR-compliant data export and deletion endpoints',
      ],
      recovery: [
        'Automated breach detection and notification system',
        'Regular security audits and penetration testing',
        'Data minimization — collect only essential fields',
      ],
      accentColor: 'text-foreground',
      accentBg: 'bg-cashew dark:bg-cashew',
      accentBorder: 'border-border',
    },
  ];

  const severitySummary = [
    { label: 'Critical', count: edgeCases.filter(e => e.severity === 'critical').length, className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800' },
    { label: 'High', count: edgeCases.filter(e => e.severity === 'high').length, className: 'bg-linen text-foreground dark:bg-linen dark:text-foreground border-border' },
    { label: 'Medium', count: edgeCases.filter(e => e.severity === 'medium').length, className: 'bg-cashew text-soft dark:bg-cashew dark:text-soft border-border' },
    { label: 'Low', count: edgeCases.filter(e => e.severity === 'low').length, className: 'bg-background text-soft dark:bg-background dark:text-soft border-border' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-cashew">
            <AlertTriangle className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Edge Cases & Failure Modes</h2>
            <p className="text-sm text-muted-foreground">Identified risks, mitigations, and recovery strategies</p>
          </div>
        </div>
      </div>

      {/* Severity summary */}
      <div className="flex flex-wrap gap-2">
        {severitySummary.map((s) => (
          <Badge key={s.label} variant="outline" className={`text-xs font-medium ${s.className}`}>
            {s.label}: {s.count}
          </Badge>
        ))}
        <Badge variant="outline" className="text-xs font-medium">
          Total: {edgeCases.length}
        </Badge>
      </div>

      <Separator />

      {/* Edge case cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {edgeCases.map((item) => (
          <EdgeCaseCard key={item.title} item={item} />
        ))}
      </div>

      {/* Bottom note */}
      <Card className="border-dashed border-2 border-border bg-cashew/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cashew mt-0.5">
              <CheckCircle className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Defensive Design Philosophy</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every edge case is designed with a primary mitigation and a fallback recovery path. The system is built to degrade gracefully — 
                even if all digital channels fail, the paper-ticket + agent workflow ensures the queue continues to function. 
                Technology is an enhancement, not a dependency.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
