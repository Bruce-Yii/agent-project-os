# WP1-C / WP1-A Package.json Conflict Resolution

## Problem
WP1-C root `package.json` contains only Fastify/Vite/React deps.
WP1-A root `package.json` contains TypeScript/Drizzle/pg deps.
Both claim the root `package.json` — merging them naively would overwrite one.

## Resolution Plan (W0 integrator)

### Step 1: Preserve WP1-A as primary
WP1-A's `package.json` is the authoritative root package because it contains:
- TypeScript compiler (tsc)
- Drizzle ORM + pg
- Test scripts (test, test:db)
- Domain code in src/

### Step 2: Add Web deps to WP1-A package.json
Merge WP1-C's web dependencies into WP1-A's package.json:
- `fastify` (already needed for API)
- `vite`, `react`, `react-dom` (web UI)
- `@vitejs/plugin-react` (Vite React plugin)

### Step 3: Move Web source to apps/web/
- WP1-C's `src/App.jsx`, `src/main.jsx`, `src/api.js` → `apps/web/src/`
- WP1-C's `src/server.mjs` → `src/http/server.mjs` (or keep as Fastify route in src/http/)
- Vite config → `apps/web/vite.config.js`

### Step 4: Unified scripts

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "build": "tsc && npm run build:web",
    "build:web": "cd apps/web && vite build",
    "test": "npm run build && node --test ...",
    "test:db": "npm run build && node --test ...",
    "dev:api": "node src/http/server.mjs",
    "dev:web": "cd apps/web && vite"
  }
}
```

### Step 5: Real DB integration
- WP1-C's server.mjs imports WP1-A's CommandExecutor and repositories
- POST /v1/commands calls CommandExecutor.execute() with real DB
- POST /v1/projects calls ProjectRepository.save() via CommandExecutor
- Mock endpoints clearly labeled with mode: "mock-in-memory"

### What NOT to do
- Do NOT overwrite WP1-A's package.json with WP1-C's
- Do NOT create a second Domain Model
- Do NOT duplicate WP1-A's src/ in WP1-C
- Do NOT claim Mock as real integration
