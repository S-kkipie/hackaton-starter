# T5 report: server-driven (RSC) projects table UI

Branch: `feat/data-table-form`. Source templates: myworkin `courses/catalog` (search-params, use-courses-table, course-columns, courses-screen, RSC `courses/page.tsx`) + `whatsapp-activity` table (only real hit for `DataTableRowAction`/`setRowAction` in the whole myworkin tree, across both `myworkin-client` and `myworkin-universidad`; cv-builder's table renders cards via `customRender` and carries no row actions).

## Files created
- `src/core/project/domain/search-params.ts` — nuqs parsers (`page`, `perPage`, `sort` via `getSortingStateParser<Project>()`, `status`, `q`) + `loadProjectSearchParams = createLoader(...)`.
- `src/core/project/client/ui/table/project-columns.tsx` — `getProjectColumns({ setRowAction })`: select checkbox, `name` (sortable, `DataTableColumnHeader`), `status` (Badge, `multiSelect` facet, `enableColumnFilter`), `description` (`DescriptionCell`, not sortable), `createdAt` (`formatRelativeTime`, sortable), `actions` (dropdown → Edit/Delete → `setRowAction`).
- `src/core/project/client/ui/table/use-projects-table.ts` — `useProjectsTable(initial)`: owns `rowAction` state + `useDataTable` wiring (`shallow:false`, `startTransition`, `clearOnDefault:true`, default sort `createdAt desc`).

## Files rewritten
- `src/core/project/client/hooks.ts` — dropped `useList`/`useGetById` (dead, list is RSC); `useCreate`/`useUpdate`/`useDelete` now call `router.refresh()` in `onSuccess` instead of `queryClient.invalidateQueries`.
- `src/core/project/client/ui/project-screen.tsx` — `"use client"`, takes `initialProjects: PaginatedProjects`; header (title + debounced `q` search Input + "New project" Button) → `<DataTable table><DataTableToolbar table/></DataTable>` → edit/create `Dialog` (`ProjectForm` as-is, driven by `createOpen` / `rowAction.variant==="update"`) → delete confirm `Dialog` (`rowAction.variant==="delete"`).
- `src/app/(app)/projects/page.tsx` — RSC: `requireAuth()` → `loadProjectSearchParams(await searchParams)` → `projectSearchSchema.parse(params)` → `resolveResult(searchProjectsService(...))` → `<ProjectScreen initialProjects=.../>`.

## Files removed
- `src/core/project/client/ui/project-card.tsx` — dead once the table renders rows itself (was only imported by the old card-grid `ProjectScreen`).

## How it wires end to end
- **Search (`q`)**: a local `searchValue` state gives the Input immediate feedback; `useDebouncedCallback` (300ms, ported hook) writes `q` via `useQueryState("q", parseAsString.withDefault("").withOptions({shallow:false, clearOnDefault:true}))` *and* resets `table.setPageIndex(0)` in the same debounced call (mirrors `useDataTable`'s own `debouncedSetFilterValues` pattern of bundling the page reset with the filter write). `shallow:false` forces a full RSC re-render.
- **Status filter**: the `status` column carries `meta.variant:"multiSelect"` + `options` + `enableColumnFilter:true`. `useDataTable` auto-derives a `parseAsArrayOf(parseAsString, ",")` URL parser for it and `DataTableToolbar`'s filter Drawer renders the checkbox list (`InlineMultiSelectFilter`) for any column with `meta.variant`. Selecting values writes a single comma-joined `?status=` param, which `search-params.ts`'s matching `parseAsArrayOf(parseAsString)` parses back into a `string[]` for `projectSearchSchema`.
- **Sort**: `DataTableColumnHeader` on `name`/`status`/`createdAt` toggles asc/desc/reset; `useDataTable` writes `?sort=` as a JSON array via `getSortingStateParser<Project>()` (same parser instance shape used in `search-params.ts`), which `projectSearchSchema`'s `parseSortParam` preprocessor JSON-parses server-side.
- **Pagination**: `DataTable`'s built-in `DataTablePagination` drives `page`/`perPage` through `useDataTable`'s own `useQueryState`s; `pageCount` comes from the server (`PaginatedProjects.pageCount`), so the table runs in manual/server-pagination mode.
- **Mutations → RSC refresh**: `useCreate`/`useUpdate`/`useDelete` (`hooks.ts`) call `router.refresh()` in `onSuccess`; since there's no client list query anymore, this is the only invalidation mechanism — it re-runs the `/projects` RSC with the *current* URL params (page/sort/status/q untouched), so a create/edit/delete lands the user back on the same filtered/sorted page with fresh data.
- **Result-unwrap**: used `resolveResult(searchProjectsService(...))` (`@/frontend/lib/result`) — awaits the `AsyncAppResult`, returns `PaginatedProjects` directly on the ok branch, or throws `AppErrorException` on the err branch. There's no error boundary under `(app)/projects` yet (none existed pre-T5), so a service failure currently bubbles to Next's default error UI — acceptable per the task's "it may throw for ErrorBoundary" framing; flagging as a possible follow-up (T7 or later) if a nicer in-app error state is wanted.
- **T4 ledger concern (repeated `?status=`) resolved implicitly**: the RSC page never calls the Eden HTTP client for the list — it calls `searchProjectsService` directly — so the Elysia route's raw-query parsing of `status` is no longer in this read path at all. The only remaining consumer of `GET /projects` over HTTP would be an external/future client, unchanged by T5.

## Verify
- `pnpm exec tsc --noEmit` → PASS, no errors.
- `pnpm exec vitest run` → 5 files, **36 tests**, all pass (unchanged from T4's fix commit — T5 added no new tests, per task scope).
- `pnpm exec biome check .` → clean (148 files, no errors). One fixable hit during `check:fix` (`useExhaustiveDependencies` flagging `setRowAction` — a `useState` setter — as an unnecessary `useMemo` dep in `use-projects-table.ts`); removed it manually rather than accepting the `--unsafe` autofix, then re-ran `biome check .` clean.
- `pnpm build` → succeeds. Route table shows `/projects` as `ƒ` (dynamic), matching the auth + `searchParams` read.

## Toolkit mismatches
None. `useDataTable`, `DataTable`, `DataTableToolbar`, `DataTableColumnHeader`, `DescriptionCell`, `getSortingStateParser`, `DataTableRowAction`, and `nuqs/server`'s `createLoader`/parsers all worked exactly as ported in T1-T3/documented in T4 — no prop/shape had to be guessed or stubbed. The one adaptation beyond the task's literal pseudocode: added `sorting: [{id:"createdAt", desc:true}]` to `useProjectsTable`'s `initialState` (not shown in the task's literal code snippet) so the client-side sort-arrow indicator matches the server's actual default order on first load — otherwise the column header would show "unsorted" while the data was in fact `createdAt desc`.
