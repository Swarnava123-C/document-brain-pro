import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — IndustrialMind AI" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 py-12 gradient-mesh">
      <div className="w-full max-w-sm">
        <div className="mb-8"><Link to="/"><Logo /></Link></div>
        <div className="glass rounded-2xl p-8 shadow-elegant">
          <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">We'll send a secure recovery link to your work email.</p>
          <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <Label className="text-xs">Work email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" type="email" placeholder="you@company.com" />
              </div>
            </div>
            <Button className="h-11 w-full gradient-primary text-white shadow-elegant">Send reset link</Button>
          </form>
        </div>
        <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
