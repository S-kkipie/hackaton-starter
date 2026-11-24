import {
    defaultShouldDehydrateQuery,
    isServer,
    MutationCache,
    QueryClient,
} from "@tanstack/react-query";
import { notifyMutationError } from "@/frontend/lib/mutation-errors";

/** A QueryClient whose failed mutations toast the catalog message (opt out with `meta.silent`). */
export function makeQueryClient() {
    return new QueryClient({
        mutationCache: new MutationCache({
            onError: (error, variables, _result, mutation) =>
                notifyMutationError(error, variables, mutation.meta),
        }),
        defaultOptions: {
            queries: { staleTime: 5000, throwOnError: true },
            mutations: { retry: 0 },
            dehydrate: {
                shouldDehydrateQuery: (query) =>
                    defaultShouldDehydrateQuery(query) ||
                    query.state.status === "pending",
            },
        },
    });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
    if (isServer) return makeQueryClient();
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
}
