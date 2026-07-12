# Port: TanStack Form + data-table (full folder, RSC) — ledger

Branch: feat/data-table-form  | base: main @ abe633c
Source: /home/skkippie/work/myworkin/myworkin-client/apps/myworkin-b2c/src
Scope: FULL data-table folder verbatim + RSC-driven projects table + TanStack Form.

## Tasks
- [x] T1 deps + shadcn primitives + sortable + constants + NuqsAdapter
- [x] T2 port frontend lib/hooks/types (data-table, parsers, config, format, result, use-data-table, use-tanstack-form, use-debounced-callback, use-callback-ref, use-mobile, use-mutate-search, use-mutation-refresh)
- [x] T3 port frontend/components/data-table/* + ui/field + ui/sortable
- [ ] T4 backend: paginated GET /projects (domain schema + repo findProjectsPage + service + route + tests)
- [ ] T5 project table UI: search-params + columns + use-projects-table + RSC page + screen
- [ ] T6 TanStack Form project-form
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
