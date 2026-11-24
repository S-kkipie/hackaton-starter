import { treaty } from "@elysiajs/eden";
import { createEdenTanStackQuery } from "eden-tanstack-react-query";
import { ClientConfig } from "@/config/client-config";
import type { AppRouter } from "@/server/router";

const { EdenProvider, useEden } = createEdenTanStackQuery<AppRouter>();
/** Typed options proxy rooted at /api/v1. Bind one domain, then hang calls off it. */
const useElysia = () => useEden().api.v1;

/**
 * The treaty client behind `EdenProvider`. In the browser it uses the page's
 * own origin, so preview deployments and LAN access stay same-origin (cookies,
 * CORS); on the server it uses `NEXT_PUBLIC_APP_URL`.
 */
const createApiClient = (
    origin: string = typeof window !== "undefined"
        ? window.location.origin
        : ClientConfig.baseUrl,
    fetcher?: typeof fetch,
) => treaty<AppRouter>(origin, fetcher ? { fetcher } : {});

export { createApiClient, EdenProvider, useElysia };
