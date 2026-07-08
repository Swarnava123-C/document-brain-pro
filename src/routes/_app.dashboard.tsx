import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDashboardIntelligenceFn, generateExecutiveBriefingFn } from "@/functions/dashboard";
import {
  FileText, Boxes, Cog, Users, Wrench, ShieldCheck, Sparkles, Network,
  ArrowUpRight, ArrowDownRight, Upload, FileBarChart, MoreHorizontal,
  Bell, CircleCheck, TriangleAlert, Circle, Activity, TrendingUp, Loader2
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

const iconMap: Record<string, any> = { FileText, Boxes, Cog, Users, Wrench, ShieldCheck, Sparkles, Network, Activity };

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — IndustrialMind AI" }] }),
  component: Dashboard,
});

function StatCard({ s, isLoading }: { s: any, isLoading: boolean }) {
  const Icon = iconMap[s.icon] ?? FileText;
  const up = s.trend === "up";
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition hover:border-primary/40 hover:shadow-elegant cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <Badge variant="secondary" className={`h-6 gap-1 border-0 ${up ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />} {s.delta}
        </Badge>
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin mt-1" /> : s.value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/10 opacity-0 blur-2xl transition group-hover:opacity-100" />
    </div>
  );
}

function Dashboard() {
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);

  // Auth Session
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
  });
  const userId = session?.user?.id;

  // Fetch Live Dashboard Intelligence
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard_intelligence"],
    queryFn: async () => {
      if (!userId) return null;
      return await getDashboardIntelligenceFn({ data: userId });
    },
    enabled: !!userId,
  });

  // Fetch Executive Briefing
  const { data: briefingData, isLoading: isGeneratingBriefing } = useQuery({
    queryKey: ["executive_briefing"],
    queryFn: async () => {
      if (!userId) return null;
      return await generateExecutiveBriefingFn({ data: userId });
    },
    enabled: !!userId && isBriefingOpen,
    staleTime: 1000 * 60 * 15,
  });

  const stats = dashboard?.stats || [
    { label: "Overall Plant Health", value: "0%", trend: "up", delta: "0%", icon: "Activity" },
    { label: "Compliance Score", value: "0%", trend: "up", delta: "0%", icon: "ShieldCheck" },
    { label: "Critical Equipment", value: "0", trend: "up", delta: "0", icon: "Wrench" },
    { label: "Indexed Documents", value: "0", trend: "up", delta: "0", icon: "FileText" },
  ];

  return (
    <div>
      <PageHeader
        breadcrumb="Workspace"
        title="Executive Command Center"
        description="Live operational intelligence aggregated from your uploaded documents, maintenance, and compliance pipelines."
        actions={
          <>
            <Dialog open={isBriefingOpen} onOpenChange={setIsBriefingOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileBarChart className="h-4 w-4" /> AI Executive Briefing
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> AI Executive Briefing
                  </DialogTitle>
                  <DialogDescription>
                    Synthesized by Gemini 2.5 Flash based on live aggregated plant intelligence.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto py-4">
                  {isGeneratingBriefing ? (
                    <div className="py-16 text-center text-muted-foreground flex flex-col items-center">
                      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                      <p className="font-medium text-foreground">Synthesizing executive summary...</p>
                    </div>
                  ) : briefingData ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                      <Markdown remarkPlugins={[remarkGfm]}>{briefingData.briefing}</Markdown>
                    </div>
                  ) : null}
                </div>
                <div className="pt-4 border-t border-border flex justify-end">
                  <Button variant="outline" onClick={() => setIsBriefingOpen(false)}>Close</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button asChild size="sm" className="gradient-primary text-white shadow-elegant gap-2">
              <Link to="/copilot"><Sparkles className="h-4 w-4" /> Ask AI Copilot</Link>
            </Button>
          </>
        }
      />
      <PageBody>
        {/* KPI Row */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s: any) => (
            <Link to={s.label.includes("Compliance") ? "/compliance" : s.label.includes("Equipment") || s.label.includes("Health") ? "/maintenance" : "/documents"} key={s.label}>
              <StatCard s={s} isLoading={isLoading} />
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {/* Document growth */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 lg:col-span-2">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Document intelligence growth</p>
                <p className="text-xs text-muted-foreground">Documents ingested vs. fully indexed (6mo projection)</p>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">Live Data</Badge>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboard?.documentGrowth || []}>
                  <defs>
                    <linearGradient id="doc1" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="doc2" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="documents" stroke="var(--color-primary)" fill="url(#doc1)" strokeWidth={2} />
                  <Area type="monotone" dataKey="indexed" stroke="var(--color-accent)" fill="url(#doc2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Equipment health */}
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <p className="text-sm font-semibold text-foreground">Asset health distribution</p>
            <p className="text-xs text-muted-foreground">Dynamic equipment extraction</p>
            <div className="mt-2 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dashboard?.equipmentHealth || []} innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {(dashboard?.equipmentHealth || []).map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-2">
              {(dashboard?.equipmentHealth || []).map((e: any) => (
                <div key={e.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: e.color }} />
                    <span className="text-muted-foreground">{e.name}</span>
                  </div>
                  <span className="font-semibold text-foreground">{e.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* Compliance trend */}
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Overall compliance trajectory</p>
                <p className="text-xs text-muted-foreground">Aggregate score across detected standards</p>
              </div>
              <Badge className="border-success/20 bg-success/10 text-success"><TrendingUp className="h-3 w-3" /> Live</Badge>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboard?.complianceTrend || []}>
                  <defs>
                    <linearGradient id="cmp" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-success)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-success)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="var(--color-muted-foreground)" fontSize={11} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="score" stroke="var(--color-success)" fill="url(#cmp)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Maintenance */}
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Maintenance execution</p>
                <p className="text-xs text-muted-foreground">Derived from document actions</p>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">Live Projection</Badge>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard?.maintenanceTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
                  <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="scheduled" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="completed" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="overdue" fill="var(--color-destructive)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
              <div>
                <p className="text-sm font-semibold">Latest intelligence sources</p>
                <p className="text-xs text-muted-foreground">Recently uploaded documents feeding the AI</p>
              </div>
              <Button asChild variant="ghost" size="sm"><Link to="/upload"><Upload className="h-4 w-4" /> Upload more</Link></Button>
            </div>
            <div className="divide-y divide-border/60">
              {!dashboard?.recentUploadsLive?.length ? (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">No recent uploads.</div>
              ) : (
                dashboard.recentUploadsLive.map((u: any) => (
                  <div key={u.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-3 transition hover:bg-muted/30">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{u.name}</p>
                        <p className="text-[11px] text-muted-foreground">{u.user} · {u.size} · {u.time}</p>
                      </div>
                    </div>
                    <StatusBadge status={u.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card">
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
              <p className="text-sm font-semibold">Intelligence alerts</p>
            </div>
            <div className="divide-y divide-border/60">
              {isLoading ? (
                <div className="p-6 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
              ) : !dashboard?.notifications?.length ? (
                <div className="p-6 text-center text-muted-foreground text-sm">No new alerts.</div>
              ) : (
                dashboard.notifications.map((n: any) => {
                  const cfg = {
                    critical: { icon: TriangleAlert, cls: "text-destructive bg-destructive/10" },
                    compliance: { icon: ShieldCheck, cls: "text-warning bg-warning/10" },
                    ai: { icon: Sparkles, cls: "text-primary bg-primary/10" },
                    maintenance: { icon: Wrench, cls: "text-info bg-info/10" },
                  }[n.type as "critical"] || { icon: Bell, cls: "text-muted bg-muted/10" };
                  const Icon = cfg.icon;
                  return (
                    <div key={n.id} className="flex items-start gap-3 px-6 py-3 hover:bg-muted/30 transition-colors">
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${cfg.cls}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{n.desc}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{n.time}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-4">
          {[
            { title: "Knowledge Graph", desc: "Explore industrial ontology", to: "/knowledge-graph", icon: Network },
            { title: "Ask AI Copilot", desc: "Query indexed intelligence", to: "/copilot", icon: Sparkles },
            { title: "Compliance Center", desc: "Audit readiness scoring", to: "/compliance", icon: ShieldCheck },
            { title: "Asset Maintenance", desc: "Predictive RCA analysis", to: "/maintenance", icon: Boxes },
          ].map((a) => (
            <Link key={a.title} to={a.to} className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl gradient-primary text-white shadow-elegant transition group-hover:scale-105">
                <a.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{a.title}</p>
                <p className="truncate text-xs text-muted-foreground">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </PageBody>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Indexed: "bg-success/15 text-success",
    Ready: "bg-success/15 text-success",
    Embedding: "bg-primary/15 text-primary",
    OCR: "bg-warning/15 text-warning",
    Failed: "bg-destructive/15 text-destructive",
    Processing: "bg-warning/15 text-warning",
    Uploaded: "bg-muted text-muted-foreground",
  };
  return <Badge variant="secondary" className={`border-0 ${map[status] ?? "bg-muted"}`}>{status}</Badge>;
}
