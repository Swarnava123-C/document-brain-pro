import { createFileRoute } from "@tanstack/react-router";
import {
  ShieldCheck, Calendar, AlertTriangle, FileBarChart, CheckCircle2,
  Clock, ArrowRight, Leaf, HardHat, Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { complianceStandards } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/compliance")({
  head: () => ({ meta: [{ title: "Compliance Center — IndustrialMind AI" }] }),
  component: Compliance,
});

function Compliance() {
  return (
    <div>
      <PageHeader
        breadcrumb="Intelligence"
        title="Compliance Center"
        description="Continuous compliance across ISO, OISD, PESO, Factory Act and internal standards."
        actions={<Button className="gradient-primary text-white shadow-elegant"><FileBarChart className="h-4 w-4" /> Generate audit report</Button>}
      />
      <PageBody>
        {/* Top KPIs */}
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 to-accent/10 p-6 lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall score</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-5xl font-bold text-gradient">94.6</span>
              <span className="text-lg font-semibold text-muted-foreground">/100</span>
            </div>
            <p className="mt-1 text-xs text-success">↑ 1.2 pts vs. last audit cycle</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full gradient-primary" style={{ width: "94.6%" }} />
            </div>
          </div>
          {[
            { icon: Clock, label: "Pending inspections", value: "12", tone: "warning" },
            { icon: AlertTriangle, label: "Expired certificates", value: "2", tone: "destructive" },
            { icon: CheckCircle2, label: "Audits passed (YTD)", value: "38", tone: "success" },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl border border-border/60 bg-card p-6">
              <div className={`grid h-10 w-10 place-items-center rounded-xl bg-${k.tone}/10 text-${k.tone}`}>
                <k.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-2xl font-bold text-foreground">{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Standards */}
        <div className="mt-6 rounded-2xl border border-border/60 bg-card">
          <div className="border-b border-border/60 px-6 py-4">
            <p className="text-sm font-semibold">Regulatory standards</p>
            <p className="text-xs text-muted-foreground">Live scoring across all applicable frameworks</p>
          </div>
          <div className="divide-y divide-border/60">
            {complianceStandards.map((s) => (
              <div key={s.code} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-6 py-4 md:grid-cols-[220px_minmax(0,1fr)_150px_140px_auto] md:items-center">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{s.code}</p>
                  <p className="text-[11px] text-muted-foreground">{s.name}</p>
                </div>
                <div className="hidden items-center gap-3 md:flex">
                  <Progress value={s.score} className="h-1.5 flex-1" />
                  <span className="w-10 text-right text-xs font-semibold">{s.score}</span>
                </div>
                <div className="hidden md:block">
                  <StatusPill status={s.status} />
                </div>
                <div className="hidden text-xs text-muted-foreground md:block">Next: {s.next}</div>
                <Button size="sm" variant="ghost" className="justify-self-end">View <ArrowRight className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
          </div>
        </div>

        {/* Risk cards + timeline */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-6">
            <p className="text-sm font-semibold">Upcoming compliance calendar</p>
            <p className="text-xs text-muted-foreground">Next 60 days</p>
            <div className="mt-5 space-y-3">
              {[
                { date: "Sep 12", title: "OISD-116 fire hydrant network test", desc: "Tank Farm South — required annually", tone: "warning" },
                { date: "Sep 20", title: "ISO 55001 internal audit", desc: "Asset management processes, all plants", tone: "primary" },
                { date: "Sep 26", title: "PESO license renewal — Tank T-401", desc: "Petroleum & Explosives storage", tone: "primary" },
                { date: "Oct 04", title: "ISO 14001 external audit", desc: "Environmental management system", tone: "primary" },
                { date: "Oct 18", title: "ISO 45001 surveillance audit", desc: "Occupational health & safety", tone: "info" },
              ].map((c) => (
                <div key={c.title} className="flex items-start gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl gradient-primary text-white shadow-elegant">
                    <div className="text-center leading-none">
                      <p className="text-[9px] uppercase opacity-90">{c.date.split(" ")[0]}</p>
                      <p className="text-lg font-bold">{c.date.split(" ")[1]}</p>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{c.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.desc}</p>
                  </div>
                  <Button variant="ghost" size="sm">Prepare</Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {[
              { icon: Flame, title: "Fire safety", score: 78, desc: "OISD-116 action needed on 2 hydrants", tone: "warning" },
              { icon: Leaf, title: "Environmental", score: 92, desc: "Emissions within limits", tone: "success" },
              { icon: HardHat, title: "Safety audits", score: 89, desc: "18 open observations", tone: "info" },
            ].map((r) => (
              <div key={r.title} className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className={`grid h-11 w-11 place-items-center rounded-xl bg-${r.tone}/10 text-${r.tone}`}>
                    <r.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="text-[11px] text-muted-foreground">{r.desc}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Progress value={r.score} className="h-1.5 flex-1" />
                  <span className="text-lg font-bold text-foreground">{r.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageBody>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const compliant = status === "Compliant";
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${compliant ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
    {compliant ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />} {status}
  </span>;
}
