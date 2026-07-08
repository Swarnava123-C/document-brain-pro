import { createFileRoute } from "@tanstack/react-router";
import { Search, BookOpen, MessageCircle, Newspaper, ChevronRight, LifeBuoy, Mail, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageBody, PageHeader } from "@/components/layout/page-header";

export const Route = createFileRoute("/_app/help")({
  head: () => ({ meta: [{ title: "Help Center — IndustrialMind AI" }] }),
  component: Help,
});

const faqs = [
  { q: "How does IndustrialMind index engineering drawings?", a: "P&IDs and isometric drawings are parsed at tag level using our proprietary CAD-aware vision model." },
  { q: "Can I connect my SAP PM or Maximo instance?", a: "Yes — pre-built connectors available for SAP PM, IBM Maximo, Oracle EAM, and OSIsoft PI." },
  { q: "How is data secured at rest and in transit?", a: "AES-256 at rest, TLS 1.3 in transit, per-tenant key isolation, SOC 2 Type II certified." },
  { q: "What LLMs power the AI Copilot?", a: "You can bring your own private LLM (Azure OpenAI, AWS Bedrock, on-prem Llama) or use our managed models." },
  { q: "How do I request a new compliance framework?", a: "Contact your CSM — we typically ship new frameworks within 4–6 weeks." },
  { q: "Can I export chat conversations as reports?", a: "Yes — every AI Copilot conversation can be exported to PDF with cited sources included." },
];

function Help() {
  return (
    <div>
      <PageHeader breadcrumb="Account" title="Help Center" description="Answers, guides, release notes, and human support." />
      <PageBody>
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-10 text-center">
          <div className="absolute inset-0 gradient-mesh opacity-40" />
          <div className="relative">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">How can we help?</h2>
            <div className="relative mx-auto mt-6 max-w-xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search knowledge base…" className="h-12 pl-11 text-base" />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
              {["Getting started", "SAP PM setup", "SSO", "API reference", "Air-gapped deploy"].map(t => (
                <button key={t} className="rounded-full border border-border/70 bg-card/80 px-3 py-1 text-muted-foreground hover:bg-card">{t}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { icon: BookOpen, title: "Documentation", desc: "Guides, API reference, and admin how-tos." },
            { icon: Video, title: "Video tutorials", desc: "35+ short videos across every module." },
            { icon: LifeBuoy, title: "Contact support", desc: "24/7 for Enterprise. Average reply < 15 min." },
          ].map((c) => (
            <div key={c.title} className="group rounded-2xl border border-border/60 bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant">
              <div className="grid h-11 w-11 place-items-center rounded-xl gradient-primary text-white shadow-elegant">
                <c.icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm font-semibold">{c.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
              <Button variant="ghost" size="sm" className="mt-3 -ml-2">Explore <ChevronRight className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card">
            <div className="border-b border-border/60 px-6 py-4">
              <p className="text-sm font-semibold">Frequently asked</p>
            </div>
            <div className="divide-y divide-border/60">
              {faqs.map((f, i) => (
                <details key={i} className="group px-6 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                    <span className="text-sm font-medium">{f.q}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition group-open:rotate-90" />
                  </summary>
                  <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card">
            <div className="border-b border-border/60 px-6 py-4">
              <p className="text-sm font-semibold">Release notes</p>
            </div>
            <div className="divide-y divide-border/60">
              {[
                { v: "v6.4", date: "Sep 05", items: ["Vision model upgrade for isometric drawings", "New OISD-116 evidence pack template"] },
                { v: "v6.3", date: "Aug 22", items: ["SAP PM connector GA", "Compliance calendar in dashboard"] },
                { v: "v6.2", date: "Aug 08", items: ["Predictive maintenance ML v3", "Air-gapped installer improvements"] },
              ].map(r => (
                <div key={r.v} className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Badge className="border-primary/30 bg-primary/10 text-primary">{r.v}</Badge>
                    <span className="text-xs text-muted-foreground">{r.date}, 2026</span>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {r.items.map(i => <li key={i}>• {i}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageBody>
    </div>
  );
}
