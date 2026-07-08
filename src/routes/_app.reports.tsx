import { createFileRoute } from "@tanstack/react-router";
import {
  Wrench, ShieldCheck, Cog, FileText, AlertTriangle, Download,
  FileBarChart, TrendingUp, FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { exportCSV, exportPDF } from "@/lib/exports";
import { equipment, complianceStandards, maintenanceTrend, documents as docSample } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — IndustrialMind AI" }] }),
  component: Reports,
});

type ReportKey = "maintenance" | "compliance" | "equipment" | "document" | "incident" | "ai";

const catalog: { key: ReportKey; icon: typeof Wrench; title: string; desc: string; tone: string; tag: string }[] = [
  { key: "maintenance", icon: Wrench, title: "Maintenance Report", desc: "Preventive & corrective maintenance, MTBF, MTTR, backlog analysis.", tone: "primary", tag: "Monthly" },
  { key: "compliance", icon: ShieldCheck, title: "Compliance Report", desc: "ISO 55001, ISO 14001, PESO, OISD scores + evidence trail.", tone: "success", tag: "Quarterly" },
  { key: "equipment", icon: Cog, title: "Equipment Report", desc: "Fleet health, RUL forecasts, top 20 at-risk assets.", tone: "info", tag: "Weekly" },
  { key: "document", icon: FileText, title: "Document Summary", desc: "New uploads, indexing status, coverage per unit.", tone: "accent", tag: "Weekly" },
  { key: "incident", icon: AlertTriangle, title: "Incident Report", desc: "Near-misses, recordables, RCA outcomes and corrective actions.", tone: "warning", tag: "Monthly" },
  { key: "ai", icon: TrendingUp, title: "AI Insights Digest", desc: "Notable patterns, recurring failures, cross-plant learnings.", tone: "primary", tag: "Weekly" },
];

function buildReport(key: ReportKey) {
  switch (key) {
    case "maintenance":
      return {
        title: "Maintenance Executive Report",
        subtitle: "Weekly rollup — scheduled vs completed",
        kpis: [
          { label: "Scheduled", value: String(maintenanceTrend.reduce((a, w) => a + w.scheduled, 0)) },
          { label: "Completed", value: String(maintenanceTrend.reduce((a, w) => a + w.completed, 0)) },
          { label: "Overdue", value: String(maintenanceTrend.reduce((a, w) => a + w.overdue, 0)) },
          { label: "Completion %", value: "95.4%" },
        ],
        columns: ["Week", "Scheduled", "Completed", "Overdue"],
        rows: maintenanceTrend.map((w) => [w.week, w.scheduled, w.completed, w.overdue]),
      };
    case "compliance":
      return {
        title: "Compliance Scorecard",
        subtitle: "Regulatory posture across standards",
        kpis: [
          { label: "Compliant", value: String(complianceStandards.filter(c => c.status === "Compliant").length) },
          { label: "Avg Score", value: `${Math.round(complianceStandards.reduce((a, c) => a + c.score, 0) / complianceStandards.length)}%` },
          { label: "Action Needed", value: String(complianceStandards.filter(c => c.status !== "Compliant").length) },
        ],
        columns: ["Standard", "Description", "Status", "Score", "Next Review"],
        rows: complianceStandards.map((c) => [c.code, c.name, c.status, `${c.score}%`, c.next]),
      };
    case "equipment":
      return {
        title: "Fleet Health Report",
        subtitle: "Top assets by remaining useful life",
        kpis: [
          { label: "Assets", value: String(equipment.length) },
          { label: "Critical", value: String(equipment.filter(e => e.status === "Critical").length) },
          { label: "Warning", value: String(equipment.filter(e => e.status === "Warning").length) },
          { label: "Optimal", value: String(equipment.filter(e => e.status === "Optimal").length) },
        ],
        columns: ["Tag", "Name", "Area", "Health %", "Status", "RUL (days)", "Last Service"],
        rows: equipment.map((e) => [e.id, e.name, e.area, e.health, e.status, e.rul, e.lastService]),
      };
    case "document":
      return {
        title: "Document Coverage Summary",
        subtitle: "Recently indexed documents",
        kpis: [
          { label: "Documents", value: "48,392" },
          { label: "Indexed 24h", value: "612" },
          { label: "Coverage", value: "98.8%" },
        ],
        columns: ["ID", "Name", "Type", "Department", "Size", "Updated"],
        rows: docSample.map((d) => [d.id, d.name, d.type, d.dept, d.size, d.updated]),
      };
    case "incident":
      return {
        title: "Incident & RCA Report",
        subtitle: "Last 30 days",
        kpis: [
          { label: "Recordable", value: "3" },
          { label: "Near-miss", value: "14" },
          { label: "Open RCAs", value: "5" },
        ],
        columns: ["Date", "Asset", "Severity", "Description", "Owner", "Status"],
        rows: [
          ["2026-08-14", "HX-88", "High", "Tube leak, upstream vibration signature", "L. Chen", "RCA closed"],
          ["2026-08-22", "P-101", "Med", "Seal weep flagged during PM", "R. Iyer", "Corrective open"],
          ["2026-08-30", "B-17", "Med", "Overpressure alarm during startup", "A. Karim", "Investigation"],
          ["2026-09-02", "C-204", "Low", "Vibration trend anomaly", "S. Malhotra", "Monitoring"],
        ],
      };
    case "ai":
      return {
        title: "AI Insights Digest",
        subtitle: "Notable patterns detected by IndustrialMind AI",
        kpis: [
          { label: "Insights", value: "27" },
          { label: "High impact", value: "6" },
          { label: "Assets touched", value: "42" },
        ],
        columns: ["Date", "Insight", "Confidence", "Impact"],
        rows: [
          ["2026-09-05", "Recurring seal failure across P-101 family (3 units)", "94%", "High"],
          ["2026-09-04", "HRSG efficiency drift correlated with fuel gas composition", "88%", "Medium"],
          ["2026-09-03", "Boiler B-17 warm-up curve deviates from SOP", "91%", "High"],
          ["2026-09-01", "Compressor C-204 bearing wear pattern matches prior overhauls", "89%", "Medium"],
        ],
      };
  }
}

