import { Router } from 'express';
import { query } from '@vaga/shared-utils';
import { listNodes } from '@vaga/core-aim';
import { requireAdmin } from '../middleware/requireAuth';
import type { User, Dock, VM, Task, ArrowJob } from '@vaga/shared-types';

export const adminRouter = Router();

adminRouter.use(requireAdmin);

adminRouter.get('/system/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } });
});

adminRouter.get('/system/nodes', (_req, res) => {
  res.json({ success: true, data: listNodes() });
});

adminRouter.get('/users', async (_req, res) => {
  try {
    const users = await query<User>(
      'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

adminRouter.get('/docks', async (_req, res) => {
  try {
    const docks = await query<Dock>('SELECT * FROM docks ORDER BY created_at DESC');
    res.json({ success: true, data: docks });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

adminRouter.get('/vms', async (_req, res) => {
  try {
    const vms = await query<VM>('SELECT * FROM vms ORDER BY created_at DESC');
    res.json({ success: true, data: vms });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

adminRouter.get('/tasks', async (_req, res) => {
  try {
    const tasks = await query<Task>('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

adminRouter.get('/arrow-jobs', async (_req, res) => {
  try {
    const jobs = await query<ArrowJob>('SELECT * FROM arrow_jobs ORDER BY created_at DESC');
    res.json({ success: true, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

adminRouter.get('/arrow-jobs/:id', async (req, res) => {
  try {
    const jobs = await query<ArrowJob>(
      'SELECT * FROM arrow_jobs WHERE id = $1',
      [req.params['id']]
    );
    if (!jobs[0]) {
      res.status(404).json({ success: false, error: 'Job not found' });
      return;
    }
    res.json({ success: true, data: jobs[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});
