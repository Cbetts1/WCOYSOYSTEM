import { Router } from 'express';
import { query, queryOne } from '@vaga/shared-utils';
import { aura } from '@vaga/core-aura';
import { aios } from '@vaga/core-aios';
import type { Task } from '@vaga/shared-types';

export const tasksRouter = Router();

tasksRouter.post('/', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { intent, dockId, vmId } = req.body as {
      intent: string;
      dockId?: string;
      vmId?: string;
    };

    if (!intent?.trim()) {
      res.status(400).json({ success: false, error: 'intent is required' });
      return;
    }

    // 1. AURA plans the intent into a typed AURAPlan
    const plannedTask = aura.planIntent(intent, userId, dockId, vmId);

    // 2. AIOS executes (or spawns Arrow job)
    const result = await aios.executeTask(plannedTask, userId);

    // Return the task row
    const task = await queryOne<Task>('SELECT * FROM tasks WHERE id = $1', [result.taskId]);
    res.status(201).json({ success: true, data: { task, arrowJobId: result.jobId } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

tasksRouter.get('/', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const tasks = await query<Task>(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

tasksRouter.get('/:id', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const task = await queryOne<Task>(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [req.params['id'], userId]
    );
    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});
