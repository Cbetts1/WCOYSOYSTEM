import { Router } from 'express';
import { query, queryOne, uuidv4 } from '@vaga/shared-utils';
import type { Dock } from '@vaga/shared-types';

export const docksRouter = Router();

docksRouter.post('/', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { name = 'My Dock' } = req.body as { name?: string };
    const dockId = uuidv4();
    await query(
      'INSERT INTO docks (id, user_id, name, created_at) VALUES ($1, $2, $3, NOW())',
      [dockId, userId, name]
    );
    const dock = await queryOne<Dock>('SELECT * FROM docks WHERE id = $1', [dockId]);
    res.status(201).json({ success: true, data: dock });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

docksRouter.get('/', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const docks = await query<Dock>(
      'SELECT * FROM docks WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json({ success: true, data: docks });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

docksRouter.get('/:dockId', async (req, res) => {
  try {
    const userId = req.user!.userId;
    const dock = await queryOne<Dock>(
      'SELECT * FROM docks WHERE id = $1 AND user_id = $2',
      [req.params['dockId'], userId]
    );
    if (!dock) {
      res.status(404).json({ success: false, error: 'Dock not found' });
      return;
    }
    res.json({ success: true, data: dock });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});
