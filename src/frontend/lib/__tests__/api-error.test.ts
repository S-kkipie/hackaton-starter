import { EdenFetchError } from "@elysiajs/eden";
import { expect, test } from "vitest";
import { API_ERROR_STATUS, type ApiErrorCode } from "@/core/common/api-errors";
import {
    API_ERROR_MESSAGES,
    apiErrorMessage,
    toApiError,
} from "@/frontend/lib/api-error";

test("an Eden error with an envelope keeps code and targets", () => {
    expect(
        toApiError(
            new EdenFetchError(400, {
                code: "INVALID_BODY",
                status: 400,
                targets: ["name", 7],
            }),
        ),
    ).toEqual({ code: "INVALID_BODY", status: 400, targets: ["name"] });
    expect(
        toApiError(new EdenFetchError(409, { code: "CONFLICT", status: 409 })),
    ).toEqual({ code: "CONFLICT", status: 409 });
});

test("an Eden error with a string, null or unknown code falls back on the status", () => {
    expect(toApiError(new EdenFetchError(404, "Not Found")).code).toBe(
        "NOT_FOUND",
    );
    expect(toApiError(new EdenFetchError(500, null)).code).toBe(
        "INTERNAL_SERVER_ERROR",
    );
    expect(toApiError(new EdenFetchError(401, { code: "WHAT" })).code).toBe(
        "UNAUTHORIZED",
    );
    expect(toApiError(new EdenFetchError(400, { code: 1 })).code).toBe(
        "INVALID_BODY",
    );
    expect(toApiError(new EdenFetchError(413, "too large")).code).toBe(
        "INVALID_BODY",
    );
    expect(toApiError(new EdenFetchError(429, "slow down")).code).toBe(
        "TOO_MANY_REQUESTS",
    );
});

test("a failed fetch is NETWORK_ERROR: Eden wraps the TypeError in a 503, plain fetch throws it", () => {
    expect(
        toApiError(new EdenFetchError(503, new TypeError("fetch failed"))),
    ).toEqual({ code: "NETWORK_ERROR", status: 0 });
    expect(toApiError(new TypeError("Failed to fetch")).code).toBe(
        "NETWORK_ERROR",
    );
    expect(toApiError("boom").code).toBe("INTERNAL_SERVER_ERROR");
    expect(toApiError({ value: { message: "x" } }).code).toBe(
        "INTERNAL_SERVER_ERROR",
    );
});

test("no error ever reads [object Object] (EdenFetchError's own message does)", () => {
    const e = new EdenFetchError(409, { code: "CONFLICT", status: 409 });
    expect(e.message).toBe("[object Object]");
    for (const value of [
        e,
        new EdenFetchError(500, { a: 1 }),
        new EdenFetchError(503, new TypeError("x")),
        {},
        null,
        undefined,
        new Error("y"),
    ])
        expect(apiErrorMessage(value)).not.toContain("[object Object]");
    expect(apiErrorMessage(e)).toBe("Ya existe un registro con estos datos.");
});

test("every catalog code has a message", () => {
    for (const code of Object.keys(API_ERROR_STATUS) as ApiErrorCode[])
        expect(API_ERROR_MESSAGES[code]).toMatch(/\S/);
});
