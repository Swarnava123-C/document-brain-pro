import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  return (
    <>
      <SignedIn>
        <SidebarProvider>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
            Skip to main content
          </a>
          <div className="flex min-h-screen w-full bg-background">
            <AppSidebar />
            <SidebarInset className="flex min-w-0 flex-1 flex-col">
              <AppHeader />
              <main id="main-content" className="flex-1 overflow-x-hidden" tabIndex={-1}>
                <Outlet />
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn signInFallbackRedirectUrl="/login" signUpFallbackRedirectUrl="/signup" />
      </SignedOut>
    </>
  );
}
