import { describe, expect, it } from "vitest";
import {
    createProjectSchema,
    projectSchema,
    updateProjectSchema,
} from "../schemas";

describe("createProjectSchema", () => {
    it("accepts a name and optional fields", () => {
        const parsed = createProjectSchema.parse({ name: "Launch" });
        expect(parsed.name).toBe("Launch");
    });

    it("rejects an empty name", () => {
        expect(createProjectSchema.safeParse({ name: "" }).success).toBe(false);
    });

    it("rejects a whitespace-only name", () => {
        expect(createProjectSchema.safeParse({ name: "   " }).success).toBe(
            false,
        );
    });

    it("trims a padded name", () => {
        expect(createProjectSchema.parse({ name: "  Launch  " }).name).toBe(
            "Launch",
        );
    });

    it("rejects an unknown status", () => {
        expect(
            createProjectSchema.safeParse({ name: "x", status: "nope" })
                .success,
        ).toBe(false);
    });
});

describe("updateProjectSchema", () => {
    it("allows a partial update", () => {
        expect(
            updateProjectSchema.safeParse({ status: "archived" }).success,
        ).toBe(true);
    });

    it("allows description to be nulled", () => {
        expect(
            updateProjectSchema.safeParse({ description: null }).success,
        ).toBe(true);
    });
});

describe("projectSchema", () => {
    it("requires ISO string timestamps", () => {
        const ok = projectSchema.safeParse({
            id: "p1",
            userId: "u1",
            name: "A",
            description: null,
            status: "active",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
        });
        expect(ok.success).toBe(true);
    });
});
