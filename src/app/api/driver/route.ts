import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/driver?action=arrival
// GET /api/driver?action=assignment
// POST /api/driver?action=confirm-boarding
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'action query parameter is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'assignment':
        return handleGetAssignment(request);
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in driver GET API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'action query parameter is required (arrival, confirm-boarding)' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'arrival':
        return handleArrival(request);
      case 'confirm-boarding':
        return handleConfirmBoarding(request);
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in driver POST API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Driver reports arrival at a location
async function handleArrival(request: NextRequest) {
  const body = await request.json();
  const { driverId, locationId, vehiclePlate, capacity } = body;

  if (!driverId || !locationId) {
    return NextResponse.json(
      { success: false, error: 'driverId and locationId are required' },
      { status: 400 }
    );
  }

  // Verify driver exists
  const driver = await db.driver.findUnique({
    where: { id: driverId },
  });

  if (!driver) {
    return NextResponse.json(
      { success: false, error: 'Driver not found' },
      { status: 404 }
    );
  }

  if (!driver.isActive) {
    return NextResponse.json(
      { success: false, error: 'Driver account is deactivated' },
      { status: 403 }
    );
  }

  // Verify location exists
  const location = await db.location.findUnique({
    where: { id: locationId },
  });

  if (!location) {
    return NextResponse.json(
      { success: false, error: 'Location not found' },
      { status: 404 }
    );
  }

  // Update driver status
  const updatedDriver = await db.driver.update({
    where: { id: driverId },
    data: {
      status: 'available',
      currentLocationId: locationId,
      vehiclePlate: vehiclePlate || driver.vehiclePlate,
      capacity: capacity || driver.capacity,
    },
  });

  // Check current queue size for the location
  const today = new Date().toISOString().split('T')[0];
  const queue = await db.queue.findFirst({
    where: { locationId, date: today },
  });

  const waitingCount = queue
    ? await db.queueEntry.count({
        where: {
          queueId: queue.id,
          status: 'waiting',
        },
      })
    : 0;

  await db.activityLog.create({
    data: {
      action: 'driver_arrival',
      actorType: 'driver',
      actorId: driverId,
      details: JSON.stringify({
        locationId,
        vehiclePlate: updatedDriver.vehiclePlate,
        capacity: updatedDriver.capacity,
        waitingCount,
      }),
    },
  });

  return NextResponse.json({
    success: true,
    driver: updatedDriver,
    location: {
      id: location.id,
      name: location.name,
    },
    waitingPassengers: waitingCount,
    message: waitingCount > 0
      ? `${waitingCount} passengers waiting at ${location.name}`
      : `Arrived at ${location.name}. No passengers currently waiting.`,
  });
}

// Get driver's current assignment
async function handleGetAssignment(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const driverId = searchParams.get('driverId');

  if (!driverId) {
    return NextResponse.json(
      { success: false, error: 'driverId is required' },
      { status: 400 }
    );
  }

  const driver = await db.driver.findUnique({
    where: { id: driverId },
    include: { currentLocation: true },
  });

  if (!driver) {
    return NextResponse.json(
      { success: false, error: 'Driver not found' },
      { status: 404 }
    );
  }

  // Check for active boarding session assigned to this driver
  const activeSession = await db.boardingSession.findFirst({
    where: {
      driverId,
      status: 'loading',
    },
    include: {
      entries: {
        where: { status: { in: ['called', 'boarding'] } },
      },
      queue: {
        include: { location: true },
      },
    },
    orderBy: { startedAt: 'desc' },
  });

  if (activeSession) {
    return NextResponse.json({
      success: true,
      status: 'boarding',
      driver: {
        id: driver.id,
        name: driver.name,
        status: driver.status,
        vehiclePlate: driver.vehiclePlate,
      },
      assignment: {
        type: 'boarding_session',
        boardingSession: {
          id: activeSession.id,
          status: activeSession.status,
          vehicleCapacity: activeSession.vehicleCapacity,
          passengersLoaded: activeSession.passengersLoaded,
          startedAt: activeSession.startedAt,
        },
        passengers: activeSession.entries.map((e) => ({
          id: e.id,
          ticketNumber: e.ticketNumber,
          passengerName: e.passengerName,
          passengerPhone: e.passengerPhone,
          status: e.status,
        })),
        location: activeSession.queue.location,
      },
    });
  }

  // Check if there are waiting passengers at the driver's current location
  if (driver.currentLocationId) {
    const today = new Date().toISOString().split('T')[0];
    const queue = await db.queue.findFirst({
      where: { locationId: driver.currentLocationId, date: today },
    });

    const waitingCount = queue
      ? await db.queueEntry.count({
          where: {
            queueId: queue.id,
            status: 'waiting',
          },
        })
      : 0;

    return NextResponse.json({
      success: true,
      status: driver.status,
      driver: {
        id: driver.id,
        name: driver.name,
        status: driver.status,
        vehiclePlate: driver.vehiclePlate,
        capacity: driver.capacity,
      },
      assignment: {
        type: driver.status === 'available' ? 'available' : 'waiting',
        location: driver.currentLocation,
        waitingPassengers: waitingCount,
        message:
          driver.status === 'available'
            ? waitingCount > 0
              ? `${waitingCount} passengers waiting. Ready for assignment.`
              : 'No passengers waiting at current location.'
            : 'You are not currently at a location. Report arrival first.',
      },
    });
  }

  return NextResponse.json({
    success: true,
    status: driver.status,
    driver: {
      id: driver.id,
      name: driver.name,
      status: driver.status,
      vehiclePlate: driver.vehiclePlate,
    },
    assignment: {
      type: 'offline',
      message: 'No current assignment. Report arrival at a location to begin.',
    },
  });
}

