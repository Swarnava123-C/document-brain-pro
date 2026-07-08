import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Palette, Bell, Key, Building2, Users, Shield, Database, Plug,
  Moon, Sun, Monitor, Plus, MoreHorizontal, Copy, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { useTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — IndustrialMind AI" }] }),
  component: Settings,
});

const nav = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "api", label: "API Keys", icon: Key },
  { id: "org", label: "Organization", icon: Building2 },
  { id: "team", label: "Team Members", icon: Users },
  { id: "permissions", label: "Roles & Permissions", icon: Shield },
  { id: "backup", label: "Backup", icon: Database },
  { id: "integrations", label: "Integrations", icon: Plug },
] as const;

function Settings() {
  const [tab, setTab] = useState<(typeof nav)[number]["id"]>("appearance");
  return (
    <div>
      <PageHeader breadcrumb="Account" title="Settings" description="Workspace, security and enterprise integrations." />
      <PageBody>
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-border/60 bg-card p-2">
            {nav.map(n => (
              <button key={n.id} onClick={() => setTab(n.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${tab === n.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
                <n.icon className="h-4 w-4" />
                <span className="truncate">{n.label}</span>
              </button>
            ))}
          </aside>

          <div className="min-w-0">
            {tab === "appearance" && <Appearance />}
            {tab === "notifications" && <NotificationSettings />}
            {tab === "api" && <ApiKeys />}
            {tab === "org" && <Org />}
            {tab === "team" && <Team />}
            {tab === "permissions" && <Roles />}
            {tab === "backup" && <Backup />}
            {tab === "integrations" && <Integrations />}
          </div>
        </div>
      </PageBody>
    </div>
  );
}

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6">
      <p className="text-sm font-semibold">{title}</p>
      {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Appearance() {
  const { theme, setTheme } = useTheme();
  const options = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ] as const;
  return (
    <div className="space-y-4">
      <Card title="Theme" desc="Applies across all workspace sessions.">
        <div className="grid gap-3 sm:grid-cols-3">
          {options.map(o => {
            const active = (o.id === "system" ? theme === "dark" ? false : false : theme === o.id);
            return (
              <button key={o.id} onClick={() => o.id !== "system" && setTheme(o.id)}
                className={`flex flex-col items-start gap-3 rounded-xl border-2 p-4 transition ${active ? "border-primary bg-primary/5" : "border-border/60 bg-muted/20 hover:border-primary/40"}`}>
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-background text-primary">
                  <o.icon className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">{o.label}</p>
                  <p className="text-[11px] text-muted-foreground">{o.id === "system" ? "Follow OS setting" : `Use ${o.id} theme`}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Card>
      <Card title="Language & region">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label className="text-xs">Language</Label><Input className="mt-1.5" defaultValue="English (US)" /></div>
          <div><Label className="text-xs">Timezone</Label><Input className="mt-1.5" defaultValue="Asia/Kolkata (GMT +5:30)" /></div>
        </div>
      </Card>
    </div>
  );
}

function NotificationSettings() {
  const rows = [
    { l: "Critical maintenance alerts", d: "Predicted failures within 30 days" },
    { l: "Compliance deadlines", d: "Expiring certificates, upcoming audits" },
    { l: "Weekly AI insights digest", d: "Every Monday at 08:00" },
    { l: "Document processing complete", d: "When bulk uploads finish indexing" },
    { l: "Team activity", d: "Shares, comments and mentions" },
  ];
  return (
    <Card title="Notification preferences" desc="Choose how you want to be reached.">
      <div className="divide-y divide-border/60 rounded-xl border border-border/60">
        {rows.map((r) => (
          <div key={r.l} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-6 px-4 py-3">
            <div>
              <p className="text-sm font-medium">{r.l}</p>
              <p className="text-xs text-muted-foreground">{r.d}</p>
            </div>
            <div className="flex items-center gap-2 text-xs"><Switch defaultChecked /> <span className="text-muted-foreground">Email</span></div>
            <div className="flex items-center gap-2 text-xs"><Switch defaultChecked /> <span className="text-muted-foreground">In-app</span></div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ApiKeys() {
  const keys = [
    { name: "Production ingestion", key: "ind_ai_prod_a1f9…3e2c", created: "Jun 12, 2026", last: "3 min ago" },
    { name: "Staging read-only", key: "ind_ai_stg_88b2…7d40", created: "Aug 02, 2026", last: "2h ago" },
    { name: "Copilot embed (public site)", key: "ind_ai_emb_44c6…9a18", created: "Sep 01, 2026", last: "Yesterday" },
  ];
  return (
    <Card title="API keys" desc="Programmatic access to your IndustrialMind workspace.">
      <div className="mb-4 flex justify-end"><Button className="gradient-primary text-white"><Plus className="h-4 w-4" /> New key</Button></div>
      <div className="divide-y divide-border/60 rounded-xl border border-border/60">
        {keys.map(k => (
          <div key={k.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{k.name}</p>
              <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{k.key}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Created {k.created} · Last used {k.last}</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon"><Copy className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Org() {
  return (
    <Card title="Organization" desc="Company-wide information visible to all members.">
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { l: "Organization name", v: "NorthGrid Energy Pvt. Ltd." },
          { l: "Industry", v: "Oil & Gas Refining" },
          { l: "Primary region", v: "Asia — South" },
          { l: "Plants under management", v: "12" },
          { l: "Employees", v: "~ 8,400" },
          { l: "Compliance officer", v: "P. Menon" },
        ].map(f => <div key={f.l}><Label className="text-xs">{f.l}</Label><Input className="mt-1.5" defaultValue={f.v} /></div>)}
      </div>
    </Card>
  );
}

function Team() {
  const members = [
    { name: "Priya Menon", email: "priya.menon@northgrid.io", role: "Admin", dept: "Reliability", init: "PM" },
    { name: "Rohan Iyer", email: "rohan.iyer@northgrid.io", role: "Reliability Lead", dept: "Reliability", init: "RI" },
    { name: "Sanjana Malhotra", email: "sanjana.m@northgrid.io", role: "Process Engineer", dept: "Process", init: "SM" },
    { name: "Abdul Karim", email: "abdul.karim@northgrid.io", role: "Operations", dept: "Operations", init: "AK" },
    { name: "Lin Chen", email: "lin.chen@northgrid.io", role: "HSE Officer", dept: "HSE", init: "LC" },
  ];
  return (
    <Card title="Team members" desc="Invite, manage, and role-assign your workspace.">
      <div className="mb-4 flex justify-end"><Button className="gradient-primary text-white"><Plus className="h-4 w-4" /> Invite member</Button></div>
      <div className="divide-y divide-border/60 rounded-xl border border-border/60">
        {members.map(m => (
          <div key={m.email} className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-4 px-4 py-3">
            <div className="grid h-9 w-9 place-items-center rounded-full gradient-primary text-xs font-semibold text-white">{m.init}</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{m.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{m.email}</p>
            </div>
            <Badge variant="secondary" className="border-0 bg-muted">{m.role}</Badge>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Roles() {
  const roles = [
    { name: "Admin", members: 3, desc: "Full access + billing + user management" },
    { name: "Engineer", members: 42, desc: "Read/write documents, run RCA, create work orders" },
    { name: "Operator", members: 128, desc: "Read documents, ask Copilot, log observations" },
    { name: "Auditor (read-only)", members: 6, desc: "View compliance reports & evidence trails" },
  ];
  return (
    <Card title="Roles & permissions">
      <div className="grid gap-3 sm:grid-cols-2">
        {roles.map(r => (
          <div key={r.name} className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{r.name}</p>
              <Badge variant="secondary" className="border-0 bg-primary/10 text-primary">{r.members} members</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
            <Button variant="ghost" size="sm" className="mt-3">Configure</Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Backup() {
  return (
    <Card title="Backup & retention" desc="Automated encrypted snapshots of your knowledge base.">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { l: "Last backup", v: "2h ago" },
          { l: "Retention window", v: "365 days" },
          { l: "Storage used", v: "1.42 TB" },
        ].map(s => (
          <div key={s.l} className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
            <p className="mt-1 text-lg font-bold">{s.v}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Button className="gradient-primary text-white">Run backup now</Button>
        <Button variant="outline">Export snapshot</Button>
      </div>
    </Card>
  );
}

function Integrations() {
  const items = [
    { name: "SAP PM", desc: "Plant maintenance module", on: true },
    { name: "IBM Maximo", desc: "EAM connector", on: true },
    { name: "OSIsoft PI", desc: "Historian telemetry", on: true },
    { name: "AVEVA Engage", desc: "Engineering data hub", on: false },
    { name: "SharePoint", desc: "Documents & drawings", on: true },
    { name: "Amazon S3", desc: "Cold document archive", on: true },
    { name: "Microsoft Teams", desc: "Chat + copilot embed", on: false },
    { name: "Slack", desc: "Alerts & digests", on: false },
  ];
  return (
    <Card title="Integrations" desc="Connect IndustrialMind to your existing enterprise systems.">
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(i => (
          <div key={i.name} className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl gradient-primary text-xs font-bold text-white">{i.name.split(" ")[0].slice(0,2).toUpperCase()}</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{i.name}</p>
                <p className="truncate text-xs text-muted-foreground">{i.desc}</p>
              </div>
            </div>
            <Switch defaultChecked={i.on} />
          </div>
        ))}
      </div>
    </Card>
  );
}
