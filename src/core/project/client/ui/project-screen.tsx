"use client";

import { PlusIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import type {
    PaginatedProjects,
    ProjectStatus,
} from "@/core/project/domain/types";
import { DataTable } from "@/frontend/components/data-table/data-table";
import { DataTableToolbar } from "@/frontend/components/data-table/data-table-toolbar";
import { Button } from "@/frontend/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Input } from "@/frontend/components/ui/input";
import { useDebouncedCallback } from "@/frontend/hooks/use-debounced-callback";
import { useProjects } from "../hooks";
import { ProjectForm } from "./project-form";
import { useProjectsTable } from "./table/use-projects-table";

export function ProjectScreen({
    initialProjects,
}: {
    initialProjects: PaginatedProjects;
}) {
    const { table, rowAction, setRowAction } =
        useProjectsTable(initialProjects);
    const { useCreate, useUpdate, useDelete } = useProjects();

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
    const formOpen = createOpen || editingProject !== null;

    const createProject = useCreate();
    const updateProject = useUpdate(editingProject?.id ?? "");
    const deleteProject = useDelete();

    const debouncedSearch = useDebouncedCallback((value: string) => {
        table.setPageIndex(0);
        void setQ(value.length > 0 ? value : null);
    }, 300);

    function closeForm() {
        setCreateOpen(false);
        setRowAction(null);
    }

    function handleSearchChange(value: string) {
        setSearchValue(value);
        debouncedSearch(value);
    }

    function handleSubmit(values: {
        name: string;
        description?: string | null;
        status: ProjectStatus;
    }) {
        if (editingProject) {
            updateProject.mutate(values, {
                onSuccess: () => {
                    toast.success("Project updated");
                    closeForm();
                },
                onError: () => toast.error("Update failed"),
            });
            return;
        }
        createProject.mutate(
            { ...values, description: values.description ?? undefined },
            {
                onSuccess: () => {
                    toast.success("Project created");
                    closeForm();
                },
                onError: () => toast.error("Create failed"),
            },
        );
    }

    function handleDelete() {
        if (!deletingProject) return;
        deleteProject.mutate(deletingProject.id, {
            onSuccess: () => {
                toast.success("Project deleted");
                setRowAction(null);
            },
            onError: () => toast.error("Delete failed"),
        });
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

            <Dialog
                open={formOpen}
                onOpenChange={(open) => {
                    if (!open) closeForm();
                }}
            >
                <ProjectForm
                    key={editingProject?.id ?? "new"}
                    editing={editingProject}
                    submitting={
                        createProject.isPending || updateProject.isPending
                    }
                    onSubmit={handleSubmit}
                />
            </Dialog>

            <Dialog
                open={deletingProject !== null}
                onOpenChange={(open) => {
                    if (!open) setRowAction(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete project</DialogTitle>
                        <DialogDescription>
                            {deletingProject
                                ? `This will permanently delete "${deletingProject.name}". This action cannot be undone.`
                                : ""}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRowAction(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={deleteProject.isPending}
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
