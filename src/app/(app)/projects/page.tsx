import { ProjectScreen } from "@/core/project/client/ui/project-screen";
import { projectSearchSchema } from "@/core/project/domain/schemas";
import { loadProjectSearchParams } from "@/core/project/domain/search-params";
import { searchProjectsService } from "@/core/project/server/services/search-projects-service";
import { resolveResult } from "@/frontend/lib/result";
import { requireAuth } from "@/server/auth/require-auth";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Server entry for `/projects`. Reads the URL table state (page/sort/status/q),
 * validates it into a `ProjectSearch`, and calls the search service directly
 * (no Eden round-trip on the server). The client table writes URL params with
 * `shallow:false`, so any page/sort/filter/search change re-runs this RSC and
 * streams the next page into `ProjectScreen`.
 */
export default async function ProjectsPage({
    searchParams,
}: {
    searchParams: SearchParams;
}) {
    const { user } = await requireAuth();
    const params = loadProjectSearchParams(await searchParams);
    const initialProjects = await resolveResult(
        searchProjectsService(user.id, projectSearchSchema.parse(params)),
    );

    return <ProjectScreen initialProjects={initialProjects} />;
}
