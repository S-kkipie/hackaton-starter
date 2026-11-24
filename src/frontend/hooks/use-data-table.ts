"use client";

import {
    type ColumnFiltersState,
    type PaginationState,
    type RowSelectionState,
    type SortingState,
    type TableOptions,
    type TableState,
    type Updater,
    useTable,
} from "@tanstack/react-table";
import {
    createParser,
    type Parser,
    parseAsArrayOf,
    parseAsInteger,
    parseAsString,
    throttle,
    type UseQueryStateOptions,
    useQueryState,
    useQueryStates,
} from "nuqs";
import * as React from "react";
import { useDebouncedCallback } from "@/frontend/hooks/use-debounced-callback";
import { getSortingStateParser } from "@/frontend/lib/parsers";
import {
    type TableFeaturesConfig,
    tableFeaturesConfig,
} from "@/frontend/lib/table-features";
import { PAGINATION_LIMIT } from "@/server/constants";
import type { ExtendedColumnSort } from "../types/data-table";

const PAGE_KEY = "page";
const PER_PAGE_KEY = "perPage";
const SORT_KEY = "sort";
/** URL keys the table itself owns (the advanced filter menu writes `filters`). */
const RESERVED_KEYS = [PAGE_KEY, PER_PAGE_KEY, SORT_KEY, "filters"];
const DEBOUNCE_MS = 300;
const THROTTLE_MS = 50;
/** Variants whose filter value is a list of numbers (min/max, from/to, a timestamp). */
const NUMERIC_VARIANTS = new Set(["range", "date", "dateRange"]);

type FilterValue = string | (string | number | undefined)[] | null;

/** ?size=10,20 / ?createdAt=1700000000000, — numbers, an empty slot is an open end. */
const parseAsNumberList = createParser<(number | undefined)[]>({
    parse: (value) => {
        const items = value
            .split(",")
            .map((v) => (v === "" ? undefined : Number(v)));
        return items.some((v) => v !== undefined && Number.isNaN(v))
            ? null
            : items;
    },
    serialize: (value) => value.map((v) => v ?? "").join(","),
});

const isEmpty = (value: FilterValue | undefined) =>
    value == null ||
    value === "" ||
    (Array.isArray(value) && value.every((v) => v === undefined || v === ""));

/** The non-empty filter values as table filters. */
const toFilters = (values: Record<string, FilterValue>): ColumnFiltersState =>
    Object.entries(values).flatMap(([id, value]) =>
        isEmpty(value) ? [] : [{ id, value }],
    );

interface UseDataTableProps<TData extends { id: string | number }>
    extends Omit<
            TableOptions<TableFeaturesConfig, TData>,
            | "state"
            | "pageCount"
            | "features"
            | "getCoreRowModel"
            | "manualFiltering"
            | "manualPagination"
            | "manualSorting"
        >,
        Required<Pick<TableOptions<TableFeaturesConfig, TData>, "pageCount">> {
    initialState?: Omit<Partial<TableState<TableFeaturesConfig>>, "sorting"> & {
        sorting?: ExtendedColumnSort<TData>[];
    };
    history?: "push" | "replace";
    /** Filter edits reach the URL once typing pauses this long. */
    debounceMs?: number;
    /** Minimum time between two URL writes. */
    throttleMs?: number;
    clearOnDefault?: boolean;
    /** The filter menu owns `?filters=`; column filters stay out of the URL. */
    enableAdvancedFilter?: boolean;
    scroll?: boolean;
    /** false for server-backed lists: every URL change re-renders the server component. */
    shallow?: boolean;
    startTransition?: React.TransitionStartFunction;
}

/**
 * A server-backed table whose state lives in the URL (nuqs): ?page= (1-based),
 * ?perPage=, ?sort= and one key per filterable column. Sorting, filtering and
 * pagination are manual: the server sends the page to show.
 */
