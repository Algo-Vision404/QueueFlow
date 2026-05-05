import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/queue/[id]
// Get single queue entry status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const entry = await db.queueEntry.findUnique({
      where: { id },
      include: {
        queue: {
          include: { location: true },
        },
        boardingSession: {
          include: { driver: true },
        },
      },
    });

    if (!entry) {
      return NextResponse.json(
        { success: false, error: 'Queue entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      entry: {
        id: entry.id,
        ticketNumber: entry.ticketNumber,
        channel: entry.channel,
        passengerPhone: entry.passengerPhone,
        passengerName: entry.passengerName,
        status: entry.status,
        position: entry.position,
        estimatedWait: entry.estimatedWait,
        calledAt: entry.calledAt,
        boardedAt: entry.boardedAt,
        expiresAt: entry.expiresAt,
        createdAt: entry.createdAt,
        queue: entry.queue
          ? {
              id: entry.queue.id,
              date: entry.queue.date,
              status: entry.queue.status,
              location: entry.queue.location,
            }
          : null,
        boardingSession: entry.boardingSession
          ? {
              id: entry.boardingSession.id,
              status: entry.boardingSession.status,
              driver: entry.boardingSession.driver,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error fetching queue entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch queue entry' },
      { status: 500 }
    );
  }
}

// PATCH /api/queue/[id]
// Update queue entry (change status, mark as called, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, position, calledAt, passengerName } = body;

    const existing = await db.queueEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Queue entry not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (position !== undefined) updateData.position = position;
    if (calledAt !== undefined) updateData.calledAt = calledAt ? new Date(calledAt) : new Date();
    if (passengerName !== undefined) updateData.passengerName = passengerName;

    // If marking as called, set calledAt
    if (status === 'called' && !calledAt) {
      updateData.calledAt = new Date();
    }

    // If marking as boarded, set boardedAt
    if (status === 'boarded') {
      updateData.boardedAt = new Date();
    }

    const updated = await db.queueEntry.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await db.activityLog.create({
      data: {
        action: 'update_entry',
        actorType: 'agent',
        details: JSON.stringify({
          entryId: id,
          oldStatus: existing.status,
          newStatus: status || existing.status,
          changes: updateData,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      entry: updated,
    });
  } catch (error) {
    console.error('Error updating queue entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update queue entry' },
      { status: 500 }
    );
  }
}

// DELETE /api/queue/[id]
// Cancel queue entry (set status to "cancelled")
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.queueEntry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Queue entry not found' },
        { status: 404 }
      );
    }

    if (existing.status === 'boarded' || existing.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: `Cannot cancel entry with status: ${existing.status}` },
        { status: 400 }
      );
    }

    const cancelled = await db.queueEntry.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    // Recalculate positions for remaining active entries
    const activeEntries = await db.queueEntry.findMany({
      where: {
        queueId: existing.queueId,
        status: { in: ['waiting', 'called'] },
      },
      orderBy: { position: 'asc' },
    });

    for (let i = 0; i < activeEntries.length; i++) {
      await db.queueEntry.update({
        where: { id: activeEntries[i].id },
        data: {
          position: i + 1,
          estimatedWait: (i + 1) * 2,
        },
      });
    }

    // Log activity
    await db.activityLog.create({
      data: {
        action: 'cancel_entry',
        actorType: 'passenger',
        details: JSON.stringify({
          entryId: id,
          ticketNumber: cancelled.ticketNumber,
          previousStatus: existing.status,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      entry: cancelled,
      message: 'Queue entry cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling queue entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel queue entry' },
      { status: 500 }
    );
  }
}