const recent = [
  { name: "Q3 Maintenance Executive Summary.pdf", date: "Sep 07, 2026", size: "4.2 MB", type: "Maintenance", key: "maintenance" as ReportKey },
  { name: "August ISO 55001 Evidence Pack.pdf", date: "Sep 02, 2026", size: "12.6 MB", type: "Compliance", key: "compliance" as ReportKey },
  { name: "Fleet Health Snapshot — Week 36.pdf", date: "Sep 01, 2026", size: "3.1 MB", type: "Equipment", key: "equipment" as ReportKey },
  { name: "Incident Recap — Aug 2026.pdf", date: "Aug 31, 2026", size: "2.4 MB", type: "Incident", key: "incident" as ReportKey },
];

function Reports() {
  async function handlePDF(key: ReportKey) {
    const r = buildReport(key);
    const stamp = new Date().toISOString().slice(0, 10);
    await exportPDF({
      filename: `${r.title.replace(/\s+/g, "-")}-${stamp}.pdf`,
      title: r.title, subtitle: r.subtitle, kpis: r.kpis, columns: r.columns, rows: r.rows,
    });
    toast.success(`${r.title} — PDF downloaded`);
  }
  function handleCSV(key: ReportKey) {
    const r = buildReport(key);
    const stamp = new Date().toISOString().slice(0, 10);
    const rows = r.rows.map((row) => Object.fromEntries(r.columns.map((c, i) => [c, row[i]])));
    exportCSV(`${r.title.replace(/\s+/g, "-")}-${stamp}.csv`, rows);
    toast.success(`${r.title} — CSV downloaded`);
  }

  return (
    <div>
      <PageHeader
        breadcrumb="Intelligence"
        title="Reports"
        description="Generate polished, audit-ready reports in seconds — all backed by cited source documents."
        actions={<Button className="gradient-primary text-white shadow-elegant"><FileBarChart className="h-4 w-4" aria-hidden="true" /> Custom report</Button>}
      />
      <PageBody>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {catalog.map((c) => (
            <div key={c.key} className="group overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant">
              <div className="flex items-start justify-between">
                <div className={`grid h-12 w-12 place-items-center rounded-xl bg-${c.tone}/10 text-${c.tone}`}>
                  <c.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <Badge variant="secondary" className="border-0 bg-muted text-[10px]">{c.tag}</Badge>
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Button size="sm" className="gradient-primary text-white shadow-elegant" onClick={() => handlePDF(c.key)}>
                  <FileBarChart className="h-3.5 w-3.5" aria-hidden="true" /> Export PDF
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleCSV(c.key)}>
                  <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" /> Export CSV
                </Button>
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
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><FileBarChart className="h-4 w-4" aria-hidden="true" /></div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                    <p className="text-[11px] text-muted-foreground">{r.type} · {r.date} · {r.size}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handlePDF(r.key)}>
                  <Download className="h-3.5 w-3.5" aria-hidden="true" /> Download
                </Button>
              </div>
            ))}
          </div>
        </div>
      </PageBody>
    </div>
  );
}
