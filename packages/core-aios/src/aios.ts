import type {
  PlannedTask,
  ArrowJobPayload,
  TaskStatus,
  ArrowJobStatus,
} from '@vaga/shared-types';
import { query, queryOne, uuidv4, logger } from '@vaga/shared-utils';

export interface TaskResult {
  taskId: string;
  status: TaskStatus;
  result: string;
  jobId?: string;
}

export class AIOSService {
  /**
   * Receive a PlannedTask from AURA, persist it, optionally spawn an Arrow job.
   */
  async executeTask(plannedTask: PlannedTask, userId: string): Promise<TaskResult> {
    const { plan, intent } = plannedTask;
    const taskId = uuidv4();

    await query(
      `INSERT INTO tasks (id, user_id, dock_id, vm_id, status, intent, plan_json, result, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'running', $5, $6, NULL, NOW(), NOW())`,
      [taskId, userId, intent.dockId ?? null, intent.vmId ?? null, intent.raw, JSON.stringify(plan)]
    );

    logger.info('AIOS: task created', { taskId, requiresArrow: plan.requiresArrow });

    if (plan.requiresArrow) {
      const jobId = await this.spawnArrowJob({
        action: plan.steps[0]?.action ?? 'process',
        planId: plan.id,
        stepIds: plan.steps.map((s) => s.stepId),
        context: { taskId, intentRaw: intent.raw },
      }, taskId);
      return { taskId, status: 'running', result: 'Arrow job dispatched', jobId };
    }

    // Synchronous short-circuit path (no Arrow needed)
    const resultText = `AIOS processed synchronously: ${plan.summary}`;
    await query(
      `UPDATE tasks SET status = 'complete', result = $1, updated_at = NOW() WHERE id = $2`,
      [resultText, taskId]
    );
    return { taskId, status: 'complete', result: resultText };
  }

  /**
   * Enqueue an ARROW job in the arrow_jobs table.
   */
  async spawnArrowJob(payload: ArrowJobPayload, taskId: string): Promise<string> {
    const jobId = uuidv4();
    await query(
      `INSERT INTO arrow_jobs (id, task_id, status, payload, result, created_at, updated_at)
       VALUES ($1, $2, 'pending', $3, NULL, NOW(), NOW())`,
      [jobId, taskId, JSON.stringify(payload)]
    );
    logger.info('AIOS: arrow job spawned', { jobId, taskId });
    return jobId;
  }

  async createDock(userId: string, name: string): Promise<string> {
    const dockId = uuidv4();
    await query(
      `INSERT INTO docks (id, user_id, name, created_at) VALUES ($1, $2, $3, NOW())`,
      [dockId, userId, name]
    );
    logger.info('AIOS: dock created', { dockId, userId });
    return dockId;
  }

  async createVM(dockId: string, name: string, type: string): Promise<string> {
    const vmId = uuidv4();
    await query(
      `INSERT INTO vms (id, dock_id, name, type, status, created_at) VALUES ($1, $2, $3, $4, 'stopped', NOW())`,
      [vmId, dockId, name, type]
    );
    logger.info('AIOS: vm created', { vmId, dockId, type });
    return vmId;
  }

  async startVM(vmId: string): Promise<void> {
    await query(`UPDATE vms SET status = 'running' WHERE id = $1`, [vmId]);
    logger.info('AIOS: vm started', { vmId });
  }

  async stopVM(vmId: string): Promise<void> {
    await query(`UPDATE vms SET status = 'stopped' WHERE id = $1`, [vmId]);
    logger.info('AIOS: vm stopped', { vmId });
  }

  async getJobStatus(jobId: string): Promise<ArrowJobStatus | null> {
    const row = await queryOne<{ status: ArrowJobStatus }>(
      `SELECT status FROM arrow_jobs WHERE id = $1`,
      [jobId]
    );
    return row?.status ?? null;
  }
}

export const aios = new AIOSService();
