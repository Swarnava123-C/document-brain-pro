import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Mail, Lock, User, Building2, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — IndustrialMind AI" }, { name: "description", content: "Start your IndustrialMind AI enterprise trial." }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const perks = ["14-day enterprise trial", "Unlimited AI queries", "Up to 50 users", "Priority onboarding"];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: `${firstName} ${lastName}`.trim(), department: company || "Operations" },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Workspace created");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <main className="flex items-center justify-center bg-background px-6 py-12 order-2 lg:order-1">
        <div className="w-full max-w-sm">
          <div className="mb-8"><Link to="/" aria-label="IndustrialMind AI home"><Logo /></Link></div>
          <h1 className="text-2xl font-bold tracking-tight">Start your enterprise trial</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">No credit card. Cancel anytime.</p>
          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="first" className="text-xs">First name</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input id="first" required className="pl-9" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
                </div>
              </div>
              <div>
                <Label htmlFor="last" className="text-xs">Last name</Label>
                <Input id="last" required className="mt-1.5" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
              </div>
            </div>
            <div>
              <Label htmlFor="semail" className="text-xs">Work email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="semail" required className="pl-9" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
            </div>
            <div>
              <Label htmlFor="company" className="text-xs">Company</Label>
              <div className="relative mt-1.5">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="company" className="pl-9" value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" />
              </div>
            </div>
            <div>
              <Label htmlFor="spass" className="text-xs">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="spass" required className="pl-9" type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="h-11 w-full gradient-primary text-white shadow-elegant">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create workspace <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </main>

      <div className="relative hidden overflow-hidden gradient-mesh lg:order-2 lg:block" aria-hidden="true">
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
