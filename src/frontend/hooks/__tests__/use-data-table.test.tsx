// @vitest-environment happy-dom

import type { ColumnDef } from "@tanstack/react-table";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
    NuqsTestingAdapter,
    type OnUrlUpdateFunction,
} from "nuqs/adapters/testing";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { useDataTable } from "@/frontend/hooks/use-data-table";
import type { TableFeaturesConfig } from "@/frontend/lib/table-features";

interface Item {
    id: string;
    name: string;
    status: string;
    size: number;
    createdAt: number;
}
type UrlUpdate = Parameters<OnUrlUpdateFunction>[0];

const columns: ColumnDef<TableFeaturesConfig, Item>[] = [
    { id: "id", accessorFn: (r) => r.id },
    {
        id: "status",
        accessorFn: (r) => r.status,
        enableColumnFilter: true,
        meta: {
            variant: "multiSelect",
            options: [
                { label: "Activo", value: "active" },
                { label: "Archivado", value: "archived" },
            ],
        },
    },
    {
        id: "name",
        accessorFn: (r) => r.name,
        enableColumnFilter: true,
        meta: { variant: "text" },
    },
    {
        id: "size",
        accessorFn: (r) => r.size,
        enableColumnFilter: true,
        meta: { variant: "range", range: [0, 100] },
    },
    {
        id: "createdAt",
        accessorFn: (r) => r.createdAt,
        enableColumnFilter: true,
        meta: { variant: "dateRange" },
    },
];

function setup(
    initial: Record<string, string>,
    cols = columns,
    extra: { enableAdvancedFilter?: boolean } = {},
) {
    const updates: UrlUpdate[] = [];
    let search = initial;
    const wrapper = ({ children }: { children: ReactNode }) => (
        <NuqsTestingAdapter
            hasMemory
            searchParams={new URLSearchParams(search).toString()}
            onUrlUpdate={(e) => updates.push(e)}
        >
            {children}
        </NuqsTestingAdapter>
    );
    const hook = renderHook(
        () =>
            useDataTable({
                data: [
                    {
                        id: "a",
                        name: "A",
                        status: "active",
                        size: 1,
                        createdAt: 0,
                    },
                ],
                columns: cols,
                pageCount: 5,
                getRowId: (r) => r.id,
                shallow: false,
                clearOnDefault: true,
                debounceMs: 10,
                initialState: { sorting: [{ id: "id", desc: false }] },
                ...extra,
            }),
        { wrapper },
    );
    const last = () => updates.at(-1)?.searchParams;
    const navigate = (next: Record<string, string>) => {
        search = next;
        hook.rerender();
    };
    return { ...hook, updates, last, navigate };
}

afterEach(() => vi.useRealTimers());

test("page, perPage, sort and the column filters come from the URL", () => {
    const { result } = setup({
        page: "3",
        perPage: "10",
        sort: JSON.stringify([{ id: "id", desc: true }]),
        status: "active,archived",
        name: "demo",
    });
    const s = result.current.table.state;
    expect(s.pagination).toEqual({ pageIndex: 2, pageSize: 10 });
    expect(s.sorting).toEqual([{ id: "id", desc: true }]);
    expect(s.columnFilters).toEqual([
        { id: "status", value: ["active", "archived"] },
        { id: "name", value: "demo" },
    ]);
});

test("a text filter keeps accents and spaces whole", () => {
    const { result } = setup({ name: "José María" });
    expect(result.current.table.state.columnFilters).toEqual([
        { id: "name", value: "José María" },
    ]);
    const { result: other } = setup({ name: "foo bar" });
    expect(other.current.table.state.columnFilters).toEqual([
        { id: "name", value: "foo bar" },
    ]);
});

test("range and date range filters round-trip as numbers", async () => {
    const { result, last } = setup({
        size: "10,20",
        createdAt: "1700000000000,",
    });
    expect(result.current.table.state.columnFilters).toEqual([
        { id: "size", value: [10, 20] },
        { id: "createdAt", value: [1700000000000, undefined] },
    ]);
    act(() => result.current.table.getColumn("size")?.setFilterValue([5, 50]));
    await waitFor(() => expect(last()?.get("size")).toBe("5,50"));
});

