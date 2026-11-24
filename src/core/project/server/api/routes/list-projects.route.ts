import { Elysia } from "elysia";
import {
    paginatedProjectsSchema,
    projectSearchSchema,
} from "@/core/project/domain/schemas";
import { authed } from "@/server/auth/middleware/authed";
import {
    errorResponses,
    respond,
    successResponseSchema,
} from "@/server/common/responses";
import { searchProjectsService } from "../../services/search-projects-service";

export const listProjectsRoute = new Elysia().use(authed).get(
    "/",
    async ({ user, query }) => {
        const result = await searchProjectsService(user.id, query);
        return respond(result, 200);
    },
    {
        authed: true,
        query: projectSearchSchema,
        response: {
            200: successResponseSchema(
                paginatedProjectsSchema,
                "PaginatedProjects",
            ),
            ...errorResponses,
        },
        detail: {
            tags: ["Projects"],
            summary: "Search the current user's projects",
            description:
                "Returns one filtered, paginated, sortable page of the current user's projects.",
        },
    },
);
