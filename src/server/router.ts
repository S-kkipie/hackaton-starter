import "server-only";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { serverTiming } from "@elysiajs/server-timing";
import { elysiaLogger } from "@logtape/elysia";
import { getLogger } from "@logtape/logtape";
import { Elysia } from "elysia";
import { z } from "zod";
import { ServerConfig } from "@/config/server-config";
import { projectRouter } from "@/core/project/server/api/router";
import { auth } from "./auth/auth";
import {
    type APIErrorResponse,
    AppErrors,
    errorToResponse,
    validationTargets,
} from "./common/responses";

const apiErrorLogger = getLogger(["server", "error"]);

// Better Auth answers under /api/v1/auth only: a root `.mount(auth.handler)`
// would catch every unknown /api/v1 route and answer it with an empty 404.
// `parse: "none"` leaves the body for Better Auth to read.
const betterAuthPlugin = new Elysia({ name: "better-auth" }).all(
    "/auth/*",
    ({ request }) => auth.handler(request),
    { parse: "none", detail: { hide: true } },
);

// OpenAPI (Scalar UI at /api/v1/openapi) is dev-only.
const docs = new Elysia({ name: "docs" });
if (ServerConfig.isDevelopment) {
    docs.use(
        openapi({
            documentation: {
                info: {
                    title: ServerConfig.info.name,
                    version: ServerConfig.info.version,
                    description: ServerConfig.info.description,
                },
            },
            mapJsonSchema: { zod: z.toJSONSchema },
        }),
    );
}

const app = new Elysia({ prefix: "/api/v1" })
    .use(betterAuthPlugin)
    .use(
        cors({
            origin: [ServerConfig.baseUrl],
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization"],
        }),
    )
    .use(docs)
    .use(serverTiming())
    .use(elysiaLogger())
    .onError(({ error, code, set, request, path }) => {
        if (code === "NOT_FOUND") {
            set.status = 404;
            return errorToResponse(AppErrors.notFound());
        }
        if (code === "VALIDATION" || code === "PARSE") {
            set.status = 400;
            return errorToResponse(
                AppErrors.invalidBody({
                    targets:
                        code === "VALIDATION"
                            ? validationTargets(error)
                            : undefined,
                }),
            );
        }
        apiErrorLogger.error(
            "Unhandled API error {code} on {method} {path}: {error}",
            {
                code,
                method: request.method,
                path,
                error:
                    error instanceof Error
                        ? (error.stack ?? error.message)
                        : String(error),
            },
        );
        set.status = 500;
        return {
            code: "INTERNAL_SERVER_ERROR",
            status: 500,
        } satisfies APIErrorResponse;
    })
    .use(projectRouter);

export default app;
export type AppRouter = typeof app;
