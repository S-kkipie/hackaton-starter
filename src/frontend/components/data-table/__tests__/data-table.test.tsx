// @vitest-environment happy-dom

import { type ColumnDef, useTable } from "@tanstack/react-table";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { DataTable } from "@/frontend/components/data-table/data-table";
import {
    type TableFeaturesConfig,
    tableFeaturesConfig,
} from "@/frontend/lib/table-features";

const push = vi.fn();
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push }),
    usePathname: () => "/items",
}));

afterEach(() => {
    cleanup();
    push.mockReset();
});

interface Item {
    id: string;
    name: string;
    qty: number;
}

const columns: ColumnDef<TableFeaturesConfig, Item>[] = [
    {
        id: "name",
        header: "Nombre",
        size: 120,
        accessorFn: (r) => r.name,
    },
    {
        id: "qty",
        header: "Cant.",
        size: 60,
        accessorFn: (r) => r.qty,
    },
    {
        id: "actions",
        header: "",
        size: 40,
        cell: () => <button type="button">Editar</button>,
    },
];

function Harness({
    rows,
    cols = columns,
    pinnedEnd = [],
    hidden = {},
    selected,
    onRowActivate,
    rowHref,
}: {
    rows: Item[];
    cols?: ColumnDef<TableFeaturesConfig, Item>[];
    pinnedEnd?: string[];
    hidden?: Record<string, boolean>;
    selected?: string;
    onRowActivate?: (row: Item) => void;
    rowHref?: (row: Item) => string;
}) {
    const table = useTable({
        features: tableFeaturesConfig,
        data: rows,
        columns: cols,
        getRowId: (r) => r.id,
        state: {
            columnPinning: { start: [], end: pinnedEnd },
            columnVisibility: hidden,
            rowSelection: selected ? { [selected]: true } : {},
        },
    });
    return (
        <DataTable
            table={table}
            hidePagination
            onRowActivate={
                onRowActivate ? (row) => onRowActivate(row.original) : undefined
            }
            rowHref={rowHref}
        />
    );
}

const items = (n: number): Item[] =>
    Array.from({ length: n }, (_, i) => ({
        id: `r${i}`,
        name: `Fila ${i}`,
        qty: i,
    }));

test("unpinned cells carry no inline background or width; widths come from the colgroup", () => {
    const { container } = render(<Harness rows={items(1)} />);
    const td = screen.getByText("Fila 0").closest("td") as HTMLElement;
    expect(td.getAttribute("style")).toBeNull();
    const cols = [...container.querySelectorAll("colgroup col")].map(
        (c) => (c as HTMLElement).style.width,
    );
    expect(cols).toEqual(["120px", "60px", "40px"]);
});

test("an end-pinned column is sticky with a background that follows row hover and selection", () => {
    render(<Harness rows={items(1)} pinnedEnd={["actions"]} selected="r0" />);
    const td = screen.getByText("Editar").closest("td") as HTMLElement;
    expect(td.style.position).toBe("sticky");
    expect(td.style.right).toBe("0px");
    expect(td.className).toContain("bg-background");
    expect(td.className).toContain("group-hover/row:bg-muted");
    expect(td.className).toContain("group-data-[state=selected]/row:bg-muted");
    const th = screen.getByText("Cant.").closest("th") as HTMLElement;
    expect(th.getAttribute("style")).toBeNull();
    const row = td.closest("tr") as HTMLElement;
    expect(row.getAttribute("data-state")).toBe("selected");
    expect(row.getAttribute("aria-selected")).toBe("true");
});

test("the empty row spans the visible columns only", () => {
    render(<Harness rows={[]} hidden={{ qty: false }} />);
    const td = screen.getByText("Sin resultados.").closest("td");
    expect(td?.getAttribute("colspan")).toBe("2");
});

test("no footer is drawn when no column defines one", () => {
    const { container } = render(<Harness rows={items(2)} />);
    expect(container.querySelector("tfoot")).toBeNull();
    const withFooter = columns.map((c, i) =>
        i === 1 ? { ...c, footer: "Total" } : c,
    );
    cleanup();
    const again = render(<Harness rows={items(2)} cols={withFooter} />);
    expect(again.container.querySelector("tfoot")?.textContent).toContain(
        "Total",
    );
});

test("an activatable row works with the mouse and the keyboard, but not from its own buttons", () => {
    const onRowActivate = vi.fn();
    render(<Harness rows={items(2)} onRowActivate={onRowActivate} />);
    const row = screen.getByText("Fila 1").closest("tr") as HTMLElement;
    expect(row.tabIndex).toBe(0);
    fireEvent.click(screen.getByText("Fila 1"));
    expect(onRowActivate).toHaveBeenLastCalledWith(items(2)[1]);
    fireEvent.keyDown(row, { key: "Enter" });
    expect(onRowActivate).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getAllByText("Editar")[1] as HTMLElement);
    expect(onRowActivate).toHaveBeenCalledTimes(2);
});

test("rowHref navigates to the row's URL", () => {
    render(<Harness rows={items(1)} rowHref={(r) => `/items/${r.id}`} />);
    fireEvent.click(screen.getByText("Fila 0"));
    expect(push).toHaveBeenCalledWith("/items/r0");
});

test("rows without activation are not focusable", () => {
    render(<Harness rows={items(1)} />);
    const row = screen.getByText("Fila 0").closest("tr") as HTMLElement;
    expect(row.hasAttribute("tabindex")).toBe(false);
});
