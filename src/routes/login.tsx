import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Mail, Lock, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — IndustrialMind AI" }, { name: "description", content: "Sign in to the IndustrialMind AI enterprise workspace." }] }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden gradient-mesh lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
        <div className="relative flex h-full flex-col justify-between p-12 text-foreground">
          <Link to="/"><Logo /></Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Your plant's operational brain.</h2>
            <p className="mt-4 max-w-md text-muted-foreground">Unify decades of engineering documents, incidents, SOPs and drawings into a single AI-powered workspace.</p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[{ v: "48k+", l: "Docs indexed" }, { v: "94.6%", l: "Compliance" }, { v: "2.8k", l: "Assets" }].map(s => (
                <div key={s.l} className="glass rounded-xl p-4">
                  <p className="text-2xl font-bold text-foreground">{s.v}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 IndustrialMind AI, Inc.</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Sign in to continue to your workspace.</p>

          <div className="mt-8 space-y-3">
            <Button variant="outline" className="w-full justify-center gap-2 border-border/70">
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.19 3.32v2.76h3.54c2.08-1.91 3.29-4.74 3.29-8.09Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.54-2.76c-.98.66-2.24 1.05-3.74 1.05-2.87 0-5.3-1.94-6.17-4.55H2.18v2.85A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.83 14.08a6.6 6.6 0 0 1 0-4.16V7.07H2.18a11 11 0 0 0 0 9.86l3.65-2.85Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.65 2.85C6.7 7.32 9.13 5.38 12 5.38Z"/></svg>
              Continue with Google
            </Button>
            <Button variant="outline" className="w-full justify-center gap-2 border-border/70">
              <svg className="h-4 w-4" viewBox="0 0 23 23"><path fill="#f25022" d="M1 1h10v10H1z"/><path fill="#00a4ef" d="M1 12h10v10H1z"/><path fill="#7fba00" d="M12 1h10v10H12z"/><path fill="#ffb900" d="M12 12h10v10H12z"/></svg>
              Continue with Microsoft
            </Button>
          </div>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <Label htmlFor="email" className="text-xs">Work email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@company.com" className="pl-9" defaultValue="rohan.iyer@northgrid.io" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs">Password</Label>
                <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot?</Link>
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" className="pl-9" defaultValue="password123" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox defaultChecked /> Keep me signed in for 30 days
            </label>
            <Button asChild className="h-11 w-full gradient-primary text-white shadow-elegant hover:opacity-95">
              <Link to="/dashboard">Sign in <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