test("paging and sorting write the URL non-shallow and drop the defaults", async () => {
    const { result, updates, last } = setup({});
    act(() => result.current.table.setPageIndex(1));
    await waitFor(() => expect(last()?.get("page")).toBe("2"));
    expect(updates.at(-1)?.options.shallow).toBe(false);
    act(() => result.current.table.getColumn("id")?.toggleSorting(true));
    await waitFor(() =>
        expect(last()?.get("sort")).toBe('[{"id":"id","desc":true}]'),
    );
    act(() => result.current.table.getColumn("id")?.toggleSorting(false));
    await waitFor(() => expect(last()?.has("sort")).toBe(false));
});

test("a filter goes to the URL after the debounce and sends the page back to 1", async () => {
    const { result, last } = setup({ page: "3" });
    act(() =>
        result.current.table.getColumn("status")?.setFilterValue(["active"]),
    );
    act(() =>
        result.current.table.getColumn("name")?.setFilterValue("José María"),
    );
    await waitFor(() => expect(last()?.get("status")).toBe("active"));
    expect(last()?.get("name")).toBe("José María");
    expect(last()?.has("page")).toBe(false);
    act(() =>
        result.current.table.getColumn("status")?.setFilterValue(undefined),
    );
    await waitFor(() => expect(last()?.has("status")).toBe(false));
});

test("an unknown sort column falls back to the default sort", () => {
    const { result } = setup({
        sort: JSON.stringify([{ id: "nope", desc: true }]),
    });
    expect(result.current.table.state.sorting).toEqual([
        { id: "id", desc: false },
    ]);
});

test("filters follow the URL when it changes outside the table (back/forward)", async () => {
    const { result, navigate } = setup({ status: "active" });
    expect(result.current.table.state.columnFilters).toEqual([
        { id: "status", value: ["active"] },
    ]);
    navigate({ name: "demo" });
    await waitFor(() =>
        expect(result.current.table.state.columnFilters).toEqual([
            { id: "name", value: "demo" },
        ]),
    );
});

test("changing the sort or the page size sends the page back to 1", async () => {
    const { result, last } = setup({ page: "3" });
    act(() => result.current.table.getColumn("id")?.toggleSorting(true));
    await waitFor(() => expect(last()?.has("page")).toBe(false));
    act(() => result.current.table.setPageIndex(2));
    await waitFor(() => expect(last()?.get("page")).toBe("3"));
    act(() => result.current.table.setPageSize(50));
    await waitFor(() => expect(last()?.get("perPage")).toBe("50"));
    expect(last()?.has("page")).toBe(false);
});

test("a filterable column cannot use a reserved URL key", () => {
    const bad: ColumnDef<TableFeaturesConfig, Item>[] = [
        { id: "sort", accessorFn: (r) => r.name, enableColumnFilter: true },
    ];
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => setup({}, bad)).toThrow(/reserved URL key/);
});

test("typing quickly writes the text filter to the URL once", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    const { result, updates } = setup({});
    for (const text of ["J", "Jo", "José"])
        act(() => result.current.table.getColumn("name")?.setFilterValue(text));
    expect(updates).toHaveLength(0);
    await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
    });
    const writes = updates.filter((u) => u.searchParams.has("name"));
    expect(writes).toHaveLength(1);
    expect(writes[0]?.searchParams.get("name")).toBe("José");
});

test("rows can still be selected", () => {
    const { result } = setup({});
    act(() => result.current.table.getRow("a").toggleSelected(true));
    expect(result.current.table.state.rowSelection).toEqual({ a: true });
});

test("with the advanced filter the column filters stay out of the URL", async () => {
    const { result, updates } = setup({ name: "demo" }, columns, {
        enableAdvancedFilter: true,
    });
    expect(result.current.table.state.columnFilters).toEqual([]);
    act(() => result.current.table.getColumn("name")?.setFilterValue("x"));
    await new Promise((r) => setTimeout(r, 30));
    expect(updates.some((u) => u.searchParams.has("name"))).toBe(false);
});
