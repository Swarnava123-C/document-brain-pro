import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Check, Sparkles, ShieldCheck, Wrench, TriangleAlert, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { notifications } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — IndustrialMind AI" }] }),
  component: Notifications,
});

const tabs = ["All", "Unread", "Critical", "Maintenance", "Compliance", "AI Insights"] as const;
type Tab = typeof tabs[number];

const cfg = {
  critical: { icon: TriangleAlert, cls: "text-destructive bg-destructive/10", label: "Critical" },
  compliance: { icon: ShieldCheck, cls: "text-warning bg-warning/10", label: "Compliance" },
  ai: { icon: Sparkles, cls: "text-primary bg-primary/10", label: "AI Insight" },
  maintenance: { icon: Wrench, cls: "text-info bg-info/10", label: "Maintenance" },
} as const;

function Notifications() {
  const [tab, setTab] = useState<Tab>("All");
  const list = notifications.filter(n => {
    if (tab === "All") return true;
    if (tab === "Unread") return !n.read;
    if (tab === "Critical") return n.type === "critical";
    if (tab === "Maintenance") return n.type === "maintenance";
    if (tab === "Compliance") return n.type === "compliance";
    if (tab === "AI Insights") return n.type === "ai";
    return true;
  });
  const unread = notifications.filter(n => !n.read).length;
  return (
    <div>
      <PageHeader
        breadcrumb="Account"
        title="Notifications"
        description={`${unread} unread alerts across your plants.`}
        actions={<Button variant="outline"><CheckCheck className="h-4 w-4" /> Mark all as read</Button>}
      />
      <PageBody>
        <div className="flex flex-wrap gap-2">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${tab === t ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-card text-muted-foreground hover:bg-muted"}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="mt-5 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
          {list.length === 0 ? (
            <div className="grid place-items-center px-6 py-16 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted"><Bell className="h-6 w-6 text-muted-foreground" /></div>
              <p className="mt-4 text-sm font-semibold">You're all caught up</p>
              <p className="mt-1 text-xs text-muted-foreground">No notifications in this filter.</p>
            </div>
          ) : list.map(n => {
            const c = cfg[n.type as keyof typeof cfg];
            const Icon = c.icon;
            return (
              <div key={n.id} className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-4 px-6 py-4 transition hover:bg-muted/30 ${!n.read ? "bg-primary/[0.03]" : ""}`}>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${c.cls}`}><Icon className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <Badge variant="secondary" className="h-5 border-0 bg-muted text-[10px]">{c.label}</Badge>
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.desc}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{n.time}</p>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
            );
          })}
        </div>
      </PageBody>
    </div>
  );
}
