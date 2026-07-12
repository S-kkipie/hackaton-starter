"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { CreateProject, Project } from "@/core/project/domain/types";
import { Button } from "@/frontend/components/ui/button";
import { Dialog, DialogTrigger } from "@/frontend/components/ui/dialog";
import { useProjects } from "../hooks";
import { ProjectCard } from "./project-card";
import { ProjectForm } from "./project-form";

export function ProjectScreen() {
    const { useList, useCreate, useUpdate, useDelete } = useProjects();

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Project | null>(null);

    const listQuery = useList();
    const projects = listQuery.data?.response.items ?? [];
    const createProject = useCreate();
    const updateProject = useUpdate(editing?.id ?? "");
    const deleteProject = useDelete();

    function openCreate() {
        setEditing(null);
        setOpen(true);
    }

    function openEdit(project: Project) {
        setEditing(project);
        setOpen(true);
    }

    function handleSubmit(values: CreateProject) {
        if (editing) {
            updateProject.mutate(values, {
                onSuccess: () => {
                    toast.success("Project updated");
                    setOpen(false);
                },
                onError: () => toast.error("Update failed"),
            });
            return;
        }
        createProject.mutate(values, {
            onSuccess: () => {
                toast.success("Project created");
                setOpen(false);
            },
            onError: () => toast.error("Create failed"),
        });
    }

    function handleDelete(id: string) {
        deleteProject.mutate(id, {
            onSuccess: () => toast.success("Project deleted"),
            onError: () => toast.error("Delete failed"),
        });
    }

    return (
        <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="font-semibold text-2xl">Projects</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate}>New project</Button>
                    </DialogTrigger>
                    <ProjectForm
                        editing={editing}
                        submitting={
                            createProject.isPending || updateProject.isPending
                        }
                        onSubmit={handleSubmit}
                    />
                </Dialog>
            </div>

            {listQuery.isLoading ? (
                <p className="text-muted-foreground text-sm">Loading…</p>
            ) : projects.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                    No projects yet. Create your first one.
                </p>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            deleting={deleteProject.isPending}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
