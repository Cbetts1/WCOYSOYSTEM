import 'dotenv/config';
import {
  fetchPendingJobs,
  markJobRunning,
  markJobComplete,
  markJobFailed,
} from '@vaga/core-arrow';
import { aura } from '@vaga/core-aura';
import { astra, nova } from '@vaga/core-modules';
import { localRuntime } from '@vaga/core-osai';
import { query, logger } from '@vaga/shared-utils';
import type { ArrowJobPayload } from '@vaga/shared-types';

const POLL_INTERVAL_MS = 2000;

async function processJob(job: {
  id: string;
  task_id: string;
  payload: ArrowJobPayload;
}): Promise<void> {
  logger.info('ARROW worker: processing job', { jobId: job.id, action: job.payload.action });
  await markJobRunning(job.id);

  try {
    let resultData: Record<string, unknown> = {};

    const action = job.payload.action ?? 'process-intent';
    const context = job.payload.context ?? {};

    if (action === 'collect-dock-state' || action === 'run-analysis' || action === 'dock-analysis' || action === 'general-task') {
      // Simulate analysis via OSAI local runtime
      const osaiResult = await localRuntime.executeRemoteTask({
        action,
        context,
      });
      // Use ASTRA for suggestions
      const suggestions = await astra.executeCapability('suggest-actions', context);
      resultData = {
        analysis: osaiResult,
        suggestions: suggestions['suggestions'],
        summary: `Dock analysis complete. Found ${(suggestions['suggestions'] as string[]).length} recommendations.`,
      };
    } else if (action === 'run-automation' || action === 'nova-workflow') {
      const novaResult = await nova.executeCapability('run-workflow', context);
      resultData = { ...novaResult };
    } else if (action === 'query-knowledge') {
      const astraResult = await astra.executeCapability('knowledge-lookup', context);
      resultData = { ...astraResult };
    } else {
      // Default: simulate work
      await new Promise((r) => setTimeout(r, 1000));
      resultData = { summary: `Arrow job "${action}" processed successfully.`, context };
    }

    // Build a typed AURA result summary
    const resultSummary = aura.summarizeResult(resultData);
    await markJobComplete(job.id, JSON.stringify({ ...resultData, summary: resultSummary }));

    // Update the parent task as complete
    await query(
      `UPDATE tasks SET status = 'complete', result = $1, updated_at = NOW() WHERE id = $2`,
      [resultSummary, job.task_id]
    );
    logger.info('ARROW worker: job complete', { jobId: job.id });
  } catch (err) {
    const errStr = String(err);
    logger.error('ARROW worker: job failed', { jobId: job.id, error: errStr });
    await markJobFailed(job.id, errStr);
    await query(
      `UPDATE tasks SET status = 'failed', result = $1, updated_at = NOW() WHERE id = $2`,
      [errStr, job.task_id]
    );
  }
}

async function pollLoop(): Promise<void> {
  const jobs = await fetchPendingJobs(5);
  for (const job of jobs) {
    await processJob(job as { id: string; task_id: string; payload: ArrowJobPayload });
  }
}

async function main(): Promise<void> {
  logger.info('ARROW worker starting...');
  setInterval(() => {
    pollLoop().catch((err) => logger.error('poll error', err));
  }, POLL_INTERVAL_MS);
  // Initial poll
  await pollLoop();
}

main().catch((err) => {
  logger.error('ARROW worker fatal error', err);
  process.exit(1);
});
