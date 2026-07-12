"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
    CreateProject,
    Project,
    UpdateProject,
} from "@/core/project/domain/types";
import { useElysia } from "@/frontend/lib/eden";

/** Bind the projects domain once; every call hangs off `client`. */
function useProjectsClient() {
    return useElysia().projects;
}

export function useProjects() {
    const client = useProjectsClient();
    const query = useQuery(client.get.queryOptions());
    return { ...query, projects: query.data?.response ?? [] };
}

export function useProject(id: string | undefined) {
    const client = useProjectsClient();
    return useQuery({
        ...client({ id: id ?? "" }).get.queryOptions(),
        enabled: !!id,
    });
}

export function useCreateProject() {
    const client = useProjectsClient();
    const queryClient = useQueryClient();
    const listKey = client.get.queryKey();
    return useMutation({
        ...client.post.mutationOptions(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
    });
}

export function useUpdateProject() {
    const client = useProjectsClient();
    const queryClient = useQueryClient();
    const listKey = client.get.queryKey();
    return useMutation({
        mutationFn: (vars: { id: string; data: UpdateProject }) =>
            client({ id: vars.id }).put.mutationOptions().mutationFn(vars.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
    });
}

export function useDeleteProject() {
    const client = useProjectsClient();
    const queryClient = useQueryClient();
    const listKey = client.get.queryKey();
    return useMutation({
        mutationFn: (id: string) =>
            client({ id }).delete.mutationOptions().mutationFn(undefined),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
    });
}

export type { CreateProject, Project, UpdateProject };
