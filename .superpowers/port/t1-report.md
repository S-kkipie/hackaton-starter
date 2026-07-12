# T1 report — deps + shadcn primitives + sortable + constants + NuqsAdapter

## 1. npm deps added (resolved versions in package.json)

New / bumped:
- `@tanstack/react-form` ^1.33.1
- `@tanstack/react-table` ^8.21.3
- `nuqs` ^2.9.0
- `cmdk` ^1.1.1
- `vaul` ^1.1.2
- `motion` ^12.42.2
- `@dnd-kit/core` ^6.3.1
- `@dnd-kit/sortable` ^10.0.0
- `@dnd-kit/modifiers` ^9.0.0
- `@dnd-kit/utilities` ^3.2.2

Already present at compatible versions (no change needed):
- `date-fns` ^4.4.0 (already installed)
- `react-day-picker` ^10.0.1 (already installed)

Peer warning (pre-existing, unrelated to this port): `@better-auth-ui/react` wants `react@>=19.2.6`, repo pins `react@19.2.4`.

## 2. shadcn primitives

Command run: `pnpm dlx shadcn@latest add table select dropdown-menu popover command separator calendar drawer scroll-area slider tooltip skeleton --yes`

Ran with `-o/--overwrite` NOT set (default false), so existing customized files were preserved automatically — no globals.css/components.json prompts appeared, and neither file was touched.

- **Newly created (6 asked for + table.tsx from first partial run)**: `table.tsx`, `dropdown-menu.tsx`, `command.tsx`, `drawer.tsx`, `scroll-area.tsx`, `tooltip.tsx`, `skeleton.tsx`
- **Already present, left untouched** (declined overwrite): `select.tsx`, `popover.tsx`, `separator.tsx`, `calendar.tsx`, `slider.tsx` (also `dialog.tsx`, `button.tsx` came up as shared deps of new components, also declined/preserved)

Note: the starter repo already had more shadcn primitives pre-installed than the task description assumed (`calendar`, `combobox`, `input-group`, `popover`, `select`, `separator`, `slider`, `spinner`, `switch` in addition to the listed set) — none of these were disturbed.

## 3. Custom `sortable` component

Copied verbatim from myworkin to `src/frontend/components/ui/sortable.tsx`, plus its hard dependency `src/frontend/lib/compose-refs.ts` (myworkin's `useComposedRefs` hook — sortable.tsx imports it and it did not exist in the starter yet).

Exact dnd-kit imports in `sortable.tsx`:
- `@dnd-kit/core`: `Announcements`, `closestCenter`, `closestCorners`, `DndContext`, `DndContextProps`, `DragEndEvent`, `DraggableAttributes`, `DraggableSyntheticListeners`, `DragOverlay`, `DragStartEvent`, `DropAnimation`, `defaultDropAnimationSideEffects`, `KeyboardSensor`, `MouseSensor`, `ScreenReaderInstructions`, `TouchSensor`, `UniqueIdentifier`, `useSensor`, `useSensors`
- `@dnd-kit/modifiers`: `restrictToHorizontalAxis`, `restrictToParentElement`, `restrictToVerticalAxis`
- `@dnd-kit/sortable`: `arrayMove`, `horizontalListSortingStrategy`, `SortableContext`, `SortableContextProps`, `sortableKeyboardCoordinates`, `useSortable`, `verticalListSortingStrategy`
- `@dnd-kit/utilities`: `CSS`

**One adaptation beyond import-path aliasing**: myworkin's file imports `Slot` from the standalone `@radix-ui/react-slot` package. The starter repo standardizes on the unified `radix-ui` meta-package (see `button.tsx`, `badge.tsx`, which do `import { Slot } from "radix-ui"` and use `Slot.Root`). `@radix-ui/react-slot` is only a *transitive* dependency here (present in the pnpm store but not hoisted/symlinked at top level, i.e. a phantom dependency) — a bare import would not resolve under this repo's pnpm layout. Adapted the 4 call sites: import changed to `import { Slot } from "radix-ui"` and the three `asChild ? Slot : "..."` usages changed to `Slot.Root`. No other logic touched.

## 4. `src/server/constants.ts`

Created, mirroring myworkin's `src/server/constants.ts` exactly:

```ts
export const PAGINATION_LIMIT = 20;
```

(That's myworkin's only export in this file.)

## 5. `NuqsAdapter` wiring

`src/frontend/providers/providers.tsx`: added `import { NuqsAdapter } from "nuqs/adapters/next/app";` and wrapped it directly inside `ThemeProvider`, directly outside `QueryClientProvider`. All other providers (`EdenProvider`, `AuthProvider`, `Toaster`) and nesting order unchanged.

## Verify results

- `pnpm exec tsc --noEmit` → **PASS** (no output, exit 0)
- `pnpm exec biome check .` → **PASS**, 0 errors/0 warnings, after one config change (see below). `pnpm run check:fix` was also run and made **no changes** (confirms nothing needed reformatting beyond the config fix).
- `pnpm build` → **PASS** — Turbopack build compiled, typechecked, and generated all routes successfully.

### biome.json change (required to pass)

The shadcn-generated files (`command.tsx`, `drawer.tsx`, `dropdown-menu.tsx`, `scroll-area.tsx`, `skeleton.tsx`, `table.tsx`, `tooltip.tsx`) ship with 2-space indentation, no semicolons, unsorted imports/exports, and `import * as React` instead of `import type`. The existing `overrides` entry for `**/frontend/components/ui/**` (+ `**/frontend/components/auth/**`) only relaxed **linter** rules, not the formatter or the `organizeImports` assist action, so `biome check` failed on these vendored files (13 errors / 6 warnings: `lint/style/useImportType`, `assist/source/organizeImports`, and formatter diffs).

Extended that same override block (did not create a new one) to add:
```json
"formatter": { "enabled": false },
"assist": { "actions": { "source": { "organizeImports": "off" } } },
```
and added `"style": { "useImportType": "off" }` to its `linter.rules`. This is scoped only to the already-relaxed ui/auth globs, so it doesn't affect formatting/linting elsewhere in the repo. `sortable.tsx` and `compose-refs.ts` needed no such relaxation — they were already clean against the stricter rules (myworkin's source is already 4-space/semicolon-formatted).

## Concerns / follow-ups for later tasks

- The `Slot` → `Slot.Root` adaptation in `sortable.tsx` is the only non-cosmetic edit to a "verbatim" copied file; flagged here for visibility in case future upstream diffs from myworkin need re-applying.
- Pre-existing peer-dependency warning between `@better-auth-ui/react` and pinned `react@19.2.4` — unrelated to this port, not introduced by it, left as-is.
- Data-table components/hooks (including the `use-data-table.ts` that actually imports `PAGINATION_LIMIT`) are out of scope for T1 per the task — nothing yet consumes `nuqs`, `@tanstack/react-table`, `@tanstack/react-form`, or the new shadcn primitives, which is why `pnpm build` passes with no functional changes.
