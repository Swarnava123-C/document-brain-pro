import { createFileRoute } from "@tanstack/react-router";
import { Camera, Mail, Building2, MapPin, Shield, Key, Bell, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageBody, PageHeader } from "@/components/layout/page-header";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — IndustrialMind AI" }] }),
  component: Profile,
});

function Profile() {
  const activity = [
    { icon: Shield, text: "Signed in from new device — Mumbai, IN", time: "2h ago" },
    { icon: Bell, text: "Enabled critical maintenance alerts", time: "yesterday" },
    { icon: Key, text: "Rotated API key ind_ai_prod_a…f9", time: "3d ago" },
    { icon: Calendar, text: "Scheduled ISO 55001 internal audit", time: "5d ago" },
  ];
  return (
    <div>
      <PageHeader breadcrumb="Account" title="Profile" description="Manage your identity, security and notification preferences." />
      <PageBody>
        {/* Cover */}
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="h-32 gradient-primary" />
          <div className="flex flex-col gap-4 px-6 pb-6 md:flex-row md:items-end md:gap-6">
            <div className="relative -mt-14 grid h-24 w-24 shrink-0 place-items-center rounded-2xl border-4 border-card gradient-primary text-2xl font-bold text-white shadow-elegant">
              RI
              <button className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border border-border/60 bg-card text-foreground shadow">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="min-w-0 flex-1 pt-3 md:pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">Rohan Iyer</h2>
                <Badge className="border-primary/30 bg-primary/10 text-primary">Reliability Lead</Badge>
                <Badge variant="secondary" className="border-0 bg-success/15 text-success">Active</Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> rohan.iyer@northgrid.io</span>
                <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Reliability &amp; Asset Integrity</span>
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Vadodara Refinery, IN</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Change photo</Button>
              <Button className="gradient-primary text-white shadow-elegant">Save changes</Button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card p-6 lg:col-span-2">
            <p className="text-sm font-semibold">Personal information</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                { l: "First name", v: "Rohan" }, { l: "Last name", v: "Iyer" },
                { l: "Job title", v: "Reliability Lead" }, { l: "Employee ID", v: "NG-4728" },
                { l: "Work email", v: "rohan.iyer@northgrid.io" }, { l: "Phone", v: "+91 98200 34521" },
              ].map(f => (
                <div key={f.l}>
                  <Label className="text-xs">{f.l}</Label>
                  <Input className="mt-1.5" defaultValue={f.v} />
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm font-semibold">Security</p>
            <div className="mt-3 divide-y divide-border/60 rounded-xl border border-border/60">
              {[
                { l: "Two-factor authentication", d: "Authenticator app · Enabled", on: true },
                { l: "Single sign-on (Microsoft Entra)", d: "Enforced by organization", on: true },
                { l: "Session timeout after 30 min inactive", d: "Recommended for regulated industries", on: true },
                { l: "Email alerts on unrecognized login", d: "Sent to work email", on: false },
              ].map(s => (
                <div key={s.l} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{s.l}</p>
                    <p className="text-xs text-muted-foreground">{s.d}</p>
                  </div>
                  <Switch defaultChecked={s.on} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <p className="text-sm font-semibold">Recent activity</p>
            <div className="mt-4 space-y-4">
              {activity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><a.icon className="h-4 w-4" /></span>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{a.text}</p>
                    <p className="text-[11px] text-muted-foreground">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageBody>
    </div>
  );
}
