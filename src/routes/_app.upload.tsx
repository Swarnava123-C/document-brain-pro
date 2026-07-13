import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Upload, FileText, Image as ImageIcon, FileSpreadsheet, FileArchive, Mail, PenTool,
  X, CheckCircle2, Loader2, ScanText, Sparkles, Network, ChevronRight, ChevronDown,
  Cpu, Database, LinkIcon, ShieldCheck, Wrench, Calendar, User as UserIcon,
  Zap, FileSearch, Presentation,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PIPELINE_STAGES, generateProfile, formatBytes, guessDocType, type IntelligenceProfile } from "@/lib/pipeline";
import { processDocumentFn } from "@/functions/pipeline";

export const Route = createFileRoute("/_app/upload")({
  head: () => ({ meta: [{ title: "Document Intelligence — IndustrialMind AI" }] }),
  component: UploadCenter,
});

type DocRow = {
  id: string;
  name: string;
  doc_type: string;
  size_bytes: number;
  storage_path: string | null;
  department: string | null;
  equipment_tag: string | null;
  engineer_name: string | null;
  status: string;
  current_stage: number;
  confidence: number | null;
  ai_summary: string | null;
  keywords: string[] | null;
  detected_equipment: string[] | null;
  related_assets: string[] | null;
  regulatory_refs: string[] | null;
  entities: Record<string, string[]> | null;
  created_at: string;
};

const STAGE_ICONS = [Upload, ScanText, FileText, Network, FileSearch, Sparkles, LinkIcon, Cpu, CheckCircle2];

const DOC_ICON = (t: string) => {
  const s = t.toLowerCase();
  if (s.includes("draw")) return PenTool;
  if (s.includes("image")) return ImageIcon;
  if (s.includes("sheet")) return FileSpreadsheet;
  if (s.includes("archive")) return FileArchive;
  if (s.includes("email")) return Mail;
  if (s.includes("present")) return Presentation;
  return FileText;
};

