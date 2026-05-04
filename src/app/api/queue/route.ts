import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/queue?locationId=xxx&date=2025-01-15&status=waiting
// List queue entries for a location on a given date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const status = searchParams.get('status');

    if (!locationId) {
      return NextResponse.json(
        { success: false, error: 'locationId is required' },
        { status: 400 }
      );
    }

    // Find the queue for this location and date
    const queue = await db.queue.findFirst({
      where: { locationId, date },
      include: {
        entries: {
          where: status ? { status } : undefined,
          orderBy: { position: 'asc' },
        },
        location: true,
      },
    });

    if (!queue) {
      return NextResponse.json({
        success: true,
        queue: null,
        entries: [],
        locationId,
        date,
      });
    }

    return NextResponse.json({
      success: true,
      queue: {
        id: queue.id,
        locationId: queue.locationId,
        date: queue.date,
        status: queue.status,
        totalServed: queue.totalServed,
      },
      entries: queue.entries,
      location: queue.location,
    });
  } catch (error) {
    console.error('Error listing queue entries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch queue entries' },
      { status: 500 }
    );
  }
}

// POST /api/queue
// Join the queue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, name, channel, locationId, destination } = body;

    if (!channel || !locationId) {
      return NextResponse.json(
        { success: false, error: 'channel and locationId are required' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Anti-duplication: check if phone already has an active entry today
    if (phone) {
      const existingEntry = await db.queueEntry.findFirst({
        where: {
          passengerPhone: phone,
          status: { in: ['waiting', 'called'] },
          queue: { date: today, locationId },
        },
      });

      if (existingEntry) {
        // Return existing entry info
        const position = await db.queueEntry.count({
          where: {
            queueId: existingEntry.queueId,
            position: { lt: existingEntry.position },
            status: { in: ['waiting', 'called'] },
          },
        });
        return NextResponse.json({
          success: false,
          error: 'You already have an active ticket in the queue',
          existingEntry: {
            id: existingEntry.id,
            ticketNumber: existingEntry.ticketNumber,
            status: existingEntry.status,
            position: position + 1,
          },
        });
      }
    }

    // Get or create today's queue for this location
    let queue = await db.queue.findFirst({
      where: { locationId, date: today },
    });

    if (!queue) {
      queue = await db.queue.create({
        data: {
          locationId,
          date: today,
          status: 'active',
        },
      });
    }

    // Calculate next ticket number
    const maxTicket = await db.queueEntry.aggregate({
      where: { queueId: queue.id },
      _max: { ticketNumber: true },
    });
    const nextTicketNumber = (maxTicket._max.ticketNumber || 0) + 1;

    // Calculate position
    const activeEntries = await db.queueEntry.count({
      where: {
        queueId: queue.id,
        status: { in: ['waiting', 'called'] },
      },
    });
    const position = activeEntries + 1;

    // Calculate estimated wait (~2 minutes per position)
    const estimatedWait = position * 2;

    // Create the queue entry
    const entry = await db.queueEntry.create({
      data: {
        queueId: queue.id,
        ticketNumber: nextTicketNumber,
        channel,
        passengerPhone: phone || null,
        passengerName: name || null,
        status: 'waiting',
        position,
        estimatedWait,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours expiry
      },
    });

    // Log activity
    await db.activityLog.create({
      data: {
        action: 'join_queue',
        actorType: channel === 'agent' ? 'agent' : 'passenger',
        details: JSON.stringify({
          entryId: entry.id,
          ticketNumber: entry.ticketNumber,
          channel,
          locationId,
          phone: phone || null,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      ticketNumber: entry.ticketNumber,
      position,
      estimatedWait,
      entry: {
        id: entry.id,
        ticketNumber: entry.ticketNumber,
        channel: entry.channel,
        passengerName: entry.passengerName,
        status: entry.status,
        position: entry.position,
        estimatedWait: entry.estimatedWait,
        createdAt: entry.createdAt,
      },
    });
  } catch (error) {
    console.error('Error joining queue:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to join queue' },
      { status: 500 }
    );
  }
}
