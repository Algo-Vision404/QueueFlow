import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const startTime = Date.now();

export async function GET() {
  try {
    const now = new Date();
    const uptime = Math.round((Date.now() - startTime) / 1000);

    // Database connectivity check
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    // Count records
    const [
      locationCount,
      queueCount,
      entryCount,
      driverCount,
      agentCount,
      boardingCount,
      transactionCount,
      activityCount,
      configCount,
    ] = await Promise.all([
      db.location.count(),
      db.queue.count(),
      db.queueEntry.count(),
      db.driver.count(),
      db.agent.count(),
      db.boardingSession.count(),
      db.transaction.count(),
      db.activityLog.count(),
      db.systemConfig.count(),
    ]);

    // Today's stats
    const today = now.toISOString().split('T')[0];
    const todayEntries = await db.queueEntry.count({
      where: { queue: { date: today } },
    });
    const todayBoarded = await db.queueEntry.count({
      where: { queue: { date: today }, status: 'boarded' },
    });
    const todayActive = await db.queueEntry.count({
      where: { queue: { date: today }, status: { in: ['waiting', 'called'] } },
    });

    // Active sessions
    const activeSessions = await db.boardingSession.count({
      where: { status: 'loading' },
    });

    // Available drivers
    const availableDrivers = await db.driver.count({
      where: { status: 'available' },
    });
    const boardingDrivers = await db.driver.count({
      where: { status: 'boarding' },
    });

    // Active queues
    const activeQueues = await db.queue.count({
      where: { status: 'active' },
    });

    // Recent activity (last 10)
    const recentActivity = await db.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    // Channel breakdown today
    const channelStats = await db.queueEntry.groupBy({
      by: ['channel'],
      where: { queue: { date: today } },
      _count: true,
    });

    // Status breakdown today
    const statusStats = await db.queueEntry.groupBy({
      by: ['status'],
      where: { queue: { date: today } },
      _count: true,
    });

    // Driver status breakdown
    const driverStats = await db.driver.groupBy({
      by: ['status'],
      _count: true,
    });

    // System config
    const configs = await db.systemConfig.findMany({
      select: { key: true, value: true, updatedAt: true },
    });

    // Locations with their queue counts
    const locations = await db.location.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        capacity: true,
        queues: {
          where: { date: today },
          select: { id: true, status: true, entries: { select: { status: true } } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      health: {
        status: 'healthy',
        uptime,
        uptimeHuman: formatUptime(uptime),
        dbLatency,
        timestamp: now.toISOString(),
      },
      database: {
        locations: locationCount,
        queues: queueCount,
        entries: entryCount,
        drivers: driverCount,
        agents: agentCount,
        boardingSessions: boardingCount,
        transactions: transactionCount,
        activityLogs: activityCount,
        configs: configCount,
      },
      live: {
        todayEntries,
        todayBoarded,
        todayActive,
        activeSessions,
        availableDrivers,
        boardingDrivers,
        activeQueues,
        channelBreakdown: channelStats.map(c => ({ channel: c.channel, count: c._count })),
        statusBreakdown: statusStats.map(s => ({ status: s.status, count: s._count })),
        driverBreakdown: driverStats.map(d => ({ status: d.status, count: d._count })),
      },
      locations,
      recentActivity,
      configs: configs.reduce<Record<string, string>>((acc, c) => {
        acc[c.key] = c.value;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error('System health check failed:', error);
    return NextResponse.json(
      { success: false, health: { status: 'unhealthy', error: String(error) } },
      { status: 500 }
    );
  }
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (d === 0 && h === 0) parts.push(`${s}s`);
  return parts.join(' ') || '0s';
}
