'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Clock, Plus, CheckCircle, Circle, AlertCircle, Trash2,
  ChevronRight, Loader2, ListFilter, GripVertical,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ProgressRing } from '@/lib/animations';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  phase: number;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  todo: { icon: <Circle className="w-4 h-4" />, label: 'To Do', color: 'bg-muted text-muted-foreground' },
  in_progress: { icon: <AlertCircle className="w-4 h-4" />, label: 'In Progress', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  done: { icon: <CheckCircle className="w-4 h-4" />, label: 'Done', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  blocked: { icon: <AlertCircle className="w-4 h-4" />, label: 'Blocked', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  critical: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Critical' },
  high: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', label: 'High' },
  medium: { color: 'bg-cashew text-foreground', label: 'Medium' },
  low: { color: 'bg-muted text-muted-foreground', label: 'Low' },
};

const phaseNames: Record<number, string> = {
  1: 'Prototype',
  2: 'Pilot',
  3: 'Automation',
  4: 'Scale',
  5: 'Growth',
};

export function RoadmapView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newPhase, setNewPhase] = useState(1);
  const [filterPhase, setFilterPhase] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tasks');
      const json = await res.json();
      if (json.success) setTasks(json.tasks);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const toggleStatus = async (task: Task) => {
    const nextStatus = task.status === 'done' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'done';
    setUpdatingId(task.id);
    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: nextStatus }),
      });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
    } catch { /* keep */ }
    finally { setUpdatingId(null); }
  };

  const addTask = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() || null, priority: newPriority, phase: newPhase }),
      });
      setNewTitle('');
      setNewDesc('');
      setShowAdd(false);
      fetchTasks();
    } catch { /* keep */ }
    finally { setAdding(false); }
  };

  const deleteTask = async (id: string) => {
    try {
      await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch { /* keep */ }
  };

  const filteredTasks = filterPhase !== null ? tasks.filter(t => t.phase === filterPhase) : tasks;
  const phases = [1, 2, 3, 4, 5];

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const overallProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cashew"><Clock className="w-5 h-5" /></div>
          <div><h2 className="text-xl font-bold">Task Tracker</h2></div>
        </div>
        {[1,2,3].map(i => <Card key={i} className="glass-card"><CardContent className="p-4"><div className="shimmer h-16 rounded-lg" /></CardContent></Card>)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cashew">
            <Clock className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Task Tracker</h2>
            <p className="text-sm text-muted-foreground">{totalTasks} tasks across {phases.length} phases</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Task
        </Button>
      </div>

      {/* Progress Overview */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <ProgressRing progress={overallProgress} size={56} strokeWidth={4} color="var(--foreground)">
              <span className="text-xs font-bold">{overallProgress}%</span>
            </ProgressRing>
            <div className="flex-1">
              <p className="text-sm font-semibold">Overall Progress</p>
              <p className="text-xs text-muted-foreground">{doneTasks} of {totalTasks} completed</p>
              <div className="flex gap-3 mt-1">
                <span className="text-[10px] text-muted-foreground">{inProgressTasks} in progress</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterPhase(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filterPhase === null ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-accent'
          }`}
        >
          All ({tasks.length})
        </button>
        {phases.map(p => {
          const count = tasks.filter(t => t.phase === p).length;
          const done = tasks.filter(t => t.phase === p && t.status === 'done').length;
          return (
            <button
              key={p}
              onClick={() => setFilterPhase(filterPhase === p ? null : p)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterPhase === p ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              P{p} {phaseNames[p]} ({done}/{count})
            </button>
          );
        })}
      </div>

      {/* Add Task Form */}
      {showAdd && (
        <Card className="glass-card border-foreground/20">
          <CardContent className="p-3 space-y-3">
            <Input
              placeholder="Task title..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              autoFocus
              className="text-sm"
            />
            <Input
              placeholder="Description (optional)..."
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className="text-sm"
            />
            <div className="flex items-center gap-2">
              <select
                value={newPriority}
                onChange={e => setNewPriority(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg bg-muted border border-border"
              >
                {Object.entries(priorityConfig).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <select
                value={newPhase}
                onChange={e => setNewPhase(Number(e.target.value))}
                className="text-xs px-2 py-1.5 rounded-lg bg-muted border border-border"
              >
                {phases.map(p => (
                  <option key={p} value={p}>Phase {p}: {phaseNames[p]}</option>
                ))}
              </select>
              <Button size="sm" onClick={addTask} disabled={adding || !newTitle.trim()} className="ml-auto gap-1">
                {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task List - Grouped by Phase */}
      <div className="space-y-4">
        {(filterPhase !== null ? [filterPhase] : phases).map(phase => {
          const phaseTasks = filteredTasks.filter(t => t.phase === phase);
          if (phaseTasks.length === 0) return null;

          const phaseDone = phaseTasks.filter(t => t.status === 'done').length;
          const phaseProgress = Math.round((phaseDone / phaseTasks.length) * 100);

          return (
            <div key={phase}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold">Phase {phase}: {phaseNames[phase]}</h3>
                <Badge variant="outline" className="text-[10px]">{phaseDone}/{phaseTasks.length}</Badge>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-foreground transition-all duration-500" style={{ width: `${phaseProgress}%` }} />
                </div>
              </div>
              <div className="space-y-1.5">
                {phaseTasks.map(task => {
                  const sc = statusConfig[task.status] || statusConfig.todo;
                  const pc = priorityConfig[task.priority] || priorityConfig.medium;
                  const isUpdating = updatingId === task.id;

                  return (
                    <Card key={task.id} className="glass-card overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          <button
                            onClick={() => toggleStatus(task)}
                            disabled={isUpdating}
                            className="flex-shrink-0 transition-colors"
                          >
                            {isUpdating ? (
                              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            ) : (
                              <span className={task.status === 'done' ? 'text-green-600' : 'text-muted-foreground'}>
                                {sc.icon}
                              </span>
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{task.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Badge className={`text-[9px] px-1.5 ${pc.color}`}>{pc.label}</Badge>
                            <Badge className={`text-[9px] px-1.5 ${sc.color}`}>{sc.label}</Badge>
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">No tasks found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
