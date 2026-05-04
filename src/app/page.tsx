'use client';

import React, { useEffect, useState } from 'react';
import { useQueueFlowStore } from '@/lib/store';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3, Users, UserCheck, Truck, Smartphone, Layers, Cable,
  DollarSign, AlertTriangle, Map, Search, Moon, Sun, Bell, Settings,
  X, Radio
} from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const navigationItems: { id: ActiveSection; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'queue', label: 'Live Queue', icon: <Users className="w-4 h-4" /> },
  { id: 'agent', label: 'Agent Panel', icon: <UserCheck className="w-4 h-4" /> },
  { id: 'driver', label: 'Driver Panel', icon: <Truck className="w-4 h-4" /> },
  { id: 'ussd', label: 'USSD Simulator', icon: <Smartphone className="w-4 h-4" /> },
  { id: 'architecture', label: 'Architecture', icon: <Layers className="w-4 h-4" /> },
  { id: 'api-docs', label: 'API Docs', icon: <Cable className="w-4 h-4" /> },
  { id: 'monetization', label: 'Monetization', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'edge-cases', label: 'Edge Cases', icon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'roadmap', label: 'Roadmap', icon: <Map className="w-4 h-4" /> },
];

export default function HomePage() {
  const { activeSection, setActiveSection } = useQueueFlowStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const filteredNav = navigationItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const notifications = [
    { id: 1, text: 'Vehicle GW-4521-Y arrived at Circle', time: '2m ago', type: 'info' },
    { id: 2, text: 'Queue paused at Kaneshie Station', time: '8m ago', type: 'warning' },
    { id: 3, text: '15 passengers boarded successfully', time: '12m ago', type: 'success' },
    { id: 4, text: 'New driver registered: Emmanuel Tetteh', time: '25m ago', type: 'info' },
  ];

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
    <div className="min-h-screen flex flex-col bg-background bg-mesh">
      {/* Top bar - mobile glass header */}
      <header className="lg:hidden sticky top-0 z-50 glass-header px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label="Toggle navigation"
        >
          {sidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-foreground flex items-center justify-center shadow-sm">
            <span className="text-background text-[10px] font-bold tracking-tight">QF</span>
          </div>
          <span className="font-semibold text-sm tracking-tight">QueueFlow</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
          </button>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar — Glassmorphism */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-[260px] glass-sidebar transform transition-transform duration-300 ease-out lg:relative lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Logo */}
          <div className="h-16 flex items-center gap-3 px-5 border-b border-sidebar-border">
            <div className="w-9 h-9 rounded-xl bg-foreground flex items-center justify-center shadow-sm">
              <span className="text-background text-xs font-bold tracking-tight">QF</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-[15px] leading-tight tracking-tight">QueueFlow</h1>
              <p className="text-[11px] text-soft leading-tight">Transport Queue System</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-accent transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="px-3 py-3 border-b border-sidebar-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-soft" />
              <Input
                placeholder="Search sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-accent/50 border-sidebar-border focus:ring-1 focus:ring-soft/30 rounded-lg"
              />
            </div>
          </div>

          {/* Location selector */}
          <div className="px-4 py-2.5 border-b border-sidebar-border">
            <label className="text-[10px] uppercase tracking-[0.08em] text-soft font-medium">Active Location</label>
            <select className="mt-1 w-full text-sm bg-accent/50 border border-sidebar-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-soft/30 transition-colors">
              <option>Kwame Nkrumah Circle</option>
              <option>Kaneshie Station</option>
              <option>Tema Station</option>
            </select>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-2 px-3 custom-scrollbar" role="navigation" aria-label="Main navigation">
            <div className="space-y-0.5">
              {filteredNav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200
                    ${activeSection === item.id
                      ? 'bg-foreground text-background shadow-md shadow-foreground/10'
                      : 'text-soft hover:text-foreground hover:bg-accent/50'
                    }
                  `}
                  aria-current={activeSection === item.id ? 'page' : undefined}
                >
                  <span className={`flex-shrink-0 ${activeSection === item.id ? 'text-background' : 'text-foreground'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.id === 'queue' && (
                    <span className="ml-auto flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-soft hover:text-foreground hover:bg-accent/50 transition-all duration-200 mb-2"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-soft hover:text-foreground hover:bg-accent/50 transition-all duration-200 mb-3"
            >
              <div className="relative">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-destructive border-2 border-background" />
              </div>
              <span>Notifications</span>
              <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-1.5">4</Badge>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] text-soft">System Online</span>
              <span className="text-[10px] text-soft/50 ml-auto">v1.0.0</span>
            </div>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-rock/20 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Notification Panel */}
        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed right-4 top-16 lg:top-4 z-50 w-80 glass-card rounded-2xl overflow-hidden shadow-xl"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-glass-border">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <button onClick={() => setShowNotifications(false)} className="p-1 rounded-md hover:bg-accent">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 border-b border-glass-border hover:bg-accent/30 transition-colors cursor-pointer">
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        n.type === 'info' ? 'bg-blue-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-relaxed">{n.text}</p>
                        <p className="text-[10px] text-soft mt-1">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-glass-border">
                <button className="text-xs text-soft hover:text-foreground transition-colors font-medium">
                  View all notifications
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
            {/* Top action bar */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 glass-stat rounded-full">
                  <Radio className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs font-medium">Live</span>
                  <span className="text-xs text-soft">47 in queue</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 glass-stat rounded-full">
                  <Truck className="w-3.5 h-3.5 text-foreground" />
                  <span className="text-xs font-medium">8 active drivers</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 glass-stat rounded-xl hover:bg-accent/50 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive" />
                </button>
                <button
                  onClick={toggleDarkMode}
                  className="p-2.5 glass-stat rounded-xl hover:bg-accent/50 transition-colors"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button className="p-2.5 glass-stat rounded-xl hover:bg-accent/50 transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
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
