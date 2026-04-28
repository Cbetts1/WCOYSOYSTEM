import type {
  AURAIntent,
  AURAPlan,
  AURAObject,
  AURAObjectType,
  AURAResult,
  PlannedStep,
  PlannedTask,
} from '@vaga/shared-types';
import { uuidv4 } from '@vaga/shared-utils';

// ─── AURAObjectFactory ────────────────────────────────────────────────────────

function makeBase<T extends AURAObjectType>(type: T): Pick<AURAObject, 'id' | 'type' | 'createdAt'> & { type: T } {
  return {
    id: uuidv4(),
    type,
    createdAt: new Date().toISOString(),
  };
}

// ─── Intent builder ───────────────────────────────────────────────────────────

export function buildIntent(
  raw: string,
  userId: string,
  dockId?: string,
  vmId?: string
): AURAIntent {
  return {
    ...makeBase('intent'),
    raw,
    userId,
    dockId,
    vmId,
  };
}

// ─── Heuristic planner ────────────────────────────────────────────────────────

interface PlanTemplate {
  keywords: string[];
  summary: string;
  steps: Array<{
    action: string;
    description: string;
    targetModule: string;
    params: Record<string, unknown>;
  }>;
  requiresArrow: boolean;
  estimatedDurationMs: number;
}

const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    keywords: ['analyze', 'analysis', 'inspect', 'examine', 'suggest'],
    summary: 'Analyze dock/VM state and suggest next actions',
    steps: [
      {
        action: 'collect-dock-state',
        description: 'Gather current dock and VM inventory',
        targetModule: 'aios',
        params: { scope: 'dock' },
      },
      {
        action: 'run-analysis',
        description: 'Run analysis routine via ARROW worker',
        targetModule: 'arrow',
        params: { routine: 'dock-analysis' },
      },
      {
        action: 'generate-suggestions',
        description: 'Produce actionable suggestions from analysis output',
        targetModule: 'astra',
        params: { capability: 'suggest-actions' },
      },
    ],
    requiresArrow: true,
    estimatedDurationMs: 3000,
  },
  {
    keywords: ['automate', 'automation', 'run', 'execute', 'script'],
    summary: 'Execute an automation workflow via NOVA',
    steps: [
      {
        action: 'validate-automation',
        description: 'Validate the requested automation parameters',
        targetModule: 'aios',
        params: { scope: 'automation' },
      },
      {
        action: 'run-automation',
        description: 'Execute automation via NOVA module',
        targetModule: 'nova',
        params: { capability: 'run-workflow' },
      },
    ],
    requiresArrow: true,
    estimatedDurationMs: 5000,
  },
  {
    keywords: ['knowledge', 'know', 'search', 'find', 'lookup', 'info'],
    summary: 'Look up knowledge base for relevant information',
    steps: [
      {
        action: 'query-knowledge',
        description: 'Query ASTRA knowledge module',
        targetModule: 'astra',
        params: { capability: 'knowledge-lookup' },
      },
    ],
    requiresArrow: false,
    estimatedDurationMs: 500,
  },
  {
    keywords: ['create', 'start', 'launch', 'spawn', 'vm', 'dock'],
    summary: 'Create and initialise a new VM or Dock resource',
    steps: [
      {
        action: 'create-resource',
        description: 'Provision the requested resource via AIOS',
        targetModule: 'aios',
        params: { scope: 'provision' },
      },
    ],
    requiresArrow: false,
    estimatedDurationMs: 1000,
  },
];

const DEFAULT_TEMPLATE: PlanTemplate = {
  keywords: [],
  summary: 'Process general intent and determine best course of action',
  steps: [
    {
      action: 'process-intent',
      description: 'Route general intent through AIOS orchestration',
      targetModule: 'aios',
      params: { scope: 'general' },
    },
    {
      action: 'dispatch-arrow',
      description: 'Dispatch an ARROW job to handle the task remotely',
      targetModule: 'arrow',
      params: { routine: 'general-task' },
    },
  ],
  requiresArrow: true,
  estimatedDurationMs: 2000,
};

function selectTemplate(raw: string): PlanTemplate {
  const lower = raw.toLowerCase();
  for (const tpl of PLAN_TEMPLATES) {
    if (tpl.keywords.some((kw) => lower.includes(kw))) {
      return tpl;
    }
  }
  return DEFAULT_TEMPLATE;
}

function buildSteps(
  tpl: PlanTemplate,
  intentId: string
): readonly PlannedStep[] {
  return tpl.steps.map((s, i): PlannedStep => ({
    stepId: uuidv4(),
    order: i + 1,
    action: s.action,
    description: s.description,
    targetModule: s.targetModule,
    params: { ...s.params, intentId },
  }));
}

// ─── AURA Service ─────────────────────────────────────────────────────────────

export class AURAService {
  /**
   * Receive a raw user intent and produce a strongly-typed AURAPlan.
   * Returns a PlannedTask (intent + plan) for consumption by AIOS.
   */
  planIntent(
    raw: string,
    userId: string,
    dockId?: string,
    vmId?: string
  ): PlannedTask {
    const intent: AURAIntent = buildIntent(raw, userId, dockId, vmId);
    const tpl = selectTemplate(raw);

    const plan: AURAPlan = {
      ...makeBase('plan'),
      intentId: intent.id,
      summary: tpl.summary,
      steps: buildSteps(tpl, intent.id),
      requiresArrow: tpl.requiresArrow,
      estimatedDurationMs: tpl.estimatedDurationMs,
    };

    return { plan, intent };
  }

  /**
   * Produce a human-readable summary string from a task result payload.
   */
  summarizeResult(result: Record<string, unknown>): string {
    if (typeof result['summary'] === 'string') return result['summary'];
    if (typeof result['message'] === 'string') return result['message'];
    if (typeof result['output'] === 'string') return result['output'];
    return JSON.stringify(result);
  }

  /**
   * Build a typed AURAResult from raw execution output.
   */
  buildResult(
    planId: string,
    rawResult: Record<string, unknown>,
    success: boolean
  ): AURAResult {
    return {
      ...makeBase('result'),
      planId,
      summary: this.summarizeResult(rawResult),
      details: rawResult,
      success,
    };
  }
}

export const aura = new AURAService();
