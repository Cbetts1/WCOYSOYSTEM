import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { bootstrapLocalNodes } from '@vaga/core-aim';
import { logger } from '@vaga/shared-utils';

import { authRouter } from './routes/auth';
import { docksRouter } from './routes/docks';
import { vmsRouter } from './routes/vms';
import { tasksRouter } from './routes/tasks';
import { adminRouter } from './routes/admin';
import { requireAuth } from './middleware/requireAuth';

const app = express();
const PORT = Number(process.env.API_PORT ?? 4000);

app.use(cors());
app.use(express.json());

// Rate limiter for auth endpoints (login / register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

// Health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'backend-api' });
});

// Public routes
app.use('/auth', authLimiter, authRouter);

// Protected routes
app.use('/docks', apiLimiter, requireAuth, docksRouter);
// vmsRouter handles both /docks/:dockId/vms and /vms/:vmId/start|stop
app.use('/', apiLimiter, requireAuth, vmsRouter);
app.use('/tasks', apiLimiter, requireAuth, tasksRouter);
app.use('/admin', apiLimiter, requireAuth, adminRouter);

// Bootstrap AIM nodes
bootstrapLocalNodes();

app.listen(PORT, () => {
  logger.info(`backend-api listening on port ${PORT}`);
});
