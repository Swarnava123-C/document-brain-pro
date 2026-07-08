import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getComplianceDashboardFn, generateAuditReportFn, ComplianceStandard } from "@/functions/compliance";
import {
  ShieldCheck, Calendar, AlertTriangle, FileBarChart, CheckCircle2,
  Clock, ArrowRight, Leaf, HardHat, Flame, Loader2, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/compliance")({
  head: () => ({ meta: [{ title: "Compliance Center — IndustrialMind AI" }] }),
  component: Compliance,
});

function Compliance() {
  const [reportStandard, setReportStandard] = useState<string>("");
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Auth Session
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    }
  });
  const userId = session?.user?.id;

  // Fetch Compliance Dashboard Data
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["compliance_dashboard"],
    queryFn: async () => {
      if (!userId) return null;
      return await getComplianceDashboardFn({ data: userId });
    },
    enabled: !!userId,
  });

  // Fetch AI Audit Report
  const { data: auditReport, isLoading: isGeneratingReport, isFetching: isFetchingReport } = useQuery({
    queryKey: ["audit_report", reportStandard],
    queryFn: async () => {
      if (!userId || !reportStandard) return null;
      return await generateAuditReportFn({ data: { standardCode: reportStandard, userId } });
    },
    enabled: !!userId && !!reportStandard && isReportOpen,
    staleTime: 1000 * 60 * 15,
  });

  const handlePrint = () => {
    window.print();
  };

  const standards = dashboard?.standards || [];
  const calendar = dashboard?.calendar || [];
  const kpis = dashboard?.kpis || { overallScore: "0.0", expiredCerts: 0, pendingActions: 0, passed: 0 };

  return (
    <div className="print:bg-white print:text-black">
      {/* Hide PageHeader when printing */}
      <div className="print:hidden">
        <PageHeader
          breadcrumb="Intelligence"
          title="Compliance Center"
          description="Continuous AI compliance tracking across ISO, OISD, PESO, and internal standards extracted from your documents."
          actions={
            <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-white shadow-elegant">
                  <FileBarChart className="h-4 w-4 mr-2" /> Generate AI audit report
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col print:hidden">
                <DialogHeader>
                  <DialogTitle>AI Audit Readiness Report</DialogTitle>
                  <DialogDescription>
                    Select a regulatory standard. Gemini will synthesize all relevant uploaded documents to generate a compliance assessment.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex gap-3 py-4 border-b border-border">
                  <Select value={reportStandard} onValueChange={setReportStandard}>
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Select a standard (e.g. ISO 9001)" />
                    </SelectTrigger>
                    <SelectContent>
                      {standards.map(s => (
                        <SelectItem key={s.code} value={s.code}>{s.code} - {s.name}</SelectItem>
                      ))}
                      {standards.length === 0 && <SelectItem value="mock" disabled>No standards detected yet</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                  {!reportStandard ? (
                     <div className="text-center text-muted-foreground py-12">
                        <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Select a standard above to begin AI generation.</p>
                     </div>
                  ) : isGeneratingReport || isFetchingReport ? (
                    <div className="text-center text-muted-foreground py-16 flex flex-col items-center">
                       <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                       <p className="font-medium text-foreground">Synthesizing document history...</p>
                       <p className="text-sm mt-1">Gemini 2.5 Flash is analyzing compliance evidence for {reportStandard}.</p>
                    </div>
                  ) : auditReport ? (
                    <div className="space-y-6" id="printable-audit-report">
                      <div className="flex items-center justify-between">
                         <h3 className="text-xl font-bold text-foreground">Audit Summary: {reportStandard}</h3>
                         <div className="flex items-center gap-2">
                           <span className="text-sm text-muted-foreground">Readiness Score:</span>
                           <span className={`text-xl font-bold ${auditReport.readinessScore >= 85 ? 'text-success' : auditReport.readinessScore >= 70 ? 'text-warning' : 'text-destructive'}`}>
                             {auditReport.readinessScore}/100
                           </span>
                         </div>
                      </div>
                      
                      <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                        <p className="leading-relaxed">{auditReport.executiveSummary}</p>
                      </div>

                      {auditReport.openViolations.length > 0 && (
                        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                          <p className="font-semibold text-destructive flex items-center gap-2 mb-2">
                             <AlertTriangle className="h-4 w-4" /> Open Violations & Risks
                          </p>
                          <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
                            {auditReport.openViolations.map((v, i) => <li key={i}>{v}</li>)}
                          </ul>
                        </div>
                      )}

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-border bg-card p-4">
                           <p className="font-semibold text-foreground mb-2">Missing Evidence</p>
                           <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                             {auditReport.missingEvidence.length > 0 ? 
                               auditReport.missingEvidence.map((m, i) => <li key={i}>{m}</li>) : 
                               <li>No critical evidence missing.</li>
                             }
                           </ul>
                        </div>
                        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                           <p className="font-semibold text-primary mb-2">Recommended Actions</p>
                           <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
                             {auditReport.correctiveActions.length > 0 ?
                               auditReport.correctiveActions.map((c, i) => <li key={i}>{c}</li>) :
                               <li>No corrective actions required.</li>
                             }
                           </ul>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
                
                <div className="pt-4 border-t border-border flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsReportOpen(false)}>Close</Button>
                  <Button disabled={!auditReport || isGeneratingReport} onClick={handlePrint} className="gap-2">
                    <Download className="h-4 w-4" /> Export PDF
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          }
        />
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold">IndustrialMind AI</h1>
        <h2 className="text-xl text-gray-600 mt-1">Audit Readiness Report: {reportStandard}</h2>
        <p className="text-sm text-gray-500 mt-2">Generated on {new Date().toLocaleDateString()}</p>
      </div>

      {/* The main page body - hidden during print so we only print the dialog if desired. 
          Actually, since the dialog is normally in a portal, window.print() prints the body. 
          To handle printing just the report nicely, we can conditionally hide the dashboard 
          when the print dialog is invoked, or rely on CSS media queries. */}
      <div className={`print:${isReportOpen && reportStandard && auditReport ? 'hidden' : 'block'}`}>
        <PageBody>
          {/* Top KPIs */}
          <div className="grid gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 to-accent/10 p-6 lg:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex justify-between">
                Overall score
                {isLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-5xl font-bold text-gradient">{kpis.overallScore}</span>
                <span className="text-lg font-semibold text-muted-foreground">/100</span>
              </div>
              <p className="mt-1 text-xs text-success">Live dynamic scoring</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full gradient-primary transition-all duration-1000" style={{ width: `${parseFloat(kpis.overallScore)}%` }} />
              </div>
            </div>
            {[
              { icon: Clock, label: "Pending actions", value: kpis.pendingActions, tone: "warning" },
              { icon: AlertTriangle, label: "Critical violations", value: kpis.expiredCerts, tone: "destructive" },
              { icon: CheckCircle2, label: "Audits passed (YTD)", value: kpis.passed, tone: "success" },
            ].map((k) => (
              <div key={k.label} className="rounded-2xl border border-border/60 bg-card p-6">
                <div className={`grid h-10 w-10 place-items-center rounded-xl bg-${k.tone}/10 text-${k.tone}`}>
                  <k.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-2xl font-bold text-foreground">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin mt-1 text-muted-foreground" /> : k.value}
                </p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Standards */}
          <div className="mt-6 rounded-2xl border border-border/60 bg-card">
            <div className="border-b border-border/60 px-6 py-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold">Regulatory standards registry</p>
                <p className="text-xs text-muted-foreground">Extracted automatically from compliance and regulatory documents</p>
              </div>
            </div>
            <div className="divide-y divide-border/60">
              {isLoading ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Building compliance registry from documents...
                </div>
              ) : standards.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  No standards extracted yet. Upload regulatory documents or manuals to begin.
                </div>
              ) : (
                standards.map((s) => (
                  <div key={s.code} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-6 py-4 md:grid-cols-[220px_minmax(0,1fr)_150px_140px_auto] md:items-center hover:bg-muted/30 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{s.code}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{s.name}</p>
                    </div>
                    <div className="hidden items-center gap-3 md:flex">
                      <Progress value={s.score} className={`h-1.5 flex-1 ${s.score < 70 ? '[&>div]:bg-destructive' : s.score < 85 ? '[&>div]:bg-warning' : '[&>div]:bg-success'}`} />
                      <span className="w-10 text-right text-xs font-semibold">{s.score}</span>
                    </div>
                    <div className="hidden md:block">
                      <StatusPill status={s.status} />
                    </div>
                    <div className="hidden text-xs text-muted-foreground md:block">Audit: {s.next}</div>
                    <Button size="sm" variant="ghost" className="justify-self-end text-primary" onClick={() => {
                      setReportStandard(s.code);
                      setIsReportOpen(true);
                    }}>Analyze <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Risk cards + timeline */}
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-6">
              <p className="text-sm font-semibold">Upcoming compliance calendar</p>
              <p className="text-xs text-muted-foreground">Predicted milestones based on documentation</p>
              <div className="mt-5 space-y-3">
                {isLoading ? (
                  <div className="py-10 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
                ) : calendar.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground text-sm">No upcoming events detected.</div>
                ) : (
                  calendar.map((c, i) => (
                    <div key={i} className="flex items-start gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 hover:bg-muted/40 transition-colors">
                      <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl shadow-sm text-white ${c.tone === 'primary' ? 'gradient-primary' : `bg-${c.tone}`}`}>
                        <div className="text-center leading-none">
                          <p className="text-[9px] uppercase opacity-90">{c.date.split(" ")[0]}</p>
                          <p className="text-lg font-bold">{c.date.split(" ")[1]}</p>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{c.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{c.desc}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => { setReportStandard(c.title.split(" ")[0]); setIsReportOpen(true); }}>Prepare</Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              {[
                { icon: Flame, title: "Fire safety", score: 78, desc: "OISD checks running", tone: "warning" },
                { icon: Leaf, title: "Environmental", score: 92, desc: "ISO 14001 baseline", tone: "success" },
                { icon: HardHat, title: "Safety audits", score: 89, desc: "ISO 45001 monitoring", tone: "info" },
              ].map((r) => (
                <div key={r.title} className="rounded-2xl border border-border/60 bg-card p-5">
                  <div className="flex items-center gap-3">
                    <div className={`grid h-11 w-11 place-items-center rounded-xl bg-${r.tone}/10 text-${r.tone}`}>
                      <r.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{r.title}</p>
                      <p className="text-[11px] text-muted-foreground">{r.desc}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <Progress value={r.score} className={`h-1.5 flex-1 [&>div]:bg-${r.tone}`} />
                    <span className="text-lg font-bold text-foreground">{r.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PageBody>
      </div>
      
      {/* Print-only Report Body */}
      <div className="hidden print:block print:p-8">
         {isReportOpen && reportStandard && auditReport ? (
           <div className="space-y-6 text-black">
              <div className="flex items-center justify-between border-b pb-4">
                 <h3 className="text-2xl font-bold">Readiness Score</h3>
                 <span className="text-2xl font-bold">{auditReport.readinessScore}/100</span>
              </div>
              
              <div>
                <h4 className="text-lg font-bold mb-2">Executive Summary</h4>
                <p className="leading-relaxed text-sm">{auditReport.executiveSummary}</p>
              </div>

              {auditReport.openViolations.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-bold mb-2 text-red-700">Open Violations & Risks</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {auditReport.openViolations.map((v, i) => <li key={i}>{v}</li>)}
                  </ul>
                </div>
              )}

              <div className="mt-6">
                  <h4 className="text-lg font-bold mb-2">Missing Evidence</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                    {auditReport.missingEvidence.length > 0 ? 
                      auditReport.missingEvidence.map((m, i) => <li key={i}>{m}</li>) : 
                      <li>No critical evidence missing.</li>
                    }
                  </ul>
              </div>

              <div className="mt-6">
                  <h4 className="text-lg font-bold mb-2 text-blue-700">Recommended Corrective Actions</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {auditReport.correctiveActions.length > 0 ?
                      auditReport.correctiveActions.map((c, i) => <li key={i}>{c}</li>) :
                      <li>No corrective actions required.</li>
                    }
                  </ul>
              </div>
           </div>
         ) : null}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: ComplianceStandard["status"] }) {
  const map = {
    "Compliant": "bg-success/15 text-success",
    "Action Required": "bg-warning/15 text-warning",
    "Non-Compliant": "bg-destructive/15 text-destructive",
  };
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${map[status]}`}>
    {status === "Compliant" ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />} {status}
  </span>;
}
