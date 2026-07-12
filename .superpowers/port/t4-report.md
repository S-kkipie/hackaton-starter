# T4 report — paginated/filterable/sortable GET /projects

Reference: `/home/skkippie/work/myworkin/myworkin-client/apps/myworkin-b2c/src/core/courses/catalog/{domain/schemas.ts,server/api/routes/search-courses.route.ts,server/services,server/repository}`
(Firestore-backed reference — this repo's `projects` domain is Postgres/Drizzle, so the repository layer is new code shaped like the existing `find-project-by-id.ts`/`create-project.ts` rather than a straight port.)

## Files added

- `src/core/project/server/repository/find-projects-page.ts` — `findProjectsPage(userId, params)`.
- `src/core/project/server/services/search-projects-service.ts` — `searchProjectsService(userId, params)`.

## Files changed

- `src/core/project/domain/schemas.ts` — added `PROJECT_SORTABLE_COLUMNS`,
  `projectSortItemSchema`, `projectSearchSchema`, `paginatedProjectsSchema`.
- `src/core/project/domain/types.ts` — added `ProjectSort`, `ProjectSearch`,
  `PaginatedProjects` (all `z.infer`, no hand-written mirrors).
- `src/core/project/server/api/routes/list-projects.route.ts` — rewritten:
  `query: projectSearchSchema`, calls `searchProjectsService(user.id, query)`,
  response map now `{ 200: successResponseSchema(paginatedProjectsSchema, ...), 500: errorResponseSchema(500) }`.
  Export name (`listProjectsRoute`) and mount point unchanged, so
  `src/core/project/server/api/router.ts` needed no edit.
- `src/core/project/server/services/__tests__/project-services.test.ts` —
  removed `listProjectsService` tests/mocks, added `searchProjectsService`
  tests/mocks (see below). get/create/update/delete tests untouched.
- `src/core/project/client/ui/project-screen.tsx` — one-line compat fix:
  `listQuery.data?.response` → `listQuery.data?.response.items` (the route's
  response shape changed from `Project[]` to `PaginatedProjects`; this keeps
  the existing card-grid UI compiling/rendering as a flat list — no
  pagination/sort/filter controls wired yet, that's T5's job with the actual
  data-table).

## Files deleted

- `src/core/project/server/services/list-projects-service.ts`
- `src/core/project/server/repository/find-projects-by-user.ts`

Grepped the whole `src/` tree for both file paths and their exports after
deletion — no remaining references.

## WHERE / ORDER BY / pagination logic (`find-projects-page.ts`)

```ts
const where = and(
    eq(projects.userId, userId),
    status.length > 0 ? inArray(projects.status, status) : undefined,
    q
        ? or(
              ilike(projects.name, `%${q}%`),
              ilike(projects.description, `%${q}%`),
          )
        : undefined,
);

const orderBy = sort.length
    ? sort.map((item) => (item.desc ? desc : asc)(SORT_COLUMNS[item.id]))
    : [desc(projects.createdAt)];

const rows = await db
    .select()
    .from(projects)
    .where(where)
    .orderBy(...orderBy)
    .limit(perPage)
    .offset((page - 1) * perPage);

const [{ count: total }] = await db
    .select({ count: count() })
    .from(projects)
    .where(where);

return { rows, total: Number(total) };
```

- Ownership enforced by `eq(projects.userId, userId)` in `where`, unconditionally
  — the client-supplied `userId` is never trusted, `where` is built purely from
  the authed session's `user.id` at the route layer.
- `and(...)` drops `undefined` branches natively (drizzle behavior), so empty
  `status`/`q` collapse to just the ownership predicate.
- `SORT_COLUMNS` maps the 4 sortable ids (`name`/`status`/`createdAt`/`updatedAt`)
  to the matching drizzle column; multi-column sort supported (each `sort` item
  becomes one `asc`/`desc` term, applied in array order). Empty `sort` defaults
  to `desc(projects.createdAt)`.
- `total` is a second, unpaginated `count()` query reusing the same `where`
  (two queries, not a window function — the same trade-off the task spec
  calls for).

## Sort preprocess — deviation from the literal spec, and why

The task spec's literal snippet was:

```ts
z.preprocess((v) => (typeof v === "string" && v ? JSON.parse(v) : (v ?? [])), z.array(projectSortItemSchema)).catch([])
```

Verified with a standalone repro against this repo's zod (`^4.4.3`) that this
throws a raw `SyntaxError` synchronously out of `.safeParse()`/`.parse()` for
a malformed JSON string — `.catch()` in zod only intercepts a `ZodError`
result from the *inner* schema's parse, not an exception thrown inside a
`preprocess` transform function. So the literal snippet would turn a
corrupt `?sort=` query param into an uncaught exception (effectively a 500,
not the intended "degrade to `[]`").

Fix applied: the transform function (`parseSortParam`) wraps `JSON.parse` in
`try/catch` and, on failure, returns the original (still-a-string) value
unchanged. That string then fails `z.array(projectSortItemSchema)`'s own
validation (a proper `ZodError`), which `.catch([])` *does* correctly
intercept. Verified all 4 cases with a standalone script:
- parsed array in → passed through unchanged.
- JSON-encoded string in → parsed to array.
- malformed JSON string (`"not-json{{{"`) → `[]` (previously: threw).
- unknown/undefined → `[]`.
- valid JSON but unknown column id (e.g. `[{"id":"bogus","desc":true}]`) →
  `[]` (fails the `z.enum(PROJECT_SORTABLE_COLUMNS)` check inside the array
  item schema, caught the same way).

## Test cases added (`project-services.test.ts`, `searchProjectsService`)

Mocks `../../repository/find-projects-page`. Three cases, per spec:
1. `findProjectsPage` returns 1 row, `total: 5` with `perPage: 2` →
   `items` mapped to ISO-string wire shape, `pageCount` = `Math.ceil(5/2)` = `3`,
   `page`/`perPage` echoed from the input params.
2. `findProjectsPage` returns `{ rows: [], total: 0 }` → `items: []`,
   `total: 0`, `pageCount: 0`.
3. `findProjectsPage` rejects → `err`, `error.code === "INTERNAL_SERVER_ERROR"`.

get/create/update/delete service describe blocks left untouched.

## Verify results

- `pnpm exec vitest run src/core/project/server/services` → **10 passed** (1 file).
- `pnpm exec vitest run` (full suite) → **26 passed** (5 files) — up from 25
  pre-T4 (net +1: −2 `listProjectsService` tests, +3 `searchProjectsService` tests).
- `pnpm exec tsc --noEmit` → **PASS**, no errors (after the `project-screen.tsx`
  `.items` compat fix noted above — without it, `project.length`/`project.map`
  on the new `PaginatedProjects` shape fails to typecheck).
- `pnpm exec biome check .` → clean: `Checked 146 files in 60ms. No fixes applied.`
  (ran `biome check --write` scoped to the 3 files it initially flagged for
  formatting-only diffs: `schemas.ts`, `find-projects-page.ts`,
  `project-services.test.ts` — no rule violations, just formatter reflow).
- `pnpm build` → succeeds, Next.js 16.2.6 (Turbopack), all routes generated
  (`/`, `/_not-found`, `/api/v1/[...slugs]`, `/auth/[path]`, `/projects`).

## Blockers / concerns

- `project-screen.tsx`'s temporary `.items` unwrap is a minimal compat shim,
  not real T5 work — no pagination/sort/filter UI wired to the new query
  params yet. T5 (search-params + columns + `use-projects-table` + RSC page)
  supersedes this file entirely.
- `status` query param is a plain `z.array(projectStatusSchema).default([])`
  per the spec, unlike the myworkin reference's `enumArrayParam` helper
  (which normalizes a lone string into a 1-element array for repeated query
  keys sent as a single value). Not exercised end-to-end against a live
  Elysia query-string parse in this task — worth a smoke check in T5/T7 when
  the real UI sends `?status=active&status=archived`-style params.

## T4 fix — normalize single-value `status` query param

The blocker flagged above was real: against Elysia+zod, `GET /projects?status=active`
(a single value) arrives as the bare string `"active"`, which failed
`z.array(projectStatusSchema)` with a 422 before ever reaching the service —
breaking the common "filter by one status" case. Only the repeated-key form
(`?status=active&status=archived`) parsed correctly.

Fixed in `src/core/project/domain/schemas.ts` by wrapping `status` in the same
preprocess pattern already used by `sort`: a bare value becomes a 1-element
array, `undefined`/`null` → `[]`, arrays pass through unchanged, and an
invalid status degrades to `[]` via `.catch([])` instead of throwing a 422.

```ts
status: z
    .preprocess(
        (v) => (v == null ? [] : Array.isArray(v) ? v : [v]),
        z.array(projectStatusSchema),
    )
    .catch([]),
```

Added a `describe("projectSearchSchema", ...)` block to
`src/core/project/domain/__tests__/schemas.test.ts` covering the previously
untested preprocessing: single-value/array/missing/invalid `status`,
JSON-string/array/malformed/unknown-column `sort`, `page`/`perPage`
coercion+defaults, and `q` trimming. 18 tests total in that file (10 new).

### Verify

`pnpm exec vitest run src/core/project/domain src/core/project/server/services`

```
 RUN  v3.2.7 /home/skkippie/work/hackaton-starter

 ✓ src/core/project/domain/__tests__/schemas.test.ts (18 tests) 15ms
 ✓ src/core/project/server/services/__tests__/project-services.test.ts (10 tests) 6ms

 Test Files  2 passed (2)
      Tests  28 passed (28)
   Start at  17:31:26
   Duration  569ms (transform 164ms, setup 0ms, collect 342ms, tests 21ms, environment 0ms, prepare 198ms)
```

Full suite (`pnpm exec vitest run`): **36 passed** (5 files), up from 26
pre-fix (net +10, all new `projectSearchSchema` tests).

`pnpm exec tsc --noEmit` → PASS, no errors.
`pnpm exec biome check .` → clean: `Checked 146 files in 79ms. No fixes applied.`
(no formatting fixes were needed on either changed file this time).
