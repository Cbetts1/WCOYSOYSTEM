import { Router } from 'express';
import { query, queryOne, hashPassword, verifyPassword, signToken, uuidv4 } from '@vaga/shared-utils';
import type { User } from '@vaga/shared-types';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, role = 'user' } = req.body as { email: string; password: string; role?: string };
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'email and password required' });
      return;
    }
    const existing = await queryOne<User>('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) {
      res.status(409).json({ success: false, error: 'Email already registered' });
      return;
    }
    const id = uuidv4();
    const passwordHash = await hashPassword(password);
    const finalRole = role === 'admin' ? 'admin' : 'user';
    await query(
      'INSERT INTO users (id, email, password_hash, role, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [id, email, passwordHash, finalRole]
    );
    const token = signToken({ userId: id, email, role: finalRole });
    res.status(201).json({ success: true, data: { token, userId: id, email, role: finalRole } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'email and password required' });
      return;
    }
    const user = await queryOne<User>(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }
    const ok = await verifyPassword(password, user.passwordHash ?? (user as unknown as Record<string, string>)['password_hash']);
    if (!ok) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.json({ success: true, data: { token, userId: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

authRouter.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  try {
    const { verifyToken } = await import('@vaga/shared-utils');
    const payload = verifyToken(header.slice(7));
    res.json({ success: true, data: payload });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});
