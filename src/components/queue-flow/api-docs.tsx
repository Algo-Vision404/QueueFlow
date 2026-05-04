'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// =============================================
// Endpoint display helpers
// =============================================

function MethodBadge({ method }: { method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH' }) {
  const styleMap: Record<string, string> = {
    GET: 'bg-cashew text-foreground dark:bg-cashew dark:text-foreground border-border',
    POST: 'bg-foreground/10 text-foreground dark:bg-foreground/20 dark:text-foreground border-border',
    DELETE: 'bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive border-destructive/30',
    PUT: 'bg-cashew text-foreground dark:bg-cashew dark:text-foreground border-border',
    PATCH: 'bg-cashew text-foreground dark:bg-cashew dark:text-foreground border-border',
  };

  return (
    <Badge variant="outline" className={`font-mono text-[10px] font-bold px-2 py-0.5 ${styleMap[method]}`}>
      {method}
    </Badge>
  );
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="relative">
      {label && (
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-1 bg-cashew rounded-t-md border border-border border-b-0">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
      )}
      <pre className={`bg-cashew rounded-md p-3 font-mono text-xs leading-relaxed overflow-x-auto ${label ? 'pt-8' : ''}`}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

interface EndpointDef {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  description: string;
  body?: string;
  response: string;
  bodyLabel?: string;
  responseLabel?: string;
}

function EndpointCard({ endpoint }: { endpoint: EndpointDef }) {
  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-sm transition-shadow">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-muted/50 border-b">
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-mono font-semibold text-foreground break-all">{endpoint.path}</code>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground">{endpoint.description}</p>

        {endpoint.body && (
          <CodeBlock code={endpoint.body} label={endpoint.bodyLabel || 'Request Body'} />
        )}

        <CodeBlock code={endpoint.response} label={endpoint.responseLabel || 'Response'} />
      </div>
    </div>
  );
}

// =============================================
// Tab 1: Queue Management
// =============================================
function QueueManagementTab() {
  const endpoints: EndpointDef[] = [
    {
      method: 'POST',
      path: '/api/queue/join',
      description: 'Join the queue at a specific location. Returns ticket number and estimated wait time. Supports USSD, SMS, web, and agent channels.',
      body: `{
  "phone": "+233241234567",
  "name": "Kwame Asante",
  "channel": "ussd",
  "locationId": "loc-1",
  "destination": "Kaneshie"
}`,
      response: `{
  "ticketNumber": 47,
  "position": 12,
  "estimatedWait": 35,
  "expiresAt": "2025-01-15T18:30:00Z"
}`,
    },
    {
      method: 'GET',
      path: '/api/queue/status?ticketNumber=47',
      description: 'Check current position, estimated wait time, and status for a specific ticket.',
      response: `{
  "ticketNumber": 47,
  "position": 5,
  "estimatedWait": 14,
  "status": "waiting",
  "queueLength": 23
}`,
    },
    {
      method: 'DELETE',
      path: '/api/queue/{id}/cancel',
      description: 'Remove a passenger from the queue. Passenger receives cancellation confirmation via their original channel.',
      response: `{
  "success": true,
  "message": "Ticket #47 has been cancelled"
}`,
    },
    {
      method: 'GET',
      path: '/api/queue/list?locationId=loc-1&date=2025-01-15',
      description: 'Retrieve the full queue view for a location and date. Requires agent authentication. Returns paginated entries.',
      response: `{
  "entries": [
    { "id": "q-1", "ticketNumber": 1, "name": "Ama", "status": "boarded", "position": 1 },
    { "id": "q-2", "ticketNumber": 2, "name": "Kofi", "status": "called", "position": 2 }
  ],
  "total": 47,
  "served": 12,
  "page": 1,
  "pageSize": 50
}`,
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-border bg-cashew/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">📋</span>
            <h3 className="font-semibold text-sm text-foreground">Queue Management</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Core queue operations for passengers and agents. All endpoints accept and return JSON. Authenticated agents get extended access.
          </p>
        </CardContent>
      </Card>
      {endpoints.map((ep) => (
        <EndpointCard key={`${ep.method}-${ep.path}`} endpoint={ep} />
      ))}
    </div>
  );
}

// =============================================
// Tab 2: Agent Operations
// =============================================
function AgentOperationsTab() {
  const endpoints: EndpointDef[] = [
    {
      method: 'POST',
      path: '/api/agent/login',
      description: 'Agent authentication using phone number and PIN. Returns JWT token for subsequent requests.',
      body: `{
  "phone": "+233201234567",
  "pin": "1234"
}`,
      response: `{
  "agentId": "agent-001",
  "name": "Emmanuel Mensah",
  "location": "Kwame Nkrumah Circle",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}`,
    },
    {
      method: 'POST',
      path: '/api/agent/add-passenger',
      description: 'Agent manually adds a passenger to the queue. Used for walk-ins, elderly, or those without phones.',
      body: `{
  "agentId": "agent-001",
  "passengerName": "Adwoa",
  "passengerPhone": "+233249876543",
  "channel": "agent"
}`,
      response: `{
  "ticketNumber": 48,
  "position": 13
}`,
    },
    {
      method: 'POST',
      path: '/api/agent/call-group',
      description: 'Agent triggers boarding for the next group of passengers. Creates a boarding session and notifies all called passengers.',
      body: `{
  "agentId": "agent-001",
  "count": 14,
  "vehicleId": "veh-023"
}`,
      response: `{
  "calledEntries": [
    { "ticketNumber": 1, "name": "Ama", "phone": "+233..." },
    { "ticketNumber": 2, "name": "Kofi", "phone": "+233..." }
  ],
  "boardingSessionId": "bs-001",
  "totalCalled": 14
}`,
    },
    {
      method: 'POST',
      path: '/api/agent/complete-boarding',
      description: 'Agent marks a boarding session as complete after all passengers have boarded. Updates queue state.',
      body: `{
  "agentId": "agent-001",
  "boardingSessionId": "bs-001"
}`,
      response: `{
  "success": true,
  "passengersBoarded": 14,
  "noShows": 2,
  "completedAt": "2025-01-15T14:35:00Z"
}`,
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-border bg-warm/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">👤</span>
            <h3 className="font-semibold text-sm text-foreground">Agent Operations</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Agent-specific endpoints for managing queues at physical locations. All agent endpoints require authentication via the login endpoint.
          </p>
        </CardContent>
      </Card>
      {endpoints.map((ep) => (
        <EndpointCard key={`${ep.method}-${ep.path}`} endpoint={ep} />
      ))}
    </div>
  );
}

// =============================================
// Tab 3: Driver Operations
// =============================================
function DriverOperationsTab() {
  const endpoints: EndpointDef[] = [
    {
      method: 'POST',
      path: '/api/driver/arrival',
      description: 'Driver reports arrival at a location. System determines queue position and estimated passenger load.',
      body: `{
  "driverId": "drv-015",
  "locationId": "loc-1",
  "vehiclePlate": "GC-4521-X",
  "capacity": 14
}`,
      response: `{
  "queuePosition": 15,
  "estimatedLoad": 14,
  "waitTime": "~8 minutes",
  "assignedBoardingOrder": 2
}`,
    },
    {
      method: 'GET',
      path: '/api/driver/assignment?driverId=drv-015',
      description: 'Get the current passenger assignment for a driver who has been called for boarding.',
      response: `{
  "passengers": [
    { "ticketNumber": 15, "name": "Ama", "status": "waiting" },
    { "ticketNumber": 16, "name": "Kofi", "status": "waiting" },
    { "ticketNumber": 17, "name": "Yaw", "status": "waiting" }
  ],
  "total": 14,
  "vehicleCapacity": 14,
  "boardingSessionId": "bs-002"
}`,
    },
    {
      method: 'POST',
      path: '/api/driver/confirm-boarding',
      description: 'Driver confirms all passengers have boarded and the vehicle is ready to depart.',
      body: `{
  "driverId": "drv-015",
  "boardingSessionId": "bs-002",
  "passengerCount": 14
}`,
      response: `{
  "success": true,
  "passengersBoarded": 14,
  "departedAt": "2025-01-15T14:42:00Z",
  "nextQueuePosition": 29
}`,
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-border bg-linen/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">🚐</span>
            <h3 className="font-semibold text-sm text-foreground">Driver Operations</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Driver endpoints for arrival reporting, passenger assignment, and boarding confirmation. Drivers can access via mobile web or USSD.
          </p>
        </CardContent>
      </Card>
      {endpoints.map((ep) => (
        <EndpointCard key={`${ep.method}-${ep.path}`} endpoint={ep} />
      ))}
    </div>
  );
}

// =============================================
// Tab 4: USSD Handler
// =============================================
function USSDHandlerTab() {
  const endpoints: EndpointDef[] = [
    {
      method: 'POST',
      path: '/api/ussd/handle',
      description: 'Process incoming USSD session input. Handles multi-step menus for joining queue, checking position, and getting updates. Returns response text and session action.',
      body: `{
  "phoneNumber": "+233241234567",
  "sessionId": "ussd-sess-abc123",
  "text": "1",
  "serviceCode": "*384*200#"
}`,
      response: `{
  "responseText": "CON Enter destination:\\n1. Kaneshie\\n2. Tema\\n3. Madina\\n4. Achimota",
  "action": "CONTINUE"
}`,
      bodyLabel: 'Request Body (telecom gateway payload)',
    },
  ];

  const ussdFlows = [
    {
      step: 'Initial',
      input: '*384*200#',
      response: 'CON Welcome to QueueFlow!\\n1. Join Queue\\n2. Check Position\\n3. Cancel',
    },
    {
      step: 'Join Queue',
      input: '1',
      response: 'CON Enter destination:\\n1. Kaneshie\\n2. Tema\\n3. Madina\\n4. Achimota',
    },
    {
      step: 'Select Destination',
      input: '1',
      response: 'END You are #47 in queue. Wait ~35 min. We\'ll SMS you when it\'s your turn.',
    },
    {
      step: 'Check Position',
      input: '2',
      response: 'END Ticket #47: Position 5. ~14 min wait. Queue: 23 people.',
    },
    {
      step: 'Cancel',
      input: '3',
      response: 'END Ticket #47 cancelled. Dial *384*200# to rejoin.',
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-border bg-cashew/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">📱</span>
            <h3 className="font-semibold text-sm text-foreground">USSD Handler</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            USSD session handler processes multi-step menu interactions from telecom gateways. Supports Africa&apos;s Talking and MTN API formats.
          </p>
        </CardContent>
      </Card>

      {endpoints.map((ep) => (
        <EndpointCard key={`${ep.method}-${ep.path}`} endpoint={ep} />
      ))}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">USSD Session Flow Examples</CardTitle>
          <CardDescription>Step-by-step interaction examples showing the menu navigation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ussdFlows.map((flow) => (
              <div key={flow.step} className="border rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b">
                  <Badge variant="outline" className="text-[10px] font-medium">{flow.step}</Badge>
                  <code className="text-xs font-mono text-muted-foreground">Input: {flow.input}</code>
                </div>
                <div className="px-3 py-2.5">
                  <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap text-foreground/80">
                    {flow.response}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================
// Main Component
// =============================================
export function ApiDocs() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-cashew">
            <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">API Documentation</h2>
            <p className="text-sm text-muted-foreground">RESTful API reference for QueueFlow endpoints</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="outline" className="text-xs font-mono">Base URL: /api</Badge>
          <Badge variant="outline" className="text-xs">JSON: Request & Response</Badge>
          <Badge variant="outline" className="text-xs">Auth: JWT Bearer Token</Badge>
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="queue" className="w-full">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-grid h-auto gap-1 p-1 bg-muted">
          <TabsTrigger value="queue" className="text-xs sm:text-sm px-3 py-2">Queue Management</TabsTrigger>
          <TabsTrigger value="agent" className="text-xs sm:text-sm px-3 py-2">Agent Operations</TabsTrigger>
          <TabsTrigger value="driver" className="text-xs sm:text-sm px-3 py-2">Driver Operations</TabsTrigger>
          <TabsTrigger value="ussd" className="text-xs sm:text-sm px-3 py-2">USSD Handler</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4">
          <ScrollArea className="h-[calc(100vh-280px)] pr-4">
            <QueueManagementTab />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="agent" className="mt-4">
          <ScrollArea className="h-[calc(100vh-280px)] pr-4">
            <AgentOperationsTab />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="driver" className="mt-4">
          <ScrollArea className="h-[calc(100vh-280px)] pr-4">
            <DriverOperationsTab />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="ussd" className="mt-4">
          <ScrollArea className="h-[calc(100vh-280px)] pr-4">
            <USSDHandlerTab />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
