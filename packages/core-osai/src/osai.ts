import { logger } from '@vaga/shared-utils';

export interface RoamingRuntime {
  syncState(state: Record<string, unknown>): Promise<void>;
  executeRemoteTask(task: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export class LocalRoamingRuntime implements RoamingRuntime {
  async syncState(state: Record<string, unknown>): Promise<void> {
    logger.info('OSAI [local]: syncState called', state);
  }

  async executeRemoteTask(
    task: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    logger.info('OSAI [local]: executeRemoteTask called', task);
    await new Promise((r) => setTimeout(r, 200));
    return { simulated: true, echoed: task };
  }
}

export const localRuntime: RoamingRuntime = new LocalRoamingRuntime();
