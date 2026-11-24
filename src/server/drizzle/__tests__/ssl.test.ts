import { expect, test } from "vitest";
import { sslFor } from "@/server/drizzle/ssl";

test("a hosted database gets SSL; a local one or sslmode=disable does not", () => {
    expect(sslFor("postgresql://u:p@db.example.neon.tech/app")).toEqual({
        rejectUnauthorized: false,
    });
    expect(sslFor("postgresql://dev:dev@localhost:5432/app")).toBe(false);
    expect(sslFor("postgresql://dev:dev@127.0.0.1:5432/app")).toBe(false);
    expect(sslFor("postgresql://u:p@db.example.com/app?sslmode=disable")).toBe(
        false,
    );
});

test("a missing or unparsable URL (build without env) keeps the default instead of throwing", () => {
    expect(sslFor("")).toEqual({ rejectUnauthorized: false });
    expect(sslFor("undefined")).toEqual({ rejectUnauthorized: false });
});
