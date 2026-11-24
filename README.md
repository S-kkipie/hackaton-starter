# hackaton-starter

Opinionated Next 16 starter: **Elysia API + Better Auth + Drizzle/Postgres +
Eden/TanStack Query**, with a Result-pattern response envelope and one
`Project` CRUD domain to clone. No Firebase — Postgres only.

## Stack

Next 16 · React 19 · Elysia (`/api/v1`) · Better Auth (email+password) ·
Drizzle ORM + node-postgres · Eden + `eden-tanstack-react-query` · zod ·
shadcn/ui + Tailwind v4 · LogTape · Vitest · Biome.

## Quick start

Scaffold a new project with the CLI (see [`cli/create-shipkit`](./cli/create-shipkit)):

```bash
npx create-shipkit my-app
```

Or clone this repo directly and follow **Setup** below.

## Setup

```bash
pnpm install
cp .env.example .env      # fill DATABASE_URL, BETTER_AUTH_SECRET, NEXT_PUBLIC_APP_URL
pnpm db:migrate           # apply migrations to your Postgres
pnpm dev                  # http://localhost:3000
```

`BETTER_AUTH_SECRET`: `openssl rand -base64 32`. `DATABASE_URL`: any Postgres
(Supabase, Neon, local). Env is validated at boot by `src/config/env.ts`.

## Architecture

Domains live under `src/core/<domain>/`:

| Layer | Holds |
|-------|-------|
| `domain/` | zod `schemas.ts` + inferred `types.ts` (single type source) |
| `server/repository/` | Drizzle access (`import "server-only"` + shared `db`) |
| `server/services/` | orchestration, returns `AsyncAppResult<T>`, enforces ownership |
| `server/api/` | Elysia leaf `*.route.ts` + a domain `router.ts` (prefix) |
| `client/` | Eden/TanStack-Query hooks + shadcn UI |

Wire rules: every response is the `CommonResponse` envelope
(`{ response?, code, status }`); expected 4xx are `err(AppErrors.x)` values, not
throws; authed routes carry both `.use(authed)` and `authed: true`.

### Errors

- **Envelope:** an error answers `{ code, status, targets? }` with that HTTP
  status. The codes and their statuses live in one catalog,
  `src/core/common/api-errors.ts`, shared by server and client; `AppError` is
  derived from it.
- **Routes** return `respond(result, 200 | 201)` and declare
  `response: { 200: successResponseSchema(...), ...errorResponses }`.
- **Router-level:** an unknown `/api/v1` route is `404 NOT_FOUND`; a zod/Elysia
  validation error or unparseable JSON is `400 INVALID_BODY` with the field
  paths in `targets`; anything else is logged and answers
  `500 INTERNAL_SERVER_ERROR`. Better Auth only owns `/api/v1/auth/*`.
- **Client:** `toApiError` / `apiErrorMessage` (`src/frontend/lib/api-error.ts`)
  turn any thrown value into a catalog code and its message. The QueryClient's
  `MutationCache` toasts every failed mutation once, so hooks and modals do not
  write their own `onError` toasts; opt out with `meta: { silent: true }` (or a
  list of codes), or add a toast button with `meta.actions`.

### Add a new domain

Clone `src/core/project/` → `src/core/<domain>/`, add a
`schemas/<domain>-schema.ts` Drizzle table (export from `schemas/index.ts`),
then wire the domain router into `src/server/router.ts` with `.use(<domain>Router)`.
**A router isn't live until it's `.use()`d in `server/router.ts`.**
Regenerate + apply migrations: `pnpm db:generate && pnpm db:migrate`.

## Scripts

`pnpm dev | build | start` · `pnpm test` · `pnpm check` (Biome) ·
`pnpm typecheck` · `pnpm db:generate | db:migrate | db:studio`.

CI (`.github/workflows/ci.yml`) runs install, `check`, `typecheck`, `test` and
`build` on every PR and push to `main`, with `SKIP_ENV_VALIDATION=1` (the env
schema is skipped only when that variable is `1`; the running app validates).

## Known notes

- OpenAPI (Scalar) is dev-only at `/api/v1/openapi`.
- In the browser the API client calls `window.location.origin`, so preview
  deployments and LAN access stay same-origin; server-side it uses
  `NEXT_PUBLIC_APP_URL`.
- `eden-tanstack-react-query` is at `^0.2.0`; if a proxy typing breaks after an
  upgrade, pin it.
- Better Auth UI components were installed via `pnpm dlx shadcn@latest add https://better-auth-ui.com/r/auth.json`
  and are vendored (editable) under `src/frontend/components/auth/`.
- `db.ts` uses `ssl: { rejectUnauthorized: false }` for convenience with hosted Postgres
  (Supabase, Neon); review this for production deployments.
