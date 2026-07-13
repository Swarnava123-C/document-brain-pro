import { createFileRoute } from "@tanstack/react-router";
import {
  Search, Filter, LayoutGrid, List, FileText, Download, Eye, Pencil,
  Trash2, MoreHorizontal, Upload, ChevronDown, CheckCircle2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { formatBytes } from "@/lib/pipeline";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/documents")({
  head: () => ({ meta: [{ title: "Document Library — IndustrialMind AI" }] }),
  component: DocsPage,
});

const filters = ["All Types", "Engineering Drawing", "SOP", "Inspection", "Safety Study", "Maintenance Log", "Certificate", "RCA", "Manual", "Report"];
const depts = ["All Departments", "Process", "Operations", "Reliability", "HSE", "Maintenance", "Compliance", "Quality", "Engineering & Design"];

function DocsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [viewModalDoc, setViewModalDoc] = useState<any | null>(null);
  const queryClient = useQueryClient();

  const { data: dbDocs = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const documents = useMemo(() => {
    return dbDocs.map((d: any) => ({
      id: d.id,
      name: d.name,
      type: d.doc_type || "Manual",
      size: formatBytes(d.size_bytes || 0),
      dept: d.department || "Operations",
      equipmentTag: d.equipment_tag || "GEN-ASSET-01",
      updated: formatDistanceToNow(new Date(d.created_at || Date.now()), { addSuffix: true }),
      tags: d.keywords || [],
      summary: d.ai_summary || "No summary available.",
      fullText: d.full_text || "",
      storagePath: d.storage_path,
      raw: d,
    }));
  }, [dbDocs]);

  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = d.name.toLowerCase().includes(q);
        const matchesTag = d.tags.some((t: string) => t.toLowerCase().includes(q));
        const matchesEq = d.equipmentTag.toLowerCase().includes(q);
        if (!matchesName && !matchesTag && !matchesEq) return false;
      }
      if (selectedType !== "All Types" && !d.type.toLowerCase().includes(selectedType.toLowerCase())) {
        return false;
      }
      if (selectedDept !== "All Departments" && !d.dept.toLowerCase().includes(selectedDept.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [documents, searchQuery, selectedType, selectedDept]);

  const deleteDoc = async (id: string, storagePath?: string | null) => {
    try {
      if (storagePath) {
        await supabase.storage.from("documents").remove([storagePath]);
      }
      await supabase.from("document_chunks").delete().eq("document_id", id);
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
      toast.success("Document deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    } catch (err: any) {
      toast.error("Failed to delete: " + err.message);
    }
  };

  const downloadDoc = async (d: any) => {
    if (d.storagePath) {
      const { data, error } = await supabase.storage.from("documents").createSignedUrl(d.storagePath, 60);
      if (!error && data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
        return;
      }
    }
    // Fallback: download text summary
    const blob = new Blob([`Document: ${d.name}\nType: ${d.type}\nDepartment: ${d.dept}\nEquipment Tag: ${d.equipmentTag}\n\nAI Summary:\n${d.summary}\n\nFull Text:\n${d.fullText || d.summary}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${d.name.replace(/\.[^/.]+$/, "")}_intelligence.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Download started");
  };

  return (
    <div>
      <PageHeader
        breadcrumb="Workspace"
        title="Document Library"
        description={`${documents.length.toLocaleString()} indexed documents across all plants and units.`}
        actions={
          <Button asChild className="gradient-primary text-white shadow-elegant">
            <Link to="/upload"><Upload className="h-4 w-4" /> Upload</Link>
          </Button>
        }
      />
      <PageBody>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card p-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, tag, asset ID…"
              className="h-10 pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <FilterDropdown label={selectedType} options={filters} onSelect={setSelectedType} />
          <FilterDropdown label={selectedDept} options={depts} onSelect={setSelectedDept} />
          {(searchQuery || selectedType !== "All Types" || selectedDept !== "All Departments") && (
            <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(""); setSelectedType("All Types"); setSelectedDept("All Departments"); }}>
              <X className="h-4 w-4 mr-1" /> Reset
            </Button>
          )}
          <div className="ml-auto flex items-center gap-1 rounded-lg border border-border/70 bg-muted/40 p-0.5">
            <Button variant={view === "grid" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("grid")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={view === "list" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("list")}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Category chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { l: "All Types", n: documents.length },
            { l: "Report", n: documents.filter(d => d.type.toLowerCase().includes("report")).length },
            { l: "Engineering Drawing", n: documents.filter(d => d.type.toLowerCase().includes("draw")).length },
            { l: "SOP", n: documents.filter(d => d.type.toLowerCase().includes("sop")).length },
            { l: "Inspection", n: documents.filter(d => d.type.toLowerCase().includes("inspect")).length },
            { l: "Safety Study", n: documents.filter(d => d.type.toLowerCase().includes("safety")).length },
          ].map((c) => (
            <button
              key={c.l}
              onClick={() => setSelectedType(c.l)}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${selectedType === c.l ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-card text-muted-foreground hover:bg-muted"}`}
            >
              {c.l}
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${selectedType === c.l ? "bg-primary/20" : "bg-muted"}`}>{c.n}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Loading documents...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-border/60 bg-card mt-5">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
            <p className="mt-3 font-semibold">No matching documents</p>
            <p className="text-xs text-muted-foreground mt-1">Try clearing your filters or search query.</p>
          </div>
        ) : view === "grid" ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDocs.map((d) => (
              <div key={d.id} className="group overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant">
                <div className="relative flex h-36 items-center justify-center gradient-mesh cursor-pointer" onClick={() => setViewModalDoc(d)}>
                  <FileText className="h-12 w-12 text-primary/70" />
                  <Badge className="absolute left-3 top-3 border-0 bg-background/90 text-[10px] text-foreground">{d.type}</Badge>
                  <div className="absolute right-3 top-3" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/70 backdrop-blur"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewModalDoc(d)}><Eye className="h-3.5 w-3.5 mr-2" /> View Intelligence</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => downloadDoc(d)}><Download className="h-3.5 w-3.5 mr-2" /> Download</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteDoc(d.id, d.storagePath)}><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="p-4 cursor-pointer" onClick={() => setViewModalDoc(d)}>
                  <p className="line-clamp-2 min-h-10 text-sm font-semibold text-foreground">{d.name}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{d.dept} · {d.size} · {d.updated}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {d.tags.slice(0, 3).map((t: string) => <span key={t} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-2xl border border-border/60 bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 bg-muted/30 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Equipment Tag</th>
                  <th className="px-6 py-3">Size</th>
                  <th className="px-6 py-3">Updated</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredDocs.map((d) => (
                  <tr key={d.id} className="transition hover:bg-muted/30 cursor-pointer" onClick={() => setViewModalDoc(d)}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><FileText className="h-4 w-4" /></div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{d.name}</p>
                          <p className="text-[11px] text-muted-foreground">{d.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3"><Badge variant="secondary" className="border-0 bg-muted">{d.type}</Badge></td>
                    <td className="px-6 py-3 text-muted-foreground">{d.dept}</td>
                    <td className="px-6 py-3 font-mono text-xs text-primary">{d.equipmentTag}</td>
                    <td className="px-6 py-3 text-muted-foreground">{d.size}</td>
                    <td className="px-6 py-3 text-muted-foreground">{d.updated}</td>
                    <td className="px-6 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewModalDoc(d)}><Eye className="h-3.5 w-3.5 mr-2" /> View Intelligence</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadDoc(d)}><Download className="h-3.5 w-3.5 mr-2" /> Download</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteDoc(d.id, d.storagePath)}><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* View Document Intelligence Modal */}
        {viewModalDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setViewModalDoc(null)}>
            <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border/80 bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between border-b border-border/60 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary border-0">{viewModalDoc.type}</Badge>
                    <span className="text-xs text-muted-foreground font-mono">{viewModalDoc.equipmentTag}</span>
                  </div>
                  <h3 className="mt-2 text-xl font-bold text-foreground">{viewModalDoc.name}</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setViewModalDoc(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/30 p-4 text-xs sm:grid-cols-4">
                  <div>
                    <span className="text-muted-foreground uppercase text-[10px] font-semibold">Department</span>
                    <p className="font-semibold mt-0.5">{viewModalDoc.dept}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase text-[10px] font-semibold">Equipment Tag</span>
                    <p className="font-semibold mt-0.5 text-primary">{viewModalDoc.equipmentTag}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase text-[10px] font-semibold">Size</span>
                    <p className="font-semibold mt-0.5">{viewModalDoc.size}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase text-[10px] font-semibold">Status</span>
                    <p className="font-semibold mt-0.5 text-success flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Ready</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">AI Summary & Extraction</h4>
                  <p className="text-sm leading-relaxed text-foreground bg-muted/20 p-4 rounded-xl border border-border/40">{viewModalDoc.summary}</p>
                </div>
                {viewModalDoc.tags && viewModalDoc.tags.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Extracted Keywords</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {viewModalDoc.tags.map((t: string) => (
                        <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {viewModalDoc.raw?.regulatory_refs && viewModalDoc.raw.regulatory_refs.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Regulatory & Compliance Standards</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {viewModalDoc.raw.regulatory_refs.map((r: string) => (
                        <Badge key={r} className="bg-success/10 text-success border-0 text-xs">{r}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-3 border-t border-border/60 pt-4">
                <Button variant="outline" onClick={() => downloadDoc(viewModalDoc)}>
                  <Download className="h-4 w-4 mr-1.5" /> Download
                </Button>
                <Button className="gradient-primary text-white" onClick={() => setViewModalDoc(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </PageBody>
    </div>
  );
}

function FilterDropdown({ label, options, onSelect }: { label: string; options: string[]; onSelect: (val: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">{label} <ChevronDown className="h-3.5 w-3.5 ml-1" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map(o => (
          <DropdownMenuItem key={o} onClick={() => onSelect(o)}>{o}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
