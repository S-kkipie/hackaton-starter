import "server-only";
import { z } from "zod";
import type { ApiErrorStatus, ApiStatus } from "./status";
import { STATUS_MAP } from "./status";

export type APIResponse<D = undefined> = {
    response?: D;
    targets?: string[];
    code: string;
    status: ApiStatus;
};

export type APISuccessResponse<
    D = undefined,
    C extends string = "OK",
    S extends number = 200,
> = {
    response: D;
    code: C;
    status: S;
};

export type APIErrorResponse<C extends string = string> = {
    code: C;
    status: ApiErrorStatus;
    targets?: string[];
};

type SuccessfulParams<T, C extends string = "OK"> = { response?: T; code?: C };

export const errorResponseSchema = <S extends ApiErrorStatus = 500>(
    status: S = 500 as S,
) =>
    z
        .object({
            code: z.string().describe(`example: ${STATUS_MAP[status]}`),
            status: z.literal(status).describe(`example: ${status}`),
            targets: z
                .array(z.string())
                .optional()
                .describe('example: ["name"]'),
        })
        .describe("ErrorResponse");

/** The error envelope schema for every error status a service result can carry (spread into a route's `response`). */
export const errorResponses = {
    400: errorResponseSchema(400),
    401: errorResponseSchema(401),
    403: errorResponseSchema(403),
    404: errorResponseSchema(404),
    409: errorResponseSchema(409),
    422: errorResponseSchema(422),
    429: errorResponseSchema(429),
    500: errorResponseSchema(500),
};

export const successResponseSchema = <T extends z.ZodTypeAny>(
    dataSchema: T,
    modelName: string,
) =>
    z
        .object({
            response: dataSchema,
            code: z.literal("OK"),
            status: z.literal(200),
        })
        .describe(`${modelName}SuccessResponse`);

export const createdResponseSchema = <T extends z.ZodTypeAny>(
    dataSchema: T,
    modelName: string,
) =>
    z
        .object({
            response: dataSchema,
            code: z.literal("CREATED"),
            status: z.literal(201),
        })
        .describe(`${modelName}CreatedResponse`);

export const CommonResponse = {
    successful<T = undefined, C extends string = "OK">(
        params?: SuccessfulParams<T, C>,
    ): APISuccessResponse<T, C, 200> {
        return {
            response: params?.response as T,
            code: (params?.code ?? "OK") as C,
            status: 200,
        };
    },
    created<T = undefined, C extends string = "CREATED">(
        params?: SuccessfulParams<T, C>,
    ): APISuccessResponse<T, C, 201> {
        return {
            response: params?.response as T,
            code: (params?.code ?? "CREATED") as C,
            status: 201,
        };
    },
    unauthorized(): APIErrorResponse<"UNAUTHORIZED"> {
        return { code: "UNAUTHORIZED", status: 401 };
    },
    forbidden({ code = "FORBIDDEN" }: { code?: string } = {}): APIResponse {
        return { code, status: 403 };
    },
    notFound({
        code = "NOT_FOUND",
        targets,
    }: {
        code?: string;
        targets?: string[];
    } = {}): APIResponse {
        return { code, status: 404, targets };
    },
    conflict({
        code = "CONFLICT",
        targets,
    }: {
        code?: string;
        targets?: string[];
    } = {}): APIResponse {
        return { code, status: 409, targets };
    },
    internalServerError({
        code = "INTERNAL_SERVER_ERROR",
    }: {
        code?: string;
    } = {}): APIResponse {
        return { code, status: 500 };
    },
} as const;
