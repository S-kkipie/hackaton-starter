import {
    createLoader,
    parseAsArrayOf,
    parseAsInteger,
    parseAsString,
} from "nuqs/server";
import { getSortingStateParser } from "@/frontend/lib/parsers";
import type { Project } from "./types";

/**
 * nuqs parsers describing the projects table URL state. Keys MUST match what
 * `useDataTable` writes (`page`, `perPage`, `sort`, plus `status` since the
 * `status` column is filterable) so the RSC loader below, the client table
 * hook, and the table engine all agree on a single URL contract.
 *
 * `q` is the free-text search box in `ProjectScreen` — it is written directly
 * with its own `useQueryState` rather than through a table column filter, but
 * lives here too so the RSC loader can read it in one pass.
 */
export const projectSearchParsers = {
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(20),
    sort: getSortingStateParser<Project>().withDefault([
        { id: "createdAt", desc: true },
    ]),
    status: parseAsArrayOf(parseAsString).withDefault([]),
    q: parseAsString.withDefault(""),
};

/**
 * Server-side loader for the `/projects` RSC page. Parses the `searchParams`
 * page prop (plain object or the Next.js 16 Promise) into the shape above.
 * The page then runs the result through `projectSearchSchema.parse` to
 * coerce/validate it into a `ProjectSearch` before calling
 * `searchProjectsService`.
 */
export const loadProjectSearchParams = createLoader(projectSearchParsers);
