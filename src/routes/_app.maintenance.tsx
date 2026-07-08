import { createFileRoute } from "@tanstack/react-router";
import {
  Wrench, TrendingDown, AlertTriangle, Activity, Clock, Cog,
  ArrowRight, TrendingUp, FileBarChart,
} from "lucide-react";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip as RTooltip,
  CartesianGrid, RadialBarChart, RadialBar, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { equipment } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance Intelligence — IndustrialMind AI" }] }),
  component: Maintenance,
});

const healthTrend = [
  { d: "Jul 12", HX88: 74, C204: 82, B17: 71 },
  { d: "Jul 19", HX88: 68, C204: 80, B17: 68 },
  { d: "Jul 26", HX88: 62, C204: 78, B17: 65 },
  { d: "Aug 02", HX88: 55, C204: 77, B17: 63 },
  { d: "Aug 09", HX88: 48, C204: 75, B17: 61 },
  { d: "Aug 16", HX88: 42, C204: 73, B17: 60 },
  { d: "Aug 23", HX88: 37, C204: 72, B17: 59 },
  { d: "Aug 30", HX88: 34, C204: 71, B17: 58 },
];

function Maintenance() {
  const critical = equipment.filter(e => e.status !== "Optimal");
  return (
    <div>
      <PageHeader
        breadcrumb="Intelligence"
        title="Maintenance Intelligence"
        description="Predictive health, remaining useful life and AI-driven maintenance recommendations across 1,204 units."
        actions={<Button className="gradient-primary text-white shadow-elegant"><FileBarChart className="h-4 w-4" /> Maintenance report</Button>}
      />
      <PageBody>
        {/* KPIs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: "Fleet health", v: "83.4", suf: "/100", d: "+2.1", icon: Activity, tone: "success" },
            { l: "Failures prevented (Q3)", v: "27", d: "+18", icon: TrendingUp, tone: "success" },
            { l: "Critical assets", v: "1", suf: " HX-88", d: "", icon: AlertTriangle, tone: "destructive" },
            { l: "MTBF (rolling)", v: "487h", d: "+34h", icon: Clock, tone: "info" },
          ].map((k) => (
            <div key={k.l} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center justify-between">
                <div className={`grid h-10 w-10 place-items-center rounded-xl bg-${k.tone}/10 text-${k.tone}`}>
                  <k.icon className="h-5 w-5" />
                </div>
                {k.d && <Badge variant="secondary" className="bg-success/10 text-success">{k.d}</Badge>}
              </div>
              <p className="mt-4 text-2xl font-bold text-foreground">{k.v}<span className="text-sm text-muted-foreground">{k.suf ?? ""}</span></p>
              <p className="text-xs text-muted-foreground">{k.l}</p>
            </div>
          ))}
        </div>

        {/* Health trend */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card p-6 lg:col-span-2">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold">Critical asset health trend</p>
                <p className="text-xs text-muted-foreground">Last 8 weeks · lower is worse</p>
              </div>
              <Badge className="border-destructive/30 bg-destructive/10 text-destructive">HX-88 declining</Badge>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={healthTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.4} />
                  <XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} domain={[20, 100]} />
                  <RTooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="HX88" stroke="var(--color-destructive)" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="C204" stroke="var(--color-warning)" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="B17" stroke="var(--color-info)" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI RCA */}
          <div className="rounded-2xl border border-destructive/30 bg-gradient-to-br from-destructive/10 via-card to-card p-6">
            <Badge className="border-destructive/30 bg-destructive/15 text-destructive"><AlertTriangle className="h-3 w-3" /> Critical alert</Badge>
            <h3 className="mt-3 text-lg font-bold text-foreground">HX-88 predicted failure in 21 days</h3>
            <p className="mt-1 text-xs text-muted-foreground">Confidence 94% · Pattern matches HX-42 (2024)</p>
            <div className="mt-4 space-y-2 text-xs text-foreground">
              <p className="font-semibold text-muted-foreground">Root cause hypothesis</p>
              <p>Early-stage tube bundle degradation on rows 12–24. Shell-side ΔT + tube ΔP anomaly correlate.</p>
              <p className="mt-3 font-semibold text-muted-foreground">Recommended actions</p>
              <ul className="space-y-1 pl-4 [list-style:disc]">
                <li>Schedule inspection Sep 12–14 (Unit 3 slow-down)</li>
                <li>IRIS / eddy-current on rows 12–24</li>
                <li>Hydrotest at 1.5× MAWP</li>
                <li>Order replacement tubes (lead time 6 days)</li>
              </ul>
            </div>
            <Button className="mt-5 w-full gradient-primary text-white shadow-elegant">Create work order <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Equipment table */}
        <div className="mt-4 rounded-2xl border border-border/60 bg-card">
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div>
              <p className="text-sm font-semibold">Equipment health registry</p>
              <p className="text-xs text-muted-foreground">Top monitored assets across all units</p>
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
                  <th className="px-6 py-3">RUL</th>
                  <th className="px-6 py-3">Last service</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {equipment.map((e) => (
                  <tr key={e.id} className="transition hover:bg-muted/30">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Cog className="h-4 w-4" /></div>
                        <div>
                          <p className="font-medium text-foreground">{e.name}</p>
                          <p className="text-[11px] text-muted-foreground">Tag {e.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{e.area}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={e.health} className="h-1.5 w-24" />
                        <span className="text-xs font-semibold">{e.health}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3"><StatusPill status={e.status} /></td>
                    <td className="px-6 py-3 text-foreground">{e.rul} d</td>
                    <td className="px-6 py-3 text-muted-foreground">{e.lastService}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageBody>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Optimal: "bg-success/15 text-success",
    Monitor: "bg-info/15 text-info",
    Warning: "bg-warning/15 text-warning",
    Critical: "bg-destructive/15 text-destructive",
  };
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${map[status]}`}>{status}</span>;
}
