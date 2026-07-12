import type { ColumnDef } from "@tanstack/react-table";
import { EllipsisIcon } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { Project, ProjectStatus } from "@/core/project/domain/types";
import { DataTableColumnHeader } from "@/frontend/components/data-table/data-table-column-header";
import DescriptionCell from "@/frontend/components/data-table/description-cell";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/frontend/lib/format";
import type { DataTableRowAction } from "@/frontend/types/data-table";

const STATUS_BADGE_VARIANT: Record<ProjectStatus, "default" | "secondary"> = {
    active: "default",
    archived: "secondary",
};

const STATUS_OPTIONS: { label: string; value: ProjectStatus }[] = [
    { label: "Active", value: "active" },
    { label: "Archived", value: "archived" },
];

interface GetProjectColumnsProps {
    setRowAction: Dispatch<SetStateAction<DataTableRowAction<Project> | null>>;
}

/**
 * Column definitions for the projects data table. `status` carries
 * `enableColumnFilter` + faceted `meta.options` so the shared `useDataTable`
 * hook wires a `?status=` URL parser and `DataTableToolbar` renders the
 * multi-select filter; `name`/`createdAt` are sortable through
 * `DataTableColumnHeader`, matching the `sort` URL contract in
 * `search-params.ts`. The `actions` column funnels Edit/Delete into
 * `setRowAction`, read back by `ProjectsDataTable` to drive the edit/delete
 * dialogs.
 */
export function getProjectColumns({
    setRowAction,
}: GetProjectColumnsProps): ColumnDef<Project>[] {
    return [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label="Select all"
                    className="translate-y-0.5"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className="translate-y-0.5"
                />
            ),
            enableSorting: false,
            enableHiding: false,
            size: 40,
        },
        {
            id: "name",
            accessorKey: "name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Name" />
            ),
            cell: ({ row }) => (
                <span className="font-medium">{row.original.name}</span>
            ),
            enableSorting: true,
            meta: { label: "Name" },
        },
        {
            id: "status",
            accessorKey: "status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" />
            ),
            cell: ({ row }) => (
                <Badge variant={STATUS_BADGE_VARIANT[row.original.status]}>
                    {row.original.status}
                </Badge>
            ),
            enableColumnFilter: true,
            meta: {
                label: "Status",
                variant: "multiSelect",
                options: STATUS_OPTIONS,
            },
        },
        {
            id: "description",
            accessorKey: "description",
            header: () => <div className="font-medium">Description</div>,
            cell: ({ row }) => (
                <DescriptionCell
                    description={row.original.description ?? "—"}
                />
            ),
            enableSorting: false,
            meta: { label: "Description" },
        },
        {
            id: "createdAt",
            accessorKey: "createdAt",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Created" />
            ),
            cell: ({ row }) => (
                <span className="text-muted-foreground text-sm">
                    {formatRelativeTime(row.original.createdAt)}
                </span>
            ),
            enableSorting: true,
            meta: { label: "Created" },
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="Open project actions"
                        >
                            <EllipsisIcon />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            onSelect={() =>
                                setRowAction({ row, variant: "update" })
                            }
                        >
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            variant="destructive"
                            onSelect={() =>
                                setRowAction({ row, variant: "delete" })
                            }
                        >
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            enableSorting: false,
            enableHiding: false,
            size: 40,
        },
    ];
}
