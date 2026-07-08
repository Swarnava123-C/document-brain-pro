import { createFileRoute } from "@tanstack/react-router";
import {
  Wrench, ShieldCheck, Cog, FileText, AlertTriangle, Download,
  FileBarChart, Calendar, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageBody, PageHeader } from "@/components/layout/page-header";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — IndustrialMind AI" }] }),
  component: Reports,
});

const catalog = [
  { icon: Wrench, title: "Maintenance Report", desc: "Preventive & corrective maintenance, MTBF, MTTR, backlog analysis.", tone: "primary", tag: "Monthly" },
  { icon: ShieldCheck, title: "Compliance Report", desc: "ISO 55001, ISO 14001, PESO, OISD scores + evidence trail.", tone: "success", tag: "Quarterly" },
  { icon: Cog, title: "Equipment Report", desc: "Fleet health, RUL forecasts, top 20 at-risk assets.", tone: "info", tag: "Weekly" },
  { icon: FileText, title: "Document Summary", desc: "New uploads, indexing status, coverage per unit.", tone: "accent", tag: "Weekly" },
  { icon: AlertTriangle, title: "Incident Report", desc: "Near-misses, recordables, RCA outcomes and corrective actions.", tone: "warning", tag: "Monthly" },
  { icon: TrendingUp, title: "AI Insights Digest", desc: "Notable patterns, recurring failures, cross-plant learnings.", tone: "primary", tag: "Weekly" },
];

const recent = [
  { name: "Q3 Maintenance Executive Summary.pdf", date: "Sep 07, 2026", size: "4.2 MB", type: "Maintenance" },
  { name: "August ISO 55001 Evidence Pack.pdf", date: "Sep 02, 2026", size: "12.6 MB", type: "Compliance" },
  { name: "Fleet Health Snapshot — Week 36.pdf", date: "Sep 01, 2026", size: "3.1 MB", type: "Equipment" },
  { name: "Incident Recap — Aug 2026.pdf", date: "Aug 31, 2026", size: "2.4 MB", type: "Incident" },
];

function Reports() {
  return (
    <div>
      <PageHeader
        breadcrumb="Intelligence"
        title="Reports"
        description="Generate polished, audit-ready reports in seconds — all backed by cited source documents."
        actions={<Button className="gradient-primary text-white shadow-elegant"><FileBarChart className="h-4 w-4" /> Custom report</Button>}
      />
      <PageBody>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {catalog.map((c) => (
            <div key={c.title} className="group overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant">
              <div className="flex items-start justify-between">
                <div className={`grid h-12 w-12 place-items-center rounded-xl bg-${c.tone}/10 text-${c.tone}`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <Badge variant="secondary" className="border-0 bg-muted text-[10px]">{c.tag}</Badge>
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
              <div className="mt-5 flex items-center gap-2">
                <Button size="sm" className="gradient-primary text-white shadow-elegant">Generate</Button>
                <Button size="sm" variant="outline">Preview</Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <p className="text-sm font-semibold">Recently generated</p>
            <Button variant="ghost" size="sm">View archive</Button>
          </div>
          <div className="divide-y divide-border/60">
            {recent.map((r) => (
              <div key={r.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><FileBarChart className="h-4 w-4" /></div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                    <p className="text-[11px] text-muted-foreground">{r.type} · {r.date} · {r.size}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5" /> Download</Button>
              </div>
            ))}
          </div>
        </div>
      </PageBody>
    </div>
  );
}
