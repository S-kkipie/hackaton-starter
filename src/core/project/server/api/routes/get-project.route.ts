import { Elysia } from "elysia";
import { z } from "zod";
import { projectSchema } from "@/core/project/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    errorResponses,
    respond,
    successResponseSchema,
} from "@/server/common/responses";
import { getProjectService } from "../../services/get-project-service";

export const getProjectRoute = new Elysia().use(authed).get(
    "/:id",
    async ({ user, params }) => {
        const result = await getProjectService(user.id, params.id);
        return respond(result, 200);
    },
    {
        authed: true,
        params: z.object({ id: z.string() }),
        response: {
            200: successResponseSchema(projectSchema, "Project"),
            ...errorResponses,
        },
        detail: { tags: ["Projects"], summary: "Get a project by id" },
    },
);
