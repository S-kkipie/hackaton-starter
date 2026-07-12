# T2 report — data-table lib/hooks/types + tanstack-form + format/result

Source: `/home/skkippie/work/myworkin/myworkin-client/apps/myworkin-b2c/src`
Target: `/home/skkippie/work/hackaton-starter/src` (branch `feat/data-table-form`)

## Files copied (13)

| Dest path | Adapted? |
|---|---|
| `src/frontend/lib/data-table.ts` | no — verbatim |
| `src/frontend/lib/data-table-config.ts` | no — verbatim |
| `src/frontend/lib/parsers.ts` | no — verbatim (see note below) |
| `src/frontend/lib/format.ts` | no — verbatim |
| `src/frontend/lib/result.ts` | no — verbatim |
| `src/frontend/types/data-table.ts` | yes — trimmed `DataTableRowAction.variant` union |
| `src/frontend/hooks/use-tanstack-form.ts` | no — verbatim |
| `src/frontend/hooks/use-data-table.ts` | no — verbatim |
| `src/frontend/hooks/use-debounced-callback.ts` | no — verbatim |
| `src/frontend/hooks/use-callback-ref.ts` | no — verbatim |
| `src/frontend/hooks/use-mobile.ts` | no — verbatim |
| `src/frontend/hooks/use-mutate-search.ts` | yes — dropped `useChildLogger` import + logging call |
| `src/frontend/hooks/use-mutation-refresh.ts` | no — verbatim |

`src/frontend/hooks/` and `src/frontend/types/` directories did not exist yet; created them as part of this task.

## Adaptations / trims (with reason)

1. **`frontend/types/data-table.ts` — `DataTableRowAction<TData>.variant`**
   Trimmed from `"update" | "delete" | "toggleEditable" | "applyDiscount" | "ban"` to
   `"update" | "delete"` per task instructions. The three dropped variants
   (`toggleEditable`, `applyDiscount`, `ban`) are myworkin domain-specific (course
   editability, discount codes, user banning) with no generic meaning in this
   starter's toolkit.
   Also left the stray `/* eslint-disable @typescript-eslint/no-unused-vars */`
   line-1 comment from the source file in place — this repo has no eslint at all
   (biome-only), so the comment is inert noise, not a functioning directive. Not
   an import, so left as-is per the "adapt only imports" instruction; biome does
   not flag it.

2. **`frontend/hooks/use-mutate-search.ts` — dropped `useChildLogger`**
   Source imported `useChildLogger` from `../context/logger-context` (a
   myworkin-only React context: `frontend/context/logger-context.tsx`, itself
   wired to `frontend/context/auth-context` and `@logtape/logtape`'s
   `getLogger`). That context/provider is not part of this port's file list and
   isn't set up in the starter (no `LoggerProvider` in the tree). Its only use in
   this hook was a single non-functional observability call —
   `logger.info("replaceSet", { param, value })` inside `replaceSet` — with no
   effect on control flow or return values. Judged **incidental**, not
   load-bearing: removed the `useChildLogger` import, the `const logger = ...`
   line, and the `logger.info(...)` call. Every other line (all six exported
   callbacks: `replaceSet`, `replaceDelete`, `navigateWithParams`,
   `navigateWithURL`, `replaceSetMany`, `replaceDeleteMany`) is byte-for-byte
   identical to source, including the commented-out `replaceActionRoute` block.

3. **`frontend/lib/parsers.ts` — kept `makeSelectItemSchema`/`makeSortingItemSchema` as-is**
   Task flagged these as candidate LLM/AI-tool-specific helpers to drop *if they
   import anything not present in the starter*. Checked: both only import `z`
   from `zod` (already a dependency) — no missing imports, no domain-specific
   nouns, no dead references. Per the task's own conditional ("if it exports ...
   helpers ... that import things not present ... drop just those exports"),
   the drop condition wasn't met, so left the whole file verbatim, including
   `makeFilterItemSchema` (same shape, also zod-only). Grepped SRC for
   `makeSelectItemSchema`/`makeSortingItemSchema`/`makeFilterItemSchema` usage —
   none found outside `parsers.ts` itself in myworkin either, so these are
   unused-but-harmless exports there too; nothing about them is myworkin-coupled
   beyond their tool-description strings ("Data economy" token-saving copy for
   an LLM). Flagging here for visibility in case a later task wants them gone
   for cleanliness, but they don't block anything.

4. **`frontend/lib/result.ts`** — imports `AppError`/`AppResult`/`AsyncAppResult`
   from `@/server/common/responses`. Confirmed all three are exported from that
   barrel (`src/server/common/responses/index.ts` → `app-error.ts` →
   `result.ts`). No changes needed.

## Dependencies dropped

None. No copied file required a myworkin-only dependency (firebase, stripe,
posthog, `core/*` domain modules) beyond the one incidental `logger-context`
import handled in item 2 above.

## Verify results

- `pnpm exec tsc --noEmit` → **PASS**, no output/errors.
- `pnpm run check:fix` (`biome check --write .`) → `Checked 127 files in 95ms. No fixes applied.`
- `pnpm run check` (`biome check .`) → `Checked 127 files in 42ms. No fixes applied.`
- `pnpm build` → **succeeds**. Next.js 16.2.6 (Turbopack) compiled, typechecked,
  and generated all routes (`/`, `/_not-found`, `/api/v1/[...slugs]`,
  `/auth/[path]`, `/projects`) with no errors.

## Blockers / concerns

None. These files are not yet consumed by any component (T3 wires them into
`frontend/components/data-table/*` and the projects UI), so tsc/biome/build
passing here is a static-shape check, not an integration check.
