import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Search, Command, FileText, Wrench, ShieldCheck, Sparkles, LayoutDashboard, Bell, User, Settings, Upload, ArrowRight, Loader2 } from "lucide-react";
import { searchGlobalFn, GlobalSearchResultItem } from "@/functions/search";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const quickActions = [
  { label: "Executive Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { label: "AI Copilot & RAG", url: "/copilot", icon: Sparkles },
  { label: "Document Library", url: "/documents", icon: FileText },
  { label: "Knowledge Graph", url: "/knowledge-graph", icon: Command },
  { label: "Maintenance Intelligence", url: "/maintenance", icon: Wrench },
  { label: "Compliance Intelligence", url: "/compliance", icon: ShieldCheck },
  { label: "Upload Document", url: "/upload", icon: Upload },
  { label: "Profile & Security", url: "/profile", icon: User },
  { label: "Workspace Settings", url: "/settings", icon: Settings },
];

export function CommandModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { userId } = useAuth();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["global_search", query, userId],
    queryFn: async () => {
      if (!userId || !query || query.trim().length === 0) return [];
      return await searchGlobalFn({ data: { query, userId } });
    },
    enabled: open && !!userId && query.trim().length > 0,
    staleTime: 5000,
  });

  const handleSelect = (url: string) => {
    onOpenChange(false);
    setQuery("");
    navigate({ to: url });
  };

  const filteredQuickActions = quickActions.filter(a =>
    query.trim() === "" || a.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden p-0 shadow-2xl border-border/80">
        <div className="flex items-center border-b border-border/60 px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <Input
            placeholder="Search documents, equipment, SOPs, ISO standards, or type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
            autoFocus
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary ml-2" />}
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border/70 bg-muted px-2 py-0.5 text-xs text-muted-foreground ml-2">
            ESC
          </kbd>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-4 space-y-4">
          {query.trim().length > 0 && results.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground px-2 mb-2 uppercase tracking-wider">Live Search Results</p>
              <div className="space-y-1">
                {results.map((r: GlobalSearchResultItem) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(r.url)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition hover:bg-primary/10 focus:bg-primary/10 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                        {r.category === "Document" && <FileText className="h-4 w-4" />}
                        {r.category === "Equipment" && <Wrench className="h-4 w-4" />}
                        {r.category === "Compliance" && <ShieldCheck className="h-4 w-4" />}
                        {r.category === "Copilot" && <Sparkles className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Badge variant="outline" className="text-[10px] bg-background">{r.category}</Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query.trim().length > 0 && !isLoading && results.length === 0 && filteredQuickActions.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No matches found for "{query}"</p>
              <p className="text-xs mt-1">Try searching by asset tag (e.g. P-101), ISO standard, or document keyword.</p>
            </div>
          )}

          {filteredQuickActions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground px-2 mb-2 uppercase tracking-wider">Navigation & Quick Actions</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {filteredQuickActions.map((a) => (
                  <button
                    key={a.url}
                    onClick={() => handleSelect(a.url)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-muted/80 focus:bg-muted/80 group"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-foreground group-hover:bg-primary/15 group-hover:text-primary transition">
                      <a.icon className="h-4 w-4" />
                    </span>
                    <span className="font-medium truncate flex-1">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
