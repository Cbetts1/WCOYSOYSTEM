import { Router } from 'express';
import { query, queryOne, uuidv4 } from '@vaga/shared-utils';
import type { VM } from '@vaga/shared-types';

export const vmsRouter = Router();

// POST /docks/:dockId/vms
vmsRouter.post('/docks/:dockId/vms', async (req, res) => {
  try {
    const { dockId } = req.params;
    const { name = 'My VM', type = 'analysis-vm' } = req.body as { name?: string; type?: string };
    const vmId = uuidv4();
    await query(
      "INSERT INTO vms (id, dock_id, name, type, status, created_at) VALUES ($1, $2, $3, $4, 'stopped', NOW())",
      [vmId, dockId, name, type]
    );
    const vm = await queryOne<VM>('SELECT * FROM vms WHERE id = $1', [vmId]);
    res.status(201).json({ success: true, data: vm });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// GET /docks/:dockId/vms
vmsRouter.get('/docks/:dockId/vms', async (req, res) => {
  try {
    const vms = await query<VM>(
      'SELECT * FROM vms WHERE dock_id = $1 ORDER BY created_at DESC',
      [req.params['dockId']]
    );
    res.json({ success: true, data: vms });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// POST /vms/:vmId/start
vmsRouter.post('/:vmId/start', async (req, res) => {
  try {
    await query("UPDATE vms SET status = 'running' WHERE id = $1", [req.params['vmId']]);
    const vm = await queryOne<VM>('SELECT * FROM vms WHERE id = $1', [req.params['vmId']]);
    res.json({ success: true, data: vm });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// POST /vms/:vmId/stop
vmsRouter.post('/:vmId/stop', async (req, res) => {
  try {
    await query("UPDATE vms SET status = 'stopped' WHERE id = $1", [req.params['vmId']]);
    const vm = await queryOne<VM>('SELECT * FROM vms WHERE id = $1', [req.params['vmId']]);
    res.json({ success: true, data: vm });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});
