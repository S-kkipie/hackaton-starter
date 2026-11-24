import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

const root = join(import.meta.dirname, "../..");
const responses = "server/common/responses";
const files = [
    "server/router.ts",
    "server/logger.ts",
    "config/server-config.ts",
    ...readdirSync(join(root, responses))
        .filter((f) => f.endsWith(".ts"))
        .map((f) => `${responses}/${f}`),
];

test.each(files)("%s refuses to load in a client bundle", (file) => {
    const source = readFileSync(join(root, file), "utf8");
    expect(source.trimStart().startsWith('import "server-only";')).toBe(true);
});
