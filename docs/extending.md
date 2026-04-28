# Extending VAGA/AIOS

## Adding a New AURA Plan Template

AURA uses keyword-based heuristics to select a plan template. To add a new one:

**File:** `packages/core-aura/src/aura.ts`

```typescript
// Add to PLAN_TEMPLATES array:
{
  keywords: ['monitor', 'watch', 'alert'],
  summary: 'Set up monitoring and alerting for a resource',
  steps: [
    {
      action: 'configure-monitoring',
      description: 'Configure monitoring for the target resource',
      targetModule: 'aios',
      params: { scope: 'monitoring' },
    },
    {
      action: 'run-monitor-setup',
      description: 'Deploy monitoring configuration via ARROW',
      targetModule: 'arrow',
      params: { routine: 'monitor-setup' },
    },
  ],
  requiresArrow: true,
  estimatedDurationMs: 2000,
},
```

---

## Adding a New ASTRA Knowledge Entry

**File:** `packages/core-modules/src/modules.ts`

```typescript
const KNOWLEDGE_BASE: Record<string, string> = {
  // ... existing entries ...
  'what is my new concept': 'Your new concept explained here.',
};
```

---

## Adding a New NOVA Workflow

```typescript
// In NovaModule.executeCapability:
if (capabilityId === 'your-new-workflow') {
  await new Promise((r) => setTimeout(r, 500));
  return { workflow: 'your-new-workflow', status: 'complete', output: 'Done!' };
}
```

Register the capability:
```typescript
getCapabilities(): ModuleCapability[] {
  return [
    // ... existing ...
    {
      id: 'your-new-workflow',
      name: 'Your New Workflow',
      description: 'What this workflow does',
    },
  ];
}
```

---

## Adding a New API Endpoint

**File:** `apps/backend-api/src/routes/` — create a new router file:

```typescript
// apps/backend-api/src/routes/widgets.ts
import { Router } from 'express';
import { query } from '@vaga/shared-utils';

export const widgetsRouter = Router();

widgetsRouter.get('/', async (req, res) => {
  const userId = req.user!.userId;
  const widgets = await query('SELECT * FROM widgets WHERE user_id = $1', [userId]);
  res.json({ success: true, data: widgets });
});
```

Mount it in `apps/backend-api/src/index.ts`:
```typescript
import { widgetsRouter } from './routes/widgets';
app.use('/widgets', requireAuth, widgetsRouter);
```

---

## Adding a New DB Table

**File:** `infra/scripts/migrate.js`

Add a new SQL block to the `migrations` array:
```javascript
const migrations = [
  // existing migration...
  `
  CREATE TABLE IF NOT EXISTS widgets (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name      TEXT NOT NULL,
    data      JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_widgets_user ON widgets(user_id);
  `,
];
```

Re-run migrations:
```bash
docker compose -f infra/docker-compose.yml run --rm migrate
# or locally:
DATABASE_URL=... node infra/scripts/migrate.js
```

Add the TypeScript type to `packages/shared-types/src/index.ts`:
```typescript
export interface Widget {
  id: string;
  userId: string;
  name: string;
  data: Record<string, unknown> | null;
  createdAt: Date;
}
```

---

## Adding an OSAI Remote Runtime

Implement the `RoamingRuntime` interface:

```typescript
// packages/core-osai/src/my-remote.ts
import { RoamingRuntime } from './osai';

export class MyRemoteRuntime implements RoamingRuntime {
  async syncState(state: Record<string, unknown>): Promise<void> {
    // Send state to remote endpoint
    await fetch('https://my-remote-vps.example.com/sync', {
      method: 'POST',
      body: JSON.stringify(state),
    });
  }

  async executeRemoteTask(task: Record<string, unknown>): Promise<Record<string, unknown>> {
    const res = await fetch('https://my-remote-vps.example.com/execute', {
      method: 'POST',
      body: JSON.stringify(task),
    });
    return res.json();
  }
}
```

---

## Adding a New AIM Node

Register external nodes at startup:

```typescript
import { registerNode } from '@vaga/core-aim';

registerNode({
  nodeId: 'node-external-1',
  name: 'External Processing Node',
  type: 'external',
  endpoint: 'https://my-node.example.com',
  capabilities: ['gpu-compute', 'large-model'],
});
```

---

## Extending the Arrow Worker

To handle a new action type, add a branch in:

**File:** `apps/worker-arrow/src/index.ts`

```typescript
} else if (action === 'my-new-action') {
  const result = await nova.executeCapability('your-capability', context);
  resultData = { ...result };
```

---

## Adding a Real LLM

Since AURA is rule-based, you can extend it with a real LLM without changing the typed interface:

```typescript
// packages/core-aura/src/llm-planner.ts
import { AURAService } from './aura';

export class LLMAURAService extends AURAService {
  override planIntent(raw: string, userId: string, dockId?: string, vmId?: string) {
    // Call your local LLM (e.g. Ollama) here
    // Return a PlannedTask with the same shape
    const basePlan = super.planIntent(raw, userId, dockId, vmId);
    // Augment or replace with LLM output...
    return basePlan;
  }
}
```

Use Ollama (free, local LLM server) — add to `infra/docker-compose.yml`:
```yaml
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
```
