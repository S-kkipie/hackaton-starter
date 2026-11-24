// @vitest-environment happy-dom

import type { ColumnDef } from "@tanstack/react-table";
import { act, renderHook } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import type { ReactNode } from "react";
import { useState } from "react";
import { expect, test, vi } from "vitest";
import { useDataTable } from "@/frontend/hooks/use-data-table";
import type { TableFeaturesConfig } from "@/frontend/lib/table-features";

type Values = Record<string, string | string[] | null>;
const echo = vi.hoisted(() => ({
    writes: [] as Values[],
    deliver: (_: Values) => {},
}));

// The URL state of the filters, with the echo of each write delivered by hand (a slow server round trip).
vi.mock("nuqs", async (original) => {
    const real = await original<typeof import("nuqs")>();
    return {
        ...real,
        useQueryStates: (parsers: Record<string, unknown>) => {
            const [state, setState] = useState<Values>(
                Object.fromEntries(Object.keys(parsers).map((k) => [k, null])),
            );
            echo.deliver = (v) => setState(v);
            return [
                state,
                (values: Values) => {
                    echo.writes.push(values);
                    return Promise.resolve(new URLSearchParams());
                },
            ];
        },
    };
});

interface Item {
    id: string;
}
const columns: ColumnDef<TableFeaturesConfig, Item>[] = [
    {
        id: "q",
        accessorFn: (r) => r.id,
        enableColumnFilter: true,
        meta: { variant: "text" },
    },
];

const wrapper = ({ children }: { children: ReactNode }) => (
    <NuqsTestingAdapter>{children}</NuqsTestingAdapter>
);
const mount = () =>
    renderHook(
        () =>
            useDataTable({
                data: [],
                columns,
                pageCount: 1,
                getRowId: (r) => r.id,
                shallow: false,
                debounceMs: 20,
            }),
        { wrapper },
    );
const type = (r: ReturnType<typeof mount>, text: string) =>
    act(() => r.result.current.table.getColumn("q")?.setFilterValue(text));
const wait = (ms: number) =>
    act(async () => void (await new Promise((res) => setTimeout(res, ms))));
const input = (r: ReturnType<typeof mount>) =>
    r.result.current.table.getColumn("q")?.getFilterValue();

test("late echoes of earlier writes do not overwrite newer typing", async () => {
    echo.writes.length = 0;
    const r = mount();
    for (const text of ["a", "ab", "abc"]) {
        type(r, text);
        await wait(40); // each pause is long enough to write, shorter than the round trip
    }
    expect(echo.writes.map((w) => w.q)).toEqual(["a", "ab", "abc"]);
    type(r, "abcd"); // typed while three writes are still in flight
    act(() => echo.deliver({ q: "a" }));
    act(() => echo.deliver({ q: "ab" }));
    expect(input(r)).toBe("abcd");
    act(() => echo.deliver({ q: "abc" }));
    expect(input(r)).toBe("abcd");
    await wait(40);
    act(() => echo.deliver({ q: "abcd" }));
    expect(input(r)).toBe("abcd");
});

test("a URL change with nothing pending (back/forward) still updates the input", async () => {
    echo.writes.length = 0;
    const r = mount();
    type(r, "a");
    await wait(40);
    act(() => echo.deliver({ q: "a" }));
    act(() => echo.deliver({ q: "zzz" }));
    expect(input(r)).toBe("zzz");
});
