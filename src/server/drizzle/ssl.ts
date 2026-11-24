/**
 * SSL options for a Postgres connection string: hosted databases (Neon, Supabase…) need SSL, a local
 * Postgres usually has none, and `sslmode=disable` turns it off explicitly.
 */
export function sslFor(url: string): false | { rejectUnauthorized: false } {
    const { hostname, searchParams } = new URL(url);
    const local = hostname === "localhost" || hostname === "127.0.0.1";
    return local || searchParams.get("sslmode") === "disable"
        ? false
        : { rejectUnauthorized: false };
}
