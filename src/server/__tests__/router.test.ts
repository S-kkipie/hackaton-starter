import { afterEach, describe, expect, test, vi } from "vitest";
import { AppErrors, err, ok } from "@/server/common/responses";

const services = vi.hoisted(() => ({
    getProjectService: vi.fn(),
    createProjectService: vi.fn(),
}));

vi.mock("@/core/project/server/services/get-project-service", () => ({
    getProjectService: services.getProjectService,
}));
vi.mock("@/core/project/server/services/create-project-service", () => ({
    createProjectService: services.createProjectService,
}));

import { auth } from "@/server/auth/auth";
import app from "@/server/router";

const json = (method: string, path: string, body: unknown) =>
    new Request(`http://localhost${path}`, {
        method,
        headers: { "content-type": "application/json" },
        body: typeof body === "string" ? body : JSON.stringify(body),
    });

const signedIn = () =>
    vi.spyOn(auth.api, "getSession").mockResolvedValue({
        user: { id: "user-1" },
        session: { id: "session-1" },
    } as never);

const project = {
    id: "p1",
    userId: "user-1",
    name: "Demo",
    description: null,
    status: "active" as const,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
};

afterEach(() => vi.restoreAllMocks());

describe("error envelopes", () => {
    test("an unknown /api/v1 route is a 404 NOT_FOUND envelope (better-auth does not swallow it)", async () => {
        const res = await app.handle(
            new Request("http://localhost/api/v1/nope"),
        );
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({ code: "NOT_FOUND", status: 404 });
    });

    test("Better Auth still answers its own routes under /api/v1/auth", async () => {
        const res = await app.handle(
            new Request("http://localhost/api/v1/auth/ok"),
        );
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ ok: true });
    });

    test("Better Auth reads its own request body (Elysia leaves it unparsed)", async () => {
        const res = await app.handle(
            json("POST", "/api/v1/auth/sign-in/email", { email: "a@b.co" }),
        );
        expect(res.status).toBe(400);
        expect(await res.json()).toMatchObject({ code: "VALIDATION_ERROR" });
    });

    test("a zod validation error is INVALID_BODY with the field paths as targets", async () => {
        signedIn();
        const res = await app.handle(
            json("POST", "/api/v1/projects", { name: "", description: 1 }),
        );
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({
            code: "INVALID_BODY",
            status: 400,
            targets: ["name", "description"],
        });
    });

    test("unparseable JSON is INVALID_BODY without targets", async () => {
        signedIn();
        const res = await app.handle(json("POST", "/api/v1/projects", "{bad"));
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ code: "INVALID_BODY", status: 400 });
    });

    test("no session is a 401 UNAUTHORIZED envelope", async () => {
        vi.spyOn(auth.api, "getSession").mockResolvedValue(null);
        const res = await app.handle(
            new Request("http://localhost/api/v1/projects/p1"),
        );
        expect(res.status).toBe(401);
        expect(await res.json()).toEqual({
            code: "UNAUTHORIZED",
            status: 401,
        });
    });
});

describe("project routes answer with the service result's status", () => {
    test("a missing project is a 404 with its targets", async () => {
        signedIn();
        services.getProjectService.mockResolvedValue(
            err(AppErrors.notFound({ targets: ["id"] })),
        );
        const res = await app.handle(
            new Request("http://localhost/api/v1/projects/p1"),
        );
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({
            code: "NOT_FOUND",
            status: 404,
            targets: ["id"],
        });
    });

    test("a created project is a 201 CREATED envelope", async () => {
        signedIn();
        services.createProjectService.mockResolvedValue(ok(project));
        const res = await app.handle(
            json("POST", "/api/v1/projects", { name: "Demo" }),
        );
        expect(res.status).toBe(201);
        expect(await res.json()).toEqual({
            response: project,
            code: "CREATED",
            status: 201,
        });
    });

    test("an unexpected service failure is a 500 without the cause", async () => {
        signedIn();
        services.getProjectService.mockResolvedValue(
            err(AppErrors.unexpected(new Error("db down"))),
        );
        const res = await app.handle(
            new Request("http://localhost/api/v1/projects/p1"),
        );
        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({
            code: "INTERNAL_SERVER_ERROR",
            status: 500,
        });
    });
});

test("Next hands the router every HTTP method a route uses", async () => {
    const handlers: Record<string, unknown> = await import(
        "@/app/api/v1/[...slugs]/route"
    );
    const methods = new Set(
        app.routes
            .map((r) => r.method.toUpperCase())
            .filter((m) => m !== "ALL"),
    );
    for (const method of methods)
        expect(handlers[method], method).toBe(app.fetch);
});
