import { Elysia } from "elysia";
import { z } from "zod";
import {
    projectSchema,
    updateProjectSchema,
} from "@/core/project/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    errorResponses,
    respond,
    successResponseSchema,
} from "@/server/common/responses";
import { updateProjectService } from "../../services/update-project-service";

export const updateProjectRoute = new Elysia().use(authed).put(
    "/:id",
    async ({ user, params, body }) => {
        const result = await updateProjectService(user.id, params.id, body);
        return respond(result, 200);
    },
    {
        authed: true,
        params: z.object({ id: z.string() }),
        body: updateProjectSchema,
        response: {
            200: successResponseSchema(projectSchema, "Project"),
            ...errorResponses,
        },
        detail: { tags: ["Projects"], summary: "Update a project by id" },
    },
);
