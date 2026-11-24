// @vitest-environment happy-dom
import { EdenFetchError } from "@elysiajs/eden";
import { QueryClientProvider, useMutation } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import type { AppMutationMeta } from "@/frontend/lib/mutation-errors";
import { makeQueryClient } from "@/frontend/lib/query-client";

const toastError = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { error: toastError } }));
beforeEach(() => toastError.mockClear());

const failWith = (value: unknown, status: number, meta?: AppMutationMeta) => {
    const client = makeQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return renderHook(
        () =>
            useMutation({
                mutationFn: async (_: { n: number }) => {
                    throw new EdenFetchError(status, value);
                },
                meta,
            }),
        { wrapper },
    );
};

test("a failed mutation toasts the catalog message", async () => {
    const { result } = failWith({ code: "NOT_FOUND", status: 404 }, 404);
    act(() => result.current.mutate({ n: 1 }));
    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(toastError.mock.calls[0]?.[0]).toBe(
        "Este contenido ya no está disponible.",
    );
});

test("meta.silent true, or listing the code, stops the toast", async () => {
    const all = failWith({ code: "CONFLICT", status: 409 }, 409, {
        silent: true,
    });
    act(() => all.result.current.mutate({ n: 1 }));
    await waitFor(() => expect(all.result.current.isError).toBe(true));
    const some = failWith(new TypeError("fetch failed"), 503, {
        silent: ["NETWORK_ERROR"],
    });
    act(() => some.result.current.mutate({ n: 1 }));
    await waitFor(() => expect(some.result.current.isError).toBe(true));
    expect(toastError).not.toHaveBeenCalled();
});

test("a custom action for the code is added and gets the mutation variables", async () => {
    const onClick = vi.fn();
    const { result } = failWith(
        { code: "INTERNAL_SERVER_ERROR", status: 500 },
        500,
        {
            actions: {
                INTERNAL_SERVER_ERROR: { label: "Reintentar", onClick },
            },
        },
    );
    act(() => result.current.mutate({ n: 7 }));
    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    const options = toastError.mock.calls[0]?.[1] as {
        action: { label: string; onClick: () => void };
    };
    expect(options.action.label).toBe("Reintentar");
    options.action.onClick();
    expect(onClick).toHaveBeenCalledWith({ n: 7 });
});
