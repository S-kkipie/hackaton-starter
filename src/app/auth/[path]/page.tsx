import { notFound } from "next/navigation";
import { AuthForm, type AuthView } from "./auth-form";

const AUTH_VIEWS = [
    "sign-in",
    "sign-up",
    "forgot-password",
    "reset-password",
    "sign-out",
] as const satisfies readonly AuthView[];

// `@better-auth-ui/react` (installed 1.6.27) ships hooks/mutations only — no
// prebuilt `AuthCard` — and `AuthForm` reads the reset-password token from
// `useSearchParams()`, so this route can't be statically prerendered.
export const dynamic = "force-dynamic";

export function generateStaticParams() {
    return AUTH_VIEWS.map((path) => ({ path }));
}

export default async function AuthPage({
    params,
}: {
    params: Promise<{ path: string }>;
}) {
    const { path } = await params;
    if (!(AUTH_VIEWS as readonly string[]).includes(path)) {
        notFound();
    }

    return (
        <main className="flex min-h-svh items-center justify-center p-4">
            <AuthForm view={path as AuthView} />
        </main>
    );
}
