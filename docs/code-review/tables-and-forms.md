# Tables & forms (reusable toolkit)

The starter ships myworkin's reusable **data-table** toolkit and **TanStack Form**
binding. New CRUD screens compose these — don't hand-roll `useReactTable` +
client filtering, or raw `useState` forms.

## 1. Tables compose the data-table toolkit `MAJOR`

Server-driven tables use `useDataTable` (`@/frontend/hooks/use-data-table`) —
manual mode (`manualPagination/Sorting/Filtering`), state synced to the URL via
nuqs (`page`/`perPage`/`sort` + one key per filterable column), 300ms-debounced
filter writes. It requires `TData extends { id }` and a `pageCount`. Compose with
`@/frontend/components/data-table/*` (`DataTable`, `DataTableToolbar`,
`DataTableColumnHeader`, `DataTableViewOptions`, faceted/date/range/slider
filters, pagination, skeleton, sort-list, action-bar, `DescriptionCell`).

Canonical wiring (see `core/project`):

```
core/<domain>/
  domain/search-params.ts          nuqs parsers + createSearchParamsCache (keys MUST match what useDataTable writes)
  client/ui/table/
    <domain>-columns.tsx           ColumnDef[]: DataTableColumnHeader, cells, meta{label,variant,options} for filters, an actions column dispatching setRowAction
    data-table.tsx                  "use client" — wires useDataTable to the generic data-table components + modals; receives the awaited service page as `initial…` (no client fetch)
    server.tsx                      RSC (the SSR source) — reads the params cache, calls search*Service, renders <…DataTable initial…/>
app/(app)/<domain>/page.tsx        RSC — searchParamsCache.parse(searchParams), then renders <…TableServer userId/>
```

Data source is **RSC**, split into three files: `page.tsx` parses the URL into the
request-scoped `createSearchParamsCache` and renders `server.tsx`; `server.tsx`
reads the cache (`.all()`), runs it through the domain `search*Schema`, calls the
`search*Service` (returning `AsyncAppResult<Paginated…>`) directly (no Eden on the
server), handles a failed result inline, and hands the page to the client
`data-table.tsx` as `initial…`; `data-table.tsx` wires `useDataTable`
(`shallow:false`, wrapped in a `useTransition`) so any URL change re-runs the RSC.
Mutations `router.refresh()` the RSC (no client list query to invalidate). A
`page`-sibling `error.tsx` is the backstop for unexpected RSC throws.

**Server contract:** the list endpoint / service takes `{ page, perPage, sort, <filters>, q }`
and returns `{ items, total, page, perPage, pageCount }`. Ownership is scoped by
`userId` in the repository WHERE (rows AND count). Sort column ids are zod-enum
whitelisted before reaching the query.

**Check:** a new table uses `useDataTable` + `pageCount` + a `search-params.ts`
whose keys match the table's URL writes; no hand-rolled `useReactTable` with
client-side filtering.

## 2. Forms use TanStack Form + the Field primitive `MAJOR`

Forms use `useAppForm` (`@/frontend/hooks/use-tanstack-form`) with a zod schema
as the validator, and render fields with the shadcn `Field` primitive
(`@/frontend/components/ui/field`).

```tsx
const form = useAppForm({
    defaultValues,
    validators: { onChange: someZodSchema }, // domain schema — single source of truth
    onSubmit: ({ value }) => onSubmit(value),
});
// ...
<form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
    <form.Field name="name">
        {(field) => {
            const hasError = !field.state.meta.isValid;
            return (
                <Field data-invalid={hasError}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={hasError}
                    />
                    {hasError && <FieldError errors={getFieldErrors(field)} />}
                </Field>
            );
        }}
    </form.Field>
    <form.Subscribe selector={(s) => s.canSubmit}>
        {(canSubmit) => <Button type="submit" disabled={!canSubmit}>Save</Button>}
    </form.Subscribe>
</form>
```

The zod domain schema is the validation source of truth (reuse
`create*Schema`/`update*Schema` from `domain/schemas.ts`); errors read from
`field.state.meta.errors` via a small `getFieldErrors` mapper into
`FieldError errors={...}`.

**File layout** (per `core/project/client`, following myworkin `cv-analysis`):

```
core/<domain>/client/
  validation.ts                 form zod schema + `…FormValues` (z.infer)
  ui/forms/<domain>-form.tsx     form definition + form API: default values,
                                 `_…Form()` (for the ReturnType api type),
                                 `getFieldErrors`, the `…FormUI`, and the exported
                                 `…Form` component (useAppForm + fields)
  ui/modals/                     dialogs live here
    create-<domain>-modal.tsx    <Dialog> + <…Form> + useCreate
    update-<domain>-modal.tsx    <Dialog> + keyed <…Form defaultValues> + useUpdate
    delete-<domain>-modal.tsx    <Dialog> confirm + useDelete
  ui/<domain>-screen.tsx         table + toolbar + the three modals (controlled by rowAction)
```

The form emits raw `…FormValues`; each modal maps the empty-description case to
`undefined` (create) / `null` (edit) for its mutation. The screen never inlines a
`<Dialog>` — it renders the modals.

**Check:** a new form uses `useAppForm` + a zod validator (in `validation.ts`) +
`Field`/`FieldError`, not a raw `useState`-controlled form; validation reuses the
domain schema; dialogs live in `ui/modals/`, form definition in `ui/forms/`.

**Dialog/modal forms must remount per record.** `useAppForm`'s `defaultValues`
only seed state once, on mount — they do NOT re-sync if the record being
edited changes while the form instance stays mounted (e.g. a `ProjectForm`
that lives for the life of the screen, switching between "new" and "edit row
X"). Give the form element a `key` derived from the edited record's id (e.g.
`key={editing?.id ?? "new"}`) so React remounts a fresh instance — and
reseeds `defaultValues` — whenever the target record changes. Without this,
opening "Edit" after the form has already mounted once shows stale or blank
values.
