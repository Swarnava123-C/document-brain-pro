import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { getEquipmentHealthFn, generateRCAFn, EquipmentHealth } from "@/functions/maintenance";
import {
  Wrench, TrendingDown, AlertTriangle, Activity, Clock, Cog,
  ArrowRight, TrendingUp, FileBarChart, Loader2, Search, CheckCircle2
} from "lucide-react";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip as RTooltip,
  CartesianGrid, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { PageBody, PageHeader } from "@/components/layout/page-header";

export const Route = createFileRoute("/_app/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance Intelligence — IndustrialMind AI" }] }),
  component: Maintenance,
});

function Maintenance() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const { userId } = useAuth();

  // 2. Fetch Equipment Health Registry
  const { data: equipmentList = [], isLoading: isLoadingHealth } = useQuery({
    queryKey: ["equipment_health"],
    queryFn: async () => {
      if (!userId) return [];
      return await getEquipmentHealthFn({ data: userId });
    },
    enabled: !!userId,
  });

  // Default selection to the most critical asset
  useEffect(() => {
    if (equipmentList.length > 0 && !selectedAssetId) {
      setSelectedAssetId(equipmentList[0].id);
    }
  }, [equipmentList, selectedAssetId]);

  const selectedAsset = equipmentList.find(e => e.id === selectedAssetId) || equipmentList[0];

  // 3. Fetch RCA for Selected Asset
  const { data: rcaData, isLoading: isLoadingRCA } = useQuery({
    queryKey: ["asset_rca", selectedAssetId],
    queryFn: async () => {
      if (!userId || !selectedAssetId) return null;
      return await generateRCAFn({ data: { equipmentId: selectedAssetId, userId } });
    },
    enabled: !!userId && !!selectedAssetId,
    staleTime: 1000 * 60 * 10, // Cache for 10 mins so we don't spam Gemini
  });

  // Calculate top-level KPIs
  const criticalAssets = equipmentList.filter(e => e.status === "Critical" || e.status === "Warning");
  const avgHealth = equipmentList.length ? (equipmentList.reduce((acc, curr) => acc + curr.health, 0) / equipmentList.length).toFixed(1) : "0.0";
  const mtbf = 487; // Can be static or derived

  // Format Health Trend Chart Data based on Top 3 Critical Assets
  const chartData = useMemo(() => {
    if (equipmentList.length === 0) return { data: [], lines: [] };
    
    // We'll graph up to 3 assets (the selected one, plus 1 or 2 others to compare)
    const topAssetsToGraph = equipmentList.slice(0, 3);
    if (selectedAsset && !topAssetsToGraph.find(a => a.id === selectedAsset.id)) {
      topAssetsToGraph[0] = selectedAsset;
    }

    const labels = ["Wk -8", "Wk -7", "Wk -6", "Wk -5", "Wk -4", "Wk -3", "Wk -2", "Current"];
    const formattedData: any[] = [];

    for (let i = 0; i < 8; i++) {
      const dataPoint: any = { time: labels[i] };
      topAssetsToGraph.forEach(asset => {
        dataPoint[asset.id] = asset.trend[i];
      });
      formattedData.push(dataPoint);
    }
    return { data: formattedData, lines: topAssetsToGraph };
  }, [equipmentList, selectedAsset]);

  // Filter Table
  const filteredEquipment = equipmentList.filter(e => 
    e.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.area.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        breadcrumb="Intelligence"
        title="Predictive Maintenance"
        description={`AI-driven health monitoring, RUL prediction, and Root Cause Analysis across ${equipmentList.length || 0} registered assets.`}
        actions={<Button className="gradient-primary text-white shadow-elegant"><FileBarChart className="h-4 w-4 mr-2" /> Maintenance report</Button>}
      />
      
      <PageBody>
        {/* KPIs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: "Fleet health", v: avgHealth, suf: "/100", d: "", icon: Activity, tone: "success" },
            { l: "Failures prevented", v: "14", d: "+3", icon: TrendingUp, tone: "success" },
            { l: "Critical & Warning assets", v: criticalAssets.length.toString(), suf: "", d: "", icon: AlertTriangle, tone: criticalAssets.length > 0 ? "destructive" : "success" },
            { l: "MTBF (rolling)", v: `${mtbf}h`, d: "+12h", icon: Clock, tone: "info" },
          ].map((k) => (
            <div key={k.l} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center justify-between">
                <div className={`grid h-10 w-10 place-items-center rounded-xl bg-${k.tone}/10 text-${k.tone}`}>
                  <k.icon className="h-5 w-5" />
                </div>
                {k.d && <Badge variant="secondary" className="bg-success/10 text-success">{k.d}</Badge>}
              </div>
              <p className="mt-4 text-2xl font-bold text-foreground">
                {isLoadingHealth ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground inline" /> : k.v}
                <span className="text-sm text-muted-foreground ml-1">{k.suf ?? ""}</span>
              </p>
              <p className="text-xs text-muted-foreground">{k.l}</p>
            </div>
          ))}
        </div>

        {/* Health trend */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card p-6 lg:col-span-2">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">Asset health trend</p>
                <p className="text-xs text-muted-foreground">Derived from document extraction history</p>
              </div>
              {selectedAsset?.status === "Critical" && (
                <Badge className="border-destructive/30 bg-destructive/10 text-destructive">{selectedAsset.id} declining</Badge>
              )}
            </div>
            
            <div className="h-72">
              {isLoadingHealth ? (
                 <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" /> Constructing health metrics...
                 </div>
              ) : chartData.data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
                    <XAxis dataKey="time" stroke="var(--color-muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={11} domain={[0, 100]} />
                    <RTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12, color: "hsl(var(--foreground))" }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {chartData.lines.map((line: any, idx: number) => {
                      const colors = ["var(--color-destructive)", "var(--color-warning)", "var(--color-info)"];
                      return (
                        <Line key={line.id} type="monotone" dataKey={line.id} stroke={colors[idx % colors.length]} strokeWidth={idx === 0 ? 3 : 1.5} dot={{ r: 3 }} />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                  No equipment extracted from uploaded documents yet.
                </div>
              )}
            </div>
          </div>

          {/* AI RCA Box */}
          <div className={`rounded-2xl border ${selectedAsset?.status === 'Critical' ? 'border-destructive/30 bg-gradient-to-br from-destructive/10 via-card to-card' : 'border-border/60 bg-card'} p-6 relative overflow-hidden`}>
            {isLoadingHealth || isLoadingRCA ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/50 backdrop-blur-sm z-10 p-6 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary mb-4">
                  <Cog className="h-6 w-6 animate-[spin_3s_linear_infinite]" />
                </div>
                <p className="text-sm font-medium">Generating AI Root Cause Analysis</p>
                <p className="text-xs text-muted-foreground mt-1">Gemini is synthesizing document history for {selectedAssetId || "asset"}...</p>
              </div>
            ) : null}

            {selectedAsset ? (
              <>
                <Badge className={selectedAsset.status === 'Critical' ? "border-destructive/30 bg-destructive/15 text-destructive" : selectedAsset.status === 'Warning' ? "border-warning/30 bg-warning/15 text-warning" : "border-success/30 bg-success/15 text-success"}>
                  {selectedAsset.status === 'Critical' || selectedAsset.status === 'Warning' ? <AlertTriangle className="h-3 w-3 mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {selectedAsset.status}
                </Badge>
                <h3 className="mt-3 text-lg font-bold text-foreground leading-tight">{rcaData?.title || `${selectedAsset.id} Analysis`}</h3>
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                  Confidence {(rcaData?.confidence || 0.85) * 100}% · Gemini 2.5 Flash
                </p>
                
                <div className="mt-4 space-y-3 text-xs text-foreground">
                  <div>
                    <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Root cause hypothesis</p>
                    <p className="leading-relaxed">{rcaData?.hypothesis || "No hypothesis available."}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] mb-1">Recommended actions</p>
                    <ul className="space-y-1.5 pl-4 list-disc text-muted-foreground">
                      {rcaData?.recommendations?.map((rec, i) => (
                        <li key={i}><span className="text-foreground">{rec}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
                <Button className={`mt-6 w-full ${selectedAsset.status === 'Critical' ? 'gradient-primary text-white shadow-elegant' : 'variant-outline'}`}>
                  Create work order <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Select an asset from the registry below.
              </div>
            )}
          </div>
        </div>

        {/* Equipment table */}
        <div className="mt-4 rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div>
              <p className="text-sm font-semibold">Equipment health registry</p>
              <p className="text-xs text-muted-foreground">Dynamically extracted from uploaded documents</p>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search equipment ID or area..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-9 text-xs glass" 
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 bg-muted/30 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Asset</th>
                  <th className="px-6 py-3">Area</th>
                  <th className="px-6 py-3">Health</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">RUL Prediction</th>
                  <th className="px-6 py-3">Last Linked Doc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoadingHealth ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Loading dynamic asset registry...
                    </td>
                  </tr>
                ) : filteredEquipment.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      No assets found. Upload more documents to populate the registry.
                    </td>
                  </tr>
                ) : (
                  filteredEquipment.map((e) => (
                    <tr 
                      key={e.id} 
                      onClick={() => setSelectedAssetId(e.id)}
                      className={`transition cursor-pointer ${selectedAssetId === e.id ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${selectedAssetId === e.id ? 'bg-primary text-primary-foreground shadow-md' : 'bg-primary/10 text-primary'}`}>
                            <Cog className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{e.name}</p>
                            <p className="text-[11px] text-muted-foreground">Tag {e.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{e.area}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={e.health} 
                            className={`h-1.5 w-24 ${e.health < 40 ? '[&>div]:bg-destructive' : e.health < 65 ? '[&>div]:bg-warning' : '[&>div]:bg-success'}`} 
                          />
                          <span className="text-xs font-semibold">{e.health}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3"><StatusPill status={e.status} /></td>
                      <td className="px-6 py-3 text-foreground">{e.rul} days</td>
                      <td className="px-6 py-3 text-muted-foreground">{e.lastService}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageBody>
    </div>
  );
}

function StatusPill({ status }: { status: EquipmentHealth["status"] }) {
  const map: Record<string, string> = {
    Optimal: "bg-success/15 text-success",
    Monitor: "bg-info/15 text-info",
    Warning: "bg-warning/15 text-warning",
    Critical: "bg-destructive/15 text-destructive",
  };
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${map[status]}`}>{status}</span>;
}
