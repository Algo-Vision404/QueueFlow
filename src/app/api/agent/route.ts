import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/agent?action=login
// Agent login with phone and PIN
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'action query parameter is required (login, add-passenger, call-group, complete-boarding)' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'login':
        return handleLogin(request);
      case 'add-passenger':
        return handleAddPassenger(request);
      case 'call-group':
        return handleCallGroup(request);
      case 'complete-boarding':
        return handleCompleteBoarding(request);
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in agent API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Agent Login
async function handleLogin(request: NextRequest) {
  const body = await request.json();
  const { phone, pin } = body;

  if (!phone || !pin) {
    return NextResponse.json(
      { success: false, error: 'phone and pin are required' },
      { status: 400 }
    );
  }

  const agent = await db.agent.findUnique({
    where: { phone },
    include: { location: true },
  });

  if (!agent) {
    return NextResponse.json(
      { success: false, error: 'Agent not found' },
      { status: 404 }
    );
  }

  if (agent.pin !== pin) {
    return NextResponse.json(
      { success: false, error: 'Invalid PIN' },
      { status: 401 }
    );
  }

  if (!agent.isActive) {
    return NextResponse.json(
      { success: false, error: 'Agent account is deactivated' },
      { status: 403 }
    );
  }

  await db.activityLog.create({
    data: {
      action: 'agent_login',
      actorType: 'agent',
      actorId: agent.id,
      details: JSON.stringify({ agentName: agent.name, locationId: agent.locationId }),
    },
  });

  return NextResponse.json({
    success: true,
    agent: {
      id: agent.id,
      name: agent.name,
      phone: agent.phone,
      locationId: agent.locationId,
      isActive: agent.isActive,
      location: agent.location,
    },
  });
}

