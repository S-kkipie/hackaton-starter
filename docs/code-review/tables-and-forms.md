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
  domain/search-params.ts          nuqs parsers — keys MUST match what useDataTable writes
  client/ui/table/
    <domain>-columns.tsx           ColumnDef[]: DataTableColumnHeader, cells, meta{label,variant,options} for filters, an actions column dispatching setRowAction
    use-<domain>-table.ts          useDataTable({ data, columns, pageCount, getRowId, shallow:false })
  client/ui/<domain>-screen.tsx    <DataTable table={table}><DataTableToolbar table={table}/></DataTable>
```

Data source is **RSC**: the `(app)/<domain>/page.tsx` server component resolves
the page via a `search*Service` (returning `AsyncAppResult<Paginated…>`),
unwraps with `resolveResult`/`unwrapResult` (`@/frontend/lib/result`), and passes
`initial…` to the client screen. `shallow:false` makes URL changes re-run the
RSC. Mutations `router.refresh()` the RSC (there is no client list query to
invalidate). A `page`-sibling `error.tsx` catches the `resolveResult` throw.

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

**Check:** a new form uses `useAppForm` + a zod validator + `Field`/`FieldError`,
not a raw `useState`-controlled form; validation reuses the domain schema.

**Dialog/modal forms must remount per record.** `useAppForm`'s `defaultValues`
only seed state once, on mount — they do NOT re-sync if the record being
edited changes while the form instance stays mounted (e.g. a `ProjectForm`
that lives for the life of the screen, switching between "new" and "edit row
X"). Give the form element a `key` derived from the edited record's id (e.g.
`key={editing?.id ?? "new"}`) so React remounts a fresh instance — and
reseeds `defaultValues` — whenever the target record changes. Without this,
opening "Edit" after the form has already mounted once shows stale or blank
values.
