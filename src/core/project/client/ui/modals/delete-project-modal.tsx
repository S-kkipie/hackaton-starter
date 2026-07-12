"use client";

import { toast } from "sonner";
import type { Project } from "@/core/project/domain/types";
import { Button } from "@/frontend/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/frontend/components/ui/dialog";
import { useProjects } from "../../hooks";

interface DeleteProjectModalProps {
    /** The project to delete, or `null` when the modal is closed. */
    project: Project | null;
    onClose: () => void;
}

/** Confirmation modal for deleting a project. */
export function DeleteProjectModal({
    project,
    onClose,
}: DeleteProjectModalProps) {
    const { useDelete } = useProjects();
    const deleteProject = useDelete();

    function handleDelete() {
        if (!project) return;
        deleteProject.mutate(project.id, {
            onSuccess: () => {
                toast.success("Project deleted");
                onClose();
            },
            onError: () => toast.error("Delete failed"),
        });
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
                    <DialogTitle>Delete project</DialogTitle>
                    <DialogDescription>
                        {project
                            ? `This will permanently delete "${project.name}". This action cannot be undone.`
                            : ""}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </DialogClose>
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
    );
}
