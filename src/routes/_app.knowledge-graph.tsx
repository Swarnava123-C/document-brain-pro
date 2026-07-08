import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getKnowledgeGraphFn, getNodeDetailsFn, GraphNode, GraphEdge } from "@/functions/graph";
import {
  Maximize2, Search, ZoomIn, ZoomOut, Filter, Cog, FileText, User,
  Wrench, ShieldCheck, TriangleAlert, X, ExternalLink, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import ReactMarkdown from "react-markdown";

// Since ForceGraph2D uses canvas, we only render it on the client
let ForceGraph2D: any = null;
if (typeof window !== "undefined") {
  ForceGraph2D = require("react-force-graph-2d").default;
}

export const Route = createFileRoute("/_app/knowledge-graph")({
  head: () => ({ meta: [{ title: "Knowledge Graph — IndustrialMind AI" }] }),
  component: KnowledgeGraph,
});

const kindStyle: Record<string, { fill: string; icon: any; label: string }> = {
  asset: { fill: "#10b981", icon: Cog, label: "Asset" },
  doc: { fill: "#3b82f6", icon: FileText, label: "Document" },
  incident: { fill: "#ef4444", icon: TriangleAlert, label: "Incident" },
  compliance: { fill: "#f59e0b", icon: ShieldCheck, label: "Compliance" },
  person: { fill: "#8b5cf6", icon: User, label: "Person" },
  department: { fill: "#6366f1", icon: Wrench, label: "Department" },
  maintenance: { fill: "#14b8a6", icon: Wrench, label: "Maintenance" },
};

function KnowledgeGraph() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fgRef = useRef<any>();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
  });
  const userId = session?.user?.id;

  const { data: graphData, isLoading: isLoadingGraph } = useQuery({
    queryKey: ["knowledge_graph"],
    queryFn: async () => {
      if (!userId) return { nodes: [], edges: [] };
      return await getKnowledgeGraphFn(userId);
    },
    enabled: !!userId
  });

  const { data: nodeDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ["node_details", selectedNode?.id],
    queryFn: async () => {
      if (!userId || !selectedNode) return null;
      return await getNodeDetailsFn({
        nodeId: selectedNode.id,
        nodeLabel: selectedNode.label,
        nodeKind: selectedNode.kind,
        userId
      });
    },
    enabled: !!userId && !!selectedNode
  });

  // Handle Search Filtering
  const filteredData = useMemo(() => {
    if (!graphData) return { nodes: [], edges: [] };
    if (!searchQuery) return graphData;

    const query = searchQuery.toLowerCase();
    const matchedNodes = new Set<string>();

    graphData.nodes.forEach(n => {
      if (n.label.toLowerCase().includes(query)) matchedNodes.add(n.id);
    });

    const filteredNodes = graphData.nodes.filter(n => matchedNodes.has(n.id));
    const filteredEdges = graphData.edges.filter(e => matchedNodes.has(e.source as string) && matchedNodes.has(e.target as string));

    return { nodes: filteredNodes, edges: filteredEdges };
  }, [graphData, searchQuery]);

  const handleZoomIn = () => fgRef.current?.zoom(fgRef.current.zoom() * 1.2, 400);
  const handleZoomOut = () => fgRef.current?.zoom(fgRef.current.zoom() * 0.8, 400);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const style = kindStyle[node.kind] || kindStyle.asset;
    const label = node.label;
    const fontSize = 12 / globalScale;
    const radius = Math.sqrt(node.val) * 3;

    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = selectedNode?.id === node.id ? "#ffffff" : style.fill;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = style.fill;
    ctx.stroke();

    if (globalScale > 0.8 || selectedNode?.id === node.id) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#cbd5e1';
      ctx.font = `600 ${fontSize}px Inter, sans-serif`;
      ctx.fillText(label, node.x, node.y + radius + (8 / globalScale));
    }
  }, [selectedNode]);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        breadcrumb="Intelligence"
        title="Knowledge Graph"
        description={`${graphData?.nodes.length || 0} semantic nodes and ${graphData?.edges.length || 0} relationships auto-generated from your documents.`}
        actions={<>
          <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" /> Filters</Button>
          <Button size="sm" variant="outline"><Maximize2 className="h-4 w-4 mr-1" /> Fullscreen</Button>
        </>}
      />
      
      <PageBody className="flex-1 pb-4">
        <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Graph canvas */}
          <div className="relative h-full min-h-[640px] overflow-hidden rounded-2xl border border-border/60 bg-card">
            <div className="absolute inset-0 gradient-mesh opacity-40 pointer-events-none" />
            <div className="absolute inset-x-4 top-4 z-10 flex items-center gap-2 pointer-events-auto">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search graph (e.g. Pump, Valve)..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass h-9 pl-9 shadow-lg" 
                />
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-border/70 glass p-0.5 shadow-lg bg-background/50 backdrop-blur">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}><ZoomIn className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}><ZoomOut className="h-4 w-4" /></Button>
              </div>
            </div>

            {isLoadingGraph ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="animate-pulse">Building semantic graph from documents...</p>
                </div>
              </div>
            ) : typeof window !== "undefined" && ForceGraph2D && (
              <div className="absolute inset-0 [&_canvas]:outline-none">
                <ForceGraph2D
                  ref={fgRef}
                  graphData={filteredData}
                  nodeCanvasObject={paintNode}
                  nodeRelSize={6}
                  linkColor={() => 'rgba(148, 163, 184, 0.2)'}
                  linkWidth={0.5}
                  onNodeClick={(node: any) => {
                    setSelectedNode(node);
                    fgRef.current?.centerAt(node.x, node.y, 1000);
                    fgRef.current?.zoom(2.5, 1000);
                  }}
                  onBackgroundClick={() => setSelectedNode(null)}
                  d3VelocityDecay={0.3}
                />
              </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-10 glass rounded-xl p-3 bg-background/60 backdrop-blur shadow-lg pointer-events-auto">
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
          <aside className="h-full rounded-2xl border border-border/60 bg-card overflow-y-auto">
            {selectedNode ? (
              <>
                <div className="flex items-center justify-between border-b border-border/60 p-5 sticky top-0 bg-card/80 backdrop-blur z-10">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${kindStyle[selectedNode.kind]?.fill || "#fff"} 20%, transparent)`, color: kindStyle[selectedNode.kind]?.fill || "#fff" }}>
                      {(() => { const I = kindStyle[selectedNode.kind]?.icon || Cog; return <I className="h-5 w-5" />; })()}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground truncate max-w-[200px]" title={selectedNode.label}>{selectedNode.label}</p>
                      <p className="text-[11px] text-muted-foreground">{kindStyle[selectedNode.kind]?.label || "Unknown"}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedNode(null)}><X className="h-4 w-4" /></Button>
                </div>
                
                <div className="space-y-6 p-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
                      AI Generated Insights
                      {isLoadingDetails && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                    </p>
                    
                    {isLoadingDetails ? (
                      <div className="space-y-2 mt-2">
                        <div className="h-2 w-full bg-muted rounded-full animate-pulse" />
                        <div className="h-2 w-5/6 bg-muted rounded-full animate-pulse" />
                        <div className="h-2 w-4/6 bg-muted rounded-full animate-pulse" />
                      </div>
                    ) : (
                      <div className="text-sm text-foreground prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{nodeDetails?.summary || "No insights found."}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Connected Documents</p>
                    <div className="mt-2 space-y-1.5">
                      {nodeDetails?.relatedDocs?.map((n: any) => (
                        <div key={n.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs hover:bg-muted/50 transition-colors cursor-pointer group">
                          <span className="truncate text-foreground max-w-[200px]" title={n.name}>{n.name}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      ))}
                      {!isLoadingDetails && nodeDetails?.relatedDocs?.length === 0 && (
                        <p className="text-xs text-muted-foreground">No documents found linked to this entity.</p>
                      )}
                    </div>
                  </div>
                  <Button className="w-full gradient-primary text-white shadow-elegant">Explore in Copilot</Button>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-10 text-center text-sm text-muted-foreground">
                <Cog className="h-12 w-12 text-muted-foreground/30 mb-4 animate-[spin_10s_linear_infinite]" />
                <p>Click any node in the graph to inspect its AI-generated insights and provenance.</p>
              </div>
            )}
          </aside>
        </div>
      </PageBody>
    </div>
  );
}
