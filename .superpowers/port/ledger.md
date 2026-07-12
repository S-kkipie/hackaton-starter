# Port: TanStack Form + data-table (full folder, RSC) — ledger

Branch: feat/data-table-form  | base: main @ abe633c
Source: /home/skkippie/work/myworkin/myworkin-client/apps/myworkin-b2c/src
Scope: FULL data-table folder verbatim + RSC-driven projects table + TanStack Form.

## Tasks
- [x] T1 deps + shadcn primitives + sortable + constants + NuqsAdapter
- [x] T2 port frontend lib/hooks/types (data-table, parsers, config, format, result, use-data-table, use-tanstack-form, use-debounced-callback, use-callback-ref, use-mobile, use-mutate-search, use-mutation-refresh)
- [x] T3 port frontend/components/data-table/* + ui/field + ui/sortable
- [x] T4 backend: paginated GET /projects (domain schema + repo findProjectsPage + service + route + tests)
- [x] T5 project table UI: search-params + columns + use-projects-table + RSC page + screen
- [x] T6 TanStack Form project-form
- [ ] T7 docs + final verify + review + merge/push
T1: commit 9b369d3 (deps/primitives/sortable/compose-refs/constants/NuqsAdapter, build green)
T2: 13 files copied; trimmed DataTableRowAction.variant to update|delete; dropped
    incidental useChildLogger/logger-context call in use-mutate-search.ts (no
    LoggerProvider in starter); kept parsers.ts verbatim (make*ItemSchema
    helpers only import zod, no broken imports). tsc/biome/build all green.
    See .superpowers/port/t2-report.md for full detail.
T2: commit 7f9b840 (13 lib/hooks/types; DataTableRowAction->update|delete; dropped logger-context in use-mutate-search; green)
T3: 18 files copied verbatim (17 components + __tests__ test); no trims needed
    (no DataTableRowAction/domain refs in this folder). Added frontend/lib/id.ts
    (generateId, myworkin-only file T2 missed but data-table-filter-menu.tsx
    needs it) + nanoid dep (was only transitive, not resolvable). Extended
    biome.json vendored override to data-table/**. tsc/vitest(25)/biome/build
    all green. See .superpowers/port/t3-report.md for full detail.
T3: commit b4d5378 (data-table folder 18 files; +lib/id.ts+nanoid; biome override +data-table/**; 25 tests; green)
T4: added domain search/paginated schemas + repo findProjectsPage (drizzle
    and/inArray/ilike/or where, multi-col orderBy, count()) + service
    searchProjectsService + rewrote GET /projects route. Deleted
    list-projects-service.ts + find-projects-by-user.ts (dead). Fixed a real
    bug in the spec's literal sort-preprocess snippet: raw JSON.parse in
    z.preprocess throws past .catch() on malformed JSON (verified against
    zod ^4.4.3) — wrapped in try/catch so malformed sort degrades to [] as
    intended instead of throwing. One-line compat fix in project-screen.tsx
    (.response -> .response.items) to keep tsc/build green until T5 replaces
    that screen. tsc/vitest(26)/biome/build all green. See
    .superpowers/port/t4-report.md for full detail.
T4: commit 1625b71 (paginated GET /projects; find-projects-page+search-projects-service; removed list-service+find-by-user; sort preprocess try/catch fix; 26 tests). Concern: status z.array vs enumArrayParam - smoke-check Elysia repeated ?status= in T5.
T4 FIX: commit 4daca69 (status preprocess single-value fix + 10 schema tests; 36 tests total; Critical closed).
T5: added domain/search-params.ts (nuqs parsers + loadProjectSearchParams),
    client/ui/table/{project-columns,use-projects-table}.ts(x), rewrote
    hooks.ts (useCreate/useUpdate/useDelete -> router.refresh(), dropped dead
    useList/useGetById), rewrote project-screen.tsx (RSC-fed table + debounced
    q search + create/edit + delete-confirm dialogs), rewrote
    app/(app)/projects/page.tsx as RSC (requireAuth + loadProjectSearchParams
    + projectSearchSchema.parse + resolveResult(searchProjectsService)).
    Deleted dead project-card.tsx (superseded by table rows). Resolves T4's
    repeated-?status= concern implicitly: RSC calls the service directly, no
    longer goes through the Eden/Elysia HTTP query parsing for the list read.
    No toolkit mismatches. tsc/vitest(36, unchanged)/biome/build all green.
    See .superpowers/port/t5-report.md for full detail.
T5 review: skipped per user (covered in final whole-branch review).
T6: rewrote project-form.tsx with useAppForm (onChange validator, form.Field
    render-prop bindings, form.Subscribe(canSubmit) gating submit alongside
    the `submitting` prop). Type-fix beyond the task's literal pseudocode:
    defaultValues carries concrete (non-optional) description/status, which
    doesn't structurally match createProjectSchema's `.optional()` fields for
    TanStack Form's onChange validator typing — added a local
    `projectFormSchema` (createProjectSchema.extend({description, status}))
    with both fields required-but-still-permissive (no min-length on
    description, so "" still passes) to match the form's value type; onSubmit
    maps "" description back to `undefined` before calling the parent
    onSubmit, satisfying CreateProject. No screen prop-contract change needed
    (project-screen.tsx already passed editing/submitting/onSubmit exactly).
    tsc/vitest(36, unchanged)/biome/build all green. See
    .superpowers/port/t6-report.md for full detail.
