import { logger } from '@vaga/shared-utils';

export interface ModuleCapability {
  id: string;
  name: string;
  description: string;
}

export interface VagaModule {
  getCapabilities(): ModuleCapability[];
  executeCapability(
    capabilityId: string,
    params: Record<string, unknown>
  ): Promise<Record<string, unknown>>;
}

// ─── ASTRA: Knowledge module ──────────────────────────────────────────────────

const KNOWLEDGE_BASE: Record<string, string> = {
  'what is aura':
    'AURA is the reasoning core of the VAGA organism. It plans user intents into typed steps.',
  'what is aios':
    'AIOS is the Intelligence OS: it orchestrates tasks, modules, and the VM factory.',
  'what is arrow':
    'ARROW is a mobile agent that executes jobs asynchronously via the arrow_jobs queue.',
  'what is aim':
    'AIM is the web-twin protocol/routing layer that manages node identity and message routing.',
  'what is osai':
    'OSAI is the roaming body abstraction for off-VPS operation.',
  'what is astra': 'ASTRA is the knowledge module — it answers questions from a curated KB.',
  'what is nova': 'NOVA is the automation module — it executes workflows and scripts.',
};

export class AstraModule implements VagaModule {
  getCapabilities(): ModuleCapability[] {
    return [
      {
        id: 'knowledge-lookup',
        name: 'Knowledge Lookup',
        description: 'Answer questions from the VAGA knowledge base',
      },
      {
        id: 'suggest-actions',
        name: 'Suggest Actions',
        description: 'Suggest next actions for a given dock/VM state',
      },
    ];
  }

  async executeCapability(
    capabilityId: string,
    params: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    logger.info('ASTRA: executeCapability', { capabilityId, params });

    if (capabilityId === 'knowledge-lookup') {
      const query = String(params['query'] ?? '').toLowerCase();
      for (const [key, answer] of Object.entries(KNOWLEDGE_BASE)) {
        if (query.includes(key) || key.includes(query)) {
          return { found: true, answer };
        }
      }
      return { found: false, answer: 'No matching entry found in knowledge base.' };
    }

    if (capabilityId === 'suggest-actions') {
      const suggestions = [
        'Review running VMs for idle resources',
        'Submit a new intent to analyse dock health',
        'Check Arrow job queue for failed jobs',
        'Extend NOVA automation with a new workflow',
      ];
      return { suggestions };
    }

    return { error: `Unknown capability: ${capabilityId}` };
  }
}

// ─── NOVA: Automation module ──────────────────────────────────────────────────

export class NovaModule implements VagaModule {
  getCapabilities(): ModuleCapability[] {
    return [
      {
        id: 'run-workflow',
        name: 'Run Workflow',
        description: 'Execute a named automation workflow',
      },
      {
        id: 'echo',
        name: 'Echo',
        description: 'Echo back the params (useful for testing)',
      },
    ];
  }

  async executeCapability(
    capabilityId: string,
    params: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    logger.info('NOVA: executeCapability', { capabilityId, params });

    if (capabilityId === 'run-workflow') {
      await new Promise((r) => setTimeout(r, 500));
      return {
        workflow: params['workflow'] ?? 'default',
        status: 'complete',
        output: `Workflow "${params['workflow'] ?? 'default'}" executed successfully.`,
      };
    }

    if (capabilityId === 'echo') {
      return { echoed: params };
    }

    return { error: `Unknown capability: ${capabilityId}` };
  }
}

export const astra = new AstraModule();
export const nova = new NovaModule();
