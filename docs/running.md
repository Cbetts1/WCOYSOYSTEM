# Running VAGA/AIOS

## Prerequisites

- Linux VPS (12 vCPU, 64GB RAM recommended)
- Docker ≥ 24.x and Docker Compose ≥ 2.x
- OR: Node.js 20 LTS for local dev

---

## Quick Start (Docker Compose — Recommended)

### 1. Clone and configure

```bash
git clone https://github.com/Cbetts1/WCOYSOYSTEM.git
cd WCOYSOYSTEM

# Copy and edit your environment file
cp .env.example .env
nano .env   # set JWT_SECRET to a long random string
```

**Critical `.env` values to change:**
```
JWT_SECRET=your_random_64_char_secret_here
POSTGRES_PASSWORD=your_secure_db_password
```

### 2. Start all services

```bash
# From repo root:
cd infra
docker compose up -d

# Or from repo root:
docker compose -f infra/docker-compose.yml up -d
```

This will:
1. Start PostgreSQL
2. Run `migrate` (create all tables)
3. Run `seed` (create admin + demo users)
4. Start `backend-api` on port 4000
5. Start `worker-arrow` (polls every 2s)
6. Start `frontend-user` on port 3000
7. Start `frontend-admin` on port 3001

### 3. Access the services

| Service | URL |
|---------|-----|
| User Portal | http://localhost:3000 |
| Admin Portal | http://localhost:3001 |
| Backend API | http://localhost:4000 |

### 4. Default credentials (from seed)

| Account | Email | Password |
|---------|-------|----------|
| Admin | `admin@vaga.local` | `Admin1234!` |
| Demo User | `demo@vaga.local` | `Demo1234!` |

---

## Local Development (without Docker)

### 1. Install dependencies

```bash
# Node.js 20 required
node --version   # should be v20.x

# Install all workspace dependencies
npm install
```

### 2. Setup PostgreSQL locally

```bash
# Install PostgreSQL 16 (Ubuntu example)
sudo apt install postgresql-16

# Create database and user
sudo -u postgres psql -c "CREATE USER vaga WITH PASSWORD 'vagapassword';"
sudo -u postgres psql -c "CREATE DATABASE vagadb OWNER vaga;"
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env: set DATABASE_URL=postgresql://vaga:vagapassword@localhost:5432/vagadb
```

### 4. Run migrations and seed

```bash
DATABASE_URL=postgresql://vaga:vagapassword@localhost:5432/vagadb node infra/scripts/migrate.js
DATABASE_URL=postgresql://vaga:vagapassword@localhost:5432/vagadb node infra/scripts/seed.js
```

### 5. Start services (4 terminals)

```bash
# Terminal 1: Backend API
cd apps/backend-api
npm run dev

# Terminal 2: Arrow Worker
cd apps/worker-arrow
npm run dev

# Terminal 3: User Frontend
cd apps/frontend-user
npm run dev

# Terminal 4: Admin Frontend
cd apps/frontend-admin
npm run dev
```

---

## Production (VPS)

### Build all services

```bash
docker compose -f infra/docker-compose.yml build
```

### Start in detached mode

```bash
docker compose -f infra/docker-compose.yml up -d
```

### View logs

```bash
# All services
docker compose -f infra/docker-compose.yml logs -f

# Specific service
docker compose -f infra/docker-compose.yml logs -f backend-api
docker compose -f infra/docker-compose.yml logs -f worker-arrow
```

### Restart a service

```bash
docker compose -f infra/docker-compose.yml restart backend-api
```

### Stop all

```bash
docker compose -f infra/docker-compose.yml down
```

### Stop + remove volumes (full reset)

```bash
docker compose -f infra/docker-compose.yml down -v
```

---

## Re-running Migrations

If you update the schema:

```bash
# Via Docker
docker compose -f infra/docker-compose.yml run --rm migrate

# Locally
DATABASE_URL=... node infra/scripts/migrate.js
```

---

## Demo Flow (end-to-end test)

1. Open http://localhost:3000
2. Click "Register" → create `you@example.com` / `password123`
3. Go to **Docks** → Create Dock → Create VM (analysis-vm)
4. Go to **Tasks** → Submit intent: *"Analyze my dock and suggest next actions"*
5. Watch status change from `RUNNING` → `COMPLETE`
6. See result text appear in the task card
7. Open http://localhost:3001 → login as admin → check **Arrow Jobs**
