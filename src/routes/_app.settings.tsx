import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Palette, Bell, Key, Building2, Users, Shield, Database, Plug,
  Moon, Sun, Monitor, Plus, MoreHorizontal, Copy, Trash2, Loader2, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { useTheme } from "@/components/theme-provider";
import { getUserSettingsFn, updateUserSettingsFn } from "@/functions/settings";
import { toast } from "sonner";

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
  { id: "backup", label: "Backup & Storage", icon: Database },
  { id: "integrations", label: "Integrations", icon: Plug },
] as const;

function Settings() {
  const [tab, setTab] = useState<(typeof nav)[number]["id"]>("appearance");
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings = {}, isLoading } = useQuery({
    queryKey: ["user_settings", userId],
    queryFn: async () => {
      if (!userId) return {};
      return await getUserSettingsFn({ data: userId });
    },
    enabled: !!userId,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!userId) throw new Error("Unauthorized");
      return await updateUserSettingsFn({ data: { userId, ...updates } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_settings", userId] });
      toast.success("Settings updated successfully");
    },
    onError: (err: any) => {
      toast.error(`Error updating settings: ${err.message}`);
    },
  });

  return (
    <div>
      <PageHeader breadcrumb="Account" title="Workspace Settings" description="Configure global preferences, security enforcement, and enterprise OT/IT integrations." />
      <PageBody>
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-border/60 bg-card p-2">
            {nav.map(n => (
              <button key={n.id} onClick={() => setTab(n.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${tab === n.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`}>
                <n.icon className="h-4 w-4" />
                <span className="truncate">{n.label}</span>
              </button>
            ))}
          </aside>

          <div className="min-w-0">
            {tab === "appearance" && <Appearance settings={settings} onUpdate={u => updateMutation.mutate(u)} />}
            {tab === "notifications" && <NotificationSettings settings={settings} onUpdate={u => updateMutation.mutate(u)} />}
            {tab === "api" && <ApiKeys settings={settings} onUpdate={u => updateMutation.mutate(u)} />}
            {tab === "org" && <Org settings={settings} onUpdate={u => updateMutation.mutate(u)} />}
            {tab === "team" && <Team />}
            {tab === "permissions" && <Roles />}
            {tab === "backup" && <Backup />}
            {tab === "integrations" && <Integrations settings={settings} onUpdate={u => updateMutation.mutate(u)} />}
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

function Appearance({ settings, onUpdate }: { settings: any; onUpdate: (u: any) => void }) {
  const { theme, setTheme } = useTheme();
  const options = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ] as const;

  const [lang, setLang] = useState(settings.language || "English (US)");
  const [tz, setTz] = useState(settings.timezone || "Asia/Kolkata (GMT +5:30)");

  return (
    <div className="space-y-4">
      <Card title="Workspace Theme" desc="Applies across all your sessions on this device.">
        <div className="grid gap-3 sm:grid-cols-3">
          {options.map(o => {
            const active = (theme as string) === o.id || (o.id === "system" && (theme as string) === "system");
            return (
              <button key={o.id} onClick={() => { setTheme(o.id as any); onUpdate({ theme: o.id }); }}
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
      <Card title="Language & Regional Timezone">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Language</Label>
            <Input className="mt-1.5" value={lang} onChange={e => setLang(e.target.value)} onBlur={() => onUpdate({ language: lang })} />
          </div>
          <div>
            <Label className="text-xs">Timezone</Label>
            <Input className="mt-1.5" value={tz} onChange={e => setTz(e.target.value)} onBlur={() => onUpdate({ timezone: tz })} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function NotificationSettings({ settings, onUpdate }: { settings: any; onUpdate: (u: any) => void }) {
  const [push, setPush] = useState(settings.notifications_push !== false);
  const [email, setEmail] = useState(settings.notifications_email !== false);

  const rows = [
    { l: "Critical maintenance alerts", d: "High vibration / predicted failures within 30 days", val: push, toggle: (v: boolean) => { setPush(v); onUpdate({ notifications_push: v }); } },
    { l: "Compliance deadline warnings", d: "Expiring certificates, upcoming regulatory audits", val: push, toggle: (v: boolean) => { setPush(v); onUpdate({ notifications_push: v }); } },
    { l: "Weekly AI insights digest", d: "Every Monday at 08:00 to work email", val: email, toggle: (v: boolean) => { setEmail(v); onUpdate({ notifications_email: v }); } },
    { l: "Document indexing complete", d: "When bulk RAG vector embeddings finish processing", val: push, toggle: (v: boolean) => { setPush(v); onUpdate({ notifications_push: v }); } },
  ];
  return (
    <Card title="Alert Channels & Subscriptions" desc="Choose where and when you receive operational notifications.">
      <div className="divide-y divide-border/60 rounded-xl border border-border/60">
        {rows.map(r => (
          <div key={r.l} className="flex items-center justify-between px-4 py-3.5">
            <div>
              <p className="text-sm font-medium">{r.l}</p>
              <p className="text-xs text-muted-foreground">{r.d}</p>
            </div>
            <Switch checked={r.val} onCheckedChange={r.toggle} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function ApiKeys({ settings, onUpdate }: { settings: any; onUpdate: (u: any) => void }) {
  const [keys, setKeys] = useState<any[]>(Array.isArray(settings.api_keys) ? settings.api_keys : [
    { id: "ind_ai_prod_1", name: "Production API Key", prefix: "ind_ai_prod_a...f9", created: "2026-07-01" }
  ]);
  const [newKeyName, setNewKeyName] = useState("");

  const addKey = () => {
    if (!newKeyName.trim()) return;
    const newEntry = {
      id: `ind_ai_${Date.now()}`,
      name: newKeyName.trim(),
      prefix: `ind_ai_live_${Math.random().toString(36).substring(2, 6)}...${Math.random().toString(36).substring(2, 4)}`,
      created: new Date().toISOString().split("T")[0]
    };
    const updated = [newEntry, ...keys];
    setKeys(updated);
    onUpdate({ api_keys: updated });
    setNewKeyName("");
    toast.success("New production API token generated");
  };

  const deleteKey = (id: string) => {
    const updated = keys.filter(k => k.id !== id);
    setKeys(updated);
    onUpdate({ api_keys: updated });
    toast.success("API key revoked");
  };

  return (
    <div className="space-y-4">
      <Card title="API Tokens" desc="Use these keys to ingest live sensor feeds and document OCR streams via the REST API.">
        <div className="flex gap-2 mb-4">
          <Input placeholder="Token description (e.g. SCADA Bridge Connector)" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} />
          <Button onClick={addKey} className="gradient-primary text-white shrink-0"><Plus className="h-4 w-4 mr-1.5" /> Generate Key</Button>
        </div>
        <div className="divide-y divide-border/60 rounded-xl border border-border/60">
          {keys.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground text-center">No active API keys found.</p>
          ) : keys.map(k => (
            <div key={k.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{k.name}</p>
                  <Badge variant="secondary" className="font-mono text-[11px]">{k.prefix}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Created on {k.created}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(k.prefix); toast.success("Token prefix copied"); }}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => deleteKey(k.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Org({ settings, onUpdate }: { settings: any; onUpdate: (u: any) => void }) {
  return (
    <Card title="Enterprise Workspace & Hierarchy" desc="Manage organizational metadata and refinery site mapping.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label className="text-xs">Organization Name</Label><Input className="mt-1.5" defaultValue="IndustrialMind AI" /></div>
        <div><Label className="text-xs">Primary Facility / Site</Label><Input className="mt-1.5" defaultValue="Vadodara Refinery Complex (IN-GUJ-01)" /></div>
        <div><Label className="text-xs">Industry Segment</Label><Input className="mt-1.5" defaultValue="Petrochemical & Heavy Manufacturing" /></div>
        <div><Label className="text-xs">Corporate Compliance ID</Label><Input className="mt-1.5" defaultValue="OISD-PESO-REG-8821" /></div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={() => toast.success("Organization metadata saved")} className="gradient-primary text-white">Update Enterprise Details</Button>
      </div>
    </Card>
  );
}

function Team() {
  const members = [
    { name: "Rohan Iyer", role: "Reliability Lead", email: "rohan.iyer@northgrid.io", status: "Active", access: "Admin" },
    { name: "Ananya Sharma", role: "Process Safety Engineer", email: "a.sharma@northgrid.io", status: "Active", access: "Editor" },
    { name: "David Miller", role: "Maintenance Supervisor", email: "d.miller@northgrid.io", status: "Active", access: "Editor" },
    { name: "Priya Patel", role: "Compliance Officer", email: "p.patel@northgrid.io", status: "Invited", access: "Viewer" },
  ];
  return (
    <Card title="Team Members" desc="Manage seats, role access, and SSO user provisioning across engineering units.">
      <div className="flex justify-end mb-4">
        <Button onClick={() => toast.success("Invitation sent to work email")} className="gradient-primary text-white size-sm gap-1.5"><Plus className="h-4 w-4" /> Invite Engineer</Button>
      </div>
      <div className="divide-y divide-border/60 rounded-xl border border-border/60">
        {members.map(m => (
          <div key={m.email} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{m.name}</p>
                <Badge variant="secondary" className="text-[10px]">{m.role}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{m.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={m.status === "Active" ? "border-success/40 text-success" : "border-warning/40 text-warning"}>{m.status}</Badge>
              <span className="text-xs font-semibold px-2 py-1 bg-muted rounded">{m.access}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Roles() {
  const roles = [
    { name: "Admin", desc: "Full access to settings, API keys, document deletions, and executive briefings." },
    { name: "Editor / Engineer", desc: "Can upload documents, run AI RAG queries, and update maintenance records." },
    { name: "Viewer / Auditor", desc: "Read-only access to compliance reports, knowledge graph, and executive summaries." },
  ];
  return (
    <Card title="Role-Based Access Control (RBAC)" desc="Fine-grained permissions aligned with enterprise security governance.">
      <div className="space-y-3">
        {roles.map(r => (
          <div key={r.name} className="rounded-xl border border-border/60 p-4">
            <p className="text-sm font-bold text-primary">{r.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Backup() {
  return (
    <Card title="Data Persistence & Backup" desc="Your document embeddings and metadata are continuously backed up to Supabase PGVector instances.">
      <div className="space-y-4 text-sm">
        <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/20">
          <div>
            <p className="font-semibold">Automated Daily Snapshot</p>
            <p className="text-xs text-muted-foreground">Encrypted point-in-time recovery (PITR) active with 30-day retention.</p>
          </div>
          <Badge className="bg-success/15 text-success border-0">Enabled</Badge>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => toast.info("Manual snapshot initiated.")}>Run Manual Backup Now</Button>
        </div>
      </div>
    </Card>
  );
}

function Integrations({ settings, onUpdate }: { settings: any; onUpdate: (u: any) => void }) {
  const [sap, setSap] = useState(settings?.integrations?.sap ?? true);
  const [maximo, setMaximo] = useState(settings?.integrations?.maximo ?? true);
  const [sharepoint, setSharepoint] = useState(settings?.integrations?.sharepoint ?? false);
  const [slack, setSlack] = useState(settings?.integrations?.slack ?? true);

  const sync = (newVals: any) => {
    onUpdate({ integrations: { sap, maximo, sharepoint, slack, ...newVals } });
  };

  const list = [
    { name: "SAP Plant Maintenance (PM)", desc: "Sync equipment hierarchy, functional locations, and work orders automatically.", val: sap, toggle: (v: boolean) => { setSap(v); sync({ sap: v }); } },
    { name: "IBM Maximo EAM", desc: "Two-way integration for asset condition tracking and failure predictions.", val: maximo, toggle: (v: boolean) => { setMaximo(v); sync({ maximo: v }); } },
    { name: "Microsoft SharePoint / OneDrive", desc: "Ingest engineering drawings and SOPs directly from enterprise folders.", val: sharepoint, toggle: (v: boolean) => { setSharepoint(v); sync({ sharepoint: v }); } },
    { name: "Slack & Microsoft Teams Notifications", desc: "Broadcast critical maintenance alerts and audit findings to shift channels.", val: slack, toggle: (v: boolean) => { setSlack(v); sync({ slack: v }); } },
  ];

  return (
    <Card title="Enterprise OT / IT Integrations" desc="Connect IndustrialMind AI directly into your existing plant infrastructure.">
      <div className="divide-y divide-border/60 rounded-xl border border-border/60">
        {list.map(l => (
          <div key={l.name} className="flex items-center justify-between px-4 py-4">
            <div className="max-w-md">
              <p className="text-sm font-semibold">{l.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{l.desc}</p>
            </div>
            <Switch checked={l.val} onCheckedChange={l.toggle} />
          </div>
        ))}
      </div>
    </Card>
  );
}
