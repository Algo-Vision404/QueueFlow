'use client';

import React, { useState, useCallback } from 'react';
import {
  Users, UserCheck, Clock, Car, Phone, Smartphone, Globe, UserCircle,
  ArrowUpCircle, XCircle, Megaphone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

type QueueStatus = 'waiting' | 'called' | 'boarding' | 'boarded' | 'cancelled';
type QueueChannel = 'USSD' | 'SMS' | 'Web' | 'Agent' | 'IVR';

interface QueueEntry {
  id: string;
  ticketNumber: string;
  name: string;
  phone: string;
  channel: QueueChannel;
  status: QueueStatus;
  position: number;
  estimatedWait: string;
  joinTime: string;
}

const sampleNames = [
  'Abena Serwaa', 'Kofi Mensah', 'Ama Boateng', 'Kwame Asante', 'Esi Darko',
  'Yaw Owusu', 'Adwoa Poku', 'Kobina Annan', 'Efua Agyeman', 'Nana Osei',
  'Akosua Frimpong', 'Kwabena Yeboah', 'Afia Duku', 'Emmanuel Tetteh', 'Grace Lamptey',
  'Daniel Adu', 'Felicity Obeng', 'Samuel Okai', 'Patience Amoah', 'Isaac Mensah',
];

const samplePhones = [
  '024-XXX-XXXX', '020-XXX-XXXX', '027-XXX-XXXX', '050-XXX-XXXX', '026-XXX-XXXX',
  '054-XXX-XXXX', '023-XXX-XXXX', '028-XXX-XXXX', '029-XXX-XXXX', '055-XXX-XXXX',
];

const channels: QueueChannel[] = ['USSD', 'SMS', 'Web', 'Agent', 'IVR'];

function generateEntry(position: number): QueueEntry {
  const name = sampleNames[Math.floor(Math.random() * sampleNames.length)];
  const phone = samplePhones[Math.floor(Math.random() * samplePhones.length)];
  const channel = channels[Math.floor(Math.random() * channels.length)];
  const statuses: QueueStatus[] = ['waiting', 'waiting', 'waiting', 'called', 'called', 'boarding', 'boarded', 'boarded', 'boarded'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const ticketNum = String(100 + Math.floor(Math.random() * 900));
  const waitMin = Math.floor(Math.random() * 25) + 2;
  const hour = 7 + Math.floor(Math.random() * 2);
  const minute = Math.floor(Math.random() * 60);

  return {
    id: crypto.randomUUID(),
    ticketNumber: ticketNum,
    name,
    phone,
    channel,
    status,
    position,
    estimatedWait: status === 'boarded' ? '0 min' : `~${waitMin} min`,
    joinTime: `${hour}:${String(minute).padStart(2, '0')} AM`,
  };
}

function getStatusColor(status: QueueStatus): string {
  switch (status) {
    case 'waiting':
      return 'bg-cashew text-foreground';
    case 'called':
      return 'bg-linen text-foreground';
    case 'boarding':
      return 'bg-warm text-foreground';
    case 'boarded':
      return 'bg-foreground/5 text-soft';
    case 'cancelled':
      return 'bg-destructive/10 text-destructive';
    default:
      return '';
  }
}

function getTicketCircleColor(status: QueueStatus): string {
  switch (status) {
    case 'waiting':
      return 'bg-foreground text-background';
    case 'called':
      return 'bg-foreground/70 text-background';
    case 'boarding':
      return 'bg-foreground/50 text-background';
    case 'boarded':
      return 'bg-foreground/20 text-background';
    case 'cancelled':
      return 'bg-destructive text-destructive-foreground';
    default:
      return '';
  }
}

function getChannelIcon(channel: QueueChannel) {
  switch (channel) {
    case 'USSD':
      return <Phone className="w-3 h-3" />;
    case 'SMS':
      return <Smartphone className="w-3 h-3" />;
    case 'Web':
      return <Globe className="w-3 h-3" />;
    case 'Agent':
      return <UserCircle className="w-3 h-3" />;
    case 'IVR':
      return <Megaphone className="w-3 h-3" />;
    default:
      return null;
  }
}

export function LiveQueue() {
  const [entries, setEntries] = useState<QueueEntry[]>(() => {
    const initial: QueueEntry[] = [];
    for (let i = 0; i < 18; i++) {
      initial.push(generateEntry(i + 1));
    }
    return initial;
  });

  const waitingCount = entries.filter((e) => e.status === 'waiting').length;
  const calledCount = entries.filter((e) => e.status === 'called').length;
  const boardingCount = entries.filter((e) => e.status === 'boarding').length;
  const servedCount = entries.filter((e) => e.status === 'boarded').length;

  const handleSimulate = useCallback(() => {
    const newEntry: QueueEntry = {
      id: crypto.randomUUID(),
      ticketNumber: String(100 + Math.floor(Math.random() * 900)),
      name: sampleNames[Math.floor(Math.random() * sampleNames.length)],
      phone: samplePhones[Math.floor(Math.random() * samplePhones.length)],
      channel: channels[Math.floor(Math.random() * channels.length)],
      status: 'waiting',
      position: 1,
      estimatedWait: '~25 min',
      joinTime: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    };
    setEntries((prev) =>
      [newEntry, ...prev.map((e) => ({ ...e, position: e.position + 1 }))]
    );
  }, []);

  const handleCall = useCallback((id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'called' as QueueStatus, estimatedWait: '~5 min' } : e))
    );
  }, []);

  const handleBoard = useCallback((id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'boarding' as QueueStatus, estimatedWait: '~2 min' } : e))
    );
  }, []);

  const handleCancel = useCallback((id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'cancelled' as QueueStatus, estimatedWait: '—' } : e))
    );
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Live Queue</h1>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-foreground" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-foreground bg-cashew px-2 py-0.5 rounded-md">
                Live
              </span>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">Real-time queue monitoring and management</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Users className="w-3.5 h-3.5 mr-1.5 text-foreground" />
            {entries.filter((e) => e.status !== 'boarded' && e.status !== 'cancelled').length} in queue
          </Badge>
          <Button onClick={handleSimulate} className="bg-foreground text-background hover:bg-foreground/90 gap-2">
            <ArrowUpCircle className="w-4 h-4" />
            Simulate New Entry
          </Button>
        </div>
      </div>

      {/* Queue Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-border bg-cashew">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-foreground flex items-center justify-center">
              <Clock className="w-4.5 h-4.5 text-background" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{waitingCount}</p>
              <p className="text-[11px] text-muted-foreground">Waiting</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-linen">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-foreground/70 flex items-center justify-center">
              <Megaphone className="w-4.5 h-4.5 text-background" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{calledCount}</p>
              <p className="text-[11px] text-muted-foreground">Called</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-warm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-foreground/50 flex items-center justify-center">
              <Car className="w-4.5 h-4.5 text-background" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{boardingCount}</p>
              <p className="text-[11px] text-muted-foreground">Boarding</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-foreground/5">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-foreground/20 flex items-center justify-center">
              <UserCheck className="w-4.5 h-4.5 text-background" />
            </div>
            <div>
              <p className="text-xl font-bold text-soft">{servedCount}</p>
              <p className="text-[11px] text-muted-foreground">Served</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Queue Display */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            Queue Entries
            <Badge variant="secondary" className="text-[11px]">
              {entries.length} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="max-h-[600px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card hover:bg-accent/30 transition-colors"
              >
                {/* Ticket Number Circle */}
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${getTicketCircleColor(entry.status)}`}
                >
                  #{entry.ticketNumber}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground truncate">
                      {entry.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{entry.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-[11px] gap-1">
                      {getChannelIcon(entry.channel)}
                      {entry.channel}
                    </Badge>
                    <Badge className={`text-[11px] ${getStatusColor(entry.status)}`}>
                      {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      Pos #{entry.position} &middot; {entry.estimatedWait}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {entry.status === 'waiting' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1 border-border text-foreground hover:bg-cashew"
                      onClick={() => handleCall(entry.id)}
                    >
                      <Megaphone className="w-3 h-3" />
                      Call
                    </Button>
                  )}
                  {entry.status === 'called' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1 border-border text-foreground hover:bg-linen"
                      onClick={() => handleBoard(entry.id)}
                    >
                      <Car className="w-3 h-3" />
                      Board
                    </Button>
                  )}
                  {(entry.status === 'waiting' || entry.status === 'called') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => handleCancel(entry.id)}
                    >
                      <XCircle className="w-3 h-3" />
                      Cancel
                    </Button>
                  )}
                  {(entry.status === 'boarded' || entry.status === 'cancelled') && (
                    <span className="text-xs text-muted-foreground italic px-2">
                      {entry.status === 'boarded' ? 'Done' : 'Removed'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
