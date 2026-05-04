'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Server,
  Database,
  Smartphone,
  Globe,
  Shield,
  Zap,
  Layers,
  Phone,
  MessageSquare,
  UserCheck,
  Headphones,
  GitBranch,
  Bus,
  Bell,
  Cable,
  Radio,
  Users,
  Tag,
  Timer,
  Truck,
  Volume2,
  CheckCircle,
  Flag,
} from 'lucide-react';

// =============================================
// Architecture Diagram - CSS-only visual
// =============================================
function ArchitectureDiagram() {
  const channels: { icon: React.ReactNode; label: string }[] = [
    { icon: <Phone className="w-4 h-4" />, label: 'USSD' },
    { icon: <MessageSquare className="w-4 h-4" />, label: 'SMS' },
    { icon: <Globe className="w-4 h-4" />, label: 'Web App' },
    { icon: <UserCheck className="w-4 h-4" />, label: 'Agent App' },
    { icon: <Headphones className="w-4 h-4" />, label: 'IVR' },
  ];

  const engine: { icon: React.ReactNode; label: string }[] = [
    { icon: <GitBranch className="w-4 h-4" />, label: 'API Gateway' },
    { icon: <Zap className="w-4 h-4" />, label: 'Queue Engine' },
    { icon: <Bus className="w-4 h-4" />, label: 'Boarding Controller' },
    { icon: <Bell className="w-4 h-4" />, label: 'Notification Service' },
  ];

  const infra: { icon: React.ReactNode; label: string }[] = [
    { icon: <Database className="w-4 h-4" />, label: 'PostgreSQL' },
    { icon: <Zap className="w-4 h-4" />, label: 'Redis Cache' },
    { icon: <Cable className="w-4 h-4" />, label: 'WebSocket Server' },
    { icon: <Radio className="w-4 h-4" />, label: 'Telecom Gateway' },
  ];

  return (
    <div className="relative bg-gradient-to-b from-cashew to-linen/30 dark:from-cashew dark:to-linen/20 rounded-xl p-4 sm:p-6 lg:p-8 overflow-x-auto">
      {/* Access Channels Layer */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Access Channels
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {channels.map((ch) => (
            <div
              key={ch.label}
              className="flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-primary-foreground px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg shadow-sm transition-colors min-w-[80px] sm:min-w-[100px] justify-center"
            >
              <span className="text-sm sm:text-base flex items-center">{ch.icon}</span>
              <span className="text-xs sm:text-sm font-medium">{ch.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Arrow connector 1 */}
      <div className="flex justify-center my-3">
        <div className="flex flex-col items-center">
          <div className="w-px h-6 bg-soft" />
          <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-soft" />
        </div>
      </div>

      {/* API Gateway & Queue Engine Layer */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-soft" />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
            API Gateway & Queue Engine
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {engine.map((item, idx) => (
            <React.Fragment key={item.label}>
              <div className="flex items-center gap-2 bg-soft hover:bg-soft/80 text-foreground px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg shadow-sm transition-colors min-w-[100px] sm:min-w-[120px] justify-center">
                <span className="text-sm sm:text-base flex items-center">{item.icon}</span>
                <span className="text-xs sm:text-sm font-medium">{item.label}</span>
              </div>
              {idx < engine.length - 1 && (
                <div className="hidden sm:flex items-center text-foreground/60">
                  <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                    <path d="M0 6H18M18 6L12 2M18 6L12 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Arrow connector 2 */}
      <div className="flex justify-center my-3">
        <div className="flex flex-col items-center">
          <div className="w-px h-6 bg-soft" />
          <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-soft" />
        </div>
      </div>

      {/* Data & Infrastructure Layer */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-linen" />
          <span className="text-xs font-semibold uppercase tracking-wider text-soft">
            Data & Infrastructure
          </span>
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {infra.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 bg-linen hover:bg-linen/80 text-foreground px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg shadow-sm transition-colors min-w-[100px] sm:min-w-[120px] justify-center"
            >
              <span className="text-sm sm:text-base flex items-center">{item.icon}</span>
              <span className="text-xs sm:text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================
// Data Flow Diagram
// =============================================
function DataFlowDiagram() {
  const steps: { num: number; title: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      num: 1,
      title: 'Passenger joins queue',
      desc: 'Via USSD, SMS, Agent app, or Web interface',
      icon: <Users className="w-4 h-4" />,
      color: 'cashew',
    },
    {
      num: 2,
      title: 'Queue Engine assigns ticket',
      desc: 'Ticket number and position calculated & stored',
      icon: <Tag className="w-4 h-4" />,
      color: 'warm',
    },
    {
      num: 3,
      title: 'Wait time estimated & sent',
      desc: 'SMS notification with estimated wait time',
      icon: <Timer className="w-4 h-4" />,
      color: 'cashew',
    },
    {
      num: 4,
      title: 'Driver arrives & reports',
      desc: 'Driver confirms arrival via app or USSD',
      icon: <Truck className="w-4 h-4" />,
      color: 'linen',
    },
    {
      num: 5,
      title: 'Agent triggers boarding',
      desc: 'Agent initiates boarding call for next group',
      icon: <Volume2 className="w-4 h-4" />,
      color: 'warm',
    },
    {
      num: 6,
      title: 'Passengers notified',
      desc: 'SMS batch + display board update for next N passengers',
      icon: <Smartphone className="w-4 h-4" />,
      color: 'cashew',
    },
    {
      num: 7,
      title: 'Boarding & verification',
      desc: 'Passengers board in order, agent verifies tickets',
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'warm',
    },
    {
      num: 8,
      title: 'Driver confirms completion',
      desc: 'System updates queue, next cycle begins',
      icon: <Flag className="w-4 h-4" />,
      color: 'linen',
    },
  ];

  const colorMap: Record<string, string> = {
    cashew: 'bg-cashew text-foreground dark:bg-cashew dark:text-foreground border-border',
    warm: 'bg-warm text-foreground dark:bg-warm dark:text-foreground border-border',
    linen: 'bg-linen/50 text-foreground dark:bg-linen dark:text-foreground border-border',
  };

  const dotColorMap: Record<string, string> = {
    cashew: 'bg-foreground',
    warm: 'bg-foreground',
    linen: 'bg-foreground',
  };

  return (
    <div className="space-y-3">
      {steps.map((step, idx) => (
        <React.Fragment key={step.num}>
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Timeline dot and line */}
            <div className="flex flex-col items-center pt-0.5">
              <div className={`w-7 h-7 rounded-full ${dotColorMap[step.color]} flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0`}>
                {step.num}
              </div>
              {idx < steps.length - 1 && (
                <div className="w-px h-full min-h-[40px] bg-border my-1" />
              )}
            </div>

            {/* Step content */}
            <div className={`flex-1 border rounded-lg p-3 sm:p-4 ${colorMap[step.color]} transition-shadow hover:shadow-sm`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base flex items-center">{step.icon}</span>
                <span className="font-semibold text-sm">{step.title}</span>
              </div>
              <p className="text-xs sm:text-sm opacity-80 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// =============================================
// Tech Stack Table
// =============================================
function TechStackTable() {
  const rows = [
    { layer: 'Frontend', tech: 'React / Next.js', purpose: 'Web dashboard & agent interface', icon: <Globe className="w-4 h-4" /> },
    { layer: 'Mobile', tech: 'USSD + SMS', purpose: 'Feature phone support for passengers', icon: <Smartphone className="w-4 h-4" /> },
    { layer: 'Backend', tech: 'Node.js / Express', purpose: 'API server & business logic', icon: <Server className="w-4 h-4" /> },
    { layer: 'Database', tech: 'PostgreSQL', purpose: 'Persistent data storage', icon: <Database className="w-4 h-4" /> },
    { layer: 'Cache', tech: 'Redis', purpose: 'Session management & queue state', icon: <Zap className="w-4 h-4" /> },
    { layer: 'Real-time', tech: 'Socket.io', purpose: 'Live updates & WebSocket comms', icon: <Zap className="w-4 h-4" /> },
    { layer: 'Queue Processing', tech: 'Bull / BullMQ', purpose: 'Background job processing', icon: <Layers className="w-4 h-4" /> },
    { layer: 'Telecom', tech: "Africa's Talking / MTN API", purpose: 'USSD & SMS gateway integration', icon: <Smartphone className="w-4 h-4" /> },
    { layer: 'Hosting', tech: 'AWS / DigitalOcean', purpose: 'Cloud infrastructure', icon: <Server className="w-4 h-4" /> },
    { layer: 'Monitoring', tech: 'Sentry + Grafana', purpose: 'Error tracking & performance', icon: <Shield className="w-4 h-4" /> },
  ];

  const layerColorMap: Record<string, string> = {
    Frontend: 'bg-cashew text-foreground dark:bg-cashew dark:text-foreground',
    Mobile: 'bg-cashew text-foreground dark:bg-cashew dark:text-foreground',
    Backend: 'bg-cashew text-foreground dark:bg-cashew dark:text-foreground',
    Database: 'bg-cashew text-foreground dark:bg-cashew dark:text-foreground',
    Cache: 'bg-cashew text-foreground dark:bg-cashew dark:text-foreground',
    'Real-time': 'bg-cashew text-foreground dark:bg-cashew dark:text-foreground',
    'Queue Processing': 'bg-cashew text-foreground dark:bg-cashew dark:text-foreground',
    Telecom: 'bg-cashew text-foreground dark:bg-cashew dark:text-foreground',
    Hosting: 'bg-cashew text-foreground dark:bg-cashew dark:text-foreground',
    Monitoring: 'bg-cashew text-foreground dark:bg-cashew dark:text-foreground',
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[120px] sm:w-[140px]">Layer</TableHead>
            <TableHead className="w-[160px] sm:w-[180px]">Technology</TableHead>
            <TableHead>Purpose</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.layer} className="group hover:bg-muted/30 transition-colors">
              <TableCell>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${layerColorMap[row.layer]}`}>
                  {row.icon}
                  {row.layer}
                </span>
              </TableCell>
              <TableCell className="font-mono text-sm font-medium">{row.tech}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{row.purpose}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// =============================================
// Multi-Channel Architecture
// =============================================
function MultiChannelView() {
  const channels = [
    {
      name: 'USSD',
      icon: <Phone className="w-5 h-5" />,
      color: 'cashew',
      flow: ['Phone (Feature)', 'Telecom Gateway', 'USSD Handler', 'Queue API'],
      description: 'Dial *384*200# to join queue, check position, or get updates',
    },
    {
      name: 'SMS',
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'cashew',
      flow: ['Phone (Any)', 'SMS Gateway', 'SMS Handler', 'Queue API'],
      description: 'Text JOIN to short code, receive position updates via SMS',
    },
    {
      name: 'Web App',
      icon: <Globe className="w-5 h-5" />,
      color: 'warm',
      flow: ['Browser', 'Next.js Frontend', 'API Routes', 'Queue API'],
      description: 'Smartphone users access dashboard, join queue, track position',
    },
    {
      name: 'Agent App',
      icon: <UserCheck className="w-5 h-5" />,
      color: 'warm',
      flow: ['Tablet', 'Agent App (PWA)', 'API Routes', 'Queue API'],
      description: 'Agents manage queue, add passengers, trigger boarding',
    },
  ];

  const colorClasses: Record<string, { bg: string; border: string; dot: string; text: string; arrow: string }> = {
    cashew: {
      bg: 'bg-cashew dark:bg-cashew',
      border: 'border-border',
      dot: 'bg-foreground',
      text: 'text-foreground',
      arrow: 'text-soft',
    },
    warm: {
      bg: 'bg-warm dark:bg-warm',
      border: 'border-border',
      dot: 'bg-soft',
      text: 'text-foreground',
      arrow: 'text-soft',
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {channels.map((ch) => {
        const colors = colorClasses[ch.color];
        return (
          <Card key={ch.name} className={`glass-card border ${colors.border} ${colors.bg}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl flex items-center">{ch.icon}</span>
                <CardTitle className="text-base">{ch.name}</CardTitle>
                <Badge variant="outline" className={`ml-auto text-[10px] ${colors.text} ${colors.border}`}>Channel</Badge>
              </div>
              <CardDescription className="text-xs">{ch.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-1.5">
                {ch.flow.map((step, idx) => (
                  <React.Fragment key={step}>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border ${colors.border} bg-white dark:bg-background`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      {step}
                    </div>
                    {idx < ch.flow.length - 1 && (
                      <svg width="16" height="12" viewBox="0 0 16 12" className={`${colors.arrow} flex-shrink-0`}>
                        <path d="M0 6H14M14 6L8 2M14 6L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// =============================================
// Main Component
// =============================================
export function ArchitectureView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-cashew">
            <Layers className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">System Architecture</h2>
            <p className="text-sm text-muted-foreground">QueueFlow transport queue management system design</p>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="diagram" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-grid h-auto gap-1 p-1 bg-muted">
          <TabsTrigger value="diagram" className="text-xs sm:text-sm px-3 py-2">Architecture Diagram</TabsTrigger>
          <TabsTrigger value="dataflow" className="text-xs sm:text-sm px-3 py-2">Data Flow</TabsTrigger>
          <TabsTrigger value="techstack" className="text-xs sm:text-sm px-3 py-2">Tech Stack</TabsTrigger>
          <TabsTrigger value="channels" className="text-xs sm:text-sm px-3 py-2">Multi-Channel</TabsTrigger>
        </TabsList>

        {/* Tab 1: Architecture Diagram */}
        <TabsContent value="diagram" className="mt-4 space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="w-4 h-4 text-foreground" />
                High-Level Architecture
              </CardTitle>
              <CardDescription>
                Three-tier architecture: Access Channels → Processing Engine → Data Infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ArchitectureDiagram />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="glass-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-foreground" />
                  <span className="font-semibold text-sm text-foreground">Access Channels</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Multiple input channels ensure all passengers can join regardless of device capability — from basic feature phones to smartphones.
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-soft" />
                  <span className="font-semibold text-sm text-foreground">Processing Engine</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The core queue logic handles ticket assignment, wait calculation, boarding orchestration, and multi-channel notifications.
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-linen" />
                  <span className="font-semibold text-sm text-soft">Infrastructure</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Persistent storage, caching for performance, real-time WebSocket updates, and telecom gateway integration.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Data Flow */}
        <TabsContent value="dataflow" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-foreground" />
                Data Flow — Queue Lifecycle
              </CardTitle>
              <CardDescription>
                Step-by-step flow from passenger joining to driver departure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataFlowDiagram />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Tech Stack */}
        <TabsContent value="techstack" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="w-4 h-4 text-foreground" />
                Technology Stack
              </CardTitle>
              <CardDescription>
                Complete technology choices for each layer of the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TechStackTable />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Multi-Channel */}
        <TabsContent value="channels" className="mt-4 space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-foreground" />
                Multi-Channel Architecture
              </CardTitle>
              <CardDescription>
                Every channel feeds into the same unified Queue API backend for consistent data management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MultiChannelView />
            </CardContent>
          </Card>

          <Card className="glass-card border-dashed border-2 border-border bg-cashew/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cashew mt-0.5">
                  <Shield className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Unified Backend Design</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    All access channels converge at the Queue API, ensuring a single source of truth for queue state.
                    This means a passenger who joins via USSD can check their position on the web, and the agent sees the same
                    data regardless of how the passenger enrolled. The system maintains channel-awareness for optimized
                    response formatting (USSD text vs. rich web UI).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
