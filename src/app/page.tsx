'use client';

import React, { useEffect, useState } from 'react';
import { useQueueFlowStore } from '@/lib/store';
import { AnimatePresence, motion } from 'framer-motion';

// Section imports
import { OverviewDashboard } from '@/components/queue-flow/overview-dashboard';
import { LiveQueue } from '@/components/queue-flow/live-queue';
import { AgentPanel } from '@/components/queue-flow/agent-panel';
import { DriverPanel } from '@/components/queue-flow/driver-panel';
import { USSDSimulator } from '@/components/queue-flow/ussd-simulator';
import { ArchitectureView } from '@/components/queue-flow/architecture-view';
import { ApiDocs } from '@/components/queue-flow/api-docs';
import { MonetizationView } from '@/components/queue-flow/monetization-view';
import { EdgeCasesView } from '@/components/queue-flow/edge-cases-view';
import { RoadmapView } from '@/components/queue-flow/roadmap-view';
import type { ActiveSection } from '@/lib/types';

const navigationItems: { id: ActiveSection; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'queue', label: 'Live Queue', icon: '🚶' },
  { id: 'agent', label: 'Agent Panel', icon: '👤' },
  { id: 'driver', label: 'Driver Panel', icon: '🚐' },
  { id: 'ussd', label: 'USSD Simulator', icon: '📱' },
  { id: 'architecture', label: 'Architecture', icon: '🏗️' },
  { id: 'api-docs', label: 'API Docs', icon: '🔌' },
  { id: 'monetization', label: 'Monetization', icon: '💰' },
  { id: 'edge-cases', label: 'Edge Cases', icon: '⚠️' },
  { id: 'roadmap', label: 'Roadmap', icon: '🗺️' },
];

export default function HomePage() {
  const { activeSection, setActiveSection } = useQueueFlowStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case 'overview': return <OverviewDashboard />;
      case 'queue': return <LiveQueue />;
      case 'agent': return <AgentPanel />;
      case 'driver': return <DriverPanel />;
      case 'ussd': return <USSDSimulator />;
      case 'architecture': return <ArchitectureView />;
      case 'api-docs': return <ApiDocs />;
      case 'monetization': return <MonetizationView />;
      case 'edge-cases': return <EdgeCasesView />;
      case 'roadmap': return <RoadmapView />;
      default: return <OverviewDashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar - mobile */}
      <header className="lg:hidden sticky top-0 z-50 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label="Toggle navigation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">QF</span>
          </div>
          <span className="font-semibold text-sm">QueueFlow</span>
        </div>
        <div className="w-9" />
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Logo */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">QF</span>
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight">QueueFlow</h1>
              <p className="text-[11px] text-muted-foreground leading-tight">Transport Queue System</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden ml-auto p-1 rounded hover:bg-accent"
              aria-label="Close sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Location selector */}
          <div className="px-4 py-3 border-b border-border">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Active Location</label>
            <select className="mt-1 w-full text-sm bg-background border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
              <option>Kwame Nkrumah Circle</option>
              <option>Kaneshie Station</option>
              <option>Tema Station</option>
            </select>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-2 px-3" role="navigation" aria-label="Main navigation">
            <div className="space-y-0.5">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                    ${activeSection === item.id
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }
                  `}
                  aria-current={activeSection === item.id ? 'page' : undefined}
                >
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">System Online</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">v1.0.0 MVP</p>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
