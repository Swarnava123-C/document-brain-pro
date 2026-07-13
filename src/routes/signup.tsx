import { SignUp } from "@clerk/clerk-react";
import { createFileRoute } from "@tanstack/react-router";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — IndustrialMind AI" }] }),
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden gradient-mesh lg:block" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
        <div className="relative flex h-full flex-col justify-between p-12 text-foreground">
          <div aria-label="IndustrialMind AI home"><Logo /></div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Your plant's operational brain.</h2>
            <p className="mt-4 max-w-md text-muted-foreground">Unify decades of engineering documents, incidents, SOPs and drawings into a single AI-powered workspace.</p>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 IndustrialMind AI, Inc.</p>
        </div>
      </div>

      <main className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md flex flex-col items-center">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <SignUp
            routing="virtual"
            signInUrl="/login"
            fallbackRedirectUrl="/dashboard"
            forceRedirectUrl="/dashboard"
          />
        </div>
      </main>
    </div>
  );
}
