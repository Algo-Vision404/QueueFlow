import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/tasks - list all tasks
export async function GET() {
  try {
    const tasks = await db.task.findMany({
      orderBy: [{ phase: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
    });

    // If no tasks exist, seed with default roadmap tasks
    if (tasks.length === 0) {
      const seedTasks = [
        { title: 'Manual queue management with paper tickets', description: 'Basic paper ticket system with agent app', status: 'done', priority: 'high', phase: 1 },
        { title: 'Basic location setup (1 pickup point)', description: 'Configure Kwame Nkrumah Circle as first location', status: 'done', priority: 'high', phase: 1 },
        { title: 'Simple passenger registration', description: 'Name + phone registration on agent tablet', status: 'done', priority: 'medium', phase: 1 },
        { title: 'Data collection on queue patterns', description: 'Collect wait times, peak hours, volume data', status: 'done', priority: 'medium', phase: 1 },
        { title: 'Deploy basic USSD integration', description: 'Launch *384*200# at first location', status: 'done', priority: 'high', phase: 2 },
        { title: 'Launch at 1 high-traffic location', description: 'Go live at Kwame Nkrumah Circle', status: 'done', priority: 'high', phase: 2 },
        { title: 'SMS notifications for queue position', description: 'Send position updates and boarding alerts via SMS', status: 'in_progress', priority: 'high', phase: 2 },
        { title: 'Agent dashboard with real-time queue view', description: 'Live queue management interface for agents', status: 'in_progress', priority: 'high', phase: 2 },
        { title: 'Driver arrival notification', description: 'USSD-based driver check-in system', status: 'todo', priority: 'medium', phase: 2 },
        { title: 'Metrics: volume, wait times, efficiency', description: 'Dashboard analytics for daily operations', status: 'todo', priority: 'medium', phase: 2 },
        { title: 'Automated boarding calls', description: 'Display board + SMS batch boarding calls', status: 'todo', priority: 'high', phase: 3 },
        { title: 'Driver mobile web app', description: 'Arrival confirm, passenger list on mobile web', status: 'todo', priority: 'high', phase: 3 },
        { title: 'Anti-duplication enforcement', description: 'Phone number tracking to prevent multiple entries', status: 'todo', priority: 'high', phase: 3 },
        { title: 'Revenue collection integration', description: 'Mobile money payment integration', status: 'todo', priority: 'medium', phase: 3 },
        { title: 'Performance dashboard with analytics', description: 'Historical analytics and reporting', status: 'todo', priority: 'medium', phase: 3 },
        { title: 'Expand to 5 locations across Accra', description: 'Kaneshie, Tema Station, Madina, 37 Military, Lapaz', status: 'todo', priority: 'high', phase: 4 },
        { title: 'Web app for smartphone users', description: 'Join queue, check position, real-time tracking', status: 'todo', priority: 'medium', phase: 4 },
        { title: 'IVR integration', description: 'Voice-based queue access for accessibility', status: 'todo', priority: 'medium', phase: 4 },
        { title: 'Predictive demand forecasting', description: 'ML-based peak hour prediction', status: 'todo', priority: 'low', phase: 4 },
        { title: 'Digital display boards at locations', description: 'E-ink or LED displays showing current boarding info', status: 'todo', priority: 'low', phase: 4 },
        { title: '25+ locations across the city', description: 'City-wide network expansion', status: 'todo', priority: 'high', phase: 5 },
        { title: 'API partnerships with ride-hailing apps', description: 'Integration with Bolt, Uber, Yango', status: 'todo', priority: 'medium', phase: 5 },
        { title: 'Premium features', description: 'Priority queue, seat selection, trip history', status: 'todo', priority: 'medium', phase: 5 },
        { title: 'Agent network expansion & training', description: 'Scale agent team and training program', status: 'todo', priority: 'high', phase: 5 },
        { title: 'Municipality partnership & compliance', description: 'Regulatory framework and enforcement', status: 'todo', priority: 'high', phase: 5 },
      ];

      await db.task.createMany({
        data: seedTasks.map(t => ({
          title: t.title,
          description: t.description || null,
          status: t.status,
          priority: t.priority,
          phase: t.phase,
        })),
      });

      const seeded = await db.task.findMany({
        orderBy: [{ phase: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
      });

      return NextResponse.json({ success: true, tasks: seeded });
    }

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error('Tasks fetch failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/tasks - create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, status, priority, phase, dueDate } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'title is required' }, { status: 400 });
    }

    const task = await db.task.create({
      data: {
        title,
        description: description || null,
        status: status || 'todo',
        priority: priority || 'medium',
        phase: phase || 1,
        dueDate: dueDate || null,
        completedAt: status === 'done' ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Task creation failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to create task' }, { status: 500 });
  }
}

// PATCH /api/tasks - update a task
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    if (updates.status === 'done') {
      updates.completedAt = new Date();
    } else if (updates.status && updates.status !== 'done') {
      updates.completedAt = null;
    }

    const task = await db.task.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Task update failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE /api/tasks - delete a task
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    await db.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Task deletion failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete task' }, { status: 500 });
  }
}
