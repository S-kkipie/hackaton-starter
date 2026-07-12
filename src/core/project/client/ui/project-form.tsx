"use client";

import { type FormEvent, useState } from "react";
import type {
    CreateProject,
    Project,
    ProjectStatus,
} from "@/core/project/domain/types";
import { Button } from "@/frontend/components/ui/button";
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";

export function ProjectForm({
    editing,
    submitting,
    onSubmit,
}: {
    editing: Project | null;
    submitting: boolean;
    onSubmit: (values: CreateProject) => void;
}) {
    const [name, setName] = useState(editing?.name ?? "");
    const [description, setDescription] = useState(editing?.description ?? "");
    const [status, setStatus] = useState<ProjectStatus>(
        editing?.status ?? "active",
    );

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({
            name: name.trim(),
            description: description.trim() || undefined,
            status,
        });
    }

    return (
        <DialogContent>
            <form onSubmit={handleSubmit} className="space-y-4">
                <DialogHeader>
                    <DialogTitle>
                        {editing ? "Edit project" : "New project"}
                    </DialogTitle>
                    <DialogDescription>
                        {editing
                            ? "Update your project details."
                            : "Add a new project."}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                        id="status"
                        value={status}
                        onChange={(e) =>
                            setStatus(e.target.value as ProjectStatus)
                        }
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                    >
                        <option value="active">active</option>
                        <option value="archived">archived</option>
                    </select>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button type="submit" disabled={submitting}>
                        {editing ? "Save" : "Create"}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
