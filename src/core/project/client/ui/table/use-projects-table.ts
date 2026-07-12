"use client";

import { useMemo, useState, useTransition } from "react";
import type { PaginatedProjects, Project } from "@/core/project/domain/types";
import { useDataTable } from "@/frontend/hooks/use-data-table";
import type { DataTableRowAction } from "@/frontend/types/data-table";
import { getProjectColumns } from "./project-columns";

/**
 * Owns the projects table on top of the shared `useDataTable` hook. The list
 * is server-authoritative: the RSC (`/projects/page.tsx`) resolves the page
 * and passes it in as `initial`. This hook never fetches — filter/sort/page
 * changes write to the URL with `shallow:false` (wrapped in a transition) so
 * the RSC re-runs and streams the next page.
 */
export function useProjectsTable(initial: PaginatedProjects) {
    const [rowAction, setRowAction] =
        useState<DataTableRowAction<Project> | null>(null);
    const [, startTransition] = useTransition();

    const columns = useMemo(() => getProjectColumns({ setRowAction }), []);

    const { table } = useDataTable({
        data: initial.items,
        columns,
        pageCount: initial.pageCount,
        getRowId: (row) => row.id,
        shallow: false,
        startTransition,
        clearOnDefault: true,
        initialState: {
            pagination: { pageIndex: 0, pageSize: initial.perPage },
            sorting: [{ id: "createdAt", desc: true }],
        },
    });

    return { table, rowAction, setRowAction };
}
