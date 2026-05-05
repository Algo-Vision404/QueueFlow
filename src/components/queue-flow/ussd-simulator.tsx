'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Smartphone,
  Send,
  RotateCcw,
  Info,
  Signal,
  BatteryFull,
  Wifi,
  MessageSquare,
  Activity,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────
type USSDStep =
  | 'welcome'
  | 'join-dest'
  | 'join-confirm'
  | 'join-success'
  | 'check-position'
  | 'cancel'
  | 'cancel-done'
  | 'help';

interface LogEntry {
  id: string;
  timestamp: string;
  input: string;
  response: string;
}

// ── USSD Menu Definitions ──────────────────────────────────────────────────
const menus: Record<USSDStep, { prompt: string; inputHint: string }> = {
  welcome: {
    prompt: `QueueFlow Transport
─────────────────
1. Join Queue
2. Check Position
3. Cancel Queue
4. Help`,
    inputHint: 'Enter option (1-4)',
  },
  'join-dest': {
    prompt: `Enter destination:
─────────────────
1. Accra Central
2. Achimota
3. Tema
4. Kasoa
0. Back`,
    inputHint: 'Enter option (1-4)',
  },
  'join-confirm': {
    prompt: `Join queue at Kwame Nkrumah Circle?

Destination: {dest}
Est. wait: ~12 min

1. Confirm
2. Cancel
0. Back`,
    inputHint: 'Enter option (1-2)',
  },
  'join-success': {
    prompt: `You are in queue!
─────────────────
Ticket: #047
Position: 12th
Wait: ~12 min

You will receive SMS
when called.

0. Main Menu`,
    inputHint: 'Enter 0 for menu',
  },
  'check-position': {
    prompt: `Your ticket: #047
─────────────────
Position: 8th (was 12th)
Est. wait: ~8 min

2 passengers ahead
boarding now.

0. Main Menu`,
    inputHint: 'Enter 0 for menu',
  },
  cancel: {
    prompt: `Cancel queue #047?
─────────────────
1. Yes, Cancel
2. No, Keep
0. Main Menu`,
    inputHint: 'Enter option (1-2)',
  },
  'cancel-done': {
    prompt: `Queue #047 cancelled.
─────────────────
You may rejoin at any
time.

0. Main Menu`,
    inputHint: 'Enter 0 for menu',
  },
  help: {
    prompt: `QueueFlow Help:
─────────────────
- Join a queue to board
  orderly
- You get SMS when it's
  your turn
- Show ticket # to agent
  when called
- Queue expires after
  30 min

0. Main Menu`,
    inputHint: 'Enter 0 for menu',
  },
};

const destinations = ['Accra Central', 'Achimota', 'Tema', 'Kasoa'];

