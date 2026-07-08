import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Maximize2, Search, ZoomIn, ZoomOut, Filter, Cog, FileText, User,
  Wrench, ShieldCheck, TriangleAlert, ClipboardCheck, X, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageBody, PageHeader } from "@/components/layout/page-header";

export const Route = createFileRoute("/_app/knowledge-graph")({
  head: () => ({ meta: [{ title: "Knowledge Graph — IndustrialMind AI" }] }),
  component: KnowledgeGraph,
});

type Node = { id: string; label: string; kind: string; x: number; y: number; r: number };
const nodes: Node[] = [
  { id: "hx88", label: "HX-88", kind: "asset", x: 50, y: 50, r: 26 },
  { id: "p101", label: "P-101", kind: "asset", x: 22, y: 30, r: 20 },
  { id: "c204", label: "C-204", kind: "asset", x: 78, y: 28, r: 20 },
  { id: "b17", label: "B-17", kind: "asset", x: 30, y: 78, r: 22 },
  { id: "sop1", label: "SOP-HX-05", kind: "doc", x: 68, y: 72, r: 15 },
  { id: "insp", label: "Insp Q3", kind: "doc", x: 62, y: 20, r: 14 },
  { id: "rca", label: "RCA-2024-011", kind: "incident", x: 12, y: 60, r: 15 },
  { id: "haz", label: "HAZOP-A", kind: "doc", x: 88, y: 55, r: 14 },
  { id: "iso", label: "ISO 55001", kind: "compliance", x: 45, y: 12, r: 14 },
  { id: "eng1", label: "S. Malhotra", kind: "person", x: 15, y: 85, r: 12 },
  { id: "eng2", label: "R. Iyer", kind: "person", x: 85, y: 85, r: 12 },
  { id: "wo", label: "WO-88423", kind: "maintenance", x: 90, y: 40, r: 13 },
];

const edges: [string, string][] = [
  ["hx88", "p101"], ["hx88", "c204"], ["hx88", "b17"], ["hx88", "sop1"],
  ["hx88", "insp"], ["hx88", "rca"], ["hx88", "haz"], ["hx88", "iso"],
  ["hx88", "wo"], ["p101", "eng1"], ["c204", "eng2"], ["b17", "sop1"],
  ["rca", "eng1"], ["wo", "sop1"], ["insp", "iso"],
];

const kindStyle: Record<string, { fill: string; icon: any; label: string }> = {
  asset: { fill: "var(--color-primary)", icon: Cog, label: "Asset" },
  doc: { fill: "var(--color-accent)", icon: FileText, label: "Document" },
  incident: { fill: "var(--color-destructive)", icon: TriangleAlert, label: "Incident" },
  compliance: { fill: "var(--color-warning)", icon: ShieldCheck, label: "Compliance" },
  person: { fill: "var(--color-info)", icon: User, label: "Person" },
  maintenance: { fill: "var(--color-success)", icon: Wrench, label: "Maintenance" },
};

function KnowledgeGraph() {
  const [selected, setSelected] = useState<Node | null>(nodes[0]);
  return (
    <div>
      <PageHeader
        breadcrumb="Intelligence"
        title="Knowledge Graph"
        description="126,483 semantic links across assets, documents, incidents, people and compliance records."
        actions={<>
          <Button variant="outline" size="sm"><Filter className="h-4 w-4" /> Filters</Button>
          <Button size="sm" variant="outline"><Maximize2 className="h-4 w-4" /> Fullscreen</Button>
        </>}
      />
      <PageBody>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Graph canvas */}
          <div className="relative h-[640px] overflow-hidden rounded-2xl border border-border/60 bg-card">
            <div className="absolute inset-0 gradient-mesh opacity-40" />
            <div className="absolute inset-x-4 top-4 z-10 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search graph…" className="glass h-9 pl-9" />
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-border/70 glass p-0.5">
                <Button variant="ghost" size="icon" className="h-8 w-8"><ZoomIn className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><ZoomOut className="h-4 w-4" /></Button>
              </div>
            </div>

            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="glow">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </radialGradient>
              </defs>
              {edges.map(([a, b], i) => {
                const na = nodes.find(n => n.id === a)!;
                const nb = nodes.find(n => n.id === b)!;
                return (
                  <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                    stroke="var(--color-primary)" strokeOpacity={0.35} strokeWidth={0.15}
                    strokeDasharray="0.5 0.5" className="animate-pulse-glow" style={{ animationDelay: `${i * 0.2}s` }} />
                );
              })}
              {nodes.map((n) => {
                const s = kindStyle[n.kind];
                const isSel = selected?.id === n.id;
                return (
                  <g key={n.id} onClick={() => setSelected(n)} className="cursor-pointer">
                    {isSel && <circle cx={n.x} cy={n.y} r={n.r / 4 + 3} fill="url(#glow)" />}
                    <circle cx={n.x} cy={n.y} r={n.r / 8} fill={s.fill} stroke={isSel ? "white" : "transparent"} strokeWidth={0.3} className="transition-all" />
                    <text x={n.x} y={n.y + n.r / 8 + 2} textAnchor="middle" fontSize={1.6} fill="var(--color-foreground)" fontWeight={600}>{n.label}</text>
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-10 glass rounded-xl p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Legend</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {Object.entries(kindStyle).map(([k, s]) => (
                  <div key={k} className="flex items-center gap-2 text-[11px] text-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.fill }} />
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detail drawer */}
          <aside className="rounded-2xl border border-border/60 bg-card">
            {selected ? (
              <>
                <div className="flex items-center justify-between border-b border-border/60 p-5">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${kindStyle[selected.kind].fill} 20%, transparent)`, color: kindStyle[selected.kind].fill }}>
                      {(() => { const I = kindStyle[selected.kind].icon; return <I className="h-5 w-5" />; })()}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">{selected.label}</p>
                      <p className="text-[11px] text-muted-foreground">{kindStyle[selected.kind].label}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-4 p-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Overview</p>
                    <p className="mt-1.5 text-sm text-foreground">Shell &amp; Tube Heat Exchanger, part of Heat Recovery Unit 3. Critical asset with active anomaly detection.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Stat label="Health" value="34%" tone="destructive" />
                    <Stat label="RUL" value="21 d" tone="warning" />
                    <Stat label="Linked docs" value="42" />
                    <Stat label="Incidents" value="3" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Connected nodes</p>
                    <div className="mt-2 space-y-1.5">
                      {["SOP-HX-05", "RCA-2024-011", "HAZOP-A", "Insp Q3", "WO-88423", "ISO 55001"].map((n) => (
                        <div key={n} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs">
                          <span className="truncate text-foreground">{n}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button className="w-full gradient-primary text-white shadow-elegant">Open full profile</Button>
                </div>
              </>
            ) : (
              <div className="p-10 text-center text-sm text-muted-foreground">
                Click any node in the graph to inspect it.
              </div>
            )}
          </aside>
        </div>
      </PageBody>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warning" | "destructive" }) {
  const cls = tone === "destructive" ? "text-destructive" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold ${cls}`}>{value}</p>
    </div>
  );
}
