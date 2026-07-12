"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useElysia } from "@/frontend/lib/eden";

/**
 * Client hooks for the projects domain. Calls go through the Eden options proxy
 * (`useElysia()`) and return the response envelope (`{ response, code, status }`);
 * read records from `data.response`. `useGetById` stays disabled until a truthy
 * id; `useUpdate` closes over the target id at call-site, while `useDelete` takes
 * the id as a mutation variable so one hook instance can drive any of N cards.
 */
export const useProjects = () => {
    const client = useElysia().projects;
    const queryClient = useQueryClient();
    const LIST_KEY = client.get.queryKey();

    const useList = () => useQuery(client.get.queryOptions());

    const useGetById = (id: string | undefined) =>
        useQuery({
            ...client({ id: id ?? "" }).get.queryOptions(),
            enabled: !!id,
        });

    const useCreate = () =>
        useMutation(
            client.post.mutationOptions({
                onSuccess: () =>
                    queryClient.invalidateQueries({ queryKey: LIST_KEY }),
            }),
        );

    const useUpdate = (id: string) =>
        useMutation(
            client({ id }).put.mutationOptions({
                onSuccess: () =>
                    queryClient.invalidateQueries({ queryKey: LIST_KEY }),
            }),
        );

    const useDelete = () =>
        useMutation({
            mutationFn: (id: string) =>
                client({ id }).delete.mutationOptions().mutationFn(undefined),
            onSuccess: () =>
                queryClient.invalidateQueries({ queryKey: LIST_KEY }),
        });

    return { useList, useGetById, useCreate, useUpdate, useDelete };
};
