import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Brain, Sparkles, Network, TrendingUp, ShieldCheck, FileSearch, GitBranch,
  ScanText, PenTool, History, ArrowRight, Check, Star, Factory, Fuel, Zap,
  Mountain, Hammer, FlaskConical, TestTubes, Building2, Menu, PlayCircle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";

const industries = [
  { name: "Manufacturing", icon: "Factory", stats: "1,240+ plants" },
  { name: "Oil & Gas", icon: "Fuel", stats: "380+ facilities" },
  { name: "Energy & Power", icon: "Zap", stats: "520+ plants" },
  { name: "Mining", icon: "Mountain", stats: "180+ sites" },
  { name: "Steel", icon: "Hammer", stats: "95+ mills" },
  { name: "Pharmaceutical", icon: "FlaskConical", stats: "210+ facilities" },
  { name: "Chemicals", icon: "TestTubes", stats: "340+ plants" },
  { name: "Infrastructure", icon: "Building2", stats: "610+ projects" },
];

const features = [
  { icon: "Sparkles", title: "AI Copilot", desc: "Ask any question about your plant. Get answers with cited sources from 40k+ documents." },
  { icon: "Network", title: "Knowledge Graph", desc: "Every asset, drawing, incident, and SOP linked into a living operational brain." },
  { icon: "TrendingUp", title: "Predictive Maintenance", desc: "Forecast failures weeks in advance using sensor telemetry + historical work orders." },
  { icon: "ShieldCheck", title: "Compliance Intelligence", desc: "Track ISO 55001, OISD, PESO, Factory Act, ISO 14001 continuously — not once a year." },
  { icon: "FileSearch", title: "Semantic Document Search", desc: "Search meaning, not keywords. Across PDFs, DWGs, scans, Excel, and emails." },
  { icon: "GitBranch", title: "Root Cause Analysis", desc: "AI-assisted RCA in minutes: pulls incident history, drawings, and expert notes." },
  { icon: "ScanText", title: "OCR + Entity Extraction", desc: "Understands scanned drawings, handwritten logs, and legacy vendor manuals." },
  { icon: "PenTool", title: "Engineering Drawings", desc: "Native P&ID, isometric, and GA drawing understanding with tag-level linking." },
  { icon: "History", title: "Full Asset History", desc: "Every touchpoint of every asset — from commissioning to today — one timeline." },
];

const IconMap: Record<string, any> = {
  Sparkles, Network, TrendingUp, ShieldCheck, FileSearch, GitBranch, ScanText, PenTool, History,
  Factory, Fuel, Zap, Mountain, Hammer, FlaskConical, TestTubes, Building2,
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IndustrialMind AI — Turn Industrial Documents into an Operational Brain" },
      { name: "description", content: "The AI knowledge intelligence platform for manufacturing, oil & gas, energy, mining, steel, pharma and infrastructure. Copilot, Knowledge Graph, Predictive Maintenance and Compliance in one system." },
    ],
  }),
  component: Landing,
});

