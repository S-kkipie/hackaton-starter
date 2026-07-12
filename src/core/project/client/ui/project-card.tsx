"use client";

import type { Project } from "@/core/project/domain/types";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/frontend/components/ui/card";

export function ProjectCard({
    project,
    onEdit,
    onDelete,
    deleting,
}: {
    project: Project;
    onEdit: (project: Project) => void;
    onDelete: (id: string) => void;
    deleting: boolean;
}) {
    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="truncate">{project.name}</CardTitle>
                <Badge
                    variant={
                        project.status === "active" ? "default" : "secondary"
                    }
                >
                    {project.status}
                </Badge>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
                {project.description || "No description"}
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(project)}
                >
                    Edit
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleting}
                    onClick={() => onDelete(project.id)}
                >
                    Delete
                </Button>
            </CardFooter>
        </Card>
    );
}
