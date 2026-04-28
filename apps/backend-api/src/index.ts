import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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

// Health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'backend-api' });
});

// Public routes
app.use('/auth', authRouter);

// Protected routes
app.use('/docks', requireAuth, docksRouter);
// vmsRouter handles both /docks/:dockId/vms and /vms/:vmId/start|stop
app.use('/', requireAuth, vmsRouter);
app.use('/tasks', requireAuth, tasksRouter);
app.use('/admin', requireAuth, adminRouter);

// Bootstrap AIM nodes
bootstrapLocalNodes();

app.listen(PORT, () => {
  logger.info(`backend-api listening on port ${PORT}`);
});