function Nav() {
  const links = [
    { label: "Features", href: "#features" },
    { label: "Solutions", href: "#solutions" },
    { label: "Industries", href: "#industries" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 md:px-8">
        <Link to="/"><Logo /></Link>
        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground">{l.label}</a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild size="sm" className="gradient-primary text-white shadow-elegant hover:opacity-95">
            <Link to="/signup">Get Started <ArrowRight className="h-3.5 w-3.5" /></Link>
          </Button>
          <Button variant="ghost" size="icon" className="lg:hidden"><Menu className="h-4 w-4" /></Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-70" />
      <div className="absolute inset-x-0 top-0 -z-10 h-[600px] bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 md:px-8 lg:grid-cols-2 lg:py-28">
        <div className="animate-fade-in">
          <Badge className="mb-5 border-primary/20 bg-primary/10 text-primary hover:bg-primary/15">
            <Sparkles className="h-3 w-3" /> AI-Native for Industrial Enterprises
          </Badge>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Transform industrial documents into an{" "}
            <span className="text-gradient">intelligent knowledge brain</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            IndustrialMind AI unifies your P&amp;IDs, SOPs, inspection reports, HAZOP studies and vendor manuals into a single searchable copilot — with predictive maintenance and continuous compliance built in.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-12 gradient-primary px-6 text-base text-white shadow-elegant hover:opacity-95">
              <Link to="/signup">Start Free <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 border-border/70 px-6 text-base backdrop-blur">
              <PlayCircle className="h-4 w-4" /> Request Demo
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> SOC 2 Type II</div>
            <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> ISO 27001</div>
            <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> On-prem or Cloud</div>
            <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> 99.99% Uptime</div>
          </div>
        </div>
        <HeroMockup />
      </div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="relative animate-fade-in">
      <div className="absolute -inset-6 -z-10 gradient-primary opacity-25 blur-3xl" />
      <div className="glass-strong overflow-hidden rounded-2xl shadow-elegant">
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          </div>
          <div className="rounded-md bg-background/60 px-3 py-0.5 text-[10px] font-medium text-muted-foreground">app.industrialmind.ai/dashboard</div>
          <span className="h-2 w-8" />
        </div>
        <div className="grid grid-cols-3 gap-3 bg-background/50 p-4">
          {[
            { l: "Documents", v: "48,392", d: "+12.4%" },
            { l: "Assets", v: "2,847", d: "+3.1%" },
            { l: "Compliance", v: "94.6%", d: "+1.2%" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-border/60 bg-card p-3">
              <p className="text-[10px] text-muted-foreground">{s.l}</p>
              <p className="mt-1 text-lg font-bold text-foreground">{s.v}</p>
              <p className="text-[10px] font-medium text-success">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-border/60 bg-background/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">Equipment Health — Unit 3</p>
            <Badge variant="secondary" className="h-5 text-[9px]">Live</Badge>
          </div>
          <div className="flex h-32 items-end gap-1.5">
            {[52, 68, 45, 82, 71, 90, 76, 88, 65, 92, 78, 84].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md gradient-primary" style={{ height: `${h}%`, opacity: 0.5 + i * 0.04 }} />
            ))}
          </div>
        </div>
        <div className="border-t border-border/60 bg-card/60 p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg gradient-primary">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 text-xs">
              <p className="font-medium text-foreground">HX-88 shows vibration + temperature anomaly.</p>
              <p className="mt-1 text-muted-foreground">Predicted tube leak in <span className="font-semibold text-warning">21 days</span>. Similar failure pattern seen on HX-42 (2024). Recommend inspection window Sep 8–10.</p>
              <div className="mt-2 flex gap-1.5">
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] text-primary">RCA-2024-011</span>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] text-primary">Inspection Q3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustBar() {
  return (
    <section className="border-y border-border/40 bg-muted/20 py-8">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Trusted by asset-intensive enterprises across 40+ countries</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-lg font-bold tracking-tight text-muted-foreground/70">
          <span>NorthGrid Energy</span>
          <span>Vantage Steel</span>
          <span>PolarChem</span>
          <span>Meridian Oil</span>
          <span>Kavach Pharma</span>
          <span>Ironforge Mining</span>
          <span>Helios Power</span>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-24 md:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <Badge className="border-accent/30 bg-accent/10 text-accent-foreground">Platform</Badge>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Everything a plant needs, in one intelligent workspace</h2>
        <p className="mt-4 text-muted-foreground">Nine deeply integrated modules that turn decades of scattered engineering knowledge into one live, queryable brain.</p>
      </div>
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => {
          const Icon = IconMap[f.icon] ?? Sparkles;
          return (
            <div key={f.title} className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-primary/10 opacity-0 blur-2xl transition group-hover:opacity-100" />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Industries() {
  return (
    <section id="industries" className="bg-muted/20 py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge className="border-primary/20 bg-primary/10 text-primary">Industries</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Built for the industries that build the world</h2>
        </div>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {industries.map((i) => {
            const Icon = IconMap[i.icon] ?? Factory;
            return (
              <div key={i.name} className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-5 transition hover:border-primary/40 hover:shadow-elegant">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.stats}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Upload documents", desc: "Drag & drop PDFs, DWGs, SOPs, Excel, emails or bulk-import from SharePoint, S3, or your DMS." },
    { n: "02", title: "AI understands everything", desc: "OCR + entity extraction + engineering-drawing parsing runs automatically. Tag-level indexing." },
    { n: "03", title: "Ask any question", desc: "Natural language across the entire plant. Filter by asset, unit, date, criticality." },
    { n: "04", title: "Get answers with sources", desc: "Every response is cited to the exact document, page, and drawing tag it came from." },
  ];
  return (
    <section id="solutions" className="mx-auto max-w-7xl px-4 py-24 md:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <Badge className="border-accent/30 bg-accent/10 text-accent-foreground">How it works</Badge>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">From scattered documents to answers in four steps</h2>
      </div>
      <div className="relative mt-16 grid gap-6 md:grid-cols-4">
        <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent md:block" />
        {steps.map((s) => (
          <div key={s.n} className="relative rounded-2xl border border-border/60 bg-card p-6">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-full gradient-primary font-bold text-white shadow-elegant">{s.n}</div>
            <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { name: "Priya Menon", role: "VP Reliability, NorthGrid Energy", quote: "IndustrialMind cut our RCA time from 4 weeks to 2 days. The knowledge graph found failure patterns we didn't know existed." },
    { name: "Marcus Weller", role: "Head of Operations, Vantage Steel", quote: "Our operators now query 30 years of SOPs in seconds. Compliance audits went from panic to routine." },
    { name: "Dr. Anish Kapoor", role: "Plant Director, Kavach Pharma", quote: "The only platform we've seen that actually understands P&IDs and pharma batch records equally well." },
  ];
  return (
    <section className="bg-muted/20 py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Loved by reliability, operations & compliance leaders</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {items.map((t) => (
            <div key={t.name} className="rounded-2xl border border-border/60 bg-card p-6 shadow-card">
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-warning text-warning" />)}
              </div>
              <p className="text-sm leading-relaxed text-foreground">"{t.quote}"</p>
              <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                <div className="grid h-9 w-9 place-items-center rounded-full gradient-primary text-xs font-semibold text-white">
                  {t.name.split(" ").map(n => n[0]).slice(0,2).join("")}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    { name: "Starter", price: "$1,499", period: "/mo", desc: "For pilot plants and single sites.", features: ["Up to 10,000 documents", "50 users", "AI Copilot + Search", "Standard integrations", "Email support"], cta: "Start Free Trial", highlight: false },
    { name: "Enterprise", price: "$5,900", period: "/mo", desc: "For multi-site industrial operators.", features: ["Unlimited documents", "Unlimited users", "Knowledge Graph + Predictive Maintenance", "Compliance suite (ISO, OISD, PESO)", "SSO + Advanced RBAC", "24/7 dedicated CSM"], cta: "Book a Demo", highlight: true },
    { name: "Sovereign", price: "Custom", period: "", desc: "On-prem, air-gapped, regulated industries.", features: ["Air-gapped deployment", "Private LLM (bring-your-own)", "White-glove onboarding", "SLA up to 99.99%", "Regulatory audit support"], cta: "Contact Sales", highlight: false },
  ];
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-4 py-24 md:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <Badge className="border-primary/20 bg-primary/10 text-primary">Pricing</Badge>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Plans that scale from pilot to global rollout</h2>
      </div>
      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {tiers.map((t) => (
          <div key={t.name} className={`relative rounded-2xl border p-8 ${t.highlight ? "border-primary/50 bg-card shadow-elegant" : "border-border/60 bg-card"}`}>
            {t.highlight && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary text-white">Most Popular</Badge>}
            <p className="text-sm font-semibold text-foreground">{t.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-foreground">{t.price}</span>
              <span className="text-sm text-muted-foreground">{t.period}</span>
            </div>
            <Button className={`mt-6 w-full ${t.highlight ? "gradient-primary text-white shadow-elegant" : ""}`} variant={t.highlight ? "default" : "outline"} asChild>
              <Link to="/signup">{t.cta}</Link>
            </Button>
            <ul className="mt-6 space-y-3">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    { q: "How is IndustrialMind different from generic enterprise search?", a: "We're purpose-built for industrial data — engineering drawings, P&IDs, sensor telemetry, SOPs, HAZOP studies. Generic search treats a P&ID as an opaque image; we parse it down to the tag level." },
    { q: "Can we deploy on-premises or air-gapped?", a: "Yes. Sovereign edition runs fully on-prem or air-gapped, with your own private LLM. Common for defense, nuclear, and pharma manufacturing." },
    { q: "How long does implementation take?", a: "A typical single-plant pilot goes live in 3–4 weeks. Multi-site enterprise rollouts run in phased 8–12 week waves." },
    { q: "Which compliance frameworks are supported?", a: "ISO 55001, ISO 14001, ISO 45001, OISD, PESO, Factory Act, cGMP, IEC 61511 and custom internal audit frameworks." },
    { q: "Do you integrate with our existing DMS / EAM / CMMS?", a: "Yes — connectors for SAP PM, Maximo, Oracle EAM, SharePoint, Documentum, OSIsoft PI, AVEVA and more." },
  ];
  return (
    <section id="faq" className="bg-muted/20 py-24">
      <div className="mx-auto max-w-4xl px-4 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h2>
        </div>
        <div className="mt-10 divide-y divide-border/60 rounded-2xl border border-border/60 bg-card">
          {faqs.map((f, i) => (
            <details key={i} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
                <span className="font-medium text-foreground">{f.q}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 md:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-accent/15 p-10 text-center shadow-elegant sm:p-16">
        <div className="absolute inset-0 gradient-mesh opacity-60" />
        <div className="relative">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Ready to give your plant an operational brain?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Join reliability, operations, and compliance leaders using IndustrialMind AI across 40+ countries.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="h-12 gradient-primary px-6 text-white shadow-elegant">
              <Link to="/signup">Start Free <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 border-border/70 px-6">Book Enterprise Demo</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { title: "Product", links: ["AI Copilot", "Knowledge Graph", "Maintenance", "Compliance", "Integrations"] },
    { title: "Industries", links: ["Manufacturing", "Oil & Gas", "Energy", "Pharma", "Mining"] },
    { title: "Company", links: ["About", "Customers", "Careers", "Press", "Contact"] },
    { title: "Resources", links: ["Documentation", "API Reference", "Blog", "Security", "Trust Center"] },
  ];
  return (
    <footer className="border-t border-border/60 bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grid gap-10 md:grid-cols-6">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">The industrial knowledge intelligence platform for asset-intensive enterprises.</p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground">{c.title}</p>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}><a href="#" className="text-sm text-muted-foreground transition hover:text-foreground">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          <p>© 2026 IndustrialMind AI, Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Security</a><a href="#">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <TrustBar />
      <Features />
      <Industries />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
