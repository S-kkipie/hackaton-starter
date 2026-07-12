import { projectSearchSchema } from "@/core/project/domain/schemas";
import { projectsSearchParamsCache } from "@/core/project/domain/search-params";
import { searchProjectsService } from "@/core/project/server/services/search-projects-service";
import { ProjectsDataTable } from "./data-table";

/**
 * Server entry for the projects table (the SSR data source). Reads the
 * request-scoped search-params cache (parsed by the page), validates it into a
 * `ProjectSearch`, calls the search service directly (no Eden on the server),
 * and hands the server-filtered page to the client `ProjectsDataTable`. The
 * table writes URL params with `shallow:false`, so any page/sort/filter/search
 * change re-runs this RSC.
 */
export async function ProjectsTableServer({ userId }: { userId: string }) {
    const params = projectSearchSchema.parse(projectsSearchParamsCache.all());
    const result = await searchProjectsService(userId, params);

    if (!result.ok) {
        return (
            <div className="mx-auto w-full max-w-5xl p-6">
                <p className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground text-sm">
                    We couldn’t load your projects. Reload the page and try
                    again.
                </p>
            </div>
        );
    }

    return <ProjectsDataTable initialProjects={result.data} />;
}
