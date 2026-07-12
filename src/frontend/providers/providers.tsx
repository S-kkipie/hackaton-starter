"use client";

import { AuthProvider as AuthUIProvider } from "@better-auth-ui/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";
import { authClient } from "@/frontend/auth/auth";
import { Toaster } from "@/frontend/components/ui/sonner";
import { apiClient, EdenProvider } from "@/frontend/lib/eden";
import { getQueryClient } from "@/frontend/lib/query-client";
import { ThemeProvider } from "./theme-provider";

export function Providers({ children }: PropsWithChildren) {
    const queryClient = getQueryClient();
    const router = useRouter();

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <QueryClientProvider client={queryClient}>
                <EdenProvider client={apiClient} queryClient={queryClient}>
                    <AuthUIProvider
                        authClient={authClient}
                        navigate={({ to, replace }) =>
                            replace ? router.replace(to) : router.push(to)
                        }
                    >
                        {children}
                        <Toaster />
                    </AuthUIProvider>
                </EdenProvider>
            </QueryClientProvider>
        </ThemeProvider>
    );
}
