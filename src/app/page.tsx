'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useQueueFlowStore } from '@/lib/store';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3, Users, UserCheck, UserPlus, Truck, Smartphone, Layers, Cable,
  DollarSign, AlertTriangle, Map, Bell, Moon, Sun, Radio,
  ChevronRight, X, Search, MoreHorizontal
} from 'lucide-react';
import {
  OverviewDashboard
} from '@/components/queue-flow/overview-dashboard';
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

// ── Tab definitions ─────────────────────────────────────────────────────────
interface TabDef {
  id: ActiveSection;
  label: string;
  shortLabel?: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
}

const primaryTabs: TabDef[] = [
  { id: 'overview', label: 'Home', icon: <BarChart3 className="w-5 h-5" />, activeIcon: <BarChart3 className="w-5 h-5" /> },
  { id: 'queue', label: 'Queue', icon: <Users className="w-5 h-5" />, activeIcon: <Users className="w-5 h-5" /> },
  { id: 'agent', label: 'Agent', icon: <UserCheck className="w-5 h-5" />, activeIcon: <UserCheck className="w-5 h-5" /> },
  { id: 'driver', label: 'Driver', icon: <Truck className="w-5 h-5" />, activeIcon: <Truck className="w-5 h-5" /> },
  { id: 'more', label: 'More', icon: <MoreHorizontal className="w-5 h-5" />, activeIcon: <MoreHorizontal className="w-5 h-5" /> },
];

const moreTabs: TabDef[] = [
  { id: 'ussd', label: 'USSD Simulator', icon: <Smartphone className="w-5 h-5" />, activeIcon: <Smartphone className="w-5 h-5" /> },
  { id: 'architecture', label: 'Architecture', icon: <Layers className="w-5 h-5" />, activeIcon: <Layers className="w-5 h-5" /> },
  { id: 'api-docs', label: 'API Docs', icon: <Cable className="w-5 h-5" />, activeIcon: <Cable className="w-5 h-5" /> },
  { id: 'monetization', label: 'Monetization', icon: <DollarSign className="w-5 h-5" />, activeIcon: <DollarSign className="w-5 h-5" /> },
  { id: 'edge-cases', label: 'Edge Cases', icon: <AlertTriangle className="w-5 h-5" />, activeIcon: <AlertTriangle className="w-5 h-5" /> },
  { id: 'roadmap', label: 'Roadmap', icon: <Map className="w-5 h-5" />, activeIcon: <Map className="w-5 h-5" /> },
];

const allSectionIds: ActiveSection[] = ['overview', 'queue', 'agent', 'driver', 'ussd', 'architecture', 'api-docs', 'monetization', 'edge-cases', 'roadmap'];

const notifications = [
  { id: 1, text: 'Vehicle GW-4521-Y arrived at Circle', time: '2m ago', type: 'info' as const },
  { id: 2, text: 'Queue paused at Kaneshie Station', time: '8m ago', type: 'warning' as const },
  { id: 3, text: '15 passengers boarded successfully', time: '12m ago', type: 'success' as const },
  { id: 4, text: 'New driver registered: Emmanuel Tetteh', time: '25m ago', type: 'info' as const },
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullY] = useState(0);

  // ── Dark mode ──
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // ── Register service worker ──
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // ── Section navigation helpers ──
  const currentIndex = allSectionIds.indexOf(activeSection);
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

  // ── Pull to refresh simulation ──
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setPullY(0);
    }, 1200);
  };

  // ── Determine direction for animation ──
  const [direction, setDirection] = useState(0);
  const handleSectionChange = (id: ActiveSection) => {
    const newIndex = allSectionIds.indexOf(id);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveSection(id);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0.8 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0.8 }),
  };

  return (
    <div className="h-dvh flex flex-col bg-background bg-mesh overflow-hidden select-none">
      {/* ── App Header ── */}
      <header className="flex-shrink-0 glass-header px-4 pt-[env(safe-area-inset-top)] z-40">
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
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive" />
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

        {/* Search bar (collapsible) */}
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
                    placeholder="Search passengers, tickets..."
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

      {/* ── Main Content Area (scrollable) ── */}
      <main className="flex-1 overflow-hidden relative">
        <div
          className="h-full overflow-y-auto overscroll-y-contain custom-scrollbar"
          style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
        >
          {/* Refresh indicator */}
          <AnimatePresence>
            {isRefreshing && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-3"
              >
                <div className="w-5 h-5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Section with slide transition */}
          <div className="px-4 pt-2">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeSection}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <SectionRenderer section={activeSection} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* ── Bottom Tab Bar ── */}
      <nav
        className="flex-shrink-0 glass-tab-bar z-40 border-t border-glass-border"
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
                  flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 px-2 rounded-2xl transition-all duration-200
                  ${isActive ? 'text-foreground' : 'text-soft active:text-foreground'}
                `}
                aria-current={isActive ? 'page' : undefined}
                aria-label={tab.label}
              >
                <div className={`relative transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  {tab.icon}
                  {tab.id === 'queue' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500 ring-2 ring-background" />
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
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-card border-t border-border max-h-[70vh] overflow-hidden"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="px-5 pb-3">
                <h2 className="font-semibold text-base">More Sections</h2>
                <p className="text-xs text-soft mt-0.5">System documentation and tools</p>
              </div>

              {/* Items */}
              <div className="px-3 pb-4 space-y-1 max-h-[50vh] overflow-y-auto custom-scrollbar">
                {moreTabs.map((tab, idx) => (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
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
                  </motion.button>
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
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-card border-t border-border max-h-[70vh] overflow-hidden"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>
              <div className="px-5 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-base">Notifications</h2>
                  <p className="text-xs text-soft mt-0.5">{notifications.length} new</p>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-2 rounded-xl active:bg-accent transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-3 pb-4 space-y-1 max-h-[50vh] overflow-y-auto custom-scrollbar">
                {notifications.map((n, idx) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-start gap-3 px-4 py-3 rounded-2xl active:bg-accent transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      n.type === 'info' ? 'bg-blue-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-relaxed">{n.text}</p>
                      <p className="text-[11px] text-soft mt-1">{n.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── FAB (Floating Action Button) ── */}
      <AnimatePresence>
        {(activeSection === 'queue' || activeSection === 'agent') && !showMore && !showNotifications && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="fixed bottom-20 right-4 z-30"
          >
            <button
              className="w-14 h-14 rounded-full bg-foreground text-background shadow-lg shadow-foreground/25 flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Quick action"
            >
              {activeSection === 'queue' ? (
                <Users className="w-6 h-6" />
              ) : (
                <UserPlus className="w-6 h-6" />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
