import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — IndustrialMind AI" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
    toast.success("Reset link sent — check your inbox");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 py-12 gradient-mesh">
      <div className="w-full max-w-sm">
        <div className="mb-8"><Link to="/" aria-label="IndustrialMind AI home"><Logo /></Link></div>
        <div className="glass rounded-2xl p-8 shadow-elegant">
          <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">We'll send a secure recovery link to your work email.</p>
          {sent ? (
            <p className="mt-6 rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-success">If an account exists for {email}, a reset link is on its way.</p>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <div>
                <Label htmlFor="fpemail" className="text-xs">Work email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input id="fpemail" required className="pl-9" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="h-11 w-full gradient-primary text-white shadow-elegant">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
              </Button>
            </form>
          )}
        </div>
        <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back to sign in
        </Link>
      </div>
    </main>
  );
}
