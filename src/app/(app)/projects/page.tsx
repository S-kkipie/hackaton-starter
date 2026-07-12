import type { SearchParams } from "nuqs/server";
import { ProjectsTableServer } from "@/core/project/client/ui/table/server";
import { projectsSearchParamsCache } from "@/core/project/domain/search-params";
import { requireAuth } from "@/server/auth/require-auth";

/**
 * Server entry for `/projects`. Parses the URL table state into the
 * request-scoped search-params cache, then renders the table `server.tsx` (the
 * SSR data source), which reads the cache and calls the search service. The
 * client table writes URL params with `shallow:false`, so any
 * page/sort/filter/search change re-runs this RSC.
 */
export default async function ProjectsPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const { user } = await requireAuth();
    await projectsSearchParamsCache.parse(searchParams);

    return <ProjectsTableServer userId={user.id} />;
}
