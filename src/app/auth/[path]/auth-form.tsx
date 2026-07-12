"use client";

import {
    useRequestPasswordReset,
    useResetPassword,
    useSignInEmail,
    useSignOut,
    useSignUpEmail,
} from "@better-auth-ui/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { authClient } from "@/frontend/auth/auth";
import { Button } from "@/frontend/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";

export type AuthView =
    | "sign-in"
    | "sign-up"
    | "forgot-password"
    | "reset-password"
    | "sign-out";

const VIEW_COPY: Record<AuthView, { title: string; description: string }> = {
    "sign-in": {
        title: "Sign in",
        description: "Welcome back.",
    },
    "sign-up": {
        title: "Create an account",
        description: "Get started in a few seconds.",
    },
    "forgot-password": {
        title: "Forgot password",
        description: "We'll email you a reset link.",
    },
    "reset-password": {
        title: "Reset password",
        description: "Choose a new password.",
    },
    "sign-out": {
        title: "Signing out",
        description: "See you soon.",
    },
};

/**
 * Minimal email/password auth card built directly on `@better-auth-ui/react`'s
 * mutation hooks (`useSignInEmail`, `useSignUpEmail`, `useRequestPasswordReset`,
 * `useResetPassword`, `useSignOut`).
 *
 * The task brief assumed a prebuilt `<AuthCard pathname={path} />` component
 * from this package, but the installed version (1.6.27) only exports hooks /
 * mutations / providers — no presentational card (confirmed: no `AuthCard`
 * export anywhere under `node_modules/@better-auth-ui/react/dist`, and the
 * package's `exports` map only has `.`, `./email`, `./server`, `./plugins`).
 * This component reconstructs the same "auth views" surface (sign-in,
 * sign-up, forgot-password, reset-password, sign-out) using those hooks so
 * the routed page still works end to end.
 */
export function AuthForm({ view }: { view: AuthView }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const signIn = useSignInEmail(authClient, {
        onSuccess: () => router.push("/projects"),
    });
    const signUp = useSignUpEmail(authClient, {
        onSuccess: () => router.push("/projects"),
    });
    const requestReset = useRequestPasswordReset(authClient);
    const resetPassword = useResetPassword(authClient, {
        onSuccess: () => router.push("/auth/sign-in"),
    });
    const signOut = useSignOut(authClient, {
        onSuccess: () => router.push("/auth/sign-in"),
    });

    useEffect(() => {
        if (view === "sign-out") {
            signOut.mutate(undefined);
        }
    }, [view, signOut.mutate]);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (view === "sign-in") {
            signIn.mutate({ email, password });
            return;
        }
        if (view === "sign-up") {
            signUp.mutate({ name, email, password });
            return;
        }
        if (view === "forgot-password") {
            requestReset.mutate({ email, redirectTo: "/auth/reset-password" });
            return;
        }
        if (view === "reset-password") {
            const token = searchParams.get("token") ?? undefined;
            resetPassword.mutate({ newPassword: password, token });
        }
    }

    const pending =
        signIn.isPending ||
        signUp.isPending ||
        requestReset.isPending ||
        resetPassword.isPending;

    const { title, description } = VIEW_COPY[view];

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {view === "sign-out" ? (
                    <p className="text-muted-foreground text-sm">
                        Signing you out…
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {view === "sign-up" && (
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        {view !== "reset-password" && (
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        {view !== "forgot-password" && (
                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    {view === "reset-password"
                                        ? "New password"
                                        : "Password"}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                />
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={pending}
                        >
                            {title}
                        </Button>
                        {view === "sign-in" && (
                            <p className="text-center text-muted-foreground text-sm">
                                <Link href="/auth/sign-up">
                                    Create an account
                                </Link>
                                {" · "}
                                <Link href="/auth/forgot-password">
                                    Forgot password?
                                </Link>
                            </p>
                        )}
                        {view === "sign-up" && (
                            <p className="text-center text-muted-foreground text-sm">
                                <Link href="/auth/sign-in">
                                    Already have an account? Sign in
                                </Link>
                            </p>
                        )}
                        {view === "forgot-password" && (
                            <p className="text-center text-muted-foreground text-sm">
                                <Link href="/auth/sign-in">
                                    Back to sign in
                                </Link>
                            </p>
                        )}
                    </form>
                )}
            </CardContent>
        </Card>
    );
}
