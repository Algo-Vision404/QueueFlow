'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useQueueFlowStore } from '@/lib/store';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3, Users, UserCheck, UserPlus, Truck, Smartphone, Layers, Cable,
  DollarSign, AlertTriangle, Map, Bell, Moon, Sun, Radio,
  ChevronRight, X, Search, MoreHorizontal, Zap, Activity,
  ChevronDown, ZapOff, Wifi, WifiOff, Thermometer, Target,
  CheckCircle2, Keyboard,
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

// ── Toast System ──────────────────────────────────────────────────────
interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

const toastIcons = {
  info: <Activity className="w-3.5 h-3.5" />,
  success: <CheckCircle2 className="w-3.5 h-3.5" />,
  warning: <AlertTriangle className="w-3.5 h-3.5" />,
};

const toastColors = {
  info: 'bg-cashew border-border',
  success: 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400',
  warning: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400',
};

// ── Marquee Ticker ────────────────────────────────────────────────────
function MarqueeTicker({
  items,
  speed = 40,
}: {
  items: string[];
  speed?: number;
}) {
  return (
    <div className="relative overflow-hidden w-full">
      <div
        className="flex whitespace-nowrap animate-[marquee_40s_linear_infinite]"
        style={{ animationDuration: `${speed}s` }}
      >
        {[...items, ...items, ...items].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 mx-6 text-xs text-soft">
            <span className="w-1 h-1 rounded-full bg-foreground/30 flex-shrink-0" />
            {item}
          </span>
        ))}
      </div>
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  );
}

