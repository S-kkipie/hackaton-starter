// @vitest-environment happy-dom
import { expect, test, vi } from "vitest";
import { createApiClient } from "@/frontend/lib/eden";

test("in the browser the API client calls the page's own origin", async () => {
    (
        window as unknown as { happyDOM: { setURL: (url: string) => void } }
    ).happyDOM.setURL("http://192.168.1.20:4000/projects");
    const fetcher = vi.fn(
        async (_input: RequestInfo | URL, _init?: RequestInit) =>
            new Response(JSON.stringify({ ok: true }), {
                headers: { "content-type": "application/json" },
            }),
    );
    await createApiClient(
        undefined,
        fetcher as typeof fetch,
    ).api.v1.projects.get({ query: {} as never });
    expect(String(fetcher.mock.calls[0]?.[0])).toMatch(
        /^http:\/\/192\.168\.1\.20:4000\/api\/v1\/projects/,
    );
});

test("an explicit origin wins (server side and tests)", async () => {
    const fetcher = vi.fn(
        async (_input: RequestInfo | URL, _init?: RequestInit) =>
            new Response("{}", {
                headers: { "content-type": "application/json" },
            }),
    );
    await createApiClient(
        "http://api.test",
        fetcher as typeof fetch,
    ).api.v1.projects.get({ query: {} as never });
    expect(String(fetcher.mock.calls[0]?.[0])).toMatch(
        /^http:\/\/api\.test\/api\/v1\/projects/,
    );
});
