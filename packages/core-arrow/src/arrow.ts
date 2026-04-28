import type { ArrowJobPayload, ArrowJobStatus } from '@vaga/shared-types';
import { query, queryOne, uuidv4, logger } from '@vaga/shared-utils';

export interface ArrowJobRow {
  id: string;
  task_id: string;
  status: ArrowJobStatus;
  payload: ArrowJobPayload;
  result: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function enqueueJob(payload: ArrowJobPayload, taskId: string): Promise<string> {
  const jobId = uuidv4();
  await query(
    `INSERT INTO arrow_jobs (id, task_id, status, payload, result, created_at, updated_at)
     VALUES ($1, $2, 'pending', $3, NULL, NOW(), NOW())`,
    [jobId, taskId, JSON.stringify(payload)]
  );
  logger.info('ARROW: job enqueued', { jobId, taskId });
  return jobId;
}

export async function getJobStatus(jobId: string): Promise<{ jobId: string; status: ArrowJobStatus; result: string | null } | null> {
  const row = await queryOne<{ id: string; status: ArrowJobStatus; result: string | null }>(
    `SELECT id, status, result FROM arrow_jobs WHERE id = $1`,
    [jobId]
  );
  if (!row) return null;
  return { jobId: row.id, status: row.status, result: row.result };
}

export async function fetchPendingJobs(limit = 10): Promise<ArrowJobRow[]> {
  return query<ArrowJobRow>(
    `SELECT * FROM arrow_jobs WHERE status = 'pending' ORDER BY created_at ASC LIMIT $1 FOR UPDATE SKIP LOCKED`,
    [limit]
  );
}

export async function markJobRunning(jobId: string): Promise<void> {
  await query(
    `UPDATE arrow_jobs SET status = 'running', updated_at = NOW() WHERE id = $1`,
    [jobId]
  );
}

export async function markJobComplete(jobId: string, result: string): Promise<void> {
  await query(
    `UPDATE arrow_jobs SET status = 'complete', result = $1, updated_at = NOW() WHERE id = $2`,
    [result, jobId]
  );
}

export async function markJobFailed(jobId: string, error: string): Promise<void> {
  await query(
    `UPDATE arrow_jobs SET status = 'failed', result = $1, updated_at = NOW() WHERE id = $2`,
    [error, jobId]
  );
}