// ── Glowing Line ──────────────────────────────────────────────────────
function GlowingLine({ className = '' }: { className?: string }) {
  return (
    <div className={`relative h-px w-full ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/60 to-transparent animate-[glow-slide_3s_ease-in-out_infinite]" />
    </div>
  );
}

// ── Sound Wave Visualizer ─────────────────────────────────────────────
function SoundWave({
  isPlaying = false,
  barCount = 8,
  className = '',
}: {
  isPlaying?: boolean;
  barCount?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-[2px] h-4 ${className}`}>
      {Array.from({ length: barCount }, (_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-foreground/40"
          animate={
            isPlaying
              ? {
                  height: [4, 12 + Math.random() * 8, 6, 14 + Math.random() * 6, 4],
                }
              : { height: 4 }
          }
          transition={
            isPlaying
              ? {
                  repeat: Infinity,
                  duration: 0.8 + i * 0.1,
                  ease: 'easeInOut',
                  delay: i * 0.05,
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

// ── Tab definitions ─────────────────────────────────────────────────────────
interface TabDef {
  id: ActiveSection;
  label: string;
  shortLabel?: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  badge?: number;
}

const primaryTabs: TabDef[] = [
  { id: 'overview', label: 'Home', icon: <BarChart3 className="w-5 h-5" />, activeIcon: <BarChart3 className="w-5 h-5" /> },
  { id: 'queue', label: 'Queue', icon: <Users className="w-5 h-5" />, activeIcon: <Users className="w-5 h-5" />, badge: 47 },
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
  { id: 1, text: 'Vehicle GW-4521-Y arrived at Circle', time: '2m ago', type: 'info' as const, read: false },
  { id: 2, text: 'Queue paused at Kaneshie Station', time: '8m ago', type: 'warning' as const, read: false },
  { id: 3, text: '15 passengers boarded successfully', time: '12m ago', type: 'success' as const, read: true },
  { id: 4, text: 'New driver registered: Emmanuel Tetteh', time: '25m ago', type: 'info' as const, read: true },
  { id: 5, text: 'System update completed v2.4.1', time: '1h ago', type: 'success' as const, read: true },
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

// ── Real-time Clock ────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState('');
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
      setSeconds(now.getSeconds());
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5 font-mono text-[11px] text-soft tabular-nums">
      <span>{time}</span>
      <span className={`w-1 h-1 rounded-full transition-colors ${seconds % 2 === 0 ? 'bg-foreground' : 'bg-transparent'}`} />
    </div>
  );
}

// ── System Status Indicator ────────────────────────────────────────────────
function SystemStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [latency, setLatency] = useState(42);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(30 + Math.floor(Math.random() * 40));
    }, 3000);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        {isOnline ? (
          <Wifi className="w-3 h-3 text-green-500" />
        ) : (
          <WifiOff className="w-3 h-3 text-red-500" />
        )}
        <span className="text-[10px] text-soft tabular-nums">{latency}ms</span>
      </div>
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${
        isOnline
          ? 'bg-green-500/10 text-green-600 dark:text-green-400'
          : 'bg-red-500/10 text-red-600 dark:text-red-400'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'traffic-green bg-green-500' : 'traffic-red bg-red-500'}`} />
        {isOnline ? 'Live' : 'Offline'}
      </div>
    </div>
  );
}

// ── Quick Actions Panel ────────────────────────────────────────────────────
function QuickActions({
  onAction,
  isOpen,
  onToggle,
}: {
  onAction: (action: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const actions = [
    { id: 'add-passenger', label: 'Add Passenger', icon: <UserPlus className="w-5 h-5" />, color: 'bg-foreground text-background' },
    { id: 'call-next', label: 'Call Next Group', icon: <Radio className="w-5 h-5" />, color: 'bg-foreground/80 text-background' },
    { id: 'emergency', label: 'Emergency Pause', icon: <ZapOff className="w-5 h-5" />, color: 'bg-red-500 text-white' },
    { id: 'announce', label: 'Voice Announce', icon: <Activity className="w-5 h-5" />, color: 'bg-foreground/60 text-background' },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
              onClick={onToggle}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-24 right-4 z-50 glass-card rounded-2xl p-3 w-52"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-semibold text-foreground">Quick Actions</span>
                <button onClick={onToggle} className="p-1 rounded-lg hover:bg-accent transition-colors">
                  <X className="w-3.5 h-3.5 text-soft" />
                </button>
              </div>
              <div className="space-y-1">
                {actions.map((action, idx) => (
                  <motion.button
                    key={action.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => { onAction(action.id); onToggle(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-accent/60 active:bg-accent transition-all ripple-container"
                  >
                    <span className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                      {action.icon}
                    </span>
                    {action.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
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
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [notificationBadge] = useState(notifications.filter(n => !n.read).length);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

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

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        setShowShortcuts((prev) => !prev);
        return;
      }
      if (e.key === 'Escape') {
        setShowShortcuts(false);
        setShowSearch(false);
        setShowNotifications(false);
        setShowMore(false);
        setShowQuickActions(false);
        return;
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowSearch((prev) => !prev);
        return;
      }
      if (e.key.toLowerCase() === 'd' && !e.metaKey && !e.ctrlKey) {
        setDarkMode((prev) => !prev);
        return;
      }
      if (e.key.toLowerCase() === 'q' && !e.metaKey && !e.ctrlKey) {
        setShowQuickActions((prev) => !prev);
        return;
      }
      const num = parseInt(e.key);
      if (num >= 1 && num <= 5) {
        const tabs = ['overview', 'queue', 'agent', 'driver', 'more'] as const;
        if (tabs[num - 1] === 'more') {
          setShowMore(true);
        } else {
          setActiveSection(tabs[num - 1]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveSection]);

  // ── Toast helper ──
  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
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
    }, 1200);
  };

  // ── Quick action handler (with toasts) ──
  const handleQuickAction = useCallback((action: string) => {
    const messages: Record<string, { text: string; type: Toast['type'] }> = {
      'add-passenger': { text: 'Passenger added to queue', type: 'success' },
      'call-next': { text: 'Calling next group of 5 passengers', type: 'info' },
      'emergency': { text: 'Emergency pause activated!', type: 'warning' },
      'announce': { text: 'Voice announcement queued', type: 'info' },
    };
    const m = messages[action];
    if (m) showToast(m.text, m.type);
  }, [showToast]);

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

  // ── FAB rotation ──
  const [fabOpen, setFabOpen] = useState(false);

  return (
    <div className="h-dvh flex flex-col bg-background bg-mesh overflow-hidden select-none">
      {/* ── Floating Orbs (Ambient) ── */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* ── App Header ── */}
      <header className="flex-shrink-0 glass-header px-4 pt-[env(safe-area-inset-top)] z-40 relative">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo + Location */}
          <div className="flex items-center gap-3 min-w-0">
            <motion.div
              className="w-9 h-9 rounded-2xl bg-foreground flex items-center justify-center shadow-sm flex-shrink-0"
              whileHover={{ scale: 1.05, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-background text-[11px] font-bold tracking-tight">QF</span>
            </motion.div>
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

          {/* Center: System Status + SoundWave (desktop only) */}
          <div className="hidden md:flex items-center gap-4">
            <SystemStatus />
            <SoundWave isPlaying={activeSection === 'agent'} barCount={8} className="hidden md:flex" />
            <LiveClock />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowSearch(!showSearch)}
              className="p-2.5 rounded-xl active:scale-95 transition-transform"
              aria-label="Search"
            >
              <Search className="w-[18px] h-[18px] text-foreground" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl active:scale-95 transition-transform"
              aria-label="Notifications"
            >
              <Bell className="w-[18px] h-[18px] text-foreground" />
              {notificationBadge > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center badge-bounce"
                >
                  {notificationBadge}
                </motion.span>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl active:scale-95 transition-transform"
              aria-label="Toggle dark mode"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={darkMode ? 'dark' : 'light'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {darkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile status bar */}
        <div className="flex md:hidden items-center justify-between pb-1.5 -mt-0.5">
          <SystemStatus />
          <LiveClock />
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

      {/* ── Live Activity Ticker ── */}
      <GlowingLine className="mx-4" />
      <div className="flex-shrink-0 py-1.5 overflow-hidden">
        <MarqueeTicker
          items={[
            'GW-4521-Y boarding at Bay 3',
            'Queue #047 called to Gate A',
            'Kwame Nkrumah Circle: 47 in queue',
            'Avg wait time: 12 minutes',
            '15 passengers boarded in last 10 min',
            'Vehicle AW-7832-X arrived',
            'System uptime: 99.97%',
            'Peak hour forecast: 08:00-09:00',
            'New driver registered: Yaw Adjei',
          ]}
          speed={40}
        />
      </div>
      <GlowingLine className="mx-4" />

      {/* ── Main Content Area (scrollable) ── */}
      <main className="flex-1 overflow-hidden relative z-10">
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
        className="flex-shrink-0 glass-tab-bar z-40 border-t border-glass-border relative"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {primaryTabs.map((tab) => {
            const isActive = tab.id !== 'more' && activeSection === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabPress(tab)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
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
              </motion.button>
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
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleMoreItem(tab.id)}
                    className={`
                      w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all ripple-container
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
                <div className="flex items-center gap-2">
                  <button className="text-xs text-foreground/60 hover:text-foreground font-medium transition-colors">
                    Mark all read
                  </button>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-2 rounded-xl active:bg-accent transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="px-3 pb-4 space-y-1 max-h-[50vh] overflow-y-auto custom-scrollbar">
                {notifications.map((n, idx) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ x: 2 }}
                    className={`flex items-start gap-3 px-4 py-3 rounded-2xl active:bg-accent/60 transition-colors ${
                      !n.read ? 'bg-accent/30' : ''
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      n.type === 'info' ? 'bg-blue-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-relaxed">{n.text}</p>
                      <p className="text-[11px] text-soft mt-1">{n.time}</p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-foreground mt-2 flex-shrink-0" />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── FAB (Floating Action Button) with Quick Actions ── */}
      <AnimatePresence>
        {(activeSection === 'queue' || activeSection === 'agent' || activeSection === 'overview') && !showMore && !showNotifications && (
          <>
            <QuickActions
              onAction={handleQuickAction}
              isOpen={showQuickActions}
              onToggle={() => setShowQuickActions(!showQuickActions)}
            />
            <motion.div
              ref={fabRef}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="fixed bottom-20 right-4 z-30"
            >
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowQuickActions(!showQuickActions)}
                className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors fab-shadow ${
                  showQuickActions
                    ? 'bg-foreground text-background rotate-45'
                    : 'bg-foreground text-background'
                }`}
                aria-label="Quick actions"
              >
                <motion.div
                  animate={{ rotate: showQuickActions ? 45 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <Zap className="w-6 h-6" />
                </motion.div>
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Toast Notifications ── */}
      <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-lg glass-card max-w-xs ${toastColors[toast.type]}`}
            >
              {toastIcons[toast.type]}
              <span className="text-sm font-medium text-foreground">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Keyboard Shortcuts Overlay ── */}
      <AnimatePresence>
        {showShortcuts && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-foreground/40 backdrop-blur-md"
              onClick={() => setShowShortcuts(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[80] glass-card rounded-3xl p-6 max-w-md mx-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-foreground" />
                  <h2 className="font-semibold text-lg text-foreground">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="p-2 rounded-xl hover:bg-accent transition-colors"
                >
                  <X className="w-4 h-4 text-soft" />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { key: '?', desc: 'Show shortcuts' },
                  { key: 'Esc', desc: 'Close overlay / sheet' },
                  { key: '/', desc: 'Search' },
                  { key: '1-5', desc: 'Switch primary tabs' },
                  { key: 'D', desc: 'Toggle dark mode' },
                  { key: 'Q', desc: 'Toggle quick actions' },
                ].map((s) => (
                  <div key={s.key} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{s.desc}</span>
                    <kbd className="px-2.5 py-1 rounded-lg bg-muted text-xs font-mono font-medium text-foreground border border-border">
                      {s.key}
                    </kbd>
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
