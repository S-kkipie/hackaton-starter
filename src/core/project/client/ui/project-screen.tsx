"use client";

import { PlusIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import type { PaginatedProjects } from "@/core/project/domain/types";
import { DataTable } from "@/frontend/components/data-table/data-table";
import { DataTableToolbar } from "@/frontend/components/data-table/data-table-toolbar";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { useDebouncedCallback } from "@/frontend/hooks/use-debounced-callback";
import { CreateProjectModal } from "./modals/create-project-modal";
import { DeleteProjectModal } from "./modals/delete-project-modal";
import { UpdateProjectModal } from "./modals/update-project-modal";
import { useProjectsTable } from "./table/use-projects-table";

export function ProjectScreen({
    initialProjects,
}: {
    initialProjects: PaginatedProjects;
}) {
    const { table, rowAction, setRowAction } =
        useProjectsTable(initialProjects);

    const [createOpen, setCreateOpen] = useState(false);
    const [q, setQ] = useQueryState(
        "q",
        parseAsString.withDefault("").withOptions({
            shallow: false,
            clearOnDefault: true,
        }),
    );
    const [searchValue, setSearchValue] = useState(q);

    const editingProject =
        rowAction?.variant === "update" ? rowAction.row.original : null;
    const deletingProject =
        rowAction?.variant === "delete" ? rowAction.row.original : null;

    const debouncedSearch = useDebouncedCallback((value: string) => {
        table.setPageIndex(0);
        void setQ(value.length > 0 ? value : null);
    }, 300);

    function handleSearchChange(value: string) {
        setSearchValue(value);
        debouncedSearch(value);
    }

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

            <DataTable table={table}>
                <DataTableToolbar table={table} />
            </DataTable>

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
