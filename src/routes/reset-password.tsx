import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — IndustrialMind AI" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 py-12 gradient-mesh">
      <div className="w-full max-w-sm">
        <div className="mb-8"><Link to="/" aria-label="IndustrialMind AI home"><Logo /></Link></div>
        <div className="glass rounded-2xl p-8 shadow-elegant">
          <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Choose a strong password with at least 8 characters.</p>
          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="np" className="text-xs">New password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="np" required className="pl-9" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} />
              </div>
            </div>
            <div>
              <Label htmlFor="cp" className="text-xs">Confirm new password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="cp" required className="pl-9" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" minLength={8} />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="h-11 w-full gradient-primary text-white shadow-elegant">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
