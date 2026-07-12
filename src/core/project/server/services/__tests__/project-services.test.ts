import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../repository/find-project-by-id", () => ({
    findProjectById: vi.fn(),
}));
vi.mock("../../repository/create-project", () => ({ createProject: vi.fn() }));
vi.mock("../../repository/delete-project", () => ({ deleteProject: vi.fn() }));

import { createProject } from "../../repository/create-project";
import { deleteProject } from "../../repository/delete-project";
import { findProjectById } from "../../repository/find-project-by-id";
import { createProjectService } from "../create-project-service";
import { deleteProjectService } from "../delete-project-service";
import { getProjectService } from "../get-project-service";

const row = {
    id: "p1",
    userId: "u1",
    name: "Alpha",
    description: null,
    status: "active" as const,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

describe("getProjectService", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns NOT_FOUND when the row is missing or foreign", async () => {
        vi.mocked(findProjectById).mockResolvedValue(null);
        const r = await getProjectService("u1", "p1");
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.code).toBe("NOT_FOUND");
    });

    it("maps a row to the ISO-string wire shape", async () => {
        vi.mocked(findProjectById).mockResolvedValue(row);
        const r = await getProjectService("u1", "p1");
        expect(r.ok).toBe(true);
        if (r.ok) {
            expect(r.data.createdAt).toBe("2026-01-01T00:00:00.000Z");
            expect(r.data.name).toBe("Alpha");
        }
    });
});

describe("createProjectService", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns the mapped created project", async () => {
        vi.mocked(createProject).mockResolvedValue(row);
        const r = await createProjectService("u1", { name: "Alpha" });
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.data.id).toBe("p1");
    });
});

describe("deleteProjectService", () => {
    beforeEach(() => vi.clearAllMocks());

    it("returns NOT_FOUND when nothing was deleted", async () => {
        vi.mocked(deleteProject).mockResolvedValue(null);
        const r = await deleteProjectService("u1", "p1");
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.code).toBe("NOT_FOUND");
    });
});
