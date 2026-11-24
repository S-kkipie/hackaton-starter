// @vitest-environment happy-dom

import { type ColumnDef, useTable } from "@tanstack/react-table";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useState } from "react";
import { afterEach, expect, test } from "vitest";
import { DataTableFacetedFilter } from "@/frontend/components/data-table/data-table-faceted-filter";
import {
    type TableFeaturesConfig,
    tableFeaturesConfig,
} from "@/frontend/lib/table-features";

afterEach(cleanup);

interface Item {
    id: string;
    status: string;
}

const options = [
    { label: "Activo", value: "active" },
    { label: "Archivado", value: "archived", count: 3 },
];
const columns: ColumnDef<TableFeaturesConfig, Item>[] = [
    { id: "status", accessorFn: (r) => r.status, enableColumnFilter: true },
];

let lastFilter: unknown;
function Harness({ initial }: { initial?: string[] }) {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
        initial ? [{ id: "status", value: initial }] : [],
    );
    const table = useTable({
        features: tableFeaturesConfig,
        data: [],
        columns,
        state: { columnFilters },
        onColumnFiltersChange: setColumnFilters,
    });
    lastFilter = table.getColumn("status")?.getFilterValue();
    const column = table.getColumn("status");
    return column ? (
        <DataTableFacetedFilter
            column={column}
            title="Estado"
            options={options}
            multiple
        />
    ) : null;
}

test("the clear control is a real button next to the trigger, not nested in it", () => {
    render(<Harness initial={["active"]} />);
    for (const button of screen.getAllByRole("button"))
        expect(button.querySelector('[role="button"], button')).toBeNull();
    const reset = screen.getByLabelText("Quitar filtro Estado");
    expect(reset.tagName).toBe("BUTTON");
    fireEvent.click(reset);
    expect(lastFilter).toBeUndefined();
});

test("options are searched by their label", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Estado" }));
    const item = screen.getByText("Archivado").closest("[cmdk-item]");
    expect(item?.getAttribute("data-value")).toBe("Archivado");
});
