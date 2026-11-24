import { EdenFetchError } from "@elysiajs/eden";
import {
    API_ERROR_STATUS,
    type ApiError,
    type ApiErrorCode,
    isApiErrorCode,
} from "@/core/common/api-errors";

/** The catalog code for a response without a (known) envelope. */
const byStatus = (status: number): ApiErrorCode => {
    if (status === 400 || status === 413) return "INVALID_BODY";
    if (status === 401) return "UNAUTHORIZED";
    if (status === 403) return "FORBIDDEN";
    if (status === 404) return "NOT_FOUND";
    if (status === 409) return "CONFLICT";
    if (status === 422) return "UNPROCESSABLE_ENTITY";
    if (status === 429) return "TOO_MANY_REQUESTS";
    return "INTERNAL_SERVER_ERROR";
};

const withCode = (code: ApiErrorCode, extra: object = {}): ApiError =>
    ({ code, status: API_ERROR_STATUS[code], ...extra }) as ApiError;

/**
 * Any thrown value as catalog data. Reads EdenFetchError's `.value` (its
 * `.message` is the value stringified, "[object Object]" for an envelope);
 * Eden reports a failed fetch as a 503 whose value is the thrown Error.
 */
export function toApiError(error: unknown): ApiError {
    if (error instanceof EdenFetchError) {
        const value: unknown = error.value;
        if (value instanceof Error) return withCode("NETWORK_ERROR");
        const v = (
            typeof value === "object" && value !== null ? value : {}
        ) as { code?: unknown; targets?: unknown };
        if (!isApiErrorCode(v.code)) return withCode(byStatus(error.status));
        const targets = Array.isArray(v.targets)
            ? v.targets.filter((t): t is string => typeof t === "string")
            : [];
        return withCode(v.code, targets.length ? { targets } : {});
    }
    if (error instanceof TypeError) return withCode("NETWORK_ERROR");
    return withCode("INTERNAL_SERVER_ERROR");
}

/** User-facing text per code (exhaustive by type). */
export const API_ERROR_MESSAGES: Record<ApiErrorCode, string> = {
    INVALID_BODY: "Revisa los datos e intenta de nuevo.",
    INVALID_ID: "El identificador no es válido.",
    INVALID_QUERY: "Los filtros de la búsqueda no son válidos.",
    UNAUTHORIZED: "Tu sesión expiró. Vuelve a iniciar sesión.",
    FORBIDDEN: "No tienes acceso a este recurso.",
    NOT_FOUND: "Este contenido ya no está disponible.",
    CONFLICT: "Ya existe un registro con estos datos.",
    UNPROCESSABLE_ENTITY: "No se pudo procesar la solicitud.",
    TOO_MANY_REQUESTS: "Demasiadas solicitudes. Espera un momento.",
    INTERNAL_SERVER_ERROR: "Algo falló en el servidor. Intenta de nuevo.",
    NETWORK_ERROR: "Sin conexión con el servidor.",
};

/** The message for any thrown value; never the raw object. */
export function apiErrorMessage(error: unknown): string {
    return API_ERROR_MESSAGES[toApiError(error).code];
}
