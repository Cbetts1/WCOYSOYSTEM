// ─── AURA Typed Object Model ──────────────────────────────────────────────────

export type AURAObjectType =
  | 'plan'
  | 'task'
  | 'result'
  | 'intent'
  | 'module-call';

export interface AURAObject {
  readonly id: string;
  readonly type: AURAObjectType;
  readonly createdAt: string; // ISO8601
}

export interface AURAIntent extends AURAObject {
  readonly type: 'intent';
  readonly raw: string;
  readonly userId: string;
  readonly dockId?: string;
  readonly vmId?: string;
}

export interface PlannedStep {
  readonly stepId: string;
  readonly order: number;
  readonly action: string;
  readonly description: string;
  readonly targetModule: string; // e.g. 'aios', 'astra', 'nova', 'arrow'
  readonly params: Record<string, unknown>;
}

export interface AURAPlan extends AURAObject {
  readonly type: 'plan';
  readonly intentId: string;
  readonly summary: string;
  readonly steps: readonly PlannedStep[];
  readonly requiresArrow: boolean;
  readonly estimatedDurationMs: number;
}

export interface PlannedTask {
  readonly plan: AURAPlan;
  readonly intent: AURAIntent;
}

export interface AURAResult extends AURAObject {
  readonly type: 'result';
  readonly planId: string;
  readonly summary: string;
  readonly details: Record<string, unknown>;
  readonly success: boolean;
}

// ─── Database Models ──────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

export interface Dock {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
}

export type VMType = 'analysis-vm' | 'automation-vm' | 'knowledge-vm';
export type VMStatus = 'stopped' | 'running' | 'error';

export interface VM {
  id: string;
  dockId: string;
  name: string;
  type: VMType;
  status: VMStatus;
  createdAt: Date;
}

export type TaskStatus = 'pending' | 'running' | 'complete' | 'failed';

export interface Task {
  id: string;
  userId: string;
  dockId: string | null;
  vmId: string | null;
  status: TaskStatus;
  intent: string;
  planJson: AURAPlan | null;
  result: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ArrowJobStatus = 'pending' | 'running' | 'complete' | 'failed';

export interface ArrowJob {
  id: string;
  taskId: string;
  status: ArrowJobStatus;
  payload: Record<string, unknown>;
  result: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── AIM ─────────────────────────────────────────────────────────────────────

export interface NodeDescriptor {
  nodeId: string;
  name: string;
  type: 'api' | 'worker' | 'frontend' | 'external';
  endpoint: string;
  capabilities: string[];
}

export interface RouteResult {
  success: boolean;
  nodeId: string;
  response?: unknown;
  error?: string;
}

// ─── ARROW ────────────────────────────────────────────────────────────────────

export interface ArrowJobPayload {
  action: string;
  planId: string;
  stepIds: string[];
  context: Record<string, unknown>;
}

export interface JobStatus {
  jobId: string;
  status: ArrowJobStatus;
  result: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── API Response shapes ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}
