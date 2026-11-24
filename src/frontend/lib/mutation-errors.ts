import { toast } from "sonner";
import type { ApiErrorCode } from "@/core/common/api-errors";
import { apiErrorMessage, toApiError } from "@/frontend/lib/api-error";

export interface ErrorAction {
    label: string;
    /** Gets the variables of the failed mutation (e.g. to retry it). */
    onClick: (variables: unknown) => void;
}

export interface AppMutationMeta extends Record<string, unknown> {
    /** true: never toast; a list: those codes are shown by the hook itself. */
    silent?: true | ApiErrorCode[];
    /** A toast button per code, e.g. "Reintentar" on INTERNAL_SERVER_ERROR. */
    actions?: Partial<Record<ApiErrorCode, ErrorAction>>;
}

declare module "@tanstack/react-query" {
    interface Register {
        mutationMeta: AppMutationMeta;
    }
}

/** The MutationCache's onError: one toast per failed mutation unless the hook opts out. */
export function notifyMutationError(
    error: unknown,
    variables: unknown,
    meta: AppMutationMeta | undefined,
): void {
    const { code } = toApiError(error);
    if (meta?.silent === true || meta?.silent?.includes(code)) return;
    const action = meta?.actions?.[code];
    toast.error(apiErrorMessage(error), {
        id: code,
        ...(action
            ? {
                  duration: Number.POSITIVE_INFINITY,
                  action: {
                      label: action.label,
                      onClick: () => action.onClick(variables),
                  },
              }
            : {}),
    });
}
