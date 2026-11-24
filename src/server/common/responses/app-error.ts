import "server-only";
import {
    API_ERROR_STATUS,
    type ServerErrorCode,
} from "@/core/common/api-errors";
import type { Result } from "./result";

/**
 * An expected failure: a catalog code (`core/common/api-errors.ts`) with its
 * status, the field paths it concerns, and the cause for the server log.
 */
export type AppError = {
    [C in ServerErrorCode]: {
        code: C;
        status: (typeof API_ERROR_STATUS)[C];
        targets?: string[];
        cause?: unknown;
    };
}[ServerErrorCode];

export type AppResult<T> = Result<T, AppError>;
export type AsyncAppResult<T> = Promise<AppResult<T>>;

type Extra = { targets?: string[]; cause?: unknown };

const appError = <C extends ServerErrorCode>(
    code: C,
    { targets, cause }: Extra = {},
): Extract<AppError, { code: C }> =>
    ({
        code,
        status: API_ERROR_STATUS[code],
        ...(targets ? { targets } : {}),
        ...(cause !== undefined ? { cause } : {}),
    }) as Extract<AppError, { code: C }>;

export const AppErrors = {
    invalidBody: (params?: Extra) => appError("INVALID_BODY", params),
    invalidId: (params?: Extra) => appError("INVALID_ID", params),
    invalidQuery: (params?: Extra) => appError("INVALID_QUERY", params),
    unauthorized: (cause?: unknown) => appError("UNAUTHORIZED", { cause }),
    forbidden: (cause?: unknown) => appError("FORBIDDEN", { cause }),
    notFound: (params?: Extra) => appError("NOT_FOUND", params),
    conflict: (params?: Extra) => appError("CONFLICT", params),
    tooManyRequests: (params?: { cause?: unknown }) =>
        appError("TOO_MANY_REQUESTS", params),
    unprocessableEntity: (params?: Extra) =>
        appError("UNPROCESSABLE_ENTITY", params),
    unexpected: (cause: unknown) =>
        appError("INTERNAL_SERVER_ERROR", { cause }),
} as const;

/**
 * Compile-time check: a new catalog code without a factory makes `Missing`'s
 * default (the uncovered codes) fail its `never` constraint.
 */
export type EveryCodeHasAFactory<
    Missing extends never = Exclude<
        ServerErrorCode,
        ReturnType<(typeof AppErrors)[keyof typeof AppErrors]>["code"]
    >,
> = Missing;
