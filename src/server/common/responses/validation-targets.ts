import "server-only";

/**
 * Field paths of an Elysia validation error, dotted ("parts.3.length"):
 * zod issues come dotted already, TypeBox ones as "/parts/3/length".
 */
export function validationTargets(error: unknown): string[] | undefined {
    let issues: { path?: unknown }[];
    try {
        issues = (error as { all?: { path?: unknown }[] }).all ?? [];
    } catch {
        return undefined;
    }
    const paths = issues.flatMap((i) =>
        typeof i.path === "string" && i.path
            ? [i.path.replace(/^\//, "").replaceAll("/", ".")]
            : [],
    );
    return paths.length ? [...new Set(paths)] : undefined;
}
