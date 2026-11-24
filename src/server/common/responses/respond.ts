import "server-only";
import { type ElysiaCustomStatusResponse, status } from "elysia";
import { type APISuccessResponse, CommonResponse } from "./api";
import type { AppError, AppResult } from "./app-error";
import { errorToResponse } from "./error-converter";
import type { ApiErrorStatus } from "./status";

type ErrorEnvelope<S extends ApiErrorStatus> = {
    code: string;
    status: S;
    targets?: string[];
};

/** One status response per error status, so a route's `errorResponses` map accepts any of them. */
export type FailureResponse = {
    [S in ApiErrorStatus]: ElysiaCustomStatusResponse<S, ErrorEnvelope<S>>;
}[ApiErrorStatus];

type SuccessResponse<T, S extends 200 | 201> = S extends 201
    ? ElysiaCustomStatusResponse<201, APISuccessResponse<T, "CREATED", 201>>
    : ElysiaCustomStatusResponse<200, APISuccessResponse<T, "OK", 200>>;

/** The error envelope with the error's own status. */
export const failure = (error: AppError): FailureResponse =>
    status(error.status, errorToResponse(error)) as FailureResponse;

/**
 * A service result as the route's response: the data in the success envelope,
 * or the error envelope with the error's status. Pair it with
 * `response: { 200: …, ...errorResponses }` on the route.
 */
export const respond = <T, S extends 200 | 201>(
    result: AppResult<T>,
    okStatus: S,
): SuccessResponse<T, S> | FailureResponse => {
    if (!result.ok) return failure(result.error);
    return (
        okStatus === 201
            ? status(201, CommonResponse.created({ response: result.data }))
            : status(200, CommonResponse.successful({ response: result.data }))
    ) as SuccessResponse<T, S>;
};
