import { Elysia } from "elysia";
import { z } from "zod";
import { authed } from "@/server/auth/middleware/authed";
import {
    errorResponses,
    respond,
    successResponseSchema,
} from "@/server/common/responses";
import { deleteProjectService } from "../../services/delete-project-service";

export const deleteProjectRoute = new Elysia().use(authed).delete(
    "/:id",
    async ({ user, params }) => {
        const result = await deleteProjectService(user.id, params.id);
        return respond(result, 200);
    },
    {
        authed: true,
        params: z.object({ id: z.string() }),
        response: {
            200: successResponseSchema(
                z.object({ id: z.string() }),
                "DeleteProject",
            ),
            ...errorResponses,
        },
        detail: { tags: ["Projects"], summary: "Delete a project by id" },
    },
);
