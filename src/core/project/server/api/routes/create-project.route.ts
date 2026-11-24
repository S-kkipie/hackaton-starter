import { Elysia } from "elysia";
import {
    createProjectSchema,
    projectSchema,
} from "@/core/project/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    createdResponseSchema,
    errorResponses,
    respond,
} from "@/server/common/responses";
import { createProjectService } from "../../services/create-project-service";

export const createProjectRoute = new Elysia().use(authed).post(
    "/",
    async ({ user, body }) => {
        const result = await createProjectService(user.id, body);
        return respond(result, 201);
    },
    {
        authed: true,
        body: createProjectSchema,
        response: {
            201: createdResponseSchema(projectSchema, "Project"),
            ...errorResponses,
        },
        detail: { tags: ["Projects"], summary: "Create a project" },
    },
);
