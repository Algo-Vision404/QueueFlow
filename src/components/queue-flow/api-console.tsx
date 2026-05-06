'use client';

import React, { useState, useCallback } from 'react';
import { Cable, Play, Copy, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  defaultBody?: string;
}

const endpoints: ApiEndpoint[] = [
  { method: 'GET', path: '/api/system', description: 'System health, metrics, database stats' },
  { method: 'GET', path: '/api/dashboard?locationId=loc-1&seed=true', description: 'Dashboard stats (use seed=true to initialize demo data)' },
  { method: 'GET', path: '/api/queue', description: 'List all queue entries' },
  { method: 'POST', path: '/api/queue', description: 'Join the queue', defaultBody: '{\n  "phone": "+233241234567",\n  "name": "Test User",\n  "channel": "web",\n  "locationId": "loc-1"\n}' },
  { method: 'GET', path: '/api/alerts', description: 'Active alerts and diagnostics' },
  { method: 'GET', path: '/api/revenue', description: 'Revenue analytics data' },
  { method: 'GET', path: '/api/tasks', description: 'List all tasks' },
  { method: 'POST', path: '/api/tasks', description: 'Create a new task', defaultBody: '{\n  "title": "New Task",\n  "description": "Task description",\n  "priority": "medium",\n  "phase": 1\n}' },
  { method: 'GET', path: '/api/agent', description: 'Agent operations info' },
  { method: 'POST', path: '/api/agent', description: 'Agent action (login, add-passenger, call-group, complete-boarding)', defaultBody: '{\n  "action": "login",\n  "phone": "+233240000001",\n  "pin": "1234"\n}' },
  { method: 'GET', path: '/api/driver', description: 'Driver operations info' },
  { method: 'POST', path: '/api/driver', description: 'Driver action (arrival, confirm-boarding)', defaultBody: '{\n  "action": "arrival",\n  "driverId": "drv-015",\n  "locationId": "loc-1"\n}' },
];

interface ApiResponse {
  timestamp: string;
  method: string;
  path: string;
  status: number;
  duration: number;
  body: string;
  size: string;
}

const methodStyles: Record<string, string> = {
  GET: 'bg-cashew text-foreground',
  POST: 'bg-foreground/10 text-foreground',
  DELETE: 'bg-destructive/10 text-destructive',
  PATCH: 'bg-linen text-foreground',
};

export function ApiDocs() {
  const [selected, setSelected] = useState<ApiEndpoint>(endpoints[0]);
  const [body, setBody] = useState(endpoints[0].defaultBody || '');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<ApiResponse[]>([]);

  const handleSend = useCallback(async () => {
    setLoading(true);
    const start = Date.now();
    try {
      const options: RequestInit = { method: selected.method };
      if (selected.method !== 'GET' && body.trim()) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = body.trim();
      }

      const res = await fetch(selected.path, options);
      const text = await res.text();
      const duration = Date.now() - start;

      const result: ApiResponse = {
        timestamp: new Date().toLocaleTimeString(),
        method: selected.method,
        path: selected.path,
        status: res.status,
        duration,
        body: text,
        size: `${(new Blob([text]).size / 1024).toFixed(1)} KB`,
      };

      setResponse(result);
      setHistory(prev => [result, ...prev.slice(0, 19)]);
    } catch (err) {
      setResponse({
        timestamp: new Date().toLocaleTimeString(),
        method: selected.method,
        path: selected.path,
        status: 0,
        duration: Date.now() - start,
        body: `Error: ${err instanceof Error ? err.message : 'Request failed'}`,
        size: '0 KB',
      });
    } finally {
      setLoading(false);
    }
  }, [selected, body]);

  const handleSelectEndpoint = (ep: ApiEndpoint) => {
    setSelected(ep);
    setBody(ep.defaultBody || '');
  };

  const handleCopy = () => {
    if (response) {
      navigator.clipboard.writeText(response.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cashew">
          <Cable className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">API Console</h2>
          <p className="text-sm text-muted-foreground">Test endpoints live</p>
        </div>
      </div>

      {/* Endpoint List */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <div className="max-h-48 overflow-y-auto custom-scrollbar">
            {endpoints.map((ep) => (
              <button
                key={`${ep.method}-${ep.path}`}
                onClick={() => handleSelectEndpoint(ep)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-left border-b border-border/50 last:border-0 transition-colors ${
                  selected.path === ep.path ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
              >
                <Badge className={`font-mono text-[10px] font-bold px-1.5 ${methodStyles[ep.method]}`}>
                  {ep.method}
                </Badge>
                <code className="text-xs font-mono truncate flex-1">{ep.path}</code>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Request Builder */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className={`font-mono text-[10px] font-bold px-2 ${methodStyles[selected.method]}`}>
              {selected.method}
            </Badge>
            <code className="text-sm font-mono flex-1">{selected.path}</code>
            <Button size="sm" onClick={handleSend} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Send
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{selected.description}</p>
          {selected.method !== 'GET' && (
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Request body (JSON)"
              className="font-mono text-xs min-h-[120px] bg-cashew/50"
            />
          )}
        </CardContent>
      </Card>

      {/* Response */}
      {response && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                Response
                {response.status >= 200 && response.status < 300 ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{response.duration}ms</span>
                <span>{response.size}</span>
                <button onClick={handleCopy} className="p-1 rounded hover:bg-accent">
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={response.status >= 200 && response.status < 300 ? 'outline' : 'destructive'} className="text-xs font-mono">
                {response.status || 'ERR'}
              </Badge>
              <span className="text-[11px] text-muted-foreground">{response.timestamp}</span>
            </div>
            <pre className="bg-cashew/50 rounded-lg p-3 font-mono text-xs leading-relaxed overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
              {(() => {
                try { return JSON.stringify(JSON.parse(response.body), null, 2); }
                catch { return response.body; }
              })()}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.length > 1 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
              {history.slice(1).map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1 px-2 rounded hover:bg-accent/50 cursor-pointer"
                  onClick={() => { setSelected(endpoints.find(e => e.path === h.path) || endpoints[0]); setResponse(h); }}>
                  <Badge className={`font-mono text-[9px] px-1 ${methodStyles[h.method]}`}>{h.method}</Badge>
                  <code className="truncate flex-1">{h.path}</code>
                  <Badge variant={h.status >= 200 && h.status < 300 ? 'outline' : 'destructive'} className="text-[9px] font-mono">{h.status}</Badge>
                  <span className="text-muted-foreground">{h.duration}ms</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