// Agent adds passenger to queue
async function handleAddPassenger(request: NextRequest) {
  const body = await request.json();
  const { agentId, passengerName, passengerPhone, channel } = body;

  if (!agentId || !channel) {
    return NextResponse.json(
      { success: false, error: 'agentId and channel are required' },
      { status: 400 }
    );
  }

  // Verify agent exists
  const agent = await db.agent.findUnique({
    where: { id: agentId },
    include: { location: true },
  });

  if (!agent) {
    return NextResponse.json(
      { success: false, error: 'Agent not found' },
      { status: 404 }
    );
  }

  if (!agent.isActive) {
    return NextResponse.json(
      { success: false, error: 'Agent account is deactivated' },
      { status: 403 }
    );
  }

  const today = new Date().toISOString().split('T')[0];

  // Anti-duplication check
  if (passengerPhone) {
    const existingEntry = await db.queueEntry.findFirst({
      where: {
        passengerPhone,
        status: { in: ['waiting', 'called'] },
        queue: { date: today, locationId: agent.locationId },
      },
    });

    if (existingEntry) {
      return NextResponse.json({
        success: false,
        error: 'Passenger already has an active ticket in the queue',
        existingEntry: {
          id: existingEntry.id,
          ticketNumber: existingEntry.ticketNumber,
          status: existingEntry.status,
        },
      });
    }
  }

  // Get or create today's queue
  let queue = await db.queue.findFirst({
    where: { locationId: agent.locationId, date: today },
  });

  if (!queue) {
    queue = await db.queue.create({
      data: { locationId: agent.locationId, date: today, status: 'active' },
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
  const estimatedWait = position * 2;

  const entry = await db.queueEntry.create({
    data: {
      queueId: queue.id,
      ticketNumber: nextTicketNumber,
      channel,
      passengerPhone: passengerPhone || null,
      passengerName: passengerName || null,
      status: 'waiting',
      position,
      estimatedWait,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
  });

  await db.activityLog.create({
    data: {
      action: 'agent_add_passenger',
      actorType: 'agent',
      actorId: agent.id,
      details: JSON.stringify({
        entryId: entry.id,
        ticketNumber: entry.ticketNumber,
        passengerName: passengerName,
        passengerPhone: passengerPhone,
      }),
    },
  });

  return NextResponse.json({
    success: true,
    ticketNumber: entry.ticketNumber,
    position,
    estimatedWait,
    entry,
  });
}

// Agent calls next N waiting passengers for boarding
async function handleCallGroup(request: NextRequest) {
  const body = await request.json();
  const { agentId, count, vehicleId } = body;

  if (!agentId || !count || !vehicleId) {
    return NextResponse.json(
      { success: false, error: 'agentId, count, and vehicleId are required' },
      { status: 400 }
    );
  }

  // Verify agent
  const agent = await db.agent.findUnique({
    where: { id: agentId },
  });

  if (!agent) {
    return NextResponse.json(
      { success: false, error: 'Agent not found' },
      { status: 404 }
    );
  }

  // Verify driver
  const driver = await db.driver.findUnique({
    where: { id: vehicleId },
  });

  if (!driver) {
    return NextResponse.json(
      { success: false, error: 'Driver not found' },
      { status: 404 }
    );
  }

  const today = new Date().toISOString().split('T')[0];

  // Get today's queue for the agent's location
  const queue = await db.queue.findFirst({
    where: { locationId: agent.locationId, date: today },
  });

  if (!queue) {
    return NextResponse.json(
      { success: false, error: 'No active queue found for today at this location' },
      { status: 404 }
    );
  }

  // Get next N waiting passengers
  const waitingEntries = await db.queueEntry.findMany({
    where: {
      queueId: queue.id,
      status: 'waiting',
    },
    orderBy: { position: 'asc' },
    take: Math.min(count, driver.capacity),
  });

  if (waitingEntries.length === 0) {
    return NextResponse.json({
      success: false,
      error: 'No waiting passengers in queue',
    });
  }

  // Create boarding session
  const boardingSession = await db.boardingSession.create({
    data: {
      queueId: queue.id,
      driverId: driver.id,
      vehicleCapacity: driver.capacity,
      passengersLoaded: waitingEntries.length,
      status: 'loading',
    },
  });

  // Update all called passengers
  const ticketNumbers: number[] = [];
  for (const entry of waitingEntries) {
    await db.queueEntry.update({
      where: { id: entry.id },
      data: {
        status: 'called',
        calledAt: new Date(),
        boardingSessionId: boardingSession.id,
      },
    });
    ticketNumbers.push(entry.ticketNumber);
  }

  // Update driver status to boarding
  await db.driver.update({
    where: { id: driver.id },
    data: { status: 'boarding' },
  });

  await db.activityLog.create({
    data: {
      action: 'call_passengers',
      actorType: 'agent',
      actorId: agent.id,
      details: JSON.stringify({
        boardingSessionId: boardingSession.id,
        driverId: driver.id,
        ticketNumbers,
        count: waitingEntries.length,
      }),
    },
  });

  return NextResponse.json({
    success: true,
    boardingSession: {
      id: boardingSession.id,
      status: boardingSession.status,
      vehicleCapacity: boardingSession.vehicleCapacity,
      passengersLoaded: boardingSession.passengersLoaded,
      startedAt: boardingSession.startedAt,
    },
    calledPassengers: waitingEntries.map((e) => ({
      id: e.id,
      ticketNumber: e.ticketNumber,
      passengerName: e.passengerName,
      passengerPhone: e.passengerPhone,
    })),
    ticketNumbers,
    driver: {
      id: driver.id,
      name: driver.name,
      vehiclePlate: driver.vehiclePlate,
    },
  });
}

// Agent completes boarding session
async function handleCompleteBoarding(request: NextRequest) {
  const body = await request.json();
  const { agentId, boardingSessionId } = body;

  if (!agentId || !boardingSessionId) {
    return NextResponse.json(
      { success: false, error: 'agentId and boardingSessionId are required' },
      { status: 400 }
    );
  }

  // Verify agent
  const agent = await db.agent.findUnique({
    where: { id: agentId },
  });

  if (!agent) {
    return NextResponse.json(
      { success: false, error: 'Agent not found' },
      { status: 404 }
    );
  }

  // Verify boarding session exists and is in loading state
  const session = await db.boardingSession.findUnique({
    where: { id: boardingSessionId },
    include: {
      entries: true,
      driver: true,
      queue: true,
    },
  });

  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Boarding session not found' },
      { status: 404 }
    );
  }

  if (session.status !== 'loading') {
    return NextResponse.json(
      { success: false, error: `Cannot complete boarding session with status: ${session.status}` },
      { status: 400 }
    );
  }

  const now = new Date();

  // Update boarding session
  const completedSession = await db.boardingSession.update({
    where: { id: boardingSessionId },
    data: {
      status: 'completed',
      completedAt: now,
    },
  });

  // Update all passenger statuses to boarded
  for (const entry of session.entries) {
    await db.queueEntry.update({
      where: { id: entry.id },
      data: {
        status: 'boarded',
        boardedAt: now,
      },
    });
  }

  // Update driver status to departed
  await db.driver.update({
    where: { id: session.driverId },
    data: { status: 'departed' },
  });

  // Update queue totalServed
  await db.queue.update({
    where: { id: session.queueId },
    data: {
      totalServed: { increment: session.entries.length },
    },
  });

  // Recalculate positions for remaining active entries
  const activeEntries = await db.queueEntry.findMany({
    where: {
      queueId: session.queueId,
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

  await db.activityLog.create({
    data: {
      action: 'complete_boarding',
      actorType: 'agent',
      actorId: agent.id,
      details: JSON.stringify({
        boardingSessionId,
        driverId: session.driverId,
        passengersLoaded: session.entries.length,
      }),
    },
  });

  return NextResponse.json({
    success: true,
    boardingSession: completedSession,
    message: `Boarding completed for ${session.entries.length} passengers`,
  });
}
