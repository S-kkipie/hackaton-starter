import "server-only";
import type { Project } from "@/core/project/domain/types";
import {
    AppErrors,
    type AsyncAppResult,
    err,
    ok,
} from "@/server/common/responses";
import { findProjectsByUser } from "../repository/find-projects-by-user";
import { toProject } from "../repository/utils";

export async function listProjectsService(
    userId: string,
): AsyncAppResult<Project[]> {
    try {
        const rows = await findProjectsByUser(userId);
        return ok(rows.map(toProject));
    } catch (cause) {
        return err(AppErrors.unexpected(cause));
    }
}
