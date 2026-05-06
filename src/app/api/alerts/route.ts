import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const alerts: {
      id: string;
      type: string;
      severity: 'critical' | 'high' | 'medium' | 'low';
      title: string;
      description: string;
      affectedId?: string;
      affectedName?: string;
      detectedAt: string;
      actionable: boolean;
      actionLabel?: string;
    }[] = [];

    // 1. Check for expired queue entries (entries past their expiresAt)
    const expiredEntries = await db.queueEntry.findMany({
      where: {
        expiresAt: { lt: now },
        status: { in: ['waiting', 'called'] },
      },
      include: { queue: { include: { location: true } } },
    });

    for (const entry of expiredEntries) {
      alerts.push({
        id: `expired-${entry.id}`,
        type: 'expired_ticket',
        severity: 'high',
        title: 'Expired Ticket Not Processed',
        description: `Ticket #${entry.ticketNumber} for ${entry.passengerName || 'Unknown'} at ${entry.queue.location.name} has expired but still shows as ${entry.status}.`,
        affectedId: entry.id,
        affectedName: `#${entry.ticketNumber}`,
        detectedAt: (entry.expiresAt || entry.updatedAt).toISOString(),
        actionable: true,
        actionLabel: 'Mark Expired',
      });
    }

    // 2. Check for long-waiting entries (>30 min in 'called' status)
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const longCalledEntries = await db.queueEntry.findMany({
      where: {
        status: 'called',
        calledAt: { lt: thirtyMinAgo },
      },
      include: { queue: { include: { location: true } } },
    });

    for (const entry of longCalledEntries) {
      const waitMin = Math.round((now.getTime() - new Date(entry.calledAt!).getTime()) / 60000);
      alerts.push({
        id: `no-show-${entry.id}`,
        type: 'no_show',
        severity: 'high',
        title: 'Potential No-Show Detected',
        description: `Ticket #${entry.ticketNumber} (${entry.passengerName || 'Unknown'}) was called ${waitMin} min ago but has not boarded at ${entry.queue.location.name}.`,
        affectedId: entry.id,
        affectedName: `#${entry.ticketNumber}`,
        detectedAt: entry.calledAt!.toISOString(),
        actionable: true,
        actionLabel: 'Mark No-Show',
      });
    }

    // 3. Check for stalled boarding sessions (>20 min in 'loading')
    const twentyMinAgo = new Date(now.getTime() - 20 * 60 * 1000);
    const stalledSessions = await db.boardingSession.findMany({
      where: {
        status: 'loading',
        startedAt: { lt: twentyMinAgo },
      },
      include: {
        driver: true,
        queue: { include: { location: true } },
      },
    });

    for (const session of stalledSessions) {
      const durMin = Math.round((now.getTime() - new Date(session.startedAt).getTime()) / 60000);
      alerts.push({
        id: `stalled-${session.id}`,
        type: 'stalled_boarding',
        severity: 'critical',
        title: 'Stalled Boarding Session',
        description: `Boarding with driver ${session.driver.name} (${session.driver.vehiclePlate}) at ${session.queue.location.name} has been loading for ${durMin} min.`,
        affectedId: session.id,
        affectedName: `${session.driver.vehiclePlate}`,
        detectedAt: session.startedAt.toISOString(),
        actionable: true,
        actionLabel: 'Force Complete',
      });
    }

    // 4. Check for offline drivers at active locations
    const offlineDrivers = await db.driver.findMany({
      where: {
        status: 'offline',
        isActive: true,
        currentLocationId: { not: null },
      },
      include: { currentLocation: true },
    });

    for (const driver of offlineDrivers) {
      alerts.push({
        id: `offline-driver-${driver.id}`,
        type: 'offline_driver',
        severity: 'medium',
        title: 'Driver Offline at Active Location',
        description: `${driver.name} (${driver.vehiclePlate}) is offline at ${driver.currentLocation?.name || 'Unknown'}.`,
        affectedId: driver.id,
        affectedName: driver.name,
        detectedAt: driver.updatedAt.toISOString(),
        actionable: false,
      });
    }

    // 5. Check queue capacity warnings
    const activeQueues = await db.queue.findMany({
      where: { status: 'active' },
      include: {
        location: true,
        entries: { where: { status: { in: ['waiting', 'called'] } } },
      },
    });

    for (const queue of activeQueues) {
      const activeCount = queue.entries.length;
      if (activeCount > queue.location.capacity * 0.9) {
        alerts.push({
          id: `capacity-${queue.id}`,
          type: 'capacity_warning',
          severity: 'high',
          title: 'Queue Near Capacity',
          description: `${queue.location.name} has ${activeCount} people in queue (${Math.round(activeCount / queue.location.capacity * 100)}% of ${queue.location.capacity} capacity).`,
          affectedId: queue.id,
          affectedName: queue.location.name,
          detectedAt: now.toISOString(),
          actionable: false,
        });
      }
    }

    // 6. Check for failed transactions
    const failedTransactions = await db.transaction.count({
      where: { status: 'failed' },
    });

    if (failedTransactions > 0) {
      alerts.push({
        id: 'failed-transactions',
        type: 'failed_payments',
        severity: 'high',
        title: 'Failed Transactions Detected',
        description: `${failedTransactions} transaction(s) have failed and need attention.`,
        detectedAt: now.toISOString(),
        actionable: false,
      });
    }

    // 7. Info: queues with no active drivers
    const queuesNoDrivers = await db.queue.findMany({
      where: {
        status: 'active',
        entries: { some: { status: { in: ['waiting', 'called'] } } },
      },
      include: { location: true },
    });

    for (const q of queuesNoDrivers) {
      const availDrivers = await db.driver.count({
        where: {
          currentLocationId: q.locationId,
          status: { in: ['available', 'boarding'] },
        },
      });
      if (availDrivers === 0) {
        const waitingCount = q.entries.filter(e => e.status === 'waiting' || e.status === 'called').length;
        alerts.push({
          id: `no-drivers-${q.id}`,
          type: 'no_drivers',
          severity: 'critical',
          title: 'Queue Has No Active Drivers',
          description: `${q.location.name} has ${waitingCount} passengers waiting but no available or boarding drivers.`,
          affectedId: q.locationId,
          affectedName: q.location.name,
          detectedAt: now.toISOString(),
          actionable: false,
        });
      }
    }

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    const summary = {
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
      total: alerts.length,
    };

    return NextResponse.json({
      success: true,
      alerts,
      summary,
      scannedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('Alerts scan failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to scan for alerts' },
      { status: 500 }
    );
  }
}

// POST to resolve an alert
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { alertId, action } = body;

    if (!alertId || !action) {
      return NextResponse.json({ success: false, error: 'alertId and action required' }, { status: 400 });
    }

    // Extract entry/session/driver id from alert id
    let updated = false;

    if (alertId.startsWith('expired-') || alertId.startsWith('no-show-')) {
      const entryId = alertId.split('-').slice(1).join('-');
      const newStatus = action === 'Mark No-Show' ? 'expired' : 'expired';
      await db.queueEntry.update({
        where: { id: entryId },
        data: { status: newStatus },
      });
      updated = true;
    } else if (alertId.startsWith('stalled-')) {
      const sessionId = alertId.split('-').slice(1).join('-');
      await db.boardingSession.update({
        where: { id: sessionId },
        data: { status: 'completed', completedAt: new Date() },
      });
      updated = true;
    }

    return NextResponse.json({ success: true, resolved: updated, alertId });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to resolve alert' }, { status: 500 });
  }
}
