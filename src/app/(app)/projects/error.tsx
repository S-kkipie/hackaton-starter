"use client";

import { Button } from "@/frontend/components/ui/button";

/**
 * Route error boundary for /projects. The table `server.tsx` handles a failed
 * service result inline; this boundary is the backstop for any other error
 * thrown while rendering the route (auth, param parsing) — it offers a retry
 * instead of white-screening.
 */
export default function ProjectsError({
    reset,
}: {
    error: Error;
    reset: () => void;
}) {
    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 p-6">
            <div className="space-y-1">
                <h2 className="font-semibold text-lg">Something went wrong</h2>
                <p className="text-muted-foreground text-sm">
                    We couldn’t load your projects. Please try again.
                </p>
            </div>
            <Button onClick={reset}>Retry</Button>
        </div>
    );
}
