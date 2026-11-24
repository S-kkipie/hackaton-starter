"use client";
import {
    type Column,
    flexRender,
    type Row,
    type RowData,
    type Table as TanstackTable,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import type * as React from "react";
import { DataTablePagination } from "@/frontend/components/data-table/data-table-pagination";
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/frontend/components/ui/table";
import { getCommonPinningStyles } from "@/frontend/lib/data-table";
import type { TableFeaturesConfig } from "@/frontend/lib/table-features";
import { cn } from "@/frontend/lib/utils";

type F = TableFeaturesConfig;

/** Clicks on these inside a row act on the control, not on the row. */
const INTERACTIVE =
    "a, button, input, select, textarea, label, [role=checkbox], [role=menuitem], [role=button]";

/** Pinned cells need an opaque background that still follows row hover and selection. */
function pinnedClass<TData extends RowData>(
    column: Column<F, TData>,
    header: boolean,
) {
    if (!column.getIsPinned()) return undefined;
    return header
        ? "bg-background"
        : "bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted";
}

interface DataTableProps<TData extends { id: string | number }>
    extends React.ComponentProps<"div"> {
    table: TanstackTable<F, TData>;
    actionBar?: React.ReactNode;
    /**
     * Click on a row (outside its buttons, links and checkboxes) or Enter/Space
     * on the focused row. Rows become focusable when set.
     */
    onRowActivate?: (row: Row<F, TData>) => void;
    /** Shorthand for `onRowActivate` that navigates to the row's URL. */
    rowHref?: (row: TData) => string;
    customRender?: (rows: TData[]) => React.ReactNode;
    /** Hide the pagination footer — for fully client-capped, single-view tables. */
    hidePagination?: boolean;
}

export function DataTable<TData extends { id: string | number }>({
    table,
    actionBar,
    children,
    className,
    onRowActivate,
    rowHref,
    customRender,
    hidePagination,
    ...props
}: DataTableProps<TData>) {
    const router = useRouter();
    const activate =
        onRowActivate ??
        (rowHref
            ? (row: Row<F, TData>) => router.push(rowHref(row.original))
            : undefined);

    const rows = table.getRowModel().rows;
    const leafColumns = table.getVisibleLeafColumns();
    const hasFooter = leafColumns.some(
        (column) => column.columnDef.footer !== undefined,
    );

    return (
        <div
            className={cn(
                "flex w-full flex-col gap-2.5",
                customRender ? "overflow-x-clip" : "overflow-auto",
                className,
            )}
            {...props}
        >
            {children}
            {customRender ? (
                rows.length ? (
                    customRender(rows.map((row) => row.original))
                ) : (
                    <div className="flex h-24 items-center justify-center rounded-md border text-muted-foreground">
                        Sin resultados.
                    </div>
                )
            ) : (
                <div className="overflow-hidden rounded-md border">
                    <Table>
                        <colgroup>
                            {leafColumns.map((column) => (
                                <col
                                    key={column.id}
                                    style={{ width: column.getSize() }}
                                />
                            ))}
                        </colgroup>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            style={getCommonPinningStyles({
                                                column: header.column,
                                            })}
                                            className={pinnedClass(
                                                header.column,
                                                true,
                                            )}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext(),
                                                  )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {rows.length ? (
                                rows.map((row) => {
                                    const selected = row.getIsSelected();
                                    return (
                                        <TableRow
                                            key={row.id}
                                            data-state={
                                                selected
                                                    ? "selected"
                                                    : undefined
                                            }
                                            aria-selected={
                                                selected || undefined
                                            }
                                            tabIndex={
                                                activate ? 0 : undefined
                                            }
                                            onClick={
                                                activate
                                                    ? (event) => {
                                                          const target =
                                                              event.target as Element;
                                                          const control =
                                                              target.closest(
                                                                  INTERACTIVE,
                                                              );
                                                          if (
                                                              control &&
                                                              event.currentTarget.contains(
                                                                  control,
                                                              )
                                                          )
                                                              return;
                                                          activate(row);
                                                      }
                                                    : undefined
                                            }
                                            onKeyDown={
                                                activate
                                                    ? (event) => {
                                                          if (
                                                              event.target !==
                                                              event.currentTarget
                                                          )
                                                              return;
                                                          if (
                                                              event.key ===
                                                                  "Enter" ||
                                                              event.key === " "
                                                          ) {
                                                              event.preventDefault();
                                                              activate(row);
                                                          }
                                                      }
                                                    : undefined
                                            }
                                            className={cn(
                                                "group/row",
                                                activate &&
                                                    "cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                                            )}
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        style={getCommonPinningStyles(
                                                            {
                                                                column: cell.column,
                                                            },
                                                        )}
                                                        className={pinnedClass(
                                                            cell.column,
                                                            false,
                                                        )}
                                                    >
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext(),
                                                        )}
                                                    </TableCell>
                                                ))}
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={leafColumns.length}
                                        className="h-24 text-center"
                                    >
                                        Sin resultados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        {hasFooter && rows.length ? (
                            <TableFooter>
                                {table.getFooterGroups().map((footerGroup) => (
                                    <TableRow key={footerGroup.id}>
                                        {footerGroup.headers.map((footer) => (
                                            <TableCell
                                                key={footer.id}
                                                colSpan={footer.colSpan}
                                            >
                                                {footer.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          footer.column
                                                              .columnDef.footer,
                                                          footer.getContext(),
                                                      )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableFooter>
                        ) : null}
                    </Table>
                </div>
            )}
            <div className="flex flex-col gap-2.5">
                {!hidePagination ? <DataTablePagination table={table} /> : null}
                {actionBar &&
                    table.getFilteredSelectedRowModel().rows.length > 0 &&
                    actionBar}
            </div>
        </div>
    );
}