// Driver confirms boarding is complete
async function handleConfirmBoarding(request: NextRequest) {
  const body = await request.json();
  const { driverId, boardingSessionId, passengerCount } = body;

  if (!driverId || !boardingSessionId) {
    return NextResponse.json(
      { success: false, error: 'driverId and boardingSessionId are required' },
      { status: 400 }
    );
  }

  // Verify driver
  const driver = await db.driver.findUnique({
    where: { id: driverId },
  });

  if (!driver) {
    return NextResponse.json(
      { success: false, error: 'Driver not found' },
      { status: 404 }
    );
  }

  // Verify boarding session belongs to this driver
  const session = await db.boardingSession.findUnique({
    where: { id: boardingSessionId },
    include: {
      entries: true,
      queue: true,
    },
  });

  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Boarding session not found' },
      { status: 404 }
    );
  }

  if (session.driverId !== driverId) {
    return NextResponse.json(
      { success: false, error: 'This boarding session is not assigned to you' },
      { status: 403 }
    );
  }

  if (session.status !== 'loading') {
    return NextResponse.json(
      { success: false, error: `Cannot confirm boarding with status: ${session.status}` },
      { status: 400 }
    );
  }

  const now = new Date();

  // Update all passenger statuses
  const boardedPassengers = passengerCount ?? session.entries.length;
  const entriesToBoard = session.entries.slice(0, boardedPassengers);

  for (const entry of entriesToBoard) {
    await db.queueEntry.update({
      where: { id: entry.id },
      data: {
        status: 'boarded',
        boardedAt: now,
      },
    });
  }

  // Mark remaining as expired if fewer than expected boarded
  for (const entry of session.entries.slice(boardedPassengers)) {
    await db.queueEntry.update({
      where: { id: entry.id },
      data: { status: 'expired' },
    });
  }

  // Complete boarding session
  const completedSession = await db.boardingSession.update({
    where: { id: boardingSessionId },
    data: {
      status: 'completed',
      completedAt: now,
      passengersLoaded: entriesToBoard.length,
    },
  });

  // Update driver status
  await db.driver.update({
    where: { id: driverId },
    data: { status: 'departed' },
  });

  // Update queue totalServed
  await db.queue.update({
    where: { id: session.queueId },
    data: {
      totalServed: { increment: entriesToBoard.length },
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
      action: 'driver_confirm_boarding',
      actorType: 'driver',
      actorId: driverId,
      details: JSON.stringify({
        boardingSessionId,
        passengersBoarded: entriesToBoard.length,
        passengersExpected: session.entries.length,
      }),
    },
  });

  return NextResponse.json({
    success: true,
    boardingSession: completedSession,
    passengersBoarded: entriesToBoard.length,
    message: `Departing with ${entriesToBoard.length} passengers. Safe travels!`,
  });
}
