import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Mail, Lock, User, Building2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — IndustrialMind AI" }, { name: "description", content: "Start your IndustrialMind AI enterprise trial." }] }),
  component: SignupPage,
});

function SignupPage() {
  const perks = ["14-day enterprise trial", "Unlimited AI queries", "Up to 50 users", "Priority onboarding"];
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center bg-background px-6 py-12 order-2 lg:order-1">
        <div className="w-full max-w-sm">
          <div className="mb-8"><Link to="/"><Logo /></Link></div>
          <h1 className="text-2xl font-bold tracking-tight">Start your enterprise trial</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">No credit card. Cancel anytime.</p>
          <form className="mt-8 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">First name</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" defaultValue="Rohan" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Last name</Label>
                <Input className="mt-1.5" defaultValue="Iyer" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Work email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" type="email" defaultValue="rohan.iyer@northgrid.io" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Company</Label>
              <div className="relative mt-1.5">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" defaultValue="NorthGrid Energy" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" type="password" placeholder="At least 10 characters" />
              </div>
            </div>
            <Button asChild className="h-11 w-full gradient-primary text-white shadow-elegant">
              <Link to="/app/dashboard">Create workspace <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden gradient-mesh lg:order-2 lg:block">
        <div className="absolute inset-0 bg-gradient-to-tl from-accent/20 via-transparent to-primary/25" />
        <div className="relative flex h-full flex-col justify-center p-12">
          <h2 className="text-3xl font-bold tracking-tight">Deploy in weeks, not quarters.</h2>
          <p className="mt-4 max-w-md text-muted-foreground">The fastest way to turn your existing engineering documents into a live operational brain.</p>
          <ul className="mt-8 space-y-3">
            {perks.map(p => (
              <li key={p} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full gradient-primary text-white"><Check className="h-3.5 w-3.5" /></span>
                <span className="text-sm text-foreground">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
