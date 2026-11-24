/**
 * The API error catalog, shared by the server (envelopes) and the client
 * (messages). An error envelope carries data only: `{ code, status, targets? }`;
 * the client owns every text (`frontend/lib/api-error.ts`). Add a domain code
 * here, give it an `AppErrors` factory and a message, and both sides follow.
 */
export const API_ERROR_STATUS = {
    /** zod/Elysia validation or unparseable JSON; `targets` holds the field paths ("items.3.name"). */
    INVALID_BODY: 400,
    INVALID_ID: 400,
    INVALID_QUERY: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    /** A missing resource or an unknown route. */
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    /** Client only: the request got no response. */
    NETWORK_ERROR: 0,
} as const;

export type ApiErrorCode = keyof typeof API_ERROR_STATUS;
export type ServerErrorCode = Exclude<ApiErrorCode, "NETWORK_ERROR">;

export type ApiError<C extends ApiErrorCode = ApiErrorCode> =
    C extends ApiErrorCode
        ? {
              code: C;
              status: (typeof API_ERROR_STATUS)[C];
              targets?: string[];
          }
        : never;

export const isApiErrorCode = (value: unknown): value is ApiErrorCode =>
    typeof value === "string" && Object.hasOwn(API_ERROR_STATUS, value);
