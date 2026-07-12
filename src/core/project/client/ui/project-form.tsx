"use client";

import type { AnyFieldApi } from "@tanstack/react-form";
import { z } from "zod";
import {
    createProjectSchema,
    projectStatusSchema,
} from "@/core/project/domain/schemas";
import type { Project, ProjectStatus } from "@/core/project/domain/types";
import { Button } from "@/frontend/components/ui/button";
import {
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/frontend/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/frontend/components/ui/field";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { useAppForm } from "@/frontend/hooks/use-tanstack-form";

function getFieldErrors(field: AnyFieldApi) {
    return field.state.meta.errors.map((error) => ({
        message: String(error?.message ?? error),
    }));
}

/**
 * The form always carries concrete (non-optional) values for every field, so
 * validation runs against a variant of {@link createProjectSchema} where
 * `description`/`status` are required strings rather than optional - this
 * keeps the TanStack Form value type and the zod input type identical.
 * `description` still accepts `""` (no min-length constraint); an empty value
 * is mapped back in `onSubmit` to `undefined` when creating (createProjectSchema's
 * `description` is optional, not nullable) or `null` when editing (so the PUT
 * body explicitly clears an existing description via `updateProjectSchema`,
 * which allows `null`).
 */
const projectFormSchema = createProjectSchema.extend({
    description: z.string().max(2000),
    status: projectStatusSchema,
});

export function ProjectForm({
    editing,
    submitting,
    onSubmit,
}: {
    editing: Project | null;
    submitting: boolean;
    onSubmit: (values: {
        name: string;
        description?: string | null;
        status: ProjectStatus;
    }) => void;
}) {
    const form = useAppForm({
        defaultValues: {
            name: editing?.name ?? "",
            description: editing?.description ?? "",
            status: (editing?.status ?? "active") as ProjectStatus,
        },
        validators: {
            onChange: projectFormSchema,
        },
        onSubmit: ({ value }) => {
            const trimmedDescription = value.description.trim();
            onSubmit({
                ...value,
                description: trimmedDescription
                    ? trimmedDescription
                    : editing
                      ? null
                      : undefined,
            });
        },
    });

    return (
        <DialogContent>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                }}
                className="space-y-4"
            >
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

                <form.Field name="name">
                    {(field) => {
                        const hasError = !field.state.meta.isValid;
                        return (
                            <Field data-invalid={hasError}>
                                <FieldLabel htmlFor={field.name}>
                                    Name
                                </FieldLabel>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                        field.handleChange(e.target.value)
                                    }
                                    aria-invalid={hasError}
                                />
                                {hasError && (
                                    <FieldError
                                        errors={getFieldErrors(field)}
                                    />
                                )}
                            </Field>
                        );
                    }}
                </form.Field>

                <form.Field name="description">
                    {(field) => {
                        const hasError = !field.state.meta.isValid;
                        return (
                            <Field data-invalid={hasError}>
                                <FieldLabel htmlFor={field.name}>
                                    Description
                                </FieldLabel>
                                <Textarea
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value ?? ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                        field.handleChange(e.target.value)
                                    }
                                    rows={3}
                                    aria-invalid={hasError}
                                />
                                {hasError && (
                                    <FieldError
                                        errors={getFieldErrors(field)}
                                    />
                                )}
                            </Field>
                        );
                    }}
                </form.Field>

                <form.Field name="status">
                    {(field) => {
                        const hasError = !field.state.meta.isValid;
                        return (
                            <Field data-invalid={hasError}>
                                <FieldLabel htmlFor={field.name}>
                                    Status
                                </FieldLabel>
                                <select
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                        field.handleChange(
                                            e.target.value as ProjectStatus,
                                        )
                                    }
                                    aria-invalid={hasError}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                                >
                                    <option value="active">active</option>
                                    <option value="archived">archived</option>
                                </select>
                                {hasError && (
                                    <FieldError
                                        errors={getFieldErrors(field)}
                                    />
                                )}
                            </Field>
                        );
                    }}
                </form.Field>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Cancel
                        </Button>
                    </DialogClose>
                    <form.Subscribe selector={(state) => state.canSubmit}>
                        {(canSubmit) => (
                            <Button
                                type="submit"
                                disabled={submitting || !canSubmit}
                            >
                                {editing ? "Save" : "Create"}
                            </Button>
                        )}
                    </form.Subscribe>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
