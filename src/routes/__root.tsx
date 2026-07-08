import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter,
  HeadContent, Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "../components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="grid min-h-screen place-items-center gradient-mesh px-4">
      <div className="max-w-md text-center">
        <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-primary">Error 404</p>
        <h1 className="mt-3 text-5xl font-bold tracking-tight text-foreground">Page not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">The page you're looking for isn't part of the IndustrialMind workspace.</p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-xl gradient-primary px-5 py-2.5 text-sm font-medium text-white shadow-elegant transition hover:opacity-95">
          Back to home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Something didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again or head back to the dashboard.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-xl gradient-primary px-4 py-2 text-sm font-medium text-white shadow-elegant">Try again</button>
          <a href="/" className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "IndustrialMind AI — Industrial Knowledge Intelligence Platform" },
      { name: "description", content: "AI-powered platform that transforms scattered industrial documents into a unified, searchable operational brain for manufacturing, energy, oil & gas, and asset-intensive enterprises." },
      { name: "author", content: "IndustrialMind AI" },
      { property: "og:title", content: "IndustrialMind AI — Industrial Knowledge Intelligence Platform" },
      { property: "og:description", content: "Transform industrial documents into an intelligent operational brain. AI Copilot, Knowledge Graph, Predictive Maintenance & Compliance Intelligence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Outlet />
        <Toaster position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
