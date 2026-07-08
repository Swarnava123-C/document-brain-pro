import { createFileRoute } from "@tanstack/react-router";
import {
  Upload, FileText, Image, FileSpreadsheet, FileArchive, Mail, PenTool,
  X, CheckCircle2, Loader2, ScanText, Sparkles, Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageBody, PageHeader } from "@/components/layout/page-header";

export const Route = createFileRoute("/_app/upload")({
  head: () => ({ meta: [{ title: "Upload Center — IndustrialMind AI" }] }),
  component: UploadCenter,
});

const uploads = [
  { name: "P&ID-Unit3-Rev12.dwg", size: "18.4 MB", stage: "Embedding", pct: 72, icon: PenTool, color: "text-accent" },
  { name: "Turbine-GT2-Overhaul-Report.pdf", size: "24.1 MB", stage: "Indexed", pct: 100, icon: FileText, color: "text-primary" },
  { name: "Inspection-Q3-2026.xlsx", size: "3.6 MB", stage: "Entity Extraction", pct: 48, icon: FileSpreadsheet, color: "text-success" },
  { name: "SOP-Cold-Startup-B17.docx", size: "1.2 MB", stage: "Ready", pct: 100, icon: FileText, color: "text-primary" },
  { name: "Site-Photos-Sep08.zip", size: "112 MB", stage: "OCR Processing", pct: 21, icon: FileArchive, color: "text-warning" },
  { name: "Vendor-emails-thread.eml", size: "820 KB", stage: "Uploaded", pct: 12, icon: Mail, color: "text-muted-foreground" },
];

const stageIcon = (s: string) => {
  if (s === "Ready" || s === "Indexed") return CheckCircle2;
  if (s === "OCR Processing") return ScanText;
  if (s === "Entity Extraction") return Network;
  if (s === "Embedding") return Sparkles;
  return Loader2;
};

const stageColor = (s: string) => {
  if (s === "Ready" || s === "Indexed") return "text-success bg-success/10";
  if (s === "OCR Processing") return "text-warning bg-warning/10";
  if (s === "Entity Extraction") return "text-info bg-info/10";
  if (s === "Embedding") return "text-primary bg-primary/10";
  return "text-muted-foreground bg-muted";
};

function UploadCenter() {
  const supported = [
    { label: "PDF", icon: FileText },
    { label: "DOCX", icon: FileText },
    { label: "PPT", icon: FileText },
    { label: "Excel", icon: FileSpreadsheet },
    { label: "CSV", icon: FileSpreadsheet },
    { label: "Images", icon: Image },
    { label: "Drawings", icon: PenTool },
    { label: "ZIP", icon: FileArchive },
    { label: "Emails", icon: Mail },
  ];
  return (
    <div>
      <PageHeader
        breadcrumb="Workspace"
        title="Upload Center"
        description="Drag & drop industrial documents. OCR, entity extraction, and semantic indexing run automatically."
        actions={<Button className="gradient-primary text-white shadow-elegant"><Upload className="h-4 w-4" /> Browse files</Button>}
      />
      <PageBody>
        {/* Dropzone */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/5 via-card to-accent/5 p-10 text-center transition hover:border-primary/60">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl gradient-primary shadow-elegant animate-float">
            <Upload className="h-8 w-8 text-white" />
          </div>
          <p className="mt-4 text-lg font-semibold text-foreground">Drop files anywhere, or click to browse</p>
          <p className="mt-1 text-sm text-muted-foreground">Bulk upload up to 500 files or 5 GB per batch. Nested folders and ZIPs supported.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {supported.map((f) => (
              <span key={f.label} className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                <f.icon className="h-3 w-3" /> {f.label}
              </span>
            ))}
          </div>
        </div>

        {/* Pipeline stages */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {["Uploaded", "OCR", "Entity Extraction", "Embedding", "Indexed", "Ready"].map((s, i) => (
            <div key={s} className="rounded-xl border border-border/60 bg-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Stage {i + 1}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{s}</p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full gradient-primary" style={{ width: `${100 - i * 15}%` }} />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">{[42, 18, 12, 8, 4, 220][i]} files</p>
            </div>
          ))}
        </div>

        {/* Active queue */}
        <div className="mt-6 rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div>
              <p className="text-sm font-semibold">Processing queue</p>
              <p className="text-xs text-muted-foreground">6 files in pipeline · avg. processing time 2m 40s</p>
            </div>
            <Badge className="border-success/20 bg-success/10 text-success">Pipeline healthy</Badge>
          </div>
          <div className="divide-y divide-border/60">
            {uploads.map((u) => {
              const StageIcon = stageIcon(u.stage);
              return (
                <div key={u.name} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-6 py-4">
                  <div className={`grid h-10 w-10 place-items-center rounded-xl bg-muted ${u.color}`}>
                    <u.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="truncate text-sm font-medium text-foreground">{u.name}</p>
                      <span className="text-[11px] text-muted-foreground">{u.size}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <Progress value={u.pct} className="h-1.5 flex-1" />
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${stageColor(u.stage)}`}>
                        <StageIcon className={`h-3 w-3 ${u.pct < 100 && u.stage !== "Uploaded" ? "animate-spin" : ""}`} /> {u.stage}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground"><X className="h-4 w-4" /></Button>
                </div>
              );
            })}
          </div>
        </div>
      </PageBody>
    </div>
  );
}
