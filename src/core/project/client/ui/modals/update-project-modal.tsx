"use client";

import { toast } from "sonner";
import type { Project } from "@/core/project/domain/types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/frontend/components/ui/dialog";
import { useProjects } from "../../hooks";
import type { ProjectFormValues } from "../../validation";
import { ProjectForm } from "../forms/project-form";

interface UpdateProjectModalProps {
    /** The project being edited, or `null` when the modal is closed. */
    project: Project | null;
    onClose: () => void;
}

/** Modal for editing a project. Empty description → `null` (clears the column). */
export function UpdateProjectModal({
    project,
    onClose,
}: UpdateProjectModalProps) {
    const { useUpdate } = useProjects();
    const updateProject = useUpdate(project?.id ?? "");

    function handleSubmit(values: ProjectFormValues) {
        updateProject.mutate(
            {
                name: values.name,
                description: values.description.trim() || null,
                status: values.status,
            },
            {
                onSuccess: () => {
                    toast.success("Project updated");
                    onClose();
                },
                onError: () => toast.error("Update failed"),
            },
        );
    }

    return (
        <Dialog
            open={project !== null}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit project</DialogTitle>
                    <DialogDescription>
                        Update your project details.
                    </DialogDescription>
                </DialogHeader>
                {/* keyed by id so the form remounts + reseeds per record */}
                {project && (
                    <ProjectForm
                        key={project.id}
                        defaultValues={{
                            name: project.name,
                            description: project.description ?? "",
                            status: project.status,
                        }}
                        onSubmit={handleSubmit}
                        disabled={updateProject.isPending}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
