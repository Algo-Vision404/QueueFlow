import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/dashboard?locationId=xxx
// Dashboard statistics + seed data initialization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const seed = searchParams.get('seed');

    if (seed === 'true') {
      const seeded = await seedDatabase();
      return NextResponse.json({ success: true, seeded });
    }

    if (!locationId) {
      return NextResponse.json(
        { success: false, error: 'locationId is required' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Count waiting + called entries
    const totalInQueue = await db.queueEntry.count({
      where: {
        queue: { locationId, date: today },
        status: { in: ['waiting', 'called'] },
      },
    });

    // Count boarded entries
    const totalServed = await db.queueEntry.count({
      where: {
        queue: { locationId, date: today },
        status: 'boarded',
      },
    });

    // Average wait time (created -> boarded)
    const boardedEntries = await db.queueEntry.findMany({
      where: {
        queue: { locationId, date: today },
        status: 'boarded',
        boardedAt: { not: null },
      },
      select: { createdAt: true, boardedAt: true },
    });

    let averageWaitTime = 0;
    if (boardedEntries.length > 0) {
      const totalWait = boardedEntries.reduce((sum, entry) => {
        const created = new Date(entry.createdAt).getTime();
        const boarded = new Date(entry.boardedAt!).getTime();
        return sum + (boarded - created) / (1000 * 60); // minutes
      }, 0);
      averageWaitTime = Math.round(totalWait / boardedEntries.length);
    }

    // Active drivers at location
    const activeDrivers = await db.driver.count({
      where: {
        currentLocationId: locationId,
        status: { in: ['available', 'boarding'] },
      },
    });

    // Active boarding sessions today
    const boardingSessions = await db.boardingSession.count({
      where: {
        queue: { locationId, date: today },
        status: 'loading',
      },
    });

    // Channel breakdown
    const entriesByChannel = await db.queueEntry.groupBy({
      by: ['channel'],
      where: {
        queue: { locationId, date: today },
      },
      _count: true,
    });

    const channelBreakdown = entriesByChannel.map((item) => ({
      channel: item.channel,
      count: item._count,
    }));

    // Queue trend - create hourly buckets
    const allEntries = await db.queueEntry.findMany({
      where: {
        queue: { locationId, date: today },
      },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    const queueTrend: { time: string; count: number }[] = [];
    const hourBuckets = new Map<string, number>();

    // Initialize buckets for each hour from 6am to current hour
    const currentHour = new Date().getHours();
    for (let h = 6; h <= Math.min(currentHour, 22); h++) {
      const label = `${h.toString().padStart(2, '0')}:00`;
      hourBuckets.set(label, 0);
    }

    // Count entries created in each hour
    for (const entry of allEntries) {
      const hour = new Date(entry.createdAt).getHours();
      const label = `${hour.toString().padStart(2, '0')}:00`;
      if (hourBuckets.has(label)) {
        hourBuckets.set(label, (hourBuckets.get(label) || 0) + 1);
      }
    }

    for (const [time, count] of hourBuckets) {
      queueTrend.push({ time, count });
    }

    // If no real data exists, generate realistic mock trend data
    if (queueTrend.length === 0) {
      const mockTrend = [
        { time: '06:00', count: 3 },
        { time: '07:00', count: 8 },
        { time: '08:00', count: 15 },
        { time: '09:00', count: 22 },
        { time: '10:00', count: 18 },
        { time: '11:00', count: 12 },
        { time: '12:00', count: 20 },
        { time: '13:00', count: 16 },
        { time: '14:00', count: 10 },
        { time: '15:00', count: 14 },
        { time: '16:00', count: 25 },
        { time: '17:00', count: 30 },
        { time: '18:00', count: 22 },
        { time: '19:00', count: 14 },
        { time: '20:00', count: 8 },
      ];
      queueTrend.push(...mockTrend);
    }

    // If no real channel breakdown, generate mock data
    if (channelBreakdown.length === 0) {
      channelBreakdown.push(
        { channel: 'agent', count: 45 },
        { channel: 'ussd', count: 28 },
        { channel: 'web', count: 15 },
        { channel: 'sms', count: 8 },
        { channel: 'ivr', count: 4 }
      );
    }

    // Recent entries for live feed
    const recentEntries = await db.queueEntry.findMany({
      where: {
        queue: { locationId, date: today },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Active boarding sessions with details
    const activeBoardingSessions = await db.boardingSession.findMany({
      where: {
        queue: { locationId, date: today },
        status: 'loading',
      },
      include: {
        driver: true,
        entries: {
          where: { status: { in: ['called', 'boarding'] } },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    // Available drivers at this location
    const availableDrivers = await db.driver.findMany({
      where: {
        currentLocationId: locationId,
        status: 'available',
      },
      orderBy: { updatedAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalInQueue,
        totalServed,
        averageWaitTime,
        activeDrivers,
        boardingSessions,
      },
      channelBreakdown,
      queueTrend,
      recentEntries,
      activeBoardingSessions,
      availableDrivers,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

// Seed database with demo data
async function seedDatabase() {
  try {
    // Check if data already exists
    const existingLocation = await db.location.findFirst({
      where: { name: 'Kwame Nkrumah Circle' },
    });

    if (existingLocation) {
      return { message: 'Seed data already exists', locationId: existingLocation.id };
    }

    const today = new Date().toISOString().split('T')[0];

    // Create location
    const location = await db.location.create({
      data: {
        name: 'Kwame Nkrumah Circle',
        address: 'Kwame Nkrumah Circle, Accra, Ghana',
        latitude: 5.556,
        longitude: -0.2254,
        capacity: 100,
        isActive: true,
      },
    });

    // Create agent
    const agent = await db.agent.create({
      data: {
        name: 'Ama Mensah',
        phone: '+233240000001',
        locationId: location.id,
        pin: '1234',
        isActive: true,
      },
    });

    // Create drivers
    const drivers = [];
    const driverData = [
      { name: 'Kofi Asante', phone: '+233240000010', vehiclePlate: 'GC-1234-A', vehicleType: 'minibus', capacity: 14 },
      { name: 'Emmanuel Osei', phone: '+233240000011', vehiclePlate: 'GC-5678-B', vehicleType: 'minibus', capacity: 14 },
      { name: 'Yaw Boateng', phone: '+233240000012', vehiclePlate: 'GC-9012-C', vehicleType: 'tro_tro', capacity: 12 },
      { name: 'Kwabena Darko', phone: '+233240000013', vehiclePlate: 'GC-3456-D', vehicleType: 'bus', capacity: 33 },
      { name: 'Joseph Adjei', phone: '+233240000014', vehiclePlate: 'GC-7890-E', vehicleType: 'taxi', capacity: 4 },
    ];

    for (const d of driverData) {
      drivers.push(
        await db.driver.create({
          data: {
            ...d,
            currentLocationId: location.id,
            status: 'available',
            isActive: true,
          },
        })
      );
    }

    // Create today's queue
    const queue = await db.queue.create({
      data: {
        locationId: location.id,
        date: today,
        status: 'active',
        totalServed: 0,
      },
    });

    // Create 35 queue entries with various statuses
    const channels = ['agent', 'ussd', 'web', 'sms', 'ivr'];
    const names = [
      'Abena Frimpong', 'Akosua Poku', 'Adwoa Owusu', 'Ama Mensah', 'Efua Badu',
      'Kwame Mensah', 'Kofi Asante', 'Kwasi Boateng', 'Yaw Osei', 'Kodwo Annan',
      'Nana Akufo', 'Oheneba Adjei', 'Barima Ofori', 'Takyi Darko', 'Pokuah Amoah',
      'Afua Acheampong', 'Abena Sarpong', 'Akua Boadi', 'Yaa Osei', 'Frema Duodu',
      'Adwoa Fosu', 'Ama Takyi', 'Efua Appiah', 'Abigail Owusu', 'Esther Osei',
      'Grace Mensah', 'Comfort Asante', 'Patience Boadi', 'Mercy Ofori', 'Hannah Adjei',
      'Samuel Tetteh', 'Daniel Quaye', 'Michael Okai', 'David Tetteh', 'James Osei',
      'Robert Mensah', 'John Asante', 'Peter Boateng', 'Paul Owusu', 'Andrew Annan',
    ];

    const statuses: ('waiting' | 'called' | 'boarded' | 'cancelled')[] = [
      'boarded', 'boarded', 'boarded', 'boarded', 'boarded', 'boarded', 'boarded', 'boarded',
      'boarded', 'boarded', 'boarded', 'boarded', 'boarded', 'boarded', 'boarded', // 15 boarded
      'called', 'called', 'called', 'called', 'called', // 5 called
      'waiting', 'waiting', 'waiting', 'waiting', 'waiting', 'waiting', 'waiting', 'waiting', // 8 waiting
      'waiting', 'waiting', 'waiting', 'waiting', 'waiting', // 5 more waiting
      'cancelled', 'cancelled', // 2 cancelled
    ];

    let position = 0;
    let boardedCount = 0;
    const boardingSessionEntries: Map<number, string[]> = new Map();

    for (let i = 0; i < 35; i++) {
      const status = statuses[i];
      const channel = channels[i % channels.length];
      const name = names[i % names.length];

      if (status !== 'cancelled') {
        position++;
      }

      const createdAt = new Date(Date.now() - (35 - i) * 5 * 60 * 1000); // Stagger by 5 minutes

      const entryData: Record<string, unknown> = {
        queueId: queue.id,
        ticketNumber: i + 1,
        channel,
        passengerName: name,
        passengerPhone: `+233${Math.floor(Math.random() * 900000000 + 100000000)}`,
        status,
        position: status === 'cancelled' ? 0 : position,
        estimatedWait: status === 'waiting' ? position * 2 : null,
        createdAt,
      };

      if (status === 'called') {
        entryData.calledAt = new Date(Date.now() - 10 * 60 * 1000);
      }

      if (status === 'boarded') {
        entryData.boardedAt = new Date(Date.now() - (30 - boardedCount) * 3 * 60 * 1000);
        entryData.calledAt = new Date(Date.now() - (35 - i) * 3 * 60 * 1000);
        boardedCount++;
      }

      const entry = await db.queueEntry.create({ data: entryData });

      // Group boarded entries into boarding sessions (groups of ~14)
      if (status === 'boarded') {
        const sessionIndex = Math.floor(boardedCount / 14);
        if (!boardingSessionEntries.has(sessionIndex)) {
          boardingSessionEntries.set(sessionIndex, []);
        }
        boardingSessionEntries.get(sessionIndex)!.push(entry.id);
      }
    }

    // Create boarding sessions
    let sessionNum = 0;
    for (const [_, entryIds] of boardingSessionEntries) {
      const driver = drivers[sessionNum % drivers.length];
      const session = await db.boardingSession.create({
        data: {
          queueId: queue.id,
          driverId: driver.id,
          vehicleCapacity: driver.capacity,
          passengersLoaded: entryIds.length,
          status: 'completed',
          startedAt: new Date(Date.now() - 90 * 60 * 1000 + sessionNum * 45 * 60 * 1000),
          completedAt: new Date(Date.now() - 60 * 60 * 1000 + sessionNum * 45 * 60 * 1000),
        },
      });

      // Link entries to boarding sessions
      for (const entryId of entryIds) {
        await db.queueEntry.update({
          where: { id: entryId },
          data: { boardingSessionId: session.id },
        });
      }

      sessionNum++;
    }

    // Update queue totalServed
    await db.queue.update({
      where: { id: queue.id },
      data: { totalServed: 15 },
    });

    // Set some drivers to departed (after boarding sessions)
    await db.driver.update({
      where: { id: drivers[0].id },
      data: { status: 'departed' },
    });
    await db.driver.update({
      where: { id: drivers[1].id },
      data: { status: 'departed' },
    });

    // Create an active boarding session with the 5 called entries
    const activeSession = await db.boardingSession.create({
      data: {
        queueId: queue.id,
        driverId: drivers[2].id,
        vehicleCapacity: drivers[2].capacity,
        passengersLoaded: 5,
        status: 'loading',
        startedAt: new Date(Date.now() - 10 * 60 * 1000),
      },
    });

    // Link called entries to active boarding session
    const calledEntries = await db.queueEntry.findMany({
      where: { queueId: queue.id, status: 'called' },
    });
    for (const entry of calledEntries) {
      await db.queueEntry.update({
        where: { id: entry.id },
        data: { boardingSessionId: activeSession.id },
      });
    }

    // Update driver for active boarding
    await db.driver.update({
      where: { id: drivers[2].id },
      data: { status: 'boarding' },
    });

    // Create some sample transactions
    await db.transaction.createMany({
      data: [
        { type: 'passenger_fee', amount: 2.0, currency: 'GHS', description: 'Queue service fee', referenceId: queue.id },
        { type: 'driver_fee', amount: 5.0, currency: 'GHS', description: 'Driver monthly subscription', referenceId: drivers[0].id },
        { type: 'agent_commission', amount: 10.0, currency: 'GHS', description: 'Agent commission - weekly', referenceId: agent.id },
        { type: 'passenger_fee', amount: 2.0, currency: 'GHS', description: 'Queue service fee', referenceId: queue.id },
        { type: 'driver_fee', amount: 5.0, currency: 'GHS', description: 'Driver monthly subscription', referenceId: drivers[1].id },
      ],
    });

    return {
      message: 'Seed data created successfully',
      locationId: location.id,
      agentId: agent.id,
      queueId: queue.id,
      driverIds: drivers.map((d) => d.id),
      totalEntries: 35,
      boardingSessions: sessionNum + 1,
    };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}
