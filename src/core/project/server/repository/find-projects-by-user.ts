import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/server/drizzle/db";
import {
    type ProjectRow,
    projects,
} from "@/server/drizzle/schemas/project-schema";

export async function findProjectsByUser(
    userId: string,
): Promise<ProjectRow[]> {
    return db
        .select()
        .from(projects)
        .where(eq(projects.userId, userId))
        .orderBy(desc(projects.createdAt));
}
