import { Server } from 'socket.io';

const io = new Server({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Track active rooms per location
const locationRooms = new Map<string, Set<string>>();

io.on('connection', (socket) => {
  console.log(`[QueueService] Client connected: ${socket.id}`);

  // Join a location room to receive real-time updates for that location
  socket.on('join-location', (data: { locationId: string }) => {
    if (!data.locationId) {
      socket.emit('error', { message: 'locationId is required' });
      return;
    }

    const roomName = `location:${data.locationId}`;
    socket.join(roomName);

    // Track membership
    if (!locationRooms.has(data.locationId)) {
      locationRooms.set(data.locationId, new Set());
    }
    locationRooms.get(data.locationId)!.add(socket.id);

    console.log(`[QueueService] Socket ${socket.id} joined room ${roomName}`);

    // Confirm join
    socket.emit('joined-location', {
      locationId: data.locationId,
      message: `Joined room for location: ${data.locationId}`,
    });
  });

  // Leave a location room
  socket.on('leave-location', (data: { locationId: string }) => {
    if (!data.locationId) return;

    const roomName = `location:${data.locationId}`;
    socket.leave(roomName);

    if (locationRooms.has(data.locationId)) {
      locationRooms.get(data.locationId)!.delete(socket.id);
      if (locationRooms.get(data.locationId)!.size === 0) {
        locationRooms.delete(data.locationId);
      }
    }

    console.log(`[QueueService] Socket ${socket.id} left room ${roomName}`);
  });

  // Broadcast queue update event (called by backend via internal API or directly)
  socket.on('queue-updated', (data: { locationId: string; entry: unknown; action: string }) => {
    if (!data.locationId) return;

    const roomName = `location:${data.locationId}`;
    io.to(roomName).emit('queue-updated', {
      entry: data.entry,
      action: data.action,
      timestamp: new Date().toISOString(),
    });
  });

  // Broadcast passenger called event
  socket.on('passenger-called', (data: { locationId: string; ticketNumbers: number[] }) => {
    if (!data.locationId) return;

    const roomName = `location:${data.locationId}`;
    io.to(roomName).emit('passenger-called', {
      ticketNumbers: data.ticketNumbers,
      timestamp: new Date().toISOString(),
    });
  });

  // Broadcast boarding started event
  socket.on('boarding-started', (data: { locationId: string; boardingSession: unknown }) => {
    if (!data.locationId) return;

    const roomName = `location:${data.locationId}`;
    io.to(roomName).emit('boarding-started', {
      boardingSession: data.boardingSession,
      timestamp: new Date().toISOString(),
    });
  });

  // Broadcast boarding completed event
  socket.on('boarding-completed', (data: { locationId: string; boardingSession: unknown }) => {
    if (!data.locationId) return;

    const roomName = `location:${data.locationId}`;
    io.to(roomName).emit('boarding-completed', {
      boardingSession: data.boardingSession,
      timestamp: new Date().toISOString(),
    });
  });

  // Broadcast driver arrived event
  socket.on('driver-arrived', (data: { locationId: string; driver: unknown }) => {
    if (!data.locationId) return;

    const roomName = `location:${data.locationId}`;
    io.to(roomName).emit('driver-arrived', {
      driver: data.driver,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`[QueueService] Client disconnected: ${socket.id}`);

    // Clean up room memberships
    for (const [locationId, sockets] of locationRooms.entries()) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        locationRooms.delete(locationId);
      }
    }
  });

  // Ping-pong for connection health
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });
});

// Expose helper function to broadcast from outside (e.g., from API routes)
// This is used via the Socket.io emitter pattern
const PORT = 3004;
io.listen(PORT);
console.log(`[QueueService] Socket.io server running on port ${PORT}`);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[QueueService] SIGTERM received, shutting down...');
  io.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[QueueService] SIGINT received, shutting down...');
  io.close();
  process.exit(0);
});
