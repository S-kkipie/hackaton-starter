"use client";

import { PlusIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useMemo, useState, useTransition } from "react";
import type { PaginatedProjects, Project } from "@/core/project/domain/types";
import { DataTable } from "@/frontend/components/data-table/data-table";
import { DataTableToolbar } from "@/frontend/components/data-table/data-table-toolbar";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { useDataTable } from "@/frontend/hooks/use-data-table";
import { useDebouncedCallback } from "@/frontend/hooks/use-debounced-callback";
import type { DataTableRowAction } from "@/frontend/types/data-table";
import { CreateProjectModal } from "../modals/create-project-modal";
import { DeleteProjectModal } from "../modals/delete-project-modal";
import { UpdateProjectModal } from "../modals/update-project-modal";
import { getProjectColumns } from "./project-columns";

/**
 * Projects data-table. Wires the shared `useDataTable` hook to the generic
 * data-table components and renders the create/update/delete modals. The list
 * is server-authoritative: `server.tsx` awaits `searchProjectsService` and hands
 * the page in as `initialProjects`. This component never fetches — filter/sort/
 * page/search changes write to the URL with `shallow:false` (wrapped in a
 * transition) so the RSC re-runs and streams the next page in.
 */
export function ProjectsDataTable({
    initialProjects,
}: {
    initialProjects: PaginatedProjects;
}) {
    const [isPending, startTransition] = useTransition();
    const [rowAction, setRowAction] =
        useState<DataTableRowAction<Project> | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    const columns = useMemo(() => getProjectColumns({ setRowAction }), []);

    const { table } = useDataTable({
        data: initialProjects.items,
        columns,
        pageCount: initialProjects.pageCount,
        getRowId: (row) => row.id,
        shallow: false,
        startTransition,
        clearOnDefault: true,
        initialState: {
            pagination: {
                pageIndex: 0,
                pageSize: initialProjects.perPage,
            },
            sorting: [{ id: "createdAt", desc: true }],
        },
    });

    const [q, setQ] = useQueryState(
        "q",
        parseAsString.withDefault("").withOptions({
            shallow: false,
            clearOnDefault: true,
        }),
    );
    const [searchValue, setSearchValue] = useState(q);

    const debouncedSearch = useDebouncedCallback((value: string) => {
        table.setPageIndex(0);
        void setQ(value.length > 0 ? value : null);
    }, 300);

    function handleSearchChange(value: string) {
        setSearchValue(value);
        debouncedSearch(value);
    }

    const editingProject =
        rowAction?.variant === "update" ? rowAction.row.original : null;
    const deletingProject =
        rowAction?.variant === "delete" ? rowAction.row.original : null;

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="font-semibold text-2xl">Projects</h1>
                <div className="flex items-center gap-2">
                    <Input
                        value={searchValue}
                        onChange={(event) =>
                            handleSearchChange(event.target.value)
                        }
                        placeholder="Search projects…"
                        className="w-56"
                        aria-label="Search projects"
                    />
                    <Button
                        onClick={() => {
                            setRowAction(null);
                            setCreateOpen(true);
                        }}
                    >
                        <PlusIcon />
                        New project
                    </Button>
                </div>
            </div>

            <div
                aria-busy={isPending}
                className={
                    isPending
                        ? "pointer-events-none opacity-60 transition-opacity"
                        : "transition-opacity"
                }
            >
                <DataTable table={table}>
                    <DataTableToolbar table={table} />
                </DataTable>
            </div>

            <CreateProjectModal
                open={createOpen}
                onOpenChange={setCreateOpen}
            />
            <UpdateProjectModal
                project={editingProject}
                onClose={() => setRowAction(null)}
            />
            <DeleteProjectModal
                project={deletingProject}
                onClose={() => setRowAction(null)}
            />
        </div>
    );
}
