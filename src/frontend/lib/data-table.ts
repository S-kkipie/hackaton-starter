import type { Column, RowData } from "@tanstack/react-table";
import type { TableFeaturesConfig } from "@/frontend/lib/table-features";
import type {
    ExtendedColumnFilter,
    FilterOperator,
    FilterVariant,
} from "@/frontend/types/data-table";
import { dataTableConfig } from "./data-table-config";

/**
 * Inline styles of a pinned column's cells: sticky at its offset, with an edge
 * shadow on the last start-pinned / first end-pinned column when `withBorder`.
 * Unpinned columns get none, so row hover and selection colors show through
 * (widths come from the table's `<colgroup>`).
 */
export function getCommonPinningStyles<TData extends RowData>({
    column,
    withBorder = false,
}: {
    column: Column<TableFeaturesConfig, TData>;
    withBorder?: boolean;
}): React.CSSProperties | undefined {
    const isPinned = column.getIsPinned();
    if (!isPinned) return undefined;
    const isLastStartPinned =
        isPinned === "start" && column.getIsLastColumn("start");
    const isFirstEndPinned =
        isPinned === "end" && column.getIsFirstColumn("end");

    return {
        position: "sticky",
        left: isPinned === "start" ? column.getStart("start") : undefined,
        right: isPinned === "end" ? column.getAfter("end") : undefined,
        zIndex: 1,
        boxShadow: withBorder
            ? isLastStartPinned
                ? "-4px 0 4px -4px var(--border) inset"
                : isFirstEndPinned
                  ? "4px 0 4px -4px var(--border) inset"
                  : undefined
            : undefined,
    };
}

export function getFilterOperators(filterVariant: FilterVariant) {
    const operatorMap: Record<
        FilterVariant,
        { label: string; value: FilterOperator }[]
    > = {
        text: dataTableConfig.textOperators,
        number: dataTableConfig.numericOperators,
        range: dataTableConfig.numericOperators,
        date: dataTableConfig.dateOperators,
        dateRange: dataTableConfig.dateOperators,
        boolean: dataTableConfig.booleanOperators,
        select: dataTableConfig.selectOperators,
        multiSelect: dataTableConfig.multiSelectOperators,
    };

    return operatorMap[filterVariant] ?? dataTableConfig.textOperators;
}

export function getDefaultFilterOperator(filterVariant: FilterVariant) {
    const operators = getFilterOperators(filterVariant);

    return operators[0]?.value ?? (filterVariant === "text" ? "iLike" : "eq");
}

export function getValidFilters<TData extends RowData>(
    filters: ExtendedColumnFilter<TData>[],
): ExtendedColumnFilter<TData>[] {
    return filters.filter(
        (filter) =>
            filter.operator === "isEmpty" ||
            filter.operator === "isNotEmpty" ||
            (Array.isArray(filter.value)
                ? filter.value.length > 0
                : filter.value !== "" &&
                  filter.value !== null &&
                  filter.value !== undefined),
    );
}
