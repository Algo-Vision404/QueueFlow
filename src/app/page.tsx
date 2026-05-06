'use client';

import React, { useEffect, useState } from 'react';
import { useQueueFlowStore } from '@/lib/store';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3, Users, UserCheck, Truck, Smartphone, Activity, Cable,
  DollarSign, ShieldAlert, ListChecks, Brain, Bell, Moon, Sun, MoreHorizontal,
  ChevronRight, X, Search,
} from 'lucide-react';
import {
  OverviewDashboard
} from '@/components/queue-flow/overview-dashboard';
import { LiveQueue } from '@/components/queue-flow/live-queue';
import { AgentPanel } from '@/components/queue-flow/agent-panel';
import { DriverPanel } from '@/components/queue-flow/driver-panel';
import { USSDSimulator } from '@/components/queue-flow/ussd-simulator';
import { ArchitectureView } from '@/components/queue-flow/system-monitor';
import { ApiDocs } from '@/components/queue-flow/api-console';
import { MonetizationView } from '@/components/queue-flow/revenue-analytics';
import { EdgeCasesView } from '@/components/queue-flow/alerts-panel';
import { RoadmapView } from '@/components/queue-flow/task-tracker';
import { MLInsights } from '@/components/queue-flow/ml-insights';
import type { ActiveSection } from '@/lib/types';
import { Input } from '@/components/ui/input';

// ── Tab definitions ─────────────────────────────────────────────────────────
interface TabDef {
  id: ActiveSection;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const primaryTabs: TabDef[] = [
  { id: 'overview', label: 'Home', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'queue', label: 'Queue', icon: <Users className="w-5 h-5" />, badge: 47 },
  { id: 'agent', label: 'Agent', icon: <UserCheck className="w-5 h-5" /> },
  { id: 'driver', label: 'Driver', icon: <Truck className="w-5 h-5" /> },
  { id: 'more', label: 'More', icon: <MoreHorizontal className="w-5 h-5" /> },
];

const moreTabs: TabDef[] = [
  { id: 'ussd', label: 'USSD Simulator', icon: <Smartphone className="w-5 h-5" /> },
  { id: 'ml', label: 'ML Insights', icon: <Brain className="w-5 h-5" /> },
  { id: 'architecture', label: 'System Monitor', icon: <Activity className="w-5 h-5" /> },
  { id: 'api-docs', label: 'API Console', icon: <Cable className="w-5 h-5" /> },
  { id: 'monetization', label: 'Revenue', icon: <DollarSign className="w-5 h-5" /> },
  { id: 'edge-cases', label: 'Alerts', icon: <ShieldAlert className="w-5 h-5" /> },
  { id: 'roadmap', label: 'Tasks', icon: <ListChecks className="w-5 h-5" /> },
];

const notifications = [
  { id: 1, text: 'Vehicle GW-4521-Y arrived at Circle', time: '2m ago', read: false },
  { id: 2, text: 'Queue paused at Kaneshie Station', time: '8m ago', read: false },
  { id: 3, text: '15 passengers boarded successfully', time: '12m ago', read: true },
];

// ── Section render ─────────────────────────────────────────────────────────
function SectionRenderer({ section }: { section: ActiveSection }) {
  switch (section) {
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
    case 'ml': return <MLInsights />;
    default: return <OverviewDashboard />;
  }
}

// ── Main component ─────────────────────────────────────────────────────────
export default function HomePage() {
  const { activeSection, setActiveSection } = useQueueFlowStore();
  const [darkMode, setDarkMode] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationBadge] = useState(notifications.filter(n => !n.read).length);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleTabPress = (tab: TabDef) => {
    if (tab.id === 'more') {
      setShowMore(true);
    } else {
      setActiveSection(tab.id);
      setShowMore(false);
    }
  };

  const handleMoreItem = (id: ActiveSection) => {
    setActiveSection(id);
    setShowMore(false);
  };

  return (
    <div className="h-dvh flex flex-col bg-background bg-mesh overflow-hidden select-none">
      {/* ── App Header ── */}
      <header className="flex-shrink-0 glass-header px-4 pt-[env(safe-area-inset-top)] z-40 relative">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo + Location */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-foreground flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-background text-[11px] font-bold tracking-tight">QF</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm tracking-tight truncate">QueueFlow</h1>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                </span>
                <span className="text-[11px] text-soft truncate">Kwame Nkrumah Circle</span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2.5 rounded-xl active:scale-95 transition-transform"
              aria-label="Search"
            >
              <Search className="w-[18px] h-[18px] text-foreground" />
            </button>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl active:scale-95 transition-transform"
              aria-label="Notifications"
            >
              <Bell className="w-[18px] h-[18px] text-foreground" />
              {notificationBadge > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center">
                  {notificationBadge}
                </span>
              )}
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl active:scale-95 transition-transform"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soft" />
                  <Input
                    placeholder="Search passengers, tickets, drivers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="pl-10 h-10 text-sm bg-accent/50 border-border rounded-2xl"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-hidden relative z-10">
        <div
          className="h-full overflow-y-auto overscroll-y-contain custom-scrollbar"
          style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
        >
          <div className="px-4 pt-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <SectionRenderer section={activeSection} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* ── Bottom Tab Bar ── */}
      <nav
        className="flex-shrink-0 glass-tab-bar z-40 border-t border-glass-border relative"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {primaryTabs.map((tab) => {
            const isActive = tab.id !== 'more' && activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabPress(tab)}
                className={`
                  relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 px-2 rounded-2xl transition-all duration-200
                  ${isActive ? 'text-foreground' : 'text-soft active:text-foreground'}
                `}
                aria-current={isActive ? 'page' : undefined}
                aria-label={tab.label}
              >
                <div className={`relative transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  {tab.icon}
                  {tab.badge && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-foreground text-background text-[9px] font-bold flex items-center justify-center px-1">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-foreground' : ''}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="tabIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-foreground"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── More Menu (Bottom Sheet) ── */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) setShowMore(false);
              }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl glass-card overflow-hidden"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              <div className="px-5 pb-3">
                <h2 className="font-semibold text-base">More</h2>
                <p className="text-xs text-soft mt-0.5">Monitoring, tools & management</p>
              </div>
              <div className="px-3 pb-4 space-y-1 max-h-[50vh] overflow-y-auto custom-scrollbar">
                {moreTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleMoreItem(tab.id)}
                    className={`
                      w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all
                      ${activeSection === tab.id
                        ? 'bg-foreground text-background'
                        : 'text-foreground active:bg-accent'
                      }
                    `}
                  >
                    <span className={activeSection === tab.id ? 'text-background' : 'text-foreground'}>
                      {tab.icon}
                    </span>
                    <span className="flex-1 text-left">{tab.label}</span>
                    <ChevronRight className={`w-4 h-4 ${activeSection === tab.id ? 'text-background/50' : 'text-soft'}`} />
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Notification Sheet ── */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm"
              onClick={() => setShowNotifications(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) setShowNotifications(false);
              }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl glass-card overflow-hidden"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              <div className="px-5 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-base">Notifications</h2>
                  <p className="text-xs text-soft mt-0.5">{notificationBadge} new</p>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-2 rounded-xl active:bg-accent transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-3 pb-4 space-y-1 max-h-[50vh] overflow-y-auto custom-scrollbar">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 rounded-2xl active:bg-accent/60 transition-colors ${
                      !n.read ? 'bg-accent/30' : ''
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-foreground`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-relaxed">{n.text}</p>
                      <p className="text-[11px] text-soft mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
