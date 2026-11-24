import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
});

test("missing variables fail validation", async () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("SKIP_ENV_VALIDATION", "");
    await expect(import("@/config/env")).rejects.toThrow(
        /Invalid environment variables/,
    );
});

test("SKIP_ENV_VALIDATION=1 skips validation (CI builds, docker images)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("SKIP_ENV_VALIDATION", "1");
    const { env } = await import("@/config/env");
    expect(env.DATABASE_URL).toBeUndefined();
});
