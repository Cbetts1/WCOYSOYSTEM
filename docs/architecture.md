# VAGA/AIOS Architecture

## Overview

VAGA is a self-hosted AI organism framework. It runs as a monorepo with multiple services, all orchestrated via Docker Compose on a single Linux VPS.

```
┌─────────────────────────────────────────────────────────────────┐
│                          VAGA Organism                          │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ frontend-user│    │frontend-admin│    │   backend-api    │  │
│  │  Next.js     │    │  Next.js     │    │   Express/TS     │  │
│  │  :3000       │    │  :3001       │    │   :4000          │  │
│  └──────┬───────┘    └──────┬───────┘    └────────┬─────────┘  │
│         │                   │                     │            │
│         └───────────────────┴─────────────────────┘            │
│                                                ↓                │
│         ┌─────────────────────────────────────────────────┐    │
│         │              Core Packages                      │    │
│         │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │    │
│         │  │  AURA   │  │  AIOS   │  │      AIM        │ │    │
│         │  │ Planner │→ │ Orchest │  │ Node/Routing    │ │    │
│         │  └─────────┘  └─────────┘  └─────────────────┘ │    │
│         │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │    │
│         │  │  ARROW  │  │  OSAI   │  │  ASTRA + NOVA   │ │    │
│         │  │ Job Mgr │  │ Roaming │  │ Knowledge+Auto  │ │    │
│         │  └─────────┘  └─────────┘  └─────────────────┘ │    │
│         └─────────────────────────────────────────────────┘    │
│                                ↓                               │
│         ┌──────────────┐   ┌──────────────┐                    │
│         │ worker-arrow │   │   PostgreSQL  │                    │
│         │ Job Poller   │←→ │   :5432       │                    │
│         └──────────────┘   └──────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### `packages/shared-types`
All shared TypeScript interfaces across the system. Key types:

- **`AURAObject`** — base interface for all AURA typed objects (`id`, `type`, `createdAt`)
- **`AURAIntent`** — a typed user intent (raw text + userId + optional dockId/vmId)
- **`AURAPlan`** — a heuristically-generated plan with `PlannedStep[]`
- **`PlannedTask`** — the `{ plan, intent }` pair passed from AURA → AIOS
- **`AURAResult`** — typed result object from execution
- Database row shapes: `User`, `Dock`, `VM`, `Task`, `ArrowJob`
- AIM shapes: `NodeDescriptor`, `RouteResult`

### `packages/core-aura`
The reasoning core. **"Use AURA type o"** directive means all planning and results flow through strongly-typed AURA objects:

- `AURAService.planIntent(raw, userId, dockId?, vmId?)` → `PlannedTask`
  - Selects a plan template via keyword matching
  - Returns a fully typed `AURAPlan` with `PlannedStep[]`
- `AURAService.summarizeResult(result)` → `string`
- `AURAService.buildResult(planId, rawResult, success)` → `AURAResult`
- No external LLM APIs — pure rule-based heuristics

### `packages/core-aios`
The Intelligence OS orchestration layer:

- `AIOSService.executeTask(plannedTask, userId)` — persists task, optionally spawns Arrow job
- `AIOSService.spawnArrowJob(payload, taskId)` — enqueues job in `arrow_jobs` table
- Dock/VM CRUD: `createDock`, `createVM`, `startVM`, `stopVM`

### `packages/core-aim`
The AIM web-twin routing layer:

- In-process node registry: `registerNode(descriptor)`, `routeMessage(nodeId, payload)`
- `bootstrapLocalNodes()` — seeds the 4 internal nodes (api, worker, user-frontend, admin-frontend)
- Designed to be extended to real network federation

### `packages/core-arrow`
The ARROW job model and queue interface:

- `enqueueJob`, `fetchPendingJobs`, `markJobRunning`, `markJobComplete`, `markJobFailed`
- Backed by the `arrow_jobs` PostgreSQL table with `FOR UPDATE SKIP LOCKED` for safe concurrent workers

### `packages/core-osai`
The OSAI roaming body abstraction:

- Interface: `RoamingRuntime { syncState, executeRemoteTask }`
- `LocalRoamingRuntime` — logs and simulates remote execution

### `packages/core-modules`
Extension modules:

- **ASTRA** (knowledge module): `knowledge-lookup`, `suggest-actions`
- **NOVA** (automation module): `run-workflow`, `echo`

### `apps/backend-api`
Express REST API:

| Endpoint | Description |
|----------|-------------|
| `POST /auth/register` | Register user |
| `POST /auth/login` | Login, returns JWT |
| `GET /auth/me` | Current user |
| `POST /docks` | Create dock |
| `GET /docks` | List user docks |
| `POST /docks/:id/vms` | Create VM in dock |
| `GET /docks/:id/vms` | List VMs |
| `POST /vms/:id/start` | Start VM |
| `POST /vms/:id/stop` | Stop VM |
| `POST /tasks` | Submit intent → AURA → AIOS |
| `GET /tasks` | List tasks |
| `GET /tasks/:id` | Get task |
| `GET /admin/system/health` | System health |
| `GET /admin/system/nodes` | AIM node list |
| `GET /admin/users` | All users |
| `GET /admin/docks` | All docks |
| `GET /admin/vms` | All VMs |
| `GET /admin/tasks` | All tasks |
| `GET /admin/arrow-jobs` | All Arrow jobs |

### `apps/worker-arrow`
Node.js process that polls `arrow_jobs` every 2 seconds:

1. Fetches up to 5 pending jobs (`FOR UPDATE SKIP LOCKED`)
2. Marks each job `running`
3. Routes to OSAI (for analysis), NOVA (automation), or ASTRA (knowledge) based on action
4. Marks job `complete` with result JSON
5. Updates parent `tasks.status = 'complete'`

### `apps/frontend-user`
Next.js 14 + Tailwind user portal:

- `/auth/login` — login/register
- `/dashboard` — navigation hub
- `/docks` — manage docks and VMs
- `/tasks` — submit intents, view task history + results

### `apps/frontend-admin`
Next.js 14 + Tailwind admin portal:

- `/admin/login` — admin login
- `/admin/overview` — system health + AIM nodes
- `/admin/users`, `/admin/docks`, `/admin/vms`, `/admin/tasks`, `/admin/arrow-jobs`

## Database Schema

```sql
users (id, email, password_hash, role, created_at)
docks (id, user_id, name, created_at)
vms   (id, dock_id, name, type, status, created_at)
tasks (id, user_id, dock_id, vm_id, status, intent, plan_json, result, created_at, updated_at)
arrow_jobs (id, task_id, status, payload, result, created_at, updated_at)
```

## Demo Flow

1. User registers at `http://localhost:3000/auth/login`
2. User creates a Dock at `/docks`
3. User creates a VM inside that dock
4. User submits intent: *"Analyze my dock and suggest next actions"*
5. `POST /tasks` → `aura.planIntent()` returns typed `AURAPlan` (requiresArrow=true)
6. AIOS creates a `tasks` row (status=running) and spawns `arrow_jobs` row (status=pending)
7. `worker-arrow` polls, picks up job, runs OSAI + ASTRA analysis
8. Worker updates `arrow_jobs.status=complete`, `tasks.status=complete`, `tasks.result=<summary>`
9. UI polling detects completion, shows result in task card