// ── Component ───────────────────────────────────────────────────────────────
export function USSDSimulator() {
  const [currentStep, setCurrentStep] = useState<USSDStep>('welcome');
  const [selectedDest, setSelectedDest] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [sessionLog, setSessionLog] = useState<LogEntry[]>([]);
  const [queueJoined, setQueueJoined] = useState(false);
  const [queueCancelled, setQueueCancelled] = useState(false);
  const [sessionId] = useState(() => `ussd-${Date.now()}`);
  const inputRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const getTimestamp = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const getPrompt = (step: USSDStep): string => {
    const menu = menus[step];
    if (step === 'join-confirm') {
      return menu.prompt.replace('{dest}', selectedDest || '—');
    }
    return menu.prompt;
  };

  const processInput = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const response = getPrompt(currentStep);
    const entry: LogEntry = {
      id: `${sessionId}-${Date.now()}`,
      timestamp: getTimestamp(),
      input: trimmed,
      response: response.substring(0, 60) + (response.length > 60 ? '...' : ''),
    };
    setSessionLog((prev) => [...prev, entry]);
    setInputValue('');

    switch (currentStep) {
      case 'welcome':
        if (trimmed === '1') {
          setCurrentStep('join-dest');
        } else if (trimmed === '2') {
          setCurrentStep(queueJoined ? 'check-position' : 'help');
          if (!queueJoined) {
            setSessionLog((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                response: 'No active queue found. Please join a queue first.',
              };
              return updated;
            });
            setTimeout(() => setCurrentStep('help'), 100);
          }
        } else if (trimmed === '3') {
          if (queueJoined && !queueCancelled) {
            setCurrentStep('cancel');
          } else {
            setCurrentStep('help');
            setSessionLog((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                response: 'No active queue to cancel.',
              };
              return updated;
            });
          }
        } else if (trimmed === '4') {
          setCurrentStep('help');
        }
        break;

      case 'join-dest':
        if (trimmed === '0') {
          setCurrentStep('welcome');
        } else if (['1', '2', '3', '4'].includes(trimmed)) {
          setSelectedDest(destinations[parseInt(trimmed) - 1]);
          setCurrentStep('join-confirm');
        }
        break;

      case 'join-confirm':
        if (trimmed === '1') {
          setCurrentStep('join-success');
          setQueueJoined(true);
          setQueueCancelled(false);
        } else if (trimmed === '2') {
          setCurrentStep('welcome');
        } else if (trimmed === '0') {
          setCurrentStep('join-dest');
        }
        break;

      case 'join-success':
        if (trimmed === '0') {
          setCurrentStep('welcome');
        }
        break;

      case 'check-position':
        if (trimmed === '0') {
          setCurrentStep('welcome');
        }
        break;

      case 'cancel':
        if (trimmed === '1') {
          setCurrentStep('cancel-done');
          setQueueCancelled(true);
        } else if (trimmed === '2') {
          setCurrentStep('welcome');
        } else if (trimmed === '0') {
          setCurrentStep('welcome');
        }
        break;

      case 'cancel-done':
        if (trimmed === '0') {
          setCurrentStep('welcome');
        }
        break;

      case 'help':
        if (trimmed === '0') {
          setCurrentStep('welcome');
        }
        break;
    }
  };

  const handleSend = () => {
    processInput(inputValue);
  };

  const handleKeyPress = (key: string) => {
    if (key === '#' || key === '*') {
      // Just append to input for realism
      setInputValue((prev) => prev + key);
    } else if (key === '\u232B') {
      setInputValue((prev) => prev.slice(0, -1));
    } else {
      setInputValue((prev) => prev + key);
    }
  };

  const handleReset = () => {
    setCurrentStep('welcome');
    setInputValue('');
    setSessionLog([]);
    setSelectedDest('');
    setQueueJoined(false);
    setQueueCancelled(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionLog]);

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">USSD Simulator</h2>
        <p className="text-muted-foreground text-sm">
          Interactive simulation of the QueueFlow USSD menu experience
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Phone Frame */}
        <div className="lg:col-span-2 flex justify-center order-1">
          <div className="w-full max-w-xs mx-auto lg:max-w-sm lg:mx-0">
            {/* Phone outer shell */}
            <div className="rounded-[2rem] sm:rounded-[2.5rem] border-[3px] border-zinc-800 dark:border-zinc-600 bg-zinc-900 dark:bg-zinc-800 shadow-2xl overflow-hidden">
              {/* Notch / Status Bar */}
              <div className="bg-zinc-900 dark:bg-zinc-800 px-4 sm:px-6 pt-2 pb-1">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium">
                  <span>9:41</span>
                  <div className="w-16 sm:w-20 h-5 bg-zinc-900 dark:bg-zinc-800 rounded-b-2xl border-x border-b border-zinc-700 mx-auto" />
                  <div className="flex items-center gap-1.5">
                    <Signal className="w-3 h-3" />
                    <Wifi className="w-3 h-3" />
                    <BatteryFull className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Screen */}
              <div className="bg-zinc-100 dark:bg-zinc-950 min-h-[380px] sm:min-h-[420px] flex flex-col">
                {/* Session header with latency indicator */}
                <div className="bg-foreground px-3 sm:px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">*384*200#</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Network Latency Indicator */}
                    <div className="flex items-center gap-1.5 text-white/70">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span className="text-[10px] font-medium">120ms</span>
                    </div>
                    <Badge className="bg-white/20 text-white border-0 text-[10px] hover:bg-white/20">
                      ACTIVE
                    </Badge>
                  </div>
                </div>

                {/* USSD Display */}
                <div className="flex-1 p-3 sm:p-4 space-y-3 overflow-y-auto max-h-[200px] sm:max-h-[240px]">
                  <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
                    {getPrompt(currentStep)}
                  </pre>
                </div>

                {/* Input Area */}
                <div className="border-t border-zinc-200 dark:border-zinc-800 p-2 sm:p-3 bg-white dark:bg-zinc-900">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={menus[currentStep].inputHint}
                      className="flex-1 h-11 min-w-0 px-3 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-soft/20 focus:border-soft font-mono"
                      aria-label="USSD input"
                    />
                    <Button
                      size="sm"
                      className="h-11 min-w-[44px] px-4 bg-foreground text-background"
                      onClick={handleSend}
                      disabled={!inputValue.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Numeric Keypad */}
                <div className="p-2 pb-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="grid grid-cols-3 gap-1.5">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
                      <button
                        key={key}
                        onClick={() => handleKeyPress(key)}
                        className="min-h-12 h-12 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 active:bg-zinc-100 dark:active:bg-zinc-700 transition-colors shadow-sm"
                        aria-label={`Key ${key}`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                  <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                    <div />
                    <button
                      onClick={() => setInputValue((prev) => prev.slice(0, -1))}
                      className="min-h-11 h-11 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 active:bg-zinc-300 dark:active:bg-zinc-600 transition-colors"
                      aria-label="Backspace"
                    >
                      Delete
                    </button>
                    <div />
                  </div>
                </div>

                {/* Bottom Bar (Home indicator) */}
                <div className="flex justify-center py-2 bg-zinc-900 dark:bg-zinc-800">
                  <div className="w-28 h-1 rounded-full bg-zinc-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4 order-2">
          {/* Info Panel */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="w-4 h-4 text-foreground" />
                Session Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">USSD Code</span>
                <Badge variant="outline" className="font-mono text-xs">*384*200#</Badge>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Session Timeout</span>
                <span className="font-medium">30 seconds</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cost</span>
                <Badge className="bg-cashew text-foreground border-0 text-xs">
                  Free
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Supported Networks</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">MTN</Badge>
                  <Badge variant="outline" className="text-xs">Vodafone</Badge>
                  <Badge variant="outline" className="text-xs">AirtelTigo</Badge>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Step</span>
                <span className="font-medium capitalize text-xs">{currentStep.replace('-', ' ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Queue Status</span>
                {queueJoined && !queueCancelled ? (
                  <Badge className="bg-cashew text-foreground border-0 text-xs">
                    Active #047
                  </Badge>
                ) : queueCancelled ? (
                  <Badge className="bg-cashew text-soft border-0 text-xs">
                    Cancelled
                  </Badge>
                ) : (
                  <Badge className="bg-cashew text-soft border-0 text-xs">
                    None
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <Button
            variant="outline"
            className="w-full h-11 gap-2"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4" />
            Reset Session
          </Button>

          {/* Session Log */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Session Log</CardTitle>
              <CardDescription>All USSD interactions with timestamps</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sessionLog.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No interactions yet. Use the keypad or type to navigate.
                  </p>
                )}
                {sessionLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border p-2.5 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-mono text-[10px] px-1.5">
                        &gt; {entry.input}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{entry.timestamp}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{entry.response}</p>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </CardContent>
          </Card>

          {/* SMS Preview Panel */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-foreground" />
                SMS Preview
              </CardTitle>
              <CardDescription>
                Notification the passenger would receive
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* SMS Bubble */}
              <div className="bg-muted rounded-2xl rounded-tl-sm p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-foreground text-primary-foreground">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-none">QueueFlow</p>
                    <p className="text-[10px] text-muted-foreground">Service Notification</p>
                  </div>
                </div>
                <Separator />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Your QueueFlow ticket <span className="font-mono font-semibold text-foreground">#047</span>.
                  Position: <span className="font-semibold text-foreground">8th</span>.
                  Est. wait: <span className="font-semibold text-foreground">~8 min</span>.
                  You will be notified when it&apos;s your turn.
                </p>
                <p className="text-[10px] text-muted-foreground/60 text-right">
                  Now
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
