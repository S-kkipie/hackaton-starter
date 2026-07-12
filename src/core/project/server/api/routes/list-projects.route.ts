import { Elysia } from "elysia";
import { z } from "zod";
import { projectSchema } from "@/core/project/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    CommonResponse,
    errorResponseSchema,
    errorToResponse,
    successResponseSchema,
} from "@/server/common/responses";
import { listProjectsService } from "../../services/list-projects-service";

export const listProjectsRoute = new Elysia().use(authed).get(
    "/",
    async ({ user, status }) => {
        const result = await listProjectsService(user.id);
        if (!result.ok)
            return status(
                result.error.status as 500,
                errorToResponse(result.error),
            );
        return status(
            200,
            CommonResponse.successful({ response: result.data }),
        );
    },
    {
        authed: true,
        response: {
            200: successResponseSchema(z.array(projectSchema), "ProjectList"),
            500: errorResponseSchema(500),
        },
        detail: {
            tags: ["Projects"],
            summary: "List the current user's projects",
        },
    },
);