export function useDataTable<TData extends { id: string | number }>(
    props: UseDataTableProps<TData>,
) {
    const {
        columns,
        pageCount = -1,
        initialState,
        history = "replace",
        debounceMs = DEBOUNCE_MS,
        throttleMs = THROTTLE_MS,
        clearOnDefault = false,
        enableAdvancedFilter = false,
        scroll = false,
        shallow = true,
        startTransition,
        ...tableProps
    } = props;

    const queryStateOptions = React.useMemo<
        Omit<UseQueryStateOptions<string>, "parse">
    >(
        () => ({
            history,
            scroll,
            shallow,
            clearOnDefault,
            startTransition,
            limitUrlUpdates: throttle(throttleMs),
        }),
        [history, scroll, shallow, throttleMs, clearOnDefault, startTransition],
    );

    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
        initialState?.rowSelection ?? {},
    );
    const [columnVisibility, setColumnVisibility] = React.useState<
        Record<string, boolean>
    >(initialState?.columnVisibility ?? {});

    const [page, setPage] = useQueryState(
        PAGE_KEY,
        parseAsInteger.withOptions(queryStateOptions).withDefault(1),
    );
    const [perPage, setPerPage] = useQueryState(
        PER_PAGE_KEY,
        parseAsInteger
            .withOptions(queryStateOptions)
            .withDefault(
                initialState?.pagination?.pageSize ?? PAGINATION_LIMIT,
            ),
    );

    const pagination = React.useMemo<PaginationState>(
        () => ({ pageIndex: page - 1, pageSize: perPage }),
        [page, perPage],
    );

    const onPaginationChange = React.useCallback(
        (updater: Updater<PaginationState>) => {
            const next =
                typeof updater === "function" ? updater(pagination) : updater;
            if (next.pageSize !== pagination.pageSize) {
                void setPerPage(next.pageSize);
                void setPage(1);
            } else void setPage(next.pageIndex + 1);
        },
        [pagination, setPage, setPerPage],
    );

    const columnIds = React.useMemo(
        () =>
            new Set(
                columns.flatMap((c) =>
                    typeof c.id === "string" ? [c.id] : [],
                ),
            ),
        [columns],
    );

    const defaultSorting = initialState?.sorting;
    const sortParser = React.useMemo(
        () =>
            getSortingStateParser<TData>(columnIds)
                .withOptions(queryStateOptions)
                .withDefault(defaultSorting ?? []),
        [columnIds, queryStateOptions, defaultSorting],
    );
    const [sorting, setSorting] = useQueryState(SORT_KEY, sortParser);

    const onSortingChange = React.useCallback(
        (updater: Updater<SortingState>) => {
            const next =
                typeof updater === "function" ? updater(sorting) : updater;
            void setSorting(next as ExtendedColumnSort<TData>[]);
            void setPage(1);
        },
        [sorting, setSorting, setPage],
    );

    // One URL key per filterable column: a list when the column offers options,
    // numbers for ranges and dates, text otherwise (never split).
    const filterColumns = React.useMemo(
        () =>
            enableAdvancedFilter
                ? []
                : columns.flatMap((c) =>
                      c.enableColumnFilter && typeof c.id === "string"
                          ? [{ id: c.id, meta: c.meta }]
                          : [],
                  ),
        [columns, enableAdvancedFilter],
    );
    for (const { id } of filterColumns)
        if (RESERVED_KEYS.includes(id))
            throw new Error(
                `useDataTable: column id "${id}" is a reserved URL key; rename the filterable column`,
            );

    const filterParsers = React.useMemo(
        () =>
            Object.fromEntries(
                filterColumns.map(({ id, meta }) => [
                    id,
                    meta?.options
                        ? parseAsArrayOf(parseAsString).withOptions(
                              queryStateOptions,
                          )
                        : meta?.variant && NUMERIC_VARIANTS.has(meta.variant)
                          ? parseAsNumberList.withOptions(queryStateOptions)
                          : parseAsString.withOptions(queryStateOptions),
                ]),
            ) as Record<
                string,
                | Parser<string>
                | Parser<string[]>
                | Parser<(number | undefined)[]>
            >,
        [filterColumns, queryStateOptions],
    );

    const [filterValues, setFilterValues] = useQueryStates(filterParsers);
    const urlFilters = React.useMemo(
        () => toFilters(filterValues as Record<string, FilterValue>),
        [filterValues],
    );

    // Local state shows typing at once; it follows the URL whenever the URL
    // changes (back/forward, links).
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>(urlFilters);
    const filtersRef = React.useRef(columnFilters);
    filtersRef.current = columnFilters;

    // Typing is ahead of the URL: while an edit waits for its debounce, or
    // writes are still travelling (a non-shallow write echoes back after the
    // server round trip), a URL change is one of our own echoes and must not
    // overwrite the input. Each echo drops its entry; anything else
    // (back/forward, a link) is applied once nothing is pending.
    const editedRef = React.useRef(false);
    const inFlightRef = React.useRef<string[]>([]);
    React.useEffect(() => {
        const key = JSON.stringify(urlFilters);
        const echo = inFlightRef.current.indexOf(key);
        if (echo >= 0) inFlightRef.current.splice(echo, 1);
        if (editedRef.current || inFlightRef.current.length > 0 || echo >= 0)
            return;
        filtersRef.current = urlFilters;
        setColumnFilters(urlFilters);
    }, [urlFilters]);

    const urlKeyRef = React.useRef("");
    urlKeyRef.current = JSON.stringify(urlFilters);
    const writeFilters = useDebouncedCallback(
        (values: Record<string, FilterValue>) => {
            editedRef.current = false;
            const key = JSON.stringify(toFilters(values));
            // A write equal to the URL changes nothing, so no echo would ever clear it.
            if (key !== urlKeyRef.current) inFlightRef.current.push(key);
            void setPage(1);
            void setFilterValues(
                values as Parameters<typeof setFilterValues>[0],
            );
        },
        debounceMs,
    );

    const onColumnFiltersChange = React.useCallback(
        (updater: Updater<ColumnFiltersState>) => {
            if (enableAdvancedFilter) return;
            const next =
                typeof updater === "function"
                    ? updater(filtersRef.current)
                    : updater;
            filtersRef.current = next;
            editedRef.current = true;
            setColumnFilters(next);
            const values: Record<string, FilterValue> = Object.fromEntries(
                filterColumns.map(({ id }) => [id, null]),
            );
            for (const f of next)
                if (f.id in values)
                    values[f.id] = isEmpty(f.value as FilterValue)
                        ? null
                        : (f.value as FilterValue);
            writeFilters(values);
        },
        [enableAdvancedFilter, filterColumns, writeFilters],
    );

    const table = useTable({
        ...tableProps,
        features: tableFeaturesConfig,
        columns,
        initialState,
        pageCount,
        state: {
            pagination,
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
        },
        defaultColumn: {
            ...tableProps.defaultColumn,
            enableColumnFilter: false,
        },
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onPaginationChange,
        onSortingChange,
        onColumnFiltersChange,
        onColumnVisibilityChange: setColumnVisibility,
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
    });

    return { table, shallow, debounceMs, throttleMs };
}
