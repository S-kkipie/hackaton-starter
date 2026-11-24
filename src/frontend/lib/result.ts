import type {
    AppError,
    AppResult,
    AsyncAppResult,
} from "@/server/common/responses";

/**
 * Error wrapper for an {@link AppError}. Lets a typed domain failure travel
 * through a thrown/rejected path — `use(promise)`, React Query, an
 * `ErrorBoundary` — while preserving the original `code`/`status` for typed
 * handling and localized messaging.
 */
export class AppErrorException extends Error {
    /** The structured domain error this exception carries. */
    readonly appError: AppError;

    constructor(appError: AppError) {
        super(`AppError: ${appError.code}`, {
            cause: "cause" in appError ? appError.cause : undefined,
        });
        this.name = "AppErrorException";
        this.appError = appError;
    }
}

/** Type guard for {@link AppErrorException}. */
export function isAppErrorException(
    error: unknown,
): error is AppErrorException {
    return error instanceof AppErrorException;
}

/**
 * Unwraps a settled {@link AppResult}: returns its data, or throws an
 * {@link AppErrorException} on the error branch. Use at a throw/reject seam
 * (e.g. feeding `use()` behind an `ErrorBoundary`).
 */
export function unwrapResult<T>(result: AppResult<T>): T {
    if (!result.ok) throw new AppErrorException(result.error);
    return result.data;
}

/**
 * Flattens a service's `AppResult` promise into a `Promise<T>` that rejects
 * with a typed {@link AppErrorException} on failure. Services never reject —
 * they resolve to ok/err — so this is the seam that turns the err branch into a
 * catchable rejection for Suspense + ErrorBoundary.
 */
export async function resolveResult<T>(promise: AsyncAppResult<T>): Promise<T> {
    return unwrapResult(await promise);
}
