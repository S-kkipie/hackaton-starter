# T6 report: convert project create/edit form to TanStack Form

Branch: `feat/data-table-form`. Template: myworkin
`myworkin-b2c/src/core/cv-analysis/client/ui/forms/cv-upload-form.tsx` (the
only `useAppForm` example in the source tree).

## File rewritten
- `src/core/project/client/ui/project-form.tsx` — was plain `useState` +
  manual `handleSubmit`; now `useAppForm` with live (`onChange`) zod
  validation and `form.Field` render-prop bindings for `name`, `description`,
  `status`.

## `useAppForm` setup
```ts
const form = useAppForm({
    defaultValues: {
        name: editing?.name ?? "",
        description: editing?.description ?? "",
        status: (editing?.status ?? "active") as ProjectStatus,
    },
    validators: { onChange: projectFormSchema },
    onSubmit: ({ value }) => {
        onSubmit({
            ...value,
            description: value.description?.trim()
                ? value.description.trim()
                : undefined,
        });
    },
});
```

`useAppForm` comes from `@/frontend/hooks/use-tanstack-form` (already ported
in T2, `createFormHook` with empty `fieldComponents`/`formComponents` — same
shape as myworkin's, no custom `form.AppField` components exist so binding is
via the render-prop `form.Field` pattern, matching the only template).

## Type mismatch found (beyond the task's literal pseudocode)
The task's literal `validators: { onChange: createProjectSchema }` doesn't
type-check as written: `createProjectSchema`'s `description`/`status` are
`.optional()` (input type `string | undefined` / `ProjectStatus | undefined`
as *optional keys*), but the form's `defaultValues` — per the task's own spec
— gives concrete values (`editing?.description ?? ""`,
`(editing?.status ?? "active") as ProjectStatus`), so TanStack Form infers
`TFormData` as `{ name: string; description: string; status: ProjectStatus }`
(all required). TanStack Form's `onChange` validator must be a standard
schema whose input type matches `TFormData` *exactly*; the optional-key zod
shape isn't assignable to the required-field form type (tsc: `'input.description'
types 'string | undefined' not assignable to 'string'`).

Fix: added a local, form-only schema —

```ts
const projectFormSchema = createProjectSchema.extend({
    description: z.string().max(2000),
    status: projectStatusSchema,
});
```

— which makes both fields *required* (matching the form's value type) but
keeps them just as permissive as before (no `min` on `description`, so `""`
still validates fine; `status` is still the same enum). Only the *shape*
required-ness changed, not the accepted values. `onSubmit` still maps an
empty/blank `description` back to `undefined` before calling the parent's
`onSubmit(values: CreateProject)`, so the value handed up the tree still
matches `createProjectSchema`'s optional-description contract exactly as the
task specified.

## How validation + errors render
Each field is wrapped in `form.Field name="...">{(field) => ...}`:
- `hasError = !field.state.meta.isValid` (recomputed on every keystroke since
  `onChange` validation runs live).
- `<Field data-invalid={hasError}>` (styling hook, existing `field.tsx`
  primitive from T3) → `<FieldLabel htmlFor={field.name}>` → control bound
  `value={field.state.value}` / `onBlur={field.handleBlur}` /
  `onChange={(e) => field.handleChange(e.target.value)}` /
  `aria-invalid={hasError}` → `{hasError && <FieldError errors={getFieldErrors(field)} />}`.
- `getFieldErrors(field)` maps `field.state.meta.errors` →
  `[{ message: String(e?.message ?? e) }]` — copied verbatim from
  `cv-upload-form.tsx`.
- `status` uses a native `<select>` (kept the original's exact className)
  rather than introducing the shadcn `Select` — the task allowed either;
  native kept the diff smaller and needed no extra wiring for a 2-option enum.
- Submit button: `<form.Subscribe selector={(state) => state.canSubmit}>` wraps
  the submit `Button`, gating `disabled={submitting || !canSubmit}` — reactive
  gating on `canSubmit` requires `form.Subscribe`/`useStore`, since reading
  `form.state.canSubmit` directly in the component body would only capture a
  stale snapshot (confirmed `form.Subscribe` is used the same way elsewhere in
  myworkin, `myworkin-admin/.../create-event-form.tsx`, even though it's not in
  the one template file named in the task).

## Screen prop contract
No change needed. `project-screen.tsx` already renders
`<ProjectForm editing={editingProject} submitting={createProject.isPending || updateProject.isPending} onSubmit={handleSubmit} />`
with `handleSubmit(values: CreateProject)` — the new form's `onSubmit` callback
signature is unchanged (`(values: CreateProject) => void`), so the screen
needed zero edits.

## Verify
- `pnpm exec tsc --noEmit` → PASS, no errors.
- `pnpm exec vitest run` → 5 files, **36 tests**, all pass (unchanged from T5;
  this task added no new tests, per task scope — form validation is exercised
  transitively via `createProjectSchema`'s existing 18 schema tests).
- `pnpm exec biome check .` → clean (148 files). `check:fix` made one
  formatting fix (wrapped a multi-line `<FieldError ... />` call); re-ran
  `biome check .` clean afterward. `project-form.tsx` and `project-screen.tsx`
  are not under the relaxed override (`ui/**`, `auth/**`, `data-table/**`
  only), so both are held to full formatter/lint/import-order rules.
- `pnpm build` → succeeds. Route table unchanged (`/projects` still `ƒ`
  dynamic).

## Concerns / follow-ups for T7
- None blocking. The only design judgment call was the `projectFormSchema`
  required-field variant described above — flagging it explicitly in case a
  reviewer expects `validators.onChange` to be the literal, unmodified
  `createProjectSchema` import.
