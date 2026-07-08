import { createFileRoute } from "@tanstack/react-router";
import {
  Search, Filter, LayoutGrid, List, FileText, Download, Eye, Pencil,
  Trash2, MoreHorizontal, Upload, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { formatBytes } from "@/lib/pipeline";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/documents")({
  head: () => ({ meta: [{ title: "Document Library — IndustrialMind AI" }] }),
  component: DocsPage,
});

const filters = ["All Types", "Engineering Drawing", "SOP", "Inspection", "Safety Study", "Maintenance Log", "Certificate", "RCA", "Manual"];
const depts = ["All Departments", "Process", "Operations", "Reliability", "HSE", "Maintenance", "Compliance", "Quality"];

function DocsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data: dbDocs = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const documents = dbDocs.map((d) => ({
    id: d.id,
    name: d.name,
    type: d.doc_type,
    size: formatBytes(d.size_bytes),
    dept: d.department || "Unknown",
    updated: formatDistanceToNow(new Date(d.created_at), { addSuffix: true }),
    tags: d.keywords || [],
  }));

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
            <Input placeholder="Search by name, tag, asset ID…" className="h-10 pl-9" />
          </div>
          <FilterDropdown label="Type" options={filters} />
          <FilterDropdown label="Department" options={depts} />
          <Button variant="outline" size="sm"><Filter className="h-4 w-4" /> More filters</Button>
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
            { l: "All", n: 48392, active: true },
            { l: "Engineering Drawings", n: 8412 },
            { l: "SOPs", n: 3210 },
            { l: "Inspections", n: 6144 },
            { l: "Maintenance Logs", n: 12089 },
            { l: "HAZOP & Safety", n: 1876 },
            { l: "Compliance", n: 2340 },
          ].map((c) => (
            <button key={c.l} className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${c.active ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-card text-muted-foreground hover:bg-muted"}`}>
              {c.l}
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${c.active ? "bg-primary/20" : "bg-muted"}`}>{c.n.toLocaleString()}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {view === "grid" ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {documents.map((d) => (
              <div key={d.id} className="group overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant">
                <div className="relative flex h-36 items-center justify-center gradient-mesh">
                  <FileText className="h-12 w-12 text-primary/70" />
                  <Badge className="absolute left-3 top-3 border-0 bg-background/90 text-[10px] text-foreground">{d.type}</Badge>
                  <div className="absolute right-3 top-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/70 backdrop-blur"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="h-3.5 w-3.5" /> View</DropdownMenuItem>
                        <DropdownMenuItem><Download className="h-3.5 w-3.5" /> Download</DropdownMenuItem>
                        <DropdownMenuItem><Pencil className="h-3.5 w-3.5" /> Rename</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 min-h-10 text-sm font-semibold text-foreground">{d.name}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{d.dept} · {d.size} · {d.updated}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {d.tags.slice(0, 3).map(t => <span key={t} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>)}
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
                  <th className="px-6 py-3">Size</th>
                  <th className="px-6 py-3">Updated</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {documents.map((d) => (
                  <tr key={d.id} className="transition hover:bg-muted/30">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><FileText className="h-4 w-4" /></div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{d.name}</p>
                          <p className="text-[11px] text-muted-foreground">{d.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3"><Badge variant="secondary" className="border-0 bg-muted">{d.type}</Badge></td>
                    <td className="px-6 py-3 text-muted-foreground">{d.dept}</td>
                    <td className="px-6 py-3 text-muted-foreground">{d.size}</td>
                    <td className="px-6 py-3 text-muted-foreground">{d.updated}</td>
                    <td className="px-6 py-3 text-right">
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageBody>
    </div>
  );
}

function FilterDropdown({ label, options }: { label: string; options: string[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">{label} <ChevronDown className="h-3.5 w-3.5" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map(o => <DropdownMenuItem key={o}>{o}</DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
