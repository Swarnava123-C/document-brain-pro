import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles, Send, Paperclip, Copy, Share2, Download, RefreshCw, Trash2,
  Pin, Search, Plus, FileText, ExternalLink, ThumbsUp, ThumbsDown,
  Wrench, ShieldCheck, FileSearch, TrendingUp, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { conversations, suggestedPrompts } from "@/lib/mock-data";

const promptIcons: Record<string, any> = { Wrench, ShieldCheck, FileSearch, TrendingUp };

export const Route = createFileRoute("/_app/copilot")({
  head: () => ({ meta: [{ title: "AI Copilot — IndustrialMind AI" }] }),
  component: Copilot,
});

function Copilot() {
  const [activeChat, setActiveChat] = useState<string | null>("c1");
  const [input, setInput] = useState("");
  const started = activeChat !== null;

  return (
    <div className="grid h-[calc(100vh-4rem)] grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
      {/* Conversation sidebar */}
      <aside className="hidden flex-col border-r border-border/60 bg-muted/20 md:flex">
        <div className="border-b border-border/60 p-3">
          <Button className="w-full justify-start gradient-primary text-white shadow-elegant" onClick={() => setActiveChat(null)}>
            <Plus className="h-4 w-4" /> New chat
          </Button>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search chats" className="h-9 pl-9 text-sm" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="px-3 py-3">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pinned</p>
            {conversations.filter(c => c.pinned).map((c) => (
              <ChatItem key={c.id} c={c} active={activeChat === c.id} onClick={() => setActiveChat(c.id)} />
            ))}
            <p className="mb-2 mt-4 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recent</p>
            {conversations.filter(c => !c.pinned).map((c) => (
              <ChatItem key={c.id} c={c} active={activeChat === c.id} onClick={() => setActiveChat(c.id)} />
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Main chat */}
      <section className="flex min-w-0 flex-col">
        {!started ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 gradient-mesh">
            <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl gradient-primary shadow-elegant animate-float">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-center text-3xl font-bold tracking-tight text-foreground">How can I help, Rohan?</h1>
            <p className="mt-2 max-w-xl text-center text-sm text-muted-foreground">Ask anything about your plant — from HAZOP interpretations to failure diagnostics. I'll cite every source.</p>

            <div className="mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-2">
              {suggestedPrompts.map((p) => {
                const Icon = promptIcons[p.icon] ?? Sparkles;
                return (
                  <button key={p.title} onClick={() => setActiveChat("new")} className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:gradient-primary group-hover:text-white">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{p.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{p.desc}</p>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                  </button>
                );
              })}
            </div>

            <div className="mt-8 w-full max-w-3xl">
              <ChatComposer value={input} onChange={setInput} onSend={() => setActiveChat("new")} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border/60 bg-background/60 px-6 py-3 backdrop-blur">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">Root cause — HX-88 tube leak</p>
                <p className="text-[11px] text-muted-foreground">6 messages · Cited 12 sources</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon"><Pin className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><Share2 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="mx-auto max-w-3xl px-6 py-8">
                <UserBubble text="Why is HX-88 showing recurring temperature anomalies over the last 30 days? Cross-reference with vibration data and past inspection reports." />
                <AssistantBubble />
                <UserBubble text="What's the recommended inspection procedure?" />
                <AssistantShort />
              </div>
            </ScrollArea>

            <div className="border-t border-border/60 bg-background/80 p-4 backdrop-blur">
              <div className="mx-auto max-w-3xl">
                <ChatComposer value={input} onChange={setInput} onSend={() => setInput("")} />
                <p className="mt-2 text-center text-[10px] text-muted-foreground">IndustrialMind AI cites every source. Verify critical decisions against original documents.</p>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function ChatItem({ c, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`mb-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition ${active ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted"}`}>
      {c.pinned && <Pin className="h-3 w-3 shrink-0 text-primary" />}
      <span className="flex-1 truncate text-[13px]">{c.title}</span>
    </button>
  );
}

function ChatComposer({ value, onChange, onSend }: { value: string; onChange: (v: string) => void; onSend: () => void }) {
  return (
    <div className="relative rounded-2xl border border-border/70 bg-card shadow-card focus-within:border-primary/60 focus-within:shadow-elegant">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder="Ask about assets, SOPs, incidents, drawings…"
        className="min-h-14 resize-none border-0 bg-transparent px-4 py-3 pr-24 text-sm shadow-none focus-visible:ring-0"
      />
      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8"><Paperclip className="h-4 w-4" /></Button>
        <Button onClick={onSend} size="icon" className="h-8 w-8 gradient-primary text-white shadow-elegant">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="mb-6 flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-md gradient-primary px-4 py-2.5 text-sm text-white shadow-elegant">{text}</div>
    </div>
  );
}

function AssistantBubble() {
  return (
    <div className="mb-6 flex gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl gradient-primary text-white shadow-elegant">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-md border border-border/60 bg-card p-5 text-sm leading-relaxed text-foreground">
          <p>Analyzing sensor telemetry, inspection records, and maintenance history for <strong>HX-88 (Shell &amp; Tube Exchanger, Heat Recovery)</strong>.</p>
          <p className="mt-3">The recurring anomalies are consistent with <strong>early-stage tube bundle degradation</strong>. Three signals correlate:</p>
          <ol className="mt-3 space-y-1.5 pl-5 [list-style:decimal]">
            <li>Shell-side outlet temperature drifting upward by 4.2°C over 30 days</li>
            <li>Tube-side ΔP increase of 0.18 bar, indicating partial fouling or micro-leak</li>
            <li>Vibration signature on bundle support showing 2× harmonic at 47 Hz</li>
          </ol>
          <p className="mt-3">A near-identical pattern was recorded on <strong>HX-42 (2024)</strong> which resulted in a tube-side leak 27 days after signature onset. Predicted RUL for HX-88: <span className="rounded-md bg-warning/15 px-1.5 py-0.5 font-semibold text-warning">~21 days</span>.</p>

          <div className="mt-4 rounded-xl border border-border/60 bg-muted/40 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cited sources · 4</p>
            <div className="mt-2 space-y-1.5">
              {[
                { name: "Inspection Report — HX-88 Q2 2026", page: "p. 14" },
                { name: "RCA-2024-011 — HX-42 Tube Leak", page: "p. 3-5" },
                { name: "Vibration Telemetry — Sep 01–Sep 07", page: "PI Historian" },
                { name: "OEM Manual — Alfa Laval S-Series", page: "§ 6.3" },
              ].map((s) => (
                <div key={s.name} className="flex items-center gap-2 text-xs">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate text-foreground">{s.name}</span>
                  <span className="text-muted-foreground">· {s.page}</span>
                  <ExternalLink className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Badge className="border-success/20 bg-success/10 text-success">Confidence 94%</Badge>
            <Badge variant="secondary">Reliability</Badge>
            <Badge variant="secondary">Heat Recovery</Badge>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1 text-muted-foreground">
          <Button variant="ghost" size="icon" className="h-7 w-7"><Copy className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7"><RefreshCw className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7"><ThumbsUp className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7"><ThumbsDown className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
    </div>
  );
}

function AssistantShort() {
  return (
    <div className="mb-6 flex gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl gradient-primary text-white shadow-elegant">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-md border border-border/60 bg-card p-5 text-sm text-foreground">
          <p>Recommended inspection window: <strong>Sep 12–14, 2026</strong> (aligns with scheduled Unit 3 slow-down).</p>
          <ul className="mt-3 space-y-1.5 pl-5 [list-style:disc] text-muted-foreground">
            <li>Isolate HX-88, drain and depressurize per SOP-HX-05</li>
            <li>Perform IRIS / eddy-current inspection on tube bundle (focus rows 12–24)</li>
            <li>Hydrotest at 1.5× MAWP; document per API-579 FFS assessment</li>
            <li>Replace suspect tubes; re-baseline vibration signature before restart</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