function UploadCenter() {
  const { user, loading: authLoading } = useAuth();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "queued" | "processing" | "ready" | "failed">("all");
  const [entitiesOpen, setEntitiesOpen] = useState(true);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
    if (error) { console.error(error); return; }
    setDocs((data as unknown as DocRow[]) ?? []);
    setSelectedId((prev) => prev ?? (data?.[0]?.id ?? null));
  }, []);

  useEffect(() => { if (user) load(); }, [user, load]);

  // Realtime updates from pipeline advancement
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("documents-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "documents", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, load]);



  async function handleFiles(files: FileList | File[]) {
    if (!user) { toast.error("Sign in to upload"); return; }
    const arr = Array.from(files).slice(0, 20);
    for (const file of arr) {
      const profile = generateProfile(file.name);
      const storagePath = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      // Upload to storage (best-effort — pipeline still runs on metadata even if storage fails)
      const { error: upErr } = await supabase.storage.from("documents").upload(storagePath, file, { upsert: false });
      if (upErr) console.warn("storage upload failed", upErr.message);

      const { data, error } = await supabase.from("documents").insert({
        user_id: user.id,
        name: file.name,
        doc_type: guessDocType(file.name),
        size_bytes: file.size,
        storage_path: upErr ? null : storagePath,
        status: "processing",
        current_stage: 0,
        department: profile.department,
        equipment_tag: profile.equipment_tag,
        engineer_name: profile.engineer_name,
      }).select().single();
      if (error) { toast.error(`Upload failed: ${error.message}`); continue; }
      const row = data as unknown as DocRow;
      toast.success(`${file.name} queued for intelligence pipeline`);
      setDocs((d) => [row, ...d]);
      setSelectedId(row.id);
      
      processDocumentFn({ data: { docId: row.id, storagePath: upErr ? null : storagePath, filename: file.name } })
        .then(() => {
          load();
        })
        .catch((err) => {
          console.error("Pipeline processing error:", err);
          load();
        });
    }
  }

  async function removeDoc(id: string) {
    const doc = docs.find((d) => d.id === id);
    if (doc?.storage_path) await supabase.storage.from("documents").remove([doc.storage_path]);
    await supabase.from("documents").delete().eq("id", id);
    setDocs((d) => d.filter((x) => x.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  const filtered = useMemo(
    () => docs.filter((d) => filter === "all" ? true : filter === "processing" ? (d.status === "processing" || d.status === "queued") : d.status === filter),
    [docs, filter]
  );
  const selected = docs.find((d) => d.id === selectedId) ?? filtered[0];

  const counts = useMemo(() => ({
    all: docs.length,
    queued: docs.filter((d) => d.status === "queued").length,
    processing: docs.filter((d) => d.status === "processing").length,
    ready: docs.filter((d) => d.status === "ready").length,
    failed: docs.filter((d) => d.status === "failed").length,
  }), [docs]);

  return (
    <div>
      <PageHeader
        breadcrumb="Workspace"
        title="Document Intelligence"
        description="Azure-grade OCR, entity extraction, embeddings, and knowledge-graph linking — all in one pipeline."
        actions={
          <Button className="gradient-primary text-white shadow-elegant" onClick={() => fileInput.current?.click()}>
            <Upload className="h-4 w-4" aria-hidden="true" /> Upload documents
          </Button>
        }
      />
      <input
        ref={fileInput}
        type="file"
        multiple
        className="sr-only"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        aria-label="Select files to upload"
      />
      <PageBody>
        {/* Dropzone */}
        <div
          className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-8 text-center transition ${dragging ? "border-primary bg-primary/10" : "border-primary/40 bg-gradient-to-br from-primary/5 via-card to-accent/5"}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files); }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.current?.click(); } }}
          onClick={() => fileInput.current?.click()}
          aria-label="Drop files here or press Enter to browse"
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl gradient-primary shadow-elegant">
            <Upload className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <p className="mt-3 text-base font-semibold text-foreground">Drop industrial documents here</p>
          <p className="mt-1 text-xs text-muted-foreground">PDF · DOCX · XLSX · DWG · Images · Emails · ZIP · up to 20 files per batch</p>
        </div>

        {/* Pipeline stages summary */}
        <div className="mt-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-9">
          {PIPELINE_STAGES.map((s, i) => {
            const active = docs.filter((d) => d.current_stage === i && d.status !== "ready").length;
            const done = docs.filter((d) => d.current_stage > i || d.status === "ready").length;
            const Icon = STAGE_ICONS[i];
            return (
              <div key={s.key} className="rounded-xl border border-border/60 bg-card p-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Stage {i + 1}</p>
                </div>
                <p className="mt-2 text-xs font-semibold text-foreground">{s.label}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{done} done · {active} active</p>
              </div>
            );
          })}
        </div>

        {/* Three-panel workspace */}
        <div className="mt-6 grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)_340px]">
          {/* LEFT: Documents list */}
          <div className="rounded-2xl border border-border/60 bg-card">
            <div className="border-b border-border/60 p-3">
              <div className="flex flex-wrap gap-1">
                {(["all", "processing", "ready", "failed"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${filter === f ? "bg-primary text-primary-foreground" : "border border-border/70 bg-background text-muted-foreground hover:bg-muted"}`}
                    aria-pressed={filter === f}
                  >
                    {f[0].toUpperCase() + f.slice(1)}
                    <span className="rounded bg-black/10 px-1 text-[9px]">{counts[f]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="max-h-[560px] divide-y divide-border/60 overflow-y-auto">
              {authLoading && <p className="p-6 text-center text-xs text-muted-foreground">Loading…</p>}
              {!authLoading && filtered.length === 0 && (
                <div className="p-8 text-center">
                  <Database className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  <p className="mt-2 text-sm font-medium">No documents yet</p>
                  <p className="text-xs text-muted-foreground">Upload files to see them here.</p>
                </div>
              )}
              {filtered.map((d) => {
                const Icon = DOC_ICON(d.doc_type);
                const stage = PIPELINE_STAGES[Math.min(d.current_stage, PIPELINE_STAGES.length - 1)];
                const pct = d.status === "ready" ? 100 : Math.round(((d.current_stage + 1) / PIPELINE_STAGES.length) * 100);
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    className={`grid w-full grid-cols-[auto_minmax(0,1fr)] gap-3 p-3 text-left transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${selectedId === d.id ? "bg-primary/5" : ""}`}
                    aria-current={selectedId === d.id ? "true" : undefined}
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-primary">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">{d.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatBytes(d.size_bytes)} · {d.doc_type}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Progress value={pct} className="h-1 flex-1" aria-label={`${stage.label} ${pct}%`} />
                        <span className="text-[9px] font-medium text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        {d.status === "ready" ? (
                          <CheckCircle2 className="h-3 w-3 text-success" aria-hidden="true" />
                        ) : (
                          <Loader2 className="h-3 w-3 animate-spin text-primary" aria-hidden="true" />
                        )}
                        <span className="text-[10px] text-muted-foreground">{stage.label}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CENTER: Preview + pipeline + metadata */}
          <div className="rounded-2xl border border-border/60 bg-card">
            {!selected ? (
              <div className="grid h-[560px] place-items-center px-6 text-center">
                <div>
                  <FileSearch className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
                  <p className="mt-2 text-sm font-medium">Select a document</p>
                  <p className="text-xs text-muted-foreground">Detailed intelligence appears here.</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-3 border-b border-border/60 p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="border-0 bg-primary/10 text-primary">{selected.doc_type}</Badge>
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${selected.status === "ready" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>
                        {selected.status === "ready" ? <CheckCircle2 className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin" />}
                        {selected.status.toUpperCase()}
                      </span>
                    </div>
                    <h2 className="mt-2 truncate text-lg font-semibold">{selected.name}</h2>
                    <p className="text-xs text-muted-foreground">Uploaded {new Date(selected.created_at).toLocaleString()} · {formatBytes(selected.size_bytes)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeDoc(selected.id)} aria-label="Delete document">
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>

                {/* Preview panel */}
                <div className="p-5">
                  <div className="grid h-40 place-items-center overflow-hidden rounded-xl border border-dashed border-border/70 bg-gradient-to-br from-primary/5 via-muted/30 to-accent/5">
                    {(() => { const I = DOC_ICON(selected.doc_type); return <I className="h-14 w-14 text-primary/60" aria-hidden="true" />; })()}
                  </div>
                </div>

                {/* Metadata grid */}
                <div className="grid grid-cols-2 gap-3 border-t border-border/60 px-5 py-4 md:grid-cols-4">
                  <Meta label="Department" value={selected.department ?? "—"} />
                  <Meta label="Equipment Tag" value={selected.equipment_tag ?? "—"} />
                  <Meta label="Engineer" value={selected.engineer_name ?? "—"} />
                  <Meta label="Confidence" value={selected.confidence != null ? `${(selected.confidence * 100).toFixed(1)}%` : "—"} highlight />
                </div>

                {/* Pipeline timeline */}
                <div className="border-t border-border/60 px-5 py-4">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Processing pipeline</p>
                  <ol className="space-y-1.5">
                    {PIPELINE_STAGES.map((s, i) => {
                      const done = selected.status === "ready" || i < selected.current_stage;
                      const active = !done && i === selected.current_stage && selected.status !== "ready";
                      const Icon = STAGE_ICONS[i];
                      return (
                        <li key={s.key} className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-xs ${active ? "bg-primary/5" : ""}`}>
                          <span className={`grid h-6 w-6 place-items-center rounded-full ${done ? "bg-success/20 text-success" : active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-medium ${done ? "text-foreground" : active ? "text-primary" : "text-muted-foreground"}`}>{s.label}</p>
                            <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                          </div>
                          {done && <span className="text-[10px] font-medium text-success">Complete</span>}
                          {active && <span className="text-[10px] font-medium text-primary">Running</span>}
                        </li>
                      );
                    })}
                  </ol>
                </div>

                {/* AI Summary */}
                <div className="border-t border-border/60 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">AI Summary</p>
                  </div>
                  {selected.ai_summary ? (
                    <p className="mt-2 text-sm leading-relaxed text-foreground">{selected.ai_summary}</p>
                  ) : (
                    <p className="mt-2 text-sm italic text-muted-foreground">Awaiting AI analysis…</p>
                  )}
                </div>

                {/* Chips */}
                <div className="grid gap-4 border-t border-border/60 px-5 py-4 sm:grid-cols-2">
                  <ChipGroup icon={Zap} title="Extracted Keywords" items={selected.keywords} />
                  <ChipGroup icon={Wrench} title="Detected Equipment" items={selected.detected_equipment} />
                  <ChipGroup icon={Network} title="Related Assets" items={selected.related_assets} />
                  <ChipGroup icon={ShieldCheck} title="Regulatory References" items={selected.regulatory_refs} />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Extracted entities panel */}
          <aside className="rounded-2xl border border-border/60 bg-card">
            <button
              onClick={() => setEntitiesOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 border-b border-border/60 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
              aria-expanded={entitiesOpen}
            >
              <div>
                <p className="text-sm font-semibold">Extracted Entities</p>
                <p className="text-[11px] text-muted-foreground">Grouped by industrial category</p>
              </div>
              {entitiesOpen ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
            </button>
            {entitiesOpen && (
              <div className="max-h-[720px] space-y-3 overflow-y-auto p-4">
                {!selected?.entities ? (
                  <p className="text-xs text-muted-foreground">Entity extraction pending…</p>
                ) : (
                  <>
                    <EntityGroup icon={Cpu} label="Equipment IDs" items={selected.entities.equipmentIds} tone="primary" />
                    <EntityGroup icon={Zap} label="Valve IDs" items={selected.entities.valveIds} tone="info" />
                    <EntityGroup icon={Wrench} label="Pump IDs" items={selected.entities.pumpIds} tone="accent" />
                    <EntityGroup icon={FileText} label="Boiler IDs" items={selected.entities.boilerIds} tone="warning" />
                    <EntityGroup icon={Calendar} label="Maintenance Dates" items={selected.entities.maintenanceDates} tone="muted" />
                    <EntityGroup icon={UserIcon} label="Engineers" items={selected.entities.engineers} tone="muted" />
                    <EntityGroup icon={ShieldCheck} label="Safety Procedures" items={selected.entities.safetyProcedures} tone="success" />
                    <EntityGroup icon={ShieldCheck} label="Compliance Standards" items={selected.entities.complianceStandards} tone="primary" />
                  </>
                )}
              </div>
            )}
          </aside>
        </div>
      </PageBody>
    </div>
  );
}

function Meta({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function ChipGroup({ icon: Icon, title, items }: { icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>; title: string; items: string[] | null }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden={true} />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(items ?? []).length === 0 && <span className="text-[11px] text-muted-foreground">—</span>}
        {(items ?? []).map((x) => (
          <span key={x} className="rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-[11px] text-foreground">{x}</span>
        ))}
      </div>
    </div>
  );
}

const TONE: Record<string, string> = {
  primary: "border-primary/30 bg-primary/10 text-primary",
  info: "border-info/30 bg-info/10 text-info",
  accent: "border-accent/30 bg-accent/10 text-accent",
  warning: "border-warning/30 bg-warning/10 text-warning",
  success: "border-success/30 bg-success/10 text-success",
  muted: "border-border/70 bg-muted text-foreground",
};

function EntityGroup({ icon: Icon, label, items, tone = "muted" }: { icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>; label: string; items: string[] | undefined; tone?: keyof typeof TONE }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-background/50 p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden={true} />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">{items.length}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {items.map((x) => (
          <span key={x} className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${TONE[tone]}`}>{x}</span>
        ))}
      </div>
    </div>
  );
}
